// =============================================================
//  Watch — builds every part in assembly order and keeps the
//  registry (id → Part). The head is the movable watch body.
// =============================================================
import * as THREE from 'three';
import { MOVEMENT } from '../config.js';
import { Part } from './Part.js';
import { computeLayout } from './movement/layout.js';
import { buildMainplate } from './movement/Mainplate.js';
import { buildTrain, updateMainspring } from './movement/Train.js';
import { buildTourbillon } from './movement/Tourbillon.js';
import { buildBridges } from './movement/Bridges.js';
import { buildWinding } from './movement/Winding.js';
import { buildKeyless } from './movement/Keyless.js';
import { buildMotionWorks } from './movement/MotionWorks.js';
import { buildDial } from './Dial.js';
import { buildHands } from './Hands.js';
import { buildCase } from './Case.js';

export const JEWEL_TYPES = new Set(['holeJewel', 'capJewel', 'palletStone', 'impulseJewel']);

export class Watch {
  constructor(mats) {
    this.mats = mats;
    this.parts = new Map();
    this.list = [];
    this.head = new THREE.Group();
    this.head.name = 'watchHead';
    this.L = computeLayout();
    const L = this.L, M = MOVEMENT;

    buildMainplate(this, L, M);
    buildKeyless(this, L, M);
    buildTrain(this, L, M);
    buildTourbillon(this, L, M);
    buildBridges(this, L, M);
    this.jewelCount = this.list.filter((p) => JEWEL_TYPES.has(p.type)).length;
    buildWinding(this, L, M, this.jewelCount);
    buildMotionWorks(this, L, M);
    this.dial = buildDial(this, L, this.jewelCount);
    buildHands(this, L);
    buildCase(this, L);

    this.list.forEach((p, i) => { p.order = i; });
    // movement-frame centre of each part (for radial choreographies)
    this.head.updateMatrixWorld(true);
    const inv = new THREE.Matrix4().copy(this.head.matrixWorld).invert();
    const v = new THREE.Vector3();
    this.list.forEach((p) => {
      p.root.getWorldPosition(v).applyMatrix4(inv);
      p.centre.set(v.x, v.y);
      p.baseZ = v.z;
    });
  }

  addPart(id, type, parent, opts = {}) {
    if (this.parts.has(id)) throw new Error('duplicate part ' + id);
    const p = new Part(id, type, opts);
    p.parentPart = parent || null;
    (parent ? parent.motion : this.head).add(p.root);
    if (parent) parent.children.push(p);
    this.parts.set(id, p);
    this.list.push(p);
    return p;
  }
  get(id) { return this.parts.get(id); }
  updateMainspring(wind) { updateMainspring(this.get('mainspring'), wind); }

  /** all meshes (for raycasting) */
  meshes() { const out = []; this.list.forEach((p) => out.push(...p.meshes)); return out; }
  /** top-level part that owns a mesh's part (for picking whole assemblies) */
  types() { const s = new Map(); this.list.forEach((p) => { if (!s.has(p.type)) s.set(p.type, []); s.get(p.type).push(p); }); return s; }
}
