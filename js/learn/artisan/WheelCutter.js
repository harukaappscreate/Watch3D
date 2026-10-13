// Wheel cutter — gear train, tooth profiles, cutting, pivots, crossings
import * as V from './Vignettes.js';
export const WHEEL = {
  id: 'wheel',
  scenes: [
    { focus: ['barrel', 'centerWheel', 'thirdWheel', 'cagePinion', 'escapeWheel'], flow: ['barrel', 'centerWheel', 'thirdWheel', 'cagePinion', 'escapeWheel'], ts: 30, cam: { pos: [-12, -18, -78], target: [0, -1, -1.5] }, widget: 'ratio' },
    { enter: (ctx) => V.vProfile(ctx), cam: { pos: [0, 0, 64], target: [2, 0, 0] }, widget: 'toggle', toggleTitle: 'vignette.profileTitle' },
    { enter: (ctx) => V.vCutting(ctx), cam: { pos: [6, 14, 48], target: [2, 0, 0] }, widget: 'state' },
    { enter: (ctx) => V.vPivot(ctx), cam: { pos: [0, 10, 44], target: [2, 0, 0] } },
    { focus: ['centerWheel', 'thirdWheel', 'barrel', 'escapeWheel', 'balance', 'reverser'], explode: { f: 0.6 }, cam: { pos: [44, 26, -70], target: [0, 0, -8] }, orbit: 0.1 },
  ],
};
