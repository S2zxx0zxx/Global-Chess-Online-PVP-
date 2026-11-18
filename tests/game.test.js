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
