// =============================================================
//  SDF2D — 2D signed-distance modelling → THREE.Shape
//  Used for bridges, cage frames, levers… organic outlines with
//  smooth fillets just like hand-finished watch parts.
// =============================================================
import * as THREE from 'three';

// ---- primitives (return d<0 inside) ----
export const circle = (cx, cy, r) => (x, y) => Math.hypot(x - cx, y - cy) - r;
export const ring = (cx, cy, R, r) => (x, y) => { const d = Math.hypot(x - cx, y - cy); return Math.max(d - R, r - d); };
export const segment = (ax, ay, bx, by, w) => (x, y) => {
  const px = x - ax, py = y - ay, vx = bx - ax, vy = by - ay;
  const h = Math.max(0, Math.min(1, (px * vx + py * vy) / (vx * vx + vy * vy)));
  return Math.hypot(px - vx * h, py - vy * h) - w;
};
/** tapered segment: width wa at a, wb at b */
export const taper = (ax, ay, bx, by, wa, wb) => (x, y) => {
  const px = x - ax, py = y - ay, vx = bx - ax, vy = by - ay;
  const h = Math.max(0, Math.min(1, (px * vx + py * vy) / (vx * vx + vy * vy)));
  return Math.hypot(px - vx * h, py - vy * h) - (wa + (wb - wa) * h);
};
export const box = (cx, cy, hw, hh, rot = 0) => (x, y) => {
  const c = Math.cos(-rot), s = Math.sin(-rot);
  let dx = (x - cx) * c - (y - cy) * s, dy = (x - cx) * s + (y - cy) * c;
  dx = Math.abs(dx) - hw; dy = Math.abs(dy) - hh;
  return Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) + Math.min(Math.max(dx, dy), 0);
};
/** annular sector between angles a0..a1 (radians) */
export const arcBand = (cx, cy, R, r, a0, a1) => (x, y) => {
  const dx = x - cx, dy = y - cy;
  const d = Math.hypot(dx, dy);
  let a = Math.atan2(dy, dx);
  const mid = (a0 + a1) / 2, half = (a1 - a0) / 2;
  let da = a - mid; da = Math.atan2(Math.sin(da), Math.cos(da));
  const radial = Math.max(d - R, r - d);
  const ang = (Math.abs(da) - half) * Math.max(d, 0.001);
  return Math.max(radial, ang);
};

// ---- operations ----
export const union = (...f) => (x, y) => { let d = Infinity; for (const g of f) d = Math.min(d, g(x, y)); return d; };
export const smoothUnion = (k, ...f) => (x, y) => {
  let d = f[0](x, y);
  for (let i = 1; i < f.length; i++) {
    const b = f[i](x, y);
    const h = Math.max(k - Math.abs(d - b), 0) / k;
    d = Math.min(d, b) - h * h * k * 0.25;
  }
  return d;
};
export const subtract = (a, ...b) => (x, y) => { let d = a(x, y); for (const g of b) d = Math.max(d, -g(x, y)); return d; };
export const smoothSubtract = (k, a, b) => (x, y) => {
  const d1 = a(x, y), d2 = -b(x, y);
  const h = Math.max(k - Math.abs(d1 - d2), 0) / k;
  return Math.max(d1, d2) + h * h * k * 0.25;
};
export const intersect = (...f) => (x, y) => { let d = -Infinity; for (const g of f) d = Math.max(d, g(x, y)); return d; };

// ---- contour extraction (marching squares) ----
function marching(fn, x0, y0, x1, y1, res) {
  const nx = Math.ceil((x1 - x0) / res) + 1, ny = Math.ceil((y1 - y0) / res) + 1;
  const v = new Float32Array(nx * ny);
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) v[j * nx + i] = fn(x0 + i * res, y0 + j * res);
  const segs = [];
  const key = (x, y) => `${Math.round(x * 1e4)},${Math.round(y * 1e4)}`;
  const lerp = (a, b, va, vb) => a + (b - a) * (va / (va - vb));
  for (let j = 0; j < ny - 1; j++) {
    for (let i = 0; i < nx - 1; i++) {
      const a = v[j * nx + i], b = v[j * nx + i + 1], c = v[(j + 1) * nx + i + 1], d = v[(j + 1) * nx + i];
      const X = x0 + i * res, Y = y0 + j * res;
      let idx = 0;
      if (a < 0) idx |= 1; if (b < 0) idx |= 2; if (c < 0) idx |= 4; if (d < 0) idx |= 8;
      if (idx === 0 || idx === 15) continue;
      const e = [
        [lerp(X, X + res, a, b), Y],                 // bottom
        [X + res, lerp(Y, Y + res, b, c)],           // right
        [lerp(X, X + res, d, c), Y + res],           // top
        [X, lerp(Y, Y + res, a, d)],                 // left
      ];
      const P = (k) => e[k];
      // segments oriented so that inside is on the left (CCW outer loops)
      switch (idx) {
        case 1: segs.push([P(3), P(0)]); break;
        case 2: segs.push([P(0), P(1)]); break;
        case 3: segs.push([P(3), P(1)]); break;
        case 4: segs.push([P(1), P(2)]); break;
        case 5: segs.push([P(3), P(2)], [P(1), P(0)]); break;
        case 6: segs.push([P(0), P(2)]); break;
        case 7: segs.push([P(3), P(2)]); break;
        case 8: segs.push([P(2), P(3)]); break;
        case 9: segs.push([P(2), P(0)]); break;
        case 10: segs.push([P(2), P(1)], [P(0), P(3)]); break;
        case 11: segs.push([P(2), P(1)]); break;
        case 12: segs.push([P(1), P(3)]); break;
        case 13: segs.push([P(1), P(0)]); break;
        case 14: segs.push([P(0), P(3)]); break;
      }
    }
  }
  // chain
  const startMap = new Map();
  segs.forEach((s, i) => startMap.set(key(s[0][0], s[0][1]), i));
  const used = new Uint8Array(segs.length);
  const loops = [];
  for (let i = 0; i < segs.length; i++) {
    if (used[i]) continue;
    const loop = [];
    let cur = i;
    while (cur !== undefined && !used[cur]) {
      used[cur] = 1;
      const s = segs[cur];
      loop.push(new THREE.Vector2(s[0][0], s[0][1]));
      cur = startMap.get(key(s[1][0], s[1][1]));
    }
    if (loop.length > 8) loops.push(loop);
  }
  return loops;
}

function simplify(pts, tol) {
  // radial-distance + collinearity simplification (keeps loops closed)
  if (pts.length < 10) return pts;
  const out = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++) {
    const a = out[out.length - 1], b = pts[i], c = pts[i + 1];
    const abx = b.x - a.x, aby = b.y - a.y, acx = c.x - a.x, acy = c.y - a.y;
    const cross = Math.abs(abx * acy - aby * acx) / (Math.hypot(acx, acy) + 1e-9);
    if (cross > tol || Math.hypot(abx, aby) > tol * 40) out.push(b);
  }
  out.push(pts[pts.length - 1]);
  return out;
}

const area = (p) => { let s = 0; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; s += a.x * b.y - b.x * a.y; } return s / 2; };
function inside(pt, poly) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if ((a.y > pt.y) !== (b.y > pt.y) && pt.x < ((b.x - a.x) * (pt.y - a.y)) / (b.y - a.y) + a.x) c = !c;
  }
  return c;
}

/**
 * Build THREE.Shape[] from an SDF.
 * @param fn  sdf (x,y)->d
 * @param bounds [x0,y0,x1,y1]
 * @param res grid resolution (mm)
 */
export function sdfToShapes(fn, bounds, res = 0.1, tol = 0.004) {
  const [x0, y0, x1, y1] = bounds;
  const loops = marching(fn, x0 - res * 2, y0 - res * 2, x1 + res * 2, y1 + res * 2, res).map((l) => simplify(l, tol));
  const outers = [], holes = [];
  // segments keep the inside on their right → outer loops are clockwise (area<0)
  loops.forEach((l) => (area(l) < 0 ? outers : holes).push(l));
  const shapes = outers.map((o) => ({ shape: new THREE.Shape(o.slice().reverse()), poly: o, a: Math.abs(area(o)) }));
  holes.forEach((h) => {
    const owner = shapes.filter((s) => inside(h[0], s.poly)).sort((p, q) => p.a - q.a)[0];
    if (owner) owner.shape.holes.push(new THREE.Path(h));
  });
  return shapes.map((s) => s.shape);
}

/** convenience: extrude SDF to geometry centred on z (thickness t) */
export function sdfExtrude(fn, bounds, t, { res = 0.1, bevel = 0.08, bevelSeg = 2, curveSegments = 1 } = {}) {
  const shapes = sdfToShapes(fn, bounds, res);
  const geo = new THREE.ExtrudeGeometry(shapes, {
    depth: Math.max(0.01, t - bevel * 2), bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel,
    bevelSegments: bevelSeg, curveSegments, steps: 1,
  });
  geo.translate(0, 0, -(t - bevel * 2) / 2);
  geo.computeVertexNormals();
  return geo;
}
