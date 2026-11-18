import test from 'node:test';
import assert from 'node:assert/strict';
import {exportBackup, importBackup, matchKey} from '../src/backup.js';
import {restoreGame, serializeGame} from '../src/game.js';

test('backup restores active position and malformed imports preserve it', () => {
  const values = new Map();
  const storage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key,value) => values.set(key,value),
    removeItem: key => values.delete(key),
  };
  const {game} = restoreGame();
  game.move('e4');
  storage.setItem(matchKey, serializeGame(game,'local'));
  const backup = exportBackup(storage);
  values.clear();
  assert.equal(importBackup(storage,backup).game.fen(),game.fen());
  const invalid = JSON.parse(backup);
  invalid.history = [{outcome:'Draw',snapshot:'bad'}];
  assert.throws(() => importBackup(storage,JSON.stringify(invalid)));
  assert.equal(exportBackup(storage),backup);
});
