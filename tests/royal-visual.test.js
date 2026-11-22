import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('original royal design is integrated after existing style layers',()=>{
  const main=read('src/main.js');
  assert.match(main,/import ['"].\/original-royal\.css['"]/);
  assert.ok(main.indexOf("'./original-royal.css'")>main.indexOf("'./board-motion.css'"));
});
test('royal source art exists and is not referenced from a foreign asset pack',()=>{
  const css=read('src/original-royal.css');
  const svg=read('public/brand/original-royal-hall.svg');
  assert.match(css,/original-royal-hall\.svg/);
  assert.match(svg,/<svg/);
  assert.doesNotMatch(css,/(?:sharedassets\d+|vivox|lets.chess|ashforge|\.astc)/i);
  assert.doesNotMatch(svg,/(?:sharedassets\d+|vivox|lets.chess|ashforge)/i);
});
test('accessibility and reduced motion remain explicit',()=>{
  const css=read('src/original-royal.css');
  assert.match(css,/:focus-visible/);
  assert.match(css,/prefers-reduced-motion:reduce/);
  assert.match(css,/prefers-contrast:more/);
});
