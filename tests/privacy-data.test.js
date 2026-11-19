import test from 'node:test';
import assert from 'node:assert/strict';
import {exportLocalUserData,deleteLocalUserData,preferencesKey,privateSeatKey} from '../src/privacy-data.js';
import {matchKey,historyKey} from '../src/backup.js';
import {progressKey} from '../src/progression.js';

function stores(){
  const db=new Map([[matchKey,'game'],[historyKey,'[]'],[progressKey,'{"version":1,"events":[]}']]);
  const ls=new Map([[preferencesKey,'{"name":"Guest"}'],[privateSeatKey,'sensitive-room-token']]);
  let flushCount=0;
  return {
    db,ls,
    storage:{
      getItem:key=>db.get(key)??null,
      removeItem:key=>db.delete(key),
      async flush(){flushCount++;},
    },
    local:{
      getItem:key=>ls.get(key)??null,
      removeItem:key=>ls.delete(key),
    },
    get flushed(){return flushCount;},
  };
}

test('local archive includes player data but never bearer room credentials',()=>{
  const item=stores();
  const json=exportLocalUserData(item.storage,item.local);
  const archive=JSON.parse(json);
  assert.equal(archive.savedMatch,'game');
  assert.equal(archive.learningJournal,'{"version":1,"events":[]}');
  assert.equal(archive.format,'global-chess-local-archive-v1');
  assert.equal(json.includes('sensitive-room-token'),false);
});

test('explicit delete awaits IndexedDB flush then clears local credentials and preferences',async()=>{
  const item=stores();
  await deleteLocalUserData(item.storage,item.local);
  assert.equal(item.flushed,1);
  assert.equal(item.db.has(matchKey),false);
  assert.equal(item.db.has(progressKey),false);
  assert.equal(item.ls.has(privateSeatKey),false);
  assert.equal(item.ls.has(preferencesKey),false);
});
