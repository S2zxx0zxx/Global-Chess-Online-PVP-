import { createHash } from 'node:crypto';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [{
    name: 'offline-game-shell',
    apply: 'build',
    generateBundle(_, bundle) {
      const files = ['index.html', 'manifest.webmanifest', 'icon.svg', ...Object.keys(bundle).filter(file => file !== 'index.html')];
      const revision = createHash('sha256').update(JSON.stringify(files)).digest('hex').slice(0,16);
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
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys
    .filter(key => key.startsWith(prefix) && key !== version)
    .map(key => caches.delete(key)))));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const match = event.request.mode === 'navigate' ? url('index.html') : event.request.url;
  if (!files.some(file => url(file) === match)) return;
  event.respondWith(caches.open(version).then(async cache =>
    (await cache.match(match)) ?? fetch(event.request)));
});
        `,
      });
    },
  }],
});
