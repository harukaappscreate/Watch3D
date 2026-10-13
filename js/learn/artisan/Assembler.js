// Assembler — order of assembly, oiling, endshake, cage poise, casing & final check
import * as V from './Vignettes.js';
export const ASSEMBLER = {
  id: 'assembler',
  scenes: [
    {
      cam: { pos: [70, 40, 110], target: [0, 0, 0] },
      enter: async (ctx) => {
        const a = ctx.app; const tok = ctx.token;
        await a.explode.animateTo(1, { dur: 1.2, stagger: 0.004 });
        if (ctx.app.tour.sceneToken !== tok) return null;
        await a.explode.assembleAll(2.2, (p, i, n) => { if (ctx.app.tour.sceneToken === tok) a.ui.caption({ title: `${i + 1} / ${n}`, text: ctx.t(`parts.${p.type}.name`) }); });
        a.ui.caption(null);
        return null;
      },
    },
    { cam: { pos: [-40, 30, -70], target: [0, 0, -2] }, xray: true, enter: (ctx) => V.vOiling(ctx), widget: 'oils' },
    { focus: ['thirdWheel', 'jw_train_3', 'jw_plate_3', 'chaton_3'], cam: { pos: [26, -2, -10], target: [2.4, -4.8, -1.5], dof: 0.00014 }, enter: (ctx) => V.vEndshake(ctx, 'thirdWheel') },
    { focus: ['tourbillon'], cam: { pos: [12, -14, 26], target: [0, -8.3, 1.4] }, enter: (ctx) => V.vPoise(ctx), widget: 'state' },
    {
      cam: { pos: [60, 30, 90], target: [0, 0, 0] }, widget: 'balance',
      enter: async (ctx) => {
        const a = ctx.app;
        const only = a.highlight.resolve(['group:case']);
        await a.explode.animateTo(1, { only, dur: 1.4 });
        await new Promise((r) => setTimeout(r, 1200));
        await a.explode.animateTo(0, { only, dur: 2.2, stagger: 0.03 });
        return null;
      },
    },
  ],
};
