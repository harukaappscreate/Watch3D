// =============================================================
//  Highlight — ghosts everything except the parts in focus.
//  Also used for the X-ray view (case parts ghosted).
// =============================================================
export class Highlight {
  constructor(watch, mats) {
    this.w = watch; this.mats = mats;
    this.ghost = mats.get('ghost');
    this.focusSet = null;
    this.xrayOn = false;
  }
  _meshesOf(part) {
    const out = [];
    part.meshes.forEach((m) => m.traverse((n) => { if (n.isMesh) out.push(n); }));
    return out;
  }
  _setGhost(mesh, on) {
    if (on) {
      if (!mesh.userData.mat0) mesh.userData.mat0 = mesh.material;
      mesh.material = Array.isArray(mesh.userData.mat0) ? mesh.userData.mat0.map(() => this.ghost) : this.ghost;
      mesh.castShadow = false;
    } else if (mesh.userData.mat0) {
      mesh.material = mesh.userData.mat0;
      mesh.userData.mat0 = null;
      mesh.castShadow = true;
    }
  }
  /** expand ids/types/groups to a Set of parts (with descendants) */
  resolve(sel = []) {
    const set = new Set();
    const add = (p) => { if (set.has(p)) return; set.add(p); p.children.forEach(add); };
    sel.forEach((s) => {
      if (typeof s !== 'string') { add(s); return; }
      if (s.startsWith('group:')) this.w.list.filter((p) => p.group === s.slice(6)).forEach(add);
      else if (s.startsWith('type:')) this.w.list.filter((p) => p.type === s.slice(5)).forEach(add);
      else { const p = this.w.get(s); if (p) add(p); }
    });
    return set;
  }
  focus(sel, { keepCase = false } = {}) {
    this.focusSet = this.resolve(sel);
    this.apply(keepCase);
  }
  apply(keepCase = false) {
    this.w.list.forEach((p) => {
      let g = false;
      if (this.focusSet) g = !this.focusSet.has(p);
      if (!g && this.xrayOn && p.group === 'case' && !(this.focusSet && this.focusSet.has(p))) g = true;
      if (keepCase && p.group === 'case') g = false;
      this._meshesOf(p).forEach((m) => this._setGhost(m, g));
    });
  }
  xray(on) { this.xrayOn = on; this.apply(); }
  clear() { this.focusSet = null; this.apply(); }
}
