// =============================================================
//  i18n — loads locales/<lang>.json, resolves dotted keys,
//  updates [data-i18n] / [data-i18n-attr] elements on change.
// =============================================================
import { Emitter } from './Emitter.js';
import { Settings } from './Settings.js';

export const LANGS = ['ja', 'en'];

class I18n extends Emitter {
  constructor() {
    super();
    this.lang = 'ja';
    this.dict = {};
    this.cache = {};
  }
  detect() {
    const saved = Settings.get('lang');
    if (saved && LANGS.includes(saved)) return saved;
    const nav = (navigator.language || 'ja').toLowerCase();
    return nav.startsWith('ja') ? 'ja' : 'en';
  }
  async load(lang) {
    if (!this.cache[lang]) {
      const res = await fetch(`locales/${lang}.json`, { cache: 'no-cache' });
      if (!res.ok) throw new Error('locale load failed: ' + lang);
      this.cache[lang] = await res.json();
    }
    this.lang = lang;
    this.dict = this.cache[lang];
    document.documentElement.lang = lang;
    Settings.set('lang', lang);
    this.apply(document);
    this.emit('change', lang);
  }
  has(key) { return this._lookup(key) !== undefined; }
  _lookup(key) {
    let o = this.dict;
    for (const p of key.split('.')) {
      if (o == null) return undefined;
      o = o[p];
    }
    return o;
  }
  /** t('a.b', {n: 3}) -> string (falls back to key) */
  t(key, params) {
    let v = this._lookup(key);
    if (v === undefined) return key;
    if (typeof v === 'string' && params) {
      v = v.replace(/\{(\w+)\}/g, (_, k) => (params[k] !== undefined ? params[k] : `{${k}}`));
    }
    return v;
  }
  /** raw object/array access */
  get(key) { return this._lookup(key); }
  apply(root) {
    root.querySelectorAll('[data-i18n]').forEach((el) => {
      el.textContent = this.t(el.dataset.i18n);
    });
    root.querySelectorAll('[data-i18n-attr]').forEach((el) => {
      // format: "aria-label:key;title:key"
      el.dataset.i18nAttr.split(';').forEach((pair) => {
        const [attr, key] = pair.split(':');
        if (attr && key) el.setAttribute(attr.trim(), this.t(key.trim()));
      });
    });
  }
}
export const i18n = new I18n();
export const t = (k, p) => i18n.t(k, p);
