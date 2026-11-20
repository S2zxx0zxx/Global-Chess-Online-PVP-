import test from 'node:test';
import assert from 'node:assert/strict';
import {lessons,puzzles,exerciseGame,solveExercise,dailyExercise} from '../src/learning.js';

test('every bundled exercise has a legal solution and preview preserves the position', () => {
  for (const exercise of [...lessons,...puzzles]) {
    const game = exerciseGame(exercise);
    const before = game.fen();
    const moves = game.moves({verbose:true});
    const solved = moves.find(move => solveExercise(game,exercise,move.from,move.to));
    assert.ok(solved,exercise.id);
    assert.equal(game.fen(),before);
    if (exercise.mate) {
      game.move(solved);
      assert.ok(game.isCheckmate());
    }
  }
});

test('daily identity is stable within a UTC date and changes at midnight', () => {
  const first = dailyExercise(new Date('2026-11-18T00:00:00Z'));
  assert.deepEqual(first,dailyExercise(new Date('2026-11-18T23:59:59Z')));
  assert.notEqual(first.id,dailyExercise(new Date('2026-11-19T00:00:00Z')).id);
});
