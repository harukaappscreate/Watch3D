// Main plate + tourbillon lower bar + fixed (seconds) wheel
import * as THREE from 'three';
import * as S from '../../geometry/SDF.js';
import { wheelGeometry } from '../../geometry/GearGeometry.js';
import { mesh, screwMesh, jewelMesh, cylinder } from './helpers.js';

export function buildMainplate(W, L, M) {
  const mats = W.mats, z = L.z;
  const R = M.radius;
  // ---- main plate ----
  const plate = W.addPart('mainplate', 'mainplate', null, { group: 'frame', important: true });
  const plateSDF = S.subtract(
    S.circle(0, 0, R - 0.1),
    S.circle(L.cage.x, L.cage.y, 4.92),           // tourbillon aperture
    S.circle(0, 0, 0.32),                          // centre arbor hole
    S.circle(L.third.x, L.third.y, 0.25),
    S.box(R - 0.3, 0, 1.0, 0.55),                  // winding-stem notch
  );
  const pg = S.sdfExtrude(plateSDF, [-R, -R, R, R], M.plateT, { res: 0.12, bevel: 0.1 });
  plate.add(mesh(pg, [mats.get('plate'), mats.get('plateEdge')]));
  plate.at(0, 0, M.plateT / 2);
  plate.labelAnchor.set(-10, 4, 0);
  plate.ex.set(0, 0, 0);
  // dial-side jewels set in the plate
  [['jw_plate_c', 0, 0], ['jw_plate_3', L.third.x, L.third.y]].forEach(([id, x, y]) => {
    const j = W.addPart(id, 'holeJewel', plate, { group: 'jewel' });
    j.add(jewelMesh(mats, 0.4)); j.at(x, y, M.plateT / 2 + 0.02); j.ex.set(0, 0, 2.5);
  });

  // ---- tourbillon lower bar (carries the fixed wheel) ----
  const bar = W.addPart('tbBar', 'tbBar', null, { group: 'regulating' });
  const barSDF = S.subtract(
    S.smoothUnion(0.8, S.segment(-6.2, 0, 6.2, 0, 0.72), S.circle(0, 0, 1.35), S.circle(-6.2, 0, 1.0), S.circle(6.2, 0, 1.0)),
    S.circle(0, 0, 0.3)
  );
  bar.add(mesh(S.sdfExtrude(barSDF, [-7.5, -1.6, 7.5, 1.6], 0.36, { res: 0.05, bevel: 0.06 }), [mats.get('bridge'), mats.get('bridgeEdge')]));
  bar.at(L.cage.x, L.cage.y, z.tbBar - 0.2);
  bar.ex.set(0, 0, 7);
  for (const sx of [-6.2, 6.2]) {
    const s = W.addPart('sc_bar_' + (sx > 0 ? 'r' : 'l'), 'screw', bar, { group: 'frame', spin: 3 });
    s.add(screwMesh(mats, 0.5, -1)); s.at(sx, 0, -0.18); s.ex.set(0, 0, -3);
  }
  const jb = W.addPart('jw_bar', 'holeJewel', bar, { group: 'jewel' });
  jb.add(jewelMesh(mats, 0.42)); jb.at(0, 0, 0); jb.ex.set(0, 0, -2.2);

  // ---- fixed wheel (stationary seconds wheel of the tourbillon) ----
  const fw = W.addPart('fixedWheel', 'fixedWheel', null, { group: 'regulating', important: true });
  const fwg = wheelGeometry({ ...M.fixedWheel, t: 0.2, spokes: 5, boreR: 0.34, bevel: 0.02, curve: 0.3 });
  fw.add(mesh(fwg, mats.get('steel')));
  fw.add(cylinder(0.75, -0.36, -0.08, mats.get('steel')));   // hub post screwed on the bar
  fw.at(L.cage.x, L.cage.y, z.fixedWheel);
  fw.ex.set(0, 0, 11);
  return { plate, bar, fw };
}
