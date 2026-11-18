import { Chess } from 'chess.js';
const values = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
function score(game) {
  if (game.isCheckmate()) return game.turn() === 'w' ? 100000 : -100000;
  if (game.isDraw()) return 0;
  return game.board().flat().reduce((total, piece) =>
    piece ? total + values[piece.type] * (piece.color === 'b' ? 1 : -1) : total, 0);
}
self.onmessage = ({data: {fen, difficulty}}) => {
  const game = new Chess(fen);
  let best;
  let bestScore = -Infinity;
  for (const candidate of game.moves({verbose: true})) {
    game.move(candidate);
    let worst = score(game);
    const replies = difficulty === 'easy' || game.isGameOver() ? [] : game.moves({verbose: true});
    if (replies.length) worst = Infinity;
    for (const reply of replies) {
      game.move(reply);
      worst = Math.min(worst, score(game));
      game.undo();
    }
    game.undo();
    if (worst > bestScore) {
      bestScore = worst;
      best = candidate;
    }
  }
  self.postMessage(best && {from: best.from, to: best.to, promotion: best.promotion});
};
