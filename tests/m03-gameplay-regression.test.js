import test from 'node:test';
import assert from 'node:assert/strict';
import {Chess} from 'chess.js';
import {claimableDraw,intendedDraw,restoreGame,serializeGame,result} from '../src/game.js';

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

test('RULE-004 counts 197281 legal nodes at depth four without changing the opening',()=>{
 const game=new Chess();
 const initial=game.fen();
 assert.equal(game.perft(4),197281);
 assert.equal(game.fen(),initial);
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

test('RULE-005/006 reject castling through attack and remove rights when a rook is captured',()=>{
 const attacked=new Chess('4kr2/8/8/8/8/8/8/R3K2R w KQ - 0 1');
 assert.throws(()=>attacked.move('O-O'));
 assert.ok(attacked.moves().includes('O-O-O'));

 const rookCaptured=new Chess('4k2r/8/8/8/8/8/6b1/4K2R b Kk - 0 1');
 rookCaptured.move('Bxh1');
 assert.equal(rookCaptured.fen().split(' ')[2],'k');
 assert.throws(()=>rookCaptured.move('O-O'));

 const originalRooks=new Chess('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');
 for(const move of ['Rh2','Ra7','Rh1','Ra8']) originalRooks.move(move);
 assert.equal(originalRooks.fen().split(' ')[2],'Qk');
 originalRooks.move('Ke2');
 assert.equal(originalRooks.fen().split(' ')[2],'k');
});

test('RULE-007/008 expire en passant and reject it when it exposes the king',()=>{
 const delayed=new Chess('8/8/8/3pP3/8/8/8/K6k w - d6 0 1');
 assert.ok(delayed.moves().includes('exd6'));
 delayed.move('Ka2');
 delayed.move('Kh2');
 assert.throws(()=>delayed.move({from:'e5',to:'d6'}));

 const pinned=new Chess('k3r3/8/8/3pP3/8/8/8/4K3 w - d6 0 1');
 assert.throws(()=>pinned.move({from:'e5',to:'d6'}));
 assert.equal(pinned.get('d5')?.color,'b');
});

test('all four pawn promotions are legal, choose only an explicit piece',()=>{
 const game=new Chess('7k/P7/8/8/8/8/8/K7 w - - 0 1');
 const from=game.fen();
 assert.throws(()=>game.move({from:'a7',to:'a8'}));
 assert.equal(game.fen(),from);
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

test('RULE-009 distinguishes knight underpromotion in SAN and FEN',()=>{
 const game=new Chess('7k/P7/8/8/8/8/8/K7 w - - 0 1');
 assert.equal(game.move({from:'a7',to:'a8',promotion:'n'}).san,'a8=N');
 assert.equal(game.fen(),'N6k/8/8/8/8/8/8/K7 b - - 0 1');
});

test('RULE-011/013/015 distinguish mate, stalemate, the 50-move claim and the 75-move rule',()=>{
 const stalemate=new Chess('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1');
 assert.equal(result(stalemate),'Draw by stalemate');

 const claim=new Chess('7k/8/8/8/8/8/8/KR6 w - - 99 1');
 assert.equal(claimableDraw(claim),null);
 assert.equal(intendedDraw(claim,{from:'b1',to:'b2'}),'50-move rule');
 claim.move('Rb2');
 assert.equal(claimableDraw(claim),'50-move rule');
 assert.equal(result(claim),null);

 const automatic=new Chess('7k/8/8/8/8/8/8/KR6 w - - 149 1');
 assert.equal(result(automatic),null);
 automatic.move('Rb2');
 assert.equal(result(automatic),'Draw by 75-move rule');

 const mate=new Chess('7k/5Q2/6K1/8/8/8/8/8 w - - 149 1');
 mate.move('Qg7#');
 assert.equal(mate.fen().split(' ')[4],'150');
 assert.equal(result(mate),'White wins by checkmate');
});
