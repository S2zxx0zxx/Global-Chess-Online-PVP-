// Use Babylon's pure tree-shakeable imports to avoid bundling unrelated 3D systems.
import {
  ArcRotateCamera, Color3, Color4, CreateBox, CreateGround, CreateLathe, CreateSphere, CreateTorus,
  DirectionalLight, Engine, HemisphericLight, PointerEventTypes, Scene, StandardMaterial, Texture, Vector3, VertexBuffer,
  RegisterStandardEngineExtensions, RegisterStandardMaterial, RegisterTexture, RegisterRay,
} from '@babylonjs/core/pure.js';
import { pieceTheme } from './appearance.js';

RegisterStandardEngineExtensions();
RegisterStandardMaterial();
RegisterTexture();
RegisterRay();

const profiles = {
  p: [[.27,0],[.29,.09],[.17,.17],[.12,.36],[.16,.39],[.17,.43],[.10,.46],[0,.46]],
  r: [[.34,0],[.34,.12],[.23,.22],[.23,.55],[.34,.59],[.34,.75],[0,.75]],
  n: [[.33,0],[.33,.1],[.22,.18],[.17,.42],[.14,.57],[0,.6]],
  b: [[.31,0],[.32,.1],[.18,.23],[.13,.55],[.25,.69],[.16,.83],[0,.91]],
  q: [[.34,0],[.34,.1],[.19,.22],[.15,.64],[.3,.87],[.25,.95],[.12,.98],[0,1.08]],
  k: [[.35,0],[.35,.11],[.21,.24],[.16,.67],[.28,.81],[.24,.91],[.1,.94],[0,.98]],
};
const squareFor = (file, rank) => 'abcdefgh'[file] + (rank + 1);
const royalImpacts = {
  ember: {color:'#FF8C32', count:10, duration:560, spread:.74, rise:1.18, orbit:.7, size:.18, shape:'spark'},
  mist: {color:'#C6D7EB', count:8, duration:920, spread:.70, rise:2.10, orbit:2.2, size:.47, shape:'smoke'},
  astral: {color:'#BA89FF', count:8, duration:650, spread:.72, rise:.75, orbit:3.8, size:.12, shape:'crystal'},
  frost: {color:'#73DFFF', count:9, duration:500, spread:.86, rise:.55, orbit:.3, size:.14, shape:'shard'},
  emerald: {color:'#57F5AC', count:6, duration:690, spread:.58, rise:.80, orbit:4.7, size:.16, shape:'crystal'},
};

export async function mountBoard(canvas, selectSquare) {
  const engine = new Engine(canvas, true);
  const scene = new Scene(engine);
  try {
    scene.clearColor = new Color4(.045, .04, .036, 1);
    const camera = new ArcRotateCamera('camera', -Math.PI / 2, .65, 13.7, new Vector3(0,.12,0), scene);
    camera.fov = .86;
    camera.lowerRadiusLimit = 10;
    camera.upperRadiusLimit = 15;
    scene.activeCamera = camera;
    const light = new HemisphericLight('room', new Vector3(-.4, 1, -.3), scene);
    light.intensity = .72;
    const keyLight = new DirectionalLight('key', new Vector3(-.5,-1,.4), scene);
    keyLight.intensity = .66;
    const theme = getComputedStyle(canvas);
    const color = name => theme.getPropertyValue('--ch-color-' + name).trim();
    const moveDuration = 235;
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const motionOff = () => reducedMotion.matches || document.documentElement.classList.contains('ch-reduce-motion');
    const moving = new Map();
    let needsFrame = true;
    // WebGL shader compilation and texture upload can outlast the first scene
    // frame. A single on-demand render can leave a permanently blank canvas.
    let warmupUntil = performance.now() + 3500;
    scene.onReadyObservable.add(() => {
      needsFrame = true;
      warmupUntil = Math.max(warmupUntil, performance.now() + 650);
    });
    scene.onBeforeRenderObservable.add(() => {
      const now = performance.now();
      for (const [mesh, {start,end,since}] of moving) {
        const progress = motionOff() ? 1 : Math.min(1, (now-since)/moveDuration);
        Vector3.LerpToRef(start,end,1-(1-progress)**3,mesh.position);
        mesh.position.y += Math.sin(Math.PI*progress)*.2;
        if (progress === 1) moving.delete(mesh);
      }
      for (const effect of effects) {
        const progress = motionOff() ? 1 : Math.min(1, Math.max(0, (now-effect.start)/effect.duration));
        effect.update(progress);
        if (progress === 1) {
          effect.dispose();
          effects.delete(effect);
        }
      }
    });

    function material(name, hex) {
      const m = new StandardMaterial(name, scene);
      m.diffuseColor = Color3.FromHexString(hex);
      return m;
    }
    const boardArt = material('maple and walnut', '#FFFFFF');
    boardArt.diffuseTexture = new Texture(
      new URL('./brand/board-maple-walnut.svg',document.baseURI).href,scene,
    );
    boardArt.specularColor = new Color3(.19,.14,.10);
    boardArt.diffuseTexture.onLoadObservable.add(() => {
      needsFrame = true;
      warmupUntil = Math.max(warmupUntil, performance.now() + 650);
    });
    const marked = material('selected', color('board-select'));
    const target = material('legal move', '#7AF2E8');
    target.emissiveColor = Color3.FromHexString('#2BABAE');
    const capture = material('capture', '#FFC482');
    capture.emissiveColor = Color3.FromHexString('#E98136');
    const captureTile = material('capture square', '#AD572C');
    const rim = material('selection rim', '#FFE3A1');
    rim.emissiveColor = Color3.FromHexString('#947047');
    const keyboardRim = material('keyboard focus rim', '#E1F6FF');
    keyboardRim.emissiveColor = Color3.FromHexString('#62BDFF');
    const previous = material('last move', color('board-last'));
    const check = material('check', color('board-check'));
    const frame = material('frame', color('brand-walnut'));
    const lightTile = material('themed light tile', '#EFD9BD');
    const darkTile = material('themed dark tile', '#976242');

    const pieces = { w: material('ivory', '#E5CCA1'), b: material('ebony', '#332927') };
    const tiles = new Map();
    const active = new Map();
    const effects = new Set();
    const cues = new Map();
    const base = CreateBox('frame', {width:8.4,depth:8.4,height:.32}, scene);
    base.material = frame;
    // Keep the top of the frame below the tile plane to avoid depth fighting.
    base.position.y = -.185;

    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const square = squareFor(file, rank);
        const mesh = CreateGround(square, {width:1,height:1}, scene);
        mesh.position.set(file - 3.5, 0, rank - 3.5);
        const uv = mesh.getVerticesData(VertexBuffer.UVKind);
        for (let index = 0; index < uv.length; index += 2) {
          uv[index] = (24 + (file + uv[index]) * 56) / 496;
          uv[index + 1] = (24 + (rank + uv[index + 1]) * 56) / 496;
        }
        mesh.setVerticesData(VertexBuffer.UVKind,uv);
        mesh.metadata = {square};
        tiles.set(square, {mesh, isLight:(file+rank)%2 === 1});
      }
    }
    function makePiece(piece, square) {
      const shape = profiles[piece.type].map(([x,y]) => new Vector3(x,y,0));
      const root = CreateLathe(piece.type, {shape, tessellation:24}, scene);
      root.material = pieces[piece.color];
      root.position.copyFrom(tiles.get(square).mesh.position);
      const detail = (name, width, height, depth, x, y, z) => {
        const mesh = CreateBox(name, {width,height,depth}, scene);
        mesh.parent = root;
        mesh.position.set(x,y,z);
        mesh.material = root.material;
        mesh.isPickable = false;
        return mesh;
      };
      if (piece.type === 'p') {
        const head = CreateSphere('pawn head',{diameter:.34,segments:12},scene);
        head.parent = root;
        head.position.y = .56;
        head.material = root.material;
        head.isPickable = false;
      }
      if (piece.type === 'b') {
        const seam = detail('bishop mitre seam',.025,.13,.025,0,.79,-.19);
        seam.rotation.z = -.55;
        seam.material = pieces[piece.color === 'w' ? 'b' : 'w'];
      }
      if (piece.type === 'k') {
        detail('cross stem', .09,.26,.09,0,1.01,0);
        detail('cross bar', .25,.07,.09,0,1.07,0);
      }
      if (piece.type === 'r') {
        for (const [x,z] of [[.21,0],[-.21,0],[0,.21],[0,-.21]]) {
          detail('battlement',.15,.13,.15,x,.77,z);
        }
      }
      if (piece.type === 'q') {
        for (let index = 0; index < 6; index++) {
          const angle = index*Math.PI/3;
          detail('crown point',.09,.14,.09,.22*Math.cos(angle),.97,.22*Math.sin(angle));
        }
      }
      if (piece.type === 'n') {
        const sculpt = (name, position, scale, angle) => {
          const mesh = CreateSphere(name, {diameter:1, segments:12}, scene);
          mesh.parent = root;
          mesh.position.set(...position);
          mesh.scaling.set(...scale);
          mesh.rotation.x = angle;
          mesh.material = root.material;
          return mesh;
        };
        sculpt('arched neck',[0,.49,.05],[.29,.58,.34],-.25);
        sculpt('horse head',[0,.72,-.06],[.26,.31,.37],.5);
        sculpt('horse muzzle',[0,.64,-.25],[.22,.19,.31],.56);
        for (const side of [-1,1]) {
          sculpt('ear',[side*.077,.875,.025],[.07,.21,.09],-.16);
          const eye = sculpt('eye',[side*.113,.755,-.14],[.035,.038,.038],0);
          eye.material = pieces[piece.color === 'w' ? 'b' : 'w'];
        }
        if(piece.color==='b') root.rotation.y=Math.PI;
      }
      for(const child of root.getChildMeshes()) {
        child.isPickable = true;
        child.metadata = {pieceRoot:root};
      }
      root.metadata = {square};
      return root;
    }
    function ring(name, square, diameter, thickness, finish) {
      const mesh = CreateTorus(name, {diameter, thickness, tessellation:24}, scene);
      mesh.position.copyFrom(tiles.get(square).mesh.position);
      mesh.position.y = .06;
      mesh.material = finish;
      mesh.isPickable = false;
      return mesh;
    }
    const keyboardFocus = ring('keyboard focus', 'a1', .98, .042, keyboardRim);
    keyboardFocus.setEnabled(false);
    let keyboardSquare;

    function syncCue(square, kind) {
      const current = cues.get(square);
      if (current?.kind === kind) return;
      current?.mesh.dispose();
      cues.delete(square);
      if (!kind) return;
      const mesh = kind === 'target' ? CreateSphere('legal destination', {diameter:.24, segments:10}, scene)
        : ring(kind, square, kind === 'capture' ? .9 : .78, .065, kind === 'capture' ? capture : rim);
      if (kind === 'target') {
        mesh.position.copyFrom(tiles.get(square).mesh.position);
        mesh.position.y = .042;
        mesh.scaling.y = .35;
        mesh.material = target;
        mesh.isPickable = false;
      }
      cues.set(square, {kind, mesh});
    }

    function retirePiece(mesh, start) {
      const travel = moving.get(mesh);
      if (travel) mesh.position.copyFrom(travel.end);
      moving.delete(mesh);
      mesh.isPickable = false;
      mesh.getChildMeshes().forEach(child => { child.isPickable = false; });
      effects.add({
        start, duration:280,
        update(progress) {
          mesh.scaling.setAll(Math.max(.01, 1-progress));
          mesh.position.y = Math.sin(Math.PI*progress)*.26;
          mesh.rotation.z = -.9*progress;
        },
        dispose:()=>mesh.dispose(),
      });
    }

    function impact(square, start, captured) {
      const style = royalImpacts[pieceTheme(document.documentElement.dataset.chPieces)];
      const smoke = style?.shape === 'smoke';
      const duration = captured ? style?.duration ?? 320 : 310;
      const tint = style ? material('royal impact light', style.color) : null;
      if (tint) tint.emissiveColor = tint.diffuseColor.scale(.58);
      const haze = captured && smoke ? material('capture smoke', style.color) : null;
      if (haze) haze.emissiveColor = haze.diffuseColor.scale(.23);
      const pulse = ring('landing pulse', square, .34, .055, tint ?? (captured ? capture : rim));
      const center = pulse.position.clone();
      const count = captured ? style?.count ?? 8 : 0;
      const size = style?.size ?? .072;
      const shape = style?.shape;
      const crystal = shape === 'crystal' || shape === 'shard';
      const particles = Array.from({length:count}, (_, index) => {
        const mesh = crystal
          ? CreateBox('capture crystal', {size}, scene)
          : CreateSphere('capture particle', {diameter:size, segments:smoke ? 8 : 5}, scene);
        mesh.material = haze ?? tint ?? capture;
        mesh.isPickable = false;
        return {mesh, index, angle:index * 2.399963};
      });
      const meshes = [pulse, ...particles.map(({mesh})=>mesh)];
      meshes.forEach(mesh=>mesh.setEnabled(false));
      effects.add({
        start, duration,
        update(progress) {
          if (!progress) return;
          meshes.forEach(mesh=>mesh.setEnabled(true));
          const ringProgress = Math.min(1, progress * duration / 310);
          pulse.setEnabled(ringProgress < 1);
          pulse.scaling.set(.45 + 2.7 * ringProgress, Math.max(.01, 1 - ringProgress), .45 + 2.7 * ringProgress);
          if (haze) haze.alpha = .31 * Math.sin(Math.PI * progress) ** .68;
          for (const {mesh,index,angle} of particles) {
            const theta = angle + progress * (style?.orbit ?? 0);
            const reach = progress * (style?.spread ?? .7) * (.55 + .15 * (index % 4));
            const lift = smoke || shape === 'spark' ? progress : Math.sin(Math.PI * progress);
            const drift = smoke ? .48 * progress ** 2 : 0;
            mesh.position.set(center.x + Math.cos(theta) * reach + drift, center.y + lift * (style?.rise ?? .52) * (.59 + .13 * (index % 4)),
              center.z + Math.sin(theta) * reach);
            const scale = smoke ? .7 + progress * 2 : Math.max(.01, 1 - progress);
            mesh.scaling.set(scale, scale * (shape === 'shard' ? 2.5 : shape === 'spark' ? 1.8 : 1), scale);
            if (!smoke) mesh.rotation.set(1.2 + theta, progress * 4, theta);
          }
        },
        dispose() {
          meshes.forEach(mesh=>mesh.dispose());
          haze?.dispose();
          tint?.dispose();
        },
      });
    }
    function animateMove(from,to) {
      const mesh = active.get(from);
      if (!mesh) return;
      active.delete(from);
      active.set(to,mesh);
      mesh.metadata.square = to;
      const end = tiles.get(to).mesh.position.clone();
      if (motionOff()) mesh.position.copyFrom(end);
      else moving.set(mesh,{start:mesh.position.clone(),end,since:performance.now()});
    }

    let styleKey;
    let texturedBoard = true;
    function syncAppearance() {
      const root = document.documentElement;
      const {chTheme, chPieces} = root.dataset;
      const contrast = root.classList.contains('high-contrast');
      const nextKey = `${chTheme}:${chPieces}:${contrast}`;
      if (styleKey === nextKey) return;
      styleKey = nextKey;
      const style = getComputedStyle(root);
      const light = style.getPropertyValue('--royal-light').trim();
      const dark = style.getPropertyValue('--royal-dark').trim();
      const wood = {walnut:['#DFC5A5','#69483F'],forest:['#EEE6C9','#397368']};
      const palette = contrast ? ['#F9E8C3','#76513D'] : light && dark ? [light,dark] : wood[chTheme];
      texturedBoard = !palette;
      if (palette) {
        lightTile.diffuseColor.copyFrom(Color3.FromHexString(palette[0]));
        darkTile.diffuseColor.copyFrom(Color3.FromHexString(palette[1]));
      }
      frame.diffuseColor.copyFrom(Color3.FromHexString(style.getPropertyValue('--royal-frame-b').trim() || color('brand-walnut')));
      const glow = style.getPropertyValue('--piece-glow').trim();
      const white = Color3.FromHexString('#E5CCA1');
      const black = Color3.FromHexString('#332927');
      pieces.w.diffuseColor.copyFrom(glow ? Color3.Lerp(white,Color3.FromHexString(glow),.24) : white);
      pieces.b.diffuseColor.copyFrom(glow ? Color3.Lerp(black,Color3.FromHexString(glow),.12) : black);
    }

    let previousGame;
    const syncTurns = (game, selected, targets, move, lastMove, checkedSide) => {
      needsFrame = true;
      syncAppearance();
      if (previousGame && game !== previousGame && !move) {
        moving.clear();
        for (const mesh of active.values()) mesh.dispose();
        active.clear();
        for (const effect of effects) effect.dispose();
        effects.clear();
      }
      previousGame = game;
      const landing = performance.now() + moveDuration * .78;
      if (move?.captured) {
        const square = move.flags.includes('e') ? move.to[0] + move.from[1] : move.to;
        const mesh = active.get(square);
        if (mesh) {
          active.delete(square);
          if (motionOff()) { moving.delete(mesh); mesh.dispose(); }
          else retirePiece(mesh, landing);
        }
      }
      if (move && !move.promotion) {
        animateMove(move.from,move.to);
        if (move.flags.includes('k')) animateMove('h'+move.to[1],'f'+move.to[1]);
        if (move.flags.includes('q')) animateMove('a'+move.to[1],'d'+move.to[1]);
      }
      if (move && !motionOff()) impact(move.to, landing, Boolean(move.captured));
      for (const [square, {mesh, isLight}] of tiles) {
        const piece = game.get(square);
        const option = targets.get(square);
        if (square === selected) mesh.material = marked;
        else if (piece?.type === 'k' && piece.color === checkedSide) mesh.material = check;
        else if (option?.captured) mesh.material = captureTile;
        else if (lastMove?.from === square || lastMove?.to === square) mesh.material = previous;
        else mesh.material = texturedBoard ? boardArt : isLight ? lightTile : darkTile;
        syncCue(square, square === selected ? 'selected' : option?.captured ? 'capture' : option ? 'target' : null);
        const old = active.get(square);
        if (old && old.name === piece?.type && old.material === pieces[piece.color]) continue;
        if (old) { moving.delete(old); old.dispose(); }
        active.delete(square);
        if (piece) {
          const placed = makePiece(piece, square);
          active.set(square, placed);
          if (move?.promotion && move.to === square && !motionOff()) {
            const end = placed.position.clone();
            placed.position.copyFrom(tiles.get(move.from).mesh.position);
            moving.set(placed,{start:placed.position.clone(),end,since:performance.now()});
          }
        }
      }
    };
    scene.onPointerObservable.add(() => {
      const hit = scene.pick(scene.pointerX, scene.pointerY,
        mesh => mesh.isPickable && (mesh.metadata?.square || mesh.metadata?.pieceRoot?.isPickable));
      const metadata = hit?.pickedMesh?.metadata;
      const square = metadata?.pieceRoot?.metadata.square ?? metadata?.square;
      if (square) selectSquare(square);
    }, PointerEventTypes.POINTERTAP);
    const observer = new ResizeObserver(() => {
      engine.resize();
      needsFrame = true;
    });
    observer.observe(canvas);
    const refresh = () => { needsFrame = true; };
    document.addEventListener('visibilitychange',refresh);
    engine.onContextRestoredObservable.add(refresh);
    engine.runRenderLoop(() => {
      if (document.hidden || !canvas.clientWidth || !(performance.now() < warmupUntil || needsFrame || moving.size || effects.size)) return;
      needsFrame = false;
      scene.render();
    });
    return {
      syncTurns,
      setKeyboardSquare(square) {
        if (keyboardSquare === square) return;
        keyboardSquare = square;
        keyboardFocus.setEnabled(Boolean(square));
        if (square) {
          const position = tiles.get(square).mesh.position;
          keyboardFocus.position.set(position.x, .10, position.z);
        }
        needsFrame = true;
      },
      setFlipped(flipped) {
        camera.alpha = flipped ? Math.PI / 2 : -Math.PI / 2;
        needsFrame = true;
      },
      dispose() {
        document.removeEventListener('visibilitychange',refresh);
        observer.disconnect();
        engine.dispose();
      },
    };
  } catch (error) {
    engine.dispose();
    throw error;
  }
}
