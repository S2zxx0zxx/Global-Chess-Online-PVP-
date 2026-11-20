import { wasm_bindgen } from './cha-wasm.mjs';

let initialized = false;
const verdicts = new WeakMap();

export function initializeMateSolver(module) {
  if (initialized) return;
  wasm_bindgen.initSync({module});
  initialized = true;
}

export async function loadBrowserMateSolver() {
  const response = await fetch('./solver/cha.wasm.gz', {signal:AbortSignal.timeout(12000)});
  if (!response.ok || !response.body) throw new Error('Could not load mating solver');
  let bytes = await response.arrayBuffer();
  const magic = new Uint8Array(bytes,0,Math.min(2,bytes.byteLength));
  if (magic[0] === 0x1f && magic[1] === 0x8b) {
    const byteStream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
    bytes = await new Response(byteStream).arrayBuffer();
  }
  const module = await WebAssembly.compile(bytes);
  initializeMateSolver(module);
}

export function matingPossibility(game, side) {
  if (!initialized) return null;
  const fen = game.fen();
  const cached = verdicts.get(game);
  if (cached?.fen === fen && cached.side === side) return cached.verdict;
  let verdict = null;
  try {
    const result = JSON.parse(wasm_bindgen.analyze(fen, side === 'w' ? 'white' : 'black'));
    if (result.verdict === 'winnable') verdict = true;
    if (result.verdict === 'unwinnable') verdict = false;
  } catch {
    // Unsupported inputs or solver failures preserve the existing timeout policy.
  }
  verdicts.set(game,{fen,side,verdict});
  return verdict;
}
