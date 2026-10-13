// =============================================================
//  Strap & display cushion. Built in the watch's seated frame, but
//  NOT part of the head — it stays on the cushion when the head lifts.
// =============================================================
import * as THREE from 'three';
import { sweepBand } from '../geometry/Sweep.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import * as S from '../geometry/SDF.js';

export const CUSHION = { cz: -24.0, ay: 25.3, bz: 17.3, halfW: 34 };

const deg = (d) => (d * Math.PI) / 180;
function ellipsePt(phi, off) {
  const { cz, ay, bz } = CUSHION;
  const y = (ay + off) * Math.sin(phi);
  const z = cz + (bz + off) * Math.cos(phi);
  return new THREE.Vector3(0, y, z);
}

function strapCurves() {
  const up = [new THREE.Vector3(0, 23.4, -1.25), new THREE.Vector3(0, 25.6, -3.6)];
  for (let d = 62; d <= 205; d += 8) up.push(ellipsePt(deg(d), 0.85));
  const lo = [new THREE.Vector3(0, -23.4, -1.25), new THREE.Vector3(0, -25.6, -3.6)];
  for (let d = -62; d >= -192; d -= 8) {
    const t = Math.min(1, Math.max(0, (-d - 150) / 22));
    lo.push(ellipsePt(deg(d), 0.85 + t * 1.6));
  }
  return { up: new THREE.CatmullRomCurve3(up, false, 'centripetal'), lo: new THREE.CatmullRomCurve3(lo, false, 'centripetal') };
}

export function buildMount(mats) {
  const group = new THREE.Group();
  group.name = 'mount';
  // ---- cushion ----
  const { cz, ay, bz, halfW } = CUSHION;
  const sh = new THREE.Shape();
  sh.absellipse(0, 0, ay - 2.6, bz - 2.6, 0, Math.PI * 2, false, 0); // bevel adds 2.5
  const cg = new THREE.ExtrudeGeometry(sh, { depth: halfW * 2 - 6, bevelEnabled: true, bevelThickness: 3, bevelSize: 2.5, bevelSegments: 6, curveSegments: 64 });
  // (u,v,w) → (w - halfW, u, v + cz)
  const p = cg.attributes.position;
  for (let i = 0; i < p.count; i++) p.setXYZ(i, p.getZ(i) - halfW + 3, p.getX(i), p.getY(i) + cz);
  cg.computeVertexNormals();
  const cushion = new THREE.Mesh(cg, mats.get('velvet'));
  cushion.castShadow = true; cushion.receiveShadow = true;
  group.add(cushion);

  // ---- leather strap ----
  const { up, lo } = strapCurves();
  const leather = new THREE.Group();
  const taper = (u) => 1 - 0.2 * Math.min(1, u * 1.3);
  const thick = 1.5;
  [up, lo].forEach((c) => {
    const m = new THREE.Mesh(sweepBand(c, 20.0, thick, 160, taper, 0.5), mats.get('leather'));
    m.castShadow = true; m.receiveShadow = true;
    leather.add(m);
  });
  // tang buckle at the end of the upper strap
  const endP = up.getPointAt(1), endT = up.getTangentAt(1);
  const bSDF = S.subtract(S.box(0, 0, 9.6, 2.6, 0), S.box(0, 0, 8.4, 1.5, 0));
  const bg = S.sdfExtrude(S.smoothUnion(0.4, bSDF), [-11, -4, 11, 4], 1.4, { res: 0.08, bevel: 0.35, bevelSeg: 3 });
  const buckle = new THREE.Mesh(bg, mats.get('casePolished'));
  buckle.position.copy(endP).addScaledVector(endT, 1.6);
  const n = new THREE.Vector3().crossVectors(new THREE.Vector3(1, 0, 0), endT).normalize();
  buckle.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(1, 0, 0), endT, n));
  buckle.castShadow = true;
  leather.add(buckle);
  // keepers on the lower strap
  [0.86, 0.93].forEach((u) => {
    const kp = lo.getPointAt(u), kt = lo.getTangentAt(u);
    const kn = new THREE.Vector3().crossVectors(new THREE.Vector3(1, 0, 0), kt).normalize();
    const k = new THREE.Mesh(new RoundedBoxGeometry(17.6, 1.8, 3.6, 2, 0.6), mats.get('leather'));
    k.position.copy(kp).addScaledVector(kn, -0.2);
    k.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(1, 0, 0), kt, kn));
    k.castShadow = true;
    leather.add(k);
  });
  group.add(leather);

  // ---- metal bracelet (instanced links) ----
  const bracelet = new THREE.Group();
  const centreG = new RoundedBoxGeometry(7.2, 4.6, 2.6, 2, 0.6);
  const outerG = new RoundedBoxGeometry(6.0, 4.9, 2.4, 2, 0.5);
  const links = [];
  [up, lo].forEach((c) => {
    const L = c.getLength();
    const n = Math.floor(L / 5.15);
    for (let i = 0; i < n; i++) links.push({ c, u: (i + 0.5) / n });
  });
  const centre = new THREE.InstancedMesh(centreG, mats.get('casePolished'), links.length);
  const outer = new THREE.InstancedMesh(outerG, mats.get('caseBrushed'), links.length * 2);
  const M4 = new THREE.Matrix4(), X = new THREE.Vector3(1, 0, 0);
  links.forEach((l, i) => {
    const pt = l.c.getPointAt(l.u), tg = l.c.getTangentAt(l.u);
    const nn = new THREE.Vector3().crossVectors(X, tg).normalize();
    const w = 1 - 0.12 * l.u;
    M4.makeBasis(X, tg, nn).setPosition(pt.clone().addScaledVector(nn, 0.4));
    M4.scale(new THREE.Vector3(w, 1, 1));
    centre.setMatrixAt(i, M4);
    [-1, 1].forEach((s, k) => {
      const m = new THREE.Matrix4().makeBasis(X, tg, nn).setPosition(pt.clone().addScaledVector(nn, 0.3).addScaledVector(X, s * 6.7 * w));
      m.scale(new THREE.Vector3(w, 1, 1));
      outer.setMatrixAt(i * 2 + k, m);
    });
  });
  centre.castShadow = outer.castShadow = true;
  centre.receiveShadow = outer.receiveShadow = true;
  bracelet.add(centre, outer);
  bracelet.visible = false;
  group.add(bracelet);

  return {
    group,
    setType(type) { leather.visible = type !== 'metal'; bracelet.visible = type === 'metal'; },
  };
}
