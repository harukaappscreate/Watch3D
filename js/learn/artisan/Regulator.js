// Regulator — balance & hairspring, overcoil, amplitude, positions, rate adjustment
import * as THREE from 'three';
const POS = [
  [0, 0, 0], [0, Math.PI, 0], [-Math.PI / 2, 0, Math.PI / 2], [-Math.PI / 2, 0, -Math.PI / 2], [-Math.PI / 2, 0, 0], [-Math.PI / 2, 0, Math.PI],
];
export const REGULATOR = {
  id: 'regulator',
  scenes: [
    { focus: ['balance', 'hairspring', 'jw_impulse'], ghost: 0.025, ts: 0.25, cam: { pos: [-7, -4, 19], target: [0, -8.3, 1.7], dof: 0.00016, narrow: 1.6 }, widget: 'balance' },
    { focus: ['hairspring', 'balance'], ghost: 0.02, ts: 0.3, cam: { pos: [16, -6.5, 5], target: [0, -8.3, 1.9], dof: 0.00014, narrow: 1.6 } },
    {
      focus: ['balance', 'hairspring', 'barrel', 'mainspring'], cam: { pos: [-9, -5, 22], target: [0, -8.3, 1.7] }, widget: 'reserve',
      enter: (ctx) => { const k = ctx.app.kin; const p0 = k.power; k.power = 5; return () => { k.power = Math.max(k.power, p0); }; },
    },
    {
      cam: { pos: [0, 26, 110], target: [0, 0, 0] }, widget: 'positions',
      enter: (ctx) => {
        const head = ctx.app.watch.head; const q0 = head.quaternion.clone();
        let t = 0;
        ctx.onUpdate((dt) => {
          t += dt; const i = Math.floor(t / 2.6) % POS.length; const f = Math.min(1, (t % 2.6) / 1.1);
          const qa = new THREE.Quaternion().setFromEuler(new THREE.Euler(...POS[(i + POS.length - 1) % POS.length]));
          const qb = new THREE.Quaternion().setFromEuler(new THREE.Euler(...POS[i]));
          head.quaternion.slerpQuaternions(qa, qb, f * f * (3 - 2 * f));
          ctx.scene.state.pos = i;
        });
        return () => head.quaternion.copy(q0);
      },
    },
    { focus: ['balance', 'hairspring'], cam: { pos: [7, -4, 22], target: [0, -8.3, 1.7], dof: 0.00014 }, widget: 'rate' },
  ],
};
