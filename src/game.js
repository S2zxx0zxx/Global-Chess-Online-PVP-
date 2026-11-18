import { validClock } from './clock.js';
import { Chess } from 'chess.js';

export function restoreGame(raw) {
  const game = new Chess();
  let mode = 'local';
  let drawClaim;
  let clock = null;
  if (raw) {
    const save = JSON.parse(raw);
    if (save.version !== 1 || !Array.isArray(save.moves) || !['local', 'computer'].includes(save.mode)) {
      throw new Error('Unsupported match save');
    }
    mode = save.mode;
    if (save.clock !== undefined) {
      if (!validClock(save.clock)) throw new Error('Invalid saved clock');
      clock = save.clock;
    }
    for (const move of save.moves) {
      if (result(game)) throw new Error('Move after match ended');
      game.move(move);
    }
    if (save.drawClaim !== undefined) {
      if (!claimableDraw(game) || save.drawClaim !== claimableDraw(game)) throw new Error('Invalid saved draw claim');
      drawClaim = save.drawClaim;
    }
  }
  return { game, mode, drawClaim, clock };
}

export function serializeGame(game, mode, drawClaim, clock) {
  const moves = game.history({ verbose: true }).map(({from, to, promotion}) => ({from, to, promotion}));
  return JSON.stringify({ version: 1, mode, moves, drawClaim, clock });
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
