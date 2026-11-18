const lesson = (id,title,fen,prompt,answer,explanation) => ({id,title,fen,prompt,answer,explanation});

export const extraLessons = [
  lesson('pawn-capture','Pawn capture','4k3/8/8/3n4/4P3/8/8/4K3 w - - 0 1','Capture the knight diagonally with the white pawn.','exd5','Pawns move straight ahead and capture one square diagonally.'),
  lesson('knight-jump','Jump with a knight','4k3/8/8/8/8/8/PPPPPPPP/1N2K3 w - - 0 1','Develop the b1 knight to c3 over the pawn line.','Nc3','A knight jumps over pieces in an L shape.'),
  lesson('bishop-diagonal','Bishop diagonals','4k3/8/5n2/8/8/8/8/B3K3 w - - 0 1','Capture the knight from a1 in one move.','Bxf6','Bishops stay on their starting square color.'),
  lesson('rook-file','Rook files','4k3/p7/8/8/8/8/8/R3K3 w - - 0 1','Capture the pawn up the a-file.','Rxa7','A rook travels along a file or rank.'),
  lesson('queen-diagonal','Queen movement','4k3/8/8/4n3/8/8/8/Q3K3 w - - 0 1','Use the queen’s diagonal movement to capture the knight.','Qxe5+','The queen combines rook and bishop movement.'),
  lesson('king-safety','Escape check','4k3/8/8/8/8/8/4r3/4K3 w - - 0 1','Capture the undefended checking rook with your king.','Kxe2','A king can capture a checker when the destination is safe.'),
  lesson('block-check','Block a check','k3r3/8/8/8/1B6/8/8/4K3 w - - 0 1','Block the rook’s check by moving the bishop to e7.','Be7','Interposing a piece can stop a line check.'),
  lesson('queen-promotion','Promote a pawn','7k/4P3/8/8/8/8/8/K7 w - - 0 1','Promote the e-pawn to a queen.','e8=Q+','A pawn that reaches the final rank can become a queen, rook, bishop, or knight.'),
  lesson('black-pawn','Move a black pawn','4k3/3p4/8/8/8/8/8/4K3 b - - 0 1','Advance the black d-pawn two squares.','d5','Black pawns move toward rank 1 and can advance two squares from their starting rank.'),
];

const tactic = (id,title,fen,answer,explanation) =>
  ({id,title,fen,prompt:title,answer,explanation});

export const extraPuzzles = [
  tactic('rook-queen-file','Capture the queen with your rook','6k1/8/q7/8/8/8/8/R5K1 w - - 0 1','Rxa6','The open a-file gives the rook a direct capture.'),
  tactic('bishop-queen-diagonal','Capture the queen with your bishop','7k/8/5q2/8/8/8/8/B5K1 w - - 0 1','Bxf6+','The a1–h8 diagonal lines the bishop up with queen and king.'),
  tactic('knight-queen','Jump to capture the queen','6k1/8/8/3q4/8/4N3/8/6K1 w - - 0 1','Nxd5','The knight reaches d5 in one jump.'),
  tactic('queen-takes-rook','Capture the rook using a diagonal','8/7k/8/8/3r4/8/8/Q5K1 w - - 0 1','Qxd4','The queen can capture along the a1–d4 diagonal.'),
  tactic('black-rook-queen','As Black, capture the queen with your rook','r5k1/8/8/8/8/Q7/8/6K1 b - - 0 1','Rxa3','Black’s rook can travel straight down the open a-file.'),
  tactic('black-knight-queen','As Black, jump to capture the queen','6k1/8/4n3/8/3Q4/8/8/6K1 b - - 0 1','Nxd4','The knight captures two ranks down and one file across.'),
  tactic('capture-checker-rook','Capture the opposing rook with your pinned rook','k3r3/8/8/8/8/8/4R3/4K3 w - - 0 1','Rxe8+','The rook stays on the e-file, removes the pin, and gives check.'),
  tactic('capture-checker-king','Escape check by capturing the loose bishop','7k/8/8/8/8/8/3b4/4K3 w - - 0 1','Kxd2','The bishop checks from d2 but the square is unprotected.'),
  tactic('block-rook-check','Block the rook check with your queen on e2','k3r3/8/8/8/8/8/8/3QK3 w - - 0 1','Qe2','The queen interrupts the e-file check.'),
  tactic('knight-block','Block the rook check with your knight on e2','k3r3/8/8/8/8/8/8/2N1K3 w - - 0 1','Ne2','A knight jump can interpose on the checking file.'),
  tactic('knight-fork','Fork the king and queen with a knight on f7','7k/8/7q/4N3/8/8/8/K7 w - - 0 1','Nf7+','The knight checks h8 and attacks h6.'),
  tactic('pawn-fork','Advance the d-pawn to attack two pieces','7k/8/2r1n3/8/3P4/8/8/K7 w - - 0 1','d5','The pawn on d5 attacks the rook on c6 and knight on e6.'),
  tactic('rook-skewer','Check the king and line up the queen behind it','8/8/8/3k3q/8/8/8/R5K1 w - - 0 1','Ra5+','A rook check on the fifth rank exposes the queen once the king moves.'),
  tactic('promote-with-check','Promote on a8 with check','7k/P7/8/8/8/8/8/6K1 w - - 0 1','a8=Q+','The new queen checks across the eighth rank.'),
  tactic('rook-underpromotion','Promote to a rook with check','k7/6P1/8/8/8/8/8/6K1 w - - 0 1','g8=R+','A rook promotion checks across rank eight.'),
  tactic('knight-underpromotion','Promote to a knight and give check','8/4P1k1/8/8/8/8/8/K7 w - - 0 1','e8=N+','A knight on e8 attacks g7 immediately.'),
  tactic('bishop-underpromotion','Promote to a bishop and give check','8/4P3/6k1/8/8/8/8/K7 w - - 0 1','e8=B+','The new bishop checks along the e8–g6 diagonal.'),
  tactic('black-promotion','Promote Black’s pawn to a queen with check','k7/8/8/8/8/8/1p6/7K b - - 0 1','b1=Q+','Black promotes on the first rank and checks along it.'),
  tactic('promotion-capture','Capture the rook and promote to a queen','r6k/1P6/8/8/8/8/8/6K1 w - - 0 1','bxa8=Q+','A pawn can capture on its promotion move.'),
  tactic('castle-long','Castle queenside to move your rook to d1','4k3/8/8/8/8/8/8/R3K3 w Q - 0 1','O-O-O','The king lands on c1 and the rook lands on d1.'),
  tactic('black-castle','Castle kingside as Black','4k2r/8/8/8/8/8/8/4K3 b k - 0 1','O-O','The black king lands on g8 and rook on f8.'),
  tactic('black-en-passant','As Black, capture en passant','4k3/8/8/8/3Pp3/8/8/4K3 b - d3 0 1','exd3','The black pawn lands on d3 and removes the white pawn from d4.'),
  tactic('queen-corner-mate','Deliver mate with your queen on g7','7k/8/5KQ1/8/8/8/8/8 w - - 0 1','Qg7#','The king protects the queen and the queen covers the escape squares.'),
  tactic('rook-edge-mate','Deliver mate with your rook on h8','k7/8/1K6/8/8/8/8/7R w - - 0 1','Rh8#','White’s king covers a7 and b7 while the rook attacks rank eight.'),
  tactic('avoid-stalemate','Place the queen on h6 without stalemating Black','7k/8/5K2/6Q1/8/8/8/8 w - - 0 1','Qh6+','Giving check leaves Black a legal reply, so the game continues.'),
  tactic('black-back-rank','Deliver back-rank mate with Black’s rook','4r1k1/5ppp/8/8/8/8/5PPP/6K1 b - - 0 1','Re1#','The white pawns trap their king and the rook controls the first rank.'),
];
