import { matchKey, historyKey } from './backup.js';
import { progressKey } from './progression.js';

const STORAGE_NAME = 'global-chess';
const STORAGE_KEYS = [matchKey, historyKey, progressKey];

function reportStorageError() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('chess-storage-error'));
}

// Browser privacy settings may disable BOTH IndexedDB and localStorage. In that
// case a safe in-memory session is preferable to a startup crash or fake save.
export function fallbackGameStorage(browserStorage) {
  // Even accessing the localStorage property can throw SecurityError.
  if (browserStorage === undefined) {
    try { browserStorage = globalThis.localStorage; } catch { browserStorage = null; }
  }
  const memory = new Map();
  let durable = false;
  try {
    const probe = '__global_chess_storage_probe__';
    browserStorage.setItem(probe, '1');
    browserStorage.removeItem(probe);
    durable = true;
  } catch { /* Continue with an explicitly volatile session. */ }
  for (const key of STORAGE_KEYS) {
    try {
      const value = browserStorage.getItem(key);
      if (typeof value === 'string') memory.set(key, value);
    } catch { /* No access to persisted legacy data. */ }
  }
  return {
    get durable() { return durable; },
    get kind() { return durable ? 'localStorage' : 'memory'; },
    getItem(key) { return memory.get(key) ?? null; },
    setItem(key, value) {
      const text = String(value);
      if (durable) {
        try { browserStorage.setItem(key, text); }
        catch { durable = false; reportStorageError(); }
      }
      memory.set(key, text);
    },
    async flush() {
      if (!durable) throw new Error('Browser storage is not durable');
    },
    removeItem(key) {
      if (durable) {
        try { browserStorage.removeItem(key); }
        catch { durable = false; reportStorageError(); }
      }
      memory.delete(key);
    },
  };
}

export async function openGameStorage() {
  let db;
  let timer;
  let timedOut = false;
  try {
    db = await Promise.race([
      new Promise((resolve, reject) => {
        const request = indexedDB.open(STORAGE_NAME, 1);
        request.onupgradeneeded = () => {
          if (!request.result.objectStoreNames.contains('saves'))
            request.result.createObjectStore('saves');
        };
        request.onsuccess = () => {
          // A late IndexedDB completion after timeout must not leak a handle.
          if (timedOut) request.result.close();
          else resolve(request.result);
        };
        request.onerror = () => reject(request.error || new Error('Database open failed'));
        request.onblocked = () => reject(new Error('Database blocked by another tab'));
      }),
      new Promise((_, reject) => {
        timer = setTimeout(() => { timedOut = true; reject(new Error('Database open timed out')); }, 3500);
      }),
    ]);
  } catch {
    return fallbackGameStorage();
  } finally {
    clearTimeout(timer);
  }

  const values = new Map();
  let needsMigration = false;
  try {
    db.onversionchange = () => {
      db.close();
      reportStorageError();
    };
    const saved = await new Promise((resolve, reject) => {
      const request = db.transaction('saves').objectStore('saves').get('snapshot');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Could not read saved games'));
    });
    if (saved !== undefined && (typeof saved !== 'object' || saved === null || Array.isArray(saved)))
      throw new Error('Corrupt saved-game container');
    needsMigration = saved === undefined;
    for (const key of STORAGE_KEYS) {
      let legacy = null;
      try { legacy = localStorage.getItem(key); } catch { /* IndexedDB still works. */ }
      const value = saved !== undefined ? saved[key] : legacy;
      if (typeof value === 'string') values.set(key,value);
    }
  } catch {
    db.close();
    return fallbackGameStorage();
  }

  let queued = false;
  const dirty = new Set();
  const pendingWrites = new Set();
  function persist(key) {
    dirty.add(key);
    if (queued) return;
    queued = true;
    queueMicrotask(writeSnapshot);
  }

  function writeSnapshot() {
    queued = false;
    const changes = [...dirty].map(key => [key, values.get(key)]);
    if (!changes.length) return;
    dirty.clear();
    const retryLater = () => {
      for (const [key] of changes) dirty.add(key);
      reportStorageError();
    };
    try {
      const transaction = db.transaction('saves', 'readwrite');
      const completed = new Promise((resolve,reject) => {
        transaction.oncomplete = resolve;
        transaction.onabort = () => {
          retryLater();
          reject(new Error('Could not commit match save'));
        };
      });
      pendingWrites.add(completed);
      // A rejected transaction is observed even if no explicit flush is waiting.
      void completed.then(() => pendingWrites.delete(completed), () => pendingWrites.delete(completed));
      const store = transaction.objectStore('saves');
      const read = store.get('snapshot');
      read.onsuccess = () => {
        const snapshot = read.result ?? {};
        for (const [key,value] of changes) {
          if (value === undefined) delete snapshot[key];
          else snapshot[key] = value;
        }
        try { store.put(snapshot, 'snapshot'); }
        catch { try { transaction.abort(); } catch {} }
      };
      read.onerror = () => { try { transaction.abort(); } catch {} };
    } catch {
      retryLater();
    }
  }

  if (needsMigration) for (const key of values.keys()) persist(key);
  return {
    durable: true,
    kind: 'indexedDB',
    getItem: key => values.get(key) ?? null,
    async flush() {
      // Promise resolution here means the pending IDB transactions have committed,
      // not merely that a save was queued in JavaScript.
      await Promise.resolve();
      while (queued || pendingWrites.size) {
        if (queued) { await Promise.resolve(); continue; }
        await Promise.all([...pendingWrites]);
      }
      if (dirty.size) throw new Error('Match changes could not be committed');
    },
    setItem(key,value) { values.set(key,String(value)); persist(key); },
    removeItem(key) { values.delete(key); persist(key); },
  };
}
