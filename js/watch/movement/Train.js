// Going train: barrel (with mainspring), centre wheel, third wheel
import * as THREE from 'three';
import { wheelGeometry, pinionGeometry } from '../../geometry/GearGeometry.js';
import { mainspringGeometry } from '../../geometry/Spring.js';
import { mesh, cylinder, latheZ } from './helpers.js';

export function buildTrain(W, L, M) {
  const mats = W.mats, z = L.z;
  // ---- barrel ----
  const barrel = W.addPart('barrel', 'barrel', null, { group: 'energy', important: true });
  barrel.at(L.barrel.x, L.barrel.y, 0);
  const teeth = wheelGeometry({ ...M.barrel, t: 0.42, spokes: 0, boreR: 5.75, bevel: 0.03 });
  const tm = barrel.add(mesh(teeth, mats.get('gilt'))); tm.position.z = z.barrelTeeth;
  const drum = latheZ([[5.75, z.barrelTeeth + 0.2], [6.05, z.barrelTeeth + 0.2], [6.05, z.barrelBot], [5.9, z.barrelBot + 0.0], [0.95, z.barrelBot], [0.95, z.barrelBot - 0.2], [5.75, z.barrelBot - 0.2], [5.75, z.barrelTeeth + 0.2]], 72);
  barrel.add(mesh(drum, mats.get('gilt')));
  barrel.labelAnchor.set(0, 0, -2);
  barrel.ex.set(0, 0, -15);
  // mainspring (inside)
  const ms = W.addPart('mainspring', 'mainspring', barrel, { group: 'energy', important: true });
  ms.at(0, 0, (z.barrelBot + z.barrelTop) / 2 - 0.1);
  const msMesh = ms.add(mesh(mainspringGeometry({ wind: 0.7, h: 1.7 }), mats.get('mainspring')));
  ms.userData = { mesh: msMesh, wind: 0.7 };
  ms.ex.set(0, 0, -5.5);
  // barrel cover
  const cover = W.addPart('barrelCover', 'barrelCover', barrel, { group: 'energy' });
  cover.add(mesh(latheZ([[0.95, 0.09], [5.9, 0.09], [5.98, 0.0], [5.9, -0.09], [0.95, -0.09]], 72), mats.get('giltPolished')));
  cover.at(0, 0, z.barrelTop);
  cover.ex.set(0, 0, -9);
  // barrel arbor
  const arbor = W.addPart('barrelArbor', 'barrelArbor', barrel, { group: 'energy' });
  arbor.add(cylinder(0.92, -2.8, -0.6, mats.get('steel'), 28));
  arbor.add(cylinder(0.55, -4.4, -2.8, mats.get('steel'), 4)); // square for the ratchet
  arbor.add(cylinder(0.5, -0.6, 0.15, mats.get('steel')));
  arbor.ex.set(0, 0, -12);

  // ---- centre wheel ----
  const cw = W.addPart('centerWheel', 'centerWheel', null, { group: 'energy', important: true });
  cw.at(0, 0, 0);
  const cwm = cw.add(mesh(wheelGeometry({ ...M.center, t: 0.24, spokes: 5 }), mats.get('gilt'))); cwm.position.z = z.centreWheel;
  const cp = cw.add(mesh(pinionGeometry({ ...M.centerPinion, L: 0.5 }), mats.get('steel'))); cp.position.z = z.centrePinion;
  cw.add(cylinder(0.2, -3.6, M.plateT + 0.1, mats.get('steel')));
  cw.labelAnchor.set(3.4, -1.2, z.centreWheel);
  cw.ex.set(0, 0, -10);

  // ---- third wheel ----
  const tw = W.addPart('thirdWheel', 'thirdWheel', null, { group: 'energy', important: true });
  tw.at(L.third.x, L.third.y, 0);
  const tp = tw.add(mesh(pinionGeometry({ ...M.thirdPinion, L: 0.4 }), mats.get('steel'))); tp.position.z = z.thirdPinion;
  const twm = tw.add(mesh(wheelGeometry({ ...M.third, t: 0.22, spokes: 4 }), mats.get('gilt'))); twm.position.z = z.thirdWheel;
  tw.add(cylinder(0.16, -3.6, M.plateT + 0.05, mats.get('steel')));
  tw.labelAnchor.set(2.0, -1.0, z.thirdWheel);
  tw.ex.set(0, 0, -6.5);
  return { barrel, cw, tw, ms };
}

export function updateMainspring(part, wind) {
  const d = part.userData;
  if (Math.abs(d.wind - wind) < 0.04) return;
  d.wind = wind;
  d.mesh.geometry.dispose();
  d.mesh.geometry = mainspringGeometry({ wind: 0.12 + wind * 0.85, h: 1.7 });
}
