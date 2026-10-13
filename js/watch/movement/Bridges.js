// Bridges (back side) with Côtes de Genève, anglage, chatons and jewels
import * as THREE from 'three';
import * as S from '../../geometry/SDF.js';
import { mesh, screwMesh, jewelMesh, chatonMesh, cylinder } from './helpers.js';

export function buildBridges(W, L, M) {
  const mats = W.mats, z = L.z;
  const R = M.radius - 0.25;
  const T = Math.abs(z.bridge1 - z.bridge0);
  const zc = (z.bridge0 + z.bridge1) / 2;
  const third = L.third, cage = L.cage, revB = L.revB;

  // ---- train bridge ----
  const trainScrews = [[-10.6, -4.6], [8.6, -8.6], [-7.2, -11.2]];
  const trainSDF = S.intersect(
    S.smoothUnion(1.6,
      S.segment(-10.6, -4.6, 0, 0, 1.45),
      S.segment(0, 0, third.x, third.y, 1.35),
      S.segment(third.x, third.y, cage.x, cage.y, 1.05),
      S.circle(cage.x, cage.y, 1.55),
      S.segment(cage.x, cage.y, -7.2, -11.2, 1.0),
      S.segment(third.x, third.y, 8.6, -8.6, 1.05),
      S.circle(revB.x, revB.y, 1.25),
      ...trainScrews.map(([x, y]) => S.circle(x, y, 1.35)),
    ),
    S.circle(0, 0, R),
  );
  const tb = W.addPart('trainBridge', 'trainBridge', null, { group: 'frame', important: true });
  tb.add(mesh(S.sdfExtrude(trainSDF, [-R, -R, R, R], T, { res: 0.1, bevel: 0.14 }), [mats.get('bridge'), mats.get('bridgeEdge')]));
  tb.at(0, 0, zc);
  tb.labelAnchor.set(-6, -2.5, 0);
  tb.ex.set(0, 0, -20);

  // ---- barrel bridge (kept clear of the train bridge by a gap) ----
  const barrelScrews = [[-9.8, 9.6], [7.0, 12.2], [12.1, 3.9]];
  const barrelSDF = S.subtract(
    S.intersect(
      S.smoothUnion(2.2,
        S.circle(L.barrel.x, L.barrel.y, 6.1),
        S.circle(L.crownWheel.x, L.crownWheel.y, 2.4),
        ...barrelScrews.map(([x, y]) => S.circle(x, y, 1.4)),
      ),
      S.circle(0, 0, R),
    ),
    (x, y) => trainSDF(x, y) - 0.35,
  );
  const bb = W.addPart('barrelBridge', 'barrelBridge', null, { group: 'frame', important: true });
  bb.add(mesh(S.sdfExtrude(barrelSDF, [-R, -R, R, R], T, { res: 0.1, bevel: 0.14 }), [mats.get('bridge'), mats.get('bridgeEdge')]));
  bb.at(0, 0, zc);
  bb.labelAnchor.set(-5, 9, 0);
  bb.ex.set(0, 0, -20);

  // screws
  const addScrews = (parent, list, prefix) => list.forEach(([x, y], i) => {
    const s = W.addPart(`${prefix}${i}`, 'screw', parent, { group: 'frame', spin: 4 });
    s.add(screwMesh(mats, 0.62, -1));
    s.at(x, y, -T / 2 - 0.0); s.ex.set(0, 0, -4);
  });
  addScrews(tb, trainScrews, 'sc_train_');
  addScrews(bb, barrelScrews, 'sc_barrel_');

  // gold chatons + jewels on the train bridge
  [['c', 0, 0], ['3', third.x, third.y], ['t', cage.x, cage.y]].forEach(([k, x, y]) => {
    const ch = W.addPart('chaton_' + k, 'chaton', tb, { group: 'jewel' });
    ch.add(chatonMesh(mats, 0.9, 0.45)); ch.at(x, y, -T / 2 - 0.05);
    ch.motion.rotation.x = Math.PI; // facing back
    ch.ex.set(0, 0, -2.6);
    const j = W.addPart('jw_train_' + k, 'holeJewel', ch, { group: 'jewel' });
    j.add(jewelMesh(mats, 0.42)); j.at(0, 0, 0.02); j.ex.set(0, 0, 1.6);
  });
  // reverser pivots
  const jA = W.addPart('jw_revA', 'holeJewel', bb, { group: 'jewel' });
  jA.add(jewelMesh(mats, 0.36)); jA.at(L.revA.x, L.revA.y, -T / 2); jA.motion.rotation.x = Math.PI; jA.ex.set(0, 0, -2.2);
  const jB = W.addPart('jw_revB', 'holeJewel', tb, { group: 'jewel' });
  jB.add(jewelMesh(mats, 0.36)); jB.at(L.revB.x, L.revB.y, -T / 2); jB.motion.rotation.x = Math.PI; jB.ex.set(0, 0, -2.2);

  // rotor post (on the train bridge, carries the ball bearing)
  const post = cylinder(1.25, -T / 2 - 0.9, -T / 2, mats.get('steel'), 32);
  tb.add(post, { static: false });
  return { tb, bb };
}
