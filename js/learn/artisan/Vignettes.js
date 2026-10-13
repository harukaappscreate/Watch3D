// =============================================================
//  Vignettes — small procedural "workbench" scenes for the artisan
//  tours. Each returns a cleanup function; most hide the watch head
//  and stage their own objects at the study position.
// =============================================================
import * as THREE from 'three';
import * as SM from '../../geometry/Small.js';
import { toothOutline } from '../../geometry/GearGeometry.js';
import { softSprite } from '../../materials/ProceduralTextures.js';
import { Timeline } from '../../core/Timeline.js';

const TAU = Math.PI * 2;
const lathe = (pts, seg = 48, phiLen = TAU) => { const g = new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg, 0, phiLen); g.computeVertexNormals(); return g; };

function stage(ctx, { hideHead = true } = {}) {
  const a = ctx.app;
  const g = new THREE.Group();
  g.position.copy(ctx.STUDY.pos);
  a.stage.scene.add(g);
  if (hideHead) a.watch.head.visible = false;
  // small dark work surface
  const bench = new THREE.Mesh(new THREE.CylinderGeometry(34, 34, 1.2, 64), new THREE.MeshPhysicalMaterial({ color: 0x15161a, roughness: 0.5, metalness: 0.1, clearcoat: 0.4 }));
  bench.position.y = -16; bench.receiveShadow = true;
  g.add(bench);
  const lamp = new THREE.PointLight(0xfff0dc, 1.6, 0, 0); lamp.position.set(18, 30, 26); g.add(lamp);
  const fill = new THREE.PointLight(0x9fb8ff, 0.5, 0, 0); fill.position.set(-30, 10, -10); g.add(fill);
  const objs = [];
  const add = (o) => { g.add(o); objs.push(o); return o; };
  const cleanup = (extra) => () => {
    extra?.();
    a.stage.scene.remove(g);
    g.traverse((o) => { o.geometry?.dispose?.(); });
    a.watch.head.visible = true;
    a.labels.hide();
  };
  return { g, add, cleanup, a };
}
const label = (obj, title, sub) => ({ part: { worldCentre: (v) => obj.getWorldPosition(v) }, title, sub });

// ---------------------------------------------------------------
// Jewel maker
// ---------------------------------------------------------------
/** flame-fusion: alumina powder falls through a flame and grows a boule */
export function vBoule(ctx) {
  const { g, add, cleanup, a } = stage(ctx);
  const M = a.mats;
  const nozzle = add(new THREE.Mesh(new THREE.CylinderGeometry(2.4, 3.6, 10, 32), M.get('steelDark')));
  nozzle.position.y = 21.5;
  // flame (additive)
  const flameMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uT: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform float uT; varying vec2 vUv;
      void main(){ float f = 1.0 - vUv.y; float flick = 0.8 + 0.2 * sin(uT * 30.0 + vUv.y * 20.0);
        vec3 c = mix(vec3(0.3,0.5,1.0), vec3(1.0,0.75,0.4), vUv.y) * f * flick * smoothstep(0.0, 0.35, vUv.y); gl_FragColor = vec4(c * 0.55, 1.0); }`,
  });
  const flame = add(new THREE.Mesh(new THREE.ConeGeometry(2.4, 11, 32, 1, true), flameMat));
  flame.rotation.x = Math.PI; flame.position.y = 11.5;
  // pedestal rod + boule
  const rod = add(new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 14, 16), M.get('steel')));
  rod.position.y = -9;
  const boule = add(new THREE.Mesh(new THREE.BufferGeometry(), M.get('ruby')));
  boule.position.y = -2;
  const shape = (k) => {
    const pts = [];
    for (let i = 0; i <= 24; i++) {
      const u = i / 24;
      const r = (0.8 + 4.4 * Math.sin(Math.min(1, u * 1.15) * Math.PI * 0.62)) * (u > 0.9 ? Math.sqrt((1 - u) / 0.1) : 1);
      pts.push([Math.max(0.01, r * (0.35 + 0.65 * k)), u * 9 * k]);
    }
    return lathe(pts, 48);
  };
  // falling powder
  const N = 220, pg = new THREE.BufferGeometry(), pp = new Float32Array(N * 3), sp = new Float32Array(N);
  for (let i = 0; i < N; i++) { sp[i] = Math.random(); }
  pg.setAttribute('position', new THREE.BufferAttribute(pp, 3));
  const powder = add(new THREE.Points(pg, new THREE.PointsMaterial({ size: 0.5, map: softSprite(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xfff4e0 })));
  const state = ctx.scene?.state;
  let k = 0.05, t = 0, lastK = -1;
  ctx.onUpdate((dt) => {
    t += dt; k = Math.min(1, k + dt * 0.045);
    flameMat.uniforms.uT.value = t;
    if (k - lastK > 0.02) { boule.geometry.dispose(); boule.geometry = shape(k); lastK = k; }
    const top = -2 + 9 * k;
    for (let i = 0; i < N; i++) {
      const f = (sp[i] + t * 0.35) % 1;
      const y = 20 - f * (20 - top);
      pp[i * 3] = Math.sin(i * 7.1) * 1.6 * (1 - f); pp[i * 3 + 1] = y; pp[i * 3 + 2] = Math.cos(i * 3.3) * 1.6 * (1 - f);
    }
    pg.attributes.position.needsUpdate = true;
    rod.rotation.y += dt * 0.6; boule.rotation.y += dt * 0.6;
    if (state) { state.label = 'widgets.state.growth'; state.value = `${(k * 100).toFixed(0)} %  ·  ~2050 °C`; }
  });
  a.labels.show([label(flame, ctx.t('vignette.flame'), '~2050 °C'), label(boule, ctx.t('vignette.boule'), 'Al₂O₃ + Cr'), label(nozzle, ctx.t('vignette.powder'), '')]);
  return cleanup();
}

/** slicing the boule into wafers, then drilling & shaping a jewel */
export function vSlice(ctx) {
  const { g, add, cleanup, a } = stage(ctx);
  const ruby = a.mats.get('ruby');
  const rod = add(new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 18, 48), ruby));
  rod.rotation.z = Math.PI / 2; rod.position.set(-10, 0, 0);
  const saw = add(new THREE.Mesh(new THREE.CylinderGeometry(9, 9, 0.25, 64), a.mats.get('steel')));
  saw.rotation.x = Math.PI / 2; saw.position.set(0, 12, 0);
  const wafers = [];
  for (let i = 0; i < 6; i++) {
    const w = add(new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 0.6, 48), ruby));
    w.rotation.z = Math.PI / 2; w.visible = false; wafers.push(w);
  }
  const drill = add(new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 10, 8), a.mats.get('steel')));
  drill.visible = false;
  const jewel = add(new THREE.Mesh(SM.jewelGeometry(3, 1.4, 0.4), ruby));
  jewel.visible = false; jewel.rotation.x = Math.PI / 2; jewel.position.set(14, -2, 0);
  let t = 0;
  const state = ctx.scene?.state;
  ctx.onUpdate((dt) => {
    t += dt;
    saw.rotation.y += dt * 30;
    const cyc = t % 2.2, n = Math.min(6, Math.floor(t / 2.2));
    saw.position.y = cyc < 1.4 ? 12 - (cyc / 1.4) * 12 : (cyc - 1.4) / 0.8 * 12;
    wafers.forEach((w, i) => { w.visible = i < n; w.position.set(4 + i * 1.6, -9 + 0.0, 0); w.rotation.z = Math.PI / 2 + (i < n ? 0.3 : 0); });
    rod.scale.y = Math.max(0.35, 1 - n * 0.1); rod.position.x = -10 - (1 - rod.scale.y) * 9;
    if (n >= 3) {
      drill.visible = true; jewel.visible = true;
      const d = (t * 0.8) % 1;
      drill.position.set(14, 6 - Math.sin(d * Math.PI) * 4, 0);
      jewel.rotation.z += dt * 0.5;
    }
    if (state) { state.label = 'widgets.state.cut'; state.value = `${n} / 6`; }
  });
  a.labels.show([label(rod, ctx.t('vignette.rod'), ''), label(saw, ctx.t('vignette.saw'), ''), label(jewel, ctx.t('vignette.drilled'), 'Ø 0.07–0.2 mm')]);
  return cleanup();
}

/** cut-away models of the jewel family */
export function vJewelShapes(ctx) {
  const { g, add, cleanup, a } = stage(ctx);
  const ruby = a.mats.get('ruby');
  const items = [];
  const mk = (geo, x, key, sub) => { const m = add(new THREE.Mesh(geo, ruby)); m.position.set(x, 0, 0); m.rotation.x = -0.9; items.push(label(m, ctx.t(key), sub)); return m; };
  const half = Math.PI;
  mk(lathe([[0.5, -1], [4, -1], [4, 1], [0.5, 1]], 48, half), -15, 'vignette.flat', '');
  mk(lathe([[0.5, -1], [4, -1], [4, 0.2], [3, 1.2], [1.2, 1.4], [0.5, 0.4]], 48, half), -7.5, 'vignette.olive', '');
  mk(lathe([[0.01, -0.6], [3.4, -0.6], [3.4, 0.6], [0.01, 0.6]], 48, half), 0, 'vignette.cap', '');
  const ps = mk(new THREE.BoxGeometry(2.4, 7, 2), 7.5, 'vignette.palletStone', '');
  ps.rotation.z = 0.4;
  mk(new THREE.CylinderGeometry(0.9, 0.9, 7, 24, 1, false, 0, Math.PI * 1.4), 15, 'vignette.impulsePin', '');
  ctx.onUpdate((dt) => g.children.forEach((c) => { if (c.isMesh && c.material === ruby) c.rotation.y += dt * 0.25; }));
  a.labels.show(items);
  return cleanup();
}

/** oil held in the jewel's oil sink by capillarity */
export function vOil(ctx) {
  const { g, add, cleanup, a } = stage(ctx);
  const ruby = a.mats.get('ruby');
  const j = add(new THREE.Mesh(lathe([[1.0, -2], [9, -2], [9, 0.5], [7, 2.6], [3, 3.2], [1.6, 2.2], [1.0, 0.4]], 64, Math.PI * 1.5), ruby));
  j.rotation.x = Math.PI / 2;
  const cap = add(new THREE.Mesh(lathe([[0.01, -0.8], [8, -0.8], [8, 0.8], [0.01, 0.8]], 64, Math.PI * 1.5), ruby));
  cap.rotation.x = Math.PI / 2; cap.position.z = -4.6;
  const pivot = add(new THREE.Mesh(lathe([[0.01, 10], [0.9, 9.6], [0.9, 2.2], [2.6, 0.6], [2.6, -6]], 32), a.mats.get('steel')));
  pivot.rotation.x = -Math.PI / 2; pivot.position.z = 7;
  const oil = add(new THREE.Mesh(new THREE.SphereGeometry(2.4, 32, 16), new THREE.MeshPhysicalMaterial({ color: 0x9fd8ff, transmission: 0.6, roughness: 0.05, transparent: true, opacity: 0.55, ior: 1.45 })));
  oil.scale.set(1, 1, 0.5); oil.position.z = 1.9;
  let t = 0;
  ctx.onUpdate((dt) => { t += dt; pivot.rotation.y += dt * 6; oil.scale.setScalar(0.8 + 0.04 * Math.sin(t * 2)); oil.scale.z = 0.45; });
  g.rotation.set(0.5, -0.6, 0);
  a.labels.show([label(oil, ctx.t('vignette.oil'), ''), label(pivot, ctx.t('vignette.pivot'), ''), label(cap, ctx.t('vignette.capStone'), '')]);
  return cleanup();
}

/** press-fitting a jewel into the plate (interference fit) */
export function vPress(ctx) {
  const { g, add, cleanup, a } = stage(ctx);
  const plate = add(new THREE.Mesh(new THREE.BoxGeometry(30, 4, 18), a.mats.get('plate')));
  plate.position.y = -6;
  const hole = add(new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 4.2, 32), new THREE.MeshStandardMaterial({ color: 0x050505 })));
  hole.position.y = -6;
  const jewel = add(new THREE.Mesh(SM.jewelGeometry(2.7, 1.6, 0.5), a.mats.get('ruby')));
  jewel.rotation.x = -Math.PI / 2;
  const pusher = add(new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 14, 24), a.mats.get('steel')));
  const state = ctx.scene?.state;
  let t = 0;
  ctx.onUpdate((dt) => {
    t += dt; const c = (t % 5) / 5;
    const y = c < 0.6 ? 12 - (c / 0.6) * 16.6 : -4.6;
    jewel.position.y = Math.max(-4.6, y);
    pusher.position.y = jewel.position.y + 8.5 + (c > 0.75 ? (c - 0.75) * 40 : 0);
    if (state) { state.label = 'widgets.state.fit'; state.value = c > 0.6 ? '0.005–0.010 mm' : '—'; }
  });
  a.labels.show([label(jewel, ctx.t('vignette.jewel'), ''), label(plate, ctx.t('vignette.plate'), ''), label(pusher, ctx.t('vignette.pusher'), '')]);
  return cleanup();
}

/** shock protection: a spring holds the cap jewel and returns the staff */
export function vShock(ctx) {
  const { g, add, cleanup, a } = stage(ctx);
  const ruby = a.mats.get('ruby');
  const setting = add(new THREE.Mesh(lathe([[3, -2], [9, -2], [9, 2], [3, 2]], 64), a.mats.get('steel')));
  const jewel = add(new THREE.Mesh(SM.jewelGeometry(3.2, 1.5, 0.4), ruby));
  jewel.rotation.x = -Math.PI / 2;
  const cap = add(new THREE.Mesh(SM.capJewelGeometry(3.2, 0.8), ruby));
  cap.rotation.x = -Math.PI / 2; cap.position.y = 1.6;
  const springShape = new THREE.TorusGeometry(5.2, 0.35, 8, 64, Math.PI * 1.6);
  const spring = add(new THREE.Mesh(springShape, a.mats.get('steel')));
  spring.rotation.x = Math.PI / 2; spring.position.y = 2.6;
  const staff = add(new THREE.Mesh(lathe([[0.01, 0], [0.4, 0.3], [0.4, 2], [1.5, 3], [1.5, 12]], 24), a.mats.get('steel')));
  staff.rotation.x = Math.PI; staff.position.y = 0.4;
  let t = 0;
  ctx.onUpdate((dt) => {
    t += dt; const c = (t % 3);
    const jolt = c < 0.25 ? Math.sin((c / 0.25) * Math.PI) : 0;
    const back = c >= 0.25 ? Math.exp(-(c - 0.25) * 6) * Math.cos((c - 0.25) * 30) * 0.3 : 0;
    const d = jolt + back;
    staff.position.y = 0.4 + d * 1.4; jewel.position.y = d * 1.4; cap.position.y = 1.6 + d * 1.4;
    spring.scale.set(1, 1, 1 + d * 0.8); spring.position.y = 2.6 + d * 0.9;
    staff.rotation.y += dt * 8;
  });
  g.rotation.set(0.35, 0.5, 0);
  a.labels.show([label(spring, ctx.t('vignette.spring'), ''), label(cap, ctx.t('vignette.capStone'), ''), label(staff, ctx.t('vignette.staff'), '')]);
  return cleanup();
}

// ---------------------------------------------------------------
// Finisher
// ---------------------------------------------------------------
/** stripes / perlage being applied to a sample plate (reveal by clipping) */
export function vFinish(ctx, kind = 'cotes') {
  const { g, add, cleanup, a } = stage(ctx);
  const base = new THREE.MeshPhysicalMaterial({ color: 0xc9ccd1, metalness: 1, roughness: 0.48 });
  const fin = (kind === 'cotes' ? a.mats.get('bridge') : a.mats.get('plate')).clone();
  const plane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0);
  fin.clippingPlanes = [plane];
  a.stage.renderer.localClippingEnabled = true;
  const geo = new THREE.BoxGeometry(34, 18, 2.4);
  // box UVs → mm so the finishing textures keep their real scale
  const uv = geo.attributes.uv, pos = geo.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i), pos.getY(i));
  const p0 = add(new THREE.Mesh(geo, base));
  const p1 = add(new THREE.Mesh(geo, fin)); p1.position.z = 0.01;
  g.rotation.x = -0.55;
  const tool = add(new THREE.Mesh(kind === 'cotes' ? new THREE.CylinderGeometry(4, 4, 3, 32) : new THREE.CylinderGeometry(0.8, 0.8, 9, 16), a.mats.get(kind === 'cotes' ? 'gasket' : 'steel')));
  tool.rotation.x = Math.PI / 2;
  let t = 0;
  const state = ctx.scene?.state;
  ctx.onUpdate((dt) => {
    t += dt;
    const k = Math.min(1, (t % 9) / 7.5);
    const x = -17 + 34 * k;
    g.updateMatrixWorld();
    const wp = new THREE.Vector3(x, 0, 0).applyMatrix4(g.matrixWorld);
    const n = new THREE.Vector3(-1, 0, 0).transformDirection(g.matrixWorld);
    plane.setFromNormalAndCoplanarPoint(n, wp);
    tool.position.set(x, kind === 'cotes' ? 0 : Math.sin(t * 9) * 7, 4.5);
    tool.rotation.y += dt * 20;
    if (state) { state.label = 'widgets.state.progress'; state.value = `${Math.round(k * 100)} %`; }
  });
  a.labels.show([label(p1, ctx.t(kind === 'cotes' ? 'vignette.cotes' : 'vignette.perlage'), ''), label(tool, ctx.t(kind === 'cotes' ? 'vignette.cotesTool' : 'vignette.perlageTool'), '')]);
  return cleanup(() => { a.stage.renderer.localClippingEnabled = a.explore.flags.section; fin.dispose(); base.dispose(); });
}

/** heat bluing: straw → brown → purple → blue around 290 °C */
export function vBluing(ctx) {
  const { g, add, cleanup, a } = stage(ctx);
  const tray = add(new THREE.Mesh(new THREE.CylinderGeometry(16, 16, 2, 64), a.mats.get('brass')));
  tray.position.y = -3;
  const mat = new THREE.MeshPhysicalMaterial({ color: 0xd9dde2, metalness: 1, roughness: 0.18, iridescence: 0.4 });
  const screws = [];
  for (let i = 0; i < 7; i++) {
    const s = add(new THREE.Mesh(SM.screwHeadGeometry(2.2, 1.4), mat));
    s.rotation.x = -Math.PI / 2;
    const a2 = (i / 7) * TAU;
    s.position.set(i === 0 ? 0 : Math.cos(a2) * 8, -2, i === 0 ? 0 : Math.sin(a2) * 8);
    screws.push(s);
  }
  const glow = add(new THREE.PointLight(0xff6a2a, 0, 0, 0)); glow.position.set(0, -6, 0);
  const stops = [[20, 0xd9dde2], [220, 0xe2cf8c], [250, 0xb9874a], [270, 0x7a3f6e], [290, 0x2446b8], [310, 0x2d7fd6]];
  const col = (T) => {
    for (let i = 0; i < stops.length - 1; i++) {
      const [t0, c0] = stops[i], [t1, c1] = stops[i + 1];
      if (T <= t1) return new THREE.Color(c0).lerp(new THREE.Color(c1), (T - t0) / (t1 - t0));
    }
    return new THREE.Color(stops[stops.length - 1][1]);
  };
  let t = 0;
  const state = ctx.scene?.state;
  ctx.onUpdate((dt) => {
    t += dt;
    const T = Math.min(300, 20 + (t % 14) * 26);
    const c = col(T);
    mat.color.copy(c);
    glow.intensity = Math.max(0, (T - 150) / 150) * 0.8;
    if (state) { state.label = 'widgets.state.temp'; state.value = `${Math.round(T)} °C`; state.color = '#' + c.getHexString(); }
  });
  a.labels.show([label(screws[0], ctx.t('vignette.screws'), ''), label(tray, ctx.t('vignette.tray'), '')]);
  return cleanup(() => mat.dispose());
}

/** black polish vs satin: one sweeping light shows the difference */
export function vPolish(ctx) {
  const { g, add, cleanup, a } = stage(ctx);
  const satin = add(new THREE.Mesh(new THREE.BoxGeometry(14, 2, 14), new THREE.MeshPhysicalMaterial({ color: 0xd2d5da, metalness: 1, roughness: 0.42 })));
  satin.position.x = -9;
  const black = add(new THREE.Mesh(new THREE.BoxGeometry(14, 2, 14), new THREE.MeshPhysicalMaterial({ color: 0xd2d5da, metalness: 1, roughness: 0.01 })));
  black.position.x = 9;
  const spot = add(new THREE.SpotLight(0xffffff, 4, 0, 0.1, 0.3, 0));
  spot.position.set(0, 40, 30); spot.target = black;
  let t = 0;
  ctx.onUpdate((dt) => { t += dt; spot.position.x = Math.sin(t * 0.6) * 30; g.rotation.y = Math.sin(t * 0.3) * 0.4; });
  g.rotation.x = 0.3;
  a.labels.show([label(satin, ctx.t('vignette.satin'), ''), label(black, ctx.t('vignette.blackPolish'), '')]);
  return cleanup();
}

/** a light sweep along the bridges' polished bevels (uses the real watch) */
export function vSweep(ctx) {
  const a = ctx.app;
  const light = new THREE.SpotLight(0xffffff, 0, 0, 0.12, 0.5, 0);
  a.stage.scene.add(light, light.target);
  light.target.position.copy(ctx.STUDY.pos);
  let t = 0;
  ctx.onUpdate((dt) => { t += dt; light.intensity = 6; light.position.set(ctx.STUDY.pos.x + Math.sin(t * 0.7) * 120, ctx.STUDY.pos.y + 60, ctx.STUDY.pos.z - 90); });
  return () => a.stage.scene.remove(light, light.target);
}

// ---------------------------------------------------------------
// Wheel cutter
// ---------------------------------------------------------------
/** cycloidal (watch) vs involute (machine) tooth form, magnified */
export function vProfile(ctx) {
  const { g, add, cleanup, a } = stage(ctx);
  const mk = (Z, m, color) => {
    const { pts } = toothOutline(Z, m, { tipSeg: 8 });
    const geo = new THREE.BufferGeometry().setFromPoints([...pts, pts[0]].map((p) => new THREE.Vector3(p.x, p.y, 0)));
    return new THREE.Line(geo, new THREE.LineBasicMaterial({ color }));
  };
  const wheel = add(mk(30, 1.0, 0xe2b66a));
  const pin = add(mk(8, 1.0, 0xcfd6e0));
  pin.position.x = 15 + 4;
  // involute comparison (thin, faded)
  const inv = [];
  const Z = 30, m = 1, rb = (m * Z / 2) * Math.cos(20 * Math.PI / 180);
  for (let i = 0; i < Z; i++) {
    const a0 = (i / Z) * TAU;
    for (let k = 0; k <= 12; k++) { const tt = k / 12 * 0.55; const x = rb * (Math.cos(tt) + tt * Math.sin(tt)), y = rb * (Math.sin(tt) - tt * Math.cos(tt)); const c = Math.cos(a0), s = Math.sin(a0); inv.push(new THREE.Vector3(x * c - y * s, x * s + y * c, -0.5)); }
  }
  const invPts = new THREE.Points(new THREE.BufferGeometry().setFromPoints(inv), new THREE.PointsMaterial({ color: 0x7fb0ff, size: 0.35 }));
  invPts.visible = false;
  add(invPts);
  const state = ctx.scene;
  if (state) {
    state.toggles = [
      { key: 'vignette.cycloid', on: true, set: () => { invPts.visible = false; } },
      { key: 'vignette.involute', on: false, set: () => { invPts.visible = true; } },
    ];
  }
  let t = 0;
  ctx.onUpdate((dt) => { t += dt; wheel.rotation.z = -t * 0.1; pin.rotation.z = t * 0.1 * (30 / 8) + Math.PI / 8; });
  g.position.x -= 4;
  a.labels.show([label(wheel, ctx.t('vignette.wheel'), '30T'), label(pin, ctx.t('vignette.pinion'), '8T')]);
  return cleanup();
}

/** cutting teeth one by one with a fly cutter (the blank is indexed one pitch per cut) */
export function vCutting(ctx) {
  const { g, add, cleanup, a } = stage(ctx);
  const Z = 40, pitch = TAU / Z;
  const wheelG = new THREE.Group(); g.add(wheelG);
  const blank = new THREE.Mesh(new THREE.CylinderGeometry(12, 12, 1.4, 96), a.mats.get('gilt'));
  blank.rotation.x = Math.PI / 2; wheelG.add(blank);
  const cutter = add(new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 0.8, 6), a.mats.get('steel')));
  const markGeo = new THREE.BoxGeometry(0.9, 2.4, 1.6);
  const dark = new THREE.MeshStandardMaterial({ color: 0x0a0a0a });
  let t = 0, cut = 0, lastCut = -1;
  const state = ctx.scene?.state;
  ctx.onUpdate((dt) => {
    t += dt;
    const cyc = Math.floor(t / 0.7), c = (t % 0.7) / 0.7;
    cutter.position.set(14.2 - Math.sin(c * Math.PI) * 2.6, 0, 0);
    cutter.rotation.y += dt * 40;
    if (cyc !== lastCut && cut < Z) {
      lastCut = cyc;
      const m = new THREE.Mesh(markGeo, dark);
      const ang = -wheelG.rotation.z; // local angle currently facing the cutter
      m.position.set(Math.cos(ang) * 11.5, Math.sin(ang) * 11.5, 0); m.rotation.z = ang + Math.PI / 2;
      wheelG.add(m); cut++;
    }
    // index plate: step the blank by one pitch between cuts
    const target = cut * pitch;
    wheelG.rotation.z += (target - wheelG.rotation.z) * Math.min(1, dt * 10);
    if (cut >= Z && t > Z * 0.7 + 2) { wheelG.children.slice(1).forEach((m) => wheelG.remove(m)); cut = 0; wheelG.rotation.z = 0; t = 0; lastCut = -1; }
    if (state) { state.label = 'widgets.state.teeth'; state.value = `${cut} / ${Z}`; }
  });
  a.labels.show([label(cutter, ctx.t('vignette.flyCutter'), ''), label(blank, ctx.t('vignette.blank'), '')]);
  return cleanup(() => { markGeo.dispose(); dark.dispose(); });
}

/** pivot burnishing on a jacot tool */
export function vPivot(ctx) {
  const { g, add, cleanup, a } = stage(ctx);
  const arbor = add(new THREE.Mesh(lathe([[0.01, -16], [0.6, -15.5], [0.6, -11], [1.6, -10], [1.6, 10], [0.6, 11], [0.6, 15.5], [0.01, 16]], 32), a.mats.get('steel')));
  arbor.rotation.z = Math.PI / 2;
  const jacot = add(new THREE.Mesh(new THREE.BoxGeometry(8, 3, 6), a.mats.get('brass')));
  jacot.position.set(14, -2.4, 0);
  const burnisher = add(new THREE.Mesh(new THREE.BoxGeometry(18, 0.8, 2), a.mats.get('steelDark')));
  let t = 0;
  ctx.onUpdate((dt) => { t += dt; arbor.rotation.x += dt * 25; burnisher.position.set(13 + Math.sin(t * 4) * 3, 1.2, Math.cos(t * 4) * 0.5); });
  a.labels.show([label(arbor, ctx.t('vignette.arbor'), ''), label(burnisher, ctx.t('vignette.burnisher'), '')]);
  return cleanup();
}

// ---------------------------------------------------------------
// Assembler (uses the real watch)
// ---------------------------------------------------------------
/** glowing oil markers on lubrication points */
export function vOiling(ctx) {
  const a = ctx.app;
  const cols = { o1: 0x7fd3ff, o2: 0xffd36b, o3: 0xc38bff, o4: 0x7dffb0 };
  const spots = [
    ['jw_train_c', 'o1'], ['jw_train_3', 'o1'], ['jw_train_t', 'o1'], ['jw_bal_up', 'o1'], ['jw_bal_low', 'o1'],
    ['jw_esc_up', 'o1'], ['jw_esc_low', 'o1'], ['jw_pal_in', 'o3'], ['jw_pal_out', 'o3'],
    ['barrelArbor', 'o2'], ['ratchet', 'o2'], ['crownWheel', 'o2'], ['stem', 'o4'], ['slidingPinion', 'o4'], ['revA', 'o2'],
  ];
  const group = new THREE.Group(); a.stage.scene.add(group);
  const geo = new THREE.SphereGeometry(0.6, 16, 8);
  const ms = spots.map(([id, o]) => {
    const p = a.watch.get(id); if (!p) return null;
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: cols[o], transparent: true, opacity: 0.9, depthTest: false }));
    m.renderOrder = 30; group.add(m); return { m, p };
  }).filter(Boolean);
  let t = 0;
  ctx.onUpdate((dt) => { t += dt; ms.forEach(({ m, p }, i) => { p.worldCentre(m.position); m.scale.setScalar(0.8 + 0.3 * Math.sin(t * 3 + i)); }); });
  return () => { a.stage.scene.remove(group); geo.dispose(); };
}

/** endshake: the wheel has a tiny axial play between its jewels (exaggerated) */
export function vEndshake(ctx, id = 'thirdWheel') {
  const a = ctx.app;
  const p = a.watch.get(id);
  let t = 0;
  ctx.onUpdate((dt) => { t += dt; p.explode.position.z = Math.sin(t * 2.4) * 0.35; });
  return () => { p.explode.position.z = 0; };
}

/** poising the tourbillon cage: it must rest in any position */
export function vPoise(ctx) {
  const a = ctx.app;
  const cage = a.watch.get('tourbillon');
  const state = ctx.scene?.state;
  let t = 0;
  ctx.onUpdate((dt) => {
    t += dt;
    const k = Math.min(1, t / 8);
    const wobble = (1 - k) * Math.sin(t * 1.6) * 0.8;
    cage.explode.rotation.z = wobble;
    if (state) { state.label = 'widgets.state.poise'; state.value = `${((1 - k) * 12).toFixed(1)} µg·cm`; }
  });
  return () => { cage.explode.rotation.z = 0; };
}

// ---------------------------------------------------------------
// Case & dial
// ---------------------------------------------------------------
/** rose-engine guilloché being engraved line by line on a dial blank */
export function vRoseEngine(ctx) {
  const { g, add, cleanup, a } = stage(ctx);
  const size = 512, cv = document.createElement('canvas'); cv.width = cv.height = size;
  const c2 = cv.getContext('2d');
  c2.fillStyle = '#c9ccd1'; c2.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.MeshPhysicalMaterial({ map: tex, metalness: 0.8, roughness: 0.3 });
  const disc = add(new THREE.Mesh(new THREE.CylinderGeometry(13, 13, 0.8, 128), [a.mats.get('steel'), mat, a.mats.get('steel')]));
  disc.rotation.x = Math.PI / 2;
  const tool = add(new THREE.Mesh(new THREE.ConeGeometry(0.6, 6, 12), a.mats.get('steelDark')));
  tool.rotation.x = -Math.PI / 2;
  let ring = 0, t = 1.5; // start with a few lines already engraved
  const state = ctx.scene?.state;
  ctx.onUpdate((dt) => {
    t += dt;
    const per = 0.16;
    while (t > per && ring < 60) {
      t -= per;
      const r0 = 6 + ring * 3.6;
      c2.strokeStyle = ring % 2 ? 'rgba(30,36,52,.85)' : 'rgba(255,255,255,.8)';
      c2.lineWidth = 2.6;
      c2.beginPath();
      for (let k = 0; k <= 360; k++) {
        const ang = (k / 360) * TAU;
        const r = r0 + Math.sin(ang * 18) * 2.2 + Math.sin(ang * 6) * 1;
        const x = size / 2 + Math.cos(ang) * r, y = size / 2 + Math.sin(ang) * r;
        k ? c2.lineTo(x, y) : c2.moveTo(x, y);
      }
      c2.stroke();
      tex.needsUpdate = true;
      ring++;
    }
    const r = (6 + ring * 3.6) / size * 30;
    tool.position.set(Math.cos(t * 6) * r * 0.5, Math.sin(t * 6) * r * 0.5, 3.6);
    if (state) { state.label = 'widgets.state.rings'; state.value = `${ring} / 60`; }
  });
  g.rotation.x = -0.4;
  a.labels.show([label(disc, ctx.t('vignette.dialBlank'), ''), label(tool, ctx.t('vignette.graver'), '')]);
  return cleanup(() => { tex.dispose(); mat.dispose(); });
}

/** applied indices dropping into their holes on the dial */
export function vIndices(ctx) {
  const a = ctx.app;
  const dial = a.watch.get('dial');
  const kids = dial.motion.children.filter((m) => m.userData.index);
  const base = kids.map((m) => m.position.z);
  let t = 0;
  ctx.onUpdate((dt) => {
    t += dt;
    kids.forEach((m, i) => { const k = Math.min(1, Math.max(0, (t - i * 0.25) / 0.6)); m.position.z = base[i] + (1 - Timeline_ease(k)) * 6; });
    if (t > kids.length * 0.25 + 3) t = 0;
  });
  return () => kids.forEach((m, i) => { m.position.z = base[i]; });
}
const Timeline_ease = (k) => 1 + 2.4 * Math.pow(k - 1, 3) + 1.4 * Math.pow(k - 1, 2);

/** AR coating toggle on the crystal */
export function vAR(ctx) {
  const a = ctx.app, m = a.mats.get('sapphire');
  const save = { op: m.opacity, irr: m.iridescence, env: m.envMapIntensity };
  const sc = ctx.scene;
  if (sc) sc.toggles = [
    { key: 'vignette.arOn', on: true, set: () => { m.opacity = save.op; m.iridescence = save.irr; m.envMapIntensity = save.env; } },
    { key: 'vignette.arOff', on: false, set: () => { m.opacity = 0.16; m.iridescence = 0; m.envMapIntensity = 2.2; } },
  ];
  return () => { m.opacity = save.op; m.iridescence = save.irr; m.envMapIntensity = save.env; };
}
