// Layers: parts float apart along the watch axis, in stack order
import * as THREE from 'three';
export const Layer = {
  id: 'layer',
  offset(part) {
    return { pos: part.ex.clone().multiplyScalar(1.0), rot: new THREE.Euler(0, 0, 0) };
  },
};
