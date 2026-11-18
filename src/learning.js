import { Chess } from 'chess.js';

export const lessons = [
  {id:'center',title:'Control the center',prompt:'As White, move the king’s pawn two squares to claim the center.',answer:'e4',explanation:'The pawn controls d5 and opens lines for the queen and bishop.'},
  {id:'development',title:'Develop a knight',setup:['e4','e5'],prompt:'Develop the kingside knight and attack Black’s e5 pawn.',answer:'Nf3',explanation:'The knight develops toward the center and attacks e5.'},
  {id:'castle',title:'Castle kingside',setup:['e4','e5','Nf3','Nc6','Be2','Nf6'],prompt:'Move the white king to g1 to castle.',answer:'O-O',explanation:'The king moves to g1 and the rook moves to f1 in the same turn.'},
];
export const puzzles = [
  {id:'fools-mate',title:'Diagonal mate',setup:['f3','e5','g4'],prompt:'Find checkmate in one for Black.',mate:true,explanation:'The queen uses the open diagonal to checkmate White.'},
  {id:'back-rank',title:'Back-rank mate',fen:'6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1',prompt:'Find checkmate in one for White.',mate:true,explanation:'The rook seals the back rank and Black’s pawns block the king’s escape.'},
  {id:'win-queen',title:'Find the winning capture',fen:'4k3/8/8/3q4/4P3/8/8/4K3 w - - 0 1',prompt:'Win Black’s queen with a pawn.',answer:'exd5',explanation:'The white pawn captures diagonally on d5.'},
  {id:'en-passant',title:'En passant',setup:['e4','a6','e5','d5'],prompt:'Capture the pawn that just advanced two squares.',answer:'exd6',explanation:'The capture must happen immediately. The white pawn lands on d6.'},
];
export function exerciseGame(exercise) {
  const game = new Chess(exercise.fen);
  for (const move of exercise.setup ?? []) game.move(move);
  return game;
}
export function dailyExercise(date = new Date()) {
  const day = date.toISOString().slice(0,10);
  const index = Math.floor(Date.parse(day)/86400000) % puzzles.length;
  return {...puzzles[index], id:'daily-'+day, title:'Daily · '+puzzles[index].title};
}
export function solveExercise(game, exercise, from, to) {
  const candidates = game.moves({square:from,verbose:true}).filter(move => move.to === to);
  for (const move of candidates) {
    if (exercise.mate) {
      game.move(move);
      const mate = game.isCheckmate();
      game.undo();
      if (mate) return move;
    } else if (move.san === exercise.answer) return move;
  }
  return null;
}
const key = 'global-chess.learning.v1';
export function bindLearning(glyphs,names) {
  const get = id => document.getElementById(id);
  const dialog = get('learn-dialog');
  const picker = get('lesson-picker');
  const board = get('lesson-board');
  let completed = new Set();
  try {
    const saved = JSON.parse(localStorage.getItem(key) ?? '[]');
    if (Array.isArray(saved)) completed = new Set(saved.filter(id => typeof id === 'string'));
  } catch { /* Learning still works for this session. */ }
  let exercises, exercise, game, selected, solved;
  function updateProgress() {
    const count = [...lessons,...puzzles].filter(item => completed.has(item.id)).length;
    const daily = [...completed].filter(id => /^daily-\d{4}-\d{2}-\d{2}$/.test(id)).length;
    const achievements = [count >= 1 && 'First solve', lessons.every(item => completed.has(item.id)) && 'Opening basics',
      puzzles.every(item => completed.has(item.id)) && 'Tactics starter', daily >= 3 && 'Daily regular'].filter(Boolean);
    get('lesson-progress').textContent = count + ' / 7 exercises · ' + (count*10+daily*15) + ' XP' +
      (achievements.length ? ' · ' + achievements.join(', ') : '');
  }
  function render(focus) {
    board.replaceChildren();
    for (const [rank,row] of game.board().entries()) {
      for (const [file,piece] of row.entries()) {
        const square = 'abcdefgh'[file] + (8-rank);
        const button = document.createElement('button');
        button.type = 'button';
        button.className = (rank+file)%2 ? 'dark' : 'light';
        button.setAttribute('aria-label', square + (piece ? ', ' + (piece.color === 'w' ? 'White ' : 'Black ') + names[piece.type] : ''));
        button.setAttribute('aria-pressed', String(square === selected));
        button.textContent = piece ? glyphs[piece.color]['kqrbnp'.indexOf(piece.type)] : '';
        button.onclick = () => tap(square);
        board.append(button);
        if (square === focus) button.focus();
      }
    }
  }
  function tap(square) {
    if (solved) return;
    const piece = game.get(square);
    if (piece?.color === game.turn()) { selected = square; render(square); return; }
    if (!selected) return;
    const move = solveExercise(game,exercise,selected,square);
    if (!move) { get('lesson-feedback').textContent = 'Try a different move.'; return; }
    game.move(move);
    solved = true;
    selected = undefined;
    completed.add(exercise.id);
    let message = 'Correct. ' + exercise.explanation;
    try { localStorage.setItem(key,JSON.stringify([...completed])); }
    catch { message += ' Progress is available for this session.'; }
    get('lesson-feedback').textContent = message;
    updateProgress();
    render(square);
  }
  function load(index) {
    exercise = exercises[index];
    game = exerciseGame(exercise);
    selected = undefined;
    solved = false;
    get('lesson-title').textContent = exercise.title;
    get('lesson-prompt').textContent = exercise.prompt;
    get('lesson-feedback').textContent = completed.has(exercise.id) ? 'Previously solved.' : '';
    render();
  }
  picker.onchange = () => load(Number(picker.value));
  get('lesson-reset').onclick = () => load(Number(picker.value));
  get('learn').onclick = () => {
    exercises = [...lessons,...puzzles,dailyExercise()];
    picker.replaceChildren(...exercises.map((item,index) => new Option(item.title,index)));
    load(0);
    updateProgress();
    dialog.showModal();
  };
}
