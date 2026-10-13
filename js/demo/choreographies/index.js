// =============================================================
//  Choreographies — each returns the exploded offset of a part
//  (in its parent frame) and optional "from" pose for assembly.
//  Add a new file + register it here to create a new dance.
// =============================================================
import { Layer } from './Layer.js';
import { Radial } from './Radial.js';
import { Spiral } from './Spiral.js';
import { Meteor } from './Meteor.js';

export const CHOREOS = [Layer, Radial, Spiral, Meteor];
export const choreoById = (id) => CHOREOS.find((c) => c.id === id) || Layer;
export { Layer, Radial, Spiral, Meteor };
