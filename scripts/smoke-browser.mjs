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
    if (response.method === 'Page.javascriptDialogOpening') {
      void send('Page.handleJavaScriptDialog',{accept:true}).catch(error=>errors.push(error.message));
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
  await send('Emulation.setDeviceMetricsOverride', {width:360,height:800,deviceScaleFactor:1,mobile:true});
  await send('Page.navigate', {url:'http://127.0.0.1:4173/'});
  await waitUntil(() => evaluate('document.readyState === "complete" && !!document.getElementById("local")'));
  await waitUntil(() => evaluate('document.getElementById("launch").hidden === true'));
  await mkdir('artifacts',{recursive:true});
  if(await evaluate('document.querySelector("#welcome-dialog[open]") !== null')){
    const welcomeShot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
    await writeFile('artifacts/SCR-01-welcome.png',Buffer.from(welcomeShot.data,'base64'));
  }
  await evaluate('if(document.querySelector("#welcome-dialog[open]"))document.querySelector("#welcome-dialog button").click(); true');
  await waitUntil(() => evaluate('document.documentElement.classList.contains("ch-view-home")'));
  if (!(await evaluate('getComputedStyle(document.querySelector(".layout")).display === "none"'))) {
    throw new Error('Home view showed desktop game controls');
  }
  await mkdir('artifacts', {recursive:true});
  const homeShot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
  await writeFile('artifacts/chess-v3-mobile-home.png',Buffer.from(homeShot.data,'base64'));
  await evaluate('document.querySelector("#ch-tab-bar [data-ch-view=play]").click(); true');
  if (!(await evaluate('document.getElementById("ch-play-hub").hidden === false'))) {
    throw new Error('Play hub did not open');
  }
  await evaluate('document.querySelector("[data-setup=computer]").click(); true');
  if (!(await evaluate('document.getElementById("ch-setup-dialog").open === true'))) {
    throw new Error('New-match setup did not open');
  }
  const setupShot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
  await writeFile('artifacts/SCR-05-match-setup.png',Buffer.from(setupShot.data,'base64'));
  await evaluate('document.getElementById("ch-setup-cancel").click(); true');
  await evaluate('document.querySelector("#ch-tab-bar [data-ch-view=learn]").click(); true');
  if (!(await evaluate('document.getElementById("ch-learn-hub").hidden === false'))) {
    throw new Error('Learn hub did not open');
  }
  await evaluate('document.getElementById("ch-open-lessons").click(); true');
  await waitUntil(()=>evaluate('document.documentElement.classList.contains("ch-view-lessons")'));
  await evaluate('document.querySelector("#ch-extra-screen .ch-feature-card").click(); true');
  await evaluate('document.querySelector("#ch-extra-screen .ch-action.primary").click(); true');
  await waitUntil(()=>evaluate('document.getElementById("learn-dialog").open === true'));
  const lessonShot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
  await writeFile('artifacts/SCR-15-lesson-player.png',Buffer.from(lessonShot.data,'base64'));
  await evaluate('document.querySelector("#learn-dialog form[method=dialog] button").click(); true');
  await evaluate('document.querySelector("#ch-tab-bar [data-ch-view=profile]").click(); true');
  if (!(await evaluate('document.getElementById("ch-profile-hub").hidden === false'))) {
    throw new Error('Local profile screen did not open');
  }
  await evaluate('document.getElementById("local").click(); true');
  const tutorialShot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
  await writeFile('artifacts/SCR-02-first-move.png',Buffer.from(tutorialShot.data,'base64'));
  await evaluate('document.querySelector("#board [data-square=e2]").click(); true');
  await evaluate('document.querySelector("#board [data-square=e4]").click(); true');
  await waitUntil(() => evaluate('document.querySelector("#moves li")?.textContent?.includes("e4") === true'));
  console.log('Mobile v3 Home, Play, Setup, Learn, Profile, local match: passed');
  console.log('Browser local chess move: passed');

  await evaluate('document.getElementById("view").click(); true');
  await waitUntil(() => evaluate(
    'document.getElementById("view").textContent === "Use 2D board" && !document.getElementById("scene").hidden'
  ), 45000);
  if (errors.length) throw new Error('Browser exceptions: ' + errors.join(' | '));
  // A toggled canvas is not proof that the 3D scene drew a frame.
  // Capture its actual pixels; flat, undrawn canvases compress to tiny PNGs.
  const sceneRect=await evaluate(`(() => {const r=document.getElementById("scene").getBoundingClientRect(); return {x:Math.max(0,r.left+3),y:Math.max(0,r.top+3),width:Math.max(1,r.width-6),height:Math.max(1,r.height-6)};})()`);
  const renderedCanvas=await waitUntil(async ()=>{
    const shot=await send('Page.captureScreenshot',{format:'png',clip:{...sceneRect,scale:1}});
    return Buffer.from(shot.data,'base64').length > 7000;
  },15000);
  if (!renderedCanvas) throw new Error('3D renderer never produced a detailed frame');
  console.log('Browser Babylon/Havok 3D scene pixels: rendered');

  const screenshot = await send('Page.captureScreenshot', {format:'png', captureBeyondViewport:false});
  await writeFile('artifacts/chess-3d-browser-smoke.png', Buffer.from(screenshot.data,'base64'));

  // Start a real new game with the computer as White and player as Black.
  // The CDP dialog listener explicitly accepts replacement of the prior match.
  await send('Page.navigate',{url:'http://127.0.0.1:4173/?screen=play'});
  await waitUntil(()=>evaluate('document.getElementById("launch")?.hidden === true && document.documentElement.classList.contains("ch-view-play")'));
  await evaluate('document.querySelector("[data-setup=computer]").click(); true');
  await evaluate('document.getElementById("ch-setup-side").value="b";document.getElementById("ch-setup-difficulty").value="easy";document.getElementById("ch-setup-start").click();true');
  await waitUntil(()=>evaluate('document.getElementById("white-player").textContent.includes("Computer") && document.querySelector("#moves li") !== null && document.getElementById("board").classList.contains("flipped")'),25000);
  const blackPlacement=await evaluate('(() => {const a=document.getElementById("white-panel").getBoundingClientRect(), b=document.getElementById("black-panel").getBoundingClientRect(),c=document.getElementById("board").getBoundingClientRect();return a.bottom<c.top && b.top>c.bottom && document.documentElement.classList.contains("ch-board-flipped");})()');
  if(!blackPlacement)throw new Error('Player panels do not match Black-side board orientation');
  const blackShot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
  await writeFile('artifacts/SCR-05-black-vs-computer.png',Buffer.from(blackShot.data,'base64'));
  await send('Page.navigate',{url:'http://127.0.0.1:4173/?screen=match'});
  await waitUntil(()=>evaluate('document.getElementById("launch")?.hidden === true && document.querySelector("#board .piece-art") !== null'));
  const afterReload=await evaluate('document.documentElement.classList.contains("ch-board-flipped") && document.getElementById("white-panel").getBoundingClientRect().bottom<document.getElementById("board").getBoundingClientRect().top');
  if(!afterReload)throw new Error('Black-side player orientation was not restored after reload');
  console.log('Computer White, human Black, legal opening and persisted player panel orientation: passed');

  await send('Page.navigate',{url:'http://127.0.0.1:4173/?screen=menu'});
  await waitUntil(()=>evaluate('document.documentElement.classList.contains("ch-view-menu")'));
  await evaluate('document.querySelector("#ch-extra-screen .ch-danger-card").click();true');
  await waitUntil(()=>evaluate('document.documentElement.classList.contains("ch-view-result") && document.querySelector("#ch-extra-screen h1")?.textContent?.includes("White wins by resignation") === true'));
  const endShot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
  await writeFile('artifacts/SCR-11-real-result.png',Buffer.from(endShot.data,'base64'));
  console.log('Confirmed resignation and truthful result screen: passed');
  await sleep(500);
  await send('Page.navigate',{url:'http://127.0.0.1:4173/?screen=history'});
  await waitUntil(()=>evaluate('document.getElementById("launch")?.hidden === true && document.querySelector("#ch-extra-screen .ch-history-row") !== null'));
  await evaluate('document.querySelector("#ch-extra-screen .ch-history-row button").click();true');
  await waitUntil(()=>evaluate('document.documentElement.classList.contains("ch-view-review") && document.querySelector("#ch-extra-screen .ch-review-board") !== null'));
  const reviewShot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
  await writeFile('artifacts/SCR-12-real-review.png',Buffer.from(reviewShot.data,'base64'));
  console.log('Completed game history and replay: passed');

  // ZIP v3 screen-by-screen visual regression: these are route renders,
  // not assertions that every release-gate behavior is finished.
  const screenNames=['history','review','lessons','lesson','puzzles','puzzle','puzzle-result',
    'daily','progress','achievements','appearance','settings','data','transfer','recovery',
    'update','about','menu','pause','result'];
  await mkdir('artifacts/screens',{recursive:true});
  for (const name of screenNames) {
    await send('Page.navigate',{url:'http://127.0.0.1:4173/?screen='+encodeURIComponent(name)});
    await waitUntil(()=>evaluate(
      'document.getElementById("launch")?.hidden === true && document.documentElement.classList.contains("ch-view-'+name+'") && document.querySelector("#ch-extra-screen:not([hidden]) h1")?.textContent?.length > 2'
    ),20000);
    const image=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
    await writeFile('artifacts/screens/'+name+'.png',Buffer.from(image.data,'base64'));
  }
  console.log('Rendered and captured all '+screenNames.length+' additional v3 routes in Chromium');
  await send('Page.navigate',{url:'http://127.0.0.1:4173/?screen=appearance'});
  await waitUntil(()=>evaluate('document.documentElement.classList.contains("ch-view-appearance") && document.querySelectorAll(".ch-piece-card").length === 2'));
  await evaluate('document.querySelectorAll(".ch-piece-card")[1].click();true');
  await send('Page.navigate',{url:'http://127.0.0.1:4173/?screen=match'});
  await waitUntil(()=>evaluate('document.getElementById("launch")?.hidden === true && document.querySelector("#board .piece-art") !== null'));
  const crest=await evaluate('Array.from(document.querySelectorAll("#board .piece-art")).some(img=>img.src.includes("/brand/pieces/"))');
  if(!crest)throw new Error('Saved SVG piece skin was not rendered after navigation');
  const crestShot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
  await writeFile('artifacts/SCR-23-crest-piece-style.png',Buffer.from(crestShot.data,'base64'));
  console.log('Persistent original Crest chess pieces: passed');
  for(const width of [320,360,412,768]){
    await send('Emulation.setDeviceMetricsOverride',{width,height:800,deviceScaleFactor:1,mobile:true});
    await send('Page.navigate',{url:'http://127.0.0.1:4173/?screen=home'});
    await waitUntil(()=>evaluate('document.getElementById("launch")?.hidden === true && document.documentElement.classList.contains("ch-view-home")'));
    const overflow=await evaluate('document.documentElement.scrollWidth - document.documentElement.clientWidth');
    if(overflow>2)throw new Error('Home horizontal overflow at '+width+'px: '+overflow);
  }
  console.log('Home screen horizontal overflow checks: 320,360,412,768px passed');
  if(errors.length)throw new Error('Chromium runtime exceptions: '+errors.join(' | '));
} catch (error) {
  throw new Error(error.message + (previewLog ? '\nPreview logs:\n' + previewLog.slice(-3000) : ''));
} finally {
  ws?.close();
  chrome?.kill('SIGTERM');
  preview.kill('SIGTERM');
  await rm(profile, {recursive:true, force:true, maxRetries:5, retryDelay:100});
}
