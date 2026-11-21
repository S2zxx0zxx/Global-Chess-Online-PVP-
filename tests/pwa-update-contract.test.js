import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('versioned PWA worker cannot force an update without an explicit message', () => {
  const generatedSource=readFileSync(new URL('../vite.config.js',import.meta.url),'utf8');
  assert.match(generatedSource,/GLOBAL_CHESS_ACTIVATE_UPDATE/);
  assert.match(generatedSource,/self\.addEventListener\('message'/);
  assert.match(generatedSource,/event\.waitUntil\(self\.skipWaiting\(\)\)/);
  assert.match(generatedSource,/self\.clients\.claim\(\)/);
  assert.doesNotMatch(generatedSource,/self\.addEventListener\('install'[^]*self\.skipWaiting/);
});
