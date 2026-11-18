import { openGameStorage } from './storage.js';
import { bindOnline } from './online.js';
import { Chess } from 'chess.js';
import { readHistory, recordMatch } from './history.js';
import { startClock, remainingClock } from './clock.js';
import './style.css';
import { restoreGame, serializeGame, result, claimableDraw, intendedDraw, timeoutResult } from './game.js';

import { matchKey as key, exportBackup, importBackup } from './backup.js';
async function initialize() {
const gameStorage = await openGameStorage();
const board = document.querySelector('#board');
const status = document.querySelector('#status');
const rematch = document.querySelector('#rematch');
rematch.onclick = () => startLocalMatch(state.mode, state.preset ?? document.querySelector('#preset').value, state.difficulty);
const promotion = document.querySelector('#promotion');
const glyphs = { w: '♔♕♖♗♘♙', b: '♚♛♜♝♞♟' };
const names = { k:'King', q:'Queen', r:'Rook', b:'Bishop', n:'Knight', p:'Pawn' };
let state = restoreGame();
let notice = '';
try {
  state = restoreGame(gameStorage.getItem(key));
} catch {
  notice = 'Saved game could not be restored.';
}
let selected;
const claim = document.querySelector('#claim');
const outcome = game => {
  if (online?.active) return online.match.outcome;
  if (state.drawClaim) return 'Draw by ' + state.drawClaim;
  return result(game) ?? (state.clock?.[game.turn()] === 0
    ? timeoutResult(game, game.turn()) : null);
};
const clocks = document.querySelector('#clocks');
let tickAt = performance.now();
let online;

function updateClock() {
  if (online?.active) { displayClock(); return; }
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
    const seconds = Math.ceil((online?.active ? online.remaining(side) : state.clock[side]) / 1000);
    return (side === 'w' ? 'White ' : 'Black ') +
      Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0');
  }).join('  ·  ');
}
function settleClaim(reason, move) {
  updateClock();
  if (!reason || outcome(state.game)) return;
  state.drawClaim = reason;
  state.claimMove = move;
  selected = undefined;
  save();
  render();
}

claim.onclick = () => {
  const {game} = state;
  if (outcome(game) || online?.active || (state.mode === 'computer' && game.turn() === 'b')) return;
  const reason = claimableDraw(game);
  if (reason) return settleClaim(reason);
  const dialog = document.querySelector('#claim-dialog');
  const options = document.querySelector('#claim-options');
  options.replaceChildren();
  const candidates = game.moves({verbose:true});
  for (const {from, to, promotion, san} of candidates) {
    const move = {from,to,promotion};
    const intended = intendedDraw(game, move);
    if (!intended) continue;
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = san + ' · ' + intended;
    button.onclick = () => {
      dialog.close();
      if (state.game === game && !online?.active) settleClaim(intendedDraw(game, move), move);
    };
    options.append(button);
  }
  if (!options.children.length) options.textContent = 'No legal move currently qualifies for a draw claim.';
  dialog.showModal();
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
  rematch.hidden = Boolean(online?.active) || !outcome(state.game);
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
  claim.hidden = Boolean(online?.active) || Boolean(outcome(game)) || (mode === 'computer' && game.turn() === 'b');
  const moves = game.history();
  document.querySelector('#moves').replaceChildren(...moves.filter((_, index) => index % 2 === 0).map((move, index) => {
    const item = document.createElement('li');
    item.textContent = [move, moves[index * 2 + 1]].filter(Boolean).join('  ');
    return item;
  }));
}

function save() {
  if (online?.active) return;
  try {
    const snapshot = serializeGame(state.game, state.mode, state.drawClaim, state.clock, state.difficulty, state.claimMove, state.preset);
    gameStorage.setItem(key, snapshot);
    const completed = outcome(state.game);
    if (completed) recordMatch(gameStorage, completed, snapshot);
    notice = '';
  } catch {
    notice = 'Storage unavailable. This match may not resume after closing.';
  }
}

function commit(move) {
  if (online?.active) { online.move(move); return; }
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
  if (worker || mode !== 'computer' || game.turn() !== 'b' || outcome(game)) return;
  let job;
  try {
    job = new Worker(new URL('./bot.js', import.meta.url), {type:'module'});
  } catch {
    const [fallback] = game.moves({verbose:true});
    if (fallback) commit(fallback);
    return;
  }
  worker = job;
  const finish = (move) => {
    if (worker !== job) return;
    clearTimeout(deadline);
    job.terminate();
    worker = undefined;
    const legal = game.moves({verbose:true});
    const candidate = legal.find(option => option.from === move?.from && option.to === move?.to && option.promotion === move?.promotion);
    if (legal.length) commit(candidate ?? legal[0]);
  };
  const deadline = setTimeout(finish, 5000);
  job.onmessage = ({data}) => finish(data);
  job.onerror = () => finish();
  job.postMessage({fen:game.fen(), difficulty:state.difficulty});
}

async function selectSquare(square) {
  const {game, mode} = state;
  if (online?.active && !online.canMove(game.turn())) return;
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
function startLocalMatch(mode, preset, difficulty) {
  if (online?.active) return;
  if (state.game.history().length && !outcome(state.game) && !confirm('Replace this match?')) return;
  worker?.terminate();
  worker = undefined;
  state = {...restoreGame(), mode, preset, difficulty, clock: startClock(preset)};
  tickAt = performance.now();
  selected = undefined;
  save();
  render();
}
for (const mode of ['local', 'computer']) {
  document.getElementById(mode).onclick = () => startLocalMatch(
    mode, document.querySelector('#preset').value, document.querySelector('#difficulty').value,
  );
}
let offlineState;
online = bindOnline({
  onMatch(match) {
    if (!offlineState) {
      offlineState = state;
      worker?.terminate();
      worker = undefined;
    }
    const previousPly = state === offlineState ? -1 : state.game.history().length;
    state = {...restoreGame(JSON.stringify({version:1, mode:'local', moves:match.moves})), clock:match.clock};
    selected = undefined;
    const played = match.moves.length === previousPly + 1
      ? state.game.history({verbose:true}).at(-1) : undefined;
    render(played);
  },
  onLeave() {
    if (!offlineState) return;
    state = offlineState;
    offlineState = undefined;
    tickAt = performance.now();
    selected = undefined;
    render();
    playComputer();
  },
});
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


const historyDialog = document.querySelector('#history-dialog');
const historyList = document.querySelector('#history-list');
const replaySection = document.querySelector('#replay');
let timeline = [];
let replayPgn = '';
let ply = 0;

function showReplayPosition() {
  const game = new Chess();
  for (const move of timeline.slice(0, ply)) game.move(move);
  document.querySelector('#replay-position').textContent = 'Move ' + ply + ' of ' + timeline.length;
  document.querySelector('#previous').disabled = ply === 0;
  document.querySelector('#next').disabled = ply === timeline.length;
  document.querySelector('#replay-board').replaceChildren(...game.board().flat().map((piece, index) => {
    const cell = document.createElement('span');
    cell.className = (Math.floor(index / 8) + index % 8) % 2 ? 'dark' : 'light';
    if (piece) {
      cell.textContent = glyphs[piece.color]['kqrbnp'.indexOf(piece.type)];
      cell.setAttribute('aria-label', piece.square + ' ' + (piece.color === 'w' ? 'White ' : 'Black ') + names[piece.type]);
    }
    return cell;
  }));
}

document.querySelector('#previous').onclick = () => { if (ply > 0) ply--; showReplayPosition(); };
document.querySelector('#next').onclick = () => { if (ply < timeline.length) ply++; showReplayPosition(); };
document.querySelector('#history-button').onclick = () => {
  replaySection.hidden = true;
  historyList.replaceChildren();
  try {
    const entries = readHistory(gameStorage);
    if (!entries.length) historyList.textContent = 'No completed matches yet.';
    for (const entry of entries) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = entry.outcome;
      button.onclick = () => {
        try {
          const restored = restoreGame(entry.snapshot);
          const resultCode = entry.outcome.startsWith('White wins') ? '1-0' :
            entry.outcome.startsWith('Black wins') ? '0-1' : '1/2-1/2';
          restored.game.setHeader('Result', resultCode);
          replayPgn = restored.game.pgn();
          timeline = restored.game.history();
          ply = 0;
          replaySection.hidden = false;
          showReplayPosition();
        } catch {
          button.textContent = 'Replay could not be loaded.';
        }
      };
      historyList.append(button);
    }
  } catch {
    historyList.textContent = 'Match history is unavailable.';
  }
  historyDialog.showModal();
};

function downloadFile(content, name, type) {
  const url = URL.createObjectURL(new Blob([content], {type}));
  const download = document.createElement('a');
  download.href = url;
  download.download = name;
  download.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

document.querySelector('#export-pgn').onclick = () =>
  downloadFile(replayPgn, 'global-chess-match.pgn', 'application/x-chess-pgn');

const backupFile = document.querySelector('#backup-file');
const backupStatus = document.querySelector('#backup-status');
document.querySelector('#export-backup').onclick = () => {
  try {
    if (state.clock) updateClock();
    save();
    downloadFile(exportBackup(gameStorage), 'global-chess-backup.json', 'application/json');
  } catch {
    backupStatus.textContent = 'Backup could not be exported.';
  }
};
document.querySelector('#import-backup').onclick = () => {
  if (online?.active) {
    backupStatus.textContent = 'Return to your offline game before restoring a backup.';
    return;
  }
  backupFile.click();
};
backupFile.onchange = async () => {
  const file = backupFile.files[0];
  backupFile.value = '';
  if (!file || !confirm('Replace the active match and local match history with this backup?')) return;
  try {
    if (file.size > 2_000_000) throw new Error('Backup too large');
    const contents = await file.text();
    if (online?.active) throw new Error('Online match in progress');
    const restored = importBackup(gameStorage, contents);
    worker?.terminate();
    worker = undefined;
    state = restored;
    selected = undefined;
    tickAt = performance.now();
    notice = 'Backup restored.';
    historyDialog.close();
    render();
    playComputer();
  } catch {
    backupStatus.textContent = 'Could not restore this backup.';
  }
};

const lessons = [
  ['Control the center', 'Try 1. e4 or 1. d4 to fight for the central squares and open lines for your pieces.'],
  ['Develop your pieces', 'Bring knights and bishops into play before spending turns moving the same piece again.'],
  ['Protect your king', 'Castle when legal to move your king toward the edge and bring your rook closer to the center.'],
];
let lessonIndex = 0;
const learnDialog = document.querySelector('#learn-dialog');
function renderLesson() {
  const [title, description] = lessons[lessonIndex];
  const heading = document.createElement('h3');
  heading.textContent = title;
  const body = document.createElement('p');
  body.textContent = description;
  document.querySelector('#lesson').replaceChildren(heading, body);
  document.querySelector('#lesson-next').disabled = lessonIndex === lessons.length - 1;
}
document.querySelector('#learn').onclick = () => { renderLesson(); learnDialog.showModal(); };
document.querySelector('#lesson-next').onclick = () => { lessonIndex++; renderLesson(); };

window.addEventListener('chess-storage-error', () => {
  notice = 'Could not write the game save.';
  render();
});
}
initialize().catch(() => {
  document.querySelector('#status').textContent = 'The game could not start.';
});
