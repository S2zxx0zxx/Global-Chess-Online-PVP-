import { matchKey, historyKey } from './backup.js';

export async function openGameStorage() {
  const keys = [matchKey, historyKey];
  const values = new Map();
  let db;
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
  function persist() {
    if (queued) return;
    queued = true;
    queueMicrotask(writeSnapshot);
  }

  function writeSnapshot() {
    queued = false;
    const transaction = db.transaction('saves', 'readwrite');
    transaction.objectStore('saves').put(Object.fromEntries(values), 'snapshot');
    transaction.onabort = () => window.dispatchEvent(new Event('chess-storage-error'));
  }

  if (values.size) persist();
  return {
    getItem: key => values.get(key) ?? null,
    setItem(key, value) { values.set(key, value); persist(); },
    removeItem(key) { values.delete(key); persist(); },
  };
}
