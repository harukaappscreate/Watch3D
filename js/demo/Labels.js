// =============================================================
//  Labels — HTML part names with leader lines (exploded views)
// =============================================================
import * as THREE from 'three';

export class Labels {
  constructor(root) {
    this.root = document.createElement('div');
    this.root.className = 'labels';
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.classList.add('labels-svg');
    this.root.appendChild(this.svg);
    root.appendChild(this.root);
    this.items = [];
    this.visible = false;
    this.v = new THREE.Vector3();
  }
  show(entries) {
    this.clear();
    entries.forEach(({ part, title, sub }) => {
      const el = document.createElement('div');
      el.className = 'label';
      el.innerHTML = `<b>${title}</b>${sub ? `<span>${sub}</span>` : ''}`;
      this.root.appendChild(el);
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      this.svg.appendChild(line);
      const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dot.setAttribute('r', '2.6');
      this.svg.appendChild(dot);
      this.items.push({ part, el, line, dot, w: 0 });
    });
    this.visible = true;
    requestAnimationFrame(() => {
      this.items.forEach((it) => (it.w = it.el.offsetWidth));
      this.root.classList.add('on');
    });
  }
  hide() { this.root.classList.remove('on'); this.visible = false; setTimeout(() => { if (!this.visible) this.clear(); }, 500); }
  clear() { this.items.forEach((it) => { it.el.remove(); it.line.remove(); it.dot.remove(); }); this.items = []; }
  update(camera, w, h) {
    if (!this.items.length) return;
    this.svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    const narrow = w < 700;
    const pts = this.items.map((it) => {
      it.part.worldCentre(this.v);
      this.v.project(camera);
      return { it, x: (this.v.x * 0.5 + 0.5) * w, y: (-this.v.y * 0.5 + 0.5) * h, behind: this.v.z > 1 };
    });
    const cx = w / 2;
    const left = pts.filter((p) => p.x < cx).sort((a, b) => a.y - b.y);
    const right = pts.filter((p) => p.x >= cx).sort((a, b) => a.y - b.y);
    const gap = narrow ? 30 : 36;
    const top = narrow ? 70 : 80, bottom = h - (narrow ? 210 : 150);
    const place = (list, side) => {
      let y = top;
      const out = list.map((p) => { const ly = Math.max(y, Math.min(bottom, p.y)); y = ly + gap; return ly; });
      // if overflowing, push up
      for (let i = out.length - 1; i >= 0; i--) {
        const maxY = bottom - (out.length - 1 - i) * gap;
        if (out[i] > maxY) out[i] = maxY;
        if (i > 0 && out[i - 1] > out[i] - gap) out[i - 1] = out[i] - gap;
      }
      list.forEach((p, i) => {
        const it = p.it;
        const margin = narrow ? 8 : Math.max(24, w * 0.06);
        const lx = side < 0 ? margin : w - margin - it.w;
        const ly = out[i];
        it.el.style.transform = `translate(${lx}px, ${ly - 14}px)`;
        it.el.classList.toggle('r', side > 0);
        const ex = side < 0 ? lx + it.w + 6 : lx - 6;
        const kx = ex + (side < 0 ? 26 : -26);
        it.line.setAttribute('d', `M${ex},${ly} L${kx},${ly} L${p.x},${p.y}`);
        it.dot.setAttribute('cx', p.x); it.dot.setAttribute('cy', p.y);
        const hide = p.behind ? '0' : '1';
        it.el.style.opacity = hide; it.line.style.opacity = hide; it.dot.style.opacity = hide;
      });
    };
    place(left, -1); place(right, 1);
  }
}
