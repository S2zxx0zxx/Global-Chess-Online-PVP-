import test from 'node:test';
import assert from 'node:assert/strict';
import {Chess} from 'chess.js';
import {chooseComputerMove} from '../src/computer.js';

test('bot yields only legal moves despite node-budget exhaustion',()=>{
  const game=new Chess();
  let elapsed=0;
  const before=game.fen();
  const move=chooseComputerMove(before,'hard',{now:()=>++elapsed,maxNodes:4,budgetMs:20});
  assert.ok(move);
  assert.ok(game.moves({verbose:true}).some(candidate=>
    candidate.from===move.from && candidate.to===move.to && candidate.promotion===move.promotion));
  assert.equal(game.fen(),before);
});

test('bot handles tight wall-clock budget without unbounded thinking',()=>{
  const game=new Chess();
  let observed=0;
  const move=chooseComputerMove(game.fen(),'hard',{now:()=>++observed,budgetMs:20,maxNodes:1000});
  assert.ok(move);
  assert.ok(observed<=100,'Search should stop after deadline instead of unlimited CPU work');
  assert.notEqual(game.move(move),null);
});
