import { Chess } from 'chess.js';

const values = { p:100, n:320, b:330, r:500, q:900, k:0 };
const levels = {easy:1, standard:2, hard:3};

function evaluate(game, side) {
  return game.board().flat().reduce((total, piece) => {
    if (!piece) return total;
    const file = piece.square.charCodeAt(0) - 97;
    const rank = Number(piece.square[1]) - 1;
    const center = 7 - Math.abs(3.5 - file) - Math.abs(3.5 - rank);
    const position = piece.type === 'k' ? 0 : center * 3;
    return total + (values[piece.type] + position) * (piece.color === side ? 1 : -1);
  }, 0);
}

function priority(move) {
  return (move.captured ? 10 * values[move.captured] - values[move.piece] : 0) +
    (move.promotion ? values[move.promotion] : 0);
}

export function chooseComputerMove(fen, difficulty, {budgetMs = 1200, now = () => performance.now(), maxNodes = 100000} = {}) {
  const game = new Chess(fen);
  const root = game.moves({verbose:true}).sort((a,b) => priority(b) - priority(a));
  if (!root.length) return null;
  const budget = Number.isFinite(budgetMs) ? Math.max(20,Math.min(3000,budgetMs)) : 1200;
  const limit = Number.isSafeInteger(maxNodes) ? Math.max(1,Math.min(250000,maxNodes)) : 100000;
  const deadline = now() + budget;
  let visited=0;
  const exhausted = Symbol('budget exhausted');
  function search(depth, alpha, beta, ply) {
    if (++visited > limit || now() >= deadline) throw exhausted;
    const moves = game.moves({verbose:true});
    if (!moves.length) return game.inCheck() ? -100000 + ply : 0;
    if (game.isInsufficientMaterial() || Number(game.fen().split(' ')[4]) >= 150) return 0;
    if (!depth) return evaluate(game, game.turn());
    let best = -Infinity;
    for (const move of moves.sort((a,b) => priority(b) - priority(a))) {
      game.move(move);
      let score;
      try { score = -search(depth-1,-beta,-alpha,ply+1); }
      finally { game.undo(); } // A timeout must never leave a move on the search board.
      best = Math.max(best,score);
      alpha = Math.max(alpha,score);
      if (alpha >= beta) break;
    }
    return best;
  }
  const maxDepth = Object.hasOwn(levels,difficulty) ? levels[difficulty] : levels.standard;
  let best = root[0];
  for (let depth = 1; depth <= maxDepth; depth++) {
    try {
      let alpha = -Infinity;
      let candidate = best;
      const ordered = [best, ...root.filter(move => move !== best)];
      for (const move of ordered) {
        game.move(move);
        let score;
        try { score = -search(depth-1,-Infinity,-alpha,1); }
        finally { game.undo(); }
        if (score > alpha) {
          alpha = score;
          candidate = move;
        }
      }
      best = candidate;
    } catch (error) {
      if (error !== exhausted) throw error;
      break;
    }
  }
  const {from,to,promotion} = best;
  return {from,to,promotion};
}
