import test from 'node:test';
import assert from 'node:assert/strict';
import {progressKey,readProgress,recordExercise,migrateLegacyProgress,progressSummary} from '../src/progression.js';
const lessons=[{id:'center'},{id:'castle'}];
const puzzles=[{id:'fork'},{id:'mate'}];
const storage=()=>{
  const map=new Map();
  return {getItem:key=>map.get(key)??null,setItem:(key,value)=>map.set(key,value),removeItem:key=>map.delete(key)};
};

test('offline XP events are idempotent under repeated completions',()=>{
  const db=storage();
  assert.equal(recordExercise(db,{kind:'lesson',exerciseId:'center'}),true);
  assert.equal(recordExercise(db,{kind:'lesson',exerciseId:'center'}),false);
  assert.equal(recordExercise(db,{kind:'puzzle',exerciseId:'fork'}),true);
  const summary=progressSummary(readProgress(db.getItem(progressKey)),lessons,puzzles);
  assert.equal(summary.xp,20);
  assert.equal(summary.lessonsSolved,1);
  assert.equal(summary.puzzlesSolved,1);
  assert.deepEqual(summary.achievements,['First solve']);
  assert.equal(readProgress(db.getItem(progressKey)).events.length,2);
});

test('daily exercises are awarded exactly once for each date, not each launch',()=>{
  const db=storage();
  assert.equal(recordExercise(db,{kind:'daily',exerciseId:'daily-2026-11-19'}),true);
  assert.equal(recordExercise(db,{kind:'daily',exerciseId:'daily-2026-11-19'}),false);
  assert.equal(recordExercise(db,{kind:'daily',exerciseId:'daily-2026-11-20'}),true);
  const summary=progressSummary(readProgress(db.getItem(progressKey)),lessons,puzzles);
  assert.equal(summary.dailySolved,2);
  assert.equal(summary.xp,30);
});

test('old local practice progress migrates once without losing any solved entries',()=>{
  const db=storage();
  const raw=JSON.stringify(['center','fork','center','daily-2026-11-19','unknown']);
  assert.equal(migrateLegacyProgress(db,raw,lessons,puzzles),3);
  assert.equal(migrateLegacyProgress(db,raw,lessons,puzzles),0);
  const s=progressSummary(readProgress(db.getItem(progressKey)),lessons,puzzles);
  assert.equal(s.xp,35);
  assert.equal(s.achievements.includes('First solve'),true);
});

test('malformed, duplicate and falsified progress journals cannot become XP',()=>{
  const db=storage();
  db.setItem(progressKey,JSON.stringify({version:1,events:[
    {kind:'lesson',exerciseId:'center'},
    {kind:'lesson',exerciseId:'center'},
  ]}));
  assert.throws(()=>readProgress(db.getItem(progressKey)),/Duplicate/);
  assert.throws(()=>recordExercise(db,{kind:'puzzle',exerciseId:'mate'}),/Duplicate/);
  assert.throws(()=>recordExercise(storage(),{kind:'daily',exerciseId:'daily-NOT-A-DATE'}));
  assert.throws(()=>readProgress(JSON.stringify({version:1,events:[{kind:'lesson',exerciseId:'center',xp:99999}]})));
});

import {recordExerciseCommitted,currentProgressReport} from '../src/progression.js';

test('progress waits for committed write and awards an exercise once',async()=>{
 const db=storage();
 db.durable=true;
 let release;
 const latch=new Promise(resolve=>{release=resolve;});
 db.flush=()=>latch;
 let settled=false;
 const pending=recordExerciseCommitted(db,{kind:'lesson',exerciseId:'center'}).then(x=>{settled=true;return x;});
 await Promise.resolve();
 assert.equal(settled,false);
 release();
 assert.deepEqual(await pending,{awarded:true,persisted:true});
 assert.deepEqual(await recordExerciseCommitted(db,{kind:'lesson',exerciseId:'center'}),{awarded:false,persisted:true});
 assert.equal(currentProgressReport(db,lessons,puzzles).xp,10);
});

test('transaction abort is not counted as a completed exercise',async()=>{
 const db=storage(), before=db.getItem(progressKey);
 db.durable=true;
 let calls=0;
 db.flush=async()=>{if(++calls===1)throw Error('IDB AbortError');};
 await assert.rejects(recordExerciseCommitted(db,{kind:'puzzle',exerciseId:'fork'}),/could not be durably committed/);
 assert.equal(db.getItem(progressKey),before);
 assert.equal(currentProgressReport(db,lessons,puzzles).xp,0);
});

test('session-only storage does not masquerade as durable XP',async()=>{
 const db=storage();
 db.durable=false;
 const result=await recordExerciseCommitted(db,{kind:'daily',exerciseId:'daily-2026-11-22'});
 assert.deepEqual(result,{awarded:true,persisted:false});
 assert.equal(currentProgressReport(db,lessons,puzzles).persisted,false);
});

test('corrupted progression does not silently become zero XP and overwrite evidence',async()=>{
 const db=storage();
 db.setItem(progressKey,'{broken json');
 assert.throws(()=>currentProgressReport(db,lessons,puzzles));
 assert.equal(db.getItem(progressKey),'{broken json');
});
