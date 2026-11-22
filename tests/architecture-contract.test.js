import test from 'node:test';
import assert from 'node:assert/strict';
import { architectureViolations, readArchitectureSources } from '../scripts/check-architecture-contract.mjs';

const source = readArchitectureSources();

test('canonical Vite/ESM, shared rules and platform boundaries stay wired', () => {
  assert.deepEqual(architectureViolations(source), []);
});

test('React runtime cannot be introduced without an ADR revision', () => {
  const pkg = JSON.parse(source.packageJson);
  pkg.dependencies.react = '19.0.0';
  const actual = architectureViolations({ ...source, packageJson: JSON.stringify(pkg) });
  assert.ok(actual.some(message => message.includes('React rewrite')));
});

test('browser-only state cannot be imported into shared chess rules', () => {
  const actual = architectureViolations({ ...source, chessRules: source.chessRules + '\nwindow.localStorage.clear();\n' });
  assert.ok(actual.some(message => message.includes('Shared core cannot access browser-only globals')));
});

test('Workers authority cannot be silently disconnected from common rules', () => {
  const changed = source.serverMatch.replace("'../src/game.js'", "'../src/main.js'");
  assert.notEqual(changed, source.serverMatch, 'fixture must alter a real import');
  const actual = architectureViolations({ ...source, serverMatch: changed });
  assert.ok(actual.some(message => message.includes('Authoritative server match')));
});

test('Android web output and Cloudflare API routing cannot be decoupled', () => {
  const cap = JSON.parse(source.capacitor);
  cap.webDir = 'out';
  assert.ok(architectureViolations({ ...source, capacitor: JSON.stringify(cap) })
    .some(message => message.includes('Android wrapper')));
  const worker = JSON.parse(source.wrangler);
  worker.assets.run_worker_first = [];
  assert.ok(architectureViolations({ ...source, wrangler: JSON.stringify(worker) })
    .some(message => message.includes('Cloudflare static assets')));
});

test('invalid config cannot masquerade as a healthy architecture', () => {
  assert.ok(architectureViolations({ ...source, wrangler: '{ bad' })
    .some(message => message.includes('cannot be parsed')));
});
