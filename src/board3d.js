import {
  ArcRotateCamera, Color3, Engine, HemisphericLight, MeshBuilder, PhysicsAggregate,
  PhysicsMotionType, PhysicsShapeType, Scene, StandardMaterial, Vector3,
} from '@babylonjs/core';
import { HavokPlugin } from '@babylonjs/core/Physics/v2/Plugins/havokPlugin.js';
import HavokPhysics from '@babylonjs/havok';
import havokWasm from '@babylonjs/havok/lib/esm/HavokPhysics.wasm?url';

const profiles = {
  p: [[.27,0],[.29,.09],[.17,.17],[.12,.36],[.19,.43],[.16,.55],[0,.61]],
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
    scene.activeCamera = camera;
    const light = new HemisphericLight('room', new Vector3(-.4, 1, -.3), scene);
    light.intensity = 1.15;

    function material(name, hex) {
      const m = new StandardMaterial(name, scene);
      m.diffuseColor = Color3.FromHexString(hex);
      return m;
    }
    const maple = material('maple', '#DEB782');
    const walnut = material('walnut', '#75412B');
    const marked = material('selected', '#CDA14D');
    const target = material('legal move', '#8D854D');
    const pieces = { w: material('ivory', '#F8E0BB'), b: material('ebony', '#332432') };
    const tiles = new Map();
    const active = new Map();
    const effects = new Map();
    const base = MeshBuilder.CreateBox('frame', {width:8.4,depth:8.4,height:.32}, scene);
    base.material = walnut;
    base.position.y = -.18;
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
      if (piece.type === 'k') {
        detail('cross stem', .09,.26,.09,0,1.01,0);
        detail('cross bar', .25,.07,.09,0,1.07,0);
      }
      if (piece.type === 'n') detail('horse head', .24,.22,.36,0,.71,-.1).rotation.x = -.28;
      root.metadata = {square};
      return root;
    }
    function scatter(mesh) {
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
      }, 1100);
      effects.set(body, timer);
    }
    const syncTurns = (game, selected, targets, move) => {
      if (move?.captured) {
        const square = move.flags.includes('e') ? move.to[0] + move.from[1] : move.to;
        const mesh = active.get(square);
        if (mesh) {
          active.delete(square);
          scatter(mesh);
        }
      }
      for (const [square, {mesh, color}] of tiles) {
        mesh.material = square === selected ? marked : targets.includes(square) ? target : color;
        const piece = game.get(square);
        const old = active.get(square);
        if (old && old.name === piece?.type && old.material === pieces[piece.color]) continue;
        old?.dispose();
        active.delete(square);
        if (piece) active.set(square, makePiece(piece, square));
      }
    };
    scene.onPointerDown = (_, info) => {
      const square = info.pickedMesh?.metadata?.square;
      if (square) selectSquare(square);
    };
    const observer = new ResizeObserver(() => engine.resize());
    observer.observe(canvas);
    engine.runRenderLoop(() => { if (!document.hidden) scene.render(); });
    return {
      syncTurns,
      dispose() {
        observer.disconnect();
        for (const [body, timer] of effects) {
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
