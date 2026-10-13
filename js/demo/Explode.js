// =============================================================
//  Explode — per-part offset animation (explode / assemble / scrub)
// =============================================================
import * as THREE from 'three';
import { Timeline, Ease } from '../core/Timeline.js';
import { TIMING } from '../config.js';
import { Layer } from './choreographies/index.js';

const lerpEuler = (o, a, b, t) => o.set(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, a.z + (b.z - a.z) * t);

export class Explode {
  constructor(watch) {
    this.w = watch;
    this.choreo = Layer;
    this.parts = watch.list.filter((p) => p.ex.lengthSq() > 0 || p.parentPart);
    this.state = new Map(); // part → {cur:Vector3, curR:Euler, f}
    watch.list.forEach((p) => this.state.set(p, { pos: new THREE.Vector3(), rot: new THREE.Euler(), f: 0, tPos: new THREE.Vector3(), tRot: new THREE.Euler() }));
    this.setChoreo(Layer);
    this.factor = 0;
  }
  setChoreo(c) {
    this.choreo = c;
    const n = this.w.list.length;
    this.w.list.forEach((p, i) => {
      const s = this.state.get(p);
      const o = c.offset(p, i, n);
      s.tPos.copy(o.pos); s.tRot.copy(o.rot);
    });
  }
  _apply(p, s) {
    p.explode.position.copy(s.pos);
    p.explode.rotation.copy(s.rot);
  }
  /** instant scrub of every part 0..1 (explore slider) */
  setFactor(f, only) {
    this.factor = f;
    const e = Ease.inOutSine(f);
    this.w.list.forEach((p) => {
      const s = this.state.get(p);
      const ff = only && !only.has(p) ? 0 : e;
      s.f = ff;
      s.pos.copy(s.tPos).multiplyScalar(ff);
      lerpEuler(s.rot, new THREE.Euler(), s.tRot, ff);
      this._apply(p, s);
    });
  }
  /** animate selected parts to factor f */
  async animateTo(f, { dur = 1.4, stagger = 0.01, only = null, ease = 'inOutCubic', group = 'explode' } = {}) {
    const list = this.w.list;
    const proms = [];
    list.forEach((p, i) => {
      if (only && !only.has(p)) return;
      const s = this.state.get(p);
      const p0 = s.pos.clone(), r0 = s.rot.clone(), f0 = s.f;
      const p1 = s.tPos.clone().multiplyScalar(f), r1 = new THREE.Euler(s.tRot.x * f, s.tRot.y * f, s.tRot.z * f);
      const delay = (f > f0 ? (list.length - i) : i) * stagger;
      proms.push(Timeline.tween({ dur, delay, ease, group, onUpdate: (e) => {
        s.pos.lerpVectors(p0, p1, e); lerpEuler(s.rot, r0, r1, e); s.f = f0 + (f - f0) * e; this._apply(p, s);
      } }).promise);
    });
    await Promise.all(proms);
    this.factor = f;
  }
  /** fast "burst" explode, reverse assembly order */
  async explodeAll(speed = 1, onPart) {
    const list = this.w.list, n = list.length;
    const proms = list.map((p, i) => {
      const s = this.state.get(p);
      const p0 = s.pos.clone(), r0 = s.rot.clone();
      const spin = p.spin * Math.PI * 2;
      const delay = ((n - i) * TIMING.explodeStagger) / speed;
      return Timeline.tween({ dur: TIMING.explodeDur / speed, delay, ease: 'outExpo', group: 'explode',
        onUpdate: (e) => {
          s.pos.lerpVectors(p0, s.tPos, e);
          lerpEuler(s.rot, r0, s.tRot, e);
          if (spin) s.rot.z += -spin * e;
          s.f = e; this._apply(p, s);
        },
        onComplete: () => onPart?.(p, i),
      }).promise;
    });
    await Promise.all(proms);
    this.factor = 1;
  }
  /** one-by-one assembly in registry order; onStep(part, index, total) */
  async assembleAll(speed = 1, onStep, token) {
    const list = this.w.list, n = list.length;
    const c = this.choreo;
    const proms = [];
    for (let i = 0; i < n; i++) {
      const p = list[i];
      const s = this.state.get(p);
      const p0 = s.pos.clone(), r0 = s.rot.clone();
      const spin = p.spin * Math.PI * 2;
      const isPress = p.type.includes('Jewel') || p.type === 'palletStone';
      const ease = spin ? 'outCubic' : isPress ? 'outBack' : 'inOutCubic';
      const delay = (i * TIMING.assembleStagger) / speed;
      let started = false;
      proms.push(Timeline.tween({ dur: (c.trails ? 1.15 : TIMING.assembleDur) / speed, delay, ease, group: 'explode',
        onUpdate: (e) => {
          if (token?.cancelled) return;
          if (!started) { started = true; onStep?.(p, i, n); }
          s.pos.lerpVectors(p0, new THREE.Vector3(), e);
          lerpEuler(s.rot, r0, new THREE.Euler(), e);
          if (spin) s.rot.z = spin * (1 - e);
          s.f = 1 - e; this._apply(p, s);
        },
      }).promise);
    }
    await Promise.all(proms);
    this.factor = 0;
  }
  /** quickly scatter every part to the choreography's "from" pose (meteor) */
  async scatter(speed = 1) {
    const c = this.choreo; if (!c.from) return;
    const proms = this.w.list.map((p, i) => {
      const from = c.from(p, i); if (!from) return Promise.resolve();
      const s = this.state.get(p); const p0 = s.pos.clone(), r0 = s.rot.clone();
      return Timeline.tween({ dur: 0.9 / speed, delay: (i % 12) * 0.015, ease: 'inCubic', group: 'explode', onUpdate: (e) => {
        s.pos.lerpVectors(p0, from.pos, e); lerpEuler(s.rot, r0, from.rot, e); this._apply(p, s);
      } }).promise;
    });
    await Promise.all(proms);
  }
  reset() { this.setFactor(0); }
}
