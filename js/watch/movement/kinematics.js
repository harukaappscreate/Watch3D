// =============================================================
//  Kinematics — derives every wheel angle from the escapement.
//  The escape wheel advances half a tooth per beat (8 beats/s);
//  everything else follows from tooth ratios.
// =============================================================
import { MOVEMENT as M } from '../../config.js';
import { Emitter } from '../../core/Emitter.js';

const TAU = Math.PI * 2;
const DEG = Math.PI / 180;
const easeImpulse = (t) => t * t * (3 - 2 * t);
const localNowSec = () => Date.now() / 1000 - new Date().getTimezoneOffset() * 60;

export class Kinematics extends Emitter {
  constructor(watch) {
    super();
    this.w = watch;
    this.P = (id) => watch.get(id);
    this.timeScale = 1;
    this.power = M.reserveHours * 0.78;      // hours in the mainspring
    this.amp = M.amplitudeDeg;               // current balance amplitude (deg)
    this.freqScale = 1;                      // hairspring "what if"
    this.metal = false;                      // metal bearings "what if"
    this.freeRun = false;                    // escapement removed "what if"
    this.cageFrozen = false;                 // tourbillon stopped "what if"
    this.hack = false;                       // crown pulled: balance stopped
    this.setOffset = 0;                      // hand-setting offset (s)
    this.freeSpeed = 1;
    this.ratchet = 0; this.crownAngle = 0;
    this.rotor = 0; this.rotorVel = 0;
    this.dateAngle = null;
    this.paused = false;
    this.resync();
    // live rates for the ratio view (rev per hour)
    this.rates = {};
  }
  get maxPower() { return this.metal ? M.reserveHoursMetal : M.reserveHours; }
  resync() {
    this.base = localNowSec();
    this.s = 0; this.p = 0; this.lastBeat = 0;
    this.setOffset = 0;
  }
  get watchSeconds() { return this.base + this.p / M.beatsPerSec; }
  /** crown winding: dCrown radians of crown rotation */
  windCrown(d) {
    if (d <= 0) return;
    this.crownAngle += d;
    this.addRatchet(d * (14 / 54));
  }
  addRatchet(d) {
    const before = this.ratchet;
    if (this.power >= this.maxPower) { this.power = this.maxPower; this.emit('full'); return; }
    this.ratchet += d;
    this.power = Math.min(this.maxPower, this.power + (d / TAU) * 8);
    const tooth = TAU / M.ratchet.Z;
    if (Math.floor(this.ratchet / tooth) !== Math.floor(before / tooth)) this.emit('click');
  }
  /** set hands while crown is pulled */
  setHands(dSec) { this.setOffset += dSec; }

  update(dtReal, gravityLocal) {
    if (this.paused) return;
    const dt = Math.min(0.05, dtReal) * this.timeScale;
    const ampTarget = (() => {
      if (this.hack || this.freeRun || this.power <= 0) return 0;
      const k = 0.7 + 0.3 * Math.min(1, this.power / 24);
      return M.amplitudeDeg * k * (this.metal ? 0.62 : 1);
    })();
    const rate = this.hack ? 30 : 1.2;
    this.amp += (ampTarget - this.amp) * Math.min(1, dt * rate);

    // ---- escapement & beats ----
    if (this.freeRun) {
      if (this.power > 0) {
        this.freeSpeed = Math.min(4000, this.freeSpeed * (1 + dt * 4.5) + dt * 40);
        this.power = Math.max(0, this.power - dt * 14);
      } else {
        this.freeSpeed *= Math.max(0, 1 - dt * 2.2);
      }
      this.p += dt * M.beatsPerSec * this.freeSpeed;
    } else if (this.amp > 25 && !this.hack) {
      const f = M.freqHz * this.freqScale;
      this.s += dt * 2 * f;
      const w = Math.min(0.22, (2 * 26) / (Math.PI * this.amp)); // lift ±26°
      const u = this.s + w / 2;
      const n = Math.floor(u);
      const fr = u - n;
      this.p = n + easeImpulse(Math.min(1, fr / w));
      this.fork = this._forkAt(n, fr, w);
      // escapement phase for teaching: unlock → impulse → drop → lock
      this.escPhase = fr < w * 0.18 ? 'unlock' : fr < w ? 'impulse' : fr < w + 0.035 ? 'drop' : 'lock';
      if (n !== this.lastBeat) { this.lastBeat = n; this.emit('beat', { n, tock: n % 2 === 0, amp: this.amp, ts: this.timeScale }); }
      this.power = Math.max(0, this.power - dt / 3600);
    }
    const bal = this.amp > 1 && !this.freeRun ? this.amp * DEG * Math.sin(Math.PI * this.s) : (this.balAngle || 0) * 0.9;
    this.balAngle = bal;

    // ---- rotor (gravity pendulum) ----
    if (gravityLocal) {
      const a = this.rotor - Math.PI / 2; // weight centre direction
      const dx = Math.cos(a), dy = Math.sin(a);
      const torque = dx * gravityLocal.y - dy * gravityLocal.x;
      this.rotorVel += torque * 38 * dt - this.rotorVel * 1.6 * dt;
      const d = this.rotorVel * dt;
      this.rotor += d;
      this.addRatchet(Math.abs(d) * (M.rotorPinion.Z / M.reverser.Z) * (M.reverserPinion.Z / M.ratchet.Z));
    }
    this.apply(dt);
  }
  _forkAt(n, fr, w) {
    const side = (k) => (k % 2 === 0 ? 1 : -1) * 9 * DEG;
    if (fr >= w) return side(n);
    return side(n - 1) + (side(n) - side(n - 1)) * easeImpulse(fr / w);
  }

  apply(dt) {
    const P = this.P;
    const sec = this.watchSeconds;
    const escLocal = -this.p * (Math.PI / M.escape.Z);
    let cage = -TAU * ((sec % 60) / 60);
    if (this.cageFrozen) { this.frozenCage ??= cage; cage = this.frozenCage; } else this.frozenCage = null;
    const third = -cage * (M.cagePinion.Z / M.third.Z);
    const centre = -third * (M.thirdPinion.Z / M.center.Z);
    const barrel = -centre * (M.centerPinion.Z / M.barrel.Z);
    const hs = sec + this.setOffset;
    const minute = -TAU * ((hs / 3600) % 1);
    const hour = -TAU * ((hs / 43200) % 1);

    P('tourbillon').motion.rotation.z = cage;
    P('escapeWheel').motion.rotation.z = escLocal;
    P('pallet').motion.rotation.z = this.fork || 0;
    P('balance').motion.rotation.z = this.balAngle;
    P('hairspring').userData.material.userData.uTheta.value = this.balAngle;
    P('thirdWheel').motion.rotation.z = third;
    P('centerWheel').motion.rotation.z = centre;
    P('barrel').motion.rotation.z = barrel;
    P('barrelArbor').motion.rotation.z = this.ratchet - barrel;
    P('ratchet').motion.rotation.z = this.ratchet;
    P('crownWheel').motion.rotation.z = -this.ratchet * (M.ratchet.Z / M.crownWheel.Z);
    const tooth = TAU / M.ratchet.Z;
    const f = (((this.ratchet % tooth) + tooth) % tooth) / tooth;
    P('click').motion.rotation.z = 0.1 * (1 - f) - 0.05;
    P('revA').motion.rotation.z = -this.rotor * (M.rotorPinion.Z / M.reverser.Z);
    P('revB').motion.rotation.z = -this.rotor * (M.rotorPinion.Z / M.reverser.Z);
    P('rotor').motion.rotation.z = this.rotor;
    P('stem').motion.rotation.x = this.crownAngle;
    P('crown').motion.rotation.x = this.crownAngle;
    P('windingPinion').motion.rotation.x = this.crownAngle;
    P('slidingPinion').motion.rotation.x = this.crownAngle;
    P('minuteHand').motion.rotation.z = minute;
    P('hourHand').motion.rotation.z = hour;
    P('cannon').motion.rotation.z = minute;
    P('minuteWheel').motion.rotation.z = -minute * (M.cannon.Z / M.minuteWheel.Z);
    P('hourWheel').motion.rotation.z = hour;
    P('dateDriver').motion.rotation.z = -hour * (M.hourWheel.Z / M.dateDriver.Z);
    // date ring (jumps at midnight)
    const day = new Date(hs * 1000).getUTCDate();
    const target = -((day - 1) / 31) * TAU;
    if (this.dateAngle === null) this.dateAngle = target;
    let dd = target - this.dateAngle;
    if (dd > Math.PI) dd -= TAU; if (dd < -Math.PI) dd += TAU;
    this.dateAngle += dd * Math.min(1, dt * 8 + 0.02);
    P('dateRing').motion.rotation.z = this.dateAngle;
    // power reserve hand
    const L = this.w.L;
    const k = Math.max(0, Math.min(1, this.power / M.reserveHours));
    P('prHand').motion.rotation.z = -(L.prA0 + (L.prA1 - L.prA0) * k);
    this.w.updateMainspring(this.power / M.reserveHours);
    this.cageAngle = cage;
  }

  /** nominal revolution periods (s) for the ratio view */
  periods() {
    const f = M.freqHz * this.freqScale;
    const cageP = 60 / this.freqScale;
    return {
      balance: 1 / f,
      escapeWheel: cageP / 12,
      tourbillon: cageP,
      thirdWheel: cageP * (M.third.Z / M.cagePinion.Z),
      centerWheel: cageP * (M.third.Z / M.cagePinion.Z) * (M.center.Z / M.thirdPinion.Z),
      barrel: cageP * (M.third.Z / M.cagePinion.Z) * (M.center.Z / M.thirdPinion.Z) * (M.barrel.Z / M.centerPinion.Z),
      hourWheel: 43200 / this.freqScale,
      dateDriver: 86400 / this.freqScale,
    };
  }
}
