// Turns authored keyframes into poses the rig can apply, and samples them over time.
import * as THREE from 'three';
import { JOINTS } from './rig.js';

const SIDES = ['sh', 'el', 'wr', 'hip', 'kn', 'an'];
const CENTER = ['spine', 'chest', 'neck', 'head'];
const pad = (a) => [a[0] || 0, a[1] || 0, a[2] || 0];
const mir = (a) => [a[0], -a[1], -a[2]];
const pair = (v) => (v == null ? [null, null] : Array.isArray(v) ? v : [v, v]);
const _eu = new THREE.Euler();

export function expand(p, anim = {}) {
  const e = {};
  for (const n of JOINTS) e[n] = [0, 0, 0];
  for (const n of CENTER) if (p[n]) e[n] = pad(p[n]);
  for (const b of SIDES) {
    if (p[b]) {
      e[b + 'L'] = pad(p[b]);
      e[b + 'R'] = mir(pad(p[b]));
    }
    if (p[b + 'L']) e[b + 'L'] = pad(p[b + 'L']);
    if (p[b + 'R']) e[b + 'R'] = mir(pad(p[b + 'R']));
  }
  const q = {};
  for (const n of JOINTS) q[n] = new THREE.Quaternion().setFromEuler(_eu.set(e[n][0], e[n][1], e[n][2]));

  const src = p.ik || {};
  const ik = {};
  if (src.foot) ik.footL = ik.footR = src.foot;
  if (src.hand) ik.handL = ik.handR = src.hand;
  for (const k of ['footL', 'footR', 'handL', 'handR']) if (src[k]) ik[k] = src[k];

  const [faL, faR] = pair(p.footAngle);
  const [haL, haR] = pair(p.handAngle);
  const [aaL, aaR] = pair(p.armAbs);
  return {
    pos: pad(p.pos || [0, 0.995, 0]),
    rot: pad(p.rot || [0, 0, 0]),
    e,
    q,
    shrug: p.shrug || 0,
    footAngleL: p.footAngleL ?? faL,
    footAngleR: p.footAngleR ?? faR,
    handAngleL: haL,
    handAngleR: haR,
    armAbsL: aaL,
    armAbsR: aaR,
    ik,
    handRel: !!anim.handRel,
    legPref: anim.legPref || [0, 1],
    armPref: anim.armPref || [0, -1],
  };
}

function merge(a, b) {
  const o = { ...a, ...b };
  if (a.ik || b.ik) o.ik = { ...(a.ik || {}), ...(b.ik || {}) };
  return o;
}

export function compile(anim) {
  const keys = anim.keys.map((k) => ({ t: k.t, pose: expand(merge(anim.base || {}, k), anim) }));
  if (keys[keys.length - 1].t < 1) keys.push({ t: 1, pose: keys[0].pose });
  return { duration: anim.duration || 3, keys };
}

export function sample(c, time) {
  const T = (((time / c.duration) % 1) + 1) % 1;
  let i = 0;
  while (i < c.keys.length - 2 && T >= c.keys[i + 1].t) i++;
  const A = c.keys[i];
  const B = c.keys[i + 1];
  let u = (T - A.t) / Math.max(1e-6, B.t - A.t);
  u = Math.min(1, Math.max(0, u));
  u = 0.5 - 0.5 * Math.cos(Math.PI * u);
  return lerpPose(A.pose, B.pose, u);
}

function lerpPose(a, b, u) {
  const L = (x, y) => x + (y - x) * u;
  const L3 = (x, y) => [L(x[0], y[0]), L(x[1], y[1]), L(x[2], y[2])];
  const N = (x, y) => (x == null ? y : y == null ? x : L(x, y));
  const e = {};
  const q = {};
  for (const n of JOINTS) {
    e[n] = L3(a.e[n], b.e[n]);
    q[n] = new THREE.Quaternion().slerpQuaternions(a.q[n], b.q[n], u);
  }
  const ik = {};
  for (const k of ['footL', 'footR', 'handL', 'handR']) {
    const x = a.ik[k];
    const y = b.ik[k];
    if (x && y) ik[k] = [L(x[0], y[0]), L(x[1], y[1])];
    else if (x || y) ik[k] = x || y;
  }
  return {
    pos: L3(a.pos, b.pos),
    rot: L3(a.rot, b.rot),
    e,
    q,
    shrug: L(a.shrug, b.shrug),
    footAngleL: N(a.footAngleL, b.footAngleL),
    footAngleR: N(a.footAngleR, b.footAngleR),
    handAngleL: N(a.handAngleL, b.handAngleL),
    handAngleR: N(a.handAngleR, b.handAngleR),
    armAbsL: N(a.armAbsL, b.armAbsL),
    armAbsR: N(a.armAbsR, b.armAbsR),
    ik,
    handRel: a.handRel,
    legPref: a.legPref,
    armPref: a.armPref,
  };
}

// Relaxed A-pose for the muscle explorer.
export const REST_POSE = expand({
  pos: [0, 0.995, 0],
  sh: [0, 0, 0.24],
  el: [-0.14, 0.5, 0],
  hip: [0, 0, 0.045],
  an: [0, 0, -0.045],
});
