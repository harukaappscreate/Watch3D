// Artisan tours registry — add a file and list it here to create a new tour
import { ICON } from '../../ui/icons.js';
import { JEWEL } from './Jewel.js';
import { FINISHER } from './Finisher.js';
import { REGULATOR } from './Regulator.js';
import { WHEEL } from './WheelCutter.js';
import { ASSEMBLER } from './Assembler.js';
import { CASEDIAL } from './CaseDial.js';

const gem = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M6 3h12l4 6-10 12L2 9z"/><path d="M2 9h20M9 3l3 6 3-6M12 21L9 9M12 21l3-12"/></svg>';
const file = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M4 20l12-12M14 4l6 6M12 6l6 6"/><path d="M3 21l3-1-2-2z"/></svg>';
const spiral = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M12 12a1.5 1.5 0 1 1 1.5-1.5 3 3 0 1 1-3-3 4.5 4.5 0 1 1-4.5 4.5 6 6 0 1 1 6 6 7.5 7.5 0 0 1-7.5-7.5"/></svg>';
const gear = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M12 2l1.6 2.4 2.8-.8.5 2.9 2.8 1-.9 2.8L21 12l-2.2 1.7.9 2.8-2.8 1-.5 2.9-2.8-.8L12 22l-1.6-2.4-2.8.8-.5-2.9-2.8-1 .9-2.8L3 12l2.2-1.7-.9-2.8 2.8-1 .5-2.9 2.8.8z"/><circle cx="12" cy="12" r="3.5"/></svg>';
const tweezers = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M8 2l3 16 1 4 1-4 3-16"/><path d="M9.5 10h5"/></svg>';
const dial = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5.5" stroke-dasharray="1.5 1.5"/><path d="M12 12l3-2"/></svg>';

export const ARTISAN_TOURS = [
  { ...JEWEL, icon: gem },
  { ...FINISHER, icon: file },
  { ...REGULATOR, icon: spiral },
  { ...WHEEL, icon: gear },
  { ...ASSEMBLER, icon: tweezers },
  { ...CASEDIAL, icon: dial },
];
export { ICON };
