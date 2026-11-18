import test from 'node:test';
import assert from 'node:assert/strict';
import { restoreGame, serializeGame, result } from '../src/game.js';

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
