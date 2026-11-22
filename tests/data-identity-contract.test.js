import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Chess } from 'chess.js';
import { serializeGame, restoreGame } from '../src/game.js';
import { exportBackup, previewBackup, importBackup, matchKey, historyKey } from '../src/backup.js';
import { readProgress, recordExercise, progressKey } from '../src/progression.js';
import { createMatch, startMatch, applyMove } from '../server/match.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const contract = relative => JSON.parse(readFileSync(resolve(root, 'docs/contracts', relative), 'utf8'));
const manifest = contract('GC-B01-T06_CONTRACT_MANIFEST.v1.json');
const schemas = ['legacy-match-save-v1', 'legacy-progress-events-v1', 'legacy-backup-v2', 'current-private-room-state', 'proposed-sync-event-v1', 'proposed-account-link-intent-v1'];

function memoryStore() {
  const content = new Map();
  return {
    getItem(key) { return content.get(key) ?? null; },
    setItem(key, value) { content.set(key, String(value)); },
    removeItem(key) { content.delete(key); },
    durable: true,
    async flush() {},
  };
}

test('T06 schema manifest is explicitly preflight-only and pins current source', () => {
  assert.equal(manifest.contractVersion, 1);
  assert.equal(manifest.designState, 'PREFLIGHT_ONLY_NO_MIGRATION_DEPLOYED');
  assert.match(manifest.basedOnCanonical, /^[0-9a-f]{40}$/);
  assert.equal(manifest.liveLegacy.localMatch.key, matchKey);
  assert.equal(manifest.liveLegacy.matchHistory.key, historyKey);
  assert.equal(manifest.liveLegacy.progression.key, progressKey);
  assert.equal(manifest.liveLegacy.indexedDB.version, 1);
  assert.equal(manifest.liveLegacy.backup.versionCurrent, 2);
});

test('all six versioned JSON schemas parse and relative references resolve', () => {
  for (const name of schemas) {
    const file = resolve(root, 'docs/contracts/schemas', name + '.schema.json');
    const schema = JSON.parse(readFileSync(file, 'utf8'));
    assert.equal(schema.$schema, 'https://json-schema.org/draft/2020-12/schema');
    assert.equal(schema.type, 'object');
    assert.equal(schema.additionalProperties, false);
    assert.ok(schema.$id.startsWith('https://global-chess.invalid/contracts/'));
    const refs = JSON.stringify(schema).match(/"\$ref":"[^"]+"/g) || [];
    for (const ref of refs) {
      const name = JSON.parse('{' + ref + '}').$ref;
      if (!name.startsWith('#')) assert.equal(existsSync(resolve(dirname(file), name)), true);
    }
  }
});

test('current local match serialization is backwards compatible with schema v1', () => {
  const game = new Chess();
  game.move('e4');
  game.move('e5');
  const raw = serializeGame(game, 'local', undefined, null, 'standard', undefined, 'untimed', 'w', undefined, false);
  const value = JSON.parse(raw);
  const schema = contract('schemas/legacy-match-save-v1.schema.json');
  assert.equal(value.version, schema.properties.version.const);
  assert.ok(schema.properties.mode.enum.includes(value.mode));
  assert.ok(value.moves.every(move => /^[a-h][1-8]$/.test(move.from) && /^[a-h][1-8]$/.test(move.to)));
  assert.deepEqual(Object.keys(value).filter(key => !Object.hasOwn(schema.properties, key)), []);
  assert.equal(restoreGame(raw).game.fen(), game.fen());
});

test('source match format version differs from online optimistic revision counter', () => {
  const local = JSON.parse(serializeGame(new Chess(), 'local', undefined, null, 'standard'));
  const first = createMatch();
  const started = startMatch(first, 1000);
  assert.equal(local.version, 1);
  assert.equal(first.version, 0);
  assert.equal(started.version, 1);
  const reply = applyMove(started, 'w', { from:'e2', to:'e4', expectedVersion:1 }, 2000);
  assert.equal(reply.error, undefined);
  assert.equal(reply.match.version, 2);
  const schema = contract('schemas/current-private-room-state.schema.json');
  assert.ok(schema.properties.match.properties.version.description === undefined);
  assert.equal(schema.properties.match.properties.version.type, 'integer');
});

test('legacy progression uses derived kind:exerciseId IDs and remains exactly-once locally', () => {
  const storage = memoryStore();
  assert.equal(recordExercise(storage, {kind:'lesson', exerciseId:'center'}), true);
  assert.equal(recordExercise(storage, {kind:'lesson', exerciseId:'center'}), false);
  assert.equal(recordExercise(storage, {kind:'daily', exerciseId:'daily-2026-11-22'}), true);
  const journal = readProgress(storage.getItem(progressKey));
  const ids = journal.events.map(event => event.kind + ':' + event.exerciseId);
  assert.deepEqual(ids, ['lesson:center', 'daily:daily-2026-11-22']);
  assert.equal(new Set(ids).size, journal.events.length);
  assert.ok(journal.events.every(event => Object.keys(event).sort().join(',') === 'exerciseId,kind'));
});

test('progress duplicates and unexpected properties fail closed rather than silently merge', () => {
  assert.throws(() => readProgress(JSON.stringify({
    version:1, events:[{kind:'lesson',exerciseId:'center'},{kind:'lesson',exerciseId:'center'}],
  })), /Duplicate/);
  assert.throws(() => readProgress(JSON.stringify({
    version:1, events:[{kind:'lesson',exerciseId:'center',xp:1000}],
  })), /unexpected/);
  assert.throws(() => readProgress(JSON.stringify({version:2,events:[]})), /Invalid/);
});

test('backup v2 can round-trip current match and progress, while legacy v1 import remains supported', () => {
  const storage = memoryStore();
  const game = new Chess(); game.move('d4');
  storage.setItem(matchKey, serializeGame(game, 'computer', undefined, null, 'easy', undefined, 'untimed'));
  storage.setItem(historyKey, JSON.stringify([]));
  recordExercise(storage,{kind:'puzzle',exerciseId:'win-queen'});
  const json = exportBackup(storage);
  const schema = contract('schemas/legacy-backup-v2.schema.json');
  const payload = JSON.parse(json);
  assert.equal(payload.version, schema.properties.version.const);
  assert.equal(previewBackup(json).summary.exerciseEvents, 1);
  const output = memoryStore();
  importBackup(output, json);
  assert.equal(output.getItem(matchKey), storage.getItem(matchKey));
  assert.deepEqual(readProgress(output.getItem(progressKey)).events, [{kind:'puzzle',exerciseId:'win-queen'}]);
  const legacyBackup = JSON.stringify({version:1, match:null, history:[]});
  assert.equal(previewBackup(legacyBackup).progress, undefined);
  assert.equal(previewBackup(legacyBackup).summary.historyCount, 0);
});

test('invalid future backup version cannot overwrite existing local progress', () => {
  const storage = memoryStore();
  recordExercise(storage,{kind:'lesson',exerciseId:'center'});
  const saved = storage.getItem(progressKey);
  assert.throws(()=>importBackup(storage, JSON.stringify({version:999,match:null,history:[]})), /Invalid backup/);
  assert.equal(storage.getItem(progressKey), saved);
});

test('account link is opt-in design, never client-asserted authoritative identity', () => {
  const schema = contract('schemas/proposed-account-link-intent-v1.schema.json');
  assert.deepEqual(schema.properties.action.enum, ['preview','confirm']);
  assert.equal(schema.properties.schemaVersion.const, 1);
  assert.equal(manifest.futureNotDeployed.serverDerivedAuthenticatedSubject, true);
  assert.equal(manifest.futureNotDeployed.neverAutomaticallyLinkAccount, true);
  for (const prohibited of ['password', 'token', 'authToken', 'subjectId', 'accountSubject', 'email', 'accessToken']) {
    assert.equal(Object.hasOwn(schema.properties,prohibited),false);
  }
});

test('future sync event separates identity from operation and demands version and immutable UUID', () => {
  const schema = contract('schemas/proposed-sync-event-v1.schema.json');
  for (const key of ['schemaVersion','eventId','deviceId','entityType','entityId','operation','localRevision','payload']) {
    assert.ok(schema.required.includes(key), key);
  }
  assert.equal(schema.properties.eventId.format,'uuid');
  assert.ok(schema.properties.operation.enum.includes('tombstone'));
  assert.ok(schema.properties.localRevision.minimum === 0);
  assert.equal(manifest.futureNotDeployed.neverOverwriteOtherDeviceWithoutPreview,true);
});

test('private-room credentials are sensitive; local session storage must not be treated as account login', () => {
  const client = readFileSync(resolve(root,'src/online.js'),'utf8');
  const worker = readFileSync(resolve(root,'server/worker.js'),'utf8');
  assert.ok(client.includes('global-chess.online-seat.v1'));
  assert.ok(client.includes('sessionStorage.setItem') && client.includes('localStorage.setItem'));
  assert.ok(client.includes('expectedVersion:snapshot.match.version'));
  assert.ok(worker.includes("Authorization") && worker.includes('transaction'));
  assert.ok(worker.includes('ROOM_CREATION_LIMIT'));
  assert.ok(!manifest.futureNotDeployed.serverDerivedAuthenticatedSubject === false);
});

test('legacy IndexedDB persisted data keys and durable snapshot CAS remain explicit', () => {
  const storage = readFileSync(resolve(root,'src/storage.js'),'utf8');
  assert.ok(storage.includes("indexedDB.open(STORAGE_NAME, 1)"));
  assert.ok(storage.includes("db.transaction('saves', 'readwrite')"));
  assert.ok(storage.includes("snapshot[key] !== committed.get(key)"));
  assert.equal(manifest.liveLegacy.indexedDB.store, 'saves');
  assert.equal(manifest.liveLegacy.indexedDB.snapshotKey,'snapshot');
});
