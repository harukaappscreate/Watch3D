// =============================================================
//  UI — top bar, mode dock, captions, explore tools, settings.
//  Mode-specific panels are provided by the learn/* modules.
// =============================================================
import { ICON } from './icons.js';
import { Panel } from './Panel.js';
import { i18n, t, LANGS } from '../core/i18n.js';
import { Settings } from '../core/Settings.js';
import { Quality } from '../core/Quality.js';
import { CHOREOS } from '../demo/choreographies/index.js';

const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };
const MODES = ['showcase', 'loop', 'explore', 'learn', 'artisan', 'parts', 'whatif', 'glossary'];

export class UI {
  constructor(app, root) {
    this.app = app;
    this.root = root;
    root.classList.add('ui');
    this.panel = new Panel(root, (inset) => app.stage.setInset(inset));
    this._top();
    this._dock();
    this._caption();
    this._intro();
    this._explore();
    this._toast();
    this._hud();
    i18n.on('change', () => this.refresh());
    app.director.on('mode', ({ mode }) => this.onMode(mode));
    this.refresh();
  }

  // ---------- top bar ----------
  _top() {
    const top = h('header', 'topbar');
    top.innerHTML = `
      <div class="brand"><span class="brand-mark">haruka_apps</span><span class="brand-cal">Calibre HA-01 · Tourbillon</span></div>
      <div class="top-tools">
        <div class="seg lang" role="group" aria-label="Language">${LANGS.map((l) => `<button data-lang="${l}">${l === 'ja' ? '日本語' : 'EN'}</button>`).join('')}</div>
        <button class="icon-btn sound" data-i18n-attr="aria-label:ui.common.sound;title:ui.common.sound"></button>
        <button class="icon-btn gear" data-i18n-attr="aria-label:ui.settings.title;title:ui.settings.title">${ICON.settings}</button>
      </div>`;
    this.root.appendChild(top);
    top.querySelectorAll('[data-lang]').forEach((b) => b.addEventListener('click', () => i18n.load(b.dataset.lang)));
    this.soundBtn = top.querySelector('.sound');
    this.soundBtn.addEventListener('click', () => { Settings.set('sound', !Settings.get('sound')); this.app.audio.setEnabled(Settings.get('sound')); this._soundIcon(); });
    top.querySelector('.gear').addEventListener('click', () => this.openSettings());
    this.top = top;
    this._soundIcon();
  }
  _soundIcon() { this.soundBtn.innerHTML = Settings.get('sound') ? ICON.soundOn : ICON.soundOff; this.soundBtn.classList.toggle('on', !!Settings.get('sound')); }

  // ---------- dock ----------
  _dock() {
    const dock = h('nav', 'dock');
    dock.setAttribute('aria-label', 'modes');
    dock.innerHTML = MODES.map((m) => `<button class="dock-btn" data-mode="${m}">${ICON[m]}<span data-i18n="ui.modes.${m}"></span></button>`).join('');
    this.root.appendChild(dock);
    dock.querySelectorAll('.dock-btn').forEach((b) => b.addEventListener('click', () => this.pick(b.dataset.mode)));
    this.dock = dock;
  }
  pick(m) {
    const a = this.app;
    a.audio.unlock();
    switch (m) {
      case 'showcase': this.panel.close(); a.director.setMode('showcase'); break;
      case 'loop': this.panel.close(); a.director.setMode('loop', { force: a.director.mode === 'loop' }); break;
      case 'explore': this.panel.close(); a.director.setMode('explore'); break;
      case 'learn': a.tour.openMenu('basic'); break;
      case 'artisan': a.tour.openArtisanMenu(); break;
      case 'parts': a.director.setMode('parts'); a.encyclopedia.open(); break;
      case 'whatif': if (a.director.mode !== 'explore') a.director.setMode('explore'); a.whatif.open(); break;
      case 'glossary': a.glossary.open(); break;
    }
    this.markDock(m);
  }
  markDock(m) { this.dock.querySelectorAll('.dock-btn').forEach((b) => b.classList.toggle('active', b.dataset.mode === m)); }
  onMode(mode) {
    this.root.dataset.mode = mode;
    this.exploreBar.classList.toggle('on', mode === 'explore' || mode === 'parts');
    this.hud.classList.toggle('on', mode === 'explore' || mode === 'parts' || mode === 'learn' || mode === 'artisan');
    if (['showcase', 'loop', 'explore', 'parts'].includes(mode)) this.markDock(mode);
    if (mode === 'learn') this.markDock('learn');
    if (mode === 'artisan') this.markDock('artisan');
    this.exploreSync();
  }

  // ---------- captions ----------
  _caption() {
    this.cap = h('div', 'caption');
    this.cap.innerHTML = '<b></b><span></span>';
    this.root.appendChild(this.cap);
  }
  caption(c) {
    if (!c) { this.cap.classList.remove('on'); return; }
    this.cap.querySelector('b').textContent = c.title || '';
    this.cap.querySelector('span').textContent = c.text || '';
    this.cap.classList.remove('pulse'); void this.cap.offsetWidth; this.cap.classList.add('on', 'pulse');
  }

  // ---------- intro ----------
  _intro() {
    const el = h('div', 'intro');
    el.innerHTML = `<div class="intro-inner"><div class="intro-kicker" data-i18n="intro.kicker"></div><h1>haruka_apps</h1><div class="intro-sub" data-i18n="intro.sub"></div><button class="intro-skip" data-i18n="intro.skip"></button></div>`;
    this.root.appendChild(el);
    el.addEventListener('click', () => this.app.director.skipIntro());
    this.introEl = el;
  }
  intro(on) { this.introEl.classList.toggle('on', on); }

  // ---------- toast ----------
  _toast() { this.toastEl = h('div', 'toast'); this.root.appendChild(this.toastEl); }
  toast(msg, ms = 2600) {
    this.toastEl.textContent = msg;
    this.toastEl.classList.add('on');
    clearTimeout(this._tt);
    this._tt = setTimeout(() => this.toastEl.classList.remove('on'), ms);
  }

  // ---------- live readouts ----------
  _hud() {
    this.hud = h('div', 'hud');
    this.hud.innerHTML = `
      <div><small data-i18n="ui.hud.amp"></small><b class="hud-amp">—</b></div>
      <div><small data-i18n="ui.hud.reserve"></small><b class="hud-pr">—</b></div>
      <div><small data-i18n="ui.hud.beat"></small><b class="hud-vph">28,800</b></div>
      <div><small data-i18n="ui.hud.rate"></small><b class="hud-rate">±0</b></div>`;
    this.root.appendChild(this.hud);
    this.hudEls = { amp: this.hud.querySelector('.hud-amp'), pr: this.hud.querySelector('.hud-pr'), vph: this.hud.querySelector('.hud-vph'), rate: this.hud.querySelector('.hud-rate') };
    this._hudT = 0;
  }
  update(dt) {
    this._hudT += dt;
    if (this._hudT < 0.2) return;
    this._hudT = 0;
    const k = this.app.kin;
    if (!this.hud.classList.contains('on')) return;
    this.hudEls.amp.textContent = `${Math.round(k.amp)}°`;
    this.hudEls.pr.textContent = `${k.power.toFixed(1)} h`;
    this.hudEls.vph.textContent = Math.round(28800 * k.freqScale).toLocaleString();
    const rate = (k.freqScale - 1) * 86400;
    this.hudEls.rate.textContent = `${rate >= 0 ? '+' : ''}${rate.toFixed(0)} ${t('ui.hud.sPerDay')}`;
    if (this.slowLabel) this.slowLabel.textContent = this._slowText();
  }

  // ---------- explore tools ----------
  _explore() {
    const bar = h('div', 'explore-bar');
    bar.innerHTML = `
      <label class="tool slider"><span data-i18n="ui.explore.explode"></span><input type="range" min="0" max="1" step="0.001" value="0" class="ex-range"></label>
      <label class="tool slider"><span class="slow-label"></span><input type="range" min="0" max="1" step="0.001" value="1" class="slow-range"></label>
      <div class="tool-row">
        <button class="tool-btn" data-act="xray">${ICON.xray}<span data-i18n="ui.explore.xray"></span></button>
        <button class="tool-btn" data-act="section">${ICON.section}<span data-i18n="ui.explore.section"></span></button>
        <button class="tool-btn" data-act="loupe">${ICON.loupe}<span data-i18n="ui.explore.loupe"></span></button>
        <button class="tool-btn" data-act="wind">${ICON.wind}<span data-i18n="ui.explore.wind"></span></button>
        <button class="tool-btn" data-act="crown">${ICON.crown}<span data-i18n="ui.explore.crown"></span></button>
        <button class="tool-btn" data-act="back">${ICON.reset}<span data-i18n="ui.explore.flip"></span></button>
      </div>
      <label class="tool slider set-time" hidden><span data-i18n="ui.explore.setTime"></span><input type="range" min="-1" max="1" step="0.001" value="0" class="time-range"></label>`;
    this.root.appendChild(bar);
    this.exploreBar = bar;
    const ex = () => this.app.explore;
    bar.querySelector('.ex-range').addEventListener('input', (e) => ex().setExplode(+e.target.value));
    const slow = bar.querySelector('.slow-range');
    this.slowLabel = bar.querySelector('.slow-label');
    slow.addEventListener('input', (e) => { ex().setSlow(+e.target.value); this.slowLabel.textContent = this._slowText(); });
    bar.querySelectorAll('.tool-btn').forEach((b) => {
      const act = b.dataset.act;
      if (act === 'wind') {
        const start = (e) => { e.preventDefault(); ex().windHold(true); b.classList.add('active'); };
        const end = () => { ex().windHold(false); b.classList.remove('active'); };
        b.addEventListener('pointerdown', start);
        ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => b.addEventListener(ev, end));
        return;
      }
      b.addEventListener('click', () => { ex().toggle(act); this.exploreSync(); });
    });
    const tr = bar.querySelector('.time-range');
    tr.addEventListener('input', (e) => ex().setTimeSpeed(+e.target.value));
    tr.addEventListener('change', () => { tr.value = 0; ex().setTimeSpeed(0); });
    ['pointerup', 'touchend'].forEach((ev) => tr.addEventListener(ev, () => { tr.value = 0; ex().setTimeSpeed(0); }));
  }
  _slowText() {
    const ts = this.app.kin.timeScale;
    return `${t('ui.explore.speed')} ×${ts >= 0.995 ? '1' : ts.toFixed(ts < 0.1 ? 3 : 2)}`;
  }
  exploreSync() {
    const ex = this.app.explore; if (!ex) return;
    this.exploreBar.querySelectorAll('.tool-btn').forEach((b) => {
      const a = b.dataset.act;
      if (a in ex.flags) b.classList.toggle('active', !!ex.flags[a]);
    });
    this.exploreBar.querySelector('.set-time').hidden = !ex.flags.crown;
    const r = this.exploreBar.querySelector('.ex-range');
    if (document.activeElement !== r) r.value = this.app.explode.factor;
    const s = this.exploreBar.querySelector('.slow-range');
    if (document.activeElement !== s) s.value = ex.slowValue ?? 1;
    this.slowLabel.textContent = this._slowText();
  }

  // ---------- settings ----------
  openSettings() {
    const a = this.app;
    const body = h('div', 'settings');
    const row = (key, label, options, cur, onPick) => {
      const r = h('div', 'set-row');
      r.innerHTML = `<div class="set-label">${label}</div><div class="seg">${options.map(([v, l]) => `<button data-v="${v}" class="${String(v) === String(cur) ? 'on' : ''}">${l}</button>`).join('')}</div>`;
      r.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
        r.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
        onPick(b.dataset.v);
      }));
      body.appendChild(r);
    };
    row('caseFinish', t('ui.settings.case'), [['steel', t('ui.settings.steel')], ['rose', t('ui.settings.rose')], ['yellow', t('ui.settings.yellow')]], Settings.get('caseFinish'), (v) => { Settings.set('caseFinish', v); a.mats.setCaseFinish(v); });
    row('dial', t('ui.settings.dial'), [['blue', t('ui.settings.blue')], ['silver', t('ui.settings.silver')], ['black', t('ui.settings.black')]], Settings.get('dial'), (v) => { Settings.set('dial', v); a.watch.dial.setColor(v); });
    row('strap', t('ui.settings.strap'), [['leather', t('ui.settings.leather')], ['metal', t('ui.settings.metal')]], Settings.get('strap'), (v) => { Settings.set('strap', v); a.showcase.mount.setType(v); });
    row('choreo', t('ui.settings.choreo'), [['cycle', t('ui.settings.cycle')], ...CHOREOS.map((c) => [c.id, t('loop.name.' + c.id)])], Settings.get('choreo'), (v) => Settings.set('choreo', v));
    row('loopSpeed', t('ui.settings.speed'), [['0.5', '×0.5'], ['1', '×1'], ['1.5', '×1.5'], ['2', '×2']], Settings.get('loopSpeed'), (v) => Settings.set('loopSpeed', +v));
    row('labels', t('ui.settings.labels'), [['true', t('ui.common.on')], ['false', t('ui.common.off')]], Settings.get('labels'), (v) => Settings.set('labels', v === 'true'));
    row('quality', t('ui.settings.quality'), [['auto', t('ui.settings.auto')], ['low', t('ui.settings.low')], ['medium', t('ui.settings.medium')], ['high', t('ui.settings.high')]], Settings.get('quality'), (v) => { Settings.set('quality', v); if (v !== 'auto') Quality.set(v); this.toast(t('ui.settings.qualityNote')); });
    const about = h('div', 'about');
    about.innerHTML = t('ui.settings.about');
    body.appendChild(about);
    this.panel.open({ title: t('ui.settings.title'), kicker: 'haruka_apps', body });
  }

  refresh() {
    i18n.apply(this.root);
    this.top.querySelectorAll('[data-lang]').forEach((b) => b.classList.toggle('on', b.dataset.lang === i18n.lang));
    this.exploreSync?.();
  }
}
