import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync,readdirSync} from 'node:fs';
import {ORIGINAL_ROYAL_ART} from '../src/original-royal-art.js';
const read=(path)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('original royal catalog is complete, uniquely named and all files exist',()=>{
  assert.equal(ORIGINAL_ROYAL_ART.length,45);
  const seen=new Set();
  for(const asset of ORIGINAL_ROYAL_ART){
    assert.match(asset.id,/^[a-z][a-z-]*$/);
    assert.ok(!seen.has(asset.id),'duplicate art asset: '+asset.id);
    seen.add(asset.id);
    assert.equal(asset.src,'/brand/royal-'+asset.id+'.svg');
    const file='public'+asset.src;
    const source=read(file);
    assert.match(source,/^<svg[^>]+viewBox="0 0 512 512"/);
    assert.match(source,/<defs>/);
    assert.match(source,/<\/svg>\s*$/);
    assert.ok(source.length>600 && source.length<12000,asset.id+' art asset byte budget');
    assert.doesNotMatch(source,/<(?:script|foreignObject|image|iframe)\b|(?:href|xlink:href)=["'](?:https?:|data:)|@import/i);
  }
});
test('every royal SVG in public/brand is registered',()=>{
  const listed=readdirSync(new URL('../public/brand/',import.meta.url))
    .filter(name=>/^royal-.*\.svg$/.test(name)).sort();
  const expected=ORIGINAL_ROYAL_ART.map(a=>a.src.split('/').at(-1)).sort();
  assert.deepEqual(listed,expected);
});
test('every royal asset used by CSS resolves to a local SVG',()=>{
  const css=read('src/original-royal.css');
  const paths=[...css.matchAll(/url\(['"]?(\/brand\/royal-[a-z-]+\.svg)/g)].map(match=>match[1]);
  assert.ok(paths.length>=20,'At least twenty screen-to-asset references are expected');
  const allowed=new Set(ORIGINAL_ROYAL_ART.map(a=>a.src));
  for(const path of paths) assert.ok(allowed.has(path),'Unregistered reference '+path);
});
test('screen styling and tap accessibility guardrails remain in the final import',()=>{
  const main=read('src/main.js');
  const css=read('src/original-royal.css');
  assert.ok(main.indexOf("import './original-royal.css';")>main.indexOf("import './profile.css';"));
  for(const name of ['#lobby','.ch-mode-card','.ch-learn-tile','#ch-profile-hub','.ch-tab-bar','.player-panel','#board','.ch-extra-screen','#welcome-dialog','#versus']) assert.ok(css.includes(name),'Missing styled surface '+name);
  assert.match(css,/:focus-visible/);
  assert.match(css,/prefers-reduced-motion:reduce/);
  assert.match(css,/prefers-contrast:more/);
  assert.match(css,/env\(safe-area-inset-bottom/);
});
