// =============================================================
//  Explore — free observation tools: explode scrub, slow motion,
//  X-ray, section cut, loupe, crown winding / hand setting, picking.
// =============================================================
import * as THREE from 'three';
import { Timeline } from '../core/Timeline.js';
import { t } from '../core/i18n.js';

export class Explore {
  constructor(app) {
    this.app = app;
    this.flags = { xray: false, section: false, loupe: false, crown: false };
    this.active = false;
    this.slowValue = 1;
    this.winding = false;
    this.timeSpeed = 0;
    this.ray = new THREE.Raycaster();
    this.ndc = new THREE.Vector2();
    // section plane
    this.plane = new THREE.Plane(new THREE.Vector3(1, 0, 0), 0);
    // loupe: render target + overlay quad
    this.loupeRT = new THREE.WebGLRenderTarget(512, 512, { type: THREE.HalfFloatType, samples: 4 });
    this.loupeCam = new THREE.PerspectiveCamera(8, 1, 1, 6000);
    this.overlay = new THREE.Scene();
    this.ortho = new THREE.OrthographicCamera(0, 1, 1, 0, -1, 1);
    const lm = new THREE.ShaderMaterial({
      uniforms: { tMap: { value: this.loupeRT.texture } }, transparent: true, depthTest: false, depthWrite: false, toneMapped: true,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: `uniform sampler2D tMap; varying vec2 vUv;
        void main(){ vec2 d = vUv - 0.5; float r = length(d);
          if (r > 0.5) discard;
          vec4 c = texture2D(tMap, vUv);
          float ring = smoothstep(0.455, 0.47, r) * (1.0 - smoothstep(0.49, 0.5, r));
          float vig = smoothstep(0.5, 0.3, r);
          gl_FragColor = vec4(mix(c.rgb * (0.75 + 0.25 * vig), vec3(0.85, 0.72, 0.5), ring), 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    this.loupeQuad = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), lm);
    this.overlay.add(this.loupeQuad);
    this.loupePt = new THREE.Vector2(0.5, 0.45);
    this._bindPointer();
  }
  enter() { this.active = true; this.app.ui?.exploreSync(); this.app.ui?.toast(t('ui.explore.hint'), 4200); }
  exit() {
    if (!this.active) return;
    this.active = false;
    Object.keys(this.flags).forEach((k) => { if (this.flags[k]) this.toggle(k, false); });
    this.setSlow(1);
    this.windHold(false);
  }
  setExplode(f) { Timeline.kill('explode'); this.app.explode.setFactor(f); }
  setSlow(v) {
    this.slowValue = v;
    // map 0..1 → 1/40 .. 1 (log scale)
    const ts = v >= 0.999 ? 1 : Math.pow(10, -1.6 * (1 - v));
    const k = this.app.kin;
    const wasSlow = k.timeScale < 1;
    k.timeScale = ts;
    if (wasSlow && ts === 1) k.resync();
    this.app.audio.setTimeScale(ts);
  }
  windHold(on) { this.winding = on; if (on) this.app.audio.unlock(); }
  setTimeSpeed(v) { this.timeSpeed = v; }
  toggle(name, force) {
    const on = force ?? !this.flags[name];
    this.flags[name] = on;
    const a = this.app;
    if (name === 'xray') a.highlight.xray(on);
    if (name === 'section') this._section(on);
    if (name === 'crown') this._crown(on);
    if (name === 'back') this._flip();
    a.ui?.exploreSync();
  }
  _flip() {
    const head = this.app.watch.head;
    if (this.app.showcase.seated) return;
    const q0 = head.quaternion.clone();
    const q1 = q0.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI));
    Timeline.tween({ dur: 1.4, ease: 'inOutCubic', onUpdate: (e) => head.quaternion.slerpQuaternions(q0, q1, e) });
  }
  _section(on) {
    const r = this.app.stage.renderer;
    r.localClippingEnabled = on;
    const planes = on ? [this.plane] : [];
    const skip = new Set(['ghost', 'glass', 'velvet', 'leather', 'lacquer', 'brass']);
    Object.entries(this.app.mats.m).forEach(([k, m]) => { if (!skip.has(k)) { m.clippingPlanes = planes; m.clipShadows = on; m.needsUpdate = true; } });
    this.app.watch.list.forEach((p) => p.meshes.forEach((o) => o.traverse((n) => {
      if (n.isMesh) [].concat(n.material).forEach((m) => { if (m && m.clippingPlanes !== planes) { m.clippingPlanes = planes; m.needsUpdate = true; } });
    })));
  }
  _crown(pulled) {
    const k = this.app.kin;
    k.hack = pulled;
    const crown = this.app.watch.get('crown'), stem = this.app.watch.get('stem');
    const from = crown.motion.position.x, to = pulled ? 1.6 : 0;
    Timeline.tween({ dur: 0.35, ease: 'outCubic', onUpdate: (e) => { crown.motion.position.x = stem.motion.position.x = from + (to - from) * e; } });
    this.app.audio.click(0.9);
    this.app.ui?.toast(t(pulled ? 'ui.explore.crownPulled' : 'ui.explore.crownPushed'), 3600);
  }

  // ---------- pointer: picking, crown drag, loupe position ----------
  _bindPointer() {
    const el = this.app.stage.canvas;
    let down = null;
    el.addEventListener('pointerdown', (e) => {
      down = { x: e.clientX, y: e.clientY, t: performance.now() };
      if (this.flags.loupe) this._setLoupe(e);
      // crown drag
      const hit = this.active ? this.pick(e, true) : null;
      if (hit && hit.type === 'crown') {
        this.crownDrag = { x: e.clientX };
        this.app.stage.controls.enabled = false;
      }
    });
    el.addEventListener('pointermove', (e) => {
      if (this.flags.loupe && (e.pointerType === 'mouse' || down)) this._setLoupe(e);
      if (this.crownDrag) {
        const dx = e.clientX - this.crownDrag.x; this.crownDrag.x = e.clientX;
        if (this.flags.crown) this.app.kin.setHands(dx * 40);
        else if (dx > 0) this.app.kin.windCrown(dx * 0.05);
      }
    });
    const up = (e) => {
      if (this.crownDrag) { this.crownDrag = null; this.app.stage.controls.enabled = true; }
      if (!down) return;
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y) > 7 || performance.now() - down.t > 450;
      down = null;
      if (!moved && !this.flags.loupe) this.app.onTap?.(e);
    };
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', () => { down = null; this.crownDrag = null; this.app.stage.controls.enabled = true; });
  }
  _setLoupe(e) {
    const r = this.app.stage.canvas.getBoundingClientRect();
    this.loupePt.set((e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height);
  }
  /** raycast the watch → Part (skips glass and ghosted meshes) */
  pick(e, raw = false) {
    const r = this.app.stage.canvas.getBoundingClientRect();
    this.ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    this.ray.setFromCamera(this.ndc, this.app.stage.camera);
    const meshes = [];
    this.app.watch.list.forEach((p) => p.meshes.forEach((m) => m.traverse((n) => { if (n.isMesh && n.visible) meshes.push(n); })));
    const hits = this.ray.intersectObjects(meshes, false);
    for (const hit of hits) {
      const mat = [].concat(hit.object.material)[0];
      if (mat === this.app.mats.get('sapphire') || mat === this.app.mats.get('ghost')) continue;
      if (this.flags.section && this.plane.distanceToPoint(hit.point) < 0) continue;
      let o = hit.object; while (o && !o.userData.part) o = o.parent;
      if (o) return o.userData.part;
    }
    return null;
  }

  update(dt) {
    const a = this.app, k = a.kin;
    if (this.winding) { k.windCrown(dt * 7); }
    if (this.timeSpeed) k.setHands(Math.sign(this.timeSpeed) * Math.pow(Math.abs(this.timeSpeed), 2) * dt * 3600 * 3);
    if (this.flags.section) {
      const head = a.watch.head;
      head.updateMatrixWorld();
      const n = new THREE.Vector3(-1, 0, 0).transformDirection(head.matrixWorld);
      const p = new THREE.Vector3().setFromMatrixPosition(head.matrixWorld);
      this.plane.setFromNormalAndCoplanarPoint(n, p);
    }
  }
  /** loupe pass, drawn after the main frame */
  renderLoupe() {
    if (!this.flags.loupe) return;
    const st = this.app.stage, r = st.renderer, cam = st.camera;
    const { w, h } = st.size();
    // aim the loupe camera along the pointer ray
    this.ndc.set(this.loupePt.x * 2 - 1, this.loupePt.y * 2 - 1);
    this.ray.setFromCamera(this.ndc, cam);
    const lc = this.loupeCam;
    lc.position.copy(cam.position);
    lc.lookAt(this.ray.ray.origin.clone().add(this.ray.ray.direction));
    lc.fov = cam.fov / 5.5; lc.aspect = 1; lc.near = cam.near; lc.far = cam.far;
    lc.updateProjectionMatrix();
    const prevT = r.getRenderTarget();
    r.setRenderTarget(this.loupeRT);
    r.clear();
    r.render(st.scene, lc);
    r.setRenderTarget(prevT);
    // overlay circle (in pixels)
    const size = Math.min(w, h) * (w < 700 ? 0.42 : 0.3);
    this.ortho.left = 0; this.ortho.right = w; this.ortho.top = h; this.ortho.bottom = 0; this.ortho.updateProjectionMatrix();
    const px = this.loupePt.x * w, py = this.loupePt.y * h;
    const off = size * 0.62;
    this.loupeQuad.position.set(Math.min(w - size / 2, Math.max(size / 2, px + off)), Math.min(h - size / 2, Math.max(size / 2, py + off)), 0);
    this.loupeQuad.scale.set(size, size, 1);
    const ac = r.autoClear; r.autoClear = false;
    r.render(this.overlay, this.ortho);
    r.autoClear = ac;
  }
}
