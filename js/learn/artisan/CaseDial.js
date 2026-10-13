// Case & dial — case middle and lugs, sapphire & AR coating, gaskets, guilloché, applied indices, crown
import * as V from './Vignettes.js';
export const CASEDIAL = {
  id: 'casedial',
  scenes: [
    { focus: ['caseMiddle', 'bezel', 'caseback', 'crown'], keepCase: true, cam: { pos: [52, 24, 62], target: [0, 0, 0] }, orbit: 0.16 },
    { cam: { pos: [-28, 34, 64], target: [0, 0, 2] }, enter: (ctx) => V.vAR(ctx), widget: 'toggle', toggleTitle: 'vignette.arTitle' },
    {
      focus: ['gasketFront', 'gasketBack', 'crystalFront', 'crystalBack', 'caseMiddle', 'bezel', 'caseback'], cam: { pos: [62, 6, 22], target: [0, 0, 0] },
      enter: (ctx) => { ctx.app.explore.toggle('section', true); return () => ctx.app.explore.toggle('section', false); },
    },
    { enter: (ctx) => V.vRoseEngine(ctx), cam: { pos: [0, 28, 62], target: [0, 0, 0] }, widget: 'state' },
    { focus: ['dial'], cam: { pos: [22, -6, 40], target: [6, 3, 2] }, enter: (ctx) => V.vIndices(ctx) },
    {
      focus: ['crown', 'stem', 'windingPinion', 'slidingPinion', 'caseMiddle'], cam: { pos: [52, 14, 22], target: [20, 0, 0] },
      enter: (ctx) => { ctx.onUpdate((dt) => ctx.app.kin.windCrown(dt * 3)); },
    },
  ],
};
