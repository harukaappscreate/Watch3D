// =============================================================
//  ProceduralTextures — all surface finishes are painted in code:
//  Côtes de Genève, perlage, guilloché, printing, leather, engraving
// =============================================================
import * as THREE from 'three';
import { BRAND } from '../config.js';

const canvas = (w, h = w) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

function hash(x, y) { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); }
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

/** height (Float32 0..1) → normal-map CanvasTexture */
export function heightToNormal(H, w, h, strength = 2, wrap = true) {
  const c = canvas(w, h), ctx = c.getContext('2d');
  const img = ctx.createImageData(w, h);
  const at = (x, y) => {
    if (wrap) { x = (x + w) % w; y = (y + h) % h; } else { x = Math.max(0, Math.min(w - 1, x)); y = Math.max(0, Math.min(h - 1, y)); }
    return H[y * w + x];
  };
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength;
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength;
      const l = Math.hypot(dx, dy, 1);
      const i = (y * w + x) * 4;
      img.data[i] = ((-dx / l) * 0.5 + 0.5) * 255;
      img.data[i + 1] = ((dy / l) * 0.5 + 0.5) * 255;
      img.data[i + 2] = (1 / l) * 255;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.NoColorSpace;
  return t;
}
function heightToGray(H, w, h, f) {
  const c = canvas(w, h), ctx = c.getContext('2d');
  const img = ctx.createImageData(w, h);
  for (let i = 0; i < w * h; i++) {
    const v = Math.max(0, Math.min(255, f(H[i], i) * 255));
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v; img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.NoColorSpace;
  return t;
}
const wrapRepeat = (t, rx, ry, ox = 0, oy = 0) => {
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.offset.set(ox, oy);
  t.anisotropy = 8; return t;
};

/**
 * Côtes de Genève — parallel arcs ("Geneva waves") over the bridges.
 * Texture spans `span` mm; UVs of bridge caps are in mm.
 */
export function cotesDeGeneve(size = 512, span = 32, stripe = 2.6) {
  const w = size, h = size;
  const H = new Float32Array(w * h);
  const nStripes = span / stripe;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const u = x / w, v = y / h;
      // arcs: stripes slightly curved (cut by a rotating wheel)
      const yy = (v - 0.5) * span;
      const s = u * nStripes + (yy * yy) * 0.006;
      const f = s - Math.floor(s);
      // each stripe: brushed concave band with a crisp boundary
      const ridge = Math.pow(Math.sin(f * Math.PI), 0.35);
      const brush = vnoise(x * 0.9, y * 0.02 + Math.floor(s) * 13) * 0.08;
      H[y * w + x] = ridge * 0.85 + brush;
    }
  }
  const normal = wrapRepeat(heightToNormal(H, w, h, 3.5), 1 / span, 1 / span, 0.5, 0.5);
  const rough = wrapRepeat(heightToGray(H, w, h, (v) => 0.26 + (1 - v) * 0.3), 1 / span, 1 / span, 0.5, 0.5);
  return { normal, rough };
}

/** Perlage — overlapping circular grained spots (on the main plate) */
export function perlage(size = 512, span = 10, d = 1.25) {
  const w = size, h = size;
  const H = new Float32Array(w * h).fill(0.5);
  const R = (d / 2) * (w / span);
  const step = R * 1.25;
  // draw circles in rows; later circles overlap earlier ones (as in real finishing)
  for (let row = -1, yc = -R; yc < h + R; row++, yc += step * 0.9) {
    for (let xc = (row % 2) * step * 0.5 - R; xc < w + R; xc += step) {
      const x0 = Math.floor(xc - R), x1 = Math.ceil(xc + R), y0 = Math.floor(yc - R), y1 = Math.ceil(yc + R);
      const phase = hash(xc, yc) * 6.28;
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
        const dx = x - xc, dy = y - yc, r = Math.hypot(dx, dy);
        if (r > R) continue;
        const rr = r / R;
        const a = Math.atan2(dy, dx);
        // spiral grain + slight dome
        const grain = 0.5 + 0.5 * Math.sin(r * 1.9 + a * 2 + phase);
        const hv = 0.35 + 0.35 * (1 - rr * rr) + grain * 0.22;
        const xx = (x + w) % w, yy = (y + h) % h;
        H[yy * w + xx] = hv;
      }
    }
  }
  const normal = wrapRepeat(heightToNormal(H, w, h, 2.2), 1 / span, 1 / span);
  const rough = wrapRepeat(heightToGray(H, w, h, (v) => 0.36 + v * 0.22), 1 / span, 1 / span);
  return { normal, rough };
}

/** Sunray brushing for the rotor */
export function sunray(size = 512) {
  const w = size, h = size, H = new Float32Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dx = x - w / 2, dy = y - h / 2;
    const a = Math.atan2(dy, dx);
    H[y * w + x] = vnoise(a * 180, Math.hypot(dx, dy) * 0.02) * 0.6;
  }
  return { normal: heightToNormal(H, w, h, 1.0, false), rough: heightToGray(H, w, h, (v) => 0.25 + v * 0.2) };
}

/**
 * Guilloché dial (colour + normal). The dial UV maps -R..R → 0..1.
 * Layout: tourbillon aperture (6h), power-reserve sub-dial (10:30), centre.
 */
export function guillocheDial(size, colors, layout) {
  const w = size, h = size;
  const H = new Float32Array(w * h);
  const R = layout.R;
  const toMM = (p) => (p / w - 0.5) * 2 * R;
  const base = new THREE.Color(colors.base), edge = new THREE.Color(colors.edge);
  const c = canvas(w, h), ctx = c.getContext('2d');
  const img = ctx.createImageData(w, h);
  const pr = layout.pr; // {x,y,r}
  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const x = toMM(px), y = -toMM(py);
      const r = Math.hypot(x, y);
      const a = Math.atan2(y, x);
      let hv;
      const dpr = Math.hypot(x - pr.x, y - pr.y);
      if (dpr < pr.r) {
        // azurage: fine concentric circles
        hv = 0.5 + 0.5 * Math.sin(dpr * 38);
      } else if (r < R * 0.83) {
        // rose-engine wave: concentric ripples modulated by petals
        const petals = Math.sin(a * 18) * 0.35 + Math.sin(a * 6) * 0.15;
        hv = 0.5 + 0.5 * Math.sin(r * 9.5 + petals * 2.2);
        hv = Math.pow(hv, 0.8);
      } else {
        // outer chapter ring: smooth satin
        hv = 0.5 + 0.03 * Math.sin(a * 240);
      }
      H[py * w + px] = hv;
      // colour: dégradé from centre to edge + depth shading
      const k = Math.min(1, Math.pow(r / R, 1.8));
      const col = base.clone().lerp(edge, k);
      const shade = 0.82 + hv * 0.22;
      const i = (py * w + px) * 4;
      img.data[i] = Math.min(255, col.r * shade * 255);
      img.data[i + 1] = Math.min(255, col.g * shade * 255);
      img.data[i + 2] = Math.min(255, col.b * shade * 255);
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const map = new THREE.CanvasTexture(c);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;
  const normal = heightToNormal(H, w, h, 1.4, false);
  return { map, normal };
}

/** Printed dial details on a transparent canvas */
export function dialPrint(size, color, layout, jewelCount) {
  const w = size, c = canvas(w), ctx = c.getContext('2d');
  const R = layout.R;
  const S = w / (2 * R); // px per mm
  ctx.translate(w / 2, w / 2);
  ctx.scale(S, S);
  ctx.fillStyle = color; ctx.strokeStyle = color;
  const serif = '"Hoefler Text","Didot","Bodoni 72","Times New Roman",serif';
  const sans = '"Avenir Next","Helvetica Neue",Helvetica,Arial,sans-serif';
  // minute track
  for (let i = 0; i < 60; i++) {
    if (i >= 14 && i <= 16) continue; // date window
    const a = (i / 60) * Math.PI * 2;
    const r1 = R * 0.965, r0 = i % 5 === 0 ? R * 0.9 : R * 0.935;
    // skip ticks hidden by the date window
    ctx.lineWidth = i % 5 === 0 ? 0.16 : 0.08;
    ctx.beginPath();
    ctx.moveTo(Math.sin(a) * r0, -Math.cos(a) * r0);
    ctx.lineTo(Math.sin(a) * r1, -Math.cos(a) * r1);
    ctx.stroke();
  }
  ctx.lineWidth = 0.05;
  const gap = 0.16; // radians kept clear for the date window (canvas angle 0 = 3 o'clock)
  ctx.beginPath(); ctx.arc(0, 0, R * 0.968, gap, Math.PI * 2 - gap); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, R * 0.895, gap, Math.PI * 2 - gap); ctx.stroke();
  // brand
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `600 1.1px ${serif}`;
  ctx.fillText(layout.brand, 0, -layout.brandY);
  ctx.font = `500 0.55px ${sans}`;
  ctx.fillText('CALIBRE HA-01', 0, -layout.brandY + 1.2);
  // tourbillon label
  const tb = layout.tb;
  ctx.font = `500 0.55px ${sans}`;
  const tcy = -tb.y; // canvas y of the tourbillon centre
  ctx.fillText('TOURBILLON', 0, tcy - tb.r - 1.0);
  ctx.font = `500 0.5px ${sans}`;
  ctx.fillText(`AUTOMATIC · ${jewelCount} JEWELS`, 0, -layout.brandY + 2.05);
  // seconds scale around tourbillon aperture
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2;
    const r0 = tb.r + 0.15, r1 = tb.r + (i % 5 === 0 ? 0.62 : 0.38);
    ctx.lineWidth = i % 15 === 0 ? 0.11 : 0.05;
    ctx.beginPath();
    ctx.moveTo(Math.sin(a) * r0, tcy - Math.cos(a) * r0);
    ctx.lineTo(Math.sin(a) * r1, tcy - Math.cos(a) * r1);
    ctx.stroke();
  }
  // power reserve arc  (0 → 72 h, sweeping 240°)
  const pr = layout.pr;
  ctx.save();
  ctx.translate(pr.x, -pr.y);
  const a0 = layout.prA0, a1 = layout.prA1;
  for (let i = 0; i <= 12; i++) {
    const a = a0 + ((a1 - a0) * i) / 12;
    const r0 = pr.r * 0.72, r1 = pr.r * (i % 4 === 0 ? 0.96 : 0.86);
    ctx.lineWidth = i % 4 === 0 ? 0.12 : 0.06;
    ctx.beginPath();
    ctx.moveTo(Math.sin(a) * r0, -Math.cos(a) * r0);
    ctx.lineTo(Math.sin(a) * r1, -Math.cos(a) * r1);
    ctx.stroke();
    if (i % 4 === 0) {
      ctx.font = `600 0.5px ${sans}`;
      const rl = pr.r * 0.5;
      ctx.fillText(String(i * 6), Math.sin(a) * rl, -Math.cos(a) * rl);
    }
  }
  ctx.font = `600 0.4px ${sans}`;
  ctx.fillText('RESERVE', 0, pr.r * 0.38);
  ctx.restore();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** Date ring printing — 31 numerals around a ring (inner radius ri..ro) */
export function dateRingTexture(size, ro, ri, color = '#111', bg = '#f2efe8') {
  const w = size, c = canvas(w), ctx = c.getContext('2d');
  const S = w / (2 * ro);
  ctx.translate(w / 2, w / 2); ctx.scale(S, S);
  ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(0, 0, ro, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = color;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = '700 0.92px "Avenir Next","Helvetica Neue",Arial,sans-serif';
  const rm = (ro + ri) / 2;
  for (let d = 1; d <= 31; d++) {
    // numbers read upright at 3 o'clock when the ring rotation puts day d there
    const a = ((d - 1) / 31) * Math.PI * 2;
    ctx.save();
    ctx.rotate(-a);
    ctx.translate(rm, 0);
    ctx.fillText(String(d), 0, 0);
    ctx.restore();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Engraved text around a circle (rotor / case back). returns alpha-ish colour map */
export function engravingTexture(size, R, lines, { color = '#2b2b2b', bg = null, font = 0.9 } = {}) {
  const w = size, c = canvas(w), ctx = c.getContext('2d');
  const S = w / (2 * R);
  ctx.translate(w / 2, w / 2); ctx.scale(S, -S);
  if (bg) { ctx.fillStyle = bg; ctx.fillRect(-R, -R, 2 * R, 2 * R); }
  ctx.fillStyle = color;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const L of lines) {
    ctx.font = `600 ${L.size || font}px "Avenir Next","Helvetica Neue",Arial,sans-serif`;
    const chars = [...L.text];
    const span = L.span ?? Math.PI * 0.9;
    const start = L.angle ?? Math.PI / 2;
    chars.forEach((ch, i) => {
      const a = start + span / 2 - (span * (i + 0.5)) / chars.length;
      ctx.save();
      ctx.rotate(a);
      ctx.translate(L.r, 0);
      ctx.rotate(-Math.PI / 2);
      ctx.scale(1, -1);
      ctx.fillText(ch, 0, 0);
      ctx.restore();
    });
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Leather strap: colour (with stitching) + grain normal, mapped u across / v along (mm) */
export function leather(size = 512, tone = '#5a3420', stitch = '#e9dcc4') {
  const w = size, h = size;
  const c = canvas(w, h), ctx = c.getContext('2d');
  ctx.fillStyle = tone; ctx.fillRect(0, 0, w, h);
  const H = new Float32Array(w * h);
  const img = ctx.getImageData(0, 0, w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const n = vnoise(x * 0.08, y * 0.08) * 0.6 + vnoise(x * 0.25, y * 0.25) * 0.4;
    const cell = Math.abs(Math.sin(x * 0.11 + vnoise(x * 0.03, y * 0.03) * 6) * Math.sin(y * 0.13 + vnoise(y * 0.03, x * 0.03) * 6));
    H[y * w + x] = n * 0.7 + cell * 0.3;
    const i = (y * w + x) * 4, k = 0.85 + n * 0.3;
    img.data[i] *= k; img.data[i + 1] *= k; img.data[i + 2] *= k;
  }
  ctx.putImageData(img, 0, 0);
  // stitching rows along both edges (u≈0.08 and 0.92), v repeats every 'h' px
  ctx.strokeStyle = stitch; ctx.lineCap = 'round';
  ctx.lineWidth = w * 0.012;
  for (const ux of [0.085, 0.915]) {
    for (let y = 0; y < h; y += h / 8) {
      ctx.beginPath(); ctx.moveTo(ux * w, y + h * 0.02); ctx.lineTo(ux * w, y + h / 8 - h * 0.035); ctx.stroke();
    }
  }
  const map = new THREE.CanvasTexture(c);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(1, 1 / 12); // v in mm → one tile per 12 mm
  const normal = heightToNormal(H, w, h, 1.2);
  normal.wrapS = normal.wrapT = THREE.RepeatWrapping;
  normal.repeat.set(1, 1 / 12);
  return { map, normal };
}

/** Velvet noise for the display cushion */
export function velvet(size = 256) {
  const w = size, H = new Float32Array(w * w);
  for (let i = 0; i < w * w; i++) H[i] = vnoise((i % w) * 0.3, Math.floor(i / w) * 0.3) * 0.5;
  const n = heightToNormal(H, w, w, 0.8);
  n.wrapS = n.wrapT = THREE.RepeatWrapping; n.repeat.set(6, 6);
  return n;
}

/** soft round sprite for particles */
export function softSprite(size = 64) {
  const c = canvas(size), ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.45)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export { BRAND };
