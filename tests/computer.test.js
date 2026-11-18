import test from 'node:test';
import assert from 'node:assert/strict';
import { Chess } from 'chess.js';
import { chooseComputerMove } from '../src/computer.js';
import { restoreGame, serializeGame } from '../src/game.js';

test('all difficulty levels return legal moves with a bounded fallback', () => {
  const game = new Chess();
  game.move('e4');
  for (const level of ['easy','standard','hard']) {
    const move = chooseComputerMove(game.fen(),level);
    assert.ok(game.move(move));
    game.undo();
  }
  assert.ok(game.move(chooseComputerMove(game.fen(),'hard',{budgetMs:0})));
});

test('hard recognizes mate and survives save and reload', () => {
  const game = new Chess();
  for (const move of ['f3','e5','g4']) game.move(move);
  game.move(chooseComputerMove(game.fen(),'hard'));
  assert.equal(game.isCheckmate(),true);
  assert.equal(restoreGame(serializeGame(game,'computer',undefined,null,'hard')).difficulty,'hard');
});
