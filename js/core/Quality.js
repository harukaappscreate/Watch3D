// =============================================================
//  Quality — picks a rendering tier and auto-adjusts by FPS.
// =============================================================
import { QUALITY_TIERS } from '../config.js';
import { Settings } from './Settings.js';
import { Emitter } from './Emitter.js';

const ORDER = ['low', 'medium', 'high'];

class QualityManager extends Emitter {
  constructor() {
    super();
    this.isMobile = matchMedia('(pointer: coarse)').matches || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    this.tierName = this.initialTier();
    this._frames = 0; this._acc = 0; this._cool = 3; this._lowStreak = 0;
  }
  initialTier() {
    const q = new URLSearchParams(location.search).get('q');
    if (q && QUALITY_TIERS[q]) return q;
    const s = Settings.get('quality');
    if (s && s !== 'auto' && QUALITY_TIERS[s]) return s;
    const cores = navigator.hardwareConcurrency || 4;
    if (this.isMobile) return cores >= 8 ? 'medium' : 'low';
    return 'high';
  }
  get tier() { return QUALITY_TIERS[this.tierName]; }
  get auto() { return !new URLSearchParams(location.search).get('q') && (Settings.get('quality') || 'auto') === 'auto'; }
  set(name) {
    if (!QUALITY_TIERS[name] || name === this.tierName) return;
    this.tierName = name;
    this._cool = 4;
    this.emit('change', name);
  }
  /** call every frame with real dt (s) */
  sample(dt) {
    if (!this.auto || document.hidden) return;
    this._acc += dt; this._frames++;
    if (this._acc < 1.5) return;
    const fps = this._frames / this._acc;
    this._acc = 0; this._frames = 0;
    if (this._cool > 0) { this._cool -= 1.5; return; }
    const i = ORDER.indexOf(this.tierName);
    if (fps < 38 && i > 0) {
      this._lowStreak++;
      if (this._lowStreak >= 2) { this._lowStreak = 0; this.set(ORDER[i - 1]); }
    } else this._lowStreak = 0;
  }
}
export const Quality = new QualityManager();
