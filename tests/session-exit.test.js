import test from 'node:test';
import assert from 'node:assert/strict';
import {finalizeOfflineExit} from '../src/session-exit.js';

function harness(override = {}) {
  const calls = [];
  return {
    calls,
    actions:{
      isOnline:()=>false,
      isDurable:()=>true,
      prepare:()=>{calls.push('pause');},
      persist:()=>{calls.push('save');return true;},
      flush:async()=>{calls.push('flush');},
      ...override,
    },
  };
}

test('offline Save & Exit pauses, persists and awaits the durable commit', async () => {
  let release;
  const gate=new Promise(resolve=>{release=resolve;});
  const h=harness({flush:async()=>{h.calls.push('flush');await gate;}});
  let settled=false;
  const pending=finalizeOfflineExit(h.actions).then(result=>{settled=true;return result;});
  await Promise.resolve();
  assert.deepEqual(h.calls,['pause','save','flush']);
  assert.equal(settled,false,'navigation must not run while the write is uncommitted');
  release();
  assert.deepEqual(await pending,{ok:true});
});

test('active private room rejects local save without touching chess state', async () => {
  const h=harness({isOnline:()=>true});
  const result=await finalizeOfflineExit(h.actions);
  assert.equal(result.ok,false);
  assert.match(result.reason,/online match/i);
  assert.deepEqual(h.calls,[]);
});

test('a failed snapshot serialization never attempts an IndexedDB flush', async () => {
  const h=harness({persist:()=>{h.calls.push('save');return false;}});
  const result=await finalizeOfflineExit(h.actions);
  assert.equal(result.ok,false);
  assert.deepEqual(h.calls,['pause','save']);
});

test('volatile browser storage is not mislabeled as a saved game', async () => {
  const h=harness({isDurable:()=>false});
  const result=await finalizeOfflineExit(h.actions);
  assert.equal(result.ok,false);
  assert.match(result.reason,/Session-only/);
  assert.deepEqual(h.calls,['pause','save']);
});

test('failed IndexedDB transaction prevents success and keeps game in session', async () => {
  const h=harness({flush:async()=>{h.calls.push('flush');throw Error('QuotaExceededError');}});
  const result=await finalizeOfflineExit(h.actions);
  assert.equal(result.ok,false);
  assert.match(result.reason,/not committed/i);
  assert.deepEqual(h.calls,['pause','save','flush']);
});

test('a browser storage downgrade after flush does not claim durable success', async () => {
  let durable=true;
  const h=harness({isDurable:()=>durable,flush:async()=>{h.calls.push('flush');durable=false;}});
  const result=await finalizeOfflineExit(h.actions);
  assert.equal(result.ok,false);
  assert.match(result.reason,/became unavailable/);
});

test('preparation exceptions fail closed without trying to persist', async () => {
  const h=harness({prepare:()=>{h.calls.push('pause');throw Error('clock error');}});
  const result=await finalizeOfflineExit(h.actions);
  assert.equal(result.ok,false);
  assert.deepEqual(h.calls,['pause']);
});
