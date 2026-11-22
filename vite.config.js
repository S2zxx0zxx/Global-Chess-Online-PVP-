import { readdirSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [{
    name: 'offline-game-shell',
    apply: 'build',
    generateBundle(_, bundle) {
      const brandDirectory = new URL('public/brand/',import.meta.url);
      const crestDirectory = new URL('public/brand/pieces/',import.meta.url);
      const artwork = [
        ...readdirSync(brandDirectory).filter(file => /\.(svg|png)$/.test(file)).map(file => 'brand/' + file),
        ...readdirSync(crestDirectory).filter(file => file.endsWith('.svg')).map(file => 'brand/pieces/' + file),
      ];
      const files = [...artwork,'index.html', 'manifest.webmanifest', 'icon.svg', 'maskable.svg', 'solver/cha.wasm.gz', 'solver/LICENSE.txt', ...Object.keys(bundle).filter(file => file !== 'index.html')];
      const hash = createHash('sha256').update(JSON.stringify(files));
      for (const file of ['index.html', 'public/manifest.webmanifest', 'public/icon.svg', 'public/maskable.svg', 'public/solver/cha.wasm.gz', 'public/solver/LICENSE.txt', ...artwork.map(file => 'public/' + file)]) {
        hash.update(readFileSync(new URL(file, import.meta.url)));
      }
      const revision = hash.digest('hex').slice(0,16);
      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: `
const prefix = 'global-chess-';
const version = prefix + ${JSON.stringify(revision)};
const files = ${JSON.stringify(files)};
const url = file => new URL(file, self.registration.scope).href;
self.addEventListener('install', event => {
  event.waitUntil(caches.open(version).then(cache => cache.addAll(files.map(url))));
});
// Updates must never force-reload an active chess match. A user-approved
// UI action sends this message only after match and storage preflight.
self.addEventListener('message', event => {
  if (event.data?.type === 'GLOBAL_CHESS_ACTIVATE_UPDATE') {
    event.waitUntil(self.skipWaiting());
  }
});
self.addEventListener('activate', event => {
  event.waitUntil(Promise.all([
    caches.keys().then(keys => Promise.all(keys
      .filter(key => key.startsWith(prefix) && key !== version)
      .map(key => caches.delete(key)))),
    self.clients.claim(),
  ]));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const requestUrl = new URL(event.request.url);
  const scope = new URL(self.registration.scope);
  const entry = requestUrl.origin === scope.origin &&
    (requestUrl.pathname === scope.pathname || requestUrl.pathname === new URL(url('index.html')).pathname);
  const match = event.request.mode === 'navigate' && entry ? url('index.html') : event.request.url;
  if (!files.some(file => url(file) === match)) return;
  event.respondWith(caches.open(version).then(async cache =>
    (await cache.match(match)) ?? fetch(event.request)));
});
        `,
      });
    },
  }],
});
