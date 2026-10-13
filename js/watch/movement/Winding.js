// Winding: ratchet wheel, crown wheel, click, reversers, rotor
import * as THREE from 'three';
import * as S from '../../geometry/SDF.js';
import { wheelGeometry, pinionGeometry, ratchetGeometry } from '../../geometry/GearGeometry.js';
import { mesh, screwMesh, cylinder } from './helpers.js';
import { engravingTexture, sunray } from '../../materials/ProceduralTextures.js';
import { BRAND } from '../../config.js';

export function buildWinding(W, L, M, jewelCount = 21) {
  const mats = W.mats, z = L.z;
  // ---- ratchet wheel ----
  const rw = W.addPart('ratchet', 'ratchet', null, { group: 'energy', important: true });
  rw.add(mesh(ratchetGeometry({ ...M.ratchet, t: 0.42, boreR: 0.55 }), [mats.get('soleil'), mats.get('blackPolish')]));
  rw.at(L.ratchet.x, L.ratchet.y, z.ratchet);
  rw.ex.set(0, 0, -25);
  rw.labelAnchor.set(2.6, 2.6, 0);
  const rs = W.addPart('sc_ratchet', 'screw', rw, { group: 'frame', spin: 4 });
  rs.add(screwMesh(mats, 1.0, -1, false)); rs.at(0, 0, -0.21); rs.ex.set(0, 0, -3);

  // ---- crown wheel ----
  const cw = W.addPart('crownWheel', 'crownWheel', null, { group: 'energy', important: true });
  cw.add(mesh(ratchetGeometry({ ...M.crownWheel, t: 0.42, boreR: 0.4 }), [mats.get('soleil'), mats.get('blackPolish')]));
  cw.at(L.crownWheel.x, L.crownWheel.y, z.crownWheel);
  cw.ex.set(0, 0, -25);
  const cs = W.addPart('sc_crownWheel', 'screw', cw, { group: 'frame', spin: 4 });
  cs.add(screwMesh(mats, 0.7, -1, false)); cs.at(0, 0, -0.21); cs.ex.set(0, 0, -3);

  // ---- click & click spring ----
  const rR = (M.ratchet.m * M.ratchet.Z) / 2;
  const ca = (148 * Math.PI) / 180;
  const cx = L.ratchet.x + Math.cos(ca) * (rR + 1.6), cy = L.ratchet.y + Math.sin(ca) * (rR + 1.6);
  const click = W.addPart('click', 'click', null, { group: 'energy' });
  const tip = [Math.cos(ca + 0.32) * -1.6, Math.sin(ca + 0.32) * -1.6];
  const clickSDF = S.subtract(S.smoothUnion(0.3, S.circle(0, 0, 0.62), S.taper(0, 0, tip[0] + 0.2, tip[1] - 0.6, 0.45, 0.12)), S.circle(0, 0, 0.2));
  click.add(mesh(S.sdfExtrude(clickSDF, [-3, -3, 3, 3], 0.32, { res: 0.03, bevel: 0.04 }), [mats.get('steel'), mats.get('blackPolish')]));
  click.at(cx, cy, z.ratchet + 0.02);
  click.ex.set(0, 0, -23);
  const clsc = W.addPart('sc_click', 'screw', click, { group: 'frame', spin: 3 });
  clsc.add(screwMesh(mats, 0.45, -1)); clsc.at(0, 0, -0.16); clsc.ex.set(0, 0, -2.5);
  const spr = W.addPart('clickSpring', 'clickSpring', null, { group: 'energy' });
  const ks = S.arcBand(cx, cy, 2.05, 1.88, ca - 2.6, ca - 0.9);
  spr.add(mesh(S.sdfExtrude(S.smoothUnion(0.2, ks, S.circle(cx + Math.cos(ca - 2.6) * 1.96, cy + Math.sin(ca - 2.6) * 1.96, 0.3)), [cx - 3, cy - 3, cx + 3, cy + 3], 0.2, { res: 0.025, bevel: 0.03 }), [mats.get('steel'), mats.get('steel')]));
  spr.at(0, 0, z.ratchet + 0.05);
  spr.ex.set(0, 0, -22);

  // ---- reversing wheels (automatic winding) ----
  const mkRev = (id, pos, withPinion) => {
    const p = W.addPart(id, 'reverser', null, { group: 'auto', important: id === 'revA' });
    const wm = p.add(mesh(wheelGeometry({ ...M.reverser, t: 0.2, spokes: 4 }), mats.get('gilt'))); wm.position.z = z.revWheel;
    if (withPinion) { const pn = p.add(mesh(pinionGeometry({ ...M.reverserPinion, L: 0.4 }), mats.get('steel'))); pn.position.z = z.revPinion; }
    p.add(cylinder(0.14, z.bridge1 - 0.1, z.revWheel - 0.2, mats.get('steel'), 10));
    p.at(pos.x, pos.y, 0);
    p.ex.set(0, 0, -28);
    return p;
  };
  const revA = mkRev('revA', L.revA, true);
  const revB = mkRev('revB', L.revB, false);

  // ---- rotor (oscillating weight) ----
  const rotor = W.addPart('rotor', 'rotor', null, { group: 'auto', important: true });
  rotor.at(0, 0, z.rotor);
  const deg = (d) => (d * Math.PI) / 180;
  const bodySDF = S.subtract(
    S.smoothUnion(0.8,
      S.circle(0, 0, 2.3),
      S.arcBand(0, 0, 11.6, 10.3, deg(196), deg(344)),
      ...[214, 270, 326].map((a) => S.taper(0, 0, Math.cos(deg(a)) * 10.6, Math.sin(deg(a)) * 10.6, 0.75, 0.55)),
      S.arcBand(0, 0, 6.6, 5.7, deg(205), deg(335)),
    ),
    S.circle(0, 0, 1.1),
  );
  const sr = sunray(512);
  const bodyMat = mats.get('bridge').clone();
  bodyMat.normalMap = sr.normal; bodyMat.roughnessMap = sr.rough; bodyMat.normalScale = new THREE.Vector2(0.12, 0.12);
  [bodyMat.normalMap, bodyMat.roughnessMap].forEach((t) => { t.repeat.set(1 / 30, 1 / 30); t.offset.set(0.5, 0.5); });
  const rb = rotor.add(mesh(S.sdfExtrude(bodySDF, [-14, -14, 14, 14], 0.42, { res: 0.08, bevel: 0.08 }), [bodyMat, mats.get('bridgeEdge')]));
  rotor.add(mesh(pinionGeometry({ ...M.rotorPinion, L: 0.25 }), mats.get('steel'))).position.z = z.rotorPinion - z.rotor;
  rotor.add(cylinder(1.1, -0.3, 0.45, mats.get('steel'), 32)); // ball bearing
  rotor.labelAnchor.set(0, -8, 0);
  rotor.ex.set(0, 0, -33);
  // heavy gold segment with engraving
  const wt = W.addPart('rotorWeight', 'rotorWeight', rotor, { group: 'auto' });
  const wSDF = S.arcBand(0, 0, 14.2, 11.3, deg(192), deg(348));
  const tex = engravingTexture(1024, 14.5, [
    { text: `${BRAND.name}  ·  CALIBRE HA-01  ·  ${jewelCount} JEWELS`, r: 12.75, angle: -Math.PI / 2, span: Math.PI * 0.78, size: 0.78 },
  ], { color: '#6b4c1c', bg: '#ffffff' });
  tex.repeat.set(-1 / 29, 1 / 29); tex.offset.set(0.5, 0.5); // mirrored: seen from the case back
  const wMat = mats.get('gold').clone(); wMat.map = tex;
  wt.add(mesh(S.sdfExtrude(wSDF, [-14.5, -14.5, 14.5, 14.5], 0.8, { res: 0.07, bevel: 0.12 }), [wMat, mats.get('giltPolished')]));
  wt.at(0, 0, -0.18);
  wt.ex.set(0, 0, -3);
  const rsc = W.addPart('sc_rotor', 'screw', rotor, { group: 'frame', spin: 4 });
  rsc.add(screwMesh(mats, 0.8, -1)); rsc.at(0, 0, -0.25); rsc.ex.set(0, 0, -3);
  return { rw, cw, click, revA, revB, rotor };
}
