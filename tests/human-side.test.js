import test from 'node:test';
import assert from 'node:assert/strict';
import {Chess} from 'chess.js';
import {chooseComputerMove} from '../src/computer.js';
import {restoreGame, serializeGame} from '../src/game.js';

test('computer side survives v1 save roundtrip without breaking existing saves', () => {
  const game = new Chess();
  game.move('e4');
  const data = serializeGame(game,'computer',undefined,null,'easy',undefined,'untimed','b');
  const restored = restoreGame(data);
  assert.equal(restored.humanSide,'b');
  assert.equal(restored.game.fen(),game.fen());
  assert.equal(restoreGame(JSON.stringify({version:1,mode:'computer',moves:[]})).humanSide,'w');
  assert.throws(() => restoreGame(data.replace('"humanSide":"b"','"humanSide":"z"')));
});

test('offline computer engine returns legal White moves when user plays Black', () => {
  const position = new Chess();
  for (const level of ['easy','standard','hard']) {
    const move = chooseComputerMove(position.fen(),level,{budgetMs:130});
    assert.ok(move,level);
    assert.equal(position.move(move).color,'w');
    position.undo();
  }
});
