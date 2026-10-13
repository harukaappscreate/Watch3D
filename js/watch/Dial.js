// Dial: guilloché centre, azuré power-reserve sub-dial, tourbillon aperture, date window, applied indices
import * as THREE from 'three';
import { guillocheDial, dialPrint } from '../materials/ProceduralTextures.js';
import { PALETTE, BRAND } from '../config.js';
import { mesh } from './movement/helpers.js';

export function buildDial(W, L, jewelCount) {
  const mats = W.mats, z = L.z;
  const R = L.dialR;
  const dial = W.addPart('dial', 'dial', null, { group: 'display', important: true });
  const shape = new THREE.Shape(); shape.absarc(0, 0, R, 0, Math.PI * 2, false);
  const ap = new THREE.Path(); ap.absarc(L.aperture.x, L.aperture.y, L.aperture.r, 0, Math.PI * 2, true); shape.holes.push(ap);
  const c = new THREE.Path(); c.absarc(0, 0, 0.55, 0, Math.PI * 2, true); shape.holes.push(c);
  const pr = new THREE.Path(); pr.absarc(L.pr.x, L.pr.y, 0.28, 0, Math.PI * 2, true); shape.holes.push(pr);
  const dw = L.dateWin; const win = new THREE.Path();
  win.moveTo(dw.x - 0.72, dw.y - 0.62); win.lineTo(dw.x + 0.72, dw.y - 0.62); win.lineTo(dw.x + 0.72, dw.y + 0.62); win.lineTo(dw.x - 0.72, dw.y + 0.62); win.closePath();
  shape.holes.push(win);
  const t = z.dial1 - z.dial0;
  const g = new THREE.ExtrudeGeometry(shape, { depth: t - 0.08, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 2, curveSegments: 96 });
  g.translate(0, 0, -(t - 0.08) / 2);
  const dialMat = mats.get('dial');
  const dm = dial.add(mesh(g, [dialMat, mats.get('giltPolished')]));
  dial.at(0, 0, (z.dial0 + z.dial1) / 2);
  dial.labelAnchor.set(-9, -6, 0);
  dial.ex.set(0, 0, 28);

  // print overlay
  const pg = new THREE.ShapeGeometry(shape, 96);
  const printMat = mats.get('dialPrint');
  const pm = dial.add(mesh(pg, printMat), { cast: false });
  pm.position.z = t / 2 + 0.005;

  // polished frames: aperture ring, date window, sub-dial ring
  const ring = (r, w, h) => {
    const s = new THREE.Shape(); s.absarc(0, 0, r + w, 0, Math.PI * 2, false);
    const hh = new THREE.Path(); hh.absarc(0, 0, r, 0, Math.PI * 2, true); s.holes.push(hh);
    const gg = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 2, curveSegments: 64 });
    return gg;
  };
  const apr = dial.add(mesh(ring(L.aperture.r, 0.32, 0.12), mats.get('index')));
  apr.position.set(L.aperture.x, L.aperture.y, t / 2);
  const spr = dial.add(mesh(ring(L.pr.r, 0.12, 0.06), mats.get('index')));
  spr.position.set(L.pr.x, L.pr.y, t / 2);
  const frame = new THREE.Shape();
  frame.moveTo(-0.92, -0.82); frame.lineTo(0.92, -0.82); frame.lineTo(0.92, 0.82); frame.lineTo(-0.92, 0.82); frame.closePath();
  const fh = new THREE.Path(); fh.moveTo(-0.72, -0.62); fh.lineTo(-0.72, 0.62); fh.lineTo(0.72, 0.62); fh.lineTo(0.72, -0.62); fh.closePath(); frame.holes.push(fh);
  const fm = dial.add(mesh(new THREE.ExtrudeGeometry(frame, { depth: 0.12, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 2 }), mats.get('index')));
  fm.position.set(dw.x, dw.y, t / 2);

  // applied hour indices (faceted batons)
  const idxShape = new THREE.Shape();
  idxShape.moveTo(-0.32, 0); idxShape.lineTo(0.32, 0); idxShape.lineTo(0.26, 2.0); idxShape.lineTo(-0.26, 2.0); idxShape.closePath();
  const ig = new THREE.ExtrudeGeometry(idxShape, { depth: 0.12, bevelEnabled: true, bevelThickness: 0.13, bevelSize: 0.13, bevelSegments: 1 });
  for (let h = 1; h <= 12; h++) {
    if (h === 6 || h === 3) continue; // tourbillon / date
    const a = -(h / 12) * Math.PI * 2 + Math.PI / 2;
    const make = (off) => {
      const m = dial.add(mesh(ig, mats.get('index')));
      m.userData.index = true;
      const rr = h === 3 ? 13.0 : 11.8;
      if (h === 3) m.scale.y = 0.42;
      m.position.set(Math.cos(a) * rr + Math.cos(a - Math.PI / 2) * off, Math.sin(a) * rr + Math.sin(a - Math.PI / 2) * off, t / 2 + 0.05);
      m.rotation.z = a - Math.PI / 2;
    };
    if (h === 12) { make(-0.55); make(0.55); } else make(0);
  }

  const layout = { R, tb: { y: L.aperture.y, r: L.aperture.r }, pr: L.pr, prA0: L.prA0, prA1: L.prA1, brand: BRAND.name, brandY: L.brandY };
  const api = {
    part: dial,
    setColor(name) {
      const col = PALETTE.dial[name] || PALETTE.dial.blue;
      const size = mats.texSize;
      const gd = guillocheDial(size, col, layout);
      [gd.map, gd.normal].forEach((tx) => { tx.repeat.set(1 / (2 * R), 1 / (2 * R)); tx.offset.set(0.5, 0.5); });
      dialMat.map?.dispose(); dialMat.normalMap?.dispose();
      dialMat.map = gd.map; dialMat.normalMap = gd.normal; dialMat.normalScale = new THREE.Vector2(0.9, 0.9);
      dialMat.needsUpdate = true;
      const print = dialPrint(size * 2, col.print, layout, jewelCount);
      print.repeat.set(1 / (2 * R), 1 / (2 * R)); print.offset.set(0.5, 0.5);
      printMat.map?.dispose(); printMat.map = print; printMat.needsUpdate = true;
    },
  };
  return api;
}
