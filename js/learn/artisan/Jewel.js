// Jewel maker — synthetic ruby, drilling, shapes, oil sinks, setting, shock protection
import * as V from './Vignettes.js';
export const JEWEL = {
  id: 'jewel',
  scenes: [
    { focus: ['type:holeJewel', 'type:capJewel', 'type:palletStone', 'type:impulseJewel', 'type:chaton'], explode: { f: 0.45 }, cam: { pos: [58, 34, 88], target: [0, 0, 0] }, orbit: 0.12, widget: 'jewels' },
    { enter: (ctx) => V.vBoule(ctx), cam: { pos: [0, 6, 64], target: [0, 3, 0] }, widget: 'state' },
    { enter: (ctx) => V.vSlice(ctx), cam: { pos: [6, 16, 62], target: [2, 0, 0] }, widget: 'state' },
    { enter: (ctx) => V.vJewelShapes(ctx), cam: { pos: [0, 24, 84], target: [0, 0, 0] } },
    { enter: (ctx) => V.vOil(ctx), cam: { pos: [6, 12, 42], target: [0, 0, 0] } },
    { enter: (ctx) => V.vPress(ctx), cam: { pos: [26, 14, 44], target: [0, -3, 0] }, widget: 'state' },
    { enter: (ctx) => V.vShock(ctx), cam: { pos: [0, 14, 36], target: [0, 2, 0] } },
  ],
};
