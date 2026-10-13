// =============================================================
//  AudioEngine — every sound is synthesised with Web Audio:
//  escapement tick-tock, ratchet clicks, burst, assembly clinks.
// =============================================================
export class AudioEngine {
  constructor() {
    this.enabled = false;
    this.ctx = null;
    this.ts = 1;
    this.camK = 1;
  }
  unlock() {
    if (!this.enabled) return;
    if (!this.ctx) this._init();
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }
  setEnabled(on) {
    this.enabled = on;
    if (on) this.unlock();
    if (this.master) this.master.gain.setTargetAtTime(on ? 0.9 : 0, this.ctx.currentTime, 0.05);
  }
  setTimeScale(ts) { this.ts = ts; }
  setDistance(d) { this.camK = Math.max(0.15, Math.min(1.4, 120 / Math.max(20, d))); }
  _init() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { this.enabled = false; return; }
    const c = new AC();
    this.ctx = c;
    this.master = c.createGain(); this.master.gain.value = 0.9;
    const comp = c.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3;
    this.master.connect(comp).connect(c.destination);
    // short room reverb
    this.verb = c.createConvolver();
    const len = c.sampleRate * 0.9, ir = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
    this.verb.buffer = ir;
    this.verbGain = c.createGain(); this.verbGain.gain.value = 0.22;
    this.verb.connect(this.verbGain).connect(this.master);
    // noise buffer
    const nb = c.createBuffer(1, c.sampleRate, c.sampleRate), nd = nb.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    this.noise = nb;
    // room tone
    const rt = c.createBufferSource(); rt.buffer = nb; rt.loop = true;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 220;
    const rg = c.createGain(); rg.gain.value = 0.012;
    rt.connect(lp).connect(rg).connect(this.master); rt.start();
  }
  get ok() { return this.enabled && this.ctx && this.ctx.state === 'running'; }
  _out(g, wet = 0.3) { g.connect(this.master); const s = this.ctx.createGain(); s.gain.value = wet; g.connect(s).connect(this.verb); }
  _burst(t, { f = 3000, q = 8, dur = 0.03, vol = 0.3, type = 'bandpass' } = {}) {
    const c = this.ctx;
    const src = c.createBufferSource(); src.buffer = this.noise;
    const bp = c.createBiquadFilter(); bp.type = type; bp.frequency.value = f; bp.Q.value = q;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.0015); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(bp).connect(g); this._out(g, 0.25);
    src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.02);
  }
  _ping(t, f, vol, dur) {
    const c = this.ctx;
    const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = f;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); this._out(g, 0.35); o.start(t); o.stop(t + dur + 0.02);
  }
  /** escapement beat: two transients (unlock + drop) */
  tick({ tock, amp }) {
    if (!this.ok || this.ts > 2.5) return;
    const c = this.ctx, t = c.currentTime + 0.005;
    const slow = Math.min(1, Math.pow(this.ts, 0.25));
    const v = 0.22 * this.camK * Math.min(1, amp / 200);
    const f = (tock ? 3400 : 4100) * (0.45 + 0.55 * slow);
    this._burst(t, { f, q: 9, dur: 0.018 + (1 - slow) * 0.05, vol: v });
    this._burst(t + 0.006 / Math.max(0.05, this.ts), { f: f * 1.35, q: 12, dur: 0.012 + (1 - slow) * 0.04, vol: v * 0.6 });
    this._ping(t, f * 1.62, v * 0.18, 0.04 + (1 - slow) * 0.15);
  }
  click(vol = 0.5) { if (!this.ok) return; const t = this.ctx.currentTime; this._burst(t, { f: 2400, q: 5, dur: 0.025, vol: 0.18 * vol }); this._ping(t, 5200, 0.03 * vol, 0.05); }
  whoosh() {
    if (!this.ok) return;
    const c = this.ctx, t = c.currentTime;
    const src = c.createBufferSource(); src.buffer = this.noise; src.loop = true;
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.2;
    bp.frequency.setValueAtTime(200, t); bp.frequency.exponentialRampToValueAtTime(3200, t + 0.5); bp.frequency.exponentialRampToValueAtTime(400, t + 1.6);
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.32, t + 0.25); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);
    src.connect(bp).connect(g); this._out(g, 0.6); src.start(t); src.stop(t + 1.9);
    // shimmer of many tiny metal parts
    for (let i = 0; i < 14; i++) this._ping(t + 0.05 + Math.random() * 0.6, 3000 + Math.random() * 5000, 0.025, 0.25);
  }
  clink(part) {
    if (!this.ok) return;
    const t = this.ctx.currentTime;
    const small = part && (part.type === 'screw' || part.type.includes('Jewel') || part.type === 'palletStone');
    const base = small ? 5200 : 2200 + Math.random() * 900;
    this._ping(t, base, 0.05, small ? 0.12 : 0.35);
    this._ping(t, base * 2.76, 0.022, 0.2);
    this._burst(t, { f: base * 1.2, q: 6, dur: 0.02, vol: 0.08 });
  }
  chime() {
    if (!this.ok) return;
    const t = this.ctx.currentTime;
    [880, 1318.5, 1760].forEach((f, i) => this._ping(t + i * 0.09, f, 0.05, 1.4));
  }
  whir(on) {
    if (!this.ok) return;
    const c = this.ctx;
    if (on && !this._whir) {
      const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 60;
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900;
      const g = c.createGain(); g.gain.value = 0.0001; g.gain.exponentialRampToValueAtTime(0.06, c.currentTime + 0.5);
      o.frequency.exponentialRampToValueAtTime(900, c.currentTime + 2.5);
      o.frequency.exponentialRampToValueAtTime(40, c.currentTime + 6.2);
      o.connect(lp).connect(g); this._out(g, 0.2); o.start();
      this._whir = { o, g };
    } else if (!on && this._whir) {
      this._whir.g.gain.setTargetAtTime(0.0001, c.currentTime, 0.1);
      this._whir.o.stop(c.currentTime + 0.5);
      this._whir = null;
    }
  }
}
