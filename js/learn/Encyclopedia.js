// =============================================================
//  Encyclopedia — every part type with role, analogy, material,
//  live data and connections. Tap a part in 3D to open its card.
// =============================================================
import * as THREE from 'three';
import { t } from '../core/i18n.js';
import { MOVEMENT as M } from '../config.js';
import { richText } from './Glossary.js';
import { STUDY } from '../demo/Director.js';

const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };
export const GROUPS = ['energy', 'regulating', 'display', 'auto', 'keyless', 'frame', 'jewel', 'case'];

// type → teeth spec (for the data row) and connected types
const SPEC = {
  barrel: M.barrel, centerWheel: M.center, thirdWheel: M.third, cagePinion: M.cagePinion, fixedWheel: M.fixedWheel,
  escapeWheel: { Z: M.escape.Z }, ratchet: M.ratchet, crownWheel: M.crownWheel, reverser: M.reverser, cannon: M.cannon,
  minuteWheel: M.minuteWheel, hourWheel: M.hourWheel, dateDriver: M.dateDriver,
};
const LINKS = {
  crown: ['stem'], stem: ['crown', 'windingPinion', 'slidingPinion', 'settingLever'], windingPinion: ['stem', 'crownWheel', 'slidingPinion'],
  slidingPinion: ['windingPinion', 'yoke', 'minuteWheel'], settingLever: ['stem', 'yoke'], yoke: ['settingLever', 'slidingPinion'],
  crownWheel: ['windingPinion', 'ratchet'], ratchet: ['crownWheel', 'click', 'barrelArbor', 'reverser'], click: ['ratchet', 'clickSpring'], clickSpring: ['click'],
  barrelArbor: ['ratchet', 'mainspring'], mainspring: ['barrelArbor', 'barrel'], barrel: ['mainspring', 'barrelCover', 'centerWheel'], barrelCover: ['barrel'],
  centerWheel: ['barrel', 'thirdWheel', 'cannon'], thirdWheel: ['centerWheel', 'cagePinion'], cagePinion: ['thirdWheel', 'tourbillon'],
  tourbillon: ['cagePinion', 'cageFrame', 'escapeWheel', 'balance', 'fixedWheel', 'cagePointer'], fixedWheel: ['escapeWheel', 'tbBar'], tbBar: ['fixedWheel', 'mainplate'],
  escapeWheel: ['fixedWheel', 'pallet'], pallet: ['escapeWheel', 'palletStone', 'balance'], palletStone: ['pallet', 'escapeWheel'], balance: ['pallet', 'hairspring', 'impulseJewel'],
  impulseJewel: ['balance', 'pallet'], hairspring: ['balance', 'tourbillon'], cageFrame: ['tourbillon', 'holeJewel'], cagePointer: ['tourbillon'],
  cannon: ['centerWheel', 'minuteWheel', 'minuteHand'], minuteWheel: ['cannon', 'hourWheel'], hourWheel: ['minuteWheel', 'hourHand', 'dateDriver'], dateDriver: ['hourWheel', 'dateRing'],
  dateRing: ['dateDriver', 'dial'], dial: ['dateRing', 'hourHand'], hourHand: ['hourWheel'], minuteHand: ['cannon'], prHand: ['barrel'],
  rotor: ['rotorWeight', 'reverser'], rotorWeight: ['rotor'], reverser: ['rotor', 'ratchet'],
  mainplate: ['trainBridge', 'barrelBridge', 'holeJewel'], trainBridge: ['mainplate', 'chaton', 'screw'], barrelBridge: ['mainplate', 'barrel', 'screw'],
  holeJewel: ['capJewel', 'chaton'], capJewel: ['holeJewel'], chaton: ['holeJewel', 'screw'], screw: ['trainBridge', 'barrelBridge'],
  caseMiddle: ['bezel', 'caseback', 'crown', 'gasket'], bezel: ['crystal', 'caseMiddle'], crystal: ['bezel', 'caseback'], caseback: ['crystal', 'caseMiddle', 'screw'], gasket: ['caseMiddle', 'crystal'],
};

export class Encyclopedia {
  constructor(app) { this.app = app; this.filter = 'all'; this.current = null; }
  types() {
    const map = new Map();
    this.app.watch.list.forEach((p) => { if (!map.has(p.type)) map.set(p.type, { type: p.type, group: p.group, parts: [] }); map.get(p.type).parts.push(p); });
    return [...map.values()];
  }
  open() {
    this.current = null;
    const body = h('div', 'ency');
    const chips = h('div', 'chips');
    ['all', ...GROUPS].forEach((g) => {
      const b = h('button', g === this.filter ? 'on' : '', t(g === 'all' ? 'ui.parts.all' : `groups.${g}`));
      b.addEventListener('click', () => { this.filter = g; this.open(); });
      chips.appendChild(b);
    });
    const list = h('div', 'ency-list');
    const types = this.types().filter((x) => this.filter === 'all' || x.group === this.filter);
    types.forEach((x) => {
      const b = h('button', 'ency-item', `<span class="dot g-${x.group}"></span><b>${t(`parts.${x.type}.name`)}</b><small>${t(`parts.${x.type}.en`)}</small>${x.parts.length > 1 ? `<i>×${x.parts.length}</i>` : ''}`);
      b.addEventListener('click', () => this.show(x.type));
      list.appendChild(b);
    });
    body.append(h('p', 'lead', t('ui.parts.lead', { n: this.types().length, m: this.app.watch.list.length })), chips, list);
    this.app.ui.panel.open({ title: t('ui.parts.title'), kicker: t('ui.modes.parts'), body, onClose: () => this.app.highlight.clear() });
    this.app.highlight.clear();
  }
  /** card for a part type (or an instance from 3D picking) */
  show(type, inst) {
    const a = this.app;
    this.current = type;
    const x = this.types().find((y) => y.type === type);
    if (!x) return;
    const k = `parts.${type}`;
    const body = h('div', 'part-card');
    const spec = SPEC[type];
    const per = a.kin.periods();
    const perKey = { tourbillon: 'tourbillon', cagePinion: 'tourbillon', escapeWheel: 'escapeWheel', balance: 'balance', thirdWheel: 'thirdWheel', centerWheel: 'centerWheel', barrel: 'barrel', hourWheel: 'hourWheel', dateDriver: 'dateDriver', cannon: 'centerWheel' }[type];
    const data = [];
    if (spec?.Z) data.push([t('ui.parts.teeth'), `${spec.Z}`]);
    if (spec?.m) data.push([t('ui.parts.module'), `${spec.m} mm`]);
    if (perKey) data.push([t('ui.parts.period'), fmt(per[perKey])]);
    if (x.parts.length > 1) data.push([t('ui.parts.count'), `${x.parts.length}`]);
    body.innerHTML = `
      <div class="pc-head"><span class="dot g-${x.group}"></span><div><h3>${t(`${k}.name`)}</h3><small>${t(`${k}.en`)} · ${t(`groups.${x.group}`)}</small></div></div>
      <h5>${t('ui.parts.role')}</h5><p>${richText(t(`${k}.role`))}</p>
      <div class="analogy"><span>${t('ui.parts.analogy')}</span><p>${richText(t(`${k}.analogy`))}</p></div>
      <div class="pc-grid"><div><small>${t('ui.parts.material')}</small><b>${t(`${k}.material`)}</b></div>${data.map(([l, v]) => `<div><small>${l}</small><b>${v}</b></div>`).join('')}</div>
      <h5>${t('ui.parts.links')}</h5><div class="links"></div>`;
    const links = body.querySelector('.links');
    (LINKS[type] || []).forEach((lt) => {
      if (!this.types().some((y) => y.type === lt)) return;
      const b = h('button', 'chip', t(`parts.${lt}.name`));
      b.addEventListener('click', () => this.show(lt));
      links.appendChild(b);
    });
    const back = h('button', 'ghost-btn', t('ui.parts.back'));
    back.addEventListener('click', () => this.open());
    a.ui.panel.open({ title: t(`${k}.name`), kicker: t('ui.parts.title'), body, foot: back, onClose: () => a.highlight.clear() });
    a.glossary.bind(body);
    a.highlight.focus(inst ? [inst] : x.parts);
    // frame the part
    const target = (inst || x.parts[0]).worldCentre(new THREE.Vector3());
    const cam = a.stage.camera.position.clone();
    const dir = cam.clone().sub(target).normalize();
    const dist = a.director.narrow ? 95 : 70;
    a.rig.flyTo(target.clone().addScaledVector(dir, dist), target, 1.4);
  }
}
function fmt(s) {
  if (s < 1) return `${s.toFixed(2)} ${t('widgets.unit.s')}`;
  if (s < 120) return `${s.toFixed(0)} ${t('widgets.unit.s')}`;
  if (s < 7200) return `${(s / 60).toFixed(0)} ${t('widgets.unit.min')}`;
  return `${(s / 3600).toFixed(0)} ${t('widgets.unit.h')}`;
}
export { STUDY };
