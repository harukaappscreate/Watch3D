// =============================================================
//  Director — mode state machine (intro / showcase / loop / explore
//  / learn / artisan / parts) and the loop-demo choreography.
// =============================================================
import * as THREE from 'three';
import { Timeline, Token } from '../core/Timeline.js';
import { Emitter } from '../core/Emitter.js';
import { Settings } from '../core/Settings.js';
import { t } from '../core/i18n.js';
import { TIMING } from '../config.js';
import { CHOREOS, choreoById } from './choreographies/index.js';
import { SEAT } from './Showcase.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const STUDY = { pos: V(0, 212, 0) };

export class Director extends Emitter {
  constructor(app) {
    super();
    this.app = app;
    this.mode = null;
    this.token = new Token();
    this.loopIndex = 0;
    this.idle = 0;
    this.headSpin = 0;
  }
  get narrow() { return this.app.stage.aspect < 0.85; }

  // ---------- camera presets ----------
  showcaseView() {
    const n = this.narrow;
    return { pos: n ? V(0, 175, 300) : V(34, 160, 196), target: V(0, n ? 134 : 130, 0) };
  }
  explodeView(choreo) {
    const map = {
      layer: V(200, 50, 250), radial: V(50, 38, 300), spiral: V(-190, 56, 250), meteor: V(190, 43, 270),
    };
    const dir = (map[choreo.id] || map.layer).clone().normalize();
    // fit the exploded bounding sphere into the view
    const r = this.fitRadius();
    const cam = this.app.stage.camera;
    const vh = THREE.MathUtils.degToRad(cam.fov / 2);
    const hh = Math.atan(Math.tan(vh) * cam.aspect);
    const half = Math.min(vh, hh) * 0.92;
    const dist = Math.max(120, r / Math.sin(half));
    return { pos: STUDY.pos.clone().addScaledVector(dir, dist), target: STUDY.pos.clone() };
  }
  fitRadius() {
    const ex = this.app.explode;
    let r = 0;
    const v = new THREE.Vector3();
    this.app.watch.list.forEach((p) => {
      if (p.parentPart) return;
      const s = ex.state.get(p);
      v.set(p.centre.x, p.centre.y, p.baseZ).add(s.tPos);
      r = Math.max(r, v.length() + 6);
    });
    return r;
  }
  headQuat(dir) {
    const o = new THREE.Object3D();
    o.lookAt(dir.clone().normalize());
    return o.quaternion.clone();
  }
  floatPose(choreoId) {
    const dirs = { layer: V(-0.42, 0.16, 0.9), radial: V(0.12, 0.22, 1), spiral: V(0.36, 0.2, 0.92), meteor: V(-0.32, 0.2, 0.93) };
    return { pos: STUDY.pos.clone(), quat: this.headQuat(dirs[choreoId] || dirs.layer) };
  }

  // ---------- mode switching ----------
  async setMode(mode, opts = {}) {
    if (this.mode === mode && !opts.force) return;
    const prev = this.mode;
    this.token.cancel();
    this.token = new Token();
    const token = this.token;
    this.mode = mode;
    this.emit('mode', { mode, prev });
    const a = this.app;
    a.labels.hide();
    a.trails.stop();
    a.ui?.caption(null);
    Timeline.kill('explode');
    Timeline.kill('loop');
    this.headSpin = 0;
    a.rig.orbitSpeed = 0;
    a.highlight?.clear();
    if (prev === 'learn' || prev === 'artisan') a.tour?.stop();
    if (mode !== 'explore') a.explore?.exit();
    const run = this['_' + mode];
    if (run) await run.call(this, token, opts);
  }
  /** bring every part home quickly */
  async reassemble(dur = 1.1) {
    if (this.app.explode.factor > 0 || this.app.explode.w.list.some((p) => p.explode.position.lengthSq() > 1e-6)) {
      await this.app.explode.animateTo(0, { dur, stagger: 0.004 });
    }
  }

  async _intro(token) {
    const a = this.app, s = a.showcase;
    s.setLightLevel(0);
    a.stage.backdrop.material.uniforms.uFade.value = 0;
    a.rig.jumpTo(V(-26, 140, 58), V(0, 129, 0));
    a.ui?.intro(true);
    // a sweeping light reveals the case silhouette
    const sweep = new THREE.SpotLight(0xffffff, 0, 0, 0.09, 0.8, 0);
    sweep.position.set(-220, 200, 120);
    sweep.target.position.set(0, 129, 0);
    a.stage.scene.add(sweep, sweep.target);
    await Timeline.tween({ dur: 3.4, ease: 'inOutSine', group: 'loop', onUpdate: (e) => {
      sweep.intensity = Math.sin(e * Math.PI) * 9;
      sweep.position.set(-220 + 440 * e, 200, 120);
      a.rig.cam.position.set(-26 + 40 * e, 140, 58 - 6 * e);
    } }).promise;
    a.stage.scene.remove(sweep, sweep.target);
    if (token.cancelled) return;
    a.ui?.intro(false);
    const v = this.showcaseView();
    Timeline.tween({ dur: 3.0, ease: 'inOutSine', group: 'loop', onUpdate: (e) => {
      s.setLightLevel(e);
      a.stage.backdrop.material.uniforms.uFade.value = e;
    } });
    await a.rig.flyTo(v.pos, v.target, 3.6);
    if (token.cancelled) return;
    this.setMode('loop');
  }
  skipIntro() {
    if (this.mode !== 'intro') return;
    Timeline.kill('loop');
    this.app.showcase.setLightLevel(1);
    this.app.stage.backdrop.material.uniforms.uFade.value = 1;
    this.app.ui?.intro(false);
    this.setMode('showcase');
  }

  async _showcase(token) {
    const a = this.app;
    await this.reassemble();
    if (!a.showcase.seated) await a.showcase.seatHead(1.8);
    if (token.cancelled) return;
    a.showcase.spinTarget = 0.12;
    const v = this.showcaseView();
    await a.rig.flyTo(v.pos, v.target, 2.2);
    a.rig.orbitSpeed = 0;
  }

  /** endless explode ⇄ assemble loop */
  async _loop(token) {
    const a = this.app;
    await this.reassemble();
    while (!token.cancelled) {
      const choice = Settings.get('choreo');
      const choreo = choice === 'cycle' ? CHOREOS[this.loopIndex++ % CHOREOS.length] : choreoById(choice);
      const speed = Settings.get('loopSpeed') || 1;
      a.explode.setChoreo(choreo);
      // 1. on the stand
      if (!a.showcase.seated) await a.showcase.seatHead(2.0);
      if (token.cancelled) return;
      a.showcase.spinTarget = 0.18;
      const sv = this.showcaseView();
      await a.rig.flyTo(sv.pos, sv.target, 2.4);
      a.ui?.caption({ title: t('loop.title'), text: t('loop.choreo.' + choreo.id) });
      await Timeline.wait(TIMING.showcaseHold / speed, 'loop');
      if (token.cancelled) return;
      // 2. lift off the cushion
      a.ui?.caption({ title: t('loop.lift'), text: '' });
      const pose = this.floatPose(choreo.id);
      const ev = this.explodeView(choreo);
      a.showcase.spinTarget = 0.05;
      await Promise.all([a.showcase.liftHead(pose.pos, pose.quat, 2.0 / speed), a.rig.flyTo(ev.pos, ev.target, 2.4 / speed)]);
      if (token.cancelled) return;
      // 3. burst apart
      a.audio?.whoosh();
      a.ui?.caption({ title: t('loop.explode'), text: t('loop.partsCount', { n: a.watch.list.length }) });
      await a.explode.explodeAll(speed);
      if (token.cancelled) return;
      // 4. a living exploded view — keep ticking while floating
      if (Settings.get('labels')) a.labels.show(this.labelEntries());
      this.headSpin = 0.16 * (choreo.id === 'spiral' ? -1 : 1);
      a.rig.orbitSpeed = -0.05;
      a.ui?.caption({ title: t('loop.hold'), text: t('loop.holdText') });
      await Timeline.wait(TIMING.holdExploded / speed, 'loop');
      if (token.cancelled) return;
      a.labels.hide();
      this.headSpin = 0;
      a.rig.orbitSpeed = 0;
      // 5. assemble, step by step
      if (choreo.trails) {
        await a.explode.scatter(speed);
        if (token.cancelled) return;
        a.trails.start(a.watch.list.filter((p) => !p.parentPart));
      }
      const pose2 = this.floatPose(choreo.id);
      Timeline.tween({ dur: 1.2, group: 'loop', onUpdate: (e) => a.watch.head.quaternion.slerp(pose2.quat, e * 0.2) });
      const av = this.explodeView(choreo);
      a.rig.flyTo(av.pos.clone().lerp(STUDY.pos, 0.28), av.target, 6 / speed);
      let lastType = '';
      await a.explode.assembleAll(speed, (p, i, n) => {
        a.audio?.clink(p);
        if (p.type !== lastType) {
          lastType = p.type;
          a.ui?.caption({ title: t('loop.step', { i: i + 1, n }) + ' · ' + t(`parts.${p.type}.name`), text: t(`parts.${p.type}.asm`) });
        }
      }, token);
      a.trails.stop();
      if (token.cancelled) return;
      a.ui?.caption({ title: t('loop.done'), text: t('loop.doneText') });
      a.audio?.chime();
      await Timeline.wait(1.6, 'loop');
      if (token.cancelled) return;
    }
  }
  labelEntries() {
    const ids = ['crystalFront', 'minuteHand', 'dial', 'dateRing', 'hourWheel', 'tourbillon', 'mainplate', 'centerWheel', 'barrel', 'trainBridge', 'ratchet', 'rotor', 'caseback', 'crown'];
    const list = this.narrow ? ids.filter((_, i) => i % 2 === 0) : ids;
    return list.map((id) => this.app.watch.get(id)).filter(Boolean).map((part) => ({
      part, title: t(`parts.${part.type}.name`), sub: t(`parts.${part.type}.en`),
    }));
  }

  /** free exploration: head floats in front of the camera */
  async _explore(token) {
    const a = this.app;
    await this.reassemble(0.8);
    a.explode.setChoreo(CHOREOS[0]);
    await this.toStudy(V(0, 0.12, 1));
    if (token.cancelled) return;
    a.explore?.enter();
  }
  async toStudy(dir = V(0, 0.12, 1), cam) {
    const a = this.app;
    const q = this.headQuat(dir);
    const view = cam || { pos: STUDY.pos.clone().add(dir.clone().normalize().multiplyScalar(this.narrow ? 150 : 105)).add(V(0, 6, 0)), target: STUDY.pos.clone() };
    a.showcase.spinTarget = 0.0;
    await Promise.all([a.showcase.liftHead(STUDY.pos, q, 1.6), a.rig.flyTo(view.pos, view.target, 1.9)]);
  }
  async _learn(token, opts) { await this.reassemble(0.8); if (token.cancelled) return; this.app.tour.start(opts.tour || 'basic', opts.scene || 0); }
  async _artisan(token, opts) { await this.reassemble(0.8); if (token.cancelled) return; this.app.tour.start(opts.tour || 'jewel', opts.scene || 0); }
  async _parts(token, opts) {
    const a = this.app;
    await this.reassemble(0.8);
    a.explode.setChoreo(CHOREOS[0]);
    await this.toStudy(V(0.5, 0.25, 0.85));
    if (token.cancelled) return;
    await a.explode.animateTo(0.55, { dur: 1.6 });
  }

  update(dt) {
    const a = this.app;
    if (this.headSpin && !a.showcase.seated) a.watch.head.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), this.headSpin * dt);
    // idle → loop demo (only from the passive showcase)
    this.idle += dt;
    if (this.mode === 'showcase' && this.idle > TIMING.idleToLoop) { this.idle = 0; this.setMode('loop'); }
  }
  poke() { this.idle = 0; }
}

export { SEAT };
