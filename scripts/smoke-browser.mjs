import { execFileSync, spawn } from 'node:child_process';
import { mkdtemp, readFile, rm, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { preview as startPreview } from 'vite';

function browserBinary() {
  if (process.env.CHESS_BROWSER) return process.env.CHESS_BROWSER;
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
let preview;
let servedWorker;
let chrome;
let ws;

try {
  const builtWorker = await readFile('dist/sw.js', 'utf8');
  const versionLine = /^const version = prefix \+ "([a-f0-9]{16})";$/m;
  const originalRevision = builtWorker.match(versionLine)?.[1];
  if (!originalRevision) throw new Error('Could not identify the built service-worker revision');
  const nextRevision = originalRevision + '-test-update';
  const nextWorker = builtWorker.replace(versionLine, 'const version = prefix + "' + nextRevision + '";');
  preview = await startPreview({
    preview:{host:'127.0.0.1',port:4173,strictPort:true},
    plugins:[{
      name:'staged-worker-browser-fixture',
      configurePreviewServer(server){
        server.middlewares.use((request,response,next)=>{
          if (!servedWorker || request.url !== '/sw.js') return next();
          response.writeHead(200,{'Content-Type':'text/javascript','Cache-Control':'no-store'});
          response.end(servedWorker);
        });
      },
    }],
  });
  await waitUntil(async () => (await fetch('http://127.0.0.1:4173/')).ok);
  const headers = (await fetch('http://127.0.0.1:4173/')).headers;
  if (!headers.get('content-security-policy')?.includes("frame-ancestors 'none'") ||
      headers.get('x-content-type-options') !== 'nosniff') {
    throw new Error('Production preview did not serve the expected static asset policy');
  }
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
    const result = await send('Runtime.evaluate', {
      expression, returnByValue:true, awaitPromise:true, allowUnsafeEvalBlockedByCSP:false,
    });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
    return result.result?.value;
  }
  function updateButton(label, click = false) {
    return evaluate(`(() => {
      const button = Array.from(document.querySelectorAll('#ch-extra-screen button'))
        .find(item => !item.hidden && !item.disabled && item.textContent.trim() === ${JSON.stringify(label)});
      if (${click}) button?.click();
      return Boolean(button);
    })()`);
  }
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {width:360,height:800,deviceScaleFactor:1,mobile:true});
  await send('Page.navigate', {url:'http://127.0.0.1:4173/'});
  await waitUntil(() => evaluate('document.readyState === "complete" && !!document.getElementById("local")'));
  await waitUntil(() => evaluate('document.getElementById("launch").hidden === true'));
  await evaluate(`(async () => {
    const response = await fetch('/solver/cha.wasm.gz');
    if (!response.ok) throw new Error('Browser mating solver missing');
    let bytes = await response.arrayBuffer();
    const magic = new Uint8Array(bytes, 0, 2);
    if (magic[0] === 31 && magic[1] === 139) {
      bytes = await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
    }
    await WebAssembly.compile(bytes);
    return true;
  })()`);
  console.log('Mating solver WebAssembly compiles under the production CSP: passed');
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
  await evaluate('document.querySelector("#lesson-board [data-square=e2]").click();document.querySelector("#lesson-board [data-square=e4]").click();true');
  await waitUntil(()=>evaluate('document.querySelector("#lesson-feedback")?.textContent.startsWith("Correct.") && /[1-9][0-9]* local XP/.test(document.querySelector("#lesson-progress")?.textContent)'));
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
  await waitUntil(() => evaluate('document.querySelector("#board [data-square=e4].last-destination")?.getAttribute("aria-label") === "e4, White Pawn"'));
  if (!(await evaluate('document.getElementById("claim").hidden === true')))
    throw new Error('A draw-claim button appeared without an eligible position');
  console.log('Mobile v3 Home, Play, Setup, Learn, Profile, local match: passed');
  console.log('Browser local chess move: passed');

  await evaluate('document.getElementById("ch-match-tools").click(); true');
  await waitUntil(() => evaluate('document.documentElement.classList.contains("ch-view-menu") && document.querySelector("#board").getClientRects().length === 0 && document.querySelector(".ch-menu-moves li")?.textContent.includes("e4")'));
  await evaluate('document.querySelector("[data-board-view=mode-2d]").click(); true');
  await waitUntil(() => evaluate(
    'document.documentElement.classList.contains("ch-view-match") && !document.getElementById("scene").hidden && !document.documentElement.classList.contains("ch-loading-3d")'
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
  console.log('Browser Babylon 3D scene pixels: rendered');

  const screenshot = await send('Page.captureScreenshot', {format:'png', captureBeyondViewport:false});
  await writeFile('artifacts/chess-3d-browser-smoke.png', Buffer.from(screenshot.data,'base64'));

  await evaluate('document.getElementById("ch-match-tools").click(); true');
  await evaluate('document.querySelector("[data-board-view=mode-3d]").click(); true');
  await waitUntil(() => evaluate('!document.getElementById("board").hidden && document.querySelector("#board [data-square=e4].last-destination")?.getAttribute("aria-label") === "e4, White Pawn"'));

  await evaluate('document.querySelector("#ch-match-home").click();true');
  await waitUntil(()=>evaluate('document.documentElement.classList.contains("ch-view-home")'));
  await send('Page.navigate',{url:'http://127.0.0.1:4173/?screen=home'});
  await waitUntil(()=>evaluate('document.getElementById("launch")?.hidden && !document.querySelector("#lobby-resume").hidden'));
  await evaluate('document.querySelector("#lobby-resume").click();true');
  await waitUntil(()=>evaluate('document.documentElement.classList.contains("ch-view-match") && document.querySelector("#board [data-square=e4].last-destination")?.getAttribute("aria-label")==="e4, White Pawn" && !document.querySelector("#status").textContent.includes("Match paused")'));
  console.log('Save and Exit restores the latest move after reload: passed');

  await waitUntil(() => evaluate('Boolean(navigator.serviceWorker.controller)'));
  await send('Network.enable');
  const connection = {latency:0, downloadThroughput:-1, uploadThroughput:-1};
  try {
    await send('Network.emulateNetworkConditions', {...connection, offline:true});
    await waitUntil(() => evaluate('navigator.onLine === false'));
    const networkUnavailable = await evaluate('fetch("/offline-network-probe", {cache:"no-store"}).then(()=>false,()=>true)');
    if (!networkUnavailable) throw new Error('Offline probe unexpectedly reached the server');
    await send('Page.navigate',{url:'http://127.0.0.1:4173/?screen=match'});
    await waitUntil(() => evaluate('navigator.onLine === false && document.getElementById("launch")?.hidden && document.querySelector("#board [data-square=e4].last-destination")?.getAttribute("aria-label") === "e4, White Pawn"'));
    await evaluate('document.querySelector("#board [data-square=e7]").click();document.querySelector("#board [data-square=e5]").click();true');
    await waitUntil(() => evaluate('document.querySelector("#board [data-square=e5].last-destination")?.getAttribute("aria-label") === "e5, Black Pawn"'));
    const offlineShot = await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
    await writeFile('artifacts/offline-restored-match.png',Buffer.from(offlineShot.data,'base64'));
    console.log('PWA restores a saved match and plays a legal move with network disabled: passed');
  } finally {
    await send('Network.emulateNetworkConditions', {...connection, offline:false});
    await send('Network.disable');
  }

  servedWorker = nextWorker;
  await send('Page.navigate',{url:'http://127.0.0.1:4173/?screen=update'});
  await waitUntil(() => updateButton('Check for update'));
  await updateButton('Check for update', true);
  await waitUntil(() => updateButton('Apply downloaded update'));
  await updateButton('Apply downloaded update', true);
  await waitUntil(() => evaluate('document.querySelector("#ch-extra-screen [role=status]")?.textContent.includes("Finish or resign the active local match")'));
  if (!await evaluate('navigator.serviceWorker.getRegistration().then(r => Boolean(r.waiting))')) {
    throw new Error('A staged update replaced the running chess match');
  }
  const deferredShot = await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
  await writeFile('artifacts/update-deferred-active-match.png',Buffer.from(deferredShot.data,'base64'));

  // Start a real new game with the computer as White and player as Black.
  // The CDP dialog listener explicitly accepts replacement of the prior match.
  await send('Page.navigate',{url:'http://127.0.0.1:4173/?screen=play'});
  await waitUntil(()=>evaluate('document.getElementById("launch")?.hidden === true && document.documentElement.classList.contains("ch-view-play")'));
  await evaluate('document.querySelector("[data-setup=computer]").click(); true');
  await evaluate('document.getElementById("ch-setup-side").value="b";document.getElementById("ch-setup-difficulty").value="easy";document.getElementById("ch-setup-start").click();true');
  await waitUntil(()=>evaluate('document.getElementById("white-player").textContent.includes("Computer") && document.querySelector("#board .last-destination") !== null && document.getElementById("board").classList.contains("flipped")'),25000);
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

  await send('Page.navigate',{url:'http://127.0.0.1:4173/?screen=update'});
  await waitUntil(() => updateButton('Apply downloaded update'));
  await evaluate('window.chessUpdateReloadMarker = true');
  await updateButton('Apply downloaded update', true);
  await waitUntil(() => evaluate(`(async () => {
    const keys = await caches.keys();
    return window.chessUpdateReloadMarker === undefined &&
      document.querySelector('#ch-extra-screen h1')?.textContent === 'PWA update' &&
      keys.includes('global-chess-${nextRevision}') && !keys.includes('global-chess-${originalRevision}');
  })()`));
  await send('Page.navigate',{url:'http://127.0.0.1:4173/?screen=history'});
  await waitUntil(() => evaluate('document.querySelector("#ch-extra-screen .ch-history-row")?.textContent.toLowerCase().includes("resignation")'));
  console.log('Staged PWA update waits during a match and preserves history after activation: passed');

  // Serve the original worker bytes again, as a server would on rollback.
  servedWorker = builtWorker;
  await send('Page.navigate',{url:'http://127.0.0.1:4173/?screen=update'});
  await waitUntil(() => updateButton('Check for update'));
  await updateButton('Check for update', true);
  await waitUntil(() => updateButton('Apply downloaded update'));
  await updateButton('Apply downloaded update', true);
  await waitUntil(() => evaluate(`(async () => {
    const keys = await caches.keys();
    return !(await navigator.serviceWorker.getRegistration()).waiting &&
      keys.includes('global-chess-${originalRevision}') && !keys.includes('global-chess-${nextRevision}');
  })()`));
  await send('Page.navigate',{url:'http://127.0.0.1:4173/?screen=history'});
  await waitUntil(() => evaluate('document.querySelector("#ch-extra-screen .ch-history-row")?.textContent.toLowerCase().includes("resignation")'));
  console.log('PWA worker revision rollback preserves completed match history: passed');

  // ZIP v3 screen-by-screen visual regression: these are route renders,
  // not assertions that every release-gate behavior is finished.
  const screenNames=['history','review','lessons','lesson','puzzles','puzzle','puzzle-result',
    'daily','progress','achievements','appearance','avatars','frames','settings','data','transfer','recovery',
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
  await waitUntil(()=>evaluate('document.documentElement.classList.contains("ch-view-appearance") && document.querySelectorAll(".ch-theme-card").length === 8 && document.querySelectorAll(".ch-piece-card").length === 7'));
  await evaluate('document.querySelector(".ch-appearance-categories button:nth-child(2)").click();document.querySelector("[data-piece-style=crest]").click();true');
  await send('Page.navigate',{url:'http://127.0.0.1:4173/?screen=match'});
  await waitUntil(()=>evaluate('document.getElementById("launch")?.hidden === true && document.querySelector("#board .piece-art") !== null'));
  const crest=await evaluate('document.querySelector("#board .ch-piece-crest")?.src.includes("/brand/pieces/") === true');
  if(!crest)throw new Error('Saved SVG piece skin was not rendered after navigation');
  const crestShot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
  await writeFile('artifacts/SCR-23-crest-piece-style.png',Buffer.from(crestShot.data,'base64'));
  console.log('Persistent original Crest chess pieces: passed');

  // SCR-20 player customization uses actual locally persisted choices.
  await send('Page.navigate',{url:'http://127.0.0.1:4173/?screen=avatars'});
  await waitUntil(()=>evaluate('document.getElementById("launch")?.hidden === true && document.querySelectorAll(".ch-avatar-card").length === 3'));
  await evaluate('document.querySelectorAll(".ch-avatar-card")[1].click();document.querySelector(".ch-profile-tabs button:last-child").click();document.querySelector(".ch-frame-teal").click();true');
  await send('Page.navigate',{url:'http://127.0.0.1:4173/?screen=profile'});
  await waitUntil(()=>evaluate('document.getElementById("launch")?.hidden === true && document.querySelector("#ch-profile-avatar img")?.src.includes("piece_white_rook.svg")===true && document.getElementById("ch-profile-avatar").dataset.frame === "teal"'));
  console.log('Original avatar and decorative frame persist across reload: passed');
  await evaluate('document.querySelector("[data-profile-link=progress]").click();true');
  await waitUntil(()=>evaluate('Array.from(document.querySelectorAll(".ch-stat")).some(tile=>tile.textContent.includes("Exercise XP") && Number(tile.querySelector("strong")?.textContent)>0)'));
  console.log('Exercise completion and local XP survive browser reload: passed');
  for(const width of [320,360,412,768]){
    await send('Emulation.setDeviceMetricsOverride',{width,height:800,deviceScaleFactor:1,mobile:true});
    await send('Page.navigate',{url:'http://127.0.0.1:4173/?screen=home'});
    await waitUntil(()=>evaluate('document.getElementById("launch")?.hidden === true && document.documentElement.classList.contains("ch-view-home")'));
    const overflow=await evaluate('document.documentElement.scrollWidth - document.documentElement.clientWidth');
    if(overflow>2)throw new Error('Home horizontal overflow at '+width+'px: '+overflow);
  }
  console.log('Home screen horizontal overflow checks: 320,360,412,768px passed');
  await send('Emulation.setDeviceMetricsOverride',{width:360,height:800,deviceScaleFactor:1,mobile:true});
  await send('Page.navigate',{url:'http://127.0.0.1:4173/?screen=home'});
  await waitUntil(()=>evaluate('document.getElementById("launch")?.hidden === true && document.documentElement.classList.contains("ch-view-home")'));
  const largeTypeOverflow=await evaluate('document.documentElement.style.fontSize="200%"; document.documentElement.scrollWidth-document.documentElement.clientWidth');
  if(largeTypeOverflow>2)throw new Error('Home horizontally overflowed at 200% text size: '+largeTypeOverflow);
  await evaluate('document.documentElement.style.fontSize="";true');
  await send('Emulation.setDeviceMetricsOverride',{width:740,height:360,deviceScaleFactor:1,mobile:true});
  await send('Page.navigate',{url:'http://127.0.0.1:4173/?screen=play'});
  await waitUntil(()=>evaluate('document.getElementById("launch")?.hidden === true && document.documentElement.classList.contains("ch-view-play")'));
  const landscapeOverflow=await evaluate('document.documentElement.scrollWidth-document.documentElement.clientWidth');
  if(landscapeOverflow>2)throw new Error('Play Hub overflows landscape viewport: '+landscapeOverflow);
  await send('Emulation.setDeviceMetricsOverride',{width:1366,height:768,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url:'http://127.0.0.1:4173/?screen=home'});
  await waitUntil(()=>evaluate('document.getElementById("launch")?.hidden && document.documentElement.classList.contains("ch-view-home")'));
  if (await evaluate('document.documentElement.scrollWidth - document.documentElement.clientWidth') > 2) {
    throw new Error('Home overflows the 1366px desktop viewport');
  }
  await send('Emulation.setDeviceMetricsOverride',{width:360,height:800,deviceScaleFactor:1,mobile:true});
  console.log('200% text size and landscape browser layout: passed');

  // Real browser Back must navigate the game shell without clearing saved moves.
  await send('Page.navigate',{url:'http://127.0.0.1:4173/?screen=home'});
  await waitUntil(()=>evaluate('document.getElementById("launch")?.hidden === true && document.documentElement.classList.contains("ch-view-home")'));
  await evaluate('document.querySelector("[data-ch-view=play]").click();true');
  await evaluate('document.querySelector("[data-ch-view=learn]").click();true');
  await evaluate('history.back();true');
  await waitUntil(()=>evaluate('document.documentElement.classList.contains("ch-view-play")'));
  console.log('Browser Back returns from Learn to Play: passed');

  // Reach a legal promotion position from the normal board, without injecting game state.
  async function openPromotion() {
    await evaluate(`(() => {
      document.getElementById('local').click();
      const cell = square => document.querySelector('#board [data-square=' + square + ']');
      for (const [from,to] of [['a2','a4'],['h7','h5'],['a4','a5'],['h5','h4'],
                              ['a5','a6'],['h4','h3'],['a6','b7'],['h3','g2']]) {
        cell(from).click();
        cell(to).click();
      }
      cell('b7').focus();
      cell('b7').click();
      cell('a8').focus();
      cell('a8').click();
    })()`);
    await waitUntil(() => evaluate('document.querySelector("#promotion[open]")?.contains(document.activeElement)'));
  }
  async function pressKey(key, windowsVirtualKeyCode) {
    const code = key === ' ' ? 'Space' : key;
    await send('Input.dispatchKeyEvent',{
      type:'keyDown',key,code,windowsVirtualKeyCode,
      ...(key === 'Enter' ? {text:'\r'} : {}),
    });
    await send('Input.dispatchKeyEvent',{type:'keyUp',key,code,windowsVirtualKeyCode});
  }
  await openPromotion();
  if (!await evaluate(`(() => {
    const dialog = document.querySelector('#promotion[open]');
    const heading = document.getElementById(dialog.getAttribute('aria-labelledby'));
    const labels = Array.from(dialog.querySelectorAll('.ch-promotion-pieces button'), b => b.textContent.trim());
    return heading.textContent === 'Promote pawn' && labels.join(',') === 'Queen,Rook,Bishop,Knight' &&
      document.activeElement.value === 'q' && dialog.querySelectorAll('img').length === 4;
  })()`)) throw new Error('Promotion name, focus or choices are incomplete');
  await pressKey('Tab',9);
  await waitUntil(() => evaluate('document.activeElement.value === "r"'));
  const promotionShot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
  await writeFile('artifacts/SCR-08-promotion.png',Buffer.from(promotionShot.data,'base64'));
  await pressKey('Escape',27);
  await waitUntil(() => evaluate('!document.querySelector("#promotion").open && document.activeElement.dataset.square === "b7" && document.activeElement.getAttribute("aria-label") === "b7, White Pawn"'));
  for (const [value,piece] of [['q','Queen'],['r','Rook'],['b','Bishop'],['n','Knight']]) {
    await openPromotion();
    await evaluate(`document.querySelector('#promotion button[value=${value}]').focus()`);
    await pressKey('Enter',13);
    await waitUntil(async () => {
      const actual = await evaluate(`({
        open:document.querySelector('#promotion').open,
        focus:document.activeElement.getAttribute('aria-label'),
        landing:document.querySelector('#board [data-square=a8].last-destination')?.getAttribute('aria-label'),
      })`);
      if (!actual.open && actual.focus === 'a8, White ' + piece && actual.landing === actual.focus) return true;
      throw new Error('Expected ' + piece + ' promotion: ' + JSON.stringify(actual));
    });
  }
  await send('Page.navigate',{url:'http://127.0.0.1:4173/?screen=match'});
  await waitUntil(() => evaluate('document.querySelector("#board [data-square=a8].last-destination")?.getAttribute("aria-label") === "a8, White Knight"'));
  console.log('Promotion keyboard navigation, Escape, all four choices and persisted underpromotion: passed');

  await evaluate('document.getElementById("local").click();true');
  await evaluate('document.getElementById("ch-match-tools").click();true');
  await waitUntil(() => evaluate('Boolean(document.querySelector("[data-board-view=mode-2d]"))'));
  await evaluate('document.querySelector("[data-board-view=mode-2d]").click();true');
  await waitUntil(() => evaluate('!document.querySelector("#scene").hidden && !document.documentElement.classList.contains("ch-loading-3d")'));
  await evaluate('document.querySelector("#scene").focus()');
  const expectSquare = label => waitUntil(() => evaluate('document.querySelector("#scene-square").textContent === ' + JSON.stringify(label)));
  await expectSquare('e2, White Pawn');
  await pressKey('Enter',13);
  await expectSquare('e2, White Pawn, selected');
  for (let steps=0;steps<2;steps++) await pressKey('ArrowUp',38);
  await expectSquare('e4, legal move');
  await pressKey(' ',32);
  await expectSquare('e4, White Pawn');
  await pressKey('ArrowLeft',37);
  for (let steps=0;steps<3;steps++) await pressKey('ArrowUp',38);
  await expectSquare('d7, Black Pawn');
  await pressKey('Enter',13);
  for (let steps=0;steps<2;steps++) await pressKey('ArrowDown',40);
  await expectSquare('d5, legal move');
  await pressKey('Enter',13);
  await expectSquare('d5, Black Pawn');
  await pressKey('ArrowDown',40);
  await pressKey('ArrowRight',39);
  await expectSquare('e4, White Pawn');
  await pressKey('Enter',13);
  await pressKey('ArrowUp',38);
  await pressKey('ArrowLeft',37);
  await expectSquare('d5, Black Pawn, legal capture');
  const threeDKeyboard=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
  await writeFile('artifacts/SCR-07-3d-keyboard-capture.png',Buffer.from(threeDKeyboard.data,'base64'));
  await pressKey('Enter',13);
  await expectSquare('d5, White Pawn');
  await evaluate('document.getElementById("flip-board").click();true');
  await pressKey('ArrowRight',39);
  await expectSquare('c5');
  await pressKey('Tab',9);
  await waitUntil(() => evaluate('document.activeElement.id !== "scene" && !document.querySelector("#scene-square").textContent'));
  await evaluate('document.getElementById("ch-match-tools").click();true');
  await waitUntil(() => evaluate('Boolean(document.querySelector("[data-board-view=mode-3d]"))'));
  await evaluate('document.querySelector("[data-board-view=mode-3d]").click();true');
  await waitUntil(() => evaluate('!document.querySelector("#board").hidden && document.querySelector("#board [data-square=d5].last-destination")?.getAttribute("aria-label") === "d5, White Pawn"'));
  console.log('3D keyboard moves, legal capture, flipped controls and 2D board continuity: passed');

  // Screen contracts SCR-00/01: denied browser storage must not crash the app,
  // and the UI may NOT claim a durable save for temporary guest play.
  await send('Page.addScriptToEvaluateOnNewDocument',{source:
    'Object.defineProperty(window,"indexedDB",{configurable:true,get(){throw new Error("IndexedDB denied")}});'+
    'Object.defineProperty(window,"localStorage",{configurable:true,get(){throw new Error("localStorage denied")}});'
  });
  await send('Page.navigate',{url:'http://127.0.0.1:4173/?screen=home'});
  await waitUntil(()=>evaluate('document.getElementById("launch")?.hidden === true && document.querySelector(".ch-volatile-warning") !== null'));
  await evaluate('if(document.querySelector("#welcome-dialog[open]"))document.querySelector("#welcome-dialog button").click();true');
  await evaluate('document.getElementById("local").click();true');
  await evaluate('document.querySelector("#board [data-square=e2]").click();true');
  await evaluate('document.querySelector("#board [data-square=e4]").click();true');
  await waitUntil(()=>evaluate('document.querySelector("#board [data-square=e4].last-destination")?.getAttribute("aria-label") === "e4, White Pawn"'));
  const volatileShot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
  await writeFile('artifacts/SCR-27-volatile-storage.png',Buffer.from(volatileShot.data,'base64'));
  console.log('Blocked browser storage: offline play and honest session-only warning passed');
  if(errors.length)throw new Error('Chromium runtime exceptions: '+errors.join(' | '));
} finally {
  ws?.close();
  chrome?.kill('SIGTERM');
  await preview?.close();
  await rm(profile, {recursive:true, force:true, maxRetries:5, retryDelay:100});
}
