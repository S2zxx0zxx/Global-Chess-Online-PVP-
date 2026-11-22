import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import { Chess } from 'chess.js';
import { initializeMateSolver, matingPossibility } from '../src/mate-solver.js';
import { timeoutResult } from '../src/game.js';

test('shared WASM handles mixed-material dead positions and one-sided mating possibilities', async () => {
  const archive = await readFile(new URL('../public/solver/cha.wasm.gz',import.meta.url));
  initializeMateSolver(await WebAssembly.compile(gunzipSync(archive)));
  // Positions from the upstream CHA-Solver test corpus.
  const dead = new Chess('2b1k3/8/8/1p1p1p1p/1P1P1P1P/8/8/2B1K3 w - - 0 1');
  assert.equal(timeoutResult(dead,'w'),'Draw on time by impossible checkmate');
  assert.equal(timeoutResult(dead,'b'),'Draw on time by impossible checkmate');

  const oneSided = new Chess('Bb1k1b2/bKp1p1p1/1pP1P1P1/pP6/6P1/P7/8/8 w - - 0 1');
  assert.equal(matingPossibility(oneSided,'w'),true);
  assert.equal(matingPossibility(oneSided,'b'),false);
  assert.equal(timeoutResult(oneSided,'b'),'White wins on time');
  assert.equal(timeoutResult(oneSided,'w'),'Draw on time by impossible checkmate');
});
