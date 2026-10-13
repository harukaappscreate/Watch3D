// =============================================================
//  Glossary — ~40 terms; [[id]] or [[id|label]] in any locale text
//  becomes a tappable term that opens a small definition popover.
// =============================================================
import { i18n, t } from '../core/i18n.js';

export function richText(str) {
  return String(str).replace(/\[\[([a-zA-Z0-9_]+)(?:\|([^\]]+))?\]\]/g, (_, id, label) => {
    const term = i18n.get(`glossary.terms.${id}.term`) || id;
    return `<button class="term" data-term="${id}">${label || term}</button>`;
  });
}

const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };

export class Glossary {
  constructor(app) {
    this.app = app;
    this.pop = h('div', 'term-pop');
    this.pop.setAttribute('role', 'dialog');
    document.body.appendChild(this.pop);
    document.addEventListener('pointerdown', (e) => { if (!this.pop.contains(e.target) && !e.target.closest?.('.term')) this.pop.classList.remove('on'); });
  }
  bind(root) {
    root.querySelectorAll('.term').forEach((b) => {
      if (b._bound) return; b._bound = true;
      b.addEventListener('click', (e) => { e.stopPropagation(); this.show(b.dataset.term, b); });
    });
  }
  show(id, anchor) {
    const g = i18n.get(`glossary.terms.${id}`);
    if (!g) return;
    this.pop.innerHTML = `<b>${g.term}</b><small>${g.en || ''}</small><p>${richText(g.def)}</p>`;
    this.bind(this.pop);
    const r = anchor.getBoundingClientRect();
    this.pop.classList.add('on');
    const pw = this.pop.offsetWidth, ph = this.pop.offsetHeight;
    let x = Math.min(window.innerWidth - pw - 10, Math.max(10, r.left + r.width / 2 - pw / 2));
    let y = r.top - ph - 10; if (y < 10) y = r.bottom + 10;
    this.pop.style.transform = `translate(${x}px, ${y}px)`;
  }
  open() {
    const terms = i18n.get('glossary.terms') || {};
    const body = h('div', 'glossary');
    const search = h('input', 'search'); search.type = 'search'; search.placeholder = t('ui.glossary.search');
    const list = h('dl', 'gl-list');
    const render = () => {
      const q = search.value.trim().toLowerCase();
      list.innerHTML = Object.entries(terms)
        .filter(([, g]) => !q || (g.term + ' ' + (g.en || '') + ' ' + g.def).toLowerCase().includes(q))
        .sort((a, b) => a[1].term.localeCompare(b[1].term, i18n.lang))
        .map(([id, g]) => `<div class="gl-item" id="gl-${id}"><dt>${g.term}<small>${g.en || ''}</small></dt><dd>${richText(g.def)}</dd></div>`).join('');
      this.bind(list);
    };
    search.addEventListener('input', render);
    body.append(search, list);
    render();
    this.app.ui.panel.open({ title: t('ui.glossary.title'), kicker: t('ui.glossary.kicker', { n: Object.keys(terms).length }), body });
  }
}
