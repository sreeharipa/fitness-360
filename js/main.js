import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Rig, COLORS } from './rig.js';
import { compile, sample, REST_POSE } from './anim.js';
import { buildProps } from './props.js';
import { MUSCLES, MUSCLE_IDS } from './data/muscles.js';
import { EXERCISE_BY_ID, exercisesFor } from './data/exercises.js';

// ------------------------------------------------------------------ state
const state = {
  gender: localStorage.getItem('f360-gender') || 'male',
  mode: 'explore', // 'explore' | 'demo'
  muscle: null,
  exercise: null,
  hover: null,
  playing: true,
  speed: 1,
  time: 0,
  rep: 0,
};
const HL = {
  hover: new THREE.Color(0xdc7a6f),
  sel: new THREE.Color(0xd4ff3a),
  prim: new THREE.Color(0xd4ff3a),
  sec: new THREE.Color(0xffa53a),
  dim: new THREE.Color(0x6f6a76),
  base: new THREE.Color(COLORS.muscle),
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
let props = null;
let compiled = null;

function buildRig() {
  if (rig) rig.dispose();
  props = null;
  rig = new Rig(state.gender);
  scene.add(rig.group);
  if (state.mode === 'demo' && state.exercise) startDemo(state.exercise, { keepCamera: true, keepTime: true });
  else rig.apply(REST_POSE);
  paint();
}

function startDemo(id, { keepCamera = false, keepTime = false } = {}) {
  const ex = EXERCISE_BY_ID[id];
  if (!ex) return;
  props?.dispose();
  compiled = compile(ex.anim);
  props = buildProps(rig, ex.anim.props);
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
  rig.apply(REST_POSE);
}

function paint() {
  if (!rig) return;
  const ex = state.mode === 'demo' ? EXERCISE_BY_ID[state.exercise] : null;
  for (const id of MUSCLE_IDS) {
    const mat = rig.mats.muscle[id];
    let col = HL.base;
    let glow = 0;
    if (ex) {
      if (ex.primary.includes(id)) {
        col = HL.prim;
        glow = 0.35;
      } else if (ex.secondary.includes(id)) {
        col = HL.sec;
        glow = 0.15;
      } else col = HL.dim;
      if (state.hover === id) glow += 0.15;
    } else if (id === state.muscle) {
      col = HL.sel;
      glow = 0.4;
    } else if (id === state.hover) {
      col = HL.hover;
    }
    mat.color.copy(col);
    mat.emissive.copy(col);
    mat.emissiveIntensity = glow;
  }
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
const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
function pick(ev) {
  if (!rig) return null;
  const r = renderer.domElement.getBoundingClientRect();
  ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const hit = ray.intersectObjects(rig.meshes, false)[0];
  return hit?.object.userData.muscle || null;
}

let down = null;
const canvas = renderer.domElement;
canvas.addEventListener('pointerdown', (e) => (down = { x: e.clientX, y: e.clientY }));
canvas.addEventListener('pointerup', (e) => {
  if (!down) return;
  const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
  down = null;
  if (moved > 7) return;
  const m = pick(e);
  if (state.mode === 'explore' && m) go(`#m/${m}`);
  else if (state.mode === 'demo' && m) showTip(MUSCLES[m].name, e, 1400);
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
    if (m) showTip(MUSCLES[m].name, e);
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
    if (state.mode === 'demo') {
      state.mode = 'explore';
      state.exercise = null;
      stopDemo();
      const side = kind === 'm' && MUSCLES[id] ? MUSCLES[id].view : 'front';
      exploreView(side);
    }
    if (kind === 'm' && MUSCLES[id]) {
      const fromList = state.muscle !== id && route.fromList;
      state.muscle = id;
      if (fromList) exploreView(MUSCLES[id].view);
      renderMuscle(id);
    } else {
      state.muscle = null;
      renderHome();
    }
  }
  route.fromList = false;
  document.body.dataset.mode = state.mode;
  paint();
  panelBody.scrollTop = 0;
}

const chev = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const backIcon = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function chip(id) {
  return `<button class="chip" data-muscle="${id}"><span class="dot"></span>${MUSCLES[id].name}</button>`;
}

function renderHome() {
  const front = MUSCLE_IDS.filter((id) => MUSCLES[id].view === 'front');
  const back = MUSCLE_IDS.filter((id) => MUSCLES[id].view === 'back');
  panelBody.innerHTML = `
    <div class="intro">
      <p class="eyebrow">Muscle explorer</p>
      <h1>What do you want to train?</h1>
      <p class="muted">Tap a muscle on the 3D body or pick one below to see exercises with animated demos.</p>
    </div>
    <h3>Front</h3><div class="chips">${front.map(chip).join('')}</div>
    <h3>Back</h3><div class="chips">${back.map(chip).join('')}</div>`;
}

function renderMuscle(id) {
  const m = MUSCLES[id];
  const list = exercisesFor(id);
  panelBody.innerHTML = `
    <button class="back" data-go="#">${backIcon} All muscles</button>
    <p class="eyebrow">${m.latin}</p>
    <h1>${m.name}</h1>
    <p class="muted">${m.desc}</p>
    <h3>${list.length} exercises</h3>
    <div class="ex-list">
      ${list
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
        .join('')}
    </div>`;
}

function renderExercise(ex) {
  const backTo = state.muscle ? `#m/${state.muscle}` : '#';
  const backLabel = state.muscle ? MUSCLES[state.muscle].name : 'All muscles';
  const tags = [
    ...ex.primary.map((id) => `<button class="tag prim" data-muscle="${id}">${MUSCLES[id].name}</button>`),
    ...ex.secondary.map((id) => `<button class="tag sec" data-muscle="${id}">${MUSCLES[id].name}</button>`),
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
});

// ------------------------------------------------------------------ controls UI
function setGender(g) {
  state.gender = g;
  try {
    localStorage.setItem('f360-gender', g);
  } catch {}
  document.querySelectorAll('#gender button').forEach((b) => b.classList.toggle('on', b.dataset.g === g));
  buildRig();
}
document.querySelectorAll('#gender button').forEach((b) => b.addEventListener('click', () => setGender(b.dataset.g)));
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
  const t = clock.elapsedTime;

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
      rig.J.chest.scale.setScalar(1);
      updateHud(false);
    } else {
      // gentle breathing
      const b = 1 + Math.sin(t * 1.6) * 0.008;
      rig.J.chest.scale.set(b, b, b);
    }
  }

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

// ------------------------------------------------------------------ boot
document.querySelectorAll('#gender button').forEach((b) => b.classList.toggle('on', b.dataset.g === state.gender));
resize();
buildRig();
route();
window.addEventListener('hashchange', route);
$('#loading').remove();
tick();
// handy for debugging from the console
window.f360 = { state, camera, controls, flyTo, go, get rig() { return rig; } };
