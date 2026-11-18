import test from 'node:test';
import assert from 'node:assert/strict';
import {Chess} from 'chess.js';
import {restoreGame, serializeGame} from '../src/game.js';

test('v1 saves preserve a terminal offline resignation and chosen side', () => {
  const chess = new Chess();
  chess.move('e4');
  const raw = serializeGame(chess,'computer',undefined,null,'easy',undefined,'untimed','b','b');
  const result = restoreGame(raw);
  assert.equal(result.resignedSide,'b');
  assert.equal(result.humanSide,'b');
  assert.deepEqual(result.game.history(),['e4']);
});

test('invalid or contradictory terminal saved states are rejected', () => {
  const chess = new Chess();
  assert.throws(() => serializeGame(chess,'local',undefined,null,'standard',undefined,'untimed','w','invalid'));
  assert.throws(() => serializeGame(chess,'local','threefold repetition',null,'standard',undefined,'untimed','w','w'));
  const raw = serializeGame(chess,'local');
  assert.throws(() => restoreGame(raw.replace('"version":1','"version":2')));
  assert.throws(() => restoreGame(raw.replace('"moves":[]','"moves":[],"resignedSide":"wrong"')));
});
