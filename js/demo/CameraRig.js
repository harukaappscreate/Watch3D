// =============================================================
//  CameraRig — cinematic camera moves that yield to the user.
// =============================================================
import * as THREE from 'three';
import { Timeline } from '../core/Timeline.js';

export class CameraRig {
  constructor(stage) {
    this.stage = stage;
    this.cam = stage.camera;
    this.ctl = stage.controls;
    this.userHold = 0;
    this.orbitSpeed = 0;
    this.moving = false;
    this.ctl.addEventListener('start', () => {
      this.userHold = 7;
      Timeline.kill('camera');
      this.moving = false;
      this.onUser?.();
    });
  }
  get free() { return this.userHold <= 0; }
  /** fly to world position/target */
  flyTo(pos, target, dur = 2.2, ease = 'inOutCubic') {
    Timeline.kill('camera');
    const p0 = this.cam.position.clone(), t0 = this.ctl.target.clone();
    const p1 = pos.clone(), t1 = target.clone();
    this.moving = true;
    // arc slightly outward for a more cinematic path
    const mid = p0.clone().lerp(p1, 0.5);
    const lift = p0.distanceTo(p1) * 0.12;
    return Timeline.tween({ dur, ease, group: 'camera',
      onUpdate: (e) => {
        const a = p0.clone().lerp(mid, e), b = mid.clone().lerp(p1, e);
        this.cam.position.copy(a.lerp(b, e));
        this.cam.position.y += Math.sin(e * Math.PI) * lift;
        this.ctl.target.lerpVectors(t0, t1, e);
      },
      onComplete: () => { this.moving = false; },
    }).promise;
  }
  jumpTo(pos, target) { Timeline.kill('camera'); this.cam.position.copy(pos); this.ctl.target.copy(target); this.ctl.update(); }
  /** camera expressed in an object's local frame */
  localView(obj, localPos, localTarget) {
    obj.updateMatrixWorld(true);
    return { pos: obj.localToWorld(localPos.clone()), target: obj.localToWorld(localTarget.clone()) };
  }
  update(dt) {
    if (this.userHold > 0) this.userHold -= dt;
    if (this.orbitSpeed && this.free && !this.moving) {
      const t = this.ctl.target, p = this.cam.position;
      const v = p.clone().sub(t);
      v.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.orbitSpeed * dt);
      p.copy(t).add(v);
    }
  }
}
