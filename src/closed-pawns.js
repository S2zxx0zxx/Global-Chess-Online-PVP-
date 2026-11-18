// With all pawn moves blocked, only the kings can move. A legal pawn capture
// by either king opens the graph, so this proof cannot decide that position.
export function closedPawnPositionCannotMate(game, winner) {
  if (game.fen().split(' ')[3] !== '-') return false;
  const board = game.board().flat();
  const kings = [board.findIndex(piece => piece?.type === 'k' && piece.color === 'w'),
    board.findIndex(piece => piece?.type === 'k' && piece.color === 'b')];
  const attacks = [new Uint8Array(64), new Uint8Array(64)];
  for (let square = 0; square < 64; square++) {
    const pawn = board[square];
    if (pawn?.type !== 'p') continue;
    const side = pawn.color === 'w' ? 0 : 1;
    const ahead = square + (side === 0 ? -8 : 8);
    if (board[ahead]?.type !== 'p') return false;
    for (const fileStep of [-1, 1]) {
      const file = square % 8 + fileStep;
      if (file < 0 || file > 7) continue;
      const target = ahead + fileStep;
      if (board[target]?.type === 'p' && board[target].color !== pawn.color) return false;
      attacks[side][target] = 1;
    }
  }

  const queue = [];
  const visited = new Uint8Array(8192);
  function enqueue(white, black, turn) {
    const state = (white * 64 + black) * 2 + turn;
    if (visited[state]) return;
    visited[state] = 1;
    queue.push(state);
  }
  const winningSide = winner === 'w' ? 0 : 1;
  enqueue(...kings, game.turn() === 'w' ? 0 : 1);
  for (let index = 0; index < queue.length; index++) {
    const state = queue[index];
    const white = state >> 7;
    const black = (state >> 1) & 63;
    const turn = state & 1;
    const from = turn === 0 ? white : black;
    const opponent = turn === 0 ? black : white;
    const enemyAttacks = attacks[1 - turn];
    const color = turn === 0 ? 'w' : 'b';
    let hasMove = false;
    for (let rank = Math.max(0, (from >> 3) - 1); rank <= Math.min(7, (from >> 3) + 1); rank++) {
      for (let file = Math.max(0, from % 8 - 1); file <= Math.min(7, from % 8 + 1); file++) {
        const to = rank * 8 + file;
        if (to === from || enemyAttacks[to] ||
            (Math.abs(rank - (opponent >> 3)) <= 1 && Math.abs(file - opponent % 8) <= 1)) continue;
        const occupant = board[to];
        if (occupant?.type === 'p') {
          if (occupant.color !== color) return false;
          continue;
        }
        hasMove = true;
        if (turn === 0) enqueue(to, black, 1);
        else enqueue(white, to, 0);
      }
    }
    if (!hasMove && enemyAttacks[from] && turn !== winningSide) return false;
  }
  return true;
}
