// Use Babylon's pure tree-shakeable imports to avoid bundling unrelated 3D systems.
import {
  ArcRotateCamera, Color3, Color4, CreateBox, CreateGround, CreateLathe, CreateSphere,
  DirectionalLight, Engine, HavokPlugin, HemisphericLight, PhysicsAggregate,
  PhysicsMotionType, PhysicsShapeType, Scene, StandardMaterial, Texture, Vector3, VertexBuffer,
  RegisterStandardEngineExtensions, RegisterJoinedPhysicsEngineComponent,
  RegisterPhysicsV2PhysicsEngineComponent, RegisterStandardMaterial, RegisterTexture, RegisterRay,
} from '@babylonjs/core/pure.js';

RegisterStandardEngineExtensions();
RegisterJoinedPhysicsEngineComponent();
RegisterPhysicsV2PhysicsEngineComponent();
RegisterStandardMaterial();
RegisterTexture();
RegisterRay();
import HavokPhysics from '@babylonjs/havok';
import havokWasm from '@babylonjs/havok/lib/esm/HavokPhysics.wasm?url';

const profiles = {
  p: [[.27,0],[.29,.09],[.17,.17],[.12,.36],[.16,.39],[.17,.43],[.10,.46],[0,.46]],
  r: [[.34,0],[.34,.12],[.23,.22],[.23,.55],[.34,.59],[.34,.75],[0,.75]],
  n: [[.33,0],[.33,.1],[.22,.18],[.17,.42],[.14,.57],[0,.6]],
  b: [[.31,0],[.32,.1],[.18,.23],[.13,.55],[.25,.69],[.16,.83],[0,.91]],
  q: [[.34,0],[.34,.1],[.19,.22],[.15,.64],[.3,.87],[.25,.95],[.12,.98],[0,1.08]],
  k: [[.35,0],[.35,.11],[.21,.24],[.16,.67],[.28,.81],[.24,.91],[.1,.94],[0,.98]],
};
const squareFor = (file, rank) => 'abcdefgh'[file] + (rank + 1);

export async function mountBoard(canvas, selectSquare) {
  const engine = new Engine(canvas, true);
  const scene = new Scene(engine);
  try {
    const havok = await HavokPhysics({ locateFile: () => havokWasm });
    scene.enablePhysics(new Vector3(0, -9.81, 0), new HavokPlugin(true, havok));
    scene.getPhysicsEngine().setTimeStep(1 / 60);
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
    const moveDuration = 180;
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
        const progress = Math.min(1, (now-since)/moveDuration);
        Vector3.LerpToRef(start,end,1-(1-progress)**3,mesh.position);
        mesh.position.y += Math.sin(Math.PI*progress)*.12;
        if (progress === 1) moving.delete(mesh);
      }
    });

    function material(name, hex) {
      const m = new StandardMaterial(name, scene);
      m.diffuseColor = Color3.FromHexString(hex);
      return m;
    }
    const boardArt = material('maple and walnut', '#FFFFFF');
    boardArt.diffuseTexture = new Texture(
      new URL('./chess-assets/board/maple-walnut.webp',document.baseURI).href,scene,
    );
    boardArt.specularColor = new Color3(.19,.14,.10);
    boardArt.diffuseTexture.onLoadObservable.add(() => {
      needsFrame = true;
      warmupUntil = Math.max(warmupUntil, performance.now() + 650);
    });
    const marked = material('selected', color('board-select'));
    const target = material('legal move', color('board-hint'));
    const previous = material('last move', color('board-last'));
    const check = material('check', color('board-check'));
    const frame = material('frame', color('brand-walnut'));

    const pieces = { w: material('ivory', '#E5CCA1'), b: material('ebony', '#332927') };
    const tiles = new Map();
    const active = new Map();
    const effects = new Map();
    const base = CreateBox('frame', {width:8.4,depth:8.4,height:.32}, scene);
    base.material = frame;
    // Keep the top of the frame below the tile plane to avoid depth fighting.
    base.position.y = -.185;
    new PhysicsAggregate(base, PhysicsShapeType.BOX, {mass:0, friction:.65}, scene);

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
        const color = boardArt;
        mesh.metadata = {square};
        tiles.set(square, {mesh, color});
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
    function scatter(mesh) {
      const travel = moving.get(mesh);
      if (travel) mesh.position.copyFrom(travel.end);
      moving.delete(mesh);
      mesh.isPickable = false;
      mesh.getChildMeshes().forEach(child => { child.isPickable = false; });
      const body = new PhysicsAggregate(mesh, PhysicsShapeType.CONVEX_HULL,
        {mass:.15, friction:.65, restitution:.27}, scene);
      body.body.setMotionType(PhysicsMotionType.DYNAMIC);
      body.body.applyImpulse(new Vector3(.24,.38,-.16), mesh.position.add(new Vector3(0,.3,0)));
      const timer = setTimeout(() => {
        body.dispose();
        mesh.dispose();
        effects.delete(body);
        needsFrame = true;
      }, 1100);
      effects.set(body, {timer,mesh});
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

    let previousGame;
    const syncTurns = (game, selected, targets, move, lastMove, checkedSide) => {
      needsFrame = true;
      if (previousGame && game !== previousGame && !move) {
        moving.clear();
        for (const mesh of active.values()) mesh.dispose();
        active.clear();
        for (const [body, {timer,mesh}] of effects) {
          clearTimeout(timer);
          body.dispose();
          mesh.dispose();
        }
        effects.clear();
      }
      previousGame = game;
      if (move?.captured) {
        const square = move.flags.includes('e') ? move.to[0] + move.from[1] : move.to;
        const mesh = active.get(square);
        if (mesh) {
          active.delete(square);
          if (motionOff()) { moving.delete(mesh); mesh.dispose(); }
          else scatter(mesh);
        }
      }
      if (move && !move.promotion) {
        animateMove(move.from,move.to);
        if (move.flags.includes('k')) animateMove('h'+move.to[1],'f'+move.to[1]);
        if (move.flags.includes('q')) animateMove('a'+move.to[1],'d'+move.to[1]);
      }
      for (const [square, {mesh, color}] of tiles) {
        const piece = game.get(square);
        if (square === selected) mesh.material = marked;
        else if (piece?.type === 'k' && piece.color === checkedSide) mesh.material = check;
        else if (targets.includes(square)) mesh.material = target;
        else if (lastMove?.from === square || lastMove?.to === square) mesh.material = previous;
        else mesh.material = color;
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
    scene.onPointerDown = () => {
      const hit = scene.pick(scene.pointerX, scene.pointerY,
        mesh => mesh.isPickable && (mesh.metadata?.square || mesh.metadata?.pieceRoot?.isPickable));
      const metadata = hit?.pickedMesh?.metadata;
      const square = metadata?.pieceRoot?.metadata.square ?? metadata?.square;
      if (square) selectSquare(square);
    };
    const observer = new ResizeObserver(() => {
      engine.resize();
      needsFrame = true;
    });
    observer.observe(canvas);
    const refresh = () => { needsFrame = true; };
    document.addEventListener('visibilitychange',refresh);
    engine.onContextRestoredObservable.add(refresh);
    engine.runRenderLoop(() => {
      if (document.hidden || !(performance.now() < warmupUntil || needsFrame || moving.size || effects.size)) return;
      needsFrame = false;
      scene.render();
    });
    return {
      syncTurns,
      setFlipped(flipped) {
        camera.alpha = flipped ? Math.PI / 2 : -Math.PI / 2;
        needsFrame = true;
      },
      dispose() {
        document.removeEventListener('visibilitychange',refresh);
        observer.disconnect();
        for (const [body, {timer}] of effects) {
          clearTimeout(timer);
          body.dispose();
        }
        engine.dispose();
      },
    };
  } catch (error) {
    engine.dispose();
    throw error;
  }
}
