import test from 'node:test';
import assert from 'node:assert/strict';
import {openGameStorage} from '../src/storage.js';
import {matchKey,historyKey} from '../src/backup.js';

function fakeIndexedDB() {
  let saved;
  let failNext = false;
  const db = {
    transaction(_name,mode) {
      const tx = {
        error:null,
        abort() {
          tx.error = new Error('Test abort');
          queueMicrotask(() => tx.onabort?.());
        },
        objectStore() {
          return {
            get() {
              const req = {};
              queueMicrotask(() => {
                req.result = saved === undefined ? undefined : structuredClone(saved);
                req.onsuccess?.();
              });
              return req;
            },
            put(next) {
              setTimeout(() => {
                if (failNext) {
                  failNext = false;
                  tx.error = new Error('Simulated quota/transaction failure');
                  tx.onabort?.();
                } else {
                  saved = structuredClone(next);
                  tx.oncomplete?.();
                }
              }, 0);
            },
          };
        },
      };
      return tx;
    },
    close() {},
  };
  return {
    get saved() {return saved;},
    failOnce() {failNext=true;},
    open() {
      const req = {};
      queueMicrotask(() => {req.result=db;req.onsuccess?.();});
      return req;
    },
  };
}

test('failed IndexedDB transaction retains changes until an explicit flush retry', async () => {
  const previousIDB = globalThis.indexedDB;
  const previousLocal = globalThis.localStorage;
  const previousWindow = globalThis.window;
  const fake = fakeIndexedDB();
  let errors = 0;
  globalThis.indexedDB = fake;
  globalThis.localStorage = {getItem:()=>null};
  globalThis.window = {dispatchEvent() {errors++;}};
  try {
    const storage = await openGameStorage();
    fake.failOnce();
    storage.setItem(matchKey,'saved game');
    await assert.rejects(storage.flush(), /Simulated quota/);
    assert.equal(fake.saved,undefined,'aborted transactions must not commit data');
    assert.equal(storage.getItem(matchKey),'saved game','in-memory pending data remains accessible');
    assert.equal(errors,1,'failure is visible to the UI');
    await storage.flush();
    assert.equal(fake.saved[matchKey],'saved game','retry must persist the original pending save');
  } finally {
    globalThis.indexedDB = previousIDB;
    globalThis.localStorage = previousLocal;
    globalThis.window = previousWindow;
  }
});

test('edits during an in-flight transaction are committed in later transaction, never dropped', async () => {
  const previousIDB = globalThis.indexedDB;
  const previousLocal = globalThis.localStorage;
  const previousWindow = globalThis.window;
  const fake = fakeIndexedDB();
  globalThis.indexedDB = fake;
  globalThis.localStorage = {getItem:()=>null};
  globalThis.window = {dispatchEvent() {}};
  try {
    const storage = await openGameStorage();
    storage.setItem(matchKey,'v1');
    const done = storage.flush();
    queueMicrotask(() => storage.setItem(matchKey,'v2'));
    queueMicrotask(() => storage.setItem(historyKey,'[]'));
    await done;
    assert.equal(fake.saved[matchKey],'v2');
    assert.equal(fake.saved[historyKey],'[]');
  } finally {
    globalThis.indexedDB = previousIDB;
    globalThis.localStorage = previousLocal;
    globalThis.window = previousWindow;
  }
});
