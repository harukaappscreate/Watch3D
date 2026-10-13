// =============================================================
//  Springs — breathing hairspring (GPU-deformed) and mainspring
// =============================================================
import * as THREE from 'three';

const TAU = Math.PI * 2;

/** box-section ribbon along a list of points (in XY, with z) — pts: {x,y,z,t} */
function ribbon(pts, w, h) {
  const n = pts.length;
  const pos = new Float32Array(n * 4 * 3);
  const tAttr = new Float32Array(n * 4);
  const idx = [];
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const q = pts[Math.min(n - 1, i + 1)], o = pts[Math.max(0, i - 1)];
    let tx = q.x - o.x, ty = q.y - o.y; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
    const nx = -ty * w / 2, ny = tx * w / 2; // lateral (radial) offset
    const corners = [[nx, ny, -h / 2], [-nx, -ny, -h / 2], [-nx, -ny, h / 2], [nx, ny, h / 2]];
    corners.forEach((c, k) => {
      pos.set([p.x + c[0], p.y + c[1], p.z + c[2]], (i * 4 + k) * 3);
      tAttr[i * 4 + k] = p.t;
    });
    if (i < n - 1) {
      for (let k = 0; k < 4; k++) {
        const a = i * 4 + k, b = i * 4 + ((k + 1) % 4), c = (i + 1) * 4 + k, d = (i + 1) * 4 + ((k + 1) % 4);
        idx.push(a, c, b, b, c, d);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aT', new THREE.BufferAttribute(tAttr, 1));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/**
 * Hairspring: Archimedean spiral (r0 → r1, turns) + optional raised overcoil.
 * The material's vertex shader rotates each vertex by uTheta*(1-aT)
 * so the inner end follows the balance and the outer end stays pinned.
 */
export function hairspringGeometry({ r0 = 0.42, r1 = 2.3, turns = 12, w = 0.04, h = 0.13, overcoil = true }) {
  const pts = [];
  const N = Math.floor(turns * 72);
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const a = t * turns * TAU;
    const r = r0 + (r1 - r0) * t;
    pts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, z: 0, t });
  }
  if (overcoil) {
    // terminal curve: rises then curls inward over the spring body
    const last = pts[pts.length - 1];
    const a0 = Math.atan2(last.y, last.x);
    for (let i = 1; i <= 60; i++) {
      const u = i / 60;
      const a = a0 + u * Math.PI * 1.25;
      const r = r1 - (r1 - r1 * 0.62) * Math.sin(u * Math.PI * 0.5) ** 1.5;
      const z = 0.26 * Math.min(1, u * 3);
      pts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, z, t: 1 });
    }
  }
  return ribbon(pts, w, h);
}

export function hairspringMaterial(base) {
  const mat = base.clone();
  mat.userData.uTheta = { value: 0 };
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uTheta = mat.userData.uTheta;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aT;\nuniform float uTheta;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        float th = uTheta * (1.0 - aT);
        float cs = cos(th), sn = sin(th);
        transformed.xy = mat2(cs, sn, -sn, cs) * transformed.xy;`)
      .replace('#include <beginnormal_vertex>', `#include <beginnormal_vertex>
        { float th2 = uTheta * (1.0 - aT); float c2 = cos(th2), s2 = sin(th2);
          objectNormal.xy = mat2(c2, s2, -s2, c2) * objectNormal.xy; }`);
  };
  mat.customProgramCacheKey = () => 'hairspring';
  return mat;
}

/** Mainspring inside the barrel. wind 0 (let down, against wall) … 1 (fully wound round arbor) */
export function mainspringGeometry({ rArbor = 0.9, rWall = 5.4, turns = 9, w = 0.11, h = 1.9, wind = 0.6 }) {
  const pts = [];
  const N = Math.floor(turns * 64);
  const pitch = w * 1.25;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const a = t * turns * TAU;
    // unwound: coils packed against the wall, wound: packed round the arbor
    const rWound = rArbor + pitch * t * turns;
    const rDown = rWall - pitch * (1 - t) * turns;
    const r = rDown + (rWound - rDown) * wind;
    pts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, z: 0, t });
  }
  return ribbon(pts, w, h);
}
