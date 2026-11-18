import test from 'node:test';
import assert from 'node:assert/strict';
import { restoreGame, serializeGame, result, intendedDraw, timeoutResult } from '../src/game.js';

test('restores moves and opponent mode', () => {
  const {game} = restoreGame();
  for (const move of ['e4', 'e5', 'Nf3']) game.move(move);
  const restored = restoreGame(serializeGame(game, 'computer'));
  assert.equal(restored.mode, 'computer');
  assert.equal(restored.game.fen(), game.fen());
  assert.deepEqual(restored.game.history(), game.history());
});

test('rejects an illegal first move in a saved match', () => {
  assert.throws(() => restoreGame(JSON.stringify({
    version: 1, mode: 'local', moves: [{from:'e2',to:'e5'}]
  })));
});

test('detects and restores checkmate', () => {
  const {game} = restoreGame();
  for (const move of ['f3','e5','g4','Qh4#']) game.move(move);
  assert.equal(result(restoreGame(serializeGame(game, 'local')).game), 'Black wins by checkmate');
});

test('threefold is claimable and fivefold automatically ends the game', () => {
  const {game} = restoreGame();
  const cycle = () => ['Nf3','Nf6','Ng1','Ng8'].forEach(move => game.move(move));
  cycle();
  cycle();
  assert.equal(result(game), null);
  const claimed = restoreGame(serializeGame(game, 'local', 'threefold repetition'));
  assert.equal(claimed.drawClaim, 'threefold repetition');
  cycle();
  cycle();
  assert.equal(result(game), 'Draw by fivefold repetition');
});

test('an intended repetition claim survives reload without committing the proposed move', () => {
  const {game} = restoreGame();
  for (const move of ['Nf3','Nf6','Ng1','Ng8','Nf3','Nf6','Ng1']) game.move(move);
  const proposed = {from:'f6',to:'g8'};
  const before = game.fen();
  const claim = intendedDraw(game, proposed);
  assert.equal(claim,'threefold repetition');
  assert.equal(game.fen(),before);
  const restored = restoreGame(serializeGame(game,'local',claim,null,'standard',proposed));
  assert.equal(restored.game.history().length,7);
  assert.equal(restored.drawClaim,claim);
});

test('flag fall against a bare king is a draw', () => {
  const {game} = restoreGame();
  game.load('8/8/8/8/8/2k5/4r3/4K3 w - - 0 1');
  assert.match(timeoutResult(game,'b'),/^Draw on time/);
  assert.equal(timeoutResult(game,'w'),'Black wins on time');
});

test('saved matches retain the original clock preset and bot difficulty', () => {
  const {game} = restoreGame();
  const saved = serializeGame(game, 'computer', undefined, {w:250000,b:240000}, 'easy', undefined, 'quick');
  const restored = restoreGame(saved);
  assert.equal(restored.preset, 'quick');
  assert.equal(restored.difficulty, 'easy');
  assert.deepEqual(restored.clock, {w:250000,b:240000});
  assert.throws(() => restoreGame(saved.replace('"quick"', '"untimed"')));
});

test('timeout proves a closed pawn wall cannot produce mate', () => {
  const {game} = restoreGame();
  game.load('4k3/8/8/p1p1p1p1/P1P1P1P1/8/8/4K3 w - - 0 1');
  assert.match(timeoutResult(game,'w'),/^Draw on time/);
  assert.match(timeoutResult(game,'b'),/^Draw on time/);
  game.load('4k3/8/8/p1p1p3/P1P1P1P1/8/8/4K3 b - - 0 1');
  assert.equal(timeoutResult(game,'b'),'White wins on time');
});

test('a proven dead pawn position ends immediately', () => {
  const {game} = restoreGame();
  game.load('4k3/8/8/p1p1p1p1/P1P1P1P1/8/8/4K3 w - - 0 1');
  assert.equal(result(game),'Draw by dead position');
});
