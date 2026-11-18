import { startClock, remainingClock } from './clock.js';
import './style.css';
import { restoreGame, serializeGame, result, claimableDraw } from './game.js';

const key = 'global-chess.match.v1';
const board = document.querySelector('#board');
const status = document.querySelector('#status');
const promotion = document.querySelector('#promotion');
const glyphs = { w: '♔♕♖♗♘♙', b: '♚♛♜♝♞♟' };
const names = { k:'King', q:'Queen', r:'Rook', b:'Bishop', n:'Knight', p:'Pawn' };
let state = restoreGame();
let notice = '';
try {
  state = restoreGame(localStorage.getItem(key));
} catch {
  notice = 'Saved game could not be restored.';
}
let selected;
const claim = document.querySelector('#claim');
const outcome = game => {
  if (state.drawClaim) return 'Draw by ' + state.drawClaim;
  return result(game) ?? (state.clock?.[game.turn()] === 0
    ? (game.turn() === 'w' ? 'Black' : 'White') + ' wins on time' : null);
};
const clocks = document.querySelector('#clocks');
let tickAt = performance.now();

function updateClock() {
  const now = performance.now();
  const { clock, game } = state;
  if (clock && !outcome(game) && !document.hidden) {
    state.clock = remainingClock(clock, game.turn(), now - tickAt);
    if (state.clock[game.turn()] === 0) {
      worker?.terminate();
      worker = undefined;
      save();
      render();
    }
  }
  tickAt = now;
  displayClock();
}

function displayClock() {
  clocks.hidden = !state.clock;
  if (!state.clock) return;
  clocks.textContent = ['w','b'].map(side => {
    const seconds = Math.ceil(state.clock[side] / 1000);
    return (side === 'w' ? 'White ' : 'Black ') +
      Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0');
  }).join('  ·  ');
}
claim.onclick = () => {
  const reason = claimableDraw(state.game);
  if (!reason || outcome(state.game) || (state.mode === 'computer' && state.game.turn() === 'b')) return;
  state.drawClaim = reason;
  selected = undefined;
  save();
  render();
};
let worker;
let renderer;
const canvas = document.querySelector('#scene');
const view = document.querySelector('#view');
view.onclick = async () => {
  if (renderer) {
    renderer.dispose();
    renderer = undefined;
    canvas.hidden = true;
    board.hidden = false;
    view.textContent = 'Use 3D board';
    return;
  }
  view.disabled = true;
  canvas.hidden = false;
  try {
    const { mountBoard } = await import('./board3d.js');
    renderer = await mountBoard(canvas, selectSquare);
    board.hidden = true;
    view.textContent = 'Use 2D board';
    render();
  } catch {
    canvas.hidden = true;
    notice = '3D unavailable on this device. The 2D match is still available.';
    render();
  } finally {
    view.disabled = false;
  }
};

function render(move) {
  displayClock();
  const {game, mode} = state;
  const activeSquare = document.activeElement?.dataset.square;
  const targets = selected ? game.moves({square: selected, verbose: true}).map(move => move.to) : [];
  renderer?.syncTurns(game, selected, targets, move);
  board.replaceChildren(...game.board().flatMap((row, rank) => row.map((piece, file) => {
    const square = 'abcdefgh'[file] + (8 - rank);
    const cell = document.createElement('button');
    cell.dataset.square = square;
    cell.className = (rank + file) % 2 ? 'dark' : 'light';
    cell.classList.toggle('target', targets.includes(square));
    cell.setAttribute('aria-pressed', String(square === selected));
    cell.setAttribute('aria-label', piece ? square + ', ' + (piece.color === 'w' ? 'White ' : 'Black ') + names[piece.type] : square);
    cell.textContent = piece ? glyphs[piece.color]['kqrbnp'.indexOf(piece.type)] : '';
    return cell;
  })));
  if (activeSquare) board.querySelector('[data-square="' + activeSquare + '"]')?.focus();
  status.textContent = [outcome(game) ?? (mode === 'computer' && game.turn() === 'b' ? 'Computer thinking…' :
    (game.turn() === 'w' ? 'White' : 'Black') + ' to move' + (game.inCheck() ? ' · Check' : '')), notice].filter(Boolean).join(' · ');
  claim.hidden = Boolean(outcome(game)) || !claimableDraw(game) || (mode === 'computer' && game.turn() === 'b');
  const moves = game.history();
  document.querySelector('#moves').replaceChildren(...moves.filter((_, index) => index % 2 === 0).map((move, index) => {
    const item = document.createElement('li');
    item.textContent = [move, moves[index * 2 + 1]].filter(Boolean).join('  ');
    return item;
  }));
}

function save() {
  try {
    localStorage.setItem(key, serializeGame(state.game, state.mode, state.drawClaim, state.clock));
    notice = '';
  } catch {
    notice = 'Storage unavailable. This match may not resume after closing.';
  }
}

function commit(move) {
  updateClock();
  if (outcome(state.game)) return;
  const played = state.game.move(move);
  selected = undefined;
  save();
  render(played);
  playComputer();
}

function playComputer() {
  const {game, mode} = state;
  if (mode !== 'computer' || game.turn() !== 'b' || outcome(game)) return;
  const job = new Worker(new URL('./bot.js', import.meta.url), {type:'module'});
  worker = job;
  const finish = (move) => {
    if (worker !== job) return;
    job.terminate();
    worker = undefined;
    const legal = game.moves({verbose:true});
    const candidate = legal.find(option => option.from === move?.from && option.to === move?.to && option.promotion === move?.promotion);
    if (legal.length) commit(candidate ?? legal[0]);
  };
  job.onmessage = ({data}) => finish(data);
  job.onerror = () => finish();
  job.postMessage({fen:game.fen()});
}

async function selectSquare(square) {
  const {game, mode} = state;
  if (!square || outcome(game) || (mode === 'computer' && game.turn() === 'b')) return;
  const piece = game.get(square);
  if (piece?.color === game.turn()) {
    selected = selected === square ? undefined : square;
    render();
    return;
  }
  if (!selected) return;
  const options = game.moves({square:selected, verbose:true}).filter(move => move.to === square);
  if (!options.length) return;
  if (!options[0].promotion) return commit(options[0]);
  promotion.returnValue = '';
  promotion.showModal();
  await new Promise(resolve => promotion.addEventListener('close', resolve, {once:true}));
  const chosen = options.find(move => move.promotion === promotion.returnValue);
  if (chosen && state.game === game) commit(chosen);
}
board.addEventListener('click', ({target}) => selectSquare(target.closest('[data-square]')?.dataset.square));
for (const mode of ['local', 'computer']) {
  document.getElementById(mode).onclick = () => {
    if (state.game.history().length && !outcome(state.game) && !confirm('Replace this match?')) return;
    worker?.terminate();
    worker = undefined;
    state = {...restoreGame(), mode, clock: startClock(document.querySelector('#preset').value)};
    tickAt = performance.now();
    selected = undefined;
    save();
    render();
  };
}
render();
playComputer();

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {
    notice = 'Offline cache unavailable. Keep this tab open to continue playing.';
    render();
  });
}

setInterval(updateClock, 100);
document.addEventListener('visibilitychange', () => {
  tickAt = performance.now();
  if (document.hidden && state.clock) save();
});
window.addEventListener('pagehide', () => { if (state.clock) save(); });
