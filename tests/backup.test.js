import test from 'node:test';
import assert from 'node:assert/strict';
import {exportBackup, importBackup, importBackupDurably, previewBackup, matchKey, historyKey} from '../src/backup.js';
import {restoreGame, serializeGame} from '../src/game.js';
import {progressKey,readProgress} from '../src/progression.js';

test('backup restores active position and malformed imports preserve it', () => {
  const values = new Map();
  const storage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key,value) => values.set(key,value),
    removeItem: key => values.delete(key),
  };
  const {game} = restoreGame();
  game.move('e4');
  storage.setItem(matchKey, serializeGame(game,'local'));
  const backup = exportBackup(storage);
  values.clear();
  assert.equal(importBackup(storage,backup).game.fen(),game.fen());
  const invalid = JSON.parse(backup);
  invalid.history = [{outcome:'Draw',snapshot:'bad'}];
  assert.throws(() => importBackup(storage,JSON.stringify(invalid)));
  assert.equal(exportBackup(storage),backup);
});

test('backup preview reports validated local game counts without mutating storage', () => {
  const {game} = restoreGame();
  game.move('d4');
  const serialized = serializeGame(game,'local');
  const raw = JSON.stringify({version:1,match:serialized,history:[{outcome:'White wins by resignation',snapshot:serialized}]});
  const preview=previewBackup(raw);
  assert.deepEqual(preview.summary,{
    historyCount:1, activePly:1, activeMode:'local', hasActiveMatch:true,
  });
  const oversized = raw + 'x'.repeat(2_000_001);
  assert.throws(()=>previewBackup(oversized),/too large/);
  assert.throws(()=>previewBackup(JSON.stringify({version:1,match:'illegal',history:[]})));
});

const makeStorage=()=>{
 const data=new Map();
 return {
   data,durable:true,
   getItem:key=>data.get(key)??null,
   setItem:(key,value)=>data.set(key,value),
   removeItem:key=>data.delete(key),
   async flush(){},
 };
};

test('v2 backup roundtrip restores genuine XP and does not multiply journal events',async()=>{
 const s=makeStorage();
 const journal={version:1,events:[{kind:'lesson',exerciseId:'center'},{kind:'daily',exerciseId:'daily-2026-11-22'}]};
 s.setItem(progressKey,JSON.stringify(journal));
 const backup=exportBackup(s);
 const preview=previewBackup(backup);
 assert.equal(preview.summary.exerciseEvents,2);
 assert.equal(JSON.parse(backup).version,2);
 s.setItem(progressKey,JSON.stringify({version:1,events:[]}));
 await importBackupDurably(s,backup);
 assert.deepEqual(readProgress(s.getItem(progressKey)),journal);
 assert.equal(JSON.parse(exportBackup(s)).progress.events.length,2);
});

test('v1 backup imports old match/history without destroying new local progress',async()=>{
 const s=makeStorage(),progress={version:1,events:[{kind:'lesson',exerciseId:'center'}]};
 s.setItem(progressKey,JSON.stringify(progress));
 const older=JSON.stringify({version:1,match:null,history:[]});
 assert.equal(previewBackup(older).summary.exerciseEvents,undefined);
 await importBackupDurably(s,older);
 assert.deepEqual(readProgress(s.getItem(progressKey)),progress);
});

test('malformed or forged XP journals are rejected before live match history mutates',async()=>{
 const s=makeStorage();
 s.setItem(historyKey,'[{"outcome":"Existing","snapshot":"not-valid"}]');
 const original=s.getItem(historyKey);
 for(const events of [
  [{kind:'lesson',exerciseId:'center',xp:100000}],
  [{kind:'lesson',exerciseId:'center'},{kind:'lesson',exerciseId:'center'}],
 ]) {
  const fake=JSON.stringify({version:2,match:null,history:[],progress:{version:1,events}});
  await assert.rejects(importBackupDurably(s,fake),/Invalid|Duplicate|unexpected/);
  assert.equal(s.getItem(historyKey),original);
 }
});

test('IDB write failure during v2 import restores all old backup-covered values',async()=>{
 const s=makeStorage();
 const originalProgress=JSON.stringify({version:1,events:[{kind:'puzzle',exerciseId:'back-rank'}]});
 s.setItem(progressKey,originalProgress);
 s.setItem(historyKey,'[]');
 const payload=JSON.stringify({version:2,match:null,history:[],
   progress:{version:1,events:[{kind:'lesson',exerciseId:'center'}]}});
 let writes=0;
 s.flush=async()=>{if(++writes===1)throw Error('AbortError');};
 await assert.rejects(importBackupDurably(s,payload),/not durably restored/);
 assert.equal(s.getItem(progressKey),originalProgress);
 assert.equal(s.getItem(historyKey),'[]');
});

test('backup import refuses to advertise persistence in memory-only mode',async()=>{
 const s=makeStorage();
 s.durable=false;
 const payload=JSON.stringify({version:2,match:null,history:[],progress:{version:1,events:[]}});
 await assert.rejects(importBackupDurably(s,payload),/durable/);
 assert.equal(s.data.size,0);
});

test('backup output refuses to hide corrupt progress with fake zero achievements',()=>{
 const s=makeStorage();
 s.setItem(progressKey,'not valid json');
 assert.throws(()=>exportBackup(s));
 assert.equal(s.getItem(progressKey),'not valid json');
});
