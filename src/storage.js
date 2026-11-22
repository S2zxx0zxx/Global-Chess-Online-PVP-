import { matchKey, historyKey } from './backup.js';
import { progressKey } from './progression.js';

const STORAGE_NAME = 'global-chess';
const STORAGE_KEYS = [matchKey, historyKey, progressKey];

export const storageConflictMessage = 'Another tab saved newer changes. Export this tab’s backup before reloading.';

function reportStorageError(conflict = false) {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('chess-storage-error', {detail:{conflict}}));
}

function isSnapshot(value) {
  return value === undefined || (value !== null && typeof value === 'object' && !Array.isArray(value));
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
  const committed = new Map();
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
    if (!isSnapshot(saved)) throw new Error('Corrupt saved-game container');
    needsMigration = saved === undefined;
    for (const key of STORAGE_KEYS) {
      let legacy = null;
      try { legacy = localStorage.getItem(key); } catch { /* IndexedDB still works. */ }
      const value = saved !== undefined ? saved[key] : legacy;
      if (typeof value === 'string') values.set(key,value);
      if (saved !== undefined) committed.set(key,saved[key]);
    }
  } catch {
    db.close();
    return fallbackGameStorage();
  }

  let queued = false;
  const dirty = new Set();
  let pending;
  let lastFailure;
  function queueWrite() {
    if (queued || pending || !dirty.size) return;
    queued = true;
    queueMicrotask(writeSnapshot);
  }
  function persist(key) {
    dirty.add(key);
    queueWrite();
  }

  function writeSnapshot() {
    queued = false;
    const changes = [...dirty].map(key => [key, values.get(key)]);
    if (!changes.length) return;
    dirty.clear();
    const retryLater = (error, conflict) => {
      for (const [key] of changes) dirty.add(key);
      lastFailure = error;
      reportStorageError(conflict);
    };
    try {
      const transaction = db.transaction('saves', 'readwrite');
      let conflict = false;
      const completed = new Promise((resolve,reject) => {
        transaction.oncomplete = resolve;
        transaction.onabort = () => {
          reject(new Error(conflict ? storageConflictMessage : 'Could not commit match save'));
        };
      });
      pending = completed.then(() => {
        for (const [key,value] of changes) committed.set(key,value);
        pending = undefined;
        lastFailure = undefined;
        queueWrite();
      }, error => {
        pending = undefined;
        retryLater(error,conflict);
      });
      const abort = () => { try { transaction.abort(); } catch {} };
      try {
        const store = transaction.objectStore('saves');
        const read = store.get('snapshot');
        read.onsuccess = () => {
          if (!isSnapshot(read.result)) { abort(); return; }
          const snapshot = read.result ?? {};
          // The comparison and write share one transaction. A stale tab may
          // retain its own playable copy, but it cannot overwrite newer bytes.
          conflict = changes.some(([key,value]) => snapshot[key] !== committed.get(key) && snapshot[key] !== value);
          if (conflict) { abort(); return; }
          for (const [key,value] of changes) {
            if (value === undefined) delete snapshot[key];
            else snapshot[key] = value;
          }
          try { store.put(snapshot, 'snapshot'); }
          catch { abort(); }
        };
        read.onerror = abort;
      } catch { abort(); }
    } catch (error) {
      retryLater(error,false);
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
      while (queued || pending) {
        if (pending) await pending;
        else await Promise.resolve();
      }
      if (dirty.size) throw lastFailure ?? new Error('Match changes could not be committed');
    },
    setItem(key,value) { values.set(key,String(value)); persist(key); },
    removeItem(key) { values.delete(key); persist(key); },
  };
}
