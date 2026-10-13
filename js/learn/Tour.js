// =============================================================
//  Tour — plays a sequence of scenes (camera, focus, explode,
//  time-scale, widgets) with bilingual text in the side panel.
//  Basic tour = learn/Chapters.js · artisan tours = learn/artisan/*
// =============================================================
import * as THREE from 'three';
import { Timeline } from '../core/Timeline.js';
import { i18n, t } from '../core/i18n.js';
import { ICON } from '../ui/icons.js';
import { STUDY } from '../demo/Director.js';
import { BASIC } from './Chapters.js';
import { ARTISAN_TOURS } from './artisan/index.js';
import { richText } from './Glossary.js';

const V = (a) => new THREE.Vector3(...a);
const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };

export class Tour {
  constructor(app) {
    this.app = app;
    this.tours = { basic: BASIC, ...Object.fromEntries(ARTISAN_TOURS.map((x) => [x.id, x])) };
    this.cur = null; this.index = 0;
    this.cleanup = null;
    i18n.on('change', () => { if (this.cur) this.renderText(); });
  }
  def(id) { return this.tours[id]; }
  key(id) { return id === 'basic' ? 'tour.basic' : `artisan.${id}`; }

  // ---------- menus ----------
  openMenu(id = 'basic') {
    const d = this.def(id), k = this.key(id);
    const body = h('div', 'menu');
    body.appendChild(h('p', 'lead', richText(t(`${k}.intro`))));
    const list = h('ol', 'chapters');
    d.scenes.forEach((sc, i) => {
      const li = h('li', '', `<button><span class="num">${String(i + 1).padStart(2, '0')}</span><span class="ttl">${t(`${k}.scenes.${i}.title`)}</span><span class="sub">${t(`${k}.scenes.${i}.kicker`)}</span></button>`);
      li.querySelector('button').addEventListener('click', () => this.app.director.setMode(id === 'basic' ? 'learn' : 'artisan', { tour: id, scene: i, force: true }));
      list.appendChild(li);
    });
    body.appendChild(list);
    const go = h('button', 'primary', `${ICON.play}<span>${t('ui.tour.start')}</span>`);
    go.addEventListener('click', () => this.app.director.setMode(id === 'basic' ? 'learn' : 'artisan', { tour: id, scene: 0, force: true }));
    this.app.ui.panel.open({ title: t(`${k}.title`), kicker: t(id === 'basic' ? 'ui.tour.basicKicker' : 'ui.tour.artisanKicker'), body, foot: go });
  }
  openArtisanMenu() {
    const body = h('div', 'menu');
    body.appendChild(h('p', 'lead', t('artisan.intro')));
    const grid = h('div', 'cards');
    ARTISAN_TOURS.forEach((d) => {
      const c = h('button', 'card', `<span class="card-ico">${d.icon}</span><b>${t(`artisan.${d.id}.title`)}</b><small>${t(`artisan.${d.id}.en`)}</small><span>${t(`artisan.${d.id}.blurb`)}</span>`);
      c.addEventListener('click', () => this.openMenu(d.id));
      grid.appendChild(c);
    });
    body.appendChild(grid);
    this.app.ui.panel.open({ title: t('artisan.title'), kicker: t('ui.tour.artisanKicker'), body });
  }

  // ---------- playback ----------
  async start(id, index = 0) {
    this.stop(true);
    this.cur = id; this.index = index;
    const a = this.app;
    this.buildPanel();
    this.index = index;
    this.renderText();
    // head floats facing the viewer (+Z) so scene cameras can be authored in head space
    const token = (this.startToken = {});
    await a.director.toStudy(new THREE.Vector3(0, 0, 1));
    if (this.startToken !== token || this.cur !== id) return;
    this.go(this.index, true);
  }
  buildPanel() {
    const body = h('div', 'tour');
    body.innerHTML = `<div class="tour-progress"></div><h3 class="tour-title"></h3><div class="tour-text"></div><div class="tour-widget"></div>`;
    const foot = h('div', 'tour-nav');
    foot.innerHTML = `<button class="icon-btn prev">${ICON.prev}</button><button class="ghost-btn menu-btn" data-i18n="ui.tour.chapters"></button><button class="primary next"><span></span>${ICON.next}</button>`;
    foot.querySelector('.prev').addEventListener('click', () => this.go(this.index - 1));
    foot.querySelector('.next').addEventListener('click', () => {
      if (this.index < this.def(this.cur).scenes.length - 1) this.go(this.index + 1);
      else { const id = this.cur; this.app.director.setMode('explore'); this.app.ui.toast(t('ui.tour.finished')); if (id !== 'basic') this.openArtisanMenu(); }
    });
    foot.querySelector('.menu-btn').addEventListener('click', () => this.openMenu(this.cur));
    this.panelBody = body; this.panelFoot = foot;
    const k = this.key(this.cur);
    this.app.ui.panel.open({ title: t(`${k}.title`), kicker: t(this.cur === 'basic' ? 'ui.tour.basicKicker' : 'ui.tour.artisanKicker'), body, foot, onClose: (user) => { if (user) this.app.director.setMode('explore'); } });
    i18n.apply(foot);
  }
  renderText() {
    if (!this.panelBody) return;
    const k = this.key(this.cur), i = this.index, d = this.def(this.cur);
    this.app.ui.panel.setTitle(t(`${k}.title`), t(this.cur === 'basic' ? 'ui.tour.basicKicker' : 'ui.tour.artisanKicker'));
    this.panelBody.querySelector('.tour-progress').innerHTML = d.scenes.map((_, j) => `<i class="${j === i ? 'on' : j < i ? 'done' : ''}"></i>`).join('') + `<span>${i + 1} / ${d.scenes.length}</span>`;
    this.panelBody.querySelector('.tour-title').innerHTML = `<small>${t(`${k}.scenes.${i}.kicker`)}</small>${t(`${k}.scenes.${i}.title`)}`;
    const body = t(`${k}.scenes.${i}.body`, { n: this.app.watch.jewelCount });
    this.panelBody.querySelector('.tour-text').innerHTML = String(body).split('\n\n').map((p) => `<p>${richText(p)}</p>`).join('');
    const last = i === d.scenes.length - 1;
    this.panelFoot.querySelector('.next span').textContent = t(last ? 'ui.tour.finish' : 'ui.tour.next');
    this.panelFoot.querySelector('.prev').disabled = i === 0;
    i18n.apply(this.panelFoot);
    this.app.glossary.bind(this.panelBody);
    this.widget?.refresh?.();
  }
  async go(i, first = false) {
    if (!this.cur || !this.panelBody) return;
    const d = this.def(this.cur);
    if (i < 0 || i >= d.scenes.length) return;
    if (!first && this.startToken) { this.startToken = null; }
    this.exitScene();
    this.index = i;
    const sc = d.scenes[i];
    this.renderText();
    this.panelBody.scrollTop = 0;
    this.app.ui.panel.body.scrollTop = 0;
    await this.enterScene(sc);
  }
  async enterScene(sc) {
    const a = this.app, w = a.watch;
    const token = (this.sceneToken = {});
    a.kin.timeScale = sc.ts ?? 1;
    a.audio.setTimeScale(a.kin.timeScale);
    // focus / ghost (macro scenes use a fainter ghost so the subject stays crisp)
    a.highlight.ghost.opacity = sc.ghost ?? 0.07;
    if (sc.focus) a.highlight.focus(sc.focus, { keepCase: !!sc.keepCase }); else a.highlight.clear();
    if (sc.xray) a.highlight.xray(true);
    // explode
    if (sc.explode) {
      a.explode.setChoreo(a.explode.choreo);
      const only = sc.explode.only ? a.highlight.resolve(sc.explode.only) : null;
      a.explode.animateTo(sc.explode.f ?? 0.6, { dur: 1.5, only });
    } else if (a.explode.factor > 0 || sc.forceAssemble !== false) a.explode.animateTo(0, { dur: 1.2 });
    // head orientation (optional)
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(...(sc.headRot || [0, 0, 0])));
    const head = w.head;
    if (!a.showcase.seated) {
      const q0 = head.quaternion.clone();
      Timeline.tween({ dur: 1.6, ease: 'inOutCubic', group: 'tour', onUpdate: (e) => head.quaternion.slerpQuaternions(q0, q, e) });
    }
    // camera (authored in head space with head facing +Z, positioned at STUDY.pos)
    const narrow = a.director.narrow;
    const cam = sc.cam || { pos: [0, 6, 100], target: [0, 0, 0] };
    const scale = narrow ? (cam.narrow ?? 1.45) : 1;
    const tgt = V(cam.target).add(STUDY.pos);
    const pos = V(cam.pos).multiplyScalar(scale).add(STUDY.pos);
    // DOF for macro shots
    const dist = pos.distanceTo(tgt);
    a.stage.post.setDOF(!!cam.dof, dist, cam.dof || 0);
    a.rig.flyTo(pos, tgt, sc.camDur ?? 2.0);
    a.rig.orbitSpeed = sc.orbit || 0;
    // power flow
    if (sc.flow) a.flow.show(sc.flow === true ? undefined : sc.flow); else a.flow.hide();
    // scene-specific action / vignette (runs before the widget so it can publish state)
    sc.state = {};
    if (sc.enter) {
      const ctx = { app: a, token, scene: sc, t: (k) => t(k), STUDY, onUpdate: (fn) => { this.sceneUpdate = fn; } };
      this.cleanup = (await sc.enter(ctx)) || null;
    }
    if (this.sceneToken !== token) return;
    const wEl = this.panelBody.querySelector('.tour-widget');
    wEl.replaceChildren();
    this.widget = null;
    if (sc.widget) this.widget = a.widgets.create(sc.widget, wEl, sc);
  }
  exitScene() {
    const a = this.app;
    Timeline.kill('tour');
    this.sceneToken = null;
    this.sceneUpdate = null;
    if (this.cleanup) { try { this.cleanup(); } catch (e) { console.warn(e); } this.cleanup = null; }
    this.widget?.dispose?.();
    this.widget = null;
    a.flow.hide();
    a.highlight.xray(false);
    a.stage.post.setDOF(false);
    a.watch.head.visible = true;
    a.highlight.ghost.opacity = 0.07;
  }
  stop(silent) {
    if (!this.cur) return;
    this.exitScene();
    this.cur = null;
    const a = this.app;
    a.kin.timeScale = 1; a.audio.setTimeScale(1);
    a.highlight.clear();
    a.rig.orbitSpeed = 0;
    if (!silent && a.ui.panel.isOpen) a.ui.panel.close();
  }
  update(dt, t0) { this.widget?.update?.(dt); this.sceneUpdate?.(dt, t0); }
}
