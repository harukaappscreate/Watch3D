// =============================================================
//  Small parts — screws, jewels, chatons, pillars (lathe-based)
// =============================================================
import * as THREE from 'three';

const lathe = (pts, seg = 24) => {
  const g = new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg);
  g.rotateX(Math.PI / 2); // axis -> +Z
  g.computeVertexNormals();
  return g;
};

/** domed screw head with polished chamfer; z=0 is seat, head grows +z */
export function screwHeadGeometry(r = 0.55, h = 0.32) {
  return lathe([
    [0, 0], [r * 0.98, 0], [r, h * 0.12], [r, h * 0.55], [r * 0.9, h * 0.8], [r * 0.6, h * 0.97], [0, h],
  ], 28);
}
export function screwThreadGeometry(r = 0.25, L = 0.9) {
  const g = new THREE.CylinderGeometry(r, r * 0.8, L, 12, 1);
  g.rotateX(Math.PI / 2); g.translate(0, 0, -L / 2);
  return g;
}
export function screwSlotGeometry(r = 0.55, h = 0.32) {
  const g = new THREE.BoxGeometry(r * 2.1, r * 0.22, h * 0.5);
  g.translate(0, 0, h * 0.86);
  return g;
}

/** olive-domed hole jewel with oil sink; centred z (thickness t) */
export function jewelGeometry(r = 0.5, t = 0.22, hole = 0.07) {
  return lathe([
    [hole, -t / 2], [r * 0.96, -t / 2], [r, -t / 2 + t * 0.15], [r, t * 0.1],
    [r * 0.82, t * 0.38], [r * 0.45, t / 2], [hole * 2.4, t * 0.42], [hole, t * 0.1], [hole, -t / 2],
  ], 28);
}
/** flat cap jewel */
export function capJewelGeometry(r = 0.45, t = 0.12) {
  return lathe([[0, -t / 2], [r, -t / 2], [r, t * 0.2], [r * 0.85, t / 2], [0, t / 2]], 28);
}
/** gold chaton ring that holds a jewel */
export function chatonGeometry(rOut = 0.95, rIn = 0.5, t = 0.3) {
  return lathe([
    [rIn, -t / 2], [rOut, -t / 2], [rOut, t * 0.2], [rOut * 0.93, t / 2], [rIn * 1.12, t / 2], [rIn, t * 0.3], [rIn, -t / 2],
  ], 36);
}
/** cylindrical pillar / post */
export function pillarGeometry(r, h, seg = 16) {
  const g = new THREE.CylinderGeometry(r, r, h, seg);
  g.rotateX(Math.PI / 2);
  return g;
}
/** torus gasket in XY plane */
export function gasketGeometry(R, r) {
  return new THREE.TorusGeometry(R, r, 10, 96);
}
