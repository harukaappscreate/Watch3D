// Keyless works: winding stem, winding pinion, sliding pinion, setting lever, yoke
import * as THREE from 'three';
import * as S from '../../geometry/SDF.js';
import { wheelGeometry } from '../../geometry/GearGeometry.js';
import { mesh } from './helpers.js';

export function buildKeyless(W, L, M) {
  const mats = W.mats, z = L.z;
  // stem along +X (axis of rotation = X)
  const stem = W.addPart('stem', 'stem', null, { group: 'keyless', important: true });
  const prof = [[0, 6.6], [0.32, 6.6], [0.32, 9.6], [0.45, 9.8], [0.45, 13.4], [0.3, 13.6], [0.3, 19.6], [0.36, 19.8], [0.36, 21.6], [0, 21.6]];
  const sg = new THREE.LatheGeometry(prof.map(([r, x]) => new THREE.Vector2(r, x)), 18);
  sg.rotateZ(-Math.PI / 2); // lathe axis Y -> +X
  stem.add(mesh(sg, mats.get('steel')));
  stem.at(0, 0, z.keyless);
  stem.labelAnchor.set(16, 0, 0);
  stem.ex.set(18, 0, 6);

  const pinion = (Z) => {
    const g = wheelGeometry({ Z, m: 0.12, t: 0.75, spokes: 0, boreR: 0.33, bevel: 0.03, tooth: { thick: 0.45 } });
    g.rotateY(Math.PI / 2); // axis -> X
    return g;
  };
  const wp = W.addPart('windingPinion', 'windingPinion', null, { group: 'keyless' });
  wp.add(mesh(pinion(14), mats.get('steel')));
  wp.at(11.0, 0, z.keyless); wp.ex.set(7, 0, 8);
  const sp = W.addPart('slidingPinion', 'slidingPinion', null, { group: 'keyless' });
  sp.add(mesh(pinion(12), mats.get('steel')));
  sp.at(12.5, 0, z.keyless); sp.ex.set(10, 0, 9);

  // setting lever (pull-out piece) & yoke (clutch lever) — flat steel parts on the dial side
  const lever = W.addPart('settingLever', 'settingLever', null, { group: 'keyless' });
  const lSDF = S.subtract(S.smoothUnion(0.6, S.circle(8.4, 3.2, 0.75), S.taper(8.4, 3.2, 11.9, 0.9, 0.5, 0.32), S.taper(8.4, 3.2, 6.2, 5.6, 0.45, 0.3)), S.circle(8.4, 3.2, 0.22));
  lever.add(mesh(S.sdfExtrude(lSDF, [5, 0, 13, 7], 0.3, { res: 0.04, bevel: 0.05 }), [mats.get('steel'), mats.get('blackPolish')]));
  lever.at(0, 0, z.setting); lever.ex.set(0, 0, 10);
  const yoke = W.addPart('yoke', 'yoke', null, { group: 'keyless' });
  const ySDF = S.subtract(S.smoothUnion(0.5, S.circle(9.0, -3.4, 0.7), S.taper(9.0, -3.4, 12.5, -0.85, 0.42, 0.28), S.taper(9.0, -3.4, 5.6, -5.4, 0.35, 0.22)), S.circle(9.0, -3.4, 0.2));
  yoke.add(mesh(S.sdfExtrude(ySDF, [4.5, -7, 13.5, 0.5], 0.3, { res: 0.04, bevel: 0.05 }), [mats.get('steel'), mats.get('blackPolish')]));
  yoke.at(0, 0, z.setting); yoke.ex.set(0, 0, 11.5);
  return { stem, wp, sp, lever, yoke };
}
