import { STORAGE_KEY } from '../config.js';
import { Emitter } from './Emitter.js';

const DEFAULTS = {
  lang: null,          // auto
  quality: 'auto',
  sound: false,
  caseFinish: 'steel',
  dial: 'blue',
  strap: 'leather',
  labels: true,
  loopSpeed: 1,
  choreo: 'cycle',     // cycle | layer | radial | spiral | meteor
};

// Persisted user settings (localStorage wrapped in try/catch)
class SettingsStore extends Emitter {
  constructor() {
    super();
    this.data = { ...DEFAULTS };
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) Object.assign(this.data, JSON.parse(raw));
    } catch (_) { /* storage unavailable */ }
  }
  get(k) { return this.data[k]; }
  set(k, v) {
    if (this.data[k] === v) return;
    this.data[k] = v;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data)); } catch (_) {}
    this.emit('change', { key: k, value: v });
    this.emit('change:' + k, v);
  }
}
export const Settings = new SettingsStore();
