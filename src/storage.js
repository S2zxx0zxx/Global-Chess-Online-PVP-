import { matchKey, historyKey } from './backup.js';
import { progressKey } from './progression.js';

export async function openGameStorage() {
  const keys = [matchKey, historyKey, progressKey];
  const values = new Map();
  let db;
  let needsMigration = false;
  try {
    db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('global-chess', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('saves');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('Storage blocked'));
    });
    const saved = await new Promise((resolve, reject) => {
      const request = db.transaction('saves').objectStore('saves').get('snapshot');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    needsMigration = !saved;
    for (const key of keys) {
      let legacy = null;
      try { legacy = localStorage.getItem(key); } catch { /* IndexedDB remains available. */ }
      const value = saved ? saved[key] : legacy;
      if (typeof value === 'string') values.set(key, value);
    }
  } catch {
    db?.close();
    return localStorage;
  }

  let queued = false;
  let writing = false;
  const dirty = new Set();
  const waiting = new Set();

  function notifyIdle() {
    if (dirty.size || queued || writing) return;
    for (const waiter of waiting) waiter.resolve();
    waiting.clear();
  }

  function reportError(error) {
    const failure = error instanceof Error ? error : new Error('Could not persist saved chess data');
    for (const waiter of waiting) waiter.reject(failure);
    waiting.clear();
    // Do not silently discard pending writes when the transaction aborts.
    window.dispatchEvent(new Event('chess-storage-error'));
  }

  function schedule() {
    if (queued || writing || !dirty.size) return;
    queued = true;
    queueMicrotask(writeSnapshot);
  }

  function persist(key) {
    dirty.add(key);
    schedule();
  }

  function writeSnapshot() {
    queued = false;
    if (writing || !dirty.size) return;
    writing = true;
    const changes = [...dirty].map(key => [key, values.get(key)]);
    let transaction;
    try {
      transaction = db.transaction('saves','readwrite');
      transaction.onabort = () => {
        writing = false;
        reportError(transaction.error);
        // Changes intentionally remain in dirty; the next edit/flush retries.
      };
      transaction.oncomplete = () => {
        writing = false;
        for (const [key, previousValue] of changes) {
          // A later edit to the same key must not be cleared by an older commit.
          if (dirty.has(key) && values.get(key) === previousValue) dirty.delete(key);
        }
        schedule();
        notifyIdle();
      };
      const store = transaction.objectStore('saves');
      const read = store.get('snapshot');
      read.onsuccess = () => {
        try {
          const existing = read.result;
          if (existing !== undefined && existing !== null &&
              (typeof existing !== 'object' || Array.isArray(existing))) {
            throw new Error('Stored snapshot has an invalid shape');
          }
          const snapshot = existing ?? {};
          for (const [key, value] of changes) {
            if (value === undefined) delete snapshot[key];
            else snapshot[key] = value;
          }
          store.put(snapshot,'snapshot');
        } catch {
          transaction.abort();
        }
      };
    } catch (error) {
      writing = false;
      reportError(error);
    }
  }

  function flush() {
    if (!dirty.size && !queued && !writing) return Promise.resolve();
    return new Promise((resolve,reject) => {
      waiting.add({resolve,reject});
      schedule();
    });
  }

  if (needsMigration) for (const key of values.keys()) persist(key);
  return {
    getItem: key => values.get(key) ?? null,
    setItem(key, value) { values.set(key, value); persist(key); },
    removeItem(key) { values.delete(key); persist(key); },
    flush,
  };
}
