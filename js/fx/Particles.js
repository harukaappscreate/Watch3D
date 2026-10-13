// Floating dust motes, brighter inside the light beam
import * as THREE from 'three';
import { softSprite } from '../materials/ProceduralTextures.js';

export class Dust {
  constructor(count, beam) {
    this.beam = beam; // {top: Vector3, bottom: Vector3, radiusTop, radiusBottom}
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3), seed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const r = Math.sqrt(Math.random()) * 190, a = Math.random() * Math.PI * 2;
      pos[i * 3] = Math.cos(a) * r; pos[i * 3 + 1] = 40 + Math.random() * 380; pos[i * 3 + 2] = Math.sin(a) * r;
      seed[i] = Math.random();
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('seed', new THREE.BufferAttribute(seed, 1));
    this.mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 }, uMap: { value: softSprite() }, uPx: { value: 1 }, uFade: { value: 1 },
        uA: { value: beam.top }, uB: { value: beam.bottom }, uRA: { value: beam.radiusTop }, uRB: { value: beam.radiusBottom },
      },
      vertexShader: /* glsl */`
        attribute float seed; uniform float uTime; uniform float uPx; uniform vec3 uA; uniform vec3 uB; uniform float uRA; uniform float uRB;
        varying float vB; varying float vS;
        void main(){
          vec3 p = position;
          float t = uTime * (0.04 + seed * 0.05);
          p.x += sin(t * 3.0 + seed * 40.0) * 12.0;
          p.z += cos(t * 2.3 + seed * 17.0) * 12.0;
          p.y += mod(t * 9.0 + seed * 400.0, 380.0) - 190.0;
          p.y = 40.0 + mod(p.y - 40.0, 380.0);
          // distance to the beam axis
          vec3 ab = uB - uA; float h = clamp(dot(p - uA, ab) / dot(ab, ab), 0.0, 1.0);
          float d = length(p - (uA + ab * h));
          float rad = mix(uRA, uRB, h);
          vB = smoothstep(rad, rad * 0.25, d) * smoothstep(0.0, 0.15, h) + 0.05;
          vS = seed;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = (1.2 + seed * 2.6) * uPx * (320.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */`
        uniform sampler2D uMap; uniform float uTime; uniform float uFade; varying float vB; varying float vS;
        void main(){
          vec4 c = texture2D(uMap, gl_PointCoord);
          float tw = 0.6 + 0.4 * sin(uTime * (1.0 + vS * 3.0) + vS * 30.0);
          gl_FragColor = vec4(vec3(1.0, 0.93, 0.82) * c.a * vB * tw * 0.55 * uFade, 1.0);
        }`,
    });
    this.points = new THREE.Points(g, this.mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = 8;
  }
  update(t, px) { this.mat.uniforms.uTime.value = t; this.mat.uniforms.uPx.value = px; }
}
