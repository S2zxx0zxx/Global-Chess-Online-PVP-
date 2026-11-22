import test from 'node:test';
import assert from 'node:assert/strict';
import {Chess} from 'chess.js';
import {chooseComputerMove} from '../src/computer.js';

const captureFen=new Chess().fen();
function isLegal(fen,move){
 const game=new Chess(fen);
 return game.moves({verbose:true}).some(x=>x.from===move.from&&x.to===move.to&&x.promotion===move.promotion);
}

test('node-limited search always returns a legal bounded fallback',()=>{
 for(const level of ['easy','standard','hard','unsupported']){
  const mv=chooseComputerMove(captureFen,level,{maxNodes:1,now:()=>0,budgetMs:20});
  assert.equal(isLegal(captureFen,mv),true,'illegal '+level);
 }
});

test('the wall-time budget still produces a legal move if interrupted immediately',()=>{
 let clock=0;
 const mv=chooseComputerMove(captureFen,'hard',{maxNodes:250000,budgetMs:20,now:()=>clock+=21});
 assert.equal(isLegal(captureFen,mv),true);
});

test('oversized and malformed resource hints cannot create unbounded searches',()=>{
 for(const opts of [{budgetMs:Infinity,maxNodes:Infinity},{budgetMs:-1000,maxNodes:0},{budgetMs:1e10,maxNodes:1}]){
  const mv=chooseComputerMove(captureFen,'hard',{...opts,now:()=>0});
  assert.equal(isLegal(captureFen,mv),true);
 }
});

test('terminal positions return null instead of making up an illegal move',()=>{
 const mate='7k/6Q1/6K1/8/8/8/8/8 b - - 0 1';
 assert.equal(new Chess(mate).isCheckmate(),true);
 assert.equal(chooseComputerMove(mate,'hard'),null);
});

test('a failed deep iteration never poisons the following search state',()=>{
 let ms=0;
 const first=chooseComputerMove(captureFen,'hard',{maxNodes:110,now:()=>ms++});
 const again=chooseComputerMove(captureFen,'hard',{maxNodes:110,now:()=>ms++});
 assert.equal(isLegal(captureFen,first),true);
 assert.equal(isLegal(captureFen,again),true);
});
