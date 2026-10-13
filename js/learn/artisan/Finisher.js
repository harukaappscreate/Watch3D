// Finisher — anglage, Côtes de Genève, perlage, heat-blued screws, black polish, hidden finishing
import * as V from './Vignettes.js';
export const FINISHER = {
  id: 'finisher',
  scenes: [
    { cam: { pos: [-22, 14, -40], target: [-6, -2, -3.5], dof: 0.00012 }, enter: (ctx) => V.vSweep(ctx), xray: true },
    { enter: (ctx) => V.vFinish(ctx, 'cotes'), cam: { pos: [0, 30, 42], target: [0, 0, 0] }, widget: 'state' },
    { enter: (ctx) => V.vFinish(ctx, 'perlage'), cam: { pos: [0, 30, 42], target: [0, 0, 0] }, widget: 'state' },
    { enter: (ctx) => V.vBluing(ctx), cam: { pos: [0, 28, 36], target: [0, -2, 0] }, widget: 'state' },
    { enter: (ctx) => V.vPolish(ctx), cam: { pos: [0, 20, 42], target: [0, 0, 0] } },
    {
      focus: ['mainplate', 'settingLever', 'yoke', 'windingPinion', 'slidingPinion', 'stem', 'tbBar', 'fixedWheel'],
      explode: { only: ['dial', 'hourHand', 'minuteHand', 'prHand', 'dateRing', 'dateDriver', 'hourWheel', 'minuteWheel', 'cannon', 'crystalFront', 'bezel', 'gasketFront'], f: 1 },
      cam: { pos: [14, 10, 72], target: [0, 0, 1] },
    },
  ],
};
