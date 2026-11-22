import {createHash} from 'node:crypto';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {Chess} from 'chess.js';
import {lessons,puzzles,exerciseGame,solveExercise} from '../src/learning.js';

const ids=new Set();
const manifest={version:1,lessons:lessons.length,puzzles:puzzles.length,validated:[],sourceReview:'Original authorship and distribution-license human sign-off remain required'};
let failures=0;
for (const [kind,entries] of [['lesson',lessons],['puzzle',puzzles]]) {
  for (const item of entries) {
    try {
      if(!item || typeof item.id!=='string' || !/^[a-z0-9-]{1,80}$/.test(item.id)
         || ids.has(item.id) || !item.title || !item.prompt || !item.explanation) {
        throw new Error('Invalid/duplicate exercise metadata');
      }
      ids.add(item.id);
      const game=exerciseGame(item);
      if(!(game instanceof Chess) || !game.isValid?.()) {
        // chess.js constructor throws on invalid FEN; a current in-play game is expected.
        if(!game?.fen()) throw new Error('Exercise FEN failed');
      }
      const legal=game.moves({verbose:true});
      if(!legal.length) throw new Error('Exercise has no legal moves');
      const solving=legal.filter(move => {
        return Boolean(solveExercise(game,item,move.from,move.to,move.promotion));
      });
      if(solving.length<1) throw new Error('No valid one-move completion found');
      if(!item.mate && solving.length>1) throw new Error('Ambiguous short-answer puzzle');
      manifest.validated.push({kind,id:item.id,legalMoves:legal.length,solutions:solving.length});
    } catch(error) {
      failures++;
      console.error('Exercise audit failed:',kind,item?.id,error?.message);
    }
  }
}
manifest.sourceSha256={
  learning: createHash('sha256').update(readFileSync('src/learning.js')).digest('hex'),
  learningPack: createHash('sha256').update(readFileSync('src/learning-pack.js')).digest('hex'),
};
mkdirSync('artifacts',{recursive:true});
writeFileSync('artifacts/learning-audit.json',JSON.stringify(manifest,null,2)+'\n');
if(failures>0) throw new Error('Rejected '+failures+' invalid exercises');
if(lessons.length!==12 || puzzles.length!==30) throw new Error('ZIP v3 starter content count mismatch');
console.log('Validated',lessons.length,'interactive lessons and',puzzles.length,'offline puzzles');
