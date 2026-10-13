// =============================================================
//  Basic guided tour — "From mainspring to hands" (9 chapters)
//  Cameras are authored in head space (head faces +Z at STUDY).
//  Text: locales/*.json → tour.basic.scenes[i]
// =============================================================
import * as THREE from 'three';

const swing = (ctx, amp = 1.1, speed = 1.3) => {
  const head = ctx.app.watch.head;
  const q0 = head.quaternion.clone();
  let t = 0;
  ctx.onUpdate((dt) => {
    t += dt;
    const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.sin(t * speed) * amp);
    head.quaternion.copy(q0).multiply(q);
  });
  return () => head.quaternion.copy(q0);
};

export const BASIC = {
  id: 'basic',
  scenes: [
    { // 1 winding
      focus: ['crown', 'stem', 'windingPinion', 'slidingPinion', 'crownWheel', 'sc_crownWheel', 'ratchet', 'sc_ratchet', 'click', 'clickSpring', 'barrelArbor'],
      cam: { pos: [48, 20, -62], target: [8, 4, -3] },
      flow: ['crown', 'stem', 'windingPinion', 'crownWheel', 'ratchet'],
      widget: 'reserve',
      enter: (ctx) => { ctx.onUpdate((dt) => ctx.app.kin.windCrown(dt * 4.5)); },
    },
    { // 2 storing
      focus: ['barrel', 'mainspring', 'barrelCover', 'barrelArbor'],
      explode: { only: ['barrelCover', 'mainspring', 'barrelArbor'], f: 1 },
      cam: { pos: [42, 34, -78], target: [0, 7, -8] },
      widget: 'reserve',
    },
    { // 3 transmitting
      focus: ['barrel', 'centerWheel', 'thirdWheel', 'cagePinion'],
      cam: { pos: [-12, -18, -78], target: [0, -1, -1.5] },
      flow: ['barrel', 'centerWheel', 'thirdWheel', 'cagePinion'],
      ts: 30,
      widget: 'ratio',
    },
    { // 4 escapement
      focus: ['escapeWheel', 'pallet', 'jw_pal_in', 'jw_pal_out', 'jw_impulse', 'fixedWheel'],
      cam: { pos: [5, -5.5, 19], target: [0, -8.3, 1.0], dof: 0.00018, narrow: 1.6 },
      ghost: 0.025,
      ts: 0.05,
      widget: 'escapement',
    },
    { // 5 regulating
      focus: ['balance', 'hairspring', 'jw_impulse'],
      cam: { pos: [-7, -4, 19], target: [0, -8.3, 1.7], dof: 0.00016, narrow: 1.6 },
      ghost: 0.025,
      ts: 0.25,
      widget: 'balance',
    },
    { // 6 jewels
      focus: ['type:holeJewel', 'type:capJewel', 'type:palletStone', 'type:impulseJewel', 'type:chaton'],
      explode: { f: 0.5 },
      cam: { pos: [62, 38, 92], target: [0, 0, 0] },
      orbit: 0.12,
      widget: 'jewels',
    },
    { // 7 display
      focus: ['cannon', 'minuteWheel', 'hourWheel', 'dateDriver', 'dateRing', 'hourHand', 'minuteHand', 'centerWheel'],
      cam: { pos: [0, -12, 58], target: [0, 0, 1.5] },
      widget: 'motion',
      enter: (ctx) => { ctx.onUpdate((dt) => ctx.app.kin.setHands(dt * 1800)); return () => ctx.app.kin.resync(); },
    },
    { // 8 tourbillon
      focus: ['tourbillon', 'fixedWheel', 'tbBar', 'cagePinion'],
      cam: { pos: [15, -16, 27], target: [0, -8.3, 1.2], dof: 0.00012 },
      ghost: 0.035,
      widget: 'gravity',
      enter: (ctx) => {
        const head = ctx.app.watch.head; const q0 = head.quaternion.clone(); let t = 0;
        ctx.onUpdate((dt) => { t += dt; head.quaternion.copy(q0).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.sin(t * 0.4) * 0.55)); });
        return () => head.quaternion.copy(q0);
      },
    },
    { // 9 automatic
      focus: ['rotor', 'rotorWeight', 'sc_rotor', 'revA', 'revB', 'ratchet'],
      cam: { pos: [0, 4, -96], target: [0, 0, -4] },
      widget: 'auto',
      enter: (ctx) => swing(ctx),
    },
  ],
};
