import test from 'node:test';
import assert from 'node:assert/strict';
import {Chess} from 'chess.js';
import {serializeGame} from '../src/game.js';
import {summarizeLocalHistory} from '../src/profile-stats.js';

const entry = (outcome, mode = 'computer', humanSide = 'w') => ({
  outcome,
  snapshot:serializeGame(new Chess(),mode,undefined,null,'easy',undefined,'untimed',humanSide),
});

test('profile computes only real computer wins and streak from latest saved history', () => {
  const newestFirst = [
    entry('White wins by checkmate'),
    entry('Black wins on time'),
    entry('White wins by checkmate'),
    entry('White wins by checkmate'),
    entry('White wins by checkmate','local'),
  ];
  const s = summarizeLocalHistory(newestFirst);
  assert.equal(s.saved,5);
  assert.equal(s.computer,4);
  assert.equal(s.wins,3);
  assert.equal(s.losses,1);
  assert.equal(s.draws,0);
  assert.equal(s.winRate,75);
  assert.equal(s.currentWinStreak,1);
  assert.equal(s.bestWinStreak,2);
});

test('player choosing Black is credited only for Black wins, malformed data does not invent stats', () => {
  const s = summarizeLocalHistory([
    entry('Black wins by resignation','computer','b'),
    entry('Draw by threefold repetition','computer','b'),
    {outcome:'Not a valid outcome',snapshot:'not json'},
  ]);
  assert.equal(s.computer,2);
  assert.equal(s.wins,1);
  assert.equal(s.draws,1);
  assert.equal(s.winRate,50);
  assert.equal(s.currentWinStreak,1);
  assert.equal(s.skipped,1);
  assert.throws(()=>summarizeLocalHistory(null));
});
