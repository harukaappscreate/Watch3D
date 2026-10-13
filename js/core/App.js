// =============================================================
//  App — wires every subsystem together and runs the main loop.
// =============================================================
import * as THREE from 'three';
import { Stage } from './Stage.js';
import { Quality } from './Quality.js';
import { Timeline } from './Timeline.js';
import { Settings } from './Settings.js';
import { i18n } from './i18n.js';
import { MaterialLibrary } from '../materials/Materials.js';
import { Watch } from '../watch/Watch.js';
import { Kinematics } from '../watch/movement/kinematics.js';
import { Showcase } from '../demo/Showcase.js';
import { Explode } from '../demo/Explode.js';
import { CameraRig } from '../demo/CameraRig.js';
import { Labels } from '../demo/Labels.js';
import { Director } from '../demo/Director.js';
import { Explore } from '../demo/Explore.js';
import { Trails } from '../fx/Trails.js';
import { AudioEngine } from '../audio/AudioEngine.js';
import { Highlight } from '../learn/Highlight.js';
import { Tour } from '../learn/Tour.js';
import { Widgets } from '../learn/Widgets.js';
import { PowerFlow } from '../learn/PowerFlow.js';
import { Glossary } from '../learn/Glossary.js';
import { WhatIf } from '../learn/WhatIf.js';
import { Encyclopedia } from '../learn/Encyclopedia.js';
import { UI } from '../ui/UI.js';

export class App {
  constructor(canvas, uiRoot) { this.canvas = canvas; this.uiRoot = uiRoot; }

  async init() {
    const progress = (k) => { const b = document.querySelector('.loader-bar i'); if (b) b.style.width = `${Math.round(k * 100)}%`; };
    const frame = () => new Promise((r) => requestAnimationFrame(() => r()));
    progress(0.05);
    await i18n.load(i18n.detect());
    progress(0.15); await frame();
    this.stage = new Stage(this.canvas);
    this.mats = new MaterialLibrary(Quality.tier);
    progress(0.35); await frame();
    this.watch = new Watch(this.mats);
    this.watch.dial.setColor(Settings.get('dial'));
    this.mats.setCaseFinish(Settings.get('caseFinish'));
    progress(0.7); await frame();
    this.kin = new Kinematics(this.watch);
    this.showcase = new Showcase(this.stage, this.mats, this.watch, Quality.tier);
    this.showcase.mount.setType(Settings.get('strap'));
    this.explode = new Explode(this.watch);
    this.rig = new CameraRig(this.stage);
    this.labels = new Labels(this.uiRoot);
    this.trails = new Trails(this.stage.scene);
    this.audio = new AudioEngine();
    this.audio.setEnabled(!!Settings.get('sound'));
    this.highlight = new Highlight(this.watch, this.mats);
    this.flow = new PowerFlow(this.stage.scene, this.watch);
    this.director = new Director(this);
    this.explore = new Explore(this);
    this.widgets = new Widgets(this);
    this.glossary = new Glossary(this);
    this.tour = new Tour(this);
    this.whatif = new WhatIf(this);
    this.encyclopedia = new Encyclopedia(this);
    this.ui = new UI(this, this.uiRoot);
    progress(0.95);

    this.kin.on('beat', (b) => this.audio.tick(b));
    this.kin.on('click', () => this.audio.click(0.7));
    this.rig.onUser = () => this.director.poke();
    ['pointerdown', 'wheel', 'keydown'].forEach((ev) => window.addEventListener(ev, () => { this.director.poke(); this.audio.unlock(); }, { passive: true }));
    this._keys();

    this.timer = new THREE.Timer();
    this.timer.connect?.(document);
    this.t = 0;
    this._q = new THREE.Quaternion(); this._g = new THREE.Vector3();
    document.getElementById('loader')?.classList.add('done');
    const params = new URLSearchParams(location.search);
    const start = params.get('mode');
    if (start) this.director.setMode(start); else this.director.setMode('intro');
    requestAnimationFrame((ts) => this.loop(ts));
  }

  /** tap on the 3D view: select a part in explore / parts mode */
  onTap(e) {
    const m = this.director.mode;
    if (m === 'intro') { this.director.skipIntro(); return; }
    if (m !== 'explore' && m !== 'parts') return;
    const p = this.explore.pick(e);
    if (p) { this.audio.click(0.4); this.encyclopedia.show(p.type, p); }
  }

  _keys() {
    window.addEventListener('keydown', (e) => {
      if (e.target.closest('input, textarea')) return;
      const map = { '1': 'showcase', '2': 'loop', '3': 'explore', '4': 'learn', '5': 'artisan', '6': 'parts', '7': 'whatif', '8': 'glossary' };
      if (map[e.key]) this.ui.pick(map[e.key]);
      if (e.key === 'Escape') this.ui.panel.close(true);
      if (e.key === 'ArrowRight' && this.tour.cur) this.tour.go(this.tour.index + 1);
      if (e.key === 'ArrowLeft' && this.tour.cur) this.tour.go(this.tour.index - 1);
    });
  }

  loop(ts) {
    requestAnimationFrame((x) => this.loop(x));
    this.timer.update(ts);
    const dt = Math.min(0.1, this.timer.getDelta());
    if (document.hidden) return;
    this.t += dt;
    const px = this.stage.renderer.getPixelRatio();
    Timeline.update(dt);
    this.director.update(dt);
    this.rig.update(dt);
    this.showcase.update(dt, this.t, px);
    // gravity in the watch frame drives the rotor
    this.watch.head.getWorldQuaternion(this._q);
    this._g.set(0, -1, 0).applyQuaternion(this._q.invert());
    this.kin.update(dt, this._g);
    this.explore.update(dt);
    this.tour.update(dt, this.t);
    this.whatif.update(dt);
    this.flow.update(dt, px);
    this.trails.update();
    this.stage.controls.update();
    this.audio.setDistance(this.stage.camera.position.distanceTo(this.stage.controls.target));
    this.stage.render(dt, this.t);
    this.explore.renderLoupe();
    const { w, h } = this.stage.size();
    this.labels.update(this.stage.camera, w, h);
    this.ui.update(dt);
    Quality.sample(dt);
  }
}
