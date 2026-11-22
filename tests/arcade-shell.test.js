import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {previewCells,safeMatchLabel} from '../src/arcade-shell.js';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('decorative royal chessboard uses 64 squares and 32 initial pieces',()=>{
  const cells=previewCells();
  assert.equal(cells.length,64);
  assert.equal(cells.filter(x=>x.piece).length,32);
  assert.equal(cells.filter(x=>x.side==='white').length,16);
  assert.equal(cells.filter(x=>x.side==='black').length,16);
  assert.equal(cells.filter(x=>x.light).length,32);
  assert.equal(cells[4].piece,'king');
  assert.equal(cells[60].piece,'king');
  assert.equal(cells[8].piece,'pawn');
});
test('arena label only describes real match modes',()=>{
  assert.equal(safeMatchLabel(null),'CHESS ARENA');
  assert.equal(safeMatchLabel({mode:'computer'}),'VS COMPUTER');
  assert.equal(safeMatchLabel({mode:'local'}),'LOCAL TWO-PLAYER');
  assert.equal(safeMatchLabel({online:true}),'PRIVATE ONLINE ARENA');
});
test('arcade shell retains old command authority and legacy element IDs',()=>{
  const source=read('src/arcade-shell.js');
  for(const marker of ['lobby-online','lobby-resume','ch-profile-title','ch-match-toolbar','chess-match-view-shown']) assert.ok(source.includes(marker),marker);
  assert.doesNotMatch(source,/new Chess\(|fetch\(|WebSocket\(|window\.location\s*=|localStorage\.setItem\(/);
  assert.match(read('src/app-shell.js'),/mountArcadeShell/);
});
test('original game layout is a structural, responsive rebuild',()=>{
  const css=read('src/arcade-shell.css');
  for(const name of ['gc-royal-stage','gc-preview-board','gc-battle-card','gc-explore-grid','gc-hub-hero','gc-profile-hero','gc-match-ribbon'])
    assert.ok(css.includes(name),name);
  assert.match(css,/prefers-reduced-motion/);
  assert.match(css,/max-width:329px/);
  assert.match(css,/:focus-visible/);
  assert.match(read('src/main.js'),/arcade-shell\.css/);
});
