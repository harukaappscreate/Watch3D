// shared builders for movement parts
import * as THREE from 'three';
import * as SM from '../../geometry/Small.js';

const cache = new Map();
const cached = (key, make) => { if (!cache.has(key)) cache.set(key, make()); return cache.get(key); };

export function mesh(geo, mat) { return new THREE.Mesh(geo, mat); }

/** blued screw (head + slot + thread); returns Group with screw head at z=0 growing +zDir */
export function screwMesh(mats, r = 0.5, dir = 1, blued = true) {
  const g = new THREE.Group();
  const head = new THREE.Mesh(cached('sh' + r, () => SM.screwHeadGeometry(r, r * 0.62)), mats.get(blued ? 'blued' : 'steel'));
  const slot = new THREE.Mesh(cached('ss' + r, () => SM.screwSlotGeometry(r, r * 0.62)), mats.get('slot'));
  const thr = new THREE.Mesh(cached('st' + r, () => SM.screwThreadGeometry(r * 0.45, r * 1.8)), mats.get('steelDark'));
  g.add(head, slot, thr);
  if (dir < 0) g.rotation.x = Math.PI; // head facing -Z (back of movement)
  head.castShadow = true;
  return g;
}

export function jewelMesh(mats, r = 0.42, cap = false) {
  const geo = cap ? cached('cj' + r, () => SM.capJewelGeometry(r, r * 0.26)) : cached('j' + r, () => SM.jewelGeometry(r, r * 0.46, r * 0.14));
  const m = new THREE.Mesh(geo, mats.get('ruby'));
  return m;
}

export function chatonMesh(mats, rOut = 0.95, rIn = 0.45) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(cached('ch' + rOut, () => SM.chatonGeometry(rOut, rIn, 0.28)), mats.get('gold')));
  // two tiny chaton screws
  for (const a of [Math.PI * 0.25, Math.PI * 1.25]) {
    const s = screwMesh(mats, 0.26, 1, true);
    s.position.set(Math.cos(a) * (rOut + 0.22), Math.sin(a) * (rOut + 0.22), 0.05);
    g.add(s);
  }
  return g;
}

export function cylinder(r, z0, z1, mat, seg = 20) {
  const h = Math.abs(z1 - z0);
  const geo = cached(`cy${r}_${h}_${seg}`, () => { const c = new THREE.CylinderGeometry(r, r, h, seg); c.rotateX(Math.PI / 2); return c; });
  const m = new THREE.Mesh(geo, mat);
  m.position.z = (z0 + z1) / 2;
  return m;
}

/** lathe profile around Z: pts [[r,z],...] */
export function latheZ(pts, seg = 64) {
  const g = new THREE.LatheGeometry(pts.map(([r, z]) => new THREE.Vector2(r, z)), seg);
  g.rotateX(Math.PI / 2);
  g.computeVertexNormals();
  return g;
}
