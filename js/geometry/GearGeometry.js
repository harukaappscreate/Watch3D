// =============================================================
//  GearGeometry — procedural horological wheels & pinions.
//  Teeth use an ogival (cycloid-like) addendum typical of
//  watch gearing rather than the involute used in machinery.
// =============================================================
import * as THREE from 'three';

const TAU = Math.PI * 2;

/** outline points (CCW) of a toothed wheel */
export function toothOutline(Z, m, { addendum = 1.32, dedendum = 1.6, thick = 0.5, tipSeg = 4, rootSeg = 2 } = {}) {
  const rp = (m * Z) / 2;
  const ra = rp + m * addendum;
  const rr = Math.max(rp - m * dedendum, m);
  const p = TAU / Z;
  const halfT = (p * thick) / 2;           // half tooth angle at pitch circle
  const halfR = halfT * 1.06 * (rp / rr) * 0.92; // root half angle (slightly wider)
  const pts = [];
  for (let i = 0; i < Z; i++) {
    const a = i * p;
    // root arc from previous gap centre to tooth start
    for (let k = 0; k <= rootSeg; k++) {
      const aa = a - p / 2 + ((p / 2 - halfR) * k) / rootSeg;
      pts.push(new THREE.Vector2(Math.cos(aa) * rr, Math.sin(aa) * rr));
    }
    // straight radial flank up to pitch circle
    pts.push(new THREE.Vector2(Math.cos(a - halfT) * rp, Math.sin(a - halfT) * rp));
    // ogival addendum
    for (let k = 1; k < tipSeg; k++) {
      const t = k / tipSeg;
      const r = rp + (ra - rp) * Math.sin((t * Math.PI) / 2);
      const w = halfT * Math.cos((t * Math.PI) / 2) * (rp / r);
      pts.push(new THREE.Vector2(Math.cos(a - w) * r, Math.sin(a - w) * r));
    }
    pts.push(new THREE.Vector2(Math.cos(a) * ra, Math.sin(a) * ra));
    for (let k = tipSeg - 1; k >= 1; k--) {
      const t = k / tipSeg;
      const r = rp + (ra - rp) * Math.sin((t * Math.PI) / 2);
      const w = halfT * Math.cos((t * Math.PI) / 2) * (rp / r);
      pts.push(new THREE.Vector2(Math.cos(a + w) * r, Math.sin(a + w) * r));
    }
    pts.push(new THREE.Vector2(Math.cos(a + halfT) * rp, Math.sin(a + halfT) * rp));
    for (let k = 0; k < rootSeg; k++) {
      const aa = a + halfR + ((p / 2 - halfR) * k) / rootSeg;
      pts.push(new THREE.Vector2(Math.cos(aa) * rr, Math.sin(aa) * rr));
    }
  }
  return { pts, rp, ra, rr };
}

function circlePath(r, seg = 32, cx = 0, cy = 0, Ctor = THREE.Path) {
  const p = new Ctor();
  p.absarc(cx, cy, r, 0, TAU, false);
  return p;
}

/** spoke windows between rim and hub (curved "crossings") */
function spokeHoles(rimIn, hubR, n, spokeW, curve = 0.25, seg = 18) {
  const holes = [];
  const step = TAU / n;
  for (let i = 0; i < n; i++) {
    const a0 = i * step, a1 = (i + 1) * step;
    const path = new THREE.Path();
    const pts = [];
    const twist = (r) => curve * ((r - hubR) / (rimIn - hubR)) * step; // curved spokes
    const halfAng = (r) => spokeW / 2 / r;
    // outer arc
    for (let k = 0; k <= seg; k++) {
      const a = a0 + twist(rimIn) + halfAng(rimIn) + ((a1 - a0 - 2 * halfAng(rimIn)) * k) / seg;
      pts.push(new THREE.Vector2(Math.cos(a) * rimIn, Math.sin(a) * rimIn));
    }
    // trailing spoke edge (curved) down to hub
    for (let k = 1; k <= 6; k++) {
      const r = rimIn + ((hubR - rimIn) * k) / 6;
      const a = a1 + twist(r) - halfAng(r);
      pts.push(new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r));
    }
    // inner arc back
    for (let k = 1; k <= seg / 2; k++) {
      const a = a1 + twist(hubR) - halfAng(hubR) - ((a1 - a0 - 2 * halfAng(hubR)) * k) / (seg / 2);
      pts.push(new THREE.Vector2(Math.cos(a) * hubR, Math.sin(a) * hubR));
    }
    // leading spoke edge back up
    for (let k = 1; k < 6; k++) {
      const r = hubR + ((rimIn - hubR) * k) / 6;
      const a = a0 + twist(r) + halfAng(r);
      pts.push(new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r));
    }
    path.setFromPoints(pts);
    holes.push(path);
  }
  return holes;
}

/**
 * Wheel geometry (extruded, centred on z).
 * opts: Z, m, t (thickness), spokes, hubR, boreR, rimW, spokeW, curve, bevel
 */
export function wheelGeometry(o) {
  const { Z, m, t = 0.25, spokes = 5, boreR = 0.12, bevel = 0.03, curve = 0.22 } = o;
  const { pts, rr, rp, ra } = toothOutline(Z, m, o.tooth);
  const shape = new THREE.Shape(pts);
  const rimW = o.rimW ?? Math.max(0.28, rr * 0.13);
  const hubR = o.hubR ?? Math.max(0.35, rr * 0.2);
  const rimIn = rr - rimW;
  if (spokes > 0 && rimIn - hubR > 0.35) {
    spokeHoles(rimIn, hubR, spokes, o.spokeW ?? Math.max(0.16, rr * 0.07), curve).forEach((h) => shape.holes.push(h));
  }
  if (boreR > 0) shape.holes.push(circlePath(boreR, 16));
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(0.01, t - bevel * 2), bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel * 0.8,
    bevelSegments: 1, curveSegments: 6,
  });
  g.translate(0, 0, -(t - bevel * 2) / 2);
  g.computeVertexNormals();
  g.userData = { rp, ra, rr };
  return g;
}

/** pinion leaves (no spokes), extruded along z length L */
export function pinionGeometry({ Z, m, L = 0.5, boreR = 0 }) {
  const { pts, rp, ra } = toothOutline(Z, m, { addendum: 0.9, dedendum: 1.3, thick: 0.42, tipSeg: 3, rootSeg: 2 });
  const shape = new THREE.Shape(pts);
  if (boreR > 0) shape.holes.push(circlePath(boreR, 12));
  const g = new THREE.ExtrudeGeometry(shape, { depth: L, bevelEnabled: false, curveSegments: 4 });
  g.translate(0, 0, -L / 2);
  g.computeVertexNormals();
  g.userData = { rp, ra };
  return g;
}

/** Swiss-lever club-tooth escape wheel */
export function escapeWheelGeometry({ Z = 20, r = 1.45, t = 0.14, spokes = 4 }) {
  const p = TAU / Z;
  const rr = r * 0.7;
  const pts = [];
  const P = (rad, a) => new THREE.Vector2(Math.cos(a) * rad, Math.sin(a) * rad);
  for (let i = 0; i < Z; i++) {
    const a = i * p;
    pts.push(P(rr, a - 0.5 * p));
    pts.push(P(rr, a - 0.4 * p));
    pts.push(P(r * 0.86, a - 0.2 * p));
    pts.push(P(r * 0.985, a - 0.06 * p));
    pts.push(P(r, a));                 // locking corner
    pts.push(P(r * 0.955, a + 0.13 * p)); // club impulse face
    pts.push(P(r * 0.87, a + 0.12 * p));
    pts.push(P(r * 0.78, a + 0.05 * p));
    pts.push(P(rr * 1.03, a - 0.02 * p));
    pts.push(P(rr, a + 0.1 * p));
    pts.push(P(rr, a + 0.3 * p));
  }
  const shape = new THREE.Shape(pts);
  spokeHoles(rr - 0.16, 0.22, spokes, 0.1, 0.0, 12).forEach((h) => shape.holes.push(h));
  shape.holes.push(circlePath(0.05, 12));
  const g = new THREE.ExtrudeGeometry(shape, { depth: t, bevelEnabled: false, curveSegments: 4 });
  g.translate(0, 0, -t / 2);
  g.computeVertexNormals();
  return g;
}

/** ratchet-wheel (saw teeth) — used for ratchet / crown wheels */
export function ratchetGeometry({ Z, m, t = 0.4, boreR = 0.5, bevel = 0.04 }) {
  const rp = (m * Z) / 2, ra = rp + m * 0.9, rr = rp - m * 1.0;
  const p = TAU / Z;
  const pts = [];
  for (let i = 0; i < Z; i++) {
    const a = i * p;
    pts.push(new THREE.Vector2(Math.cos(a) * rr, Math.sin(a) * rr));
    pts.push(new THREE.Vector2(Math.cos(a + p * 0.72) * ra, Math.sin(a + p * 0.72) * ra));
    pts.push(new THREE.Vector2(Math.cos(a + p * 0.8) * ra, Math.sin(a + p * 0.8) * ra));
    pts.push(new THREE.Vector2(Math.cos(a + p * 0.82) * rr, Math.sin(a + p * 0.82) * rr));
  }
  const shape = new THREE.Shape(pts);
  shape.holes.push(circlePath(boreR, 24));
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: t - bevel * 2, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 8,
  });
  g.translate(0, 0, -(t - bevel * 2) / 2);
  g.computeVertexNormals();
  g.userData = { rp, ra };
  return g;
}

/** a plain arbor (shaft) along z, from z0 to z1, with conical pivots */
export function arborGeometry(r, z0, z1, pivot = 0.25) {
  const prof = [
    new THREE.Vector2(0.0, z0),
    new THREE.Vector2(r * 0.45, z0 + 0.02),
    new THREE.Vector2(r * 0.45, z0 + pivot),
    new THREE.Vector2(r, z0 + pivot + r * 0.6),
    new THREE.Vector2(r, z1 - pivot - r * 0.6),
    new THREE.Vector2(r * 0.45, z1 - pivot),
    new THREE.Vector2(r * 0.45, z1 - 0.02),
    new THREE.Vector2(0.0, z1),
  ];
  const g = new THREE.LatheGeometry(prof, 16);
  g.rotateX(Math.PI / 2); // lathe axis Y -> Z
  // after rotateX(+90°) y->z mapping: (x, y, z) -> (x, -z, y)… keep z = prof.y
  return g;
}

export const pitchR = (spec) => (spec.m * spec.Z) / 2;
export const centreDist = (a, b) => pitchR(a) + pitchR(b);
