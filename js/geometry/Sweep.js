// =============================================================
//  Sweep — rectangular band swept along a curve (straps)
//  The band's width axis is fixed to world X.
// =============================================================
import * as THREE from 'three';

/**
 * @param curve THREE.Curve (3D)
 * @param width along X, thickness along the curve normal (in YZ-plane)
 * @param segs samples along the curve
 * @param taper fn(u)->width scale
 */
export function sweepBand(curve, width, thickness, segs = 120, taper = () => 1, round = 0.35) {
  const P = [], N = [], U = [];
  const len = curve.getLength();
  const X = new THREE.Vector3(1, 0, 0);
  for (let i = 0; i <= segs; i++) {
    const u = i / segs;
    const p = curve.getPointAt(u);
    const t = curve.getTangentAt(u);
    const n = new THREE.Vector3().crossVectors(X, t).normalize(); // outward normal of band
    P.push(p); N.push(n); U.push(u);
  }
  // cross-section: rounded rectangle (8 points)
  const cs = [];
  const r = round;
  const hw = 0.5, hh = 0.5;
  const sec = [
    [-hw, -hh + r * 0.4], [-hw + r * 0.2, -hh], [hw - r * 0.2, -hh], [hw, -hh + r * 0.4],
    [hw, hh - r * 0.4], [hw - r * 0.2, hh], [-hw + r * 0.2, hh], [-hw, hh - r * 0.4],
  ];
  const ns = sec.length;
  const pos = [], nor = [], uv = [], idx = [];
  for (let i = 0; i <= segs; i++) {
    const w = width * taper(U[i]);
    for (let k = 0; k <= ns; k++) {
      const s = sec[k % ns];
      const v = new THREE.Vector3().copy(P[i])
        .addScaledVector(X, s[0] * w)
        .addScaledVector(N[i], s[1] * thickness);
      pos.push(v.x, v.y, v.z);
      const nn = new THREE.Vector3().addScaledVector(X, s[0] * 2 * Math.abs(s[0]) * 2).addScaledVector(N[i], s[1] * 2).normalize();
      nor.push(nn.x, nn.y, nn.z);
      // u across width (0..1 on top face), v along length in mm
      uv.push(k / ns, U[i] * len);
    }
  }
  for (let i = 0; i < segs; i++) {
    for (let k = 0; k < ns; k++) {
      const a = i * (ns + 1) + k, b = a + 1, c = a + ns + 1, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  g.userData.length = len;
  return g;
}
