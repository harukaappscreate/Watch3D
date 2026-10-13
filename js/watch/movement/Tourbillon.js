// =============================================================
//  Flying tourbillon — rotating cage carrying the Swiss lever
//  escapement and the balance. One revolution per minute.
//  Cage frame: origin = cage axis.
// =============================================================
import * as THREE from 'three';
import * as S from '../../geometry/SDF.js';
import { pinionGeometry, escapeWheelGeometry } from '../../geometry/GearGeometry.js';
import { hairspringGeometry, hairspringMaterial } from '../../geometry/Spring.js';
import { mesh, cylinder, screwMesh, jewelMesh } from './helpers.js';

const polar = (r, deg) => [Math.cos((deg * Math.PI) / 180) * r, Math.sin((deg * Math.PI) / 180) * r];

export function buildTourbillon(W, L, M) {
  const mats = W.mats, z = L.z;
  const E = L.esc, P = L.pallet;
  const pillarA = [90, 210, 330];

  const cage = W.addPart('tourbillon', 'tourbillon', null, { group: 'regulating', important: true });
  cage.at(L.cage.x, L.cage.y, 0);
  cage.labelAnchor.set(3.6, 3.6, 1.6);
  cage.ex.set(0, 0, 19);
  // pillars
  pillarA.forEach((a) => {
    const [x, y] = polar(4.32, a);
    const p = cage.add(cylinder(0.24, z.cageLower, z.cageUpper, mats.get('blackPolish'), 14));
    p.position.x = x; p.position.y = y;
  });

  // ---- cage pinion (driven by the third wheel) ----
  const cpn = W.addPart('cagePinion', 'cagePinion', cage, { group: 'regulating' });
  const pm = cpn.add(mesh(pinionGeometry({ ...M.cagePinion, L: 0.4 }), mats.get('steel'))); pm.position.z = z.cagePinion;
  cpn.add(cylinder(0.2, -3.6, z.cageLower, mats.get('steel')));
  cpn.ex.set(0, 0, -7);

  // ---- lower frame ----
  const lower = W.addPart('cageLower', 'cageFrame', cage, { group: 'regulating' });
  const lowerSDF = S.subtract(
    S.smoothUnion(0.5,
      S.ring(0, 0, 4.62, 4.18),
      S.circle(0, 0, 0.95), S.circle(E.x, E.y, 0.62), S.circle(P.x, P.y, 0.5),
      S.taper(0, 0, E.x, E.y, 0.42, 0.3), S.taper(E.x, E.y, 4.3, -0.6, 0.3, 0.32),
      S.taper(0, 0, P.x, P.y, 0.35, 0.3),
      S.taper(0, 0, ...polar(4.3, 150), 0.42, 0.3), S.taper(0, 0, ...polar(4.3, 245), 0.42, 0.3),
      ...pillarA.map((a) => S.circle(...polar(4.32, a), 0.5)),
    ),
    S.circle(0, 0, 0.28), S.circle(E.x, E.y, 0.16), S.circle(P.x, P.y, 0.14),
  );
  lower.add(mesh(S.sdfExtrude(lowerSDF, [-4.8, -4.8, 4.8, 4.8], 0.18, { res: 0.035, bevel: 0.035 }), [mats.get('titanium'), mats.get('blackPolish')]));
  lower.at(0, 0, z.cageLower);
  lower.ex.set(0, 0, -3);
  [['jw_bal_low', 0, 0], ['jw_esc_low', E.x, E.y], ['jw_pal_low', P.x, P.y]].forEach(([id, x, y]) => {
    const j = W.addPart(id, 'holeJewel', lower, { group: 'jewel' });
    j.add(jewelMesh(mats, id === 'jw_bal_low' ? 0.42 : 0.3)); j.at(x, y, 0); j.ex.set(0, 0, -1.5);
  });

  // ---- escape wheel + pinion ----
  const esc = W.addPart('escapeWheel', 'escapeWheel', cage, { group: 'regulating', important: true });
  esc.at(E.x, E.y, 0);
  const ew = esc.add(mesh(escapeWheelGeometry({ Z: M.escape.Z, r: M.escape.r, t: 0.14 }), mats.get('steel'))); ew.position.z = z.escape;
  const ep = esc.add(mesh(pinionGeometry({ ...M.escapePinion, L: 0.26 }), mats.get('steel'))); ep.position.z = z.fixedWheel;
  esc.add(cylinder(0.07, z.fixedWheel - 0.2, z.cageUpper, mats.get('steel'), 10));
  esc.labelAnchor.set(0, 0, z.escape);
  esc.ex.set(0, 0, 1.2);

  // ---- pallet fork (lever) ----
  const pal = W.addPart('pallet', 'pallet', cage, { group: 'regulating', important: true });
  pal.at(P.x, P.y, 0);
  // geometry in pallet frame (origin = pallet pivot)
  const toE = Math.atan2(E.y - P.y, E.x - P.x);
  const dE = Math.hypot(E.x - P.x, E.y - P.y);
  const r = M.escape.r;
  const stoneAng = 0.4; // spread of the pallets around the escape wheel (rad), seen from E
  const ex = E.x - P.x, ey = E.y - P.y;
  const fromE = Math.atan2(-ey, -ex); // direction E→P
  const stA = [ex + Math.cos(fromE + stoneAng) * (r + 0.05), ey + Math.sin(fromE + stoneAng) * (r + 0.05)];
  const stB = [ex + Math.cos(fromE - stoneAng) * (r + 0.05), ey + Math.sin(fromE - stoneAng) * (r + 0.05)];
  const toB = Math.atan2(-P.y, -P.x);
  const dB = Math.hypot(P.x, P.y);
  const horn = [Math.cos(toB) * (dB - 0.62), Math.sin(toB) * (dB - 0.62)];
  const nx = -Math.sin(toB), ny = Math.cos(toB);
  const palSDF = S.subtract(
    S.smoothUnion(0.25,
      S.circle(0, 0, 0.32),
      S.taper(0, 0, stA[0] * 0.9, stA[1] * 0.9, 0.2, 0.14),
      S.taper(0, 0, stB[0] * 0.9, stB[1] * 0.9, 0.2, 0.14),
      S.taper(0, 0, horn[0], horn[1], 0.15, 0.11),
      S.segment(horn[0] + nx * 0.17, horn[1] + ny * 0.17, horn[0] + nx * 0.17 + Math.cos(toB) * 0.25, horn[1] + ny * 0.17 + Math.sin(toB) * 0.25, 0.07),
      S.segment(horn[0] - nx * 0.17, horn[1] - ny * 0.17, horn[0] - nx * 0.17 + Math.cos(toB) * 0.25, horn[1] - ny * 0.17 + Math.sin(toB) * 0.25, 0.07),
    ),
    S.circle(0, 0, 0.07),
  );
  pal.add(mesh(S.sdfExtrude(palSDF, [-2.5, -2.5, 2.5, 2.5], 0.14, { res: 0.02, bevel: 0.025 }), [mats.get('steel'), mats.get('blackPolish')])).position.z = z.escape;
  pal.add(cylinder(0.06, z.cageLower, z.cageUpper, mats.get('steel'), 10));
  // pallet stones (ruby) — set radially to the escape wheel
  [['jw_pal_in', stA], ['jw_pal_out', stB]].forEach(([id, st]) => {
    const j = W.addPart(id, 'palletStone', pal, { group: 'jewel' });
    const g = new THREE.BoxGeometry(0.5, 0.13, 0.2);
    const m = j.add(mesh(g, mats.get('ruby')));
    const a = Math.atan2(st[1] - ey, st[0] - ex);
    m.rotation.z = a;
    j.at(st[0], st[1], z.escape);
    j.ex.set(0, 0, 1.2);
  });
  pal.ex.set(0, 0, 2.6);
  pal.userData = { toE, dE };

  // ---- balance wheel ----
  const bal = W.addPart('balance', 'balance', cage, { group: 'regulating', important: true });
  bal.at(0, 0, 0);
  const balSDF = S.smoothUnion(0.3,
    S.ring(0, 0, 3.25, 2.98),
    S.circle(0, 0, 0.42),
    ...[90, 210, 330].map((a) => S.taper(0, 0, ...polar(3.0, a), 0.17, 0.14)),
  );
  const bm = bal.add(mesh(S.sdfExtrude(S.subtract(balSDF, S.circle(0, 0, 0.09)), [-3.4, -3.4, 3.4, 3.4], 0.22, { res: 0.03, bevel: 0.03 }), [mats.get('gilt'), mats.get('giltPolished')]));
  bm.position.z = z.balance;
  // inertia / timing screws on the rim
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    const s = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.3, 10), mats.get('gold'));
    s.rotation.z = a + Math.PI / 2; // radial
    s.position.set(Math.cos(a) * 3.37, Math.sin(a) * 3.37, z.balance);
    bal.add(s);
  }
  bal.add(cylinder(0.08, z.cageLower - 0.05, z.cageUpper + 0.05, mats.get('steel'), 10)); // staff
  // double roller + impulse jewel
  const roller = bal.add(cylinder(0.42, z.escape - 0.06, z.escape + 0.06, mats.get('steel'), 24));
  const ip = W.addPart('jw_impulse', 'impulseJewel', bal, { group: 'jewel' });
  const toP = Math.atan2(P.y, P.x);
  ip.add(mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.3, 10).rotateX(Math.PI / 2), mats.get('ruby')));
  ip.at(Math.cos(toP) * 0.34, Math.sin(toP) * 0.34, z.escape);
  ip.ex.set(0, 0, 1);
  bal.labelAnchor.set(-2.2, 2.2, z.balance);
  bal.ex.set(0, 0, 6);
  bal.userData = { roller };

  // ---- hairspring (child of cage — its outer end is pinned to the cage) ----
  const hs = W.addPart('hairspring', 'hairspring', cage, { group: 'regulating', important: true });
  const hsMat = hairspringMaterial(mats.get('spring'));
  const hsGeo = hairspringGeometry({ r0: 0.42, r1: 2.38, turns: 12, overcoil: true });
  hs.add(mesh(hsGeo, hsMat), { cast: false });
  // stud
  const stud = hs.add(mesh(new THREE.BoxGeometry(0.4, 0.3, 0.35), mats.get('steel')));
  stud.position.set(-1.12, -1.12, 0.3);
  hs.at(0, 0, z.hairspring);
  hs.ex.set(0, 0, 9);
  hs.userData = { material: hsMat };

  // ---- upper frame (lyre-shaped cage bridge) ----
  const upper = W.addPart('cageUpper', 'cageFrame', cage, { group: 'regulating' });
  const upperSDF = S.subtract(
    S.smoothUnion(0.55,
      S.ring(0, 0, 4.62, 4.22),
      S.circle(0, 0, 1.0), S.circle(E.x, E.y, 0.5), S.circle(P.x, P.y, 0.42),
      ...pillarA.map((a) => S.circle(...polar(4.32, a), 0.52)),
      ...pillarA.map((a) => S.taper(0, 0, ...polar(4.25, a + 22), 0.36, 0.22)),
      S.taper(0, 0, E.x, E.y, 0.3, 0.22), S.taper(E.x, E.y, ...polar(4.25, 0), 0.22, 0.25),
      S.taper(P.x, P.y, ...polar(4.25, 60), 0.2, 0.22),
    ),
    S.circle(0, 0, 0.3), ...pillarA.map((a) => S.circle(...polar(4.32, a), 0.14)),
  );
  upper.add(mesh(S.sdfExtrude(upperSDF, [-4.8, -4.8, 4.8, 4.8], 0.18, { res: 0.035, bevel: 0.04 }), [mats.get('blackPolish'), mats.get('blackPolish')]));
  upper.at(0, 0, z.cageUpper);
  upper.ex.set(0, 0, 12.5);
  [['jw_bal_up', 0, 0, 0.42], ['jw_esc_up', E.x, E.y, 0.3], ['jw_pal_up', P.x, P.y, 0.26]].forEach(([id, x, y, rr]) => {
    const j = W.addPart(id, 'holeJewel', upper, { group: 'jewel' });
    j.add(jewelMesh(mats, rr)); j.at(x, y, 0.02); j.ex.set(0, 0, 1.6);
  });
  const cap = W.addPart('jw_bal_cap', 'capJewel', upper, { group: 'jewel' });
  cap.add(jewelMesh(mats, 0.5, true)); cap.at(0, 0, 0.16); cap.ex.set(0, 0, 3);
  pillarA.forEach((a, i) => {
    const s = W.addPart('sc_cage_' + i, 'screw', upper, { group: 'frame', spin: 3 });
    const [x, y] = polar(4.32, a);
    s.add(screwMesh(mats, 0.3, 1)); s.at(x, y, 0.09); s.ex.set(0, 0, 2.4);
  });

  // ---- seconds pointer on the cage ----
  const ptr = W.addPart('cagePointer', 'cagePointer', cage, { group: 'display' });
  const ps = new THREE.Shape();
  ps.moveTo(-0.13, 2.6); ps.lineTo(0.13, 2.6); ps.lineTo(0.09, 4.9); ps.lineTo(0.0, 5.45); ps.lineTo(-0.09, 4.9); ps.closePath();
  const pg = new THREE.ExtrudeGeometry(ps, { depth: 0.06, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 1 });
  ptr.add(mesh(pg, mats.get('blued')));
  ptr.at(0, 0, z.cagePointer);
  ptr.ex.set(0, 0, 15);
  return { cage, esc, pal, bal, hs };
}
