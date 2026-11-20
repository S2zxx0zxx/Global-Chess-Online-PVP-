import { matchKey, historyKey } from './backup.js';

export async function openGameStorage() {
  const keys = [matchKey, historyKey];
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
  const dirty = new Set();
  function persist(key) {
    dirty.add(key);
    if (queued) return;
    queued = true;
    queueMicrotask(writeSnapshot);
  }

  function writeSnapshot() {
    queued = false;
    const reportError = () => window.dispatchEvent(new Event('chess-storage-error'));
    try {
      const transaction = db.transaction('saves', 'readwrite');
      transaction.onabort = reportError;
      const store = transaction.objectStore('saves');
      const changes = [...dirty].map(key => [key,values.get(key)]);
      dirty.clear();
      const read = store.get('snapshot');
      read.onsuccess = () => {
        const snapshot = read.result ?? {};
        for (const [key,value] of changes) {
          if (value === undefined) delete snapshot[key];
          else snapshot[key] = value;
        }
        store.put(snapshot,'snapshot');
      };
    } catch {
      reportError();
    }
  }

  if (needsMigration) for (const key of values.keys()) persist(key);
  return {
    getItem: key => values.get(key) ?? null,
    setItem(key, value) { values.set(key, value); persist(key); },
    removeItem(key) { values.delete(key); persist(key); },
  };
}
