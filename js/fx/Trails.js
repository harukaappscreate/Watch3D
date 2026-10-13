// Light trails behind fast-moving parts (meteor assembly)
import * as THREE from 'three';

export class Trails {
  constructor(scene, maxTrails = 90, len = 14) {
    this.len = len; this.max = maxTrails;
    const n = maxTrails * (len - 1) * 2;
    this.pos = new Float32Array(n * 3);
    this.col = new Float32Array(n * 3);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
    this.geo = g;
    this.lines = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.lines.frustumCulled = false;
    this.lines.renderOrder = 10;
    scene.add(this.lines);
    this.tracks = new Map();
    this.enabled = false;
    this.v = new THREE.Vector3();
  }
  start(parts) { this.enabled = true; this.tracks.clear(); parts.slice(0, this.max).forEach((p) => this.tracks.set(p, [])); }
  stop() { this.enabled = false; this.tracks.clear(); this.pos.fill(0); this.col.fill(0); this.geo.attributes.position.needsUpdate = true; this.geo.attributes.color.needsUpdate = true; }
  update() {
    if (!this.enabled) return;
    let k = 0;
    const warm = [1.0, 0.78, 0.45];
    for (const [p, h] of this.tracks) {
      p.explode.getWorldPosition(this.v);
      const last = h[0];
      if (!last || last.distanceToSquared(this.v) > 0.04) h.unshift(this.v.clone()); else if (h.length > 1) h.pop();
      if (h.length > this.len) h.pop();
      for (let i = 0; i < this.len - 1; i++) {
        const a = h[i], b = h[i + 1];
        const base = (k * (this.len - 1) + i) * 6;
        if (a && b) {
          this.pos.set([a.x, a.y, a.z, b.x, b.y, b.z], base);
          const f1 = (1 - i / this.len) * 0.9, f2 = (1 - (i + 1) / this.len) * 0.9;
          this.col.set([warm[0] * f1, warm[1] * f1, warm[2] * f1, warm[0] * f2, warm[1] * f2, warm[2] * f2], base);
        } else {
          this.col.fill(0, base, base + 6);
        }
      }
      k++;
    }
    this.geo.attributes.position.needsUpdate = true;
    this.geo.attributes.color.needsUpdate = true;
  }
}
