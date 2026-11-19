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
  if (await evaluate('document.getElementById("welcome-dialog").open')) {
    await evaluate('document.getElementById("guest-start").click(); true');
    await waitUntil(() => evaluate('document.getElementById("welcome-dialog").open === false'));
  }
  await waitUntil(() => evaluate('document.documentElement.dataset.view === "home"'));
  await evaluate('document.getElementById("lobby-classic").click(); true');
  await waitUntil(() => evaluate('document.documentElement.dataset.view === "match"'));
  if (!(await evaluate('getComputedStyle(document.getElementById("lobby")).display === "none"'))) {
    throw new Error('Home remained visible during a match');
  }
  if (!(await evaluate('document.getElementById("coach-tip").hidden === false'))) {
    throw new Error('First-match coach did not appear');
  }
  await evaluate('document.querySelector("#board [data-square=e2]").click(); true');
  if (!(await evaluate('document.getElementById("coach-text").textContent.includes("highlighted")'))) {
    throw new Error('First-match coach did not advance after selecting a piece');
  }
  await evaluate('document.querySelector("#board [data-square=e4]").click(); true');
  if (!(await evaluate('document.getElementById("coach-tip").hidden === true'))) {
    throw new Error('First-match coach did not clear after a legal move');
  }
  await waitUntil(() => evaluate('document.querySelector("#moves li")?.textContent?.includes("e4") === true'));
  console.log('Browser local chess move: passed');

  // Real IndexedDB durability: explicitly save, exit, reload the page and
  // recover the previous move from a brand-new application initialization.
  await evaluate('document.getElementById("match-save-exit").click(); true');
  await waitUntil(() => evaluate('document.documentElement.dataset.view === "home"'));
  await send('Page.navigate',{url:'http://127.0.0.1:4173/'});
  await waitUntil(() => evaluate('document.getElementById("launch")?.hidden === true'));
  await waitUntil(() => evaluate('document.documentElement.dataset.view === "home"'));
  if (!(await evaluate('document.getElementById("lobby-resume").hidden === false'))) {
    throw new Error('Save & Return Home did not persist a resumable game across page reload');
  }
  await evaluate('document.getElementById("lobby-resume").click(); true');
  await waitUntil(() => evaluate('document.documentElement.dataset.view === "match"'));
  if (!(await evaluate('document.querySelector("#moves li")?.textContent?.includes("e4") === true'))) {
    throw new Error('IndexedDB reload lost the last legal chess move');
  }
  console.log('IndexedDB Save & Return Home survived full browser reload: passed');

  // Returning Home must not destroy an active saved match.
  await evaluate('document.getElementById("match-exit").click(); true');
  await waitUntil(() => evaluate('document.documentElement.dataset.view === "home"'));
  await waitUntil(() => evaluate('document.getElementById("lobby-resume").hidden === false'));
  await evaluate('document.getElementById("lobby-resume").click(); true');
  await waitUntil(() => evaluate('document.documentElement.dataset.view === "match"'));
  if (!(await evaluate('document.querySelector("#moves li")?.textContent?.includes("e4") === true'))) {
    throw new Error('Resumed match lost its move history');
  }

  await evaluate('document.getElementById("view").click(); true');
  await waitUntil(() => evaluate(
    'document.getElementById("view").textContent === "Use 2D board" && !document.getElementById("scene").hidden'
  ), 45000);
  if (errors.length) throw new Error('Browser exceptions: ' + errors.join(' | '));
  console.log('Browser Babylon/Havok board mount: passed');

  await mkdir('artifacts', {recursive:true});
  const screenshot = await send('Page.captureScreenshot', {format:'png', captureBeyondViewport:false});
  await writeFile('artifacts/chess-3d-browser-smoke.png', Buffer.from(screenshot.data,'base64'));

  await evaluate('document.getElementById("match-exit").click(); true');
  for (const [width,height] of [[320,568],[360,800],[412,915]]) {
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:2,mobile:true});
    await waitUntil(() => evaluate('window.innerWidth === ' + width));
    await waitUntil(() => evaluate('document.documentElement.dataset.view === "home"'));
    const metrics = await evaluate(JSON.stringify({
      width:0,
    }).replace('{"width":0}',`JSON.stringify({
      width: innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      visible: getComputedStyle(document.getElementById('lobby')).display !== 'none',
      otherHidden: getComputedStyle(document.getElementById('match-layout')).display === 'none',
      navVisible: getComputedStyle(document.getElementById('bottom-nav')).display !== 'none'
    })`));
    const state = JSON.parse(metrics);
    if (state.scrollWidth > state.width + 2 || !state.visible || !state.otherHidden || !state.navVisible) {
      throw new Error('Invalid responsive Home layout at ' + width + 'px: ' + metrics);
    }
    const shot = await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
    await writeFile('artifacts/chess-home-' + width + '.png',Buffer.from(shot.data,'base64'));
  }
  await evaluate('document.querySelector("#bottom-nav [data-nav=learn]").click(); true');
  if (!(await evaluate('document.documentElement.dataset.view === "learn"'))) throw new Error('Learn tab did not open');
  await evaluate('document.getElementById("learn-open").click(); true');
  if (!(await evaluate('document.getElementById("learn-dialog").open'))) throw new Error('Lessons did not open');
  await evaluate('document.querySelector("#learn-dialog form[method=dialog] button").click(); true');
  await evaluate('document.querySelector("#bottom-nav [data-nav=profile]").click(); true');
  if (!(await evaluate('document.documentElement.dataset.view === "profile"'))) throw new Error('Profile tab did not open');
  await evaluate('document.getElementById("profile-edit").click(); true');
  if (!(await evaluate('document.getElementById("profile-dialog").open'))) throw new Error('Edit profile did not open');
  await evaluate('document.querySelector("#profile-dialog form[method=dialog] button").click(); true');
  await evaluate('document.querySelector("#bottom-nav [data-nav=play]").click(); true');
  if (!(await evaluate('document.documentElement.dataset.view === "play"'))) throw new Error('Play tab did not open');
  await evaluate(`window.confirm = () => true;
    document.getElementById('setup-format').value = 'untimed';
    document.getElementById('setup-opponent').value = 'computer';
    document.getElementById('setup-opponent').dispatchEvent(new Event('change'));
    document.getElementById('setup-side').value = 'b';
    document.getElementById('setup-difficulty').value = 'easy';
    document.getElementById('setup-start').click();
    true`);
  await waitUntil(() => evaluate('document.documentElement.dataset.view === "match"'));
  await waitUntil(() => evaluate('document.querySelector("#moves li")?.textContent?.length > 0'), 30000);
  const blackGame = await evaluate(`JSON.stringify({
    blackBottom: document.getElementById('match-area').classList.contains('black-bottom'),
    opponent: document.getElementById('white-player').textContent,
    human: document.getElementById('black-player').textContent,
    current: document.getElementById('match-state').textContent
  })`);
  const black = JSON.parse(blackGame);
  if (!black.blackBottom || !black.opponent.includes('Computer') || !black.human.includes('You')) {
    throw new Error('Human Black match orientation invalid: ' + blackGame);
  }
  console.log('Computer as White and human as Black: passed');
  const blackShot = await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
  await writeFile('artifacts/chess-black-player-mobile.png',Buffer.from(blackShot.data,'base64'));

  await evaluate('document.getElementById("match-menu").click(); true');
  if (!(await evaluate('document.documentElement.classList.contains("tools-open")'))) {
    throw new Error('Mobile match options did not open');
  }
  await evaluate('document.getElementById("match-resign").click(); true');
  await waitUntil(() => evaluate('document.getElementById("result-dialog").open'));
  if (!(await evaluate('document.getElementById("result-copy").textContent.includes("White wins by resignation")'))) {
    throw new Error('Resignation result did not match human Black side');
  }
  if (!(await evaluate('document.getElementById("match-result-trigger").hidden === false'))) {
    throw new Error('Completed resignation did not expose result action');
  }
  console.log('Mobile game menu, confirmed resignation and result presentation: passed');
  const resultShot = await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
  await writeFile('artifacts/chess-match-result-mobile.png',Buffer.from(resultShot.data,'base64'));
  await evaluate('document.getElementById("result-home").click(); true');
  await evaluate('document.querySelector("#bottom-nav [data-nav=profile]").click(); true');
  const realStats = await evaluate(`JSON.stringify({
    games: document.getElementById('profile-computer-games').textContent,
    wins: document.getElementById('profile-wins').textContent,
    rate: document.getElementById('profile-win-rate').textContent
  })`);
  const score = JSON.parse(realStats);
  if (score.games !== '1' || score.wins !== '0' || score.rate !== '0%') {
    throw new Error('Profile did not show a genuine loss after resignation: ' + realStats);
  }
  console.log('Profile statistics from real completed match: passed');
  if (errors.length) throw new Error('Browser exceptions: ' + errors.join(' | '));
  console.log('v3 mobile navigation, preserved match, learning/profile and three responsive widths: passed');
} catch (error) {
  throw new Error(error.message + (previewLog ? '\nPreview logs:\n' + previewLog.slice(-3000) : ''));
} finally {
  ws?.close();
  chrome?.kill('SIGTERM');
  preview.kill('SIGTERM');
  await rm(profile, {recursive:true, force:true, maxRetries:5, retryDelay:100});
}
