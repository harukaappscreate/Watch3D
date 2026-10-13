// =============================================================
//  layout — wheel positions derived from teeth & modules so that
//  every mesh is geometrically consistent (centre distance = sum of
//  pitch radii).  Movement frame: origin = centre wheel, +Z dial.
// =============================================================
import { MOVEMENT as M } from '../../config.js';

const pr = (s) => (s.m * s.Z) / 2;
function twoCircles(ax, ay, ra, bx, by, rb, pickPositiveSide = true) {
  const dx = bx - ax, dy = by - ay, d = Math.hypot(dx, dy);
  const a = (ra * ra - rb * rb + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, ra * ra - a * a));
  const mx = ax + (a * dx) / d, my = ay + (a * dy) / d;
  const s = pickPositiveSide ? 1 : -1;
  return { x: mx - (s * h * dy) / d, y: my + (s * h * dx) / d };
}
const polar = (cx, cy, r, deg) => ({ x: cx + r * Math.cos((deg * Math.PI) / 180), y: cy + r * Math.sin((deg * Math.PI) / 180) });

export function computeLayout() {
  const L = {};
  L.center = { x: 0, y: 0 };
  L.barrel = { x: 0, y: pr(M.barrel) + pr(M.centerPinion) };
  L.cage = { x: 0, y: M.tourbillonY };
  // third wheel: meshes centre wheel (via its pinion) and cage pinion
  L.third = twoCircles(0, 0, pr(M.center) + pr(M.thirdPinion), L.cage.x, L.cage.y, pr(M.third) + pr(M.cagePinion), true);
  // winding
  L.ratchet = { ...L.barrel };
  L.crownWheel = polar(L.barrel.x, L.barrel.y, pr(M.ratchet) + pr(M.crownWheel), -24);
  // automatic: reverser A meshes rotor pinion (centre) and ratchet (via pinion)
  L.revA = twoCircles(0, 0, pr(M.rotorPinion) + pr(M.reverser), L.barrel.x, L.barrel.y, pr(M.ratchet) + pr(M.reverserPinion), true);
  const aA = Math.atan2(L.revA.y, L.revA.x) * 180 / Math.PI;
  const dRev = pr(M.rotorPinion) + pr(M.reverser);
  const off = 2 * Math.asin(pr(M.reverser) / dRev) * 180 / Math.PI;
  L.revB = polar(0, 0, dRev, aA + off);
  // motion works (dial side)
  L.minuteWheel = polar(0, 0, pr(M.cannon) + pr(M.minuteWheel), 205);
  L.dateDriver = polar(0, 0, pr(M.hourWheel) + pr(M.dateDriver), 58);
  // escapement inside the cage (cage frame)
  L.esc = { x: pr(M.fixedWheel) + pr(M.escapePinion), y: 0 };
  L.pallet = { x: 1.22, y: 1.18 };
  // dial furniture
  L.dialR = 15.6;
  L.aperture = { x: L.cage.x, y: L.cage.y, r: 4.85 };
  L.pr = { x: -6.9, y: 5.8, r: 3.0 };
  L.prA0 = -Math.PI * 0.62; L.prA1 = Math.PI * 0.62; // power reserve scale sweep
  L.dateWin = { x: 14.15, y: 0 };
  L.brandY = 5.4;

  // z levels (mm)
  L.z = {
    plate0: 0, plate1: M.plateT,
    centreWheel: -0.45, thirdPinion: -0.45, thirdWheel: -1.2, cagePinion: -1.2,
    barrelBot: -0.8, barrelTop: -2.95, barrelTeeth: -2.72, centrePinion: -2.72,
    bridge0: -3.1, bridge1: -3.9,
    ratchet: -4.15, crownWheel: -4.15, revPinion: -4.15, revWheel: -4.62, rotorPinion: -4.62,
    rotor: -5.05,
    tbBar: 0.0, fixedWheel: 0.36, cageLower: 0.62, escape: 0.95, balance: 1.45, hairspring: 1.86, cageUpper: 2.48, cagePointer: 2.68,
    keyless: 0.6, setting: 1.38,
    dateDriver: 1.6, minuteWheel: 1.35, minutePinion: 1.6, cannon: 1.35, hourWheel: 1.6, dateRing: 1.75,
    dial0: 1.85, dial1: 2.25,
    prHand: 2.45, hourHand: 2.95, minuteHand: 3.18,
    crystal: 3.55,
  };
  return L;
}
export { pr };
