// =============================================================
//  Showcase — boutique vitrine: pedestal, turntable, glass case,
//  spot lighting, light beam & dust, mount (cushion + strap).
// =============================================================
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { buildMount } from '../watch/Strap.js';
import { createLightCone } from '../fx/LightShafts.js';
import { Dust } from '../fx/Particles.js';
import { Timeline } from '../core/Timeline.js';
import { BRAND } from '../config.js';

export const SEAT = { y: 129, tilt: -0.27 };

export class Showcase {
  constructor(stage, mats, watch, tier) {
    this.stage = stage; this.mats = mats; this.watch = watch;
    const scene = stage.scene;
    this.group = new THREE.Group(); scene.add(this.group);
    const M = (n) => mats.get(n);

    // floor
    const floorMat = new THREE.MeshPhysicalMaterial({ color: 0x0d0d0f, roughness: 0.32, metalness: 0.1, clearcoat: 0.6, clearcoatRoughness: 0.25 });
    const floor = new THREE.Mesh(new THREE.CircleGeometry(1600, 64), floorMat);
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true;
    this.group.add(floor);
    // pedestal
    const ped = new THREE.Group();
    const col = new THREE.Mesh(new THREE.CylinderGeometry(66, 72, 86, 96), M('lacquer'));
    col.position.y = 43; col.castShadow = col.receiveShadow = true;
    const trim1 = new THREE.Mesh(new THREE.TorusGeometry(67, 1.0, 12, 128), M('brass'));
    trim1.rotation.x = Math.PI / 2; trim1.position.y = 86;
    const trim2 = trim1.clone(); trim2.position.y = 4; trim2.scale.setScalar(72 / 67);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(72, 70, 6, 96), M('lacquer'));
    top.position.y = 89; top.castShadow = top.receiveShadow = true;
    ped.add(col, trim1, trim2, top);
    // engraved brass plaque on the pedestal
    const pc = document.createElement('canvas'); pc.width = 1024; pc.height = 256;
    const px = pc.getContext('2d');
    const gr = px.createLinearGradient(0, 0, 1024, 256); gr.addColorStop(0, '#a8834c'); gr.addColorStop(0.5, '#e2c48a'); gr.addColorStop(1, '#9c7742');
    px.fillStyle = gr; px.fillRect(0, 0, 1024, 256);
    px.strokeStyle = 'rgba(60,40,15,.7)'; px.lineWidth = 4; px.strokeRect(14, 14, 996, 228);
    px.fillStyle = 'rgba(48,32,12,.92)'; px.textAlign = 'center'; px.textBaseline = 'middle';
    px.font = '600 86px "Hoefler Text","Didot","Times New Roman",serif'; px.fillText(BRAND.name, 512, 104);
    px.font = '500 34px "Avenir Next","Helvetica Neue",Arial,sans-serif'; px.fillText('CALIBRE HA-01  ·  FLYING TOURBILLON  ·  AUTOMATIC', 512, 186);
    const ptex = new THREE.CanvasTexture(pc); ptex.colorSpace = THREE.SRGBColorSpace; ptex.anisotropy = 8;
    const plaque = new THREE.Mesh(new RoundedBoxGeometry(64, 16, 1.6, 2, 0.6), [M('brass'), M('brass'), M('brass'), M('brass'), new THREE.MeshPhysicalMaterial({ map: ptex, metalness: 0.9, roughness: 0.32 }), M('brass')]);
    plaque.position.set(0, 46, 70.4);
    plaque.rotation.x = -0.04;
    plaque.castShadow = true;
    ped.add(plaque);
    this.group.add(ped);
    // turntable
    this.turntable = new THREE.Group();
    this.turntable.position.y = 92;
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(52, 53, 3, 96), M('velvet'));
    disc.position.y = 1.5; disc.receiveShadow = true;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(53, 0.7, 10, 128), M('brass'));
    ring.rotation.x = Math.PI / 2; ring.position.y = 3;
    this.turntable.add(disc, ring);
    this.group.add(this.turntable);
    // cradle under the cushion
    const cradle = new THREE.Mesh(new RoundedBoxGeometry(56, 6, 30, 3, 2), M('lacquer'));
    cradle.position.y = 6; cradle.castShadow = cradle.receiveShadow = true;
    this.turntable.add(cradle);

    // mount (cushion + strap) — seated frame of the watch
    this.mount = buildMount(mats);
    this.mountGroup = this.mount.group;
    this.mountGroup.position.set(0, SEAT.y - 92, 0);
    this.mountGroup.rotation.x = SEAT.tilt;
    this.turntable.add(this.mountGroup);
    this.seat = new THREE.Group(); // where the head sits
    this.mountGroup.add(this.seat);
    this.seat.add(watch.head);
    this.seated = true;

    // vitrine
    const vit = new THREE.Group();
    const W = 190, H = 170, D = 190, y0 = 92;
    const glassMat = M('glass');
    const pane = (w, h, pos, rotY = 0, rotX = 0) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), glassMat);
      m.position.copy(pos); m.rotation.set(rotX, rotY, 0); m.renderOrder = 6; vit.add(m);
    };
    pane(W, H, new THREE.Vector3(0, y0 + H / 2, D / 2));
    pane(W, H, new THREE.Vector3(0, y0 + H / 2, -D / 2), Math.PI);
    pane(D, H, new THREE.Vector3(W / 2, y0 + H / 2, 0), Math.PI / 2);
    pane(D, H, new THREE.Vector3(-W / 2, y0 + H / 2, 0), -Math.PI / 2);
    pane(W, D, new THREE.Vector3(0, y0 + H, 0), 0, -Math.PI / 2);
    const edgeMat = M('brass');
    const edge = (len, pos, axis) => {
      const g = new THREE.BoxGeometry(axis === 'x' ? len : 1.4, axis === 'y' ? len : 1.4, axis === 'z' ? len : 1.4);
      const m = new THREE.Mesh(g, edgeMat); m.position.copy(pos); vit.add(m);
    };
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) edge(H, new THREE.Vector3(sx * W / 2, y0 + H / 2, sz * D / 2), 'y');
    for (const sy of [y0 + 0.7, y0 + H]) {
      for (const sz of [-1, 1]) edge(W, new THREE.Vector3(0, sy, sz * D / 2), 'x');
      for (const sx of [-1, 1]) edge(D, new THREE.Vector3(sx * W / 2, sy, 0), 'z');
    }
    this.vitrine = vit;
    this.group.add(vit);

    // lights
    const key = new THREE.SpotLight(0xfff2e0, 1.05, 0, 0.2, 0.65, 0);
    key.position.set(70, 470, 150);
    key.target.position.set(0, SEAT.y, 0);
    key.castShadow = true;
    key.shadow.mapSize.set(tier.shadow, tier.shadow);
    key.shadow.camera.near = 250; key.shadow.camera.far = 700;
    key.shadow.bias = -0.00015; key.shadow.normalBias = 0.02;
    key.shadow.radius = 4;
    this.key = key;
    const rim = new THREE.SpotLight(0xcfe0ff, 1.0, 0, 0.3, 0.8, 0);
    rim.position.set(-260, 300, -240); rim.target.position.set(0, SEAT.y, 0);
    const kick = new THREE.SpotLight(0xffd2a0, 0.7, 0, 0.35, 0.9, 0);
    kick.position.set(240, 160, -60); kick.target.position.set(0, SEAT.y, 0);
    const hemi = new THREE.HemisphereLight(0x8090b0, 0x0a0806, 0.12);
    scene.add(key, key.target, rim, rim.target, kick, kick.target, hemi);
    this.lights = { key, rim, kick, hemi };
    this.baseIntensity = { key: 1.05, rim: 1.0, kick: 0.7, hemi: 0.12 };

    // beam + dust
    const top3 = key.position.clone(), bottom3 = new THREE.Vector3(0, 92, 0);
    this.cone = createLightCone(top3, bottom3, 8, 92);
    this._beamBottom = bottom3; this._ab = new THREE.Vector3(); this._ap = new THREE.Vector3(); this.lightK = 1;
    scene.add(this.cone);
    this.dust = new Dust(tier.particles, { top: top3, bottom: bottom3, radiusTop: 10, radiusBottom: 95 });
    scene.add(this.dust.points);

    this.spin = 0.12; // rad/s turntable
    this.spinTarget = 0.12;
    this._tmpQ = new THREE.Quaternion();
  }
  setParticles(n) { /* rebuilding dust on tier change is not required */ }
  setLightLevel(k) {
    const b = this.baseIntensity, L = this.lights;
    L.key.intensity = b.key * k; L.rim.intensity = b.rim * k; L.kick.intensity = b.kick * k; L.hemi.intensity = b.hemi * k;
    this.lightK = k;
    this.stage.scene.environmentIntensity = 0.05 + 0.8 * k;
    this.dust.mat.uniforms.uFade.value = k;
  }

  /** raise / lower the glass case (it opens whenever the head leaves the stand) */
  openCase(open, dur = 1.6) {
    const v = this.vitrine, y0 = v.position.y, y1 = open ? 260 : 0;
    if (Math.abs(y0 - y1) < 0.5) return;
    v.visible = true;
    Timeline.tween({ dur, ease: 'inOutCubic', group: 'vitrine', onUpdate: (e) => { v.position.y = y0 + (y1 - y0) * e; }, onComplete: () => { v.visible = !open; } });
  }
  /** take the head off the cushion and float it to a world pose */
  async liftHead(pos, quat, dur = 1.8) {
    const head = this.watch.head;
    this.openCase(true, Math.max(1, dur * 0.8));
    if (this.seated) { this.stage.scene.attach(head); this.seated = false; }
    const p0 = head.position.clone(), q0 = head.quaternion.clone();
    await Timeline.tween({ dur, ease: 'inOutCubic', group: 'head', onUpdate: (e) => {
      head.position.lerpVectors(p0, pos, e);
      head.quaternion.slerpQuaternions(q0, quat, e);
    } }).promise;
  }
  /** return to the cushion (target follows the rotating turntable) */
  async seatHead(dur = 2.0) {
    const head = this.watch.head;
    if (this.seated) return;
    const p0 = head.position.clone(), q0 = head.quaternion.clone();
    const tp = new THREE.Vector3(), tq = new THREE.Quaternion();
    await Timeline.tween({ dur, ease: 'inOutCubic', group: 'head', onUpdate: (e) => {
      this.seat.getWorldPosition(tp); this.seat.getWorldQuaternion(tq);
      head.position.lerpVectors(p0, tp, e);
      head.quaternion.slerpQuaternions(q0, tq, e);
    } }).promise;
    this.seat.attach(head);
    head.position.set(0, 0, 0); head.quaternion.identity();
    this.seated = true;
    this.openCase(false, 1.6);
  }
  update(dt, t, px) {
    this.spin += (this.spinTarget - this.spin) * Math.min(1, dt * 1.5);
    this.turntable.rotation.y += this.spin * dt;
    this.cone.material.uniforms.uTime.value = t;
    // fade the beam when the camera is inside / close to it
    const cam = this.stage.camera.position, a = this.cone.position, b = this._beamBottom;
    const ab = this._ab.subVectors(b, a); const h = Math.max(0, Math.min(1, this._ap.subVectors(cam, a).dot(ab) / ab.lengthSq()));
    const d = this._ap.copy(a).addScaledVector(ab, h).distanceTo(cam);
    const r = 8 + (92 - 8) * h;
    const k = Math.max(0, Math.min(1, (d - r * 0.9) / (r * 0.8)));
    this.cone.material.uniforms.uIntensity.value = 0.045 * k * this.lightK;
    this.dust.update(t, px);
  }
}
