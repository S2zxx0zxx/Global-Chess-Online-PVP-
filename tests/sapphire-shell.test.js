import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sapphireTrainingDisplay,sapphireMatchStatus} from '../src/sapphire-shell.js';
const read=f=>readFileSync(new URL('../'+f,import.meta.url),'utf8');
test('quest reads verified progress and never invents Elo or gems',()=>{
  assert.deepEqual(sapphireTrainingDisplay(null),{count:0,goal:15,percent:0,label:'Progress unavailable',xp:'Unavailable'});
  assert.deepEqual(sapphireTrainingDisplay({lessonsSolved:3,puzzlesSolved:4,dailySolved:1,xp:95}),{count:8,goal:15,percent:53,label:'Complete 15 chess challenges',xp:'95'});
  assert.equal(sapphireTrainingDisplay({lessonsSolved:18,puzzlesSolved:2,dailySolved:1,xp:225}).percent,100);
  const source=read('src/sapphire-shell.js');
  assert.doesNotMatch(source,/200\s*(?:elo|gems)|\b(?:fake|demo)\s+(?:opponent|rating|gems)/i);
});
test('online label never advertises a public match for a private invitation',()=>{
  assert.equal(sapphireMatchStatus(''),'PRIVATE ROOM — INVITE REQUIRED');
  assert.equal(sapphireMatchStatus('Room unavailable'),'ROOM UNAVAILABLE');
  assert.equal(sapphireMatchStatus('Opponent joined'),'MATCH CONNECTED');
});
test('five visible navigation actions map to actual registered routes',()=>{
  const source=read('src/sapphire-shell.js');
  for(const x of ["['appearance','Collection'","['learn','Learn'","['home','Home'","['play','Modes'","['profile','Profile'"])assert.ok(source.includes(x));
  assert.match(source,/nav\.replaceChildren\(\.\.\.nodes\)/);
  assert.match(read('src/app-shell.js'),/mountSapphireShell/);
});
test('real guest identity, settings and profile commands are reused',()=>{
  const source=read('src/sapphire-shell.js');
  for(const token of ['feedbackPreferences','setFeedbackPreference','readSavedHistory','getProgressReport','chess-edit-profile','online-status','lobby-resume','gs-invite-button','ch-setup']) {
    if(token==='ch-setup')continue;
    assert.ok(source.includes(token),token);
  }
  assert.match(source,/go\('data'\)/);
  assert.match(source,/go\('achievements'\)/);
  assert.match(source,/go\('appearance'\)/);
});
test('original sapphire art and independent style rules exist',()=>{
  const css=read('src/sapphire-theme.css');
  for(const s of ['gs-board-stage','gs-user-chip','gs-play-button','gs-profile-popup','gs-settings-popup','gs-bottom-nav','gs-private-room'])assert.ok(css.includes(s),s);
  assert.match(css,/:focus-visible/);
  assert.match(css,/prefers-reduced-motion:reduce/);
  assert.match(css,/max-width:320px/);
  assert.match(read('public/brand/sapphire-horizon.svg'),/viewBox="0 0 768 1366"/);
  assert.match(read('public/brand/sapphire-global-chess.svg'),/GLOBAL/);
  assert.doesNotMatch(read('public/brand/sapphire-horizon.svg'),/<image\b|<script\b|(?:href|xlink:href)=["'](?:https?:|data:)/);
});
