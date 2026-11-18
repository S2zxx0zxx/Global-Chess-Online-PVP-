import {
  ArcRotateCamera, Color3, DirectionalLight, DynamicTexture, Engine, HemisphericLight, MeshBuilder, PhysicsAggregate,
  PhysicsMotionType, PhysicsShapeType, Scene, StandardMaterial, Vector3,
} from '@babylonjs/core';
import { HavokPlugin } from '@babylonjs/core/Physics/v2/Plugins/havokPlugin.js';
import HavokPhysics from '@babylonjs/havok';
import havokWasm from '@babylonjs/havok/lib/esm/HavokPhysics.wasm?url';

const profiles = {
  p: [[.27,0],[.29,.09],[.17,.17],[.12,.36],[.16,.39],[.17,.43],[.10,.46],[0,.46]],
  r: [[.34,0],[.34,.12],[.23,.22],[.23,.55],[.34,.59],[.34,.75],[0,.75]],
  n: [[.33,0],[.33,.1],[.2,.2],[.18,.75],[0,.8]],
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
    const camera = new ArcRotateCamera('camera', -Math.PI / 2, .48, 11.6, Vector3.Zero(), scene);
    camera.fov = .86;
    camera.lowerRadiusLimit = 10;
    camera.upperRadiusLimit = 15;
    scene.activeCamera = camera;
    const light = new HemisphericLight('room', new Vector3(-.4, 1, -.3), scene);
    light.intensity = .78;
    const keyLight = new DirectionalLight('key', new Vector3(-.5,-1,.4), scene);
    keyLight.intensity = .92;
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const moving = new Map();
    let needsFrame = true;
    scene.onBeforeRenderObservable.add(() => {
      const now = performance.now();
      for (const [mesh, {start,end,since}] of moving) {
        const progress = Math.min(1, (now-since)/210);
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
    const maple = material('maple', '#DEB782');
    const walnut = material('walnut', '#75412B');
    function addWoodGrain(surface, base, grain) {
      const texture = new DynamicTexture(surface.name + ' grain', {width:256,height:128}, scene, true);
      const ctx = texture.getContext();
      ctx.fillStyle = base;
      ctx.fillRect(0,0,256,128);
      ctx.strokeStyle = grain;
      for (let row = 0; row < 128; row += 2) {
        ctx.globalAlpha = .08 + Math.abs(Math.sin(row * 2.39)) * .24;
        ctx.beginPath();
        ctx.moveTo(0,row);
        for (let x = 0; x <= 256; x += 8) {
          ctx.lineTo(x,row + Math.sin(x / 37 + row / 11)*2 + Math.sin(x / 13 + row)*.65);
        }
        ctx.stroke();
      }
      texture.update();
      surface.diffuseColor = Color3.White();
      surface.diffuseTexture = texture;
      surface.specularColor = new Color3(.19,.14,.10);
    }
    addWoodGrain(maple,'#dcb681','#81533b');
    addWoodGrain(walnut,'#73412e','#351b13');
    const marked = material('selected', '#CDA14D');
    const target = material('legal move', '#8D854D');
    const pieces = { w: material('ivory', '#F8E0BB'), b: material('ebony', '#332432') };
    const tiles = new Map();
    const active = new Map();
    const effects = new Map();
    const base = MeshBuilder.CreateBox('frame', {width:8.4,depth:8.4,height:.32}, scene);
    base.material = walnut;
    base.position.y = -.16;
    new PhysicsAggregate(base, PhysicsShapeType.BOX, {mass:0, friction:.65}, scene);

    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const square = squareFor(file, rank);
        const mesh = MeshBuilder.CreateGround(square, {width:1,height:1}, scene);
        mesh.position.set(file - 3.5, 0, rank - 3.5);
        const color = (rank + file) % 2 ? maple : walnut;
        mesh.metadata = {square};
        tiles.set(square, {mesh, color});
      }
    }
    function makePiece(piece, square) {
      const shape = profiles[piece.type].map(([x,y]) => new Vector3(x,y,0));
      const root = MeshBuilder.CreateLathe(piece.type, {shape, tessellation:24}, scene);
      root.material = pieces[piece.color];
      root.position.copyFrom(tiles.get(square).mesh.position);
      const detail = (name, width, height, depth, x, y, z) => {
        const mesh = MeshBuilder.CreateBox(name, {width,height,depth}, scene);
        mesh.parent = root;
        mesh.position.set(x,y,z);
        mesh.material = root.material;
        mesh.isPickable = false;
        return mesh;
      };
      if (piece.type === 'p') {
        const head = MeshBuilder.CreateSphere('pawn head',{diameter:.34,segments:12},scene);
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
      if (piece.type === 'n') detail('horse head', .24,.22,.36,0,.71,-.1).rotation.x = -.28;
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
      if (reducedMotion.matches) mesh.position.copyFrom(end);
      else moving.set(mesh,{start:mesh.position.clone(),end,since:performance.now()});
    }

    let previousGame;
    const syncTurns = (game, selected, targets, move) => {
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
          if (reducedMotion.matches) { moving.delete(mesh); mesh.dispose(); }
          else scatter(mesh);
        }
      }
      if (move && !move.promotion) {
        animateMove(move.from,move.to);
        if (move.flags.includes('k')) animateMove('h'+move.to[1],'f'+move.to[1]);
        if (move.flags.includes('q')) animateMove('a'+move.to[1],'d'+move.to[1]);
      }
      for (const [square, {mesh, color}] of tiles) {
        mesh.material = square === selected ? marked : targets.includes(square) ? target : color;
        const piece = game.get(square);
        const old = active.get(square);
        if (old && old.name === piece?.type && old.material === pieces[piece.color]) continue;
        if (old) { moving.delete(old); old.dispose(); }
        active.delete(square);
        if (piece) {
          const placed = makePiece(piece, square);
          active.set(square, placed);
          if (move?.promotion && move.to === square && !reducedMotion.matches) {
            const end = placed.position.clone();
            placed.position.copyFrom(tiles.get(move.from).mesh.position);
            moving.set(placed,{start:placed.position.clone(),end,since:performance.now()});
          }
        }
      }
    };
    scene.onPointerDown = () => {
      const hit = scene.pick(scene.pointerX, scene.pointerY,
        mesh => tiles.get(mesh.metadata?.square)?.mesh === mesh);
      const square = hit?.pickedMesh?.metadata?.square;
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
      if (document.hidden || !(needsFrame || moving.size || effects.size)) return;
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
