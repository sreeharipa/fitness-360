// Builds assets/anatomy.bin + assets/anatomy.json from BodyParts3D 4.0 OBJ files.
//
//   node tools/build-anatomy.mjs <path to isa_BP3D_4.0_obj_99 folder>
//
// Needs `meshoptimizer` (npm i meshoptimizer@0.22.0) resolvable from the working dir or NODE_PATH.
// Source data: BodyParts3D, (c) The Database Center for Life Science, CC BY 4.0.
//
// Output coordinates: meters, Y up, character faces +Z, character's left is +X, feet at y = 0.
// Right-side structures are stored once and mirrored to the left at runtime (`mirror: true`).
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(path.join(process.cwd(), 'x.js'));
const { MeshoptSimplifier } = require('meshoptimizer');
await MeshoptSimplifier.ready;

const SRC = process.argv[2];
if (!SRC) throw new Error('usage: node tools/build-anatomy.mjs <obj folder>');
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets');

// ------------------------------------------------------------------ index source files
const byName = new Map();
for (const f of fs.readdirSync(SRC)) {
  if (!f.endsWith('.obj')) continue;
  const head = fs.readFileSync(path.join(SRC, f), 'utf8').slice(0, 1500);
  const m = head.match(/# English name : (.*)/);
  if (!m) continue;
  const name = m[1].trim();
  if (!byName.has(name)) byName.set(name, []);
  byName.get(name).push(f);
}
const files = (name) => {
  const l = byName.get(name);
  if (!l) throw new Error('missing: ' + name);
  return l;
};

// ------------------------------------------------------------------ selection
// [group, partKey, label, sourceName(s), region]
// sourceName uses "right" — the right-side mesh is used and mirrored. region drives skin weights.
const M = [
  ['chest', 'pec_clav', 'Clavicular head (upper chest)', 'Clavicular part of right pectoralis major', 'shoulder'],
  ['chest', 'pec_stern', 'Sternocostal head (mid chest)', 'Sternocostal part of right pectoralis major', 'shoulder'],
  ['chest', 'pec_abd', 'Abdominal head (lower chest)', 'Abdominal part of right pectoralis major', 'shoulder'],
  ['chest', 'pec_minor', 'Pectoralis minor', 'Right pectoralis minor', 'chest'],

  ['shoulders', 'delt_front', 'Anterior deltoid (front delt)', 'Clavicular part of right deltoid', 'shoulder'],
  ['shoulders', 'delt_side', 'Lateral deltoid (side delt)', 'Acromial part of right deltoid', 'shoulder'],
  ['shoulders', 'delt_rear', 'Posterior deltoid (rear delt)', 'Spinal part of right deltoid', 'shoulder'],

  ['rotator_cuff', 'supraspinatus', 'Supraspinatus', 'Right supraspinatus', 'shoulder'],
  ['rotator_cuff', 'infraspinatus', 'Infraspinatus', 'Right infraspinatus muscle', 'shoulder'],
  ['rotator_cuff', 'teres_minor', 'Teres minor', 'Right teres minor', 'shoulder'],
  ['rotator_cuff', 'subscapularis', 'Subscapularis', 'Right subscapularis', 'shoulder'],

  ['biceps', 'biceps_long', 'Long head (outer)', 'Long head of right biceps brachii', 'arm'],
  ['biceps', 'biceps_short', 'Short head (inner)', 'Short head of right biceps brachii', 'arm'],
  ['biceps', 'brachialis', 'Brachialis', 'Right brachialis', 'arm'],
  ['biceps', 'coracobrachialis', 'Coracobrachialis', 'Right coracobrachialis', 'shoulder'],

  ['triceps', 'triceps_long', 'Long head', 'Long head of right triceps brachii', 'arm'],
  ['triceps', 'triceps_lat', 'Lateral head', 'Lateral head of right triceps brachii', 'arm'],
  ['triceps', 'triceps_med', 'Medial head', 'Medial head of right triceps brachii', 'arm'],

  ['forearms', 'brachioradialis', 'Brachioradialis', 'Right brachioradialis', 'forearm'],
  ['forearms', 'pronator_hum', 'Pronator teres (humeral head)', 'Humeral head of right pronator teres', 'forearm'],
  ['forearms', 'pronator_uln', 'Pronator teres (ulnar head)', 'Ulnar head of right pronator teres', 'forearm'],
  ['forearms', 'fcr', 'Flexor carpi radialis', 'Right flexor carpi radialis', 'forearm'],
  ['forearms', 'palmaris', 'Palmaris longus', 'Right palmaris longus', 'forearm'],
  ['forearms', 'fcu_hum', 'Flexor carpi ulnaris (humeral head)', 'Humeral head of right flexor carpi ulnaris', 'forearm'],
  ['forearms', 'fcu_uln', 'Flexor carpi ulnaris (ulnar head)', 'Ulnar head of right flexor carpi ulnaris', 'forearm'],
  ['forearms', 'fds', 'Flexor digitorum superficialis', 'Right flexor digitorum superficialis', 'forearm'],
  ['forearms', 'ecrl', 'Extensor carpi radialis longus', 'Right extensor carpi radialis longus', 'forearm'],
  ['forearms', 'ecrb', 'Extensor carpi radialis brevis', 'Right extensor carpi radialis brevis', 'forearm'],
  ['forearms', 'ext_dig', 'Extensor digitorum', 'Right extensor digitorum', 'forearm'],
  ['forearms', 'edm', 'Extensor digiti minimi', 'Right extensor digiti minimi', 'forearm'],
  ['forearms', 'ecu', 'Extensor carpi ulnaris', 'Right extensor carpi ulnaris', 'forearm'],
  ['forearms', 'epl', 'Extensor pollicis longus', 'Right extensor pollicis longus', 'forearm'],
  ['forearms', 'epb', 'Extensor pollicis brevis', 'Right extensor pollicis brevis', 'forearm'],

  ['obliques', 'ext_oblique', 'External oblique', 'Right external oblique', 'trunk'],
  ['serratus', 'serratus', 'Serratus anterior', 'Right serratus anterior', 'chest'],

  ['traps', 'trap_upper', 'Upper trapezius (descending)', 'Descending part of right trapezius', 'neckback'],
  ['traps', 'trap_mid', 'Middle trapezius (transverse)', 'Transverse part of right trapezius', 'chest'],
  ['traps', 'trap_lower', 'Lower trapezius (ascending)', 'Ascending part of right trapezius', 'chest'],

  ['upper_back', 'rhomboid_major', 'Rhomboid major', 'Right rhomboid major', 'chest'],
  ['upper_back', 'rhomboid_minor', 'Rhomboid minor', 'Right rhomboid minor', 'chest'],
  ['upper_back', 'levator_scap', 'Levator scapulae', 'Right levator scapulae', 'neckback'],

  ['lats', 'teres_major', 'Teres major', 'Right teres major', 'shoulder'],

  ['lower_back', 'ilio_lumb', 'Iliocostalis lumborum', 'Right iliocostalis lumborum', 'trunk'],
  ['lower_back', 'ilio_thor', 'Iliocostalis thoracis', 'Right iliocostalis thoracis', 'trunk'],
  ['lower_back', 'longissimus', 'Longissimus thoracis', 'Right longissimus thoracis', 'trunk'],
  ['lower_back', 'spinalis', 'Spinalis thoracis', 'Right spinalis thoracis', 'trunk'],

  ['glutes', 'glute_max', 'Gluteus maximus', 'Right gluteus maximus', 'hip'],
  ['glutes', 'glute_med', 'Gluteus medius', 'Right gluteus medius', 'hip'],
  ['glutes', 'glute_min', 'Gluteus minimus', 'Right gluteus minimus', 'hip'],

  ['hip_flexors', 'iliacus', 'Iliacus', 'Right iliacus', 'hip'],
  ['hip_flexors', 'psoas', 'Psoas major', 'Right psoas major', 'hip'],
  ['hip_flexors', 'sartorius', 'Sartorius', 'Right sartorius', 'thigh'],
  ['hip_flexors', 'tfl', 'Tensor fasciae latae', 'Right tensor fasciae latae', 'hip'],

  ['adductors', 'add_longus', 'Adductor longus', 'Right adductor longus', 'thigh'],
  ['adductors', 'add_brevis', 'Adductor brevis', 'Right adductor brevis', 'thigh'],
  ['adductors', 'add_magnus', 'Adductor magnus', 'Right adductor magnus', 'thigh'],
  ['adductors', 'gracilis', 'Gracilis', 'Right gracilis', 'thigh'],
  ['adductors', 'pectineus', 'Pectineus', 'Right pectineus', 'hip'],

  ['quads', 'rectus_fem', 'Rectus femoris', 'Right rectus femoris', 'thigh'],
  ['quads', 'vastus_lat', 'Vastus lateralis', 'Right vastus lateralis', 'thigh'],
  ['quads', 'vastus_med', 'Vastus medialis (teardrop)', 'Right vastus medialis', 'thigh'],
  ['quads', 'vastus_int', 'Vastus intermedius', 'Right vastus intermedius', 'thigh'],

  ['hamstrings', 'bf_long', 'Biceps femoris (long head)', 'Long head of right biceps femoris', 'thigh'],
  ['hamstrings', 'bf_short', 'Biceps femoris (short head)', 'Short head of right biceps femoris', 'thigh'],
  ['hamstrings', 'semitend', 'Semitendinosus', 'Right semitendinosus', 'thigh'],
  ['hamstrings', 'semimem', 'Semimembranosus', 'Right semimembranosus', 'thigh'],

  ['calves', 'gastroc_med', 'Gastrocnemius (medial head)', 'Medial head of right gastrocnemius', 'shank'],
  ['calves', 'gastroc_lat', 'Gastrocnemius (lateral head)', 'Lateral head of right gastrocnemius', 'shank'],
  ['calves', 'soleus', 'Soleus', 'Right soleus', 'shank'],
  ['calves', 'plantaris', 'Plantaris', 'Right plantaris', 'shank'],

  ['shins', 'tib_ant', 'Tibialis anterior', 'Right tibialis anterior', 'shank'],
  ['shins', 'edl', 'Extensor digitorum longus', 'Right extensor digitorum longus', 'shank'],
  ['shins', 'ehl', 'Extensor hallucis longus', 'Right extensor hallucis longus', 'shank'],
  ['shins', 'fib_long', 'Fibularis longus', 'Right fibularis longus', 'shank'],
  ['shins', 'fib_brev', 'Fibularis brevis', 'Right fibularis brevis', 'shank'],

  ['neck', 'scm', 'Sternocleidomastoid', 'Right sternocleidomastoid', 'neck'],
];

// Non-selectable muscle tissue that fills gaps (shown in a muted tone).
const FILL = [
  ['External intercostal muscle', 'chest', true],
  ['Right iliotibial tract', 'thigh', false],
  ['Right scalenus anterior', 'neck', false],
  ['Right scalenus medius', 'neck', false],
  ['Right scalenus posterior', 'neck', false],
  ['Right splenius capitis', 'neck', false],
  ['Right semispinalis capitis', 'neck', false],
  ['Right sternohyoid', 'neck', false],
  ['Right omohyoid', 'neck', false],
  ['Right tibialis posterior', 'shank', false],
  ['Right flexor digitorum longus', 'shank', false],
  ['Right flexor hallucis longus', 'shank', false],
  ['Right quadratus femoris', 'hip', false],
  ['Right obturator internus', 'hip', false],
  ['Right piriformis', 'hip', false],
  ['Right extensor indicis', 'forearm', false],
  ['Right abductor pollicis longus', 'forearm', false],
  ['Right flexor pollicis longus', 'forearm', false],
  ['Right flexor digitorum profundus', 'forearm', false],
  ['Right supinator', 'forearm', false],
  ['Right anconeus', 'forearm', false],
  ['Right serratus posterior inferior', 'trunk', false],
  ['Right quadratus lumborum', 'trunk', false],
  ['Diaphragm', 'trunk', true],
];

// Bones (ivory). [name, region, midline?]
const BONES = [];
const pairBones = ['clavicle', 'scapula', 'humerus', 'radius', 'ulna', 'hip bone', 'femur', 'patella', 'tibia', 'fibula'];
for (const b of pairBones) BONES.push(['Right ' + b, null, false]);
const ordinals = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth'];
ordinals.forEach((o) => BONES.push([`Right ${o} rib`, 'chest', false]));
ordinals.slice(0, 7).forEach((o) => BONES.push([`Right ${o} costal cartilage`, 'chest', false]));
['Manubrium', 'Body of sternum', 'Xiphoid process', 'Sacrum', 'Coccyx', 'Atlas', 'Axis'].forEach((n) => BONES.push([n, null, true]));
ordinals.slice(2, 7).forEach((o) => BONES.push([`${cap(o)} cervical vertebra`, 'neck', true]));
ordinals.forEach((o) => BONES.push([`${cap(o)} thoracic vertebra`, 'chest', true]));
ordinals.slice(0, 5).forEach((o) => BONES.push([`${cap(o)} lumbar vertebra`, 'trunk', true]));
function cap(s) {
  return s[0].toUpperCase() + s.slice(1);
}

// ------------------------------------------------------------------ geometry helpers
function readObj(file) {
  const txt = fs.readFileSync(path.join(SRC, file), 'utf8');
  const v = [];
  const f = [];
  for (const line of txt.split('\n')) {
    if (line.startsWith('v ')) {
      const p = line.split(/\s+/);
      // mm Z-up (front = -Y)  ->  m Y-up (front = +Z)
      v.push(+p[1] / 1000, +p[3] / 1000, -p[2] / 1000);
    } else if (line.startsWith('f ')) {
      const p = line.trim().split(/\s+/).slice(1).map((s) => parseInt(s, 10) - 1);
      for (let i = 1; i + 1 < p.length; i++) f.push(p[0], p[i], p[i + 1]);
    }
  }
  return { pos: new Float32Array(v), idx: new Uint32Array(f) };
}

function merge(list) {
  let nv = 0;
  let ni = 0;
  for (const g of list) {
    nv += g.pos.length;
    ni += g.idx.length;
  }
  const pos = new Float32Array(nv);
  const idx = new Uint32Array(ni);
  let ov = 0;
  let oi = 0;
  for (const g of list) {
    pos.set(g.pos, ov);
    for (let i = 0; i < g.idx.length; i++) idx[oi + i] = g.idx[i] + ov / 3;
    ov += g.pos.length;
    oi += g.idx.length;
  }
  return { pos, idx };
}

// Weld identical vertices so the simplifier can collapse edges.
function weld(g, eps = 1e-5) {
  const map = new Map();
  const remap = new Uint32Array(g.pos.length / 3);
  const out = [];
  for (let i = 0; i < g.pos.length / 3; i++) {
    const k = `${Math.round(g.pos[i * 3] / eps)},${Math.round(g.pos[i * 3 + 1] / eps)},${Math.round(g.pos[i * 3 + 2] / eps)}`;
    let j = map.get(k);
    if (j === undefined) {
      j = out.length / 3;
      map.set(k, j);
      out.push(g.pos[i * 3], g.pos[i * 3 + 1], g.pos[i * 3 + 2]);
    }
    remap[i] = j;
  }
  const idx = [];
  for (let i = 0; i < g.idx.length; i += 3) {
    const a = remap[g.idx[i]];
    const b = remap[g.idx[i + 1]];
    const c = remap[g.idx[i + 2]];
    if (a !== b && b !== c && a !== c) idx.push(a, b, c);
  }
  return { pos: new Float32Array(out), idx: new Uint32Array(idx) };
}

function simplify(g, ratio, err) {
  const target = Math.max(60, Math.floor((g.idx.length / 3) * ratio)) * 3;
  if (target >= g.idx.length) return g;
  const [idx] = MeshoptSimplifier.simplify(g.idx, g.pos, 3, target, err, ['LockBorder']);
  return compact({ pos: g.pos, idx });
}

function compact(g) {
  const remap = new Int32Array(g.pos.length / 3).fill(-1);
  const pos = [];
  const idx = new Uint32Array(g.idx.length);
  for (let i = 0; i < g.idx.length; i++) {
    const o = g.idx[i];
    if (remap[o] < 0) {
      remap[o] = pos.length / 3;
      pos.push(g.pos[o * 3], g.pos[o * 3 + 1], g.pos[o * 3 + 2]);
    }
    idx[i] = remap[o];
  }
  return { pos: new Float32Array(pos), idx };
}

function load(names) {
  const list = [];
  for (const n of [].concat(names)) for (const f of files(n)) if (!/M\.obj$/.test(f) || files(n).length === 1) list.push(readObj(f));
  return weld(merge(list));
}

// Keep only the triangles that pass `keep(cx, cy, cz)` (centroid test).
function crop(g, keep) {
  const idx = [];
  for (let i = 0; i < g.idx.length; i += 3) {
    const a = g.idx[i] * 3;
    const b = g.idx[i + 1] * 3;
    const c = g.idx[i + 2] * 3;
    const cx = (g.pos[a] + g.pos[b] + g.pos[c]) / 3;
    const cy = (g.pos[a + 1] + g.pos[b + 1] + g.pos[c + 1]) / 3;
    const cz = (g.pos[a + 2] + g.pos[b + 2] + g.pos[c + 2]) / 3;
    if (keep(cx, cy, cz)) idx.push(g.idx[i], g.idx[i + 1], g.idx[i + 2]);
  }
  return compact({ pos: g.pos, idx: new Uint32Array(idx) });
}

// ------------------------------------------------------------------ build parts
const parts = [];
const add = (p, g) => {
  parts.push({ ...p, g });
  process.stdout.write(`${p.kind} ${p.id}: ${g.idx.length / 3} tris\n`);
};

// floor offset from the skin
const skinRaw = load('Skin');
let minY = Infinity;
for (let i = 1; i < skinRaw.pos.length; i += 3) minY = Math.min(minY, skinRaw.pos[i]);
const shiftY = -minY;
const shift = (g) => {
  for (let i = 1; i < g.pos.length; i += 3) g.pos[i] += shiftY;
  return g;
};
shift(skinRaw);

for (const [group, key, label, src, region] of M) {
  const g = shift(load(src));
  add({ kind: 'muscle', id: key, group, label, region, mirror: /right/i.test(src) }, simplify(g, 0.35, 0.002));
}
for (const [src, region, mid] of FILL) {
  let g;
  try {
    g = shift(load(src));
  } catch (e) {
    console.warn('skip fill', src);
    continue;
  }
  add({ kind: 'fill', id: src.replace(/^Right /, '').replace(/\s+/g, '_').toLowerCase(), region, mirror: /right/i.test(src) && !mid }, simplify(g, 0.3, 0.003));
}
for (const [src, region, mid] of BONES) {
  let g;
  try {
    g = shift(load(src));
  } catch (e) {
    console.warn('skip bone', src);
    continue;
  }
  add({ kind: 'bone', id: src.replace(/^Right /, '').replace(/\s+/g, '_').toLowerCase(), region, mirror: !mid }, simplify(g, 0.25, 0.003));
}

// skin: head, hands, feet only (the rest of the body is shown as muscle)
const skinS = simplify(skinRaw, 0.25, 0.002);
add({ kind: 'skin', id: 'head', region: 'head', mirror: false }, crop(skinS, (x, y, z) => y > 1.505 + (z > 0.05 ? -0.01 : 0.03) - Math.max(0, z - 0.02) * 0.6));
add({ kind: 'skin', id: 'hands', region: 'hand', mirror: false }, crop(skinS, (x, y, z) => y < 0.885 && Math.abs(x) > 0.2));
add({ kind: 'skin', id: 'feet', region: 'foot', mirror: false }, crop(skinS, (x, y, z) => y < 0.1));

// raw skin (full) kept for synthesizing rectus abdominis and lats at runtime: store a cropped torso shell
add({ kind: 'shell', id: 'torso', region: 'trunk', mirror: false }, crop(skinS, (x, y, z) => y > 0.85 && y < 1.4 && Math.abs(x) < 0.2));

// ------------------------------------------------------------------ joints (from bones, before simplification is fine)
function pts(name) {
  return shift(load(name)).pos;
}
function centroid(p, filter) {
  let s = [0, 0, 0];
  let n = 0;
  for (let i = 0; i < p.length; i += 3) {
    if (filter && !filter(p[i], p[i + 1], p[i + 2])) continue;
    s[0] += p[i];
    s[1] += p[i + 1];
    s[2] += p[i + 2];
    n++;
  }
  return s.map((v) => +(v / n).toFixed(4));
}
function range(p, axis) {
  let lo = Infinity;
  let hi = -Infinity;
  for (let i = axis; i < p.length; i += 3) {
    lo = Math.min(lo, p[i]);
    hi = Math.max(hi, p[i]);
  }
  return [lo, hi];
}
const hum = pts('Right humerus');
const [hLo, hHi] = range(hum, 1);
const fem = pts('Right femur');
const [fLo, fHi] = range(fem, 1);
const femHeadX = (() => {
  // femoral head is the medial-most bulge near the top
  let best = -Infinity;
  for (let i = 0; i < fem.length; i += 3) if (fem[i + 1] > fHi - 0.06) best = Math.max(best, fem[i]);
  return best;
})();
const rad = pts('Right radius');
const [rLo] = range(rad, 1);
const tib = pts('Right tibia');
const [tLo, tHi] = range(tib, 1);
const tal = pts('Right talus');
const met = pts('Right third metacarpal bone');
const [mLo] = range(met, 1);

const joints = {
  shoulder: centroid(hum, (x, y) => y > hHi - 0.04 && x > -0.19),
  elbow: centroid(hum, (x, y) => y < hLo + 0.025),
  wrist: centroid(rad, (x, y) => y < rLo + 0.012),
  knuckle: centroid(met, (x, y) => y < mLo + 0.01),
  hip: centroid(fem, (x, y) => y > fHi - 0.05 && x > femHeadX - 0.045),
  knee: centroid(fem, (x, y) => y < fLo + 0.03),
  ankle: centroid(tal),
  toe: [0, 0, 0],
  c7: centroid(pts('Seventh cervical vertebra')),
  t12: centroid(pts('Twelfth thoracic vertebra')),
  l3: centroid(pts('Third lumbar vertebra')),
  atlas: centroid(pts('Atlas')),
  pubis: centroid(pts('Right hip bone')),
  tibTop: tHi,
  tibLo: tLo,
};
console.log(joints);

// ------------------------------------------------------------------ pack
let bbMin = [Infinity, Infinity, Infinity];
let bbMax = [-Infinity, -Infinity, -Infinity];
for (const p of parts) {
  for (let i = 0; i < p.g.pos.length; i += 3) {
    for (let k = 0; k < 3; k++) {
      bbMin[k] = Math.min(bbMin[k], p.g.pos[i + k]);
      bbMax[k] = Math.max(bbMax[k], p.g.pos[i + k]);
    }
  }
}
// symmetric in x so mirroring stays exact
const ax = Math.max(Math.abs(bbMin[0]), Math.abs(bbMax[0]));
bbMin[0] = -ax;
bbMax[0] = ax;
const scale = bbMax.map((v, k) => (v - bbMin[k]) / 65535);

const chunks = [];
let offset = 0;
const manifest = { source: 'BodyParts3D 4.0, (c) The Database Center for Life Science, CC BY 4.0', bbMin, scale, joints, parts: [] };
for (const p of parts) {
  const nv = p.g.pos.length / 3;
  const q = new Uint16Array(nv * 3);
  for (let i = 0; i < nv * 3; i++) q[i] = Math.round((p.g.pos[i] - bbMin[i % 3]) / scale[i % 3]);
  const big = nv > 65535;
  const ix = big ? new Uint32Array(p.g.idx) : new Uint16Array(p.g.idx);
  const pad = (n) => (4 - (n % 4)) % 4;
  const posBytes = Buffer.from(q.buffer);
  const idxBytes = Buffer.from(ix.buffer);
  const entry = { kind: p.kind, id: p.id, group: p.group, label: p.label, region: p.region, mirror: p.mirror, nv, ni: p.g.idx.length, big, pos: offset };
  chunks.push(posBytes);
  offset += posBytes.length;
  const p1 = pad(offset);
  if (p1) {
    chunks.push(Buffer.alloc(p1));
    offset += p1;
  }
  entry.idx = offset;
  chunks.push(idxBytes);
  offset += idxBytes.length;
  const p2 = pad(offset);
  if (p2) {
    chunks.push(Buffer.alloc(p2));
    offset += p2;
  }
  manifest.parts.push(entry);
}
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'anatomy.bin'), Buffer.concat(chunks));
fs.writeFileSync(path.join(OUT, 'anatomy.json'), JSON.stringify(manifest));
const tris = parts.reduce((s, p) => s + p.g.idx.length / 3, 0);
console.log(`parts ${parts.length}, tris ${tris}, bytes ${offset}`);
