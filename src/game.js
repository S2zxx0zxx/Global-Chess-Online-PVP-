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
  if (raw) {
    const save = JSON.parse(raw);
    if (save.version !== 1 || !Array.isArray(save.moves) || !['local', 'computer'].includes(save.mode)) {
      throw new Error('Unsupported match save');
    }
    mode = save.mode;
    if (save.difficulty === 'easy') difficulty = 'easy';
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
      if (result(game)) throw new Error('Move after match ended');
      game.move(move);
    }
    if (save.drawClaim !== undefined) {
      const reason = save.claimMove ? intendedDraw(game, save.claimMove) : claimableDraw(game);
      if (!reason || save.drawClaim !== reason) throw new Error('Invalid saved draw claim');
      claimMove = save.claimMove;
      drawClaim = save.drawClaim;
    }
  }
  return { game, mode, drawClaim, clock, difficulty, claimMove, preset };
}

export function serializeGame(game, mode, drawClaim, clock, difficulty, claimMove, preset) {
  const moves = game.history({ verbose: true }).map(({from, to, promotion}) => ({from, to, promotion}));
  return JSON.stringify({ version: 1, mode, moves, drawClaim, clock, difficulty, claimMove, preset });
}

export function result(game) {
  if (game.isCheckmate()) return game.turn() === 'w' ? 'Black wins by checkmate' : 'White wins by checkmate';
  if (game.isStalemate()) return 'Draw by stalemate';
  if (game.isInsufficientMaterial()) return 'Draw by insufficient material';
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
  return !attacking.length || sameColorBishops || game.isInsufficientMaterial()
    ? 'Draw on time by insufficient mating material'
    : (winner === 'w' ? 'White' : 'Black') + ' wins on time';
}
