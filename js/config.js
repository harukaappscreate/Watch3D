// =============================================================
//  Watch3D — global configuration
//  Units: 1 scene unit = 1 millimetre.  Watch local +Z = dial side.
// =============================================================

export const BRAND = {
  name: 'haruka_apps',
  calibre: 'Calibre HA-01',
  serial: 'No. 001',
};

// ---- Movement specification (all gear data drives kinematics) ----
export const MOVEMENT = {
  radius: 15.0,          // movement (main plate) radius
  plateT: 1.2,           // plate thickness: back z = 0, dial side z = plateT
  freqHz: 4,             // 28,800 vph
  beatsPerSec: 8,
  reserveHours: 72,
  reserveHoursMetal: 41, // "what if" : metal bearings instead of jewels
  amplitudeDeg: 290,     // nominal balance amplitude

  // gear train — teeth (Z) / module (m) in mm
  barrel:   { Z: 72, m: 0.18 },
  centerPinion: { Z: 12, m: 0.18 },
  center:   { Z: 80, m: 0.12 },
  thirdPinion: { Z: 10, m: 0.12 },
  third:    { Z: 75, m: 0.10 },
  cagePinion: { Z: 10, m: 0.10 },
  fixedWheel: { Z: 72, m: 0.065 },
  escapePinion: { Z: 6, m: 0.065 },
  escape:   { Z: 20, r: 1.45 },

  // motion works (ratio 12)
  cannon: { Z: 12, m: 0.14 },
  minuteWheel: { Z: 36, m: 0.14 },
  minutePinion: { Z: 10, m: 0.14 },
  hourWheel: { Z: 40, m: 0.133 },
  dateDriver: { Z: 80, m: 0.133 },

  // keyless / winding
  ratchet: { Z: 54, m: 0.15 },
  crownWheel: { Z: 26, m: 0.15 },
  rotorPinion: { Z: 12, m: 0.12 },
  reverser: { Z: 40, m: 0.12 },
  reverserPinion: { Z: 10, m: 0.15 },

  tourbillonY: -8.3,     // cage centre on the 6 o'clock axis
};

// ---- Visual / timing ----
export const TIMING = {
  idleToLoop: 30,         // s of inactivity in showcase -> loop demo
  explodeDur: 1.3,
  explodeStagger: 0.018,
  assembleDur: 0.62,
  assembleStagger: 0.13,
  holdExploded: 9,
  showcaseHold: 7,
};

export const QUALITY_TIERS = {
  high:   { dpr: 2,    shadow: 2048, bloom: true,  dof: true,  vignette: true, transmission: true,  particles: 900, aniso: true },
  medium: { dpr: 1.5,  shadow: 1024, bloom: true,  dof: false, vignette: true, transmission: false, particles: 500, aniso: true },
  low:    { dpr: 1,    shadow: 512,  bloom: false, dof: false, vignette: false, transmission: false, particles: 200, aniso: false },
};

export const PALETTE = {
  case: {
    steel:  { color: 0xd9dde2, name: 'steel' },
    rose:   { color: 0xe6b49c, name: 'rose' },
    yellow: { color: 0xe8c77a, name: 'yellow' },
  },
  dial: {
    blue:   { base: '#123a72', edge: '#061a38', print: '#e9edf5' },
    silver: { base: '#d8d9db', edge: '#a9abaf', print: '#1b2230' },
    black:  { base: '#1a1b1e', edge: '#050506', print: '#e8e2d2' },
  },
};

export const STORAGE_KEY = 'watch3d.settings.v1';
