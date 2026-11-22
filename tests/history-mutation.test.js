import test from 'node:test';
import assert from 'node:assert/strict';
import {commitHistoryReplacement} from '../src/history-mutation.js';

function memoryStorage(initial='[{"outcome":"draw"}]'){
  let bytes=initial, durable=true;
  const log=[];
  return {log,
    get durable(){return durable;},
    set durable(v){durable=v;},
    getItem(){return bytes;},
    setItem(_key,value){log.push('set');bytes=value;},
    removeItem(){log.push('remove');bytes=null;},
    async flush(){log.push('flush');},
  };
}

test('history deletion resolves only after committed storage flush',async()=>{
  const s=memoryStorage();
  let finish;
  const pending=new Promise(resolve=>{finish=resolve;});
  s.flush=async()=>{s.log.push('flush');await pending;};
  let settled=false;
  const task=commitHistoryReplacement(s,'history',[]).then(()=>{settled=true;});
  await Promise.resolve();
  assert.deepEqual(s.log,['set','flush']);
  assert.equal(settled,false);
  finish();await task;
  assert.equal(s.getItem('history'),'[]');
});

test('failure leaves prior history bytes available and reports uncertainty',async()=>{
  const s=memoryStorage();
  const old=s.getItem('history');
  let calls=0;
  s.flush=async()=>{s.log.push('flush');if(++calls===1)throw Error('AbortError');};
  await assert.rejects(commitHistoryReplacement(s,'history',[]),/not durably confirmed/);
  assert.equal(s.getItem('history'),old);
  assert.equal(calls,2);
});

test('session-only history is never presented as durably erased',async()=>{
  const s=memoryStorage();
  s.durable=false;
  await assert.rejects(commitHistoryReplacement(s,'history',[]),/session-only/);
  assert.deepEqual(s.log,[]);
});

test('downgrade during save restores previous in-memory value',async()=>{
  const s=memoryStorage();
  const old=s.getItem('history');
  s.flush=async()=>{s.log.push('flush');s.durable=false;};
  await assert.rejects(commitHistoryReplacement(s,'history',[]),/not durably confirmed/);
  assert.equal(s.getItem('history'),old);
});

test('same history bytes are not rewritten',async()=>{
  const s=memoryStorage();
  const records=JSON.parse(s.getItem('history'));
  await commitHistoryReplacement(s,'history',records);
  assert.deepEqual(s.log,[]);
});

test('history replacement rejects invalid payloads before touching storage',async()=>{
  const s=memoryStorage();
  await assert.rejects(commitHistoryReplacement(s,'history',{}),TypeError);
  assert.deepEqual(s.log,[]);
});
