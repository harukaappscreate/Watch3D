// Motion works (hour/minute reduction 12:1) + date mechanism (dial side)
import * as THREE from 'three';
import { wheelGeometry, pinionGeometry } from '../../geometry/GearGeometry.js';
import { dateRingTexture } from '../../materials/ProceduralTextures.js';
import { mesh, cylinder } from './helpers.js';

export function buildMotionWorks(W, L, M) {
  const mats = W.mats, z = L.z;
  const cannon = W.addPart('cannon', 'cannon', null, { group: 'display', important: true });
  cannon.add(mesh(pinionGeometry({ ...M.cannon, L: 0.3 }), mats.get('steel'))).position.z = z.cannon;
  cannon.add(cylinder(0.32, M.plateT, z.minuteHand + 0.15, mats.get('steel'), 16));
  cannon.ex.set(0, 0, 13);

  const mw = W.addPart('minuteWheel', 'minuteWheel', null, { group: 'display', important: true });
  mw.add(mesh(wheelGeometry({ ...M.minuteWheel, t: 0.2, spokes: 4 }), mats.get('gilt'))).position.z = z.minuteWheel;
  mw.add(mesh(pinionGeometry({ ...M.minutePinion, L: 0.28 }), mats.get('steel'))).position.z = z.minutePinion;
  mw.add(cylinder(0.12, M.plateT, z.minutePinion + 0.2, mats.get('steel'), 10));
  mw.at(L.minuteWheel.x, L.minuteWheel.y, 0);
  mw.ex.set(0, 0, 15);

  const hw = W.addPart('hourWheel', 'hourWheel', null, { group: 'display', important: true });
  hw.add(mesh(wheelGeometry({ ...M.hourWheel, t: 0.2, spokes: 5, boreR: 0.36 }), mats.get('gilt'))).position.z = z.hourWheel;
  hw.add(cylinder(0.48, z.hourWheel, z.hourHand + 0.08, mats.get('giltPolished'), 20));
  hw.ex.set(0, 0, 17);

  const dd = W.addPart('dateDriver', 'dateDriver', null, { group: 'display' });
  dd.add(mesh(wheelGeometry({ ...M.dateDriver, t: 0.18, spokes: 5 }), mats.get('gilt'))).position.z = z.dateDriver;
  const finger = dd.add(mesh(new THREE.BoxGeometry(0.35, 1.2, 0.18), mats.get('steel')));
  finger.position.set(0, 5.6, z.dateDriver + 0.16);
  dd.at(L.dateDriver.x, L.dateDriver.y, 0);
  dd.ex.set(0, 0, 19);

  // date ring with internal teeth and printed numerals
  const dr = W.addPart('dateRing', 'dateRing', null, { group: 'display', important: true });
  const ro = 15.05, ri = 13.3; // outside the tourbillon aperture (max r 13.15)
  const shape = new THREE.Shape(); shape.absarc(0, 0, ro, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  const N = 31 * 4;
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * Math.PI * 2;
    const r = i % 4 === 0 ? ri - 0.3 : ri; // 31 internal teeth
    if (i === 0) hole.moveTo(Math.cos(a) * r, Math.sin(a) * r); else hole.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  shape.holes.push(hole);
  const g = new THREE.ExtrudeGeometry(shape, { depth: 0.12, bevelEnabled: false, curveSegments: 96 });
  g.translate(0, 0, -0.06);
  const tex = dateRingTexture(2048, ro, ri);
  tex.repeat.set(1 / (2 * ro), 1 / (2 * ro)); tex.offset.set(0.5, 0.5);
  const mat = mats.get('dateRing').clone(); mat.map = tex;
  dr.add(mesh(g, mat));
  dr.at(0, 0, z.dateRing);
  dr.labelAnchor.set(11.3, 0, 0);
  dr.ex.set(0, 0, 22);
  return { cannon, mw, hw, dd, dr };
}
