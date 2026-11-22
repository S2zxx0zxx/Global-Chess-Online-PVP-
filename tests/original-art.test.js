import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';

const source=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('the default 2D and 3D board loads project-authored scalable art',()=>{
  const svg=source('public/brand/board-maple-walnut.svg');
  assert.match(svg,/viewBox="0 0 496 496"/);
  assert.equal((svg.match(/<rect x="\d+" y="\d+" width="56" height="56"/g)||[]).length,64);
  assert.match(source('src/style.css'),/brand\/board-maple-walnut\.svg/);
  assert.match(source('src/board3d.js'),/brand\/board-maple-walnut\.svg/);
  assert.doesNotMatch(source('src/style.css')+source('src/board3d.js'),/chess-assets\//);
});

test('12 original SVG piece identities are present and no gameplay defaults to legacy WebP',()=>{
  for(const color of ['white','black']){
    for(const name of ['king','queen','bishop','knight','rook','pawn']){
      const path='public/brand/pieces/piece_'+color+'_'+name+'.svg';
      assert.ok(existsSync(new URL('../'+path,import.meta.url)),path);
      assert.match(source(path),/<svg\s/);
    }
  }
  for(const path of ['src/piece-art.js','src/screen-routes.js']){
    assert.doesNotMatch(source(path),/chess-assets\//);
    assert.doesNotMatch(source(path),/\.webp/);
  }
});

test('service worker does not include or preload unknown-provenance WebP art',()=>{
  const config=source('vite.config.js');
  assert.doesNotMatch(config,/['"]chess-assets\/board\/maple-walnut\.webp['"]/);
  assert.equal(existsSync(new URL('../public/chess-assets/board/maple-walnut.webp', import.meta.url)), false);
});
