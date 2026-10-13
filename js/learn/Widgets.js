// =============================================================
//  Widgets — small live panels shown inside tour scenes
// =============================================================
import { t } from '../core/i18n.js';
import { MOVEMENT as M } from '../config.js';
import { JEWEL_TYPES } from '../watch/Watch.js';

const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };
const fmtPeriod = (s) => {
  if (s < 1) return `${s.toFixed(2)} ${t('widgets.unit.s')}`;
  if (s < 120) return `${s.toFixed(s < 10 ? 1 : 0)} ${t('widgets.unit.s')}`;
  if (s < 7200) return `${(s / 60).toFixed(s < 600 ? 1 : 0)} ${t('widgets.unit.min')}`;
  return `${(s / 3600).toFixed(1)} ${t('widgets.unit.h')}`;
};

// positional rate errors (s/day) used by gravity & positions widgets (illustrative values)
export const POSITIONS = [
  { k: 'DU', err: +2 }, { k: 'DD', err: +3 }, { k: 'CU', err: -6 }, { k: 'CD', err: +5 }, { k: 'CL', err: -8 }, { k: 'CR', err: +4 },
];

function chart(canvas, values, mark, colorA = '#d9b77a', colorB = '#7fb0ff', avgLine) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = canvas.clientWidth || 300, H = canvas.clientHeight || 120;
  canvas.width = W * dpr; canvas.height = H * dpr;
  const c = canvas.getContext('2d'); c.scale(dpr, dpr);
  c.clearRect(0, 0, W, H);
  const mid = H / 2, sc = H / 26;
  c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 1;
  c.beginPath(); c.moveTo(0, mid); c.lineTo(W, mid); c.stroke();
  const bw = W / values.length;
  values.forEach((v, i) => {
    c.fillStyle = i === mark ? colorA : 'rgba(217,183,122,.45)';
    const y = mid - v.err * sc;
    c.fillRect(i * bw + bw * 0.22, Math.min(mid, y), bw * 0.56, Math.abs(v.err * sc));
    c.fillStyle = 'rgba(255,255,255,.7)'; c.font = '11px system-ui'; c.textAlign = 'center';
    c.fillText(v.k, i * bw + bw / 2, H - 4);
  });
  if (avgLine !== undefined) {
    c.strokeStyle = colorB; c.setLineDash([4, 3]); c.lineWidth = 1.5;
    const y = mid - avgLine * sc; c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); c.setLineDash([]);
  }
}

export class Widgets {
  constructor(app) { this.app = app; }
  create(name, el, sc) {
    const fn = this['w_' + name];
    if (!fn) return null;
    const box = h('div', 'widget');
    el.appendChild(box);
    const api = fn.call(this, box, sc) || {};
    return { update: api.update, dispose: api.dispose, refresh: () => { box.replaceChildren(); Object.assign(api, fn.call(this, box, sc) || {}); } };
  }

  w_reserve(box) {
    const k = this.app.kin;
    box.innerHTML = `<div class="w-row"><span>${t('widgets.reserve.label')}</span><b class="v"></b></div><div class="gauge"><i></i></div><div class="w-row small"><span>${t('ui.hud.amp')}</span><b class="a"></b></div><button class="ghost-btn hold">${t('widgets.reserve.wind')}</button>`;
    const v = box.querySelector('.v'), g = box.querySelector('.gauge i'), a = box.querySelector('.a');
    const btn = box.querySelector('.hold');
    let hold = false;
    btn.addEventListener('pointerdown', (e) => { e.preventDefault(); hold = true; this.app.audio.unlock(); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => btn.addEventListener(ev, () => { hold = false; }));
    return { update: (dt) => { if (hold) k.windCrown(dt * 7); v.textContent = `${k.power.toFixed(1)} / ${k.maxPower} h`; g.style.width = `${(k.power / M.reserveHours) * 100}%`; a.textContent = `${Math.round(k.amp)}°`; } };
  }
  w_ratio(box) {
    const rows = [
      ['barrel', `${M.barrel.Z}${t('widgets.unit.teeth')}`, 'barrel'],
      ['centerWheel', `${M.centerPinion.Z} / ${M.center.Z}`, 'centerWheel'],
      ['thirdWheel', `${M.thirdPinion.Z} / ${M.third.Z}`, 'thirdWheel'],
      ['tourbillon', `${M.cagePinion.Z}`, 'tourbillon'],
      ['escapeWheel', `${M.escapePinion.Z} / ${M.escape.Z} · ${t('widgets.ratio.fixed')} ${M.fixedWheel.Z}`, 'escapeWheel'],
      ['balance', `${M.freqHz} Hz`, 'balance'],
    ];
    box.innerHTML = `<div class="w-title">${t('widgets.ratio.title')}</div><table class="ratio">${rows.map(([type, teeth, key]) => `<tr><th>${t(`parts.${type}.name`)}</th><td>${teeth}</td><td class="p" data-k="${key}"></td></tr>`).join('')}</table>
      <p class="formula">${t('widgets.ratio.formula')}</p><p class="small">${t('widgets.ratio.note')}</p>`;
    const cells = [...box.querySelectorAll('.p')];
    return { update: () => { const P = this.app.kin.periods(); cells.forEach((c) => (c.textContent = fmtPeriod(P[c.dataset.k]) + t('widgets.ratio.perRev'))); } };
  }
  w_escapement(box) {
    const ph = ['unlock', 'impulse', 'drop', 'lock'];
    box.innerHTML = `<div class="w-title">${t('widgets.esc.title')}</div><ol class="phases">${ph.map((p) => `<li data-p="${p}"><b>${t('widgets.esc.' + p)}</b><span>${t('widgets.esc.' + p + 'Text')}</span></li>`).join('')}</ol>`;
    const li = [...box.querySelectorAll('li')];
    return { update: () => { const cur = this.app.kin.escPhase; li.forEach((l) => l.classList.toggle('on', l.dataset.p === cur)); } };
  }
  w_balance(box) {
    box.innerHTML = `<div class="w-title">${t('widgets.balance.title')}</div><canvas class="scope"></canvas>
      <div class="w-grid"><div><small>${t('widgets.balance.freq')}</small><b>4 Hz</b></div><div><small>${t('widgets.balance.vph')}</small><b>28,800</b></div><div><small>${t('ui.hud.amp')}</small><b class="a"></b></div><div><small>${t('widgets.balance.period')}</small><b>0.25 ${t('widgets.unit.s')}</b></div></div>`;
    const cv = box.querySelector('canvas'), a = box.querySelector('.a');
    const hist = [];
    return { update: () => {
      const k = this.app.kin;
      hist.push(k.balAngle || 0); if (hist.length > 220) hist.shift();
      a.textContent = `${Math.round(k.amp)}°`;
      const dpr = Math.min(2, devicePixelRatio || 1), W = cv.clientWidth || 280, H = cv.clientHeight || 80;
      if (cv.width !== W * dpr) { cv.width = W * dpr; cv.height = H * dpr; }
      const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, W, H);
      c.strokeStyle = 'rgba(255,255,255,.15)'; c.beginPath(); c.moveTo(0, H / 2); c.lineTo(W, H / 2); c.stroke();
      c.strokeStyle = '#d9b77a'; c.lineWidth = 1.6; c.beginPath();
      hist.forEach((v, i) => { const x = (i / 220) * W, y = H / 2 - (v / (5.6)) * (H / 2 - 4); i ? c.lineTo(x, y) : c.moveTo(x, y); });
      c.stroke();
    } };
  }
  w_jewels(box) {
    const w = this.app.watch;
    const counts = {};
    w.list.forEach((p) => { if (JEWEL_TYPES.has(p.type)) counts[p.type] = (counts[p.type] || 0) + 1; });
    box.innerHTML = `<div class="w-title">${t('widgets.jewels.title', { n: w.jewelCount })}</div><ul class="jl">${Object.entries(counts).map(([k, n]) => `<li><span class="dot ruby"></span>${t(`parts.${k}.name`)}<b>×${n}</b></li>`).join('')}</ul><p class="small">${t('widgets.jewels.note')}</p>`;
  }
  w_motion(box) {
    box.innerHTML = `<div class="w-title">${t('widgets.motion.title')}</div>
      <p class="formula">${t('widgets.motion.formula')}</p><div class="w-row"><span>${t('widgets.motion.watchTime')}</span><b class="v"></b></div>`;
    const v = box.querySelector('.v');
    return { update: () => { const k = this.app.kin; const d = new Date((k.watchSeconds + k.setOffset) * 1000); v.textContent = `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`; } };
  }
  w_gravity(box, sc) {
    box.innerHTML = `<div class="w-title">${t('widgets.gravity.title')}</div><canvas class="chart"></canvas><p class="small">${t('widgets.gravity.note')}</p>`;
    const cv = box.querySelector('canvas');
    const vertical = POSITIONS.slice(2);
    const avg = vertical.reduce((s, p) => s + p.err, 0) / vertical.length;
    let tt = 0;
    return { update: (dt) => { tt += dt; if (tt > 0.5) { tt = 0; chart(cv, POSITIONS, sc?.state?.pos ?? Math.floor(performance.now() / 1500) % POSITIONS.length, undefined, undefined, avg); } } };
  }
  w_positions(box, sc) { return this.w_gravity(box, sc); }
  w_auto(box) {
    const k = this.app.kin;
    const p0 = k.power;
    box.innerHTML = `<div class="w-title">${t('widgets.auto.title')}</div><div class="w-row"><span>${t('widgets.auto.rotor')}</span><b class="r"></b></div><div class="w-row"><span>${t('widgets.auto.gain')}</span><b class="g"></b></div><div class="gauge"><i></i></div>`;
    const r = box.querySelector('.r'), g = box.querySelector('.g'), gi = box.querySelector('.gauge i');
    return { update: () => {
      r.textContent = `${Math.round(((k.rotor * 180) / Math.PI) % 360)}°`;
      g.textContent = `+${Math.max(0, (k.power - p0) * 60).toFixed(1)} ${t('widgets.unit.min')}`;
      gi.style.width = `${(k.power / M.reserveHours) * 100}%`;
    } };
  }
  w_rate(box) {
    const k = this.app.kin;
    box.innerHTML = `<div class="w-title">${t('widgets.rate.title')}</div><input type="range" min="-1" max="1" step="0.001" value="0" class="rate-range"><div class="w-row"><span>${t('ui.hud.rate')}</span><b class="v">0</b></div><p class="small">${t('widgets.rate.note')}</p>`;
    const r = box.querySelector('input'), v = box.querySelector('.v');
    r.value = (k.freqScale - 1) / 0.00035;
    r.addEventListener('input', () => { k.freqScale = 1 + (+r.value) * 0.00035; });
    return { update: () => { const s = (k.freqScale - 1) * 86400; v.textContent = `${s >= 0 ? '+' : ''}${s.toFixed(1)} ${t('ui.hud.sPerDay')}`; }, dispose: () => { k.freqScale = 1; } };
  }
  w_state(box, sc) {
    // generic readout bound to vignette state: sc.state = { label:key, value:fn }
    box.innerHTML = `<div class="w-title">${t(sc.stateTitle || 'widgets.state.title')}</div><div class="w-row"><span class="l"></span><b class="v"></b></div><div class="swatch"></div>`;
    const l = box.querySelector('.l'), v = box.querySelector('.v'), sw = box.querySelector('.swatch');
    return { update: () => {
      const st = sc.state; if (!st) return;
      l.textContent = st.label ? t(st.label) : '';
      v.textContent = st.value ?? '';
      sw.style.background = st.color || 'transparent';
      sw.style.display = st.color ? 'block' : 'none';
    } };
  }
  w_oils(box) {
    const oils = ['o1', 'o2', 'o3', 'o4'];
    const col = { o1: '#7fd3ff', o2: '#ffd36b', o3: '#c38bff', o4: '#7dffb0' };
    box.innerHTML = `<div class="w-title">${t('widgets.oils.title')}</div><ul class="jl">${oils.map((o) => `<li><span class="dot" style="background:${col[o]}"></span>${t('widgets.oils.' + o)}</li>`).join('')}</ul>`;
  }
  w_toggle(box, sc) {
    // sc.toggles = [{key, on:bool, set:fn}]
    box.innerHTML = `<div class="w-title">${t(sc.toggleTitle || 'widgets.toggle.title')}</div><div class="seg wide"></div>`;
    const seg = box.querySelector('.seg');
    (sc.toggles || []).forEach((tg) => {
      const b = h('button', tg.on ? 'on' : '', t(tg.key));
      b.addEventListener('click', () => { seg.querySelectorAll('button').forEach((x) => x.classList.remove('on')); b.classList.add('on'); tg.set(); });
      seg.appendChild(b);
    });
  }
}
