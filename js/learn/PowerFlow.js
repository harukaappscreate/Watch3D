// =============================================================
//  PowerFlow — glowing particles travelling along the path of
//  energy: crown → … → balance. Path follows live part positions.
// =============================================================
import * as THREE from 'three';
import { softSprite } from '../materials/ProceduralTextures.js';

export const FLOW_PATH = ['crown', 'stem', 'windingPinion', 'crownWheel', 'ratchet', 'barrel', 'centerWheel', 'thirdWheel', 'cagePinion', 'escapeWheel', 'pallet', 'balance'];

export class PowerFlow {
  constructor(scene, watch) {
    this.w = watch;
    this.count = 140;
    const g = new THREE.BufferGeometry();
    this.pos = new Float32Array(this.count * 3);
    this.phase = new Float32Array(this.count);
    for (let i = 0; i < this.count; i++) this.phase[i] = i / this.count;
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    g.setAttribute('aPhase', new THREE.BufferAttribute(this.phase, 1));
    this.mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
      uniforms: { uMap: { value: softSprite() }, uPx: { value: 1 }, uFade: { value: 0 } },
      vertexShader: `attribute float aPhase; uniform float uPx; varying float vP;
        void main(){ vP = aPhase; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_PointSize = uPx * 900.0 / -mv.z; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `uniform sampler2D uMap; uniform float uFade; varying float vP;
        void main(){ vec4 c = texture2D(uMap, gl_PointCoord); vec3 col = mix(vec3(1.0,0.75,0.35), vec3(1.0,0.35,0.45), vP);
          gl_FragColor = vec4(col * c.a * uFade * 0.9, 1.0); }`,
    });
    this.points = new THREE.Points(g, this.mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = 20;
    scene.add(this.points);
    this.on = false; this.t = 0;
    this.path = FLOW_PATH;
    this.v = new THREE.Vector3();
  }
  show(path = FLOW_PATH) { this.path = path; this.on = true; }
  hide() { this.on = false; }
  update(dt, px) {
    const u = this.mat.uniforms;
    u.uFade.value += ((this.on ? 1 : 0) - u.uFade.value) * Math.min(1, dt * 3);
    u.uPx.value = px;
    if (u.uFade.value < 0.01) { this.points.visible = false; return; }
    this.points.visible = true;
    const pts = this.path.map((id) => this.w.get(id)).filter(Boolean).map((p) => p.worldCentre(new THREE.Vector3()));
    if (pts.length < 2) return;
    const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal', 0.4);
    this.t += dt * 0.07;
    for (let i = 0; i < this.count; i++) {
      const f = (this.phase[i] + this.t) % 1;
      curve.getPointAt(f, this.v);
      // slight jitter so it looks like a stream
      const j = Math.sin(i * 12.9898) * 0.25;
      this.pos[i * 3] = this.v.x + j; this.pos[i * 3 + 1] = this.v.y + Math.cos(i * 4.1) * 0.25; this.pos[i * 3 + 2] = this.v.z;
    }
    this.points.geometry.attributes.position.needsUpdate = true;
  }
}
