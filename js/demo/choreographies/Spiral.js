// Spiral: parts wind out along a helix around the watch axis
import * as THREE from 'three';
export const Spiral = {
  id: 'spiral',
  offset(part, i, n) {
    if (part.parentPart) {
      return { pos: part.ex.clone().multiplyScalar(1.35), rot: new THREE.Euler(0, 0, 0.6) };
    }
    const k = i / Math.max(1, n - 1);
    const a = k * Math.PI * 4.2;
    const r = 15 + Math.abs(part.ex.z) * 0.32;
    return {
      pos: new THREE.Vector3(Math.cos(a) * r - part.centre.x * 0.3, Math.sin(a) * r - part.centre.y * 0.3, part.ex.z * 0.75),
      rot: new THREE.Euler(0.25 * Math.sin(a), 0.25 * Math.cos(a), a * 0.25),
    };
  },
  spinOnTheWay: 1.0,
};
