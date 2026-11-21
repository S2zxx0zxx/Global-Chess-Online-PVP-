import { renderPieceArt } from './piece-art.js';
import { emitFeedback } from './feedback.js';
import { loadBrowserMateSolver } from './mate-solver.js';
import { bindLearning } from './learning.js';
import { bindLobby } from './lobby.js';
import { openGameStorage } from './storage.js';
import { bindOnline } from './online.js';
import { Chess } from 'chess.js';
import { readHistory, recordMatch } from './history.js';
import { commitHistoryReplacement } from './history-mutation.js';
import { summarizeMatches } from './game-stats.js';
import { startClock, remainingClock } from './clock.js';
import './style.css';
import './app-shell.css';
import './screen-routes.css';
import { mountAppShell } from './app-shell.js';
import { finalizeOfflineExit } from './session-exit.js';
import { restoreGame, serializeGame, savedMatchOutcome, claimableDraw, intendedDraw, hasAvailableDrawClaim } from './game.js';

import { matchKey as key, historyKey, exportBackup, importBackup, previewBackup } from './backup.js';
async function initialize() {
// The optional WASM mating solver must not delay guest-first gameplay.
const gameStorage = await openGameStorage();
loadBrowserMateSolver().catch(() => {
  // The simpler validated timeout policy remains available.
});
const board = document.querySelector('#board');
const status = document.querySelector('#status');
const rematch = document.querySelector('#rematch');
rematch.onclick = () => {
  if (startLocalMatch(state.mode, state.preset ?? document.querySelector('#preset').value, state.difficulty, state.playerSide)) {
    document.querySelector('#match-area').focus();
  }
};
const promotion = document.querySelector('#promotion');
const names = { k:'King', q:'Queen', r:'Rook', b:'Bishop', n:'Knight', p:'Pawn' };
let state = restoreGame();
let notice = '';
let corruptMatchRaw;
try {
  state = restoreGame(gameStorage.getItem(key));
} catch {
  // Do not overwrite potentially recoverable bytes without user consent.
  corruptMatchRaw = gameStorage.getItem(key);
  notice = 'Saved game could not be restored. Export it from Recovery before replacing the match.';
}
if (state.mode === 'computer') document.querySelector('#difficulty').value = state.difficulty;
let selected;
const claim = document.querySelector('#claim');
const outcome = game => {
  if (online?.active) return online.match.outcome;
  return savedMatchOutcome(state);
};
const clocks = document.querySelector('#clocks');
let tickAt = performance.now();
let online;
let lobby;
let appShell;
let flipped = state.mode === 'computer' && state.playerSide === 'b';
document.documentElement.classList.toggle('ch-board-flipped',flipped);
let wasVisible = !document.hidden;
const flip = document.querySelector('#flip-board');
flip.onclick = () => {
  flipped = !flipped;
  flip.setAttribute('aria-pressed', String(flipped));
  document.documentElement.classList.toggle('ch-board-flipped',flipped);
  renderer?.setFlipped(flipped);
  render();
};
let focusSquare = 'e2';

function updateClock() {
  const now = performance.now();
  const elapsed = wasVisible ? now - tickAt : 0;
  tickAt = now;
  wasVisible = !document.hidden;
  if (online?.active || state.paused) { displayClock(); return; }
  const { clock, game } = state;
  if (clock && !outcome(game) && elapsed > 0) {
    state.clock = remainingClock(clock, game.turn(), elapsed);
    if (state.clock[game.turn()] === 0) {
      stopComputer();
      save();
      render();
    }
  }
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
  if (online?.active) { online.claim(move); return; }
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
  if (state.paused || outcome(game) || (online?.active && !online.canMove(game.turn())) ||
      (state.mode === 'computer' && game.turn() !== state.playerSide)) return;
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
      if (state.game === game) settleClaim(intendedDraw(game, move), move);
    };
    options.append(button);
  }
  if (!options.children.length) options.textContent = 'No legal move currently qualifies for a draw claim.';
  dialog.showModal();
};
let worker;
let workerDeadline;
function stopComputer() {
  clearTimeout(workerDeadline);
  worker?.terminate();
  worker = undefined;
}
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
    renderer.setFlipped(flipped);
    board.hidden = true;
    view.textContent = 'Use 2D board';
    render();
  } catch {
    renderer?.dispose();
    renderer = undefined;
    canvas.hidden = true;
    board.hidden = false;
    view.textContent = 'Use 3D board';
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
  lobby?.render({outcome:outcome(game),turn:game.turn(),mode,playerSide:state.playerSide,online:Boolean(online?.active),
    started:online?.active ? online.match.turnStartedAt !== null : state.preset !== undefined || game.history().length > 0 || Boolean(state.clock)});
  const activeSquare = document.activeElement?.dataset.square;
  const targets = selected ? game.moves({square: selected, verbose: true}).map(move => move.to) : [];
  const lastMove = move ?? game.history({verbose:true}).at(-1);
  const checkedSide = game.inCheck() ? game.turn() : null;
  renderer?.syncTurns(game, selected, targets, move, lastMove, checkedSide);
  board.classList.toggle('flipped',flipped);
  const rows = game.board();
  if (flipped) rows.reverse().forEach(row => row.reverse());
  board.replaceChildren(...rows.flatMap((row, visibleRank) => row.map((piece, visibleFile) => {
    const rank = flipped ? 7 - visibleRank : visibleRank;
    const file = flipped ? 7 - visibleFile : visibleFile;
    const square = 'abcdefgh'[file] + (8 - rank);
    const cell = document.createElement('button');
    cell.dataset.square = square;

    cell.tabIndex = square === focusSquare ? 0 : -1;

    cell.className = (rank + file) % 2 ? 'dark' : 'light';
    const isTarget = targets.includes(square);
    cell.classList.toggle('target', isTarget);
    cell.classList.toggle('capture-target', isTarget && Boolean(piece));
    cell.classList.toggle('last-move', square === lastMove?.from || square === lastMove?.to);
    cell.classList.toggle('in-check', piece?.type === 'k' && piece.color === checkedSide);
    cell.setAttribute('aria-pressed', String(square === selected));
    cell.setAttribute('aria-label', piece ? square + ', ' + (piece.color === 'w' ? 'White ' : 'Black ') + names[piece.type] : square);
    renderPieceArt(cell,piece,names);
    const coordinates = [
      [visibleRank === 7, 'file-label', square[0]],
      [visibleFile === 0, 'rank-label', square[1]],
    ];
    for (const [show, className, text] of coordinates) {
      if (!show) continue;
      const label = document.createElement('span');
      label.className = className;
      label.setAttribute('aria-hidden', 'true');
      label.textContent = text;
      cell.append(label);
    }
    return cell;
  })));
  if (activeSquare) board.querySelector('[data-square="' + activeSquare + '"]')?.focus();
  const storageNote = gameStorage.durable === false ? 'Session only · Progress will not be saved after closing' : '';
  status.textContent = [state.paused ? 'Match paused · Open Pause screen to resume' : (outcome(game) ?? (mode === 'computer' && game.turn() !== state.playerSide ? 'Computer thinking…' :
    (game.turn() === 'w' ? 'White' : 'Black') + ' to move' + (game.inCheck() ? ' · Check' : ''))), notice, storageNote].filter(Boolean).join(' · ');
  const drawAllowed = !outcome(game) && hasAvailableDrawClaim(game);
  claim.hidden = state.paused || (online?.active && !online.canMove(game.turn())) ||
    Boolean(outcome(game)) || (mode === 'computer' && game.turn() !== state.playerSide) ||
    !drawAllowed;
  const moves = game.history();
  document.querySelector('#moves').replaceChildren(...moves.filter((_, index) => index % 2 === 0).map((move, index) => {
    const item = document.createElement('li');
    item.textContent = [move, moves[index * 2 + 1]].filter(Boolean).join('  ');
    return item;
  }));
}

function save() {
  if (online?.active) return false;
  try {
    const snapshot = serializeGame(state.game, state.mode, state.drawClaim, state.clock, state.difficulty, state.claimMove, state.preset, state.playerSide, state.resignedBy, state.paused);
    gameStorage.setItem(key, snapshot);
    const completed = outcome(state.game);
    if (completed) recordMatch(gameStorage, completed, snapshot);
    notice = '';
    return true;
  } catch {
    notice = 'Storage unavailable. This match may not resume after closing.';
    return false;
  }
}

function commit(move) {
  if (online?.active) { online.move(move); return; }
  if (state.paused) return;
  updateClock();
  if (outcome(state.game)) return;
  const played = state.game.move(move);
  selected = undefined;
  save();
  render(played);
  emitFeedback(state.game.inCheck() ? 'check' : played.captured ? 'capture' : 'move');
  window.dispatchEvent(new CustomEvent('chess-move-committed', {detail:{color:played.color,from:played.from,to:played.to}}));
  playComputer();
}

function playComputer() {
  const {game, mode} = state;
  if (worker || state.paused || mode !== 'computer' || game.turn() === state.playerSide || outcome(game)) return;
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
    stopComputer();
    const legal = game.moves({verbose:true});
    const candidate = legal.find(option => option.from === move?.from && option.to === move?.to && option.promotion === move?.promotion);
    if (legal.length) commit(candidate ?? legal[0]);
  };
  workerDeadline = setTimeout(finish, 5000);
  job.onmessage = ({data}) => finish(data);
  job.onerror = () => finish();
  job.onmessageerror = () => finish();
  try {
    job.postMessage({fen:game.fen(), difficulty:state.difficulty});
  } catch {
    finish();
  }
}

async function selectSquare(square) {
  const {game, mode} = state;
  if (online?.active && !online.canMove(game.turn())) return;
  if (!square || state.paused || outcome(game) || (mode === 'computer' && game.turn() !== state.playerSide)) return;
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
// Pointer drag is presentation-only: legal move validation remains in selectSquare
// and the chess.js state. Taps and keyboard operation continue to work.
let dragStart;
let suppressClickUntil = 0;
board.addEventListener('pointerdown', event => {
  if (!event.isPrimary || event.button !== 0 || outcome(state.game)) return;
  const square = event.target.closest('[data-square]')?.dataset.square;
  if (!square || state.paused || (online?.active && !online.canMove(state.game.turn())) ||
      (state.mode === 'computer' && state.game.turn() !== state.playerSide)) return;
  if (state.game.get(square)?.color !== state.game.turn()) return;
  dragStart = {square, x:event.clientX, y:event.clientY, pointerId:event.pointerId, dragging:false};
});
board.addEventListener('pointermove', event => {
  if (!dragStart || dragStart.pointerId !== event.pointerId) return;
  if (Math.hypot(event.clientX-dragStart.x,event.clientY-dragStart.y) < 10) return;
  dragStart.dragging = true;
  board.classList.add('ch-dragging');
});
board.addEventListener('pointerup', event => {
  const drag = dragStart;
  dragStart = undefined;
  board.classList.remove('ch-dragging');
  if (!drag || !drag.dragging || drag.pointerId !== event.pointerId) return;
  const target = document.elementFromPoint(event.clientX,event.clientY)?.closest('[data-square]')?.dataset.square;
  if (!target || target === drag.square) return;
  suppressClickUntil = performance.now() + 200;
  selectSquare(drag.square);
  queueMicrotask(() => selectSquare(target));
});
window.addEventListener('pointerup', () => {dragStart=undefined;board.classList.remove('ch-dragging');});
window.addEventListener('pointercancel', () => {dragStart=undefined;board.classList.remove('ch-dragging');});
board.addEventListener('click', ({target}) => {
  if (performance.now() < suppressClickUntil) return;
  const square = target.closest('[data-square]')?.dataset.square;
  selectSquare(square);
});
board.addEventListener('focusin', ({target}) => {
  const square = target.dataset.square;
  if (!square || square === focusSquare) return;
  const previous = board.querySelector('[data-square="' + focusSquare + '"]');
  if (previous) previous.tabIndex = -1;
  focusSquare = square;
  target.tabIndex = 0;
});
board.addEventListener('keydown', event => {
  const delta = {ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,1],ArrowDown:[0,-1]}[event.key];
  const square = event.target.dataset.square;
  if (!delta || !square) return;
  event.preventDefault();
  const direction = flipped ? -1 : 1;
  const file = 'abcdefgh'.indexOf(square[0]) + delta[0] * direction;
  const rank = Number(square[1]) + delta[1] * direction;
  if (file < 0 || file > 7 || rank < 1 || rank > 8) return;
  const next = board.querySelector('[data-square="' + 'abcdefgh'[file] + rank + '"]');
  next.focus();
});
let versusTimer;
function closeVersus() {
  clearTimeout(versusTimer);
  document.querySelector('#versus').hidden = true;
}
document.querySelector('#versus-skip').onclick = closeVersus;
document.addEventListener('visibilitychange',() => {
  if(document.hidden)closeVersus();
});
function showVersus(white,black) {
  const card = document.querySelector('#versus');
  document.querySelector('#versus-white').textContent = white;
  document.querySelector('#versus-black').textContent = black;
  clearTimeout(versusTimer);
  const motion = matchMedia('(prefers-reduced-motion: reduce)').matches ||
    document.documentElement.classList.contains('ch-reduce-motion');
  const duration = Number.parseFloat(getComputedStyle(card).getPropertyValue('--ch-motion-vs-max'));
  card.hidden = motion;
  if (!motion) versusTimer = setTimeout(closeVersus, Number.isFinite(duration)?Math.min(900,Math.max(0,duration)):700);
}

function startLocalMatch(mode, preset, difficulty, side = 'w') {
  if (online?.active) return;
  if (corruptMatchRaw && !confirm('The saved match cannot be restored. Starting a new game will replace its stored bytes. Export your raw recovery copy first if needed. Continue?')) return;
  corruptMatchRaw = undefined;
  if (state.game.history().length && !outcome(state.game) && !confirm('Replace this match?')) return;
  stopComputer();
  const playerSide = side === 'b' ? 'b' : 'w';
  state = {...restoreGame(), mode, preset, difficulty, playerSide, clock: startClock(preset)};
  flipped = mode === 'computer' && playerSide === 'b';
  document.documentElement.classList.toggle('ch-board-flipped',flipped);
  flip.setAttribute('aria-pressed', String(flipped));
  renderer?.setFlipped(flipped);
  showVersus(mode === 'computer' && playerSide === 'b' ? 'Computer · White' : 'White',
    mode === 'computer' && playerSide === 'w' ? 'Computer · Black' : 'Black');
  tickAt = performance.now();
  selected = undefined;
  save();
  render();
  appShell?.onNewMatch();
  playComputer();
  return true;
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
      stopComputer();
    }
    if (match.version === 1 && match.turnStartedAt !== null && match.moves.length === 0 && !match.outcome) showVersus('White','Black');
    const previousPly = state === offlineState ? -1 : state.game.history().length;
    state = {...restoreGame(JSON.stringify({version:1, mode:'local', moves:match.moves})), clock:match.clock};
    selected = undefined;
    const played = match.moves.length === previousPly + 1
      ? state.game.history({verbose:true}).at(-1) : undefined;
    render(played);
    if (played) emitFeedback(state.game.inCheck() ? 'check' : played.captured ? 'capture' : 'move');
    appShell?.go('match');
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
lobby = bindLobby({
  startMatch:startLocalMatch,
  storagePersistent:gameStorage.durable,
  historyCount() {
    try { return summarizeMatches(readHistory(gameStorage)).completed; } catch { return null; }
  },
});
appShell = mountAppShell({
  startMatch:startLocalMatch,
  historyCount() {
    try { return summarizeMatches(readHistory(gameStorage)).completed; } catch { return null; }
  },
  storagePersistent: gameStorage.durable,
  hasCorruptMatch(){return Boolean(corruptMatchRaw);},
  saveAndExitCurrentMatch(){
    return finalizeOfflineExit({
      isOnline:()=>Boolean(online?.active),
      isDurable:()=>gameStorage.durable !== false,
      prepare(){
        updateClock();
        const started=state.preset !== undefined || state.game.history().length > 0;
        if(started && !outcome(state.game)){
          stopComputer();
          state.paused=true;
        }
      },
      persist(){
        const saved=save();
        render();
        return saved;
      },
      flush:()=>gameStorage.flush(),
    });
  },
  async preparePwaUpdate(){
    if (online?.active && !online.match.outcome) {
      return {ok:false,reason:'Finish your private online match before applying an update.'};
    }
    const started = state.preset !== undefined || state.game.history().length > 0;
    if (started && !outcome(state.game)) {
      return {ok:false,reason:'Finish or resign the active local match before updating. Your game remains safe.'};
    }
    if (gameStorage.durable === false) {
      return {ok:false,reason:'This browser cannot persist local games. Finish this temporary session before reloading.'};
    }
    updateClock();
    save();
    try {
      await gameStorage.flush?.();
      return {ok:true};
    } catch {
      return {ok:false,reason:'The latest game save was not committed. Do not reload; export a backup and retry.'};
    }
  },
  readSavedHistory(){ return readHistory(gameStorage); },
  writeSavedHistory(entries){ return commitHistoryReplacement(gameStorage,historyKey,entries); },
  async clearCompletedHistory(){
    gameStorage.setItem(historyKey,'[]');
    if(gameStorage.durable !== false)await gameStorage.flush?.();
    return {durable:gameStorage.durable !== false};
  },
  resignCurrentMatch(){
    updateClock();
    if(online?.active || outcome(state.game) || (state.preset === undefined && !state.game.history().length))return false;
    const side=state.mode==='computer'?state.playerSide:state.game.turn();
    if(!confirm('Resign as '+(side==='w'?'White':'Black')+'? This will end your current match.'))return false;
    stopComputer();
    state.paused=false;
    state.resignedBy=side;
    save();render();
    return true;
  },
  pauseCurrentMatch(){
    updateClock();
    if(online?.active || outcome(state.game) || (state.preset === undefined && !state.game.history().length))return false;
    if(state.paused)return true;
    stopComputer();state.paused=true;save();render();return true;
  },
  resumeCurrentMatch(){
    if(online?.active || !state.paused)return false;
    state.paused=false;tickAt=performance.now();save();render();playComputer();return true;
  },
  getMatchSummary(){
    return {
      outcome:outcome(state.game),mode:state.mode,
      online:Boolean(online?.active),difficulty:state.difficulty,
      playerSide:state.playerSide,moves:state.game.history().length,paused:state.paused,
      started:Boolean(online?.active) || state.preset !== undefined || state.game.history().length > 0,
    };
  },
});
if (corruptMatchRaw) appShell.go('recovery');
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
  updateClock();
  if (document.hidden && state.clock) save();
});
window.addEventListener('pagehide', () => {
  updateClock();
  if (state.clock) save();
});


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
      renderPieceArt(cell,piece,names);
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
    if (!corruptMatchRaw) save();
    downloadFile(exportBackup(gameStorage), corruptMatchRaw ? 'global-chess-recovery-unvalidated.json' : 'global-chess-backup.json', 'application/json');
  } catch {
    if (corruptMatchRaw) {
      try {
        downloadFile(JSON.stringify({
          source:'raw-browser-storage',
          warning:'Unvalidated recovery material. Do not import directly without repairing.',
          match:corruptMatchRaw,
          historyRaw:gameStorage.getItem(historyKey),
        },null,2),'global-chess-raw-recovery.json','application/json');
        backupStatus.textContent = 'Exported unvalidated raw recovery data. No saved match was overwritten.';
        return;
      } catch { /* Continue to explicit failure status below. */ }
    }
    backupStatus.textContent = 'Backup could not be exported. Existing storage was not cleared.';
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
  if (!file) return;
  try {
    if (file.size > 2_000_000) throw new Error('Backup too large');
    const contents = await file.text();
    if (online?.active) throw new Error('Online match in progress');
    const {summary} = previewBackup(contents);
    const summaryText = 'Validated backup: ' + summary.historyCount + ' completed games, ' +
      summary.activePly + ' half-moves in ' + summary.activeMode + ' mode.\\n\\n' +
      'Replace this device’s current match and local history? Export a copy first if needed.';
    if (!confirm(summaryText)) { backupStatus.textContent = 'Import cancelled. Existing games were not changed.'; return; }
    const restored = importBackup(gameStorage, contents);
    stopComputer();
    state = restored;
    corruptMatchRaw = undefined;
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

bindLearning(names);
window.addEventListener('chess-appearance-changed', () => render());

window.addEventListener('chess-storage-error', () => {
  notice = 'Could not write the game save.';
  render();
});
}
// SCR-00/27: never leave a silent blank screen when initialization fails.
// This recovery surface uses plain DOM; it still works if the premium UI fails.
initialize().then(() => {
  document.querySelector('#launch').hidden = true;
}).catch(() => {
  document.querySelector('#launch').hidden = true;
  const fallback=document.createElement('section');
  fallback.id='ch-boot-recovery';
  fallback.setAttribute('role','alert');
  fallback.setAttribute('aria-labelledby','ch-boot-title');
  const symbol=document.createElement('img');
  symbol.src='/icon.svg';symbol.alt='';symbol.width=76;symbol.height=76;
  const title=document.createElement('h1');
  title.id='ch-boot-title';title.textContent='Your chess game could not open';
  const description=document.createElement('p');
  description.textContent='A local asset or saved-game initialization failed. Your existing browser data has not been erased.';
  const retry=document.createElement('button');
  retry.type='button';retry.textContent='Retry opening chess';
  retry.onclick=()=>location.reload();
  const rescue=document.createElement('button');
  rescue.type='button';rescue.textContent='Export accessible raw match save';
  const status=document.createElement('p');
  status.setAttribute('role','status');
  rescue.onclick=()=>{
    try {
      const raw=localStorage.getItem(key);
      if (!raw) {status.textContent='No accessible localStorage match was found. IndexedDB data is not modified.';return;}
      const file=new Blob([JSON.stringify({source:'localStorage',match:raw},null,2)],{type:'application/json'});
      const url=URL.createObjectURL(file);
      const link=document.createElement('a');
      link.href=url;link.download='global-chess-recovery-raw.json';
      document.body.append(link);link.click();link.remove();
      setTimeout(()=>URL.revokeObjectURL(url),2000);
      status.textContent='Raw localStorage match export requested. This is a recovery copy, not a validated import backup.';
    } catch {
      status.textContent='Browser storage is inaccessible. Do not clear site data before troubleshooting.';
    }
  };
  fallback.append(symbol,title,description,retry,rescue,status);
  document.body.append(fallback);
  retry.focus();
});
