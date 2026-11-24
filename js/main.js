import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Rig } from './rig.js';
import { loadAnatomy, anatomyDims, Body } from './anatomy.js';
import { compile, sample, REST_POSE } from './anim.js';
import { buildProps } from './props.js';
import { GROUPS, GROUP_IDS, PARTS, PART_GROUP, partName } from './data/muscles.js';
import { EXERCISE_BY_ID, exercisesFor } from './data/exercises.js';

// ------------------------------------------------------------------ state
const state = {
  mode: 'explore', // 'explore' | 'demo'
  group: null, // selected muscle group id
  part: null, // selected head / part id
  exercise: null,
  hover: null,
  playing: true,
  speed: 1,
  time: 0,
  rep: 0,
};
const HL = {
  hover: new THREE.Color(0xf2c9a0), // warm sand
  sel: new THREE.Color(0xd4ff3a), // lime: the selected head
  sibling: new THREE.Color(0x4aa8ff), // blue: other heads of the same muscle
  prim: new THREE.Color(0xd4ff3a),
  sec: new THREE.Color(0xffa53a),
  dim: new THREE.Color(0x6e5552),
};
const EXPLORE_CAM = { pos: [0, 1.15, 3.9], target: [0, 0.95, 0] };
const DEFAULT_DEMO_CAM = { pos: [2.3, 1.5, 3.0], target: [0, 0.9, 0] };

// ------------------------------------------------------------------ DOM
const $ = (s) => document.querySelector(s);
const viewer = $('#viewer');
const panel = $('#panel');
const panelBody = $('#panelBody');
const tooltip = $('#tooltip');
const hud = $('#demoHud');
const viewToggle = $('#viewToggle');
const hint = $('#hint');

// ------------------------------------------------------------------ three.js setup
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
} catch (err) {
  $('#loading').innerHTML = '<p>Your browser doesn’t support WebGL, which is needed for the 3D view.</p>';
  throw err;
}
const isMobile = matchMedia('(pointer: coarse)').matches;
renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.75 : 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;
viewer.prepend(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, 1, 0.05, 60);
camera.position.set(...EXPLORE_CAM.pos);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(...EXPLORE_CAM.target);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.enablePan = false;
controls.minDistance = 1.2;
controls.maxDistance = 7;
controls.maxPolarAngle = Math.PI * 0.56;
controls.rotateSpeed = isMobile ? 0.8 : 0.9;

scene.add(new THREE.HemisphereLight(0xe4ecff, 0x1a1d24, 1.0));
const key = new THREE.DirectionalLight(0xffffff, 2.3);
key.position.set(2.5, 5, 3.5);
key.castShadow = true;
key.shadow.mapSize.set(isMobile ? 1024 : 2048, isMobile ? 1024 : 2048);
key.shadow.camera.left = -2.2;
key.shadow.camera.right = 2.2;
key.shadow.camera.top = 2.8;
key.shadow.camera.bottom = -1.2;
key.shadow.camera.near = 0.5;
key.shadow.camera.far = 14;
key.shadow.bias = -0.0004;
key.shadow.normalBias = 0.02;
scene.add(key);
const rim = new THREE.DirectionalLight(0xc4d4ff, 0.9);
rim.position.set(-3, 3, -4);
scene.add(rim);
const backFill = new THREE.DirectionalLight(0xffffff, 0.9);
backFill.position.set(1.5, 3, -4);
scene.add(backFill);
const fill = new THREE.DirectionalLight(0xffe2cc, 0.5);
fill.position.set(-3, 1.5, 3);
scene.add(fill);

// floor: soft glow disc + ring + shadow catcher
{
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grd.addColorStop(0, 'rgba(255,255,255,0.13)');
  grd.addColorStop(0.6, 'rgba(255,255,255,0.04)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const disc = new THREE.Mesh(new THREE.CircleGeometry(2.6, 64), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
  disc.rotation.x = -Math.PI / 2;
  scene.add(disc);
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.98, 1.0, 96), new THREE.MeshBasicMaterial({ color: 0xd4ff3a, transparent: true, opacity: 0.18, depthWrite: false }));
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.001;
  scene.add(ring);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.ShadowMaterial({ opacity: 0.38 }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.002;
  shadow.receiveShadow = true;
  scene.add(shadow);
}

function resize() {
  const w = viewer.clientWidth;
  const h = viewer.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  // keep the whole body in frame on narrow screens
  camera.fov = w / h < 0.75 ? 42 : 35;
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(viewer);

// ------------------------------------------------------------------ rig + demo
let rig = null;
let body = null;
let props = null;
let compiled = null;

async function buildBody() {
  const data = await loadAnatomy();
  rig = new Rig(anatomyDims(data));
  scene.add(rig.group);
  body = new Body(data, rig);
  scene.add(body.group);
  for (const S of ['L', 'R']) rig.grip[S].position.copy(body.gripLocal(S));
  rig.apply(REST_POSE);
  body.update();
}

function startDemo(id, { keepCamera = false, keepTime = false } = {}) {
  const ex = EXERCISE_BY_ID[id];
  if (!ex) return;
  props?.dispose();
  compiled = compile(ex.anim);
  props = buildProps(rig, ex.anim.props);
  const holds = (ex.anim.props || []).some((p) => ['dumbbell', 'barbell', 'dbMid', 'pullbar'].includes(p.type));
  body.setGrip(holds ? 1 : 0.25);
  if (!keepTime) {
    state.time = 0;
    state.rep = 0;
  }
  state.playing = true;
  if (!keepCamera) flyTo(ex.anim.cam || DEFAULT_DEMO_CAM);
}

function stopDemo() {
  props?.dispose();
  props = null;
  compiled = null;
  body.setGrip(0);
  rig.apply(REST_POSE);
}

function paint() {
  if (!body) return;
  const ex = state.mode === 'demo' ? EXERCISE_BY_ID[state.exercise] : null;
  body.setMode(ex ? 'demo' : 'explore');
  body.paint((p) => {
    if (!p.key) return null;
    if (ex) {
      if (ex.parts.primary.includes(p.key)) return [HL.prim, 0.35];
      if (ex.parts.secondary.includes(p.key)) return [HL.sec, 0.22];
      return null;
    }
    if (state.part && p.key === state.part) return [HL.sel, 0.4];
    if (p.key === state.hover) return [HL.hover, 0.18];
    if (state.part && p.group === PART_GROUP[state.part]) return [HL.sibling, 0.18];
    if (!state.part && state.group && p.group === state.group) return [HL.sel, 0.35];
    return null;
  });
}

// ------------------------------------------------------------------ camera fly-to
let fly = null;
function flyTo(cam, dur = 0.9, fitAspect = true) {
  const t1 = new THREE.Vector3(...cam.target);
  const p1 = new THREE.Vector3(...cam.pos);
  // pull back on narrow viewports so long poses (lying down) stay in frame
  const fit = fitAspect ? Math.max(1, Math.pow(1.3 / camera.aspect, 0.55)) : 1;
  p1.sub(t1).multiplyScalar(fit).add(t1);
  fly = { t: 0, dur, p0: camera.position.clone(), t0: controls.target.clone(), p1, t1 };
}
controls.addEventListener('start', () => (fly = null));

function exploreView(side) {
  const p = [...EXPLORE_CAM.pos];
  if (side === 'back') p[2] = -p[2];
  flyTo({ pos: p, target: EXPLORE_CAM.target }, 0.9, false);
  viewToggle.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.view === side));
}

// ------------------------------------------------------------------ picking
function pick(ev) {
  if (!body) return null;
  const r = renderer.domElement.getBoundingClientRect();
  return body.pick(renderer, camera, ev.clientX - r.left, ev.clientY - r.top, r.width, r.height)?.key || null;
}
const tipText = (key) => `${partName(key)} · ${GROUPS[PART_GROUP[key]].name}`;

let down = null;
const canvas = renderer.domElement;
canvas.addEventListener('pointerdown', (e) => (down = { x: e.clientX, y: e.clientY }));
canvas.addEventListener('pointerup', (e) => {
  if (!down) return;
  const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
  down = null;
  if (moved > 7) return;
  const m = pick(e);
  if (state.mode === 'explore' && m) go(`#p/${m}`);
  else if (state.mode === 'demo' && m) showTip(tipText(m), e, 1600);
  else if (state.mode === 'demo') hideTip();
});
let hoverRaf = 0;
canvas.addEventListener('pointermove', (e) => {
  if (e.pointerType !== 'mouse' || down) return;
  cancelAnimationFrame(hoverRaf);
  hoverRaf = requestAnimationFrame(() => {
    const m = pick(e);
    if (m !== state.hover) {
      state.hover = m;
      paint();
    }
    canvas.style.cursor = m && state.mode === 'explore' ? 'pointer' : 'grab';
    if (m) showTip(tipText(m), e);
    else hideTip();
  });
});
canvas.addEventListener('pointerleave', () => {
  state.hover = null;
  paint();
  hideTip();
});

let tipTimer = 0;
function showTip(text, e, ms = 0) {
  const r = viewer.getBoundingClientRect();
  tooltip.textContent = text;
  tooltip.style.transform = `translate(${e.clientX - r.left + 14}px, ${e.clientY - r.top - 10}px)`;
  tooltip.classList.add('show');
  clearTimeout(tipTimer);
  if (ms) tipTimer = setTimeout(hideTip, ms);
}
function hideTip() {
  tooltip.classList.remove('show');
}

// ------------------------------------------------------------------ routing + panel
function go(hash) {
  if (location.hash === hash) route();
  else location.hash = hash;
}

function route() {
  const [kind, id] = location.hash.replace(/^#/, '').split('/');
  hideTip();
  if (kind === 'e' && EXERCISE_BY_ID[id]) {
    const was = state.mode === 'demo' && state.exercise === id;
    state.mode = 'demo';
    state.exercise = id;
    if (!was) startDemo(id);
    renderExercise(EXERCISE_BY_ID[id]);
  } else {
    const group = kind === 'm' && GROUPS[id] ? id : kind === 'p' && PARTS[id] ? PART_GROUP[id] : null;
    const part = kind === 'p' && PARTS[id] ? id : null;
    if (state.mode === 'demo') {
      state.mode = 'explore';
      state.exercise = null;
      stopDemo();
      exploreView(group ? GROUPS[group].view : 'front');
    } else if ((route.fromList || route.first) && group && (group !== state.group || part !== state.part)) {
      exploreView(GROUPS[group].view);
    }
    state.group = group;
    state.part = part;
    if (part) renderPart(part);
    else if (group) renderGroup(group);
    else renderHome();
  }
  route.fromList = false;
  route.first = false;
  document.body.dataset.mode = state.mode;
  paint();
  panelBody.scrollTop = 0;
}

const chev = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const backIcon = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function chip(id) {
  return `<button class="chip" data-muscle="${id}"><span class="dot"></span>${GROUPS[id].name}</button>`;
}

function exList(list) {
  if (!list.length) return '<p class="muted small">No dedicated exercise in the library yet. It works alongside the other muscles in this group.</p>';
  return `<div class="ex-list">${list
    .map(
      ({ ex, role }) => `
      <button class="ex-card" data-go="#e/${ex.id}">
        <span class="ex-main">
          <span class="ex-name">${ex.name}</span>
          <span class="ex-meta">${ex.equipment} · ${ex.level}</span>
        </span>
        <span class="tag ${role === 'primary' ? 'prim' : 'sec'}">${role === 'primary' ? 'Primary' : 'Secondary'}</span>
        ${chev}
      </button>`,
    )
    .join('')}</div>`;
}

function headChips(group, current) {
  return `<div class="heads">${GROUPS[group].parts
    .map((p) => `<button class="head ${p === current ? 'on' : ''}" data-part="${p}">${partName(p)}${PARTS[p].alias ? `<small>${PARTS[p].name}</small>` : ''}</button>`)
    .join('')}</div>`;
}

function renderHome() {
  const front = GROUP_IDS.filter((id) => GROUPS[id].view === 'front');
  const back = GROUP_IDS.filter((id) => GROUPS[id].view === 'back');
  panelBody.innerHTML = `
    <div class="intro">
      <p class="eyebrow">Muscle explorer</p>
      <h1>What do you want to train?</h1>
      <p class="muted">Tap any muscle on the 3D body. Every head is separate, so you can tap the long head of the biceps or the lateral head of the triceps on their own.</p>
    </div>
    <h3>Front</h3><div class="chips">${front.map(chip).join('')}</div>
    <h3>Back</h3><div class="chips">${back.map(chip).join('')}</div>
    <p class="credit">Anatomy model: <a href="https://dbarchive.biosciencedbc.jp/en/bodyparts3d/" target="_blank" rel="noopener">BodyParts3D</a>, © The Database Center for Life Science, licensed under <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a>. Simplified and rigged for animation.</p>`;
}

function renderGroup(id) {
  const m = GROUPS[id];
  const list = exercisesFor(id);
  panelBody.innerHTML = `
    <button class="back" data-go="#">${backIcon} All muscles</button>
    <p class="eyebrow">${m.latin}</p>
    <h1>${m.name}</h1>
    <p class="muted">${m.desc}</p>
    <h3>${m.parts.length > 1 ? `${m.parts.length} parts. Tap one to focus on it` : 'Muscle'}</h3>
    ${headChips(id, null)}
    <h3>${list.length} exercises</h3>
    ${exList(list)}`;
}

function renderPart(id) {
  const p = PARTS[id];
  const g = PART_GROUP[id];
  const list = exercisesFor(id);
  panelBody.innerHTML = `
    <button class="back" data-go="#m/${g}">${backIcon} ${GROUPS[g].name}</button>
    <p class="eyebrow">${GROUPS[g].name}${p.alias ? ` · ${p.name}` : ''}</p>
    <h1>${partName(id)}</h1>
    <p class="muted">${p.desc}</p>
    ${GROUPS[g].parts.length > 1 ? `<h3>Other parts of the ${GROUPS[g].name.toLowerCase()}</h3>${headChips(g, id)}<div class="legend"><span class="lg sel"></span>Selected <span class="lg sib"></span>Rest of the ${GROUPS[g].name.toLowerCase()}</div>` : ''}
    <h3>${list.length ? `${list.length} exercises` : 'Exercises'}</h3>
    ${exList(list)}`;
}

function renderExercise(ex) {
  const backTo = state.part ? `#p/${state.part}` : state.group ? `#m/${state.group}` : '#';
  const backLabel = state.part ? partName(state.part) : state.group ? GROUPS[state.group].name : 'All muscles';
  const tags = [
    ...ex.parts.primary.map((id) => `<button class="tag prim" data-part="${id}">${partName(id)}</button>`),
    ...ex.parts.secondary.map((id) => `<button class="tag sec" data-part="${id}">${partName(id)}</button>`),
  ].join('');
  panelBody.innerHTML = `
    <button class="back" data-go="${backTo}">${backIcon} ${backLabel}</button>
    <p class="eyebrow">${ex.equipment} · ${ex.level}</p>
    <h1>${ex.name}</h1>
    <div class="stats">
      <div><span>Sets × reps</span><b>${ex.sets}</b></div>
      <div><span>Level</span><b>${ex.level}</b></div>
    </div>
    <div class="legend"><span class="lg prim"></span>Primary <span class="lg sec"></span>Secondary</div>
    <div class="tags">${tags}</div>
    <h3>How to do it</h3>
    <ol class="steps">${ex.steps.map((s) => `<li>${s}</li>`).join('')}</ol>
    <h3>Form tips</h3>
    <ul class="tips">${ex.tips.map((s) => `<li>${s}</li>`).join('')}</ul>`;
  updateHud(true);
}

panelBody.addEventListener('click', (e) => {
  const g = e.target.closest('[data-go]');
  if (g) return go(g.dataset.go === '#' ? '#home' : g.dataset.go);
  const m = e.target.closest('[data-muscle]');
  if (m) {
    route.fromList = true;
    go(`#m/${m.dataset.muscle}`);
  }
  const p = e.target.closest('[data-part]');
  if (p) {
    route.fromList = true;
    go(`#p/${p.dataset.part}`);
  }
});

// ------------------------------------------------------------------ controls UI
viewToggle.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (b) exploreView(b.dataset.view);
});
$('#grabber').addEventListener('click', () => panel.classList.toggle('expanded'));

hud.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.dataset.act === 'play') state.playing = !state.playing;
  if (b.dataset.speed) state.speed = parseFloat(b.dataset.speed);
  if (b.dataset.act === 'cam' && state.exercise) flyTo(EXERCISE_BY_ID[state.exercise].anim.cam || DEFAULT_DEMO_CAM);
  updateHud(true);
});

function updateHud(force) {
  if (state.mode !== 'demo' || !compiled) return;
  const rep = Math.floor(state.time / compiled.duration) + 1;
  if (!force && rep === state.rep) return;
  state.rep = rep;
  hud.querySelector('[data-act="play"]').innerHTML = state.playing
    ? '<svg viewBox="0 0 24 24" width="18" height="18"><rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor"/><rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor"/></svg>'
    : '<svg viewBox="0 0 24 24" width="18" height="18"><path d="M7 5l12 7-12 7z" fill="currentColor"/></svg>';
  hud.querySelector('[data-act="play"]').setAttribute('aria-label', state.playing ? 'Pause' : 'Play');
  hud.querySelectorAll('[data-speed]').forEach((b) => b.classList.toggle('on', parseFloat(b.dataset.speed) === state.speed));
  hud.querySelector('.rep').textContent = `Rep ${rep}`;
}

// ------------------------------------------------------------------ loop
const clock = new THREE.Clock();
function tick() {
  const dt = Math.min(clock.getDelta(), 0.05);

  if (fly) {
    fly.t += dt / fly.dur;
    const u = Math.min(1, fly.t);
    const k = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
    camera.position.lerpVectors(fly.p0, fly.p1, k);
    controls.target.lerpVectors(fly.t0, fly.t1, k);
    if (u >= 1) fly = null;
  }

  if (rig) {
    if (state.mode === 'demo' && compiled) {
      if (state.playing) state.time += dt * state.speed;
      rig.apply(sample(compiled, state.time));
      props?.update();
      updateHud(false);
    }
    body.update();
  }

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

// ------------------------------------------------------------------ boot
resize();
tick();
buildBody()
  .then(() => {
    route.first = true;
    route();
    window.addEventListener('hashchange', route);
    $('#loading').remove();
  })
  .catch((err) => {
    console.error(err);
    $('#loading').innerHTML = '<p>Couldn’t load the 3D body. Please refresh.</p>';
  });
// handy for debugging from the console
window.f360 = { state, renderer, scene, camera, controls, flyTo, go, pickAt: (x, y) => pick({ clientX: x, clientY: y }), get rig() { return rig; }, get body() { return body; }, get props() { return props; } };
