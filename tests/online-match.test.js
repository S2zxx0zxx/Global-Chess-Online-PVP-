import test from 'node:test';
import assert from 'node:assert/strict';
import {createMatch,startMatch,applyMove,advanceClock,applyDrawClaim} from '../server/match.js';

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

function playSequence(sequence) {
  let match = startMatch(createMatch(), 1000);
  for (const [from,to] of sequence) {
    const side = match.moves.length % 2 ? 'b' : 'w';
    const response = applyMove(match, side, {from,to,expectedVersion:match.version},1000+match.version);
    assert.equal(response.error,undefined);
    match = response.match;
  }
  return match;
}

test('online draw claims validate seat, revision and intended move', () => {
  const cycle = [['g1','f3'],['g8','f6'],['f3','g1'],['f6','g8']];
  const match = playSequence([...cycle,...cycle.slice(0,3)]);
  const move = {from:'f6',to:'g8'};
  const command = {expectedVersion:match.version,move};
  assert.equal(applyDrawClaim(match,'w',command,2000).error,'Not your turn');
  assert.equal(applyDrawClaim(match,'b',{...command,expectedVersion:0},2000).error,'Position changed');
  assert.equal(applyDrawClaim(match,'b',{...command,move:null},2000).match,match);
  const accepted = applyDrawClaim(match,'b',command,2000).match;
  assert.equal(accepted.outcome,'Draw by threefold repetition');
  assert.deepEqual(accepted.moves,match.moves);
  assert.equal(accepted.version,match.version+1);
  const repeated = playSequence([...cycle,...cycle]);
  assert.equal(applyDrawClaim(repeated,'w',{expectedVersion:repeated.version},2000).match.outcome,
    'Draw by threefold repetition');
});

test('promotion one millisecond before deadline succeeds and at deadline loses', () => {
  const match = playSequence([
    ['a2','a4'],['h7','h5'],['a4','a5'],['h5','h4'],
    ['a5','a6'],['h4','h3'],['a6','b7'],['h3','g2'],
  ]);
  const command = {from:'b7',to:'a8',promotion:'q',expectedVersion:match.version};
  const deadline = match.turnStartedAt + match.clock.w;
  assert.equal(applyMove(match,'w',command,deadline-1).match.moves.at(-1).promotion,'q');
  const expired = applyMove(match,'w',command,deadline);
  assert.equal(expired.match.outcome,'Black wins on time');
  assert.equal(expired.match.moves.length,8);
});
