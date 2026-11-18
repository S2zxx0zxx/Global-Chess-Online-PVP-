import { readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const folder = resolve('dist/assets');
const chunks = readdirSync(folder).filter(name => /^board3d-[^/]+\.js$/.test(name));
if (chunks.length !== 1) throw new Error('Expected exactly one optional 3D renderer chunk');
const bytes = statSync(join(folder, chunks[0])).size;
// Fixed pre-gzip JavaScript budget for the opt-in renderer, after Babylon tree-shaking.
const budgetBytes = 1_800_000;
console.log('3D renderer JavaScript:', bytes.toLocaleString(), 'bytes; budget:', budgetBytes.toLocaleString());
if (bytes > budgetBytes) {
  throw new Error('3D renderer bundle exceeded the performance budget');
}
