import test from 'node:test';
import assert from 'node:assert/strict';
import {Chess} from 'chess.js';
import {restoreGame,serializeGame,result} from '../src/game.js';

// Bound, deterministic legal-move tree. No network or opaque rating labels.
function perft(game,depth) {
 if(depth===0)return 1;
 let nodes=0;
 for(const move of game.moves({verbose:true})){
   const before=game.fen();
   game.move(move);
   nodes+=perft(game,depth-1);
   game.undo();
   assert.equal(game.fen(),before,'search corrupted the original board');
 }
 return nodes;
}
test('standard legal game tree remains 20 / 400 / 8902 nodes at depths 1..3',()=>{
 const game=new Chess();
 for(const [depth,count] of [[1,20],[2,400],[3,8902]]){
   assert.equal(perft(game,depth),count);
   assert.equal(game.fen(),new Chess().fen());
 }
});

test('castling and en passant are legal and replay to identical serialized board',()=>{
 const castles=new Chess('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');
 assert.ok(castles.moves().includes('O-O'));
 assert.ok(castles.moves().includes('O-O-O'));
 const original=castles.fen();
 castles.move('O-O');castles.undo();
 assert.equal(castles.fen(),original);
 const ep=new Chess('8/8/8/3pP3/8/8/8/K6k w - d6 0 1');
 assert.ok(ep.moves().includes('exd6'));
 ep.move('exd6');
 assert.equal(ep.get('d5'),undefined);
 assert.equal(ep.get('d6')?.type,'p');
});

test('all four pawn promotions are legal, choose only an explicit piece',()=>{
 const game=new Chess('7k/P7/8/8/8/8/8/K7 w - - 0 1');
 const from=game.fen();
 for(const promote of ['q','r','b','n']){
   game.move({from:'a7',to:'a8',promotion:promote});
   assert.equal(game.get('a8')?.type,promote);
   game.undo();assert.equal(game.fen(),from);
 }
});

test('a completed mate cannot be resumed by appending an extra move',()=>{
 const game=new Chess();
 for(const m of ['f3','e5','g4','Qh4#'])game.move(m);
 assert.equal(result(game),'Black wins by checkmate');
 const raw=serializeGame(game,'local');
 assert.equal(restoreGame(raw).game.fen(),game.fen());
 const tampered=JSON.parse(raw);
 tampered.moves.push({from:'e2',to:'e4'});
 assert.throws(()=>restoreGame(JSON.stringify(tampered)));
});
