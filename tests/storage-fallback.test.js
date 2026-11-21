import test from 'node:test';
import assert from 'node:assert/strict';
import { fallbackGameStorage, openGameStorage } from '../src/storage.js';
import { matchKey, historyKey } from '../src/backup.js';

test('guest game runs in memory when localStorage is blocked', () => {
  const blocked = {
    getItem() { throw new Error('Access denied'); },
    setItem() { throw new Error('Access denied'); },
    removeItem() { throw new Error('Access denied'); },
  };
  const storage = fallbackGameStorage(blocked);
  assert.equal(storage.kind,'memory');
  assert.equal(storage.durable,false);
  storage.setItem(matchKey,'legal in-memory chess save');
  storage.setItem(historyKey,'[]');
  assert.equal(storage.getItem(matchKey),'legal in-memory chess save');
  storage.removeItem(matchKey);
  assert.equal(storage.getItem(matchKey),null);
});

test('legacy matches are read safely when localStorage is read-only', () => {
  const backing = new Map([[matchKey,'existing active game']]);
  const readOnly = {
    getItem(key) {return backing.get(key)??null;},
    setItem() {throw new Error('quota');},
    removeItem() {throw new Error('quota');},
  };
  const storage = fallbackGameStorage(readOnly);
  assert.equal(storage.durable,false);
  assert.equal(storage.getItem(matchKey),'existing active game');
  storage.setItem(matchKey,'new unsaved move');
  assert.equal(storage.getItem(matchKey),'new unsaved move');
  assert.equal(backing.get(matchKey),'existing active game');
});

test('successful browser storage remains durable and persists writes', () => {
  const backing = new Map();
  const local = {
    getItem:key=>backing.get(key)??null,
    setItem:(key,value)=>backing.set(key,value),
    removeItem:key=>backing.delete(key),
  };
  const storage=fallbackGameStorage(local);
  assert.equal(storage.durable,true);
  storage.setItem(matchKey,'game');
  assert.equal(backing.get(matchKey),'game');
  storage.removeItem(matchKey);
  assert.equal(backing.has(matchKey),false);
});

test('openGameStorage has a usable volatile fallback without DOM storage', async () => {
  const previousDB = Object.getOwnPropertyDescriptor(globalThis,'indexedDB');
  const previousLS = Object.getOwnPropertyDescriptor(globalThis,'localStorage');
  try {
    Object.defineProperty(globalThis,'indexedDB',{configurable:true,value:undefined});
    Object.defineProperty(globalThis,'localStorage',{configurable:true,get(){throw new Error('Access denied');}});
    const storage=await openGameStorage();
    assert.equal(storage.durable,false);
    storage.setItem(matchKey,'current game');
    assert.equal(storage.getItem(matchKey),'current game');
  } finally {
    if(previousDB)Object.defineProperty(globalThis,'indexedDB',previousDB);else delete globalThis.indexedDB;
    if(previousLS)Object.defineProperty(globalThis,'localStorage',previousLS);else delete globalThis.localStorage;
  }
});
