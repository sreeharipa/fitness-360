// Procedural, jointed human body. Every muscle group is its own mesh, so it can be
// clicked and highlighted. The same rig is used for the explorer and the exercise demos.
import * as THREE from 'three';
import { MUSCLE_IDS } from './data/muscles.js';

export const LEN = { thigh: 0.44, shin: 0.43, upper: 0.29, fore: 0.26 };
export const JOINTS = ['spine', 'chest', 'neck', 'head', 'shL', 'elL', 'wrL', 'shR', 'elR', 'wrR', 'hipL', 'knL', 'anL', 'hipR', 'knR', 'anR'];
export const COLORS = { base: 0x606a7c, muscle: 0xb4544c, hair: 0x24262d };

const SPHERE = new THREE.SphereGeometry(1, 40, 28);
const SH_Y = 0.19;

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

// Tapered capsule hanging down from the joint (0 → -len).
function taper(r1, r2, len) {
  const pts = [];
  const n = 8;
  for (let i = 0; i <= n; i++) {
    const a = -Math.PI / 2 + (i / n) * (Math.PI / 2);
    pts.push(new THREE.Vector2(Math.max(1e-4, r2 * Math.cos(a)), -len + r2 * Math.sin(a)));
  }
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * (Math.PI / 2);
    pts.push(new THREE.Vector2(Math.max(1e-4, r1 * Math.cos(a)), r1 * Math.sin(a)));
  }
  return new THREE.LatheGeometry(pts, 28);
}

// z coordinate on an ellipsoid surface at (x, y). sign +1 = front, -1 = back.
function surf(c, r, x, y, sign = 1) {
  const dx = (x - c[0]) / r[0];
  const dy = (y - c[1]) / r[1];
  return c[2] + sign * r[2] * Math.sqrt(Math.max(0, 1 - dx * dx - dy * dy));
}

export class Rig {
  constructor(gender = 'male') {
    this.gender = gender;
    this.F = gender === 'female';
    this.P = this.F
      ? { scale: 0.93, shW: 0.165, hip: 1.16, waist: 0.84, chest: 0.9, m: 0.82, limb: 0.9, thigh: 1.06, glute: 1.12 }
      : { scale: 1.0, shW: 0.19, hip: 1.0, waist: 1.0, chest: 1.05, m: 1.0, limb: 1.0, thigh: 1.0, glute: 1.0 };
    this.group = new THREE.Group();
    this.group.scale.setScalar(this.P.scale);
    this.mats = {
      base: new THREE.MeshStandardMaterial({ color: COLORS.base, roughness: 0.6, metalness: 0.05 }),
      hair: new THREE.MeshStandardMaterial({ color: COLORS.hair, roughness: 0.85 }),
      muscle: {},
    };
    for (const id of MUSCLE_IDS) {
      this.mats.muscle[id] = new THREE.MeshStandardMaterial({ color: COLORS.muscle, roughness: 0.42, metalness: 0.02 });
    }
    this.meshes = [];
    this.geos = [];
    this.J = {};
    this.grip = {};
    this._v = new THREE.Vector3();
    this._build();
  }

  // ------------------------------------------------------------------ building
  _joint(name, parent, p) {
    const o = new THREE.Object3D();
    o.position.set(p[0], p[1], p[2]);
    parent.add(o);
    if (name) this.J[name] = o;
    return o;
  }

  _mesh(geo, mat, parent, pos, scale, rot, muscle) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(pos[0], pos[1], pos[2]);
    if (scale) m.scale.set(scale[0], scale[1], scale[2]);
    if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
    m.castShadow = true;
    m.receiveShadow = true;
    if (muscle) m.userData.muscle = muscle;
    parent.add(m);
    this.meshes.push(m);
    return m;
  }

  _ell(parent, pos, size, muscle, rot) {
    const mat = muscle ? this.mats.muscle[muscle] : this.mats.base;
    return this._mesh(SPHERE, mat, parent, pos, size, rot, muscle);
  }

  _limb(parent, r1, r2, len) {
    const g = taper(r1, r2, len);
    this.geos.push(g);
    return this._mesh(g, this.mats.base, parent, [0, 0, 0], [1, 1, 0.94]);
  }

  _build() {
    const P = this.P;
    const F = this.F;
    const m = P.m;
    const lb = P.limb;

    // ---- pelvis
    const root = this._joint('root', this.group, [0, 1.0, 0]);
    const pelC = [0, -0.02, -0.005];
    const pelR = [0.155 * P.hip, 0.11, 0.105];
    this._ell(root, pelC, pelR);
    for (const s of [1, -1]) {
      const x = s * 0.072 * P.hip;
      const y = -0.065;
      this._ell(root, [x, y, surf(pelC, pelR, x, y, -1) + 0.03], [0.078 * P.hip * P.glute, 0.09, 0.058 * m * P.glute], 'glutes', [0.15, 0, 0]);
    }

    // ---- abdomen
    const spine = this._joint('spine', root, [0, 0.08, 0]);
    const abC = [0, 0.1, 0];
    const abR = [0.14 * P.waist, 0.17, 0.102];
    this._ell(spine, abC, abR);
    const pelInSpine = [pelC[0], pelC[1] - 0.08, pelC[2]];
    [0.17, 0.11, 0.05, -0.015].forEach((y, i) => {
      for (const s of [1, -1]) {
        const x = s * 0.034 * P.waist;
        const z = Math.max(surf(abC, abR, x, y, 1), surf(pelInSpine, pelR, x, y, 1)) - 0.004;
        const sz = i === 3 ? [0.03, 0.04, 0.012] : [0.031, 0.027, 0.012];
        this._ell(spine, [x, y, z - 0.002], [sz[0] * P.waist, sz[1], sz[2] * m], 'abs', [-(y - 0.1) * 2.0, 0, 0]);
      }
    });
    for (const s of [1, -1]) {
      this._ell(spine, [s * 0.105 * P.waist, 0.06, 0.022], [0.04 * P.waist, 0.1, 0.062], 'obliques', [0, 0, s * 0.18]);
      const x = s * 0.036;
      const y = 0.07;
      this._ell(spine, [x, y, surf(abC, abR, x, y, -1) + 0.012], [0.028, 0.12, 0.024 * m], 'lower_back');
    }

    // ---- chest / upper back
    const chest = this._joint('chest', spine, [0, 0.2, 0]);
    const thC = [0, 0.08, -0.005];
    const thR = [0.17 * P.chest, 0.2, 0.112];
    this._ell(chest, thC, thR);
    this._ell(chest, [0, 0.175, -0.012], [P.shW + 0.015, 0.062, 0.085]); // shoulder girdle
    for (const s of [1, -1]) {
      const x = s * 0.08 * P.chest;
      const y = F ? 0.09 : 0.125;
      const z = surf(thC, thR, x, y, 1) - (F ? 0.022 : 0.016);
      const size = F ? [0.075, 0.075, 0.062] : [0.092, 0.06, 0.036];
      this._ell(chest, [x, y, z], size, 'chest', [F ? 0.1 : 0.05, s * 0.32, s * 0.1]);
      // lats
      const lx = s * 0.112 * P.chest;
      const ly = 0.03;
      this._ell(chest, [lx, ly, surf(thC, thR, lx, ly, -1) + 0.025], [0.065, 0.145, 0.045 * m], 'lats', [0.1, -s * 0.3, s * 0.28]);
      // trap slopes
      this._ell(chest, [s * 0.075, 0.205, -0.025], [0.075, 0.04, 0.05], 'traps', [0, 0, -s * 0.38]);
    }
    this._ell(chest, [0, 0.2, -0.045], [0.1, 0.06, 0.055], 'traps', [-0.4, 0, 0]);
    this._ell(chest, [0, 0.11, surf(thC, thR, 0, 0.11, -1) + 0.022], [0.07, 0.1, 0.032], 'traps');

    // ---- neck & head
    const neck = this._joint('neck', chest, [0, 0.235, -0.01]);
    const ng = new THREE.CylinderGeometry(F ? 0.043 : 0.05, F ? 0.048 : 0.056, 0.14, 20);
    this.geos.push(ng);
    this._mesh(ng, this.mats.base, neck, [0, 0.04, 0]);
    const head = this._joint('head', neck, [0, 0.1, 0.01]);
    this._ell(head, [0, 0.075, 0.012], [0.086, 0.11, 0.099]);
    this._ell(head, [0, 0.03, 0.025], [0.062, 0.06, 0.07]); // jaw
    this._ell(head, [0, 0.065, 0.108], [0.013, 0.022, 0.02]); // nose
    for (const s of [1, -1]) this._ell(head, [s * 0.085, 0.07, 0.005], [0.012, 0.024, 0.016]); // ears
    if (F) {
      this._mesh(SPHERE, this.mats.hair, head, [0, 0.092, -0.016], [0.093, 0.105, 0.1]);
      this._mesh(SPHERE, this.mats.hair, head, [0, 0.12, -0.105], [0.042, 0.042, 0.042]);
    } else {
      this._mesh(SPHERE, this.mats.hair, head, [0, 0.11, -0.012], [0.089, 0.082, 0.098]);
    }

    // ---- arms & legs
    for (const s of [1, -1]) {
      const S = s > 0 ? 'L' : 'R';

      const sh = this._joint('sh' + S, chest, [s * P.shW, SH_Y, -0.01]);
      this._limb(sh, 0.05 * lb, 0.04 * lb, LEN.upper);
      this._ell(sh, [s * 0.012, -0.035, 0], [0.064 * m * (F ? 0.92 : 1), 0.085, 0.064 * m], 'shoulders');
      this._ell(sh, [0, -0.15, 0.014], [0.038 * m, 0.09, 0.036 * m], 'biceps');
      this._ell(sh, [0, -0.13, -0.016], [0.042 * m, 0.105, 0.037 * m], 'triceps');

      const el = this._joint('el' + S, sh, [0, -LEN.upper, 0]);
      this._limb(el, 0.041 * lb, 0.029 * lb, LEN.fore);
      this._ell(el, [0, -0.075, 0.003], [0.046 * m, 0.09, 0.041 * m], 'forearms');

      const wr = this._joint('wr' + S, el, [0, -LEN.fore, 0]);
      this._ell(wr, [0, -0.05, 0.004], [0.025 * lb, 0.055, 0.042 * lb]);
      this._ell(wr, [s * 0.006, -0.03, 0.038], [0.013, 0.03, 0.014]); // thumb
      this.grip[S] = this._joint(null, wr, [0, -0.055, 0.004]);

      const hip = this._joint('hip' + S, root, [s * 0.09 * P.hip, -0.06, 0]);
      this._limb(hip, 0.088 * P.thigh, 0.056 * lb, LEN.thigh);
      this._ell(hip, [s * 0.006, -0.19, 0.026], [0.068 * m * P.thigh, 0.17, 0.055 * m], 'quads');
      this._ell(hip, [s * 0.042, -0.2, 0.004], [0.042 * m, 0.155, 0.055 * m], 'quads');
      this._ell(hip, [-s * 0.03, -0.34, 0.022], [0.036 * m, 0.065, 0.036 * m], 'quads');
      this._ell(hip, [0, -0.21, -0.026], [0.064 * m * P.thigh, 0.17, 0.055 * m], 'hamstrings');

      const kn = this._joint('kn' + S, hip, [0, -LEN.thigh, 0]);
      this._limb(kn, 0.056 * lb, 0.036 * lb, LEN.shin);
      this._ell(kn, [0, -0.005, 0.034], [0.034, 0.036, 0.024]); // knee cap
      this._ell(kn, [s * 0.004, -0.12, -0.02], [0.053 * m, 0.105, 0.046 * m], 'calves');

      const an = this._joint('an' + S, kn, [0, -LEN.shin, 0]);
      this._ell(an, [0, -0.038, 0.055], [0.042, 0.03, 0.11]);
    }
  }

  // ------------------------------------------------------------------ posing
  apply(o) {
    const J = this.J;
    J.root.position.set(o.pos[0], o.pos[1], o.pos[2]);
    J.root.rotation.set(o.rot[0], o.rot[1], o.rot[2]);
    for (const n of JOINTS) J[n].quaternion.copy(o.q[n]);
    J.shL.position.y = J.shR.position.y = SH_Y + (o.shrug || 0);

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
        thShin = this._solve(J['hip' + S], J['kn' + S], LEN.thigh, LEN.shin, ik['foot' + S], false, legParent, o.legPref, o.e['hip' + S], o.e['kn' + S]);
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
        thFore = this._solve(J['sh' + S], J['el' + S], LEN.upper, LEN.fore, ik['hand' + S], o.handRel, armParent, o.armPref, o.e['sh' + S], o.e['el' + S]);
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
    this.geos.forEach((g) => g.dispose());
    this.mats.base.dispose();
    this.mats.hair.dispose();
    Object.values(this.mats.muscle).forEach((mt) => mt.dispose());
  }
}
