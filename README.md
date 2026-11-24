# Fitness 360

An interactive 3D muscle explorer for the web (desktop and mobile).

- **Real anatomy**: a male écorché (muscles and skeleton) built from the BodyParts3D anatomy dataset and rendered with [three.js](https://threejs.org). Drag to rotate, pinch or scroll to zoom.
- **Every head is separate**: tap the long head of the biceps, the lateral head of the triceps, the clavicular head of the chest, and so on. There are about 80 selectable muscles in 21 groups.
- **Head-specific exercises**: each muscle head lists the exercises that target it, as primary or secondary.
- **Animated 3D demos** for 38 exercises. The anatomy mesh is skinned to a pose rig, and the worked heads light up (primary in lime, secondary in amber).

There's no build step: it's plain HTML, CSS and ES modules, with three.js loaded from a CDN.

## Run locally

```bash
python3 -m http.server 5173
```

Then open http://localhost:5173. ES modules need a server, so opening `index.html` directly as a file won't work. Use `python3 tools/serve.py` for a server that disables caching while you develop.

## Deploy

The site is static, so GitHub Pages serves it straight from the `main` branch root.

## Project layout

```
index.html            app shell + import map
css/styles.css        layout (side panel on desktop, bottom sheet on mobile)
js/main.js            scene, camera, picking, routing, UI
js/anatomy.js         loads the packed anatomy, skins it to the rig, colours + GPU picking per muscle head
js/rig.js             invisible jointed pose rig (sized from the anatomy skeleton) with 2-bone IK
js/anim.js            keyframe expansion + interpolation (quaternion slerp)
js/props.js           dumbbells, barbell, bench, pull-up bar, mat
js/data/muscles.js    muscle groups and their individual heads/parts
assets/anatomy.*      packed BodyParts3D meshes (generated, ~3 MB)
tools/build-anatomy.mjs  builds assets/anatomy.* from the BodyParts3D OBJ download
js/data/exercises.js  exercise library + animation keyframes
```

## Anatomy data

The meshes come from [BodyParts3D](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/), © The Database Center for Life Science, licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). They were simplified with meshoptimizer, converted to metres with Y up, and the right-side structures are mirrored to the left at runtime. BodyParts3D has no rectus abdominis or latissimus dorsi, so those two muscles are generated procedurally from the body surface.

To rebuild the assets:

```bash
npm i meshoptimizer@0.22.0   # in any scratch folder
node tools/build-anatomy.mjs <path to isa_BP3D_4.0_obj_99>
```

## Adding an exercise

Add an entry to `js/data/exercises.js` with an `anim` block of keyframes, then list the heads it works in `PARTS_FOR` (part ids from `js/data/muscles.js`; a group id expands to all of its parts). The conventions are documented at the top of that file. Use `ik.foot` / `ik.hand` to keep feet and hands planted while the body moves.
