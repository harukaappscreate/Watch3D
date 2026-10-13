// =============================================================
//  Panel — right-hand side panel on wide screens, draggable
//  bottom sheet on phones. Reports its inset to the stage so the
//  3D view re-centres in the remaining space.
// =============================================================
import { ICON } from './icons.js';

export class Panel {
  constructor(root, onInset) {
    this.onInset = onInset;
    const el = document.createElement('aside');
    el.className = 'panel';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = `
      <div class="sheet-grip" aria-hidden="true"><i></i></div>
      <header class="panel-head">
        <div class="panel-titles"><small class="panel-kicker"></small><h2 class="panel-title"></h2></div>
        <button class="icon-btn panel-close" data-i18n-attr="aria-label:ui.common.close">${ICON.close}</button>
      </header>
      <div class="panel-body"></div>
      <footer class="panel-foot"></footer>`;
    root.appendChild(el);
    this.el = el;
    this.body = el.querySelector('.panel-body');
    this.foot = el.querySelector('.panel-foot');
    this.titleEl = el.querySelector('.panel-title');
    this.kickerEl = el.querySelector('.panel-kicker');
    el.querySelector('.panel-close').addEventListener('click', () => this.close(true));
    this.isOpen = false;
    this.expanded = false;
    this._grip();
    window.addEventListener('resize', () => this.reportInset());
  }
  get mobile() { return window.innerWidth < 760; }
  open({ title = '', kicker = '', body, foot, onClose, wide = false } = {}) {
    this.titleEl.textContent = title;
    this.kickerEl.textContent = kicker;
    this.body.replaceChildren(...(body ? [body] : []));
    this.foot.replaceChildren(...(foot ? [foot] : []));
    this.foot.hidden = !foot;
    this.onCloseCb = onClose;
    this.el.classList.toggle('wide', wide);
    this.el.classList.add('open');
    this.el.setAttribute('aria-hidden', 'false');
    this.isOpen = true;
    this.body.scrollTop = 0;
    this.reportInset();
  }
  setTitle(title, kicker) { this.titleEl.textContent = title; if (kicker !== undefined) this.kickerEl.textContent = kicker; }
  close(user = false) {
    if (!this.isOpen) return;
    this.el.classList.remove('open', 'expanded');
    this.el.setAttribute('aria-hidden', 'true');
    this.isOpen = false; this.expanded = false;
    const cb = this.onCloseCb; this.onCloseCb = null;
    this.reportInset();
    if (cb) cb(user);
  }
  reportInset() {
    if (!this.isOpen) return this.onInset({ right: 0, bottom: 0 });
    if (this.mobile) {
      const h = this.el.getBoundingClientRect().height || window.innerHeight * 0.44;
      this.onInset({ right: 0, bottom: Math.min(h, window.innerHeight * 0.6) });
    } else {
      this.onInset({ right: this.el.offsetWidth + 16, bottom: 0 });
    }
  }
  _grip() {
    const grip = this.el.querySelector('.sheet-grip');
    let y0 = null, moved = false;
    grip.addEventListener('pointerdown', (e) => { y0 = e.clientY; moved = false; grip.setPointerCapture(e.pointerId); });
    grip.addEventListener('pointermove', (e) => { if (y0 !== null && Math.abs(e.clientY - y0) > 12) moved = true; });
    grip.addEventListener('pointerup', (e) => {
      if (y0 === null) return;
      const dy = e.clientY - y0; y0 = null;
      if (!moved || dy < -20) this.toggleExpand(dy < -20 ? true : !this.expanded);
      else if (dy > 60) { if (this.expanded) this.toggleExpand(false); else this.close(true); }
    });
  }
  toggleExpand(v) {
    this.expanded = v;
    this.el.classList.toggle('expanded', v);
    setTimeout(() => this.reportInset(), 320);
  }
}
