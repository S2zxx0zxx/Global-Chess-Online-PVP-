import { readFile, writeFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';

const compressed = await readFile(new URL('../public/solver/cha.wasm.gz',import.meta.url));
await writeFile(new URL('../server/cha.generated.wasm',import.meta.url),gunzipSync(compressed));
