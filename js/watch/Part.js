// =============================================================
//  Part — one physical component of the watch.
//  root (assembled place) → explode (choreography offset)
//       → motion (kinematic rotation) → meshes
// =============================================================
import * as THREE from 'three';

export class Part {
  constructor(id, type, opts = {}) {
    this.id = id;
    this.type = type;            // key into the parts registry / locales
    this.group = opts.group || 'energy';
    this.root = new THREE.Group();
    this.root.name = id;
    this.explode = new THREE.Group();
    this.motion = new THREE.Group();
    this.root.add(this.explode);
    this.explode.add(this.motion);
    this.meshes = [];
    this.parentPart = null;
    this.children = [];
    this.ex = new THREE.Vector3(0, 0, 0); // layered explode offset (parent frame)
    this.spin = opts.spin || 0;           // turns while (dis)assembling (screws)
    this.centre = new THREE.Vector2();    // xy in movement frame, for radial layouts
    this.order = 0;
    this.important = !!opts.important;
    this.labelAnchor = new THREE.Vector3();
    this.userState = { visible: true };
  }
  at(x, y, z = 0) { this.root.position.set(x, y, z); this.centre.set(x, y); return this; }
  add(mesh, opts = {}) {
    mesh.userData.part = this;
    mesh.castShadow = opts.cast ?? true;
    mesh.receiveShadow = opts.receive ?? true;
    (opts.static ? this.explode : this.motion).add(mesh);
    this.meshes.push(mesh);
    return mesh;
  }
  /** offset relative to assembled position (set by choreographies) */
  setOffset(v, rot) {
    this.explode.position.copy(v);
    if (rot) this.explode.rotation.set(rot.x, rot.y, rot.z);
  }
  worldCentre(target = new THREE.Vector3()) {
    return this.motion.localToWorld(target.copy(this.labelAnchor));
  }
}
