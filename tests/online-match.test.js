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

test('25 isolated room states complete matches for 50 seats', async () => {
  await Promise.all(Array.from({length:25}, (_, index) => {
    const startedAt = 1000 + index;
    let match = startMatch(createMatch(), startedAt);
    for (const [side,from,to] of [
      ['w','f2','f3'],['b','e7','e5'],['w','g2','g4'],['b','d8','h4'],
    ]) {
      const update = applyMove(match, side, {from,to,expectedVersion:match.version}, startedAt + match.version);
      assert.equal(update.error, undefined);
      match = update.match;
    }
    assert.equal(match.outcome, 'Black wins by checkmate');
    assert.equal(match.moves.length, 4);
  }));
});
