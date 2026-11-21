import { matingPossibility } from './mate-solver.js';
import { closedPawnPositionCannotMate } from './closed-pawns.js';
import { presets, validClock } from './clock.js';
import { Chess } from 'chess.js';

export function restoreGame(raw) {
  const game = new Chess();
  let mode = 'local';
  let drawClaim;
  let claimMove;
  let clock = null;
  let difficulty = 'standard';
  let preset;
  let playerSide = 'w';
  let resignedBy;
  let paused = false;
  if (raw) {
    const save = JSON.parse(raw);
    if (save.version !== 1 || !Array.isArray(save.moves) || !['local', 'computer'].includes(save.mode)) {
      throw new Error('Unsupported match save');
    }
    mode = save.mode;
    if (save.playerSide !== undefined && !['w','b'].includes(save.playerSide)) throw new Error('Invalid saved player side');
    playerSide = save.playerSide ?? 'w';
    if (save.resignedBy !== undefined && !['w','b'].includes(save.resignedBy)) throw new Error('Invalid resignation side');
    if (save.paused !== undefined && typeof save.paused !== 'boolean') throw new Error('Invalid pause state');
    paused = save.paused === true;
    if (['easy', 'standard', 'hard'].includes(save.difficulty)) difficulty = save.difficulty;
    if (save.clock !== undefined) {
      if (!validClock(save.clock)) throw new Error('Invalid saved clock');
      clock = save.clock;
    }
    if (save.preset !== undefined) {
      if (!Object.hasOwn(presets, save.preset) ||
          ((save.preset === 'untimed') !== (clock === null)) ||
          (clock && Math.max(clock.w, clock.b) > presets[save.preset])) {
        throw new Error('Invalid saved time control');
      }
      preset = save.preset;
    }
    for (const move of save.moves) {
      const outcome = result(game);
      // Older saves could continue past a closed pawn position.
      if (outcome && outcome !== 'Draw by dead position') throw new Error('Move after match ended');
      game.move(move);
    }
    if (paused && (result(game) || save.resignedBy !== undefined || save.drawClaim !== undefined)) throw new Error('Cannot pause completed match');
    if (save.resignedBy !== undefined) {
      if (result(game) || save.drawClaim !== undefined) throw new Error('Resignation after completed match');
      resignedBy = save.resignedBy;
    }
    if (save.drawClaim !== undefined) {
      const reason = save.claimMove ? intendedDraw(game, save.claimMove) : claimableDraw(game);
      if (!reason || save.drawClaim !== reason) throw new Error('Invalid saved draw claim');
      claimMove = save.claimMove;
      drawClaim = save.drawClaim;
    }
  }
  return { game, mode, drawClaim, clock, difficulty, claimMove, preset, playerSide, resignedBy, paused };
}

export function serializeGame(game, mode, drawClaim, clock, difficulty, claimMove, preset, playerSide = 'w', resignedBy, paused = false) {
  const moves = game.history({ verbose: true }).map(({from, to, promotion}) => ({from, to, promotion}));
  return JSON.stringify({ version: 1, mode, moves, drawClaim, clock, difficulty, claimMove, preset, playerSide, resignedBy, paused });
}

export function savedMatchOutcome(state) {
  if (!state || !state.game) return null;
  if (state.drawClaim) return 'Draw by ' + state.drawClaim;
  if (state.resignedBy) return (state.resignedBy === 'w' ? 'Black' : 'White') + ' wins by resignation';
  return result(state.game) ?? (state.clock?.[state.game.turn()] === 0
    ? timeoutResult(state.game, state.game.turn()) : null);
}

export function result(game) {
  if (game.isCheckmate()) return game.turn() === 'w' ? 'Black wins by checkmate' : 'White wins by checkmate';
  if (game.isStalemate()) return 'Draw by stalemate';
  if (game.isInsufficientMaterial()) return 'Draw by insufficient material';
  if (closedPawnPositionCannotMate(game)) return 'Draw by dead position';
  if (Number(game.fen().split(' ')[4]) >= 150) return 'Draw by 75-move rule';
  if (game.isThreefoldRepetition() && repetitionCount(game) >= 5) return 'Draw by fivefold repetition';
  return null;
}

function repetitionCount(game) {
  const key = fen => fen.split(' ').slice(0,4).join(' ');
  const position = key(game.fen());
  const history = game.history({verbose:true});
  return Number(key(history[0].before) === position) +
    history.filter(move => key(move.after) === position).length;
}

export function claimableDraw(game) {
  if (result(game)) return null;
  if (game.isThreefoldRepetition()) return 'threefold repetition';
  if (game.isDrawByFiftyMoves()) return '50-move rule';
  return null;
}


export function intendedDraw(game, move) {
  if (result(game)) return null;
  if (!move || typeof move !== 'object' ||
      typeof move.from !== 'string' || typeof move.to !== 'string') return null;
  try { game.move({from:move.from,to:move.to,promotion:move.promotion}); } catch { return null; }
  try {
    if (game.isCheckmate()) return null;
    if (game.isThreefoldRepetition()) return 'threefold repetition';
    if (game.isDrawByFiftyMoves()) return '50-move rule';
    return null;
  } finally {
    game.undo();
  }
}

export function timeoutResult(game, expiredSide) {
  const winner = expiredSide === 'w' ? 'b' : 'w';
  const material = game.board().flat().filter(piece => piece && piece.type !== 'k');
  const attacking = material.filter(piece => piece.color === winner);
  const bishopsOnly = attacking.length > 0 && attacking.every(piece => piece.type === 'b');
  const squareColor = ({square}) => (square.charCodeAt(0) + Number(square[1])) % 2;
  const sameColorBishops = bishopsOnly && material.every(piece =>
    piece.type === 'b' && squareColor(piece) === squareColor(attacking[0]));
  const closedPawnDraw = material.length > 0 && material.every(piece => piece.type === 'p') &&
    closedPawnPositionCannotMate(game, winner);
  if (!attacking.length || sameColorBishops || game.isInsufficientMaterial() || closedPawnDraw) {
    return 'Draw on time by insufficient mating material';
  }
  if (matingPossibility(game,winner) === false) return 'Draw on time by impossible checkmate';
  return (winner === 'w' ? 'White' : 'Black') + ' wins on time';
}
