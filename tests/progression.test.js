import test from 'node:test';
import assert from 'node:assert/strict';
import {progressKey,readProgress,recordExercise,migrateLegacyProgress,progressSummary} from '../src/progression.js';
const lessons=[{id:'center'},{id:'castle'}];
const puzzles=[{id:'fork'},{id:'mate'}];
const storage=()=>{
  const map=new Map();
  return {getItem:key=>map.get(key)??null,setItem:(key,value)=>map.set(key,value)};
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
