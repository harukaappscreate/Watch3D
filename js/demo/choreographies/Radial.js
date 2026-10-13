// Radial bloom: parts open outward like petals, keeping a gentle depth order
import * as THREE from 'three';
const GOLD = Math.PI * (3 - Math.sqrt(5));
export const Radial = {
  id: 'radial',
  offset(part, i) {
    if (part.parentPart) {
      return { pos: part.ex.clone().multiplyScalar(1.5), rot: new THREE.Euler(0, 0, 0) };
    }
    const c = part.centre;
    let dir = c.length() > 2.5 ? c.clone().normalize() : new THREE.Vector2(Math.cos(i * GOLD), Math.sin(i * GOLD));
    const depth = Math.abs(part.ex.z) + Math.abs(part.ex.x);
    const r = 9 + depth * 0.62;
    const z = part.ex.z * 0.22;
    return {
      pos: new THREE.Vector3(dir.x * r, dir.y * r, z),
      rot: new THREE.Euler(dir.y * 0.5, -dir.x * 0.5, 0),
    };
  },
};
