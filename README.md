# Fitness 360

An interactive 3D muscle explorer for the web (desktop and mobile).

- **3D body** (male and female) built with [three.js](https://threejs.org). Drag to rotate, pinch or scroll to zoom.
- **Tap any muscle** to see which exercises train it (14 muscle groups).
- **Animated 3D demos** for 25 exercises. The worked muscles light up (primary in lime, secondary in amber). Includes step-by-step instructions, form tips and sets/reps.

There's no build step: it's plain HTML, CSS and ES modules, with three.js loaded from a CDN.

## Run locally

```bash
python3 -m http.server 5173
```

Then open http://localhost:5173. ES modules need a server, so opening `index.html` directly as a file won't work.

## Deploy

The site is static, so GitHub Pages serves it straight from the `main` branch root.

## Project layout

```
index.html            app shell + import map
css/styles.css        layout (side panel on desktop, bottom sheet on mobile)
js/main.js            scene, camera, picking, routing, UI
js/rig.js             procedural jointed body; each muscle is its own clickable mesh; 2-bone IK
js/anim.js            keyframe expansion + interpolation (quaternion slerp)
js/props.js           dumbbells, barbell, bench, pull-up bar, mat
js/data/muscles.js    muscle groups + descriptions
js/data/exercises.js  exercise library + animation keyframes
```

## Adding an exercise

Add an entry to `js/data/exercises.js` with `primary`/`secondary` muscle ids and an `anim` block of keyframes. The conventions are documented at the top of that file. Use `ik.foot` / `ik.hand` to keep feet and hands planted while the body moves.
