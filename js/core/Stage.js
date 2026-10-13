// =============================================================
//  Stage — renderer, scene, camera, controls, env, post-fx, resize
// =============================================================
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Quality } from './Quality.js';
import { createEnvironment, createBackdrop } from '../fx/Environment.js';
import { PostFX } from '../fx/PostFX.js';

export class Stage {
  constructor(canvas) {
    this.canvas = canvas;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', alpha: false });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.setClearColor(0x050507, 1);
    this.renderer = renderer;

    this.scene = new THREE.Scene();
    this.scene.environment = createEnvironment(renderer);
    this.scene.environmentIntensity = 0.85;
    this.backdrop = createBackdrop();
    this.scene.add(this.backdrop);

    this.camera = new THREE.PerspectiveCamera(32, 1, 1, 6000);
    this.camera.position.set(0, 160, 330);

    const controls = new OrbitControls(this.camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 18;
    controls.maxDistance = 900;
    controls.rotateSpeed = 0.7;
    controls.zoomSpeed = 0.9;
    controls.panSpeed = 0.6;
    controls.target.set(0, 110, 0);
    controls.maxPolarAngle = Math.PI * 0.62;
    this.controls = controls;

    this.post = new PostFX(renderer, this.scene, this.camera);
    this.applyQuality();
    Quality.on('change', () => this.applyQuality());
    window.addEventListener('resize', () => this.resize());
    window.visualViewport?.addEventListener('resize', () => this.resize());
    this.resize();
  }
  applyQuality() {
    const tier = Quality.tier;
    this.tier = tier;
    const dpr = Math.min(window.devicePixelRatio || 1, tier.dpr);
    this.renderer.setPixelRatio(dpr);
    this.renderer.shadowMap.enabled = tier.shadow > 0;
    const { w, h } = this.size();
    this.renderer.setSize(w, h, false);
    this.post.build(tier, Math.floor(w * dpr), Math.floor(h * dpr));
    this.post.setSize(w, h);
    this.renderer.shadowMap.needsUpdate = true;
    this.scene.traverse((o) => {
      if (o.isLight && o.shadow && o.castShadow) {
        o.shadow.mapSize.set(tier.shadow, tier.shadow);
        o.shadow.map?.dispose(); o.shadow.map = null;
      }
    });
    this.onQuality?.(tier);
  }
  size() {
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    return { w, h };
  }
  resize() {
    const { w, h } = this.size();
    this.camera.aspect = w / h;
    // narrow portrait screens need a wider field of view
    this.camera.fov = this.camera.aspect < 0.8 ? 46 : this.camera.aspect < 1.2 ? 38 : 32;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
    this.post.setSize(w, h);
    this.onResize?.(w, h);
  }
  get aspect() { return this.camera.aspect; }
  /** shift the projection so the subject stays centred beside panels */
  setInset({ right = 0, bottom = 0 }) {
    this._insetTarget = { right, bottom };
    if (!this._inset) this._inset = { right: 0, bottom: 0 };
  }
  _updateInset(dt) {
    if (!this._insetTarget) return;
    const k = Math.min(1, dt * 6);
    const i = this._inset, tg = this._insetTarget;
    i.right += (tg.right - i.right) * k; i.bottom += (tg.bottom - i.bottom) * k;
    const { w, h } = this.size();
    if (i.right < 0.5 && i.bottom < 0.5 && tg.right === 0 && tg.bottom === 0) { if (this.camera.view?.enabled) this.camera.clearViewOffset(); return; }
    this.camera.setViewOffset(w, h, i.right / 2, i.bottom / 2, w, h);
  }
  render(dt, time) {
    this._updateInset(dt);
    this.backdrop.material.uniforms.uTime.value = time;
    this.post.render(dt, time);
  }
}
