// Invisible jointed pose rig. Exercise keyframes drive these joints; the anatomy mesh
// (anatomy.js) is skinned to them. Proportions come from the anatomy skeleton.
import * as THREE from 'three';

export const JOINTS = ['spine', 'chest', 'neck', 'head', 'shL', 'elL', 'wrL', 'shR', 'elR', 'wrR', 'hipL', 'knL', 'anL', 'hipR', 'knR', 'anR'];

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

// dims: from anatomyDims() — { j: joint positions in body space, len: segment lengths }
export class Rig {
  constructor(dims) {
    const j = dims.j;
    const ROOT_Y = 1.0;
    const CHEST_Y = 1.28;
    this.L = { ...dims.len };
    this.D = { shY: j.shoulder[1] - CHEST_Y };
    this.group = new THREE.Group();
    this.J = {};
    this.grip = {};
    this._v = new THREE.Vector3();

    const root = this._joint('root', this.group, [0, ROOT_Y, 0]);
    const spine = this._joint('spine', root, [0, 0.08, 0]);
    const chest = this._joint('chest', spine, [0, CHEST_Y - ROOT_Y - 0.08, 0]);
    const neck = this._joint('neck', chest, [0, j.c7[1] - CHEST_Y, j.c7[2]]);
    this._joint('head', neck, [0, j.atlas[1] - j.c7[1], j.atlas[2] - j.c7[2]]);
    for (const s of [1, -1]) {
      const S = s > 0 ? 'L' : 'R';
      const sh = this._joint('sh' + S, chest, [s * j.shoulder[0], this.D.shY, j.shoulder[2]]);
      const el = this._joint('el' + S, sh, [0, -this.L.upper, 0]);
      const wr = this._joint('wr' + S, el, [0, -this.L.fore, 0]);
      this.grip[S] = this._joint(null, wr, [0, -0.05, 0.0]);
      const hip = this._joint('hip' + S, root, [s * j.hip[0], j.hip[1] - ROOT_Y, j.hip[2]]);
      const kn = this._joint('kn' + S, hip, [0, -this.L.thigh, 0]);
      this._joint('an' + S, kn, [0, -this.L.shin, 0]);
    }
  }

  _joint(name, parent, p) {
    const o = new THREE.Object3D();
    o.position.set(p[0], p[1], p[2]);
    parent.add(o);
    if (name) this.J[name] = o;
    return o;
  }

  // zero pose: standing, arms straight down, palms in
  reset() {
    this.J.root.position.set(0, 1.0, 0);
    this.J.root.rotation.set(0, 0, 0);
    for (const n of JOINTS) this.J[n].quaternion.identity();
    this.J.shL.position.y = this.J.shR.position.y = this.D.shY;
  }

// ------------------------------------------------------------------ posing
  apply(o) {
    const J = this.J;
    J.root.position.set(o.pos[0], o.pos[1], o.pos[2]);
    J.root.rotation.set(o.rot[0], o.rot[1], o.rot[2]);
    for (const n of JOINTS) J[n].quaternion.copy(o.q[n]);
    J.shL.position.y = J.shR.position.y = this.D.shY + (o.shrug || 0);

    const armParent = o.rot[0] + o.e.spine[0] + o.e.chest[0];
    const legParent = o.rot[0];
    const shX = {};
    for (const S of ['L', 'R']) {
      const a = o['armAbs' + S];
      const e = o.e['sh' + S];
      if (a != null) {
        shX[S] = a - armParent;
        J['sh' + S].rotation.set(shX[S], e[1], e[2]);
      } else {
        shX[S] = e[0];
      }
    }

    const ik = o.ik;
    if (ik.footL || ik.footR || ik.handL || ik.handR) this.group.updateMatrixWorld(true);

    for (const S of ['L', 'R']) {
      // legs
      let thShin;
      if (ik['foot' + S]) {
        thShin = this._solve(J['hip' + S], J['kn' + S], this.L.thigh, this.L.shin, ik['foot' + S], false, legParent, o.legPref, o.e['hip' + S], o.e['kn' + S]);
      } else {
        thShin = legParent + o.e['hip' + S][0] + o.e['kn' + S][0];
      }
      const fa = o['footAngle' + S];
      if (fa != null) {
        const e = o.e['an' + S];
        J['an' + S].rotation.set(wrap(fa - thShin), e[1], e[2]);
      }
      // arms
      let thFore;
      if (ik['hand' + S]) {
        thFore = this._solve(J['sh' + S], J['el' + S], this.L.upper, this.L.fore, ik['hand' + S], o.handRel, armParent, o.armPref, o.e['sh' + S], o.e['el' + S]);
      } else {
        thFore = armParent + shX[S] + o.e['el' + S][0];
      }
      const ha = o['handAngle' + S];
      if (ha != null) {
        const e = o.e['wr' + S];
        J['wr' + S].rotation.set(wrap(ha - thFore), e[1], e[2]);
      }
    }
  }

  // Two-bone IK in the sagittal (Y/Z) plane. Returns the world angle of the lower bone.
  _solve(upper, lower, L1, L2, tgt, rel, parentAngle, pref, eU, eL) {
    const v = this._v;
    upper.getWorldPosition(v);
    this.group.worldToLocal(v);
    const py = v.y;
    const pz = v.z;
    let ty = tgt[0];
    let tz = tgt[1];
    if (rel) {
      ty += py;
      tz += pz;
    }
    const l1 = L1 * Math.cos(eU[2]);
    const vy = ty - py;
    const vz = tz - pz;
    const D = Math.hypot(vy, vz) || 1e-6;
    const Dc = clamp(D, Math.abs(l1 - L2) + 1e-3, l1 + L2 - 1e-4);
    const base = Math.atan2(-vz, -vy);
    const A = Math.acos(clamp((l1 * l1 + Dc * Dc - L2 * L2) / (2 * l1 * Dc), -1, 1));
    let best = null;
    let bestScore = -Infinity;
    for (const sgn of [1, -1]) {
      const th1 = base + sgn * A;
      const my = py - Math.cos(th1) * l1;
      const mz = pz - Math.sin(th1) * l1;
      const sc = (my - py) * pref[0] + (mz - pz) * pref[1];
      if (sc > bestScore) {
        bestScore = sc;
        best = { th1, my, mz };
      }
    }
    const ey = py + (vy / D) * Dc;
    const ez = pz + (vz / D) * Dc;
    const th2 = Math.atan2(-(ez - best.mz), -(ey - best.my));
    upper.rotation.set(wrap(best.th1 - parentAngle), eU[1], eU[2]);
    lower.rotation.set(wrap(th2 - best.th1), eL[1], eL[2]);
    return th2;
  }

  dispose() {
    this.group.parent?.remove(this.group);
  }
}
