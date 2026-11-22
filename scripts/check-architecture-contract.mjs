// GC-B01-T05: dependency-free, source-level architecture contract.
// This protects the agreed Vite/ESM baseline; it does not replace build,
// integration, browser, Android, or server-authority tests.
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PATHS = Object.freeze({
  packageJson: 'package.json',
  html: 'index.html',
  vite: 'vite.config.js',
  wrangler: 'wrangler.jsonc',
  capacitor: 'capacitor.config.json',
  clientMain: 'src/main.js',
  chessRules: 'src/game.js',
  clocks: 'src/clock.js',
  serverMatch: 'server/match.js',
  serverWorker: 'server/worker.js',
  workerEntry: 'server/cloudflare-worker.js',
});

export function readArchitectureSources(root = ROOT) {
  return Object.fromEntries(Object.entries(PATHS).map(([key, name]) => [
    key, readFileSync(join(root, name), 'utf8'),
  ]));
}

function parseConfig(source, name, errors, jsonc = false) {
  try {
    const text = jsonc
      ? source.replace(/("(?:\\.|[^"\\])*")|\/\*[\s\S]*?\*\/|\/\/[^\n]*/g,
          (whole, quoted) => quoted ?? '').replace(/,\s*([}\]])/g, '$1')
      : source;
    return JSON.parse(text);
  } catch {
    errors.push(name + ' cannot be parsed as JSON/JSONC');
    return {};
  }
}

export function architectureViolations(source) {
  const errors = [];
  const requireContract = (ok, message) => { if (!ok) errors.push(message); };
  const pkg = parseConfig(source.packageJson, 'package.json', errors);
  const cap = parseConfig(source.capacitor, 'capacitor.config.json', errors);
  const wrangler = parseConfig(source.wrangler, 'wrangler.jsonc', errors, true);
  const packages = { ...pkg.dependencies, ...pkg.devDependencies };

  requireContract(pkg.type === 'module', 'Runtime package must remain ESM');
  requireContract(pkg.scripts?.build === 'vite build', 'Vite build entry must be preserved');
  requireContract(pkg.scripts?.test === 'node --test', 'Node test entry must be preserved');
  requireContract(pkg.scripts?.['check:architecture'] === 'node scripts/check-architecture-contract.mjs',
    'Architecture guard must be reachable by npm script');
  for (const dependency of ['vite', 'chess.js', '@babylonjs/core', '@babylonjs/havok']) {
    requireContract(Boolean(packages[dependency]), 'Missing current runtime dependency: ' + dependency);
  }
  for (const forbidden of ['react', 'react-dom', '@vitejs/plugin-react']) {
    requireContract(!packages[forbidden], 'React rewrite requires a separately approved architecture ADR: ' + forbidden);
  }

  requireContract(/<script\s+type="module"\s+src="\/src\/main\.js"/.test(source.html),
    'Browser entry must still load src/main.js as ESM');
  requireContract(/from\s*['"]\.\/game\.js['"]/.test(source.clientMain) &&
                  /from\s*['"]\.\/clock\.js['"]/.test(source.clientMain),
    'Client controller must consume shared rules and clocks');
  requireContract(/from\s*['"]\.\.\/src\/game\.js['"]/.test(source.serverMatch) &&
                  /from\s*['"]\.\.\/src\/clock\.js['"]/.test(source.serverMatch),
    'Authoritative server match must consume same shared rules and clocks');
  requireContract(/from\s*['"]\.\/match\.js['"]/.test(source.serverWorker),
    'Server Worker must delegate game state to match.js');
  requireContract(/from\s*['"]\.\/worker\.js['"]/.test(source.workerEntry),
    'Worker deploy entry must re-export server worker and room');
  const browserGlobals = /\b(?:window|document|navigator|localStorage|sessionStorage|indexedDB)\b/;
  for (const key of ['chessRules', 'clocks']) {
    requireContract(!browserGlobals.test(source[key]),
      'Shared core cannot access browser-only globals: ' + PATHS[key]);
    requireContract(!/from\s*['"][^'"]*(?:app-shell|screen-routes|storage|online|\/server\/)/.test(source[key]),
      'Shared core cannot import a UI/storage/transport adapter: ' + PATHS[key]);
  }

  requireContract(wrangler.main === 'server/cloudflare-worker.js',
    'Cloudflare entry must remain the verified Worker bootstrap');
  requireContract(wrangler.assets?.directory === './dist' &&
                  wrangler.assets?.run_worker_first?.includes('/api/*'),
    'Cloudflare static assets and /api routing must be preserved');
  requireContract(wrangler.durable_objects?.bindings?.some(
    x => x.name === 'ROOMS' && x.class_name === 'Room'),
    'Durable Object room binding must be preserved');
  requireContract(wrangler.ratelimits?.some(x => x.name === 'ROOM_CREATION_LIMIT'),
    'Room creation rate-limit binding must be preserved');
  requireContract(cap.webDir === 'dist', 'Android wrapper must use exact Vite dist output');
  requireContract(cap.android?.includePlugins?.includes('@capacitor/app'),
    'Android lifecycle bridge cannot be silently dropped');
  requireContract(/generateBundle\s*\(/.test(source.vite) &&
                  source.vite.includes("'sw.js'"),
    'Current PWA service worker emission must remain present');

  return errors;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const failures = architectureViolations(readArchitectureSources());
  if (failures.length) {
    for (const failure of failures) console.error('[GC-B01-T05] ' + failure);
    process.exitCode = 1;
  } else {
    console.log('[GC-B01-T05] Vite/ESM + browser/Worker/Android boundaries verified');
  }
}
