// Loads the packed BodyParts3D anatomy (assets/anatomy.bin + .json) and turns it into
// skinned meshes driven by the procedural pose rig (rig.js).
//
// Every muscle head is its own "part". Parts are merged into a few SkinnedMeshes for speed;
// a per-vertex part index drives highlight colours and GPU picking.
import * as THREE from 'three';

const SCALE = 1.05; // anatomy is 1.72 m; scale to the rig's 1.80 m proportions

export async function loadAnatomy(base = 'assets/anatomy') {
  const [manifest, buf] = await Promise.all([
    fetch(base + '.json').then((r) => r.json()),
    fetch(base + '.bin').then((r) => r.arrayBuffer()),
  ]);
  return { manifest, buf };
}

// Joint positions (rig/body space) measured from the skeleton, used to size the rig.
export function anatomyDims({ manifest }) {
  const J = manifest.joints;
  const hipY = J.hip[1];
  const hipZ = J.hip[2];
  // body space: hip centre sits at (0, 0.94, 0), like the rig
  const tf = (p, mirror = false) => [(mirror ? -p[0] : p[0]) * SCALE, (p[1] - hipY) * SCALE + 0.94, (p[2] - hipZ) * SCALE];
  const L = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  // stored joints are the character's right side (x < 0) -> mirror to the left (+x)
  const j = {};
  for (const k of ['shoulder', 'elbow', 'wrist', 'knuckle', 'hip', 'knee', 'ankle']) j[k] = tf(J[k], true);
  j.c7 = tf(J.c7);
  j.t12 = tf(J.t12);
  j.l3 = tf(J.l3);
  j.atlas = tf(J.atlas);
  return {
    j,
    tf,
    len: { upper: L(j.shoulder, j.elbow), fore: L(j.elbow, j.wrist), thigh: L(j.hip, j.knee), shin: L(j.knee, j.ankle), hand: L(j.wrist, j.knuckle) },
  };
}

// ------------------------------------------------------------------ colours
const FACE = {
  sclera: new THREE.Color(0xe8e2da),
  iris: new THREE.Color(0x3a2a22),
  brow: new THREE.Color(0x2a211c),
  hair: new THREE.Color(0x231b16),
  lip: new THREE.Color(0xb98272),
};

// MeshStandardMaterial with a per-vertex `glow` attribute: highlighted muscles emit a bit of
// their own colour so they stay bright in shadow.
function glowMaterial(params, shorts) {
  const m = new THREE.MeshStandardMaterial(params);
  // the two variants share this function's source, so give them distinct program keys
  m.customProgramCacheKey = () => (shorts ? 'glow-shorts' : 'glow');
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float glow;\nvarying float vGlow;' + (shorts ? '\nattribute vec3 bindPos;\nvarying vec3 vBind;' : ''))
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvGlow = glow;' + (shorts ? '\nvBind = bindPos;' : ''));
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vGlow;' + (shorts ? '\nvarying vec3 vBind;\n' + shorts : ''))
      .replace(
        '#include <color_fragment>',
        '#include <color_fragment>' + (shorts ? '\nfloat sm = shortsMask(vBind);\ndiffuseColor.rgb = mix(diffuseColor.rgb, mix(vec3(0.024, 0.03, 0.045), diffuseColor.rgb, min(1.0, vGlow * 3.0) * 0.8), sm);' : ''),
      )
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += vColor.rgb * vGlow;');
  };
  return m;
}

// fitted shorts: waist to mid-thigh, in rest-pose (bind) coordinates
const SHORTS_GLSL = `
float shortsMask(vec3 p) {
  float ax = abs(p.x);
  float top = 1.001 - 0.011 * tanh(p.z * 30.0);
  float bot = 0.69 + max(0.0, ax - 0.1) * 0.25;
  float e = 0.0015;
  return smoothstep(top + e, top - e, p.y) * smoothstep(bot - e, bot + e, p.y) * smoothstep(0.2, 0.19, ax);
}`;

export const TONES = {
  muscle: new THREE.Color(0xa8443c),
  fill: new THREE.Color(0x7c4440),
  bone: new THREE.Color(0xd9cfbd),
  skin: new THREE.Color(0xc49a84),
  shorts: new THREE.Color(0x2b3140),
};

// Bone segments used for skin weights. Each maps to the rig joint that moves it.
// r = rough radius of the body part (distance is measured from its surface).
function segments(d, rig) {
  const j = d.j;
  const mir = (p) => [-p[0], p[1], p[2]];
  const P = (o) => {
    const v = new THREE.Vector3();
    o.getWorldPosition(v);
    rig.group.worldToLocal(v);
    return v.toArray();
  };
  const spine = P(rig.J.spine);
  const chest = P(rig.J.chest);
  const neck = P(rig.J.neck);
  const head = P(rig.J.head);
  const segs = [
    { bone: 'root', a: [0, j.hip[1] - 0.05, 0], b: spine, r: 0.09, tag: 'pelvis' },
    { bone: 'spine', a: spine, b: chest, r: 0.09, tag: 'lumbar' },
    { bone: 'chest', a: chest, b: neck, r: 0.11, tag: 'thorax' },
    { bone: 'neck', a: neck, b: head, r: 0.04, tag: 'neck' },
    { bone: 'head', a: head, b: [head[0], head[1] + 0.2, head[2]], r: 0.07, tag: 'head' },
  ];
  for (const S of ['L', 'R']) {
    const f = S === 'L' ? (p) => p : mir;
    const toe = [j.ankle[0], 0.02, j.ankle[2] + 0.16];
    segs.push(
      { bone: 'sh' + S, a: f(j.shoulder), b: f(j.elbow), r: 0.035, tag: 'upperarm', side: S },
      { bone: 'el' + S, a: f(j.elbow), b: f(j.wrist), r: 0.028, tag: 'forearm', side: S },
      { bone: 'wr' + S, a: f(j.wrist), b: f([j.knuckle[0], j.knuckle[1] - 0.08, j.knuckle[2]]), r: 0.02, tag: 'hand', side: S },
      { bone: 'hip' + S, a: f(j.hip), b: f(j.knee), r: 0.06, tag: 'thigh', side: S },
      { bone: 'kn' + S, a: f(j.knee), b: f(j.ankle), r: 0.04, tag: 'shin', side: S },
      { bone: 'an' + S, a: f(j.ankle), b: f(toe), r: 0.03, tag: 'foot', side: S },
    );
  }
  return segs;
}

// which segment tags each region may be weighted to
const REGION = {
  trunk: ['pelvis', 'lumbar', 'thorax'],
  chest: ['lumbar', 'thorax'],
  shoulder: ['thorax', 'upperarm'],
  neckback: ['thorax', 'neck'],
  neck: ['thorax', 'neck', 'head'],
  head: ['neck', 'head'],
  arm: ['upperarm', 'forearm'],
  forearm: ['upperarm', 'forearm', 'hand'],
  hand: ['forearm', 'hand'],
  hip: ['lumbar', 'pelvis', 'thigh'],
  thigh: ['pelvis', 'thigh', 'shin'],
  shank: ['thigh', 'shin', 'foot'],
  foot: ['shin', 'foot'],
  // rigid bones
  'rigid:pelvis': ['pelvis'],
  'rigid:lumbar': ['lumbar'],
  'rigid:thorax': ['thorax'],
  'rigid:neck': ['neck'],
  'rigid:upperarm': ['upperarm'],
  'rigid:forearm': ['forearm'],
  'rigid:thigh': ['thigh'],
  'rigid:shin': ['shin'],
};
const BONE_REGION = {
  clavicle: 'rigid:thorax',
  scapula: 'rigid:thorax',
  humerus: 'rigid:upperarm',
  radius: 'rigid:forearm',
  ulna: 'rigid:forearm',
  hip_bone: 'rigid:pelvis',
  sacrum: 'rigid:pelvis',
  femur: 'rigid:thigh',
  patella: 'thigh',
  tibia: 'rigid:shin',
  fibula: 'rigid:shin',
};
function boneRegion(p) {
  if (BONE_REGION[p.id]) return BONE_REGION[p.id];
  if (/lumbar/.test(p.id)) return 'trunk';
  if (/cervical|atlas|axis/.test(p.id)) return 'neck';
  return 'chest'; // ribs, sternum, thoracic vertebrae
}

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const _tw = new THREE.Matrix4();
const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _p = new THREE.Vector3();
// Laplacian smoothing of skin weights over the mesh (keeps the 4 largest per vertex).
function smoothWeights(si, sw, idx, nv, nb, iters, pinned) {
  let W = new Float32Array(nv * nb);
  for (let i = 0; i < nv; i++) for (let k = 0; k < 4; k++) W[i * nb + si[i * 4 + k]] += sw[i * 4 + k];
  const W0 = W.slice();
  const adj = Array.from({ length: nv }, () => new Set());
  for (let i = 0; i < idx.length; i += 3) {
    const a = idx[i];
    const b = idx[i + 1];
    const c = idx[i + 2];
    adj[a].add(b).add(c);
    adj[b].add(a).add(c);
    adj[c].add(a).add(b);
  }
  const nbr = adj.map((x) => [...x]);
  for (let it = 0; it < iters; it++) {
    const N = new Float32Array(W.length);
    for (let i = 0; i < nv; i++) {
      const o = i * nb;
      const list = nbr[i];
      if (pinned && pinned[i]) {
        for (let b = 0; b < nb; b++) N[o + b] = W0[o + b];
        continue;
      }
      for (let b = 0; b < nb; b++) {
        let acc = W[o + b];
        for (const j of list) acc += W[j * nb + b];
        N[o + b] = acc / (list.length + 1);
      }
    }
    W = N;
  }
  for (let i = 0; i < nv; i++) {
    const o = i * nb;
    const order = [];
    for (let b = 0; b < nb; b++) if (W[o + b] > 1e-4) order.push([b, W[o + b]]);
    order.sort((x, y) => y[1] - x[1]);
    const top = order.slice(0, 4);
    const sum = top.reduce((t, e) => t + e[1], 0) || 1;
    for (let k = 0; k < 4; k++) {
      si[i * 4 + k] = top[k] ? top[k][0] : 0;
      sw[i * 4 + k] = top[k] ? top[k][1] / sum : 0;
    }
  }
}

function segT(p, s) {
  _a.fromArray(s.a);
  _b.fromArray(s.b);
  const ab = _b.sub(_a);
  return Math.min(1, Math.max(0, _p.copy(p).sub(_a).dot(ab) / ab.lengthSq()));
}
function segDist(p, s) {
  _a.fromArray(s.a);
  _b.fromArray(s.b);
  const ab = _b.sub(_a);
  const t = Math.min(1, Math.max(0, _p.copy(p).sub(_a).dot(ab) / ab.lengthSq()));
  return _p.copy(_a).addScaledVector(ab, t).distanceTo(p);
}

// ------------------------------------------------------------------ geometry
function decode(data, entry) {
  const { manifest, buf } = data;
  const q = new Uint16Array(buf, entry.pos, entry.nv * 3);
  const pos = new Float32Array(entry.nv * 3);
  const { bbMin, scale } = manifest;
  for (let i = 0; i < pos.length; i++) pos[i] = bbMin[i % 3] + q[i] * scale[i % 3];
  const idx = entry.big ? new Uint32Array(buf, entry.idx, entry.ni) : new Uint16Array(buf, entry.idx, entry.ni);
  return { pos, idx: new Uint32Array(idx) };
}

// Synthesised shells (BodyParts3D has no rectus abdominis or latissimus dorsi):
// cut a patch out of the torso skin, push it slightly inward and give it thickness.
function cropTris(g, keep) {
  const { pos, idx } = g;
  const out = [];
  for (let i = 0; i < idx.length; i += 3) {
    const a = idx[i] * 3;
    const b = idx[i + 1] * 3;
    const c = idx[i + 2] * 3;
    if (keep((pos[a] + pos[b] + pos[c]) / 3, (pos[a + 1] + pos[b + 1] + pos[c + 1]) / 3, (pos[a + 2] + pos[b + 2] + pos[c + 2]) / 3)) out.push(idx[i], idx[i + 1], idx[i + 2]);
  }
  return { pos, idx: new Uint32Array(out) };
}

// The source body is anatomically complete; flatten the groin to a smooth surface (it is
// covered by painted-on shorts in the demos).
function modesty(pos) {
  for (let i = 0; i < pos.length; i += 3) {
    const ax = Math.abs(pos[i]);
    const y = pos[i + 1];
    if (ax > 0.08 || y < 0.72 || y > 0.935 || pos[i + 2] < 0) continue;
    const cap = Math.max(0.02, 0.1 - Math.max(0, 0.93 - y) * 0.5) - Math.max(0, ax - 0.04) * 0.15;
    const w = smooth(0.08, 0.06, ax);
    if (pos[i + 2] > cap) pos[i + 2] = pos[i + 2] + (cap - pos[i + 2]) * w;
  }
}

// The skin is a closed shell with an outer and an inner surface; keep only triangles facing
// away from the body's vertical axis (the outer surface).
function outerSkin(src, cz = 0.01) {
  const { pos, idx } = src;
  const out = [];
  for (let i = 0; i < idx.length; i += 3) {
    const a = idx[i] * 3;
    const b = idx[i + 1] * 3;
    const c = idx[i + 2] * 3;
    const ux = pos[b] - pos[a];
    const uz = pos[b + 2] - pos[a + 2];
    const uy = pos[b + 1] - pos[a + 1];
    const vx = pos[c] - pos[a];
    const vy = pos[c + 1] - pos[a + 1];
    const vz = pos[c + 2] - pos[a + 2];
    const nx = uy * vz - uz * vy;
    const nz = ux * vy - uy * vx;
    const mx = (pos[a] + pos[b] + pos[c]) / 3;
    const mz = (pos[a + 2] + pos[b + 2] + pos[c + 2]) / 3 - cz;
    if (nx * mx + nz * mz > 0) out.push(idx[i], idx[i + 1], idx[i + 2]);
  }
  return { pos, idx: new Uint32Array(out) };
}

// Height field of the torso front: z of the outer skin at (x, y), smoothed.
function frontSampler(skin) {
  const { pos, idx } = skin;
  const X0 = -0.12;
  const Y0 = 0.85;
  const NX = 49;
  const NY = 61;
  const DX = 0.24 / (NX - 1);
  const DY = 0.6 / (NY - 1);
  const grid = new Float32Array(NX * NY).fill(-1);
  // rasterise front-facing triangles into the grid (max z wins)
  for (let i = 0; i < idx.length; i += 3) {
    const P = [idx[i] * 3, idx[i + 1] * 3, idx[i + 2] * 3];
    const zs = P.map((o) => pos[o + 2]);
    if (Math.min(...zs) < 0.02) continue;
    const xs = P.map((o) => pos[o]);
    const ys = P.map((o) => pos[o + 1]);
    const i0 = Math.max(0, Math.floor((Math.min(...xs) - X0) / DX));
    const i1 = Math.min(NX - 1, Math.ceil((Math.max(...xs) - X0) / DX));
    const j0 = Math.max(0, Math.floor((Math.min(...ys) - Y0) / DY));
    const j1 = Math.min(NY - 1, Math.ceil((Math.max(...ys) - Y0) / DY));
    for (let gi = i0; gi <= i1; gi++) {
      for (let gj = j0; gj <= j1; gj++) {
        const px = X0 + gi * DX;
        const py = Y0 + gj * DY;
        // barycentric
        const d = (ys[1] - ys[2]) * (xs[0] - xs[2]) + (xs[2] - xs[1]) * (ys[0] - ys[2]);
        if (Math.abs(d) < 1e-12) continue;
        const a = ((ys[1] - ys[2]) * (px - xs[2]) + (xs[2] - xs[1]) * (py - ys[2])) / d;
        const b = ((ys[2] - ys[0]) * (px - xs[2]) + (xs[0] - xs[2]) * (py - ys[2])) / d;
        const c = 1 - a - b;
        if (a < -1e-3 || b < -1e-3 || c < -1e-3) continue;
        const z = a * zs[0] + b * zs[1] + c * zs[2];
        const k = gj * NX + gi;
        if (z > grid[k]) grid[k] = z;
      }
    }
  }
  // fill holes + blur (removes the navel and small surface noise)
  for (let pass = 0; pass < 6; pass++) {
    const src = grid.slice();
    for (let j = 0; j < NY; j++) {
      for (let i = 0; i < NX; i++) {
        let s = 0;
        let n = 0;
        for (let dj = -2; dj <= 2; dj++) {
          for (let di = -2; di <= 2; di++) {
            const ii = i + di;
            const jj = j + dj;
            if (ii < 0 || jj < 0 || ii >= NX || jj >= NY) continue;
            const v = src[jj * NX + ii];
            if (v < 0) continue;
            s += v;
            n++;
          }
        }
        if (n) grid[j * NX + i] = s / n;
      }
    }
  }
  return (x, y) => {
    const fx = Math.min(NX - 1.001, Math.max(0, (x - X0) / DX));
    const fy = Math.min(NY - 1.001, Math.max(0, (y - Y0) / DY));
    const i = Math.floor(fx);
    const j = Math.floor(fy);
    const tx = fx - i;
    const ty = fy - j;
    const g = (a, b) => grid[b * NX + a];
    return (g(i, j) * (1 - tx) + g(i + 1, j) * tx) * (1 - ty) + (g(i, j + 1) * (1 - tx) + g(i + 1, j + 1) * tx) * ty;
  };
}

// Closed slab from a parametric front surface f(u, w) -> [x, y, z]; the back face is pushed
// `thick` along -z. `flip` reverses winding (for the mirrored side).
function gridSlab(NW, NU, thick, f, flip) {
  const pos = [];
  const idx = [];
  const at = (u, w) => u * (NW + 1) + w;
  for (let u = 0; u <= NU; u++) for (let w = 0; w <= NW; w++) pos.push(...f(u / NU, w / NW));
  const n = pos.length / 3;
  for (let i = 0; i < n; i++) pos.push(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2] - thick);
  const quad = (a, b, c, e) => (flip ? idx.push(a, c, b, a, e, c) : idx.push(a, b, c, a, c, e));
  for (let u = 0; u < NU; u++) {
    for (let w = 0; w < NW; w++) {
      const a = at(u, w);
      const b = at(u, w + 1);
      const c = at(u + 1, w + 1);
      const e = at(u + 1, w);
      quad(a, b, c, e);
      quad(a + n, e + n, c + n, b + n);
    }
  }
  // side walls
  for (let u = 0; u < NU; u++) {
    quad(at(u, 0), at(u + 1, 0), at(u + 1, 0) + n, at(u, 0) + n);
    quad(at(u, NW), at(u, NW) + n, at(u + 1, NW) + n, at(u + 1, NW));
  }
  for (let w = 0; w < NW; w++) {
    quad(at(0, w), at(0, w) + n, at(0, w + 1) + n, at(0, w + 1));
    quad(at(NU, w), at(NU, w + 1), at(NU, w + 1) + n, at(NU, w) + n);
  }
  return { pos: new Float32Array(pos), idx: new Uint32Array(idx) };
}

function shellPatch(src, keep, inset, thick, shape) {
  const { pos, idx } = src;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.computeVertexNormals();
  const nrm = g.attributes.normal.array;
  const tri = [];
  for (let i = 0; i < idx.length; i += 3) {
    let ok = true;
    for (let k = 0; k < 3; k++) {
      const o = idx[i + k] * 3;
      if (!keep(pos[o], pos[o + 1], pos[o + 2], nrm[o], nrm[o + 1], nrm[o + 2])) ok = false;
    }
    if (ok) tri.push(idx[i], idx[i + 1], idx[i + 2]);
  }
  const map = new Map();
  const outer = [];
  const on = [];
  const remap = (o) => {
    let n = map.get(o);
    if (n === undefined) {
      n = outer.length / 3;
      map.set(o, n);
      const x = pos[o * 3];
      const y = pos[o * 3 + 1];
      const z = pos[o * 3 + 2];
      const d = inset + (shape ? shape(x, y, z) : 0);
      outer.push(x - nrm[o * 3] * d, y - nrm[o * 3 + 1] * d, z - nrm[o * 3 + 2] * d);
      on.push(nrm[o * 3], nrm[o * 3 + 1], nrm[o * 3 + 2]);
    }
    return n;
  };
  const f = tri.map(remap);
  const n = outer.length / 3;
  // inner surface + side walls along the boundary
  const P = new Float32Array(n * 6);
  P.set(outer, 0);
  for (let i = 0; i < n; i++) for (let k = 0; k < 3; k++) P[(n + i) * 3 + k] = outer[i * 3 + k] - on[i * 3 + k] * thick;
  const I = [...f];
  for (let i = 0; i < f.length; i += 3) I.push(f[i] + n, f[i + 2] + n, f[i + 1] + n);
  const edges = new Map();
  for (let i = 0; i < f.length; i += 3) {
    for (let k = 0; k < 3; k++) {
      const a = f[i + k];
      const b = f[i + ((k + 1) % 3)];
      const key = a < b ? a + ',' + b : b + ',' + a;
      edges.set(key, edges.has(key) ? null : [a, b]);
    }
  }
  for (const e of edges.values()) {
    if (!e) continue;
    const [a, b] = e;
    I.push(b, a, a + n, b, a + n, b + n);
  }
  return { pos: P, idx: new Uint32Array(I) };
}

// ------------------------------------------------------------------ body
export class Body {
  constructor(data, rig) {
    this.data = data;
    this.rig = rig;
    this.dims = anatomyDims(data);
    this.group = new THREE.Group();
    this.parts = []; // { key, group, label, kind, side }
    this.partIndex = new Map(); // key -> [indices]
    this.meshes = [];
    this._build();
  }

  _build() {
    const { manifest } = this.data;
    const d = this.dims;
    const hipY = manifest.joints.hip[1];
    const hipZ = manifest.joints.hip[2];
    const toBody = (pos, mirror) => {
      for (let i = 0; i < pos.length; i += 3) {
        pos[i] = (mirror ? -pos[i] : pos[i]) * SCALE;
        pos[i + 1] = (pos[i + 1] - hipY) * SCALE + 0.94;
        pos[i + 2] = (pos[i + 2] - hipZ) * SCALE;
      }
    };

    this.rig.reset();
    this.rig.group.updateMatrixWorld(true);
    const segs = segments(d, this.rig);

    const buckets = { muscle: [], bone: [], skin: [], skinBody: [] };
    const addPart = (bucket, g, info) => {
      const pi = this.parts.length;
      this.parts.push(info);
      if (info.key) {
        if (!this.partIndex.has(info.key)) this.partIndex.set(info.key, []);
        this.partIndex.get(info.key).push(pi);
      }
      buckets[bucket].push({ g, pi, region: info.region });
    };

    let torso = null;
    for (const e of manifest.parts) {
      const base = decode(this.data, e);
      const sides = e.mirror ? ['R', 'L'] : ['M'];
      for (const side of sides) {
        const pos = side === 'R' || side === 'M' ? base.pos.slice() : base.pos.slice();
        const mirror = side === 'L';
        toBody(pos, mirror);
        const idx = base.idx.slice();
        if (mirror) for (let i = 0; i < idx.length; i += 3) [idx[i + 1], idx[i + 2]] = [idx[i + 2], idx[i + 1]];
        let g = { pos, idx };
        // the external oblique mesh includes its front aponeurosis, which would hide the six-pack
        if (e.id === 'ext_oblique') g = cropTris(g, (x, y, z) => !(Math.abs(x) < 0.078 && z > 0.02));
        if (e.kind === 'muscle') addPart('muscle', g, { key: e.id, group: e.group, label: e.label, kind: 'muscle', side, region: e.region });
        else if (e.kind === 'fill') addPart('muscle', g, { key: null, kind: 'fill', side, region: e.region });
        else if (e.kind === 'bone') addPart('bone', g, { key: null, kind: 'bone', side, region: boneRegion(e) });
        else if (e.kind === 'skin' && e.id === 'body') {
          modesty(g.pos);
          addPart('skinBody', g, { key: null, kind: 'skin', side, region: 'transfer' });
          torso = outerSkin(cropTris(g, (x, y) => Math.abs(x) < 0.21 && y > 0.85 && y < 1.5));
        } else if (e.kind === 'skin') addPart('skin', g, { key: null, kind: 'skin', side, region: e.region });
        else if (e.kind === 'face') addPart('skin', g, { key: null, kind: 'face', face: e.id, side, region: 'head' });
      }
    }

    // synthesised muscles
    if (torso) {
      // rectus abdominis: a parametric slab per side, laid over the (smoothed) front of the
      // torso, with one domed block per segment so the tendinous bands read as a six-pack
      const absTop = d.j.t12[1] + 0.075;
      const absBot = d.j.hip[1] - 0.02;
      const front = frontSampler(torso);
      for (const S of ['L', 'R']) {
        const sg = S === 'L' ? 1 : -1;
        const bands = [0, 0.4, 0.61, 0.8, 1]; // bottom (long lower block) .. top
        const slab = gridSlab(14, 56, 0.014, (u, w) => {
          // u: 0 bottom .. 1 top, w: 0 at the midline .. 1 at the outer edge
          const y = absBot + u * (absTop - absBot);
          const halfW = 0.032 + 0.05 * Math.sin(Math.min(1, u * 1.6) * Math.PI * 0.5); // narrow at the pubis
          const x = sg * (0.006 + w * halfW);
          let z = front(x, y) - 0.004;
          let k = 0;
          while (k < bands.length - 2 && u > bands[k + 1]) k++;
          const t = (u - bands[k]) / (bands[k + 1] - bands[k]);
          const dome = Math.pow(Math.sin(Math.PI * t), 0.6) * Math.pow(Math.sin(Math.PI * Math.min(1, w * 1.05)), 0.5);
          z += 0.0065 * dome - 0.002;
          // sink the outer, top and bottom edges into the body so the slab blends in
          const edge = Math.min((1 - w) / 0.22, u / 0.1, (1 - u) / 0.06, 1);
          z -= 0.013 * (1 - smooth(0, 1, edge)) + 0.003 * (1 - smooth(0, 0.12, w));
          return [x, y, z];
        }, sg < 0);
        addPart('muscle', slab, { key: 'rectus_abd', group: 'abs', label: 'Rectus abdominis', kind: 'muscle', side: S, region: 'trunk' });
      }

      // latissimus dorsi: wide sheet across the mid/lower back up into the armpit
      const lYt = d.j.shoulder[1] - 0.12;
      const lYb = d.j.hip[1] + 0.07;
      for (const S of ['L', 'R']) {
        const sg = S === 'L' ? 1 : -1;
        const lat = shellPatch(
          torso,
          (x, y, z, nx, ny, nz) => {
            const ax = x * sg;
            if (ax < 0.01) return false;
            if (y < lYb || y > lYt + 0.05) return false;
            const u = (y - lYb) / (lYt - lYb); // 0 bottom .. 1 top
            // medial border climbs from the spine (low) out to the scapula tip; leave the erectors exposed low down
            const inner = u < 0.18 ? 0.045 : 0.02 + Math.max(0, u - 0.55) * 0.18;
            const outer = 0.125 + u * 0.05;
            if (ax < inner || ax > outer) return false;
            if (u > 1 && ax < 0.12) return false;
            return nz < -0.05 || (ax > 0.1 && nz < 0.3);
          },
          0.005,
          0.014,
          (x, y) => {
            const u = (y - lYb) / (lYt - lYb);
            return Math.max(0, 0.35 - u) * 0.012;
          },
        );
        addPart('muscle', lat, { key: 'lat_dorsi', group: 'lats', label: 'Latissimus dorsi', kind: 'muscle', side: S, region: 'shoulder' });
      }
    }

    // build one skinned mesh per bucket
    // elP* = proximal forearm: follows the elbow but only part of the forearm twist, so
    // pronation/supination spreads along the forearm instead of wringing the elbow
    const boneNames = ['root', 'spine', 'chest', 'neck', 'head', 'shL', 'elL', 'wrL', 'shR', 'elR', 'wrR', 'hipL', 'knL', 'anL', 'hipR', 'knR', 'anR', 'elPL', 'elPR'];
    this.boneNames = boneNames;
    const segBone = segs.map((s) => boneNames.indexOf(s.bone));
    this.skeleton = this._skeleton(boneNames);

    const mats = {
      muscle: glowMaterial({ vertexColors: true, roughness: 0.55, metalness: 0.0 }),
      bone: new THREE.MeshStandardMaterial({ color: TONES.bone, roughness: 0.7 }),
      skin: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6 }),
      skinBody: glowMaterial({ vertexColors: true, roughness: 0.6, metalness: 0.0 }, SHORTS_GLSL),
    };
    this.mats = mats;

    const built = {};
    for (const [bucket, list] of Object.entries(buckets)) {
      if (!list.length) continue;
      let nv = 0;
      let ni = 0;
      for (const { g } of list) {
        nv += g.pos.length / 3;
        ni += g.idx.length;
      }
      const pos = new Float32Array(nv * 3);
      const nrm = new Float32Array(nv * 3);
      const idx = new Uint32Array(ni);
      const part = new Uint16Array(nv);
      const si = new Uint16Array(nv * 4);
      const sw = new Float32Array(nv * 4);
      let ov = 0;
      let oi = 0;
      const v = new THREE.Vector3();
      for (const { g, pi, region } of list) {
        const n = g.pos.length / 3;
        const tmp = new THREE.BufferGeometry();
        tmp.setAttribute('position', new THREE.BufferAttribute(g.pos, 3));
        tmp.setIndex(new THREE.BufferAttribute(g.idx, 1));
        tmp.computeVertexNormals();
        pos.set(g.pos, ov * 3);
        nrm.set(tmp.attributes.normal.array, ov * 3);
        for (let i = 0; i < g.idx.length; i++) idx[oi + i] = g.idx[i] + ov;
        part.fill(pi, ov, ov + n);
        if (region === 'transfer') {
          ov += n;
          oi += g.idx.length;
          continue;
        }
        const allowed = REGION[region] || REGION.trunk;
        const cand = segs.map((s, k) => (allowed.includes(s.tag) ? k : -1)).filter((k) => k >= 0);
        const rigid = region.startsWith('rigid:');
        for (let i = 0; i < n; i++) {
          v.fromArray(g.pos, i * 3);
          const side = v.x >= 0 ? 'L' : 'R';
          const ws = [];
          for (const k of cand) {
            const s = segs[k];
            if (s.side && s.side !== side) continue;
            const dd = Math.max(0, segDist(v, s) - s.r) + 0.006;
            ws.push([k, 1 / Math.pow(dd, 4)]);
          }
          if (region === 'shoulder') {
            // blend trunk -> upper arm by position relative to the shoulder joint, so the
            // pecs/delts/lats stretch smoothly instead of tearing between two bones
            const sh = d.j.shoulder;
            const lateral = Math.abs(v.x) - sh[0];
            const wv = smooth(sh[1] - 0.2, sh[1] - 0.1, v.y);
            const wArm = smooth(-0.06, 0.01, lateral) * Math.max(wv, smooth(-0.01, 0.03, lateral));
            let tsum = 0;
            for (const w of ws) if (segs[w[0]].tag !== 'upperarm') tsum += w[1];
            for (const w of ws) w[1] = segs[w[0]].tag === 'upperarm' ? wArm : ((1 - wArm) * w[1]) / (tsum || 1);
          }
          // segment weights -> bone weights (the forearm splits into proximal/distal)
          const bw = new Map();
          const addW = (b, w) => bw.set(b, (bw.get(b) || 0) + w);
          for (const [k, w] of ws) {
            const sg = segs[k];
            if (sg.tag === 'forearm') {
              const t = segT(v, sg);
              const wd = smooth(0.05, 0.95, t);
              addW(boneNames.indexOf('elP' + sg.side), w * (1 - wd));
              addW(segBone[k], w * wd);
            } else addW(segBone[k], w);
          }
          const top = [...bw.entries()].sort((a, b) => b[1] - a[1]).slice(0, rigid ? 2 : 4);
          const sum = top.reduce((s, w) => s + w[1], 0) || 1;
          for (let k = 0; k < 4; k++) {
            const w = top[k];
            si[(ov + i) * 4 + k] = w ? w[0] : 0;
            sw[(ov + i) * 4 + k] = w ? w[1] / sum : 0;
          }
        }
        ov += n;
        oi += g.idx.length;
      }
      if (bucket === 'skinBody') {
        this._transfer(pos, si, sw, part, built);
        // vertices on the cut to the head/hands/feet pieces take those pieces' weights,
        // so the seams never open
        const pinned = new Uint8Array(nv);
        const sk = built.skin;
        if (sk) {
          const key = (x, y, z) => `${Math.round(x * 2e4)},${Math.round(y * 2e4)},${Math.round(z * 2e4)}`;
          const at = new Map();
          for (let i = 0; i < sk.pos.length / 3; i++) {
            if (this.parts[sk.part[i]].kind !== 'skin') continue;
            at.set(key(sk.pos[i * 3], sk.pos[i * 3 + 1], sk.pos[i * 3 + 2]), i);
          }
          for (let i = 0; i < nv; i++) {
            const j = at.get(key(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]));
            if (j === undefined) continue;
            pinned[i] = 1;
            for (let k = 0; k < 4; k++) {
              si[i * 4 + k] = sk.si[j * 4 + k];
              sw[i * 4 + k] = sk.sw[j * 4 + k];
            }
          }
        }
        smoothWeights(si, sw, idx, nv, boneNames.length, 6, pinned);
      }
      built[bucket] = { pos, si, sw, part };
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
      geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4));
      geo.setAttribute('skinWeight', new THREE.BufferAttribute(sw, 4));
      geo.setIndex(new THREE.BufferAttribute(idx, 1));
      geo.userData.part = part;
      if (bucket === 'skin') {
        const c = new Float32Array(nv * 3);
        for (let i = 0; i < nv; i++) {
          const p = this.parts[part[i]];
          const t = p.kind === 'face' ? FACE[p.face] || TONES.skin : TONES.skin;
          c[i * 3] = t.r;
          c[i * 3 + 1] = t.g;
          c[i * 3 + 2] = t.b;
        }
        geo.setAttribute('color', new THREE.BufferAttribute(c, 3));
      }
      if (bucket === 'muscle' || bucket === 'skinBody') {
        geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(nv * 3), 3));
        geo.setAttribute('glow', new THREE.BufferAttribute(new Float32Array(nv), 1));
        // skin body: `part` holds the muscle under each skin vertex (0xffff = none)
        const pc = new Float32Array(nv * 3); // pick colours: part index + 1 encoded in RGB
        for (let i = 0; i < nv; i++) {
          const id = part[i] === 0xffff ? 0 : part[i] + 1;
          pc[i * 3] = (id & 255) / 255;
          pc[i * 3 + 1] = ((id >> 8) & 255) / 255;
          pc[i * 3 + 2] = 0;
        }
        geo.userData.pickColor = new THREE.BufferAttribute(pc, 3);
      }
      const mesh = new THREE.SkinnedMesh(geo, mats[bucket]);
      mesh.bind(this.skeleton, new THREE.Matrix4());
      mesh.frustumCulled = false;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData.bucket = bucket;
      this.group.add(mesh);
      this.meshes.push(mesh);
      if (bucket === 'skin') {
        this.skinPartsMesh = mesh;
        this._fist(geo, part);
        mesh.updateMorphTargets();
      }
      if (bucket === 'muscle') this.muscleMesh = mesh;
      if (bucket === 'skinBody') {
        this.skinMesh = mesh;
        // the flattened groin has crumpled triangles; give it smooth normals
        for (let i = 0; i < nv; i++) {
          const ax = Math.abs(pos[i * 3]);
          const y = pos[i * 3 + 1];
          if (pos[i * 3 + 2] < 0) continue;
          const w = smooth(0.085, 0.05, ax) * smooth(0.7, 0.75, y) * smooth(0.95, 0.91, y);
          if (w <= 0) continue;
          const tx = pos[i * 3] * 4;
          const ty = 0.35 - (0.93 - y) * 2.5;
          const tl = Math.hypot(tx, ty, 1);
          for (let k = 0; k < 3; k++) nrm[i * 3 + k] += ([tx, ty, 1][k] / tl - nrm[i * 3 + k]) * w;
        }
        // rest-pose position, used by the shader to draw the shorts with a clean edge
        geo.setAttribute('bindPos', new THREE.BufferAttribute(pos.slice(), 3));
      }
      if (bucket === 'bone') this.boneMesh = mesh;
    }
    this.setMode('explore');
    // slight per-muscle tone variation so neighbouring muscles read as separate shapes
    this.tones = this.parts.map((p, i) => {
      const base = p.kind === 'fill' ? TONES.fill : TONES.muscle;
      const h = Math.sin((p.key || 'x' + i).split('').reduce((a, c) => a * 31 + c.charCodeAt(0), 7)) * 0.5 + 0.5;
      return base.clone().offsetHSL((h - 0.5) * 0.018, 0, (h - 0.5) * 0.07);
    });
    this.paint(() => null);
  }

  // Skin of the torso/limbs: copy skin weights from the nearest muscle and bone vertices
  // (so it moves exactly like the anatomy underneath) and remember which muscle head lies
  // under each skin vertex, for painting worked muscles onto the skin in demos.
  _transfer(pos, si, sw, part, built) {
    const srcs = [built.muscle, built.bone].filter(Boolean);
    const C = 0.025;
    const grid = new Map();
    const key = (x, y, z) => `${x},${y},${z}`;
    srcs.forEach((src, s) => {
      for (let i = 0; i < src.pos.length / 3; i++) {
        const k = key(Math.floor(src.pos[i * 3] / C), Math.floor(src.pos[i * 3 + 1] / C), Math.floor(src.pos[i * 3 + 2] / C));
        let cell = grid.get(k);
        if (!cell) grid.set(k, (cell = []));
        cell.push(s, i);
      }
    });
    const n = pos.length / 3;
    const acc = new Map();
    const KS = 8;
    const samples = new Uint16Array(n * KS).fill(0xffff);
    this.skinSamples = samples;
    this.skinKS = KS;
    for (let i = 0; i < n; i++) {
      const x = pos[i * 3];
      const y = pos[i * 3 + 1];
      const z = pos[i * 3 + 2];
      const cx = Math.floor(x / C);
      const cy = Math.floor(y / C);
      const cz = Math.floor(z / C);
      const near = []; // [d2, src, idx]
      for (let r = 1; r <= 4 && near.length < 24; r++) {
        near.length = 0;
        for (let a = -r; a <= r; a++)
          for (let b = -r; b <= r; b++)
            for (let c = -r; c <= r; c++) {
              const cell = grid.get(key(cx + a, cy + b, cz + c));
              if (!cell) continue;
              for (let k = 0; k < cell.length; k += 2) {
                const src = srcs[cell[k]];
                const j = cell[k + 1];
                const dx = src.pos[j * 3] - x;
                const dy = src.pos[j * 3 + 1] - y;
                const dz = src.pos[j * 3 + 2] - z;
                near.push([dx * dx + dy * dy + dz * dz, cell[k], j]);
              }
            }
      }
      near.sort((p, q) => p[0] - q[0]);
      const k6 = near.slice(0, 6);
      acc.clear();
      for (const [d2, s, j] of k6) {
        const w = 1 / (d2 + 1e-5);
        const src = srcs[s];
        for (let q = 0; q < 4; q++) {
          const bw = src.sw[j * 4 + q];
          if (bw > 0) acc.set(src.si[j * 4 + q], (acc.get(src.si[j * 4 + q]) || 0) + bw * w);
        }
      }
      const top = [...acc.entries()].sort((p, q) => q[1] - p[1]).slice(0, 4);
      const sum = top.reduce((t, e) => t + e[1], 0) || 1;
      for (let q = 0; q < 4; q++) {
        si[i * 4 + q] = top[q] ? top[q][0] : 0;
        sw[i * 4 + q] = top[q] ? top[q][1] / sum : 0;
      }
      if (!top.length) sw[i * 4] = 1;
      // muscle heads under this point (selectable muscles only, within 5 cm): the nearest
      // one (for picking) plus a few samples for soft highlight blending
      part[i] = 0xffff;
      let c = 0;
      for (const [d2, s, j] of near) {
        if (d2 > 0.05 * 0.05 || c >= KS) break;
        if (s !== 0) continue;
        const pi = built.muscle.part[j];
        if (!this.parts[pi].key) continue;
        if (part[i] === 0xffff) part[i] = pi;
        samples[i * KS + c++] = pi;
      }
    }
  }

  // Morph target that curls the fingers around a handle. The handle axis sits at
  // C = knuckle + palmNormal * R; the rig's grip points are moved there so props
  // held in the hand end up inside the fist.
  _fist(geo, part) {
    const j = this.dims.j;
    const pos = geo.attributes.position.array;
    const delta = new Float32Array(pos.length);
    const R = 0.026;
    const frames = {};
    for (const S of ['L', 'R']) {
      const m = S === 'L' ? 1 : -1;
      const W = new THREE.Vector3(m * j.wrist[0], j.wrist[1], j.wrist[2]);
      const K = new THREE.Vector3(m * j.knuckle[0], j.knuckle[1], j.knuckle[2]);
      const d = K.clone().sub(W).normalize();
      const n = new THREE.Vector3(0, 0, 1);
      n.sub(d.clone().multiplyScalar(n.dot(d))).normalize(); // palm faces forward in the rest pose
      const a = d.clone().cross(n); // across the knuckles (thumb side is -a on the left hand)
      frames[S] = { K, d, n, a, m, C: K.clone().addScaledVector(n, R) };
    }
    this.fistFrames = frames;
    const v = new THREE.Vector3();
    for (let i = 0; i < part.length; i++) {
      if (this.parts[part[i]].region !== 'hand') continue;
      v.fromArray(pos, i * 3);
      const F = frames[v.x >= 0 ? 'L' : 'R'];
      const r = v.clone().sub(F.K);
      const s = r.dot(F.d);
      const h = r.dot(F.n);
      const l = r.dot(F.a) * F.m;
      // thumb: radial side near the knuckle line; it stays put
      if (l < -0.047 && s < 0.03) continue;
      if (s <= -0.01) continue;
      const fade = smooth(-0.01, 0.01, s);
      const hc = 0.005 + 0.45 * Math.max(0, s); // finger centreline (they are already slightly bent)
      const off = h - hc;
      const arc = Math.max(0, s) * 1.12;
      const phi = Math.min(3.7, arc / R);
      const rr = R - off;
      const target = F.C.clone()
        .addScaledVector(F.n, -rr * Math.cos(phi))
        .addScaledVector(F.d, rr * Math.sin(phi))
        .addScaledVector(F.a, r.dot(F.a))
        .addScaledVector(F.d, Math.min(0, s)); // keep the knuckle row in place
      const dv = target.sub(v).multiplyScalar(fade);
      delta[i * 3] = dv.x;
      delta[i * 3 + 1] = dv.y;
      delta[i * 3 + 2] = dv.z;
    }
    geo.morphAttributes.position = [new THREE.BufferAttribute(delta, 3)];
    geo.morphTargetsRelative = true;
  }

  // 0 = open hand, 1 = closed around a handle
  setGrip(k) {
    if (this.skinPartsMesh?.morphTargetInfluences) this.skinPartsMesh.morphTargetInfluences[0] = k;
  }

  // Where a held handle's centre sits, in the rig's wrist-joint space.
  gripLocal(S) {
    const i = this.boneNames.indexOf('wr' + S);
    return this.fistFrames[S].C.clone().applyMatrix4(this.skeleton.boneInverses[i]);
  }

  // explore: muscles + bones (with skin only on head/hands/feet); demo: a full skinned body
  setMode(mode) {
    this.mode = mode;
    const demo = mode === 'demo';
    if (this.muscleMesh) this.muscleMesh.visible = !demo;
    if (this.boneMesh) this.boneMesh.visible = !demo;
    if (this.skinMesh) this.skinMesh.visible = demo;
  }

  // Bones are driven straight from the rig: bone world = rig joint world.
  // Inverse bind = inverse(T(anatomy joint) * R), where R turns the rig's straight-down limb
  // into the anatomy's resting limb direction (arms slightly out, palms forward).
  _skeleton(names) {
    const d = this.dims;
    const rig = this.rig;
    const bones = [];
    const inv = [];
    const v = new THREE.Vector3();
    const down = new THREE.Vector3(0, -1, 0);
    const rest = {};
    for (const n of names) {
      if (!rig.J[n]) continue;
      rig.J[n].getWorldPosition(v);
      rig.group.worldToLocal(v);
      rest[n] = v.clone();
    }
    const j = d.j;
    const mir = (p, S) => new THREE.Vector3(S === 'L' ? p[0] : -p[0], p[1], p[2]);
    const anat = { ...rest };
    const dir = {};
    for (const S of ['L', 'R']) {
      anat['sh' + S] = mir(j.shoulder, S);
      anat['el' + S] = mir(j.elbow, S);
      anat['elP' + S] = anat['el' + S];
      anat['wr' + S] = mir(j.wrist, S);
      anat['hip' + S] = mir(j.hip, S);
      anat['kn' + S] = mir(j.knee, S);
      anat['an' + S] = mir(j.ankle, S);
      dir['sh' + S] = [anat['sh' + S], anat['el' + S]];
      dir['el' + S] = [anat['el' + S], anat['wr' + S]];
      dir['elP' + S] = dir['el' + S];
      dir['wr' + S] = [anat['wr' + S], mir([j.knuckle[0], j.knuckle[1] - 0.02, j.knuckle[2]], S)];
      dir['hip' + S] = [anat['hip' + S], anat['kn' + S]];
      dir['kn' + S] = [anat['kn' + S], anat['an' + S]];
    }
    this.anatJoints = anat;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    for (const n of names) {
      const b = new THREE.Bone();
      b.name = n;
      b.matrixAutoUpdate = false;
      b.matrixWorldAutoUpdate = false;
      bones.push(b);
      q.identity();
      if (dir[n]) {
        const [a, c] = dir[n];
        q.setFromUnitVectors(down, c.clone().sub(a).normalize());
        // forearm + hand: the anatomy is palms-forward; the rig's zero pose is palms-in
        if (/^(el|wr)/.test(n)) {
          const S = n.slice(-1);
          q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), S === 'L' ? Math.PI / 2 : -Math.PI / 2));
        }
      }
      m.compose(anat[n], q, new THREE.Vector3(1, 1, 1));
      inv.push(m.clone().invert());
    }
    this.bones = bones;
    return new THREE.Skeleton(bones, inv);
  }

  // copy rig joint transforms (rig group space -> world) onto the skeleton
  update() {
    const rig = this.rig;
    rig.group.updateMatrixWorld(true);
    for (let i = 0; i < this.bones.length; i++) {
      const n = this.boneNames[i];
      if (n.startsWith('elP')) {
        // keep only 20% of the twist away from the anatomy's palms-forward rest
        const S = n.slice(-1);
        const rest = S === 'L' ? Math.PI / 2 : -Math.PI / 2;
        const tw = rig.J['el' + S].rotation.y - rest;
        _tw.makeRotationY(-0.8 * tw);
        this.bones[i].matrixWorld.multiplyMatrices(rig.J['el' + S].matrixWorld, _tw);
      } else this.bones[i].matrixWorld.copy(rig.J[n].matrixWorld);
    }
  }

  // colorFor(partInfo, index) -> null (default) | THREE.Color | [THREE.Color, glow 0..1]
  paint(colorFor) {
    const res = this.parts.map((p, i) => {
      const r = colorFor(p, i);
      if (!r) return null;
      return Array.isArray(r) ? r : [r, 0];
    });
    {
      const geo = this.muscleMesh.geometry;
      const col = geo.attributes.color.array;
      const glow = geo.attributes.glow.array;
      const part = geo.userData.part;
      for (let i = 0; i < part.length; i++) {
        const r = res[part[i]];
        const c = r ? r[0] : this.tones[part[i]];
        col[i * 3] = c.r;
        col[i * 3 + 1] = c.g;
        col[i * 3 + 2] = c.b;
        glow[i] = r ? r[1] : 0;
      }
      geo.attributes.color.needsUpdate = true;
      geo.attributes.glow.needsUpdate = true;
    }
    if (this.skinMesh) {
      // skin: blend highlight colours over the skin tone, from several muscle samples per
      // vertex, then smooth once over the mesh so the painted regions have soft edges
      const geo = this.skinMesh.geometry;
      const col = geo.attributes.color.array;
      const glow = geo.attributes.glow.array;
      const nv = geo.attributes.position.count;
      const KS = this.skinKS;
      const smp = this.skinSamples;
      const sk = TONES.skin;
      const tmp = this._skinTmp || (this._skinTmp = new Float32Array(nv * 4));
      for (let i = 0; i < nv; i++) {
        let r = 0;
        let g = 0;
        let b = 0;
        let gl = 0;
        let n = 0;
        for (let k = 0; k < KS; k++) {
          const pi = smp[i * KS + k];
          if (pi === 0xffff) break;
          n++;
          const h = res[pi];
          if (h && h[1] > 0) {
            r += h[0].r;
            g += h[0].g;
            b += h[0].b;
            gl += h[1];
          } else {
            r += sk.r;
            g += sk.g;
            b += sk.b;
          }
        }
        if (!n) {
          tmp.set([sk.r, sk.g, sk.b, 0], i * 4);
          continue;
        }
        tmp[i * 4] = r / n;
        tmp[i * 4 + 1] = g / n;
        tmp[i * 4 + 2] = b / n;
        tmp[i * 4 + 3] = gl / n;
      }
      const nb = this._skinNeighbours(geo);
      for (let i = 0; i < nv; i++) {
        let r = tmp[i * 4];
        let g = tmp[i * 4 + 1];
        let b = tmp[i * 4 + 2];
        let gl = tmp[i * 4 + 3];
        let n = 1;
        for (let k = nb.start[i]; k < nb.start[i + 1]; k++) {
          const j = nb.list[k];
          r += tmp[j * 4];
          g += tmp[j * 4 + 1];
          b += tmp[j * 4 + 2];
          gl += tmp[j * 4 + 3];
          n++;
        }
        // push the blend toward the highlight a little so small regions still read
        const t = Math.min(1, (gl / n) * 3.2);
        const k = (0.4 + 0.6 * t) / n;
        col[i * 3] = sk.r + (r - sk.r * n) * k;
        col[i * 3 + 1] = sk.g + (g - sk.g * n) * k;
        col[i * 3 + 2] = sk.b + (b - sk.b * n) * k;
        glow[i] = (gl / n) * 0.8;
      }
      geo.attributes.color.needsUpdate = true;
      geo.attributes.glow.needsUpdate = true;
    }
  }

  _skinNeighbours(geo) {
    if (this._nb) return this._nb;
    const nv = geo.attributes.position.count;
    const idx = geo.index.array;
    const sets = Array.from({ length: nv }, () => new Set());
    for (let i = 0; i < idx.length; i += 3) {
      const a = idx[i];
      const b = idx[i + 1];
      const c = idx[i + 2];
      sets[a].add(b).add(c);
      sets[b].add(a).add(c);
      sets[c].add(a).add(b);
    }
    const start = new Uint32Array(nv + 1);
    for (let i = 0; i < nv; i++) start[i + 1] = start[i] + sets[i].size;
    const list = new Uint32Array(start[nv]);
    for (let i = 0; i < nv; i++) list.set([...sets[i]], start[i]);
    return (this._nb = { start, list });
  }

  // GPU picking: render part ids around the pointer and take the nearest clickable pixel,
  // so taps on a bone, tendon or a thin gap still select the muscle right next to it.
  pick(renderer, camera, x, y, w, h, radius = 12) {
    const R = Math.round(radius);
    const N = 2 * R + 1;
    if (!this._pickRT || this._pickN !== N) {
      this._pickRT?.dispose();
      this._pickRT = new THREE.WebGLRenderTarget(N, N);
      this._pickN = N;
      this._pickBuf = new Uint8Array(N * N * 4);
      this._pickMat = new THREE.MeshBasicMaterial({ vertexColors: true });
      this._blackMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
      this._pickScene = new THREE.Scene();
    }
    const target = this.mode === 'demo' ? this.skinMesh : this.muscleMesh;
    const geo = target.geometry;
    const color = geo.attributes.color;
    geo.setAttribute('color', geo.userData.pickColor);
    const others = this.meshes.filter((m) => m !== target && m.visible);
    const prevMat = target.material;
    target.material = this._pickMat;
    const prevOther = others.map((o) => o.material);
    others.forEach((o) => (o.material = this._blackMat));

    const parent = this.group.parent;
    this._pickScene.add(this.group);
    camera.setViewOffset(w, h, x - R, y - R, N, N);
    const prevTarget = renderer.getRenderTarget();
    const prevClear = renderer.getClearColor(new THREE.Color());
    const prevAlpha = renderer.getClearAlpha();
    const tm = renderer.toneMapping;
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.setRenderTarget(this._pickRT);
    renderer.setClearColor(0x000000, 1);
    renderer.clear();
    renderer.render(this._pickScene, camera);
    renderer.readRenderTargetPixels(this._pickRT, 0, 0, N, N, this._pickBuf);
    renderer.setRenderTarget(prevTarget);
    renderer.setClearColor(prevClear, prevAlpha);
    renderer.toneMapping = tm;
    camera.clearViewOffset();
    parent?.add(this.group);
    target.material = prevMat;
    others.forEach((o, i) => (o.material = prevOther[i]));
    geo.setAttribute('color', color);

    const b = this._pickBuf;
    let best = null;
    let bestD = Infinity;
    for (let py = 0; py < N; py++) {
      for (let px = 0; px < N; px++) {
        const o = (py * N + px) * 4;
        const id = b[o] + (b[o + 1] << 8) - 1;
        if (id < 0 || id >= this.parts.length || !this.parts[id].key) continue;
        const d = (px - R) * (px - R) + (py - R) * (py - R);
        if (d < bestD && d <= R * R) {
          bestD = d;
          best = this.parts[id];
        }
      }
    }
    return best;
  }

  dispose() {
    this.group.parent?.remove(this.group);
    this.meshes.forEach((m) => m.geometry.dispose());
    Object.values(this.mats).forEach((m) => m.dispose());
    this._pickRT?.dispose();
  }
}
