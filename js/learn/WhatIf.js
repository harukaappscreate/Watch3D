// =============================================================
//  WhatIf — four thought experiments that change the physics
// =============================================================
import { t } from '../core/i18n.js';
import { MOVEMENT as M } from '../config.js';
import { richText } from './Glossary.js';
import { POSITIONS } from './Widgets.js';
import { JEWEL_TYPES } from '../watch/Watch.js';

const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };

export class WhatIf {
  constructor(app) { this.app = app; this.state = { escape: false, length: 0, cage: false, metal: false }; }
  open() {
    const a = this.app, k = a.kin;
    const body = h('div', 'whatif');
    body.appendChild(h('p', 'lead', richText(t('whatif.intro'))));
    const card = (id, controls) => {
      const c = h('section', 'wi-card');
      c.innerHTML = `<h4>${t(`whatif.${id}.title`)}</h4><p>${richText(t(`whatif.${id}.q`))}</p><div class="wi-ctl"></div><p class="wi-a small">${richText(t(`whatif.${id}.a`))}</p>`;
      c.querySelector('.wi-ctl').appendChild(controls);
      body.appendChild(c);
      return c;
    };
    // 1. remove the escapement
    const b1 = h('button', 'primary', t('whatif.escape.btn'));
    b1.addEventListener('click', () => this.removeEscapement());
    card('escape', b1);
    // 2. hairspring length
    const wrap2 = h('div', 'wi-slider');
    wrap2.innerHTML = `<input type="range" min="-1" max="1" step="0.01" value="${this.state.length}"><div class="w-row"><span>${t('whatif.length.len')}</span><b class="l"></b></div><div class="w-row"><span>${t('ui.hud.rate')}</span><b class="r"></b></div>`;
    const r2 = wrap2.querySelector('input'), l2 = wrap2.querySelector('.l'), rr2 = wrap2.querySelector('.r');
    const upd2 = () => {
      const pct = +r2.value * 0.5; // ±0.5 %
      this.state.length = +r2.value;
      k.freqScale = 1 / Math.sqrt(1 + pct / 100); // f ∝ 1/√L
      l2.textContent = `${pct >= 0 ? '+' : ''}${pct.toFixed(2)} %`;
      const s = (k.freqScale - 1) * 86400;
      rr2.textContent = `${s >= 0 ? '+' : ''}${s.toFixed(0)} ${t('ui.hud.sPerDay')}`;
    };
    r2.addEventListener('input', upd2); upd2();
    card('length', wrap2);
    // 3. stop the tourbillon
    const wrap3 = h('div');
    const seg3 = h('div', 'seg wide', `<button class="${!this.state.cage ? 'on' : ''}" data-v="0">${t('whatif.cage.run')}</button><button class="${this.state.cage ? 'on' : ''}" data-v="1">${t('whatif.cage.stop')}</button>`);
    const cv = h('canvas', 'chart');
    const res = h('div', 'w-row', `<span>${t('whatif.cage.avg')}</span><b></b>`);
    wrap3.append(seg3, cv, res);
    const upd3 = () => {
      k.cageFrozen = this.state.cage;
      const vertical = POSITIONS.slice(2);
      const avg = vertical.reduce((s, p) => s + p.err, 0) / vertical.length;
      const spread = Math.max(...vertical.map((p) => p.err)) - Math.min(...vertical.map((p) => p.err));
      res.querySelector('b').textContent = this.state.cage ? `${t('whatif.cage.spread')} ${spread} ${t('ui.hud.sPerDay')}` : `${avg >= 0 ? '+' : ''}${avg.toFixed(1)} ${t('ui.hud.sPerDay')}`;
      requestAnimationFrame(() => this.drawChart(cv, avg));
    };
    seg3.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
      seg3.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
      this.state.cage = b.dataset.v === '1'; upd3();
    }));
    upd3();
    card('cage', wrap3);
    // 4. metal bearings
    const wrap4 = h('div');
    const seg4 = h('div', 'seg wide', `<button class="${!this.state.metal ? 'on' : ''}" data-v="0">${t('whatif.metal.ruby')}</button><button class="${this.state.metal ? 'on' : ''}" data-v="1">${t('whatif.metal.steel')}</button>`);
    const out4 = h('div', '', `<div class="w-row"><span>${t('ui.hud.amp')}</span><b class="a"></b></div><div class="w-row"><span>${t('whatif.metal.reserve')}</span><b class="p"></b></div>`);
    wrap4.append(seg4, out4);
    seg4.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
      seg4.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
      this.setMetal(b.dataset.v === '1');
    }));
    this.out4 = out4;
    card('metal', wrap4);
    const reset = h('button', 'ghost-btn', t('whatif.reset'));
    reset.addEventListener('click', () => { this.resetAll(); this.open(); });
    a.ui.panel.open({ title: t('whatif.title'), kicker: t('whatif.kicker'), body, foot: reset, onClose: () => {} });
    a.highlight.focus(['tourbillon', 'fixedWheel', 'barrel', 'centerWheel', 'thirdWheel']);
  }
  drawChart(cv, avg) {
    const W = cv.clientWidth || 300, H = cv.clientHeight || 110, dpr = Math.min(2, devicePixelRatio || 1);
    cv.width = W * dpr; cv.height = H * dpr;
    const c = cv.getContext('2d'); c.scale(dpr, dpr);
    const mid = H / 2, sc = H / 26, bw = W / POSITIONS.length;
    c.strokeStyle = 'rgba(255,255,255,.2)'; c.beginPath(); c.moveTo(0, mid); c.lineTo(W, mid); c.stroke();
    POSITIONS.forEach((p, i) => {
      const vertical = i >= 2;
      const v = this.state.cage || !vertical ? p.err : avg;
      c.fillStyle = vertical && !this.state.cage ? '#7fb0ff' : '#d9b77a';
      c.fillRect(i * bw + bw * 0.2, Math.min(mid, mid - v * sc), bw * 0.6, Math.abs(v * sc));
      c.fillStyle = 'rgba(255,255,255,.7)'; c.font = '11px system-ui'; c.textAlign = 'center';
      c.fillText(p.k, i * bw + bw / 2, H - 3);
    });
  }
  async removeEscapement() {
    const a = this.app, k = a.kin;
    if (k.freeRun) return;
    const pal = a.watch.get('pallet');
    pal.root.visible = false;
    a.ui.toast(t('whatif.escape.toast'), 4200);
    k.freeRun = true; k.freeSpeed = 1;
    a.audio.whir(true);
    await new Promise((r) => setTimeout(r, 6500));
    a.audio.whir(false);
    k.freeRun = false;
    pal.root.visible = true;
    k.power = M.reserveHours * 0.75;
    k.resync();
    a.ui.toast(t('whatif.escape.restored'), 3600);
  }
  setMetal(on) {
    const a = this.app, k = a.kin;
    this.state.metal = on;
    k.metal = on;
    if (on) k.power = Math.min(k.power, M.reserveHoursMetal);
    const steel = a.mats.get('steelDark');
    a.watch.list.forEach((p) => {
      if (!JEWEL_TYPES.has(p.type)) return;
      p.meshes.forEach((m) => m.traverse((n) => {
        if (!n.isMesh) return;
        if (on) { n.userData.rubyMat ??= n.material; n.material = steel; } else if (n.userData.rubyMat) { n.material = n.userData.rubyMat; }
      }));
    });
  }
  update() {
    if (!this.out4 || !this.app.ui.panel.isOpen) return;
    const k = this.app.kin;
    this.out4.querySelector('.a').textContent = `${Math.round(k.amp)}°`;
    this.out4.querySelector('.p').textContent = `${k.maxPower} h`;
  }
  resetAll() {
    const k = this.app.kin;
    this.state = { escape: false, length: 0, cage: false, metal: false };
    k.freqScale = 1; k.cageFrozen = false; this.setMetal(false); k.resync();
  }
}
