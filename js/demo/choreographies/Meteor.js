// Meteor: an exploded stack, but assembly streams in from far away with light trails
import * as THREE from 'three';
export const Meteor = {
  id: 'meteor',
  trails: true,
  offset(part) {
    return { pos: part.ex.clone().multiplyScalar(1.12), rot: new THREE.Euler(0, 0, 0) };
  },
  /** where each part starts when assembling (parent frame) */
  from(part, i) {
    if (part.parentPart) return null;
    const a = i * 2.39996 + 0.6;
    const e = Math.sin(i * 1.7) * 0.6;
    const R = 150 + (i % 5) * 18;
    return {
      pos: new THREE.Vector3(Math.cos(a) * Math.cos(e) * R, Math.sin(e) * R + 40, Math.sin(a) * Math.cos(e) * R * 0.6 + 60),
      rot: new THREE.Euler(a, e * 2, a * 0.5),
    };
  },
};
