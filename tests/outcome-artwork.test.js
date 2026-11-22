import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {outcomeArtwork} from '../src/outcome-artwork.js';
const local=path=>readFileSync(new URL('../public'+path,import.meta.url),'utf8');
test('result decoration is driven by actual adjudicated outcome text',()=>{
  assert.equal(outcomeArtwork('White wins by checkmate'),'/brand/royal-victory.svg');
  assert.equal(outcomeArtwork('Draw by repetition'),'/brand/royal-draw.svg');
  assert.equal(outcomeArtwork('Draw (stalemate)'),'/brand/royal-draw.svg');
  assert.equal(outcomeArtwork('Time expired'),'/brand/royal-versus.svg');
  assert.equal(outcomeArtwork(''),null);
  assert.equal(outcomeArtwork(undefined),null);
});
test('all result ornaments use the project-original artwork family',()=>{
 for(const message of ['White wins','Draw','Game terminated']){
  const file=outcomeArtwork(message);
  assert.match(local(file),/<svg/);
 }
});
