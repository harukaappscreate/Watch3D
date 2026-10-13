// =============================================================
//  Timeline — tiny tween engine + cancellable async sequences.
//  All tweens advance with Timeline.update(dt) from the main loop.
// =============================================================
export const Ease = {
  linear: (t) => t,
  inQuad: (t) => t * t,
  outQuad: (t) => 1 - (1 - t) * (1 - t),
  inOutQuad: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  inCubic: (t) => t * t * t,
  outCubic: (t) => 1 - Math.pow(1 - t, 3),
  inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outQuart: (t) => 1 - Math.pow(1 - t, 4),
  inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  outExpo: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  inExpo: (t) => (t === 0 ? 0 : Math.pow(2, 10 * t - 10)),
  outBack: (t) => { const c1 = 1.4, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  outElastic: (t) => (t === 0 || t === 1 ? t : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI / 3)) + 1),
};

class Tween {
  constructor(o) {
    this.dur = Math.max(1e-4, o.dur ?? 1);
    this.delay = o.delay ?? 0;
    this.ease = typeof o.ease === 'function' ? o.ease : (Ease[o.ease] || Ease.inOutCubic);
    this.onUpdate = o.onUpdate;
    this.onComplete = o.onComplete;
    this.group = o.group || 'default';
    this.t = 0;
    this.done = false;
    this.promise = new Promise((res) => (this._resolve = res));
  }
  step(dt) {
    if (this.done) return;
    if (this.delay > 0) { this.delay -= dt; if (this.delay > 0) return; dt = -this.delay; this.delay = 0; }
    this.t = Math.min(1, this.t + dt / this.dur);
    this.onUpdate?.(this.ease(this.t), this.t);
    if (this.t >= 1) this.finish();
  }
  finish(silent) {
    if (this.done) return;
    this.done = true;
    if (!silent) this.onComplete?.();
    this._resolve(!silent);
  }
}

class TimelineEngine {
  constructor() { this.tweens = new Set(); this.speed = 1; }
  /** generic tween: onUpdate(easedT, rawT) */
  tween(o) { const tw = new Tween(o); this.tweens.add(tw); return tw; }
  /** wait seconds (cancellable by group) */
  wait(sec, group) { return this.tween({ dur: sec, group, ease: 'linear' }).promise; }
  /** tween numeric props of target */
  to(target, props, dur, ease = 'inOutCubic', group, delay = 0) {
    const from = {};
    for (const k in props) from[k] = target[k];
    return this.tween({
      dur, ease, group, delay,
      onUpdate: (e) => { for (const k in props) target[k] = from[k] + (props[k] - from[k]) * e; },
    }).promise;
  }
  kill(group) {
    for (const tw of this.tweens) if (tw.group === group) { tw.finish(true); this.tweens.delete(tw); }
  }
  update(dt) {
    const d = dt * this.speed;
    for (const tw of this.tweens) { tw.step(d); if (tw.done) this.tweens.delete(tw); }
  }
}
export const Timeline = new TimelineEngine();

/** Cancellation token for async choreography sequences */
export class Token {
  constructor() { this.cancelled = false; }
  cancel() { this.cancelled = true; }
}
