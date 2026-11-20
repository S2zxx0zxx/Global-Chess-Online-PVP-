import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import HavokPhysics from '@babylonjs/havok';
import {NullEngine, Scene, Vector3, MeshBuilder, PhysicsAggregate, PhysicsShapeType} from '@babylonjs/core';
import {HavokPlugin} from '@babylonjs/core/Physics/v2/Plugins/havokPlugin.js';

test('Havok gravity drops a dynamic body and the board collider catches it', async () => {
  const wasmBinary = await readFile(new URL('../node_modules/@babylonjs/havok/lib/esm/HavokPhysics.wasm', import.meta.url));
  const havok = await HavokPhysics({wasmBinary});
  const engine = new NullEngine();
  try {
    const scene = new Scene(engine);
    scene.enablePhysics(new Vector3(0,-9.81,0), new HavokPlugin(true, havok));
    const board = MeshBuilder.CreateBox('board', {width:8,height:.2,depth:8}, scene);
    board.position.y = -.1;
    new PhysicsAggregate(board, PhysicsShapeType.BOX, {mass:0}, scene);
    const piece = MeshBuilder.CreateBox('piece', {size:.4}, scene);
    piece.position.y = 2;
    new PhysicsAggregate(piece, PhysicsShapeType.BOX, {mass:.15}, scene);
    const physics = scene.getPhysicsEngine();
    for (let frame = 0; frame < 180; frame++) physics._step(1/60);
    assert.ok(piece.position.y > .15 && piece.position.y < .28, String(piece.position.y));
  } finally {
    engine.dispose();
  }
});
