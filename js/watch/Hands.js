// Hands: leaf-shaped hour & minute hands (skeleton + lume), blued power-reserve hand
import * as THREE from 'three';
import { mesh } from './movement/helpers.js';

function leaf(len, w, tail, hole) {
  const s = new THREE.Shape();
  s.moveTo(0, -tail);
  s.quadraticCurveTo(w * 0.55, -tail * 0.4, w * 0.42, 0.0);
  s.bezierCurveTo(w * 1.0, len * 0.25, w * 0.75, len * 0.7, 0, len);
  s.bezierCurveTo(-w * 0.75, len * 0.7, -w * 1.0, len * 0.25, -w * 0.42, 0.0);
  s.quadraticCurveTo(-w * 0.55, -tail * 0.4, 0, -tail);
  const c = new THREE.Path(); c.absarc(0, 0, hole, 0, Math.PI * 2, true); s.holes.push(c);
  // skeleton window
  const k = new THREE.Path();
  k.moveTo(0, len * 0.22);
  k.bezierCurveTo(-w * 0.55, len * 0.35, -w * 0.38, len * 0.62, 0, len * 0.8);
  k.bezierCurveTo(w * 0.38, len * 0.62, w * 0.55, len * 0.35, 0, len * 0.22);
  s.holes.push(k);
  return s;
}
function lumeShape(len, w) {
  const k = new THREE.Shape();
  k.moveTo(0, len * 0.24);
  k.bezierCurveTo(-w * 0.5, len * 0.36, -w * 0.33, len * 0.61, 0, len * 0.78);
  k.bezierCurveTo(w * 0.33, len * 0.61, w * 0.5, len * 0.36, 0, len * 0.24);
  return k;
}

export function buildHands(W, L) {
  const mats = W.mats, z = L.z;
  const mk = (id, len, w, tail, hole, zz, ex) => {
    const p = W.addPart(id, id, null, { group: 'display', important: true });
    const g = new THREE.ExtrudeGeometry(leaf(len, w, tail, hole), { depth: 0.06, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 2, curveSegments: 24 });
    p.add(mesh(g, mats.get('hand')));
    const lg = new THREE.ShapeGeometry(lumeShape(len, w), 16);
    const lm = p.add(mesh(lg, mats.get('lume')), { cast: false });
    lm.position.z = 0.03;
    // hub cap
    const hub = p.add(mesh(new THREE.CylinderGeometry(hole + 0.35, hole + 0.35, 0.18, 24).rotateX(Math.PI / 2), mats.get('hand')));
    hub.position.z = 0.06;
    p.at(0, 0, zz);
    p.labelAnchor.set(0, len * 0.6, 0);
    p.ex.set(0, 0, ex);
    return p;
  };
  const hour = mk('hourHand', 8.4, 1.25, 1.6, 0.5, z.hourHand, 34);
  const minute = mk('minuteHand', 13.2, 1.0, 2.0, 0.34, z.minuteHand, 38);
  // power reserve hand
  const pr = W.addPart('prHand', 'prHand', null, { group: 'display' });
  const s = new THREE.Shape(); s.moveTo(-0.12, -0.5); s.lineTo(0.12, -0.5); s.lineTo(0.06, 2.3); s.lineTo(0, 2.6); s.lineTo(-0.06, 2.3); s.closePath();
  pr.add(mesh(new THREE.ExtrudeGeometry(s, { depth: 0.05, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 1 }), mats.get('blued')));
  pr.add(mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.14, 20).rotateX(Math.PI / 2), mats.get('blued')));
  pr.at(L.pr.x, L.pr.y, z.prHand);
  pr.ex.set(0, 0, 31);
  return { hour, minute, pr };
}
