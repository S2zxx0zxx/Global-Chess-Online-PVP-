import { execFileSync, spawn } from 'node:child_process';
import { mkdtemp, readFile, rm, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

function browserBinary() {
  for (const name of ['google-chrome', 'chromium', 'chromium-browser']) {
    try {
      const candidate = execFileSync('which', [name], {encoding:'utf8'}).trim();
      if (candidate) return candidate;
    } catch { /* Try the next browser. */ }
  }
  throw new Error('Chromium browser not available on CI runner');
}
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function waitUntil(check, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const value = await check();
      if (value) return value;
    } catch (error) { lastError = error; }
    await sleep(250);
  }
  throw new Error('Timed out waiting for browser state' + (lastError ? ': ' + lastError.message : ''));
}

const profile = await mkdtemp(join(tmpdir(), 'global-chess-browser-'));
const preview = spawn(process.execPath, [
  'node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4173', '--strictPort',
], {stdio:['ignore', 'pipe', 'pipe']});
let previewLog = '';
preview.stderr.on('data', bytes => {previewLog += bytes.toString();});
preview.stdout.on('data', bytes => {previewLog += bytes.toString();});
let chrome;
let ws;

try {
  await waitUntil(async () => (await fetch('http://127.0.0.1:4173/')).ok);
  chrome = spawn(browserBinary(), [
    '--headless=new', '--no-sandbox', '--no-first-run', '--disable-extensions',
    '--disable-dev-shm-usage', '--enable-unsafe-swiftshader', '--use-gl=angle',
    '--use-angle=swiftshader', '--remote-debugging-port=0',
    '--remote-allow-origins=*', '--window-size=1280,900',
    '--user-data-dir=' + profile, 'about:blank',
  ], {stdio:['ignore', 'pipe', 'pipe']});

  const port = await waitUntil(async () => {
    const content = await readFile(join(profile, 'DevToolsActivePort'), 'utf8');
    return Number(content.split('\n')[0]);
  });
  const page = await waitUntil(async () => {
    const pages = await (await fetch('http://127.0.0.1:' + port + '/json/list')).json();
    return pages.find(item => item.type === 'page' && item.webSocketDebuggerUrl);
  });
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, {once:true});
    ws.addEventListener('error', reject, {once:true});
  });
  let nextId = 0;
  const pending = new Map();
  const errors = [];
  ws.addEventListener('message', event => {
    const response = JSON.parse(event.data);
    if (response.method === 'Runtime.exceptionThrown') {
      errors.push(response.params?.exceptionDetails?.text ?? 'Browser exception');
    }
    if (!response.id) return;
    const settle = pending.get(response.id);
    if (!settle) return;
    pending.delete(response.id);
    clearTimeout(settle.timeout);
    if (response.error) settle.reject(new Error(response.error.message));
    else settle.resolve(response.result);
  });
  function send(method, params = {}) {
    const id = ++nextId;
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        pending.delete(id);
        reject(new Error('CDP command timeout: ' + method));
      }, 20000);
      pending.set(id, {resolve, reject, timeout});
      ws.send(JSON.stringify({id, method, params}));
    });
  }
  async function evaluate(expression) {
    const result = await send('Runtime.evaluate', {expression, returnByValue:true, awaitPromise:true});
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
    return result.result?.value;
  }
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Page.navigate', {url:'http://127.0.0.1:4173/'});
  await waitUntil(() => evaluate('document.readyState === "complete" && !!document.getElementById("local")'));
  await waitUntil(() => evaluate('document.getElementById("launch").hidden === true'));
  await evaluate('document.getElementById("local").click(); true');
  await evaluate('document.querySelector("#board [data-square=e2]").click(); true');
  await evaluate('document.querySelector("#board [data-square=e4]").click(); true');
  await waitUntil(() => evaluate('document.querySelector("#moves li")?.textContent?.includes("e4") === true'));
  console.log('Browser local chess move: passed');

  await evaluate('document.getElementById("view").click(); true');
  await waitUntil(() => evaluate(
    'document.getElementById("view").textContent === "Use 2D board" && !document.getElementById("scene").hidden'
  ), 45000);
  if (errors.length) throw new Error('Browser exceptions: ' + errors.join(' | '));
  console.log('Browser Babylon/Havok board mount: passed');

  await mkdir('artifacts', {recursive:true});
  const screenshot = await send('Page.captureScreenshot', {format:'png', captureBeyondViewport:false});
  await writeFile('artifacts/chess-3d-browser-smoke.png', Buffer.from(screenshot.data,'base64'));
} catch (error) {
  throw new Error(error.message + (previewLog ? '\nPreview logs:\n' + previewLog.slice(-3000) : ''));
} finally {
  ws?.close();
  chrome?.kill('SIGTERM');
  preview.kill('SIGTERM');
  await rm(profile, {recursive:true, force:true, maxRetries:5, retryDelay:100});
}
