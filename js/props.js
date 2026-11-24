// Gym equipment used in the exercise demos.
import * as THREE from 'three';

const H = Math.PI / 2;
const M = {
  metal: new THREE.MeshStandardMaterial({ color: 0x9aa1ad, metalness: 0.85, roughness: 0.32 }),
  iron: new THREE.MeshStandardMaterial({ color: 0x202329, metalness: 0.4, roughness: 0.55 }),
  plate: new THREE.MeshStandardMaterial({ color: 0x1b1d22, roughness: 0.75 }),
  accent: new THREE.MeshStandardMaterial({ color: 0xd4ff3a, roughness: 0.5 }),
  pad: new THREE.MeshStandardMaterial({ color: 0x2a2f3a, roughness: 0.8 }),
  mat: new THREE.MeshStandardMaterial({ color: 0x27344a, roughness: 0.9 }),
  ball: new THREE.MeshStandardMaterial({ color: 0xff8a3d, roughness: 0.6 }),
};

function mesh(geo, mat, pos = [0, 0, 0], rot = [0, 0, 0]) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(...pos);
  m.rotation.set(...rot);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

// Built along the X axis.
function dumbbell() {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.16, 12), M.metal, [0, 0, 0], [0, 0, H]));
  for (const s of [1, -1]) {
    g.add(mesh(new THREE.CylinderGeometry(0.043, 0.043, 0.055, 8), M.iron, [s * 0.1, 0, 0], [0, 0, H]));
    g.add(mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.012, 12), M.accent, [s * 0.068, 0, 0], [0, 0, H]));
  }
  return g;
}

function barbell() {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.014, 0.014, 1.75, 12), M.metal, [0, 0, 0], [0, 0, H]));
  for (const s of [1, -1]) {
    g.add(mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.3, 14), M.metal, [s * 0.74, 0, 0], [0, 0, H]));
    g.add(mesh(new THREE.CylinderGeometry(0.225, 0.225, 0.045, 36), M.plate, [s * 0.63, 0, 0], [0, 0, H]));
    g.add(mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.047, 36), M.iron, [s * 0.63, 0, 0], [0, 0, H]));
    g.add(mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.05, 20), M.accent, [s * 0.63, 0, 0], [0, 0, H]));
    g.add(mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.03, 16), M.metal, [s * 0.59, 0, 0], [0, 0, H]));
  }
  return g;
}

function bench({ x = 0, z = 0, height = 0.45, length = 1.2, width = 0.32 }) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.add(mesh(new THREE.BoxGeometry(width, 0.08, length), M.pad, [0, height - 0.04, 0]));
  const legH = height - 0.08;
  const along = length >= width;
  const span = (along ? length : width) / 2 - 0.08;
  for (const s of [1, -1]) {
    const pos = along ? [0, legH / 2, s * span] : [s * span, legH / 2, 0];
    const size = along ? [width * 0.8, legH, 0.05] : [0.05, legH, length * 0.8];
    g.add(mesh(new THREE.BoxGeometry(...size), M.iron, pos));
  }
  return g;
}

function pullbar({ y = 2.15, z = 0 }) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.016, 0.016, 1.3, 14), M.metal, [0, y, z], [0, 0, H]));
  for (const s of [1, -1]) {
    g.add(mesh(new THREE.BoxGeometry(0.06, y + 0.05, 0.06), M.iron, [s * 0.65, (y + 0.05) / 2, z]));
    g.add(mesh(new THREE.BoxGeometry(0.1, 0.03, 0.7), M.iron, [s * 0.65, 0.015, z]));
  }
  return g;
}

function mat({ z = 0 }) {
  const m = mesh(new THREE.BoxGeometry(0.66, 0.01, 1.9), M.mat, [0, 0.005, z]);
  m.castShadow = false;
  return m;
}

const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _gq = new THREE.Quaternion();

function gripMid(rig, out) {
  rig.grip.L.getWorldPosition(_a);
  rig.grip.R.getWorldPosition(_b);
  out.copy(_a).add(_b).multiplyScalar(0.5);
  rig.group.worldToLocal(out);
}

export function buildProps(rig, list = []) {
  const group = new THREE.Group();
  const attached = [];
  const dyn = [];
  for (const p of list) {
    switch (p.type) {
      case 'dumbbell': {
        const sides = p.hand ? [p.hand] : ['L', 'R'];
        for (const S of sides) {
          const holder = new THREE.Group();
          const d = dumbbell();
          d.rotation.y = H; // grip axis = hand local Z
          holder.add(d);
          rig.grip[S].add(holder);
          attached.push(holder);
        }
        break;
      }
      case 'barbell': {
        const b = barbell();
        group.add(b);
        dyn.push(() => gripMid(rig, b.position));
        break;
      }
      case 'dbMid': {
        const holder = new THREE.Group();
        const d = dumbbell();
        d.rotation.z = H; // vertical along the forearm
        holder.add(d);
        group.add(holder);
        dyn.push(() => {
          gripMid(rig, holder.position);
          rig.grip.L.getWorldQuaternion(_q);
          rig.group.getWorldQuaternion(_gq);
          holder.quaternion.copy(_gq.invert().multiply(_q));
        });
        break;
      }
      case 'ball': {
        const b = mesh(new THREE.SphereGeometry(0.1, 24, 16), M.ball);
        group.add(b);
        dyn.push(() => gripMid(rig, b.position));
        break;
      }
      case 'bench':
        group.add(bench(p));
        break;
      case 'pullbar':
        group.add(pullbar(p));
        break;
      case 'mat':
        group.add(mat(p));
        break;
    }
  }
  rig.group.add(group);
  return {
    update() {
      if (!dyn.length) return;
      rig.group.updateMatrixWorld(true);
      dyn.forEach((f) => f());
    },
    dispose() {
      group.parent?.remove(group);
      attached.forEach((h) => h.parent?.remove(h));
      const geos = new Set();
      [group, ...attached].forEach((o) => o.traverse((c) => c.geometry && geos.add(c.geometry)));
      geos.forEach((g) => g.dispose());
    },
  };
}
