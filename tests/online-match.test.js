import test from 'node:test';
import assert from 'node:assert/strict';
import {createMatch,startMatch,applyMove,advanceClock} from '../server/match.js';

test('server charges elapsed time and rejects stale or unauthorized moves', () => {
  const match = startMatch(createMatch(), 1000);
  const command = {from:'e2',to:'e4',expectedVersion:match.version};
  assert.equal(applyMove(match,'b',command,2000).error,'Not your turn');
  const {match:next} = applyMove(match,'w',command,3000);
  assert.equal(next.clock.w,298000);
  assert.equal(next.clock.b,300000);
  assert.equal(next.moves.length,1);
  assert.equal(applyMove(next,'w',command,3001).error,'Position changed');
});

test('server settles expired matches before accepting a move', () => {
  const match = startMatch(createMatch(),1000);
  assert.equal(advanceClock(match,300999),match);
  const result = applyMove(match,'w',{from:'e2',to:'e4',expectedVersion:1},301000);
  assert.equal(result.match.outcome,'Black wins on time');
  assert.equal(result.match.clock.w,0);
  assert.equal(result.match.moves.length,0);
  assert.equal(advanceClock(result.match,302000),result.match);
});
