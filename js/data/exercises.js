// Exercise library + animation keyframes.
//
// Pose conventions (character faces +Z, Y is up, character's left is +X):
//   Angles are Euler XYZ in radians. Paired joints (sh, el, wr, hip, kn, an) are written
//   for the LEFT side and mirrored automatically for the right; use shL / shR etc. to
//   override one side (still written in left-side terms).
//   - shoulder x < 0 raises the arm forward, z > 0 raises it out to the side
//   - elbow x < 0 bends the elbow; elbow y twists the forearm (palm forward = +PI/2)
//   - hip x < 0 lifts the thigh forward; knee x > 0 bends the knee
//   - spine/chest x > 0 bends forward; root rot x = -PI/2 lies on the back, +PI/2 face down
//   - pos is the pelvis position in metres
//   ik.foot / ik.hand = [y, z] target for the ankle / wrist (sagittal plane) so feet and hands stay planted
//   footAngle / handAngle = world angle of the foot / hand (0 = foot flat)
//   armAbs = world angle of the upper arm (0 = hanging straight down, -PI/2 = pointing forward)

import { GROUPS, PART_GROUP } from './muscles.js';

const H = Math.PI / 2;
const PI = Math.PI;

// Loop helper: hold at the bottom/top for a moment, then return.
const loop = (a, b, at = 0.45, hold = 0.1) => [
  { t: 0, ...a },
  { t: at, ...b },
  { t: at + hold, ...b },
  { t: 1, ...a },
];

const STAND = { pos: [0, 0.995, 0], sh: [0, 0, 0.07], el: [-0.12, 0, 0] };
const FLOOR_CAM = { pos: [3.1, 1.45, 1.2], target: [0, 0.3, 0.05] };

export const EXERCISES = [
  // ---------------------------------------------------------------- LEGS
  {
    id: 'squat',
    name: 'Bodyweight Squat',
    primary: ['quads', 'glutes'],
    secondary: ['hamstrings', 'lower_back', 'calves'],
    equipment: 'Bodyweight',
    level: 'Beginner',
    sets: '3 × 12–15',
    steps: [
      'Stand with feet shoulder-width apart, toes turned out slightly.',
      'Brace your core and push your hips back as if sitting into a chair.',
      'Bend the knees until your thighs are about parallel to the floor, reaching your arms forward for balance.',
      'Drive through your whole foot to stand back up, squeezing the glutes at the top.',
    ],
    tips: ['Keep your chest up and back flat.', 'Knees track in line with your toes.', 'Keep your heels on the floor the whole time.'],
    anim: {
      duration: 3.2,
      base: { ik: { foot: [0.07, 0] }, footAngle: 0, hip: [0, 0, 0.07], sh: [0, 0, 0.12], el: [-0.05, 0, 0] },
      keys: loop(
        { pos: [0, 0.985, 0], armAbs: -1.45 },
        { pos: [0, 0.56, -0.2], rot: [0.45, 0, 0], spine: [0.15, 0, 0], chest: [0.05, 0, 0], neck: [-0.45, 0, 0], armAbs: -1.55 },
      ),
    },
  },
  {
    id: 'split-squat',
    name: 'Split Squat',
    primary: ['quads', 'glutes'],
    secondary: ['hamstrings', 'calves'],
    equipment: 'Bodyweight',
    level: 'Beginner',
    sets: '3 × 10 each leg',
    steps: [
      'Take a long stride: front foot flat, back heel lifted.',
      'Keep your torso tall and lower straight down until the back knee nearly touches the floor.',
      'The front shin stays roughly vertical.',
      'Push through the front heel to rise. Finish your reps, then switch legs.',
    ],
    tips: ['Drop straight down, not forward.', 'Keep your hips square to the front.', 'Most of your weight goes through the front leg.'],
    anim: {
      duration: 3,
      base: {
        ik: { footL: [0.07, 0.32], footR: [0.13, -0.42] }, footAngle: [0, 0.95],
        hip: [0, 0, 0.05], sh: [0, 0, 0.1], el: [-0.25, 0, 0],
      },
      keys: loop({ pos: [0, 0.93, -0.03], rot: [0.02, 0, 0] }, { pos: [0, 0.56, -0.04], rot: [0.06, 0, 0] }),
    },
  },
  {
    id: 'rdl',
    name: 'Romanian Deadlift',
    primary: ['hamstrings', 'glutes'],
    secondary: ['lower_back', 'forearms', 'traps'],
    equipment: 'Barbell',
    level: 'Intermediate',
    sets: '3 × 8–10',
    steps: [
      'Stand tall holding the bar at hip height, hands just outside your thighs.',
      'With soft knees, push your hips back and let the bar slide down your thighs.',
      'Keep your back flat and lower until you feel a strong stretch in the hamstrings, around mid-shin.',
      'Drive your hips forward to stand up, squeezing the glutes.',
    ],
    tips: ['It’s a hip hinge, not a squat: your knees barely bend.', 'Keep the bar close to your legs.', 'Neck neutral: look a few feet ahead.'],
    anim: {
      duration: 3.6,
      props: [{ type: 'barbell' }],
      base: { ik: { foot: [0.07, 0] }, footAngle: 0, armAbs: 0, sh: [0, 0, 0.06], el: [-0.05, 0, 0] },
      keys: loop(
        { pos: [0, 0.975, 0], rot: [0.03, 0, 0], armAbs: -0.24 },
        { pos: [0, 0.88, -0.22], rot: [1.05, 0, 0], spine: [0.05, 0, 0], neck: [-0.55, 0, 0], armAbs: -0.1 },
      ),
    },
  },
  {
    id: 'deadlift',
    name: 'Deadlift',
    primary: ['glutes', 'hamstrings', 'lower_back'],
    secondary: ['quads', 'traps', 'forearms', 'lats'],
    equipment: 'Barbell',
    level: 'Intermediate',
    sets: '4 × 5',
    steps: [
      'Stand with the bar over your mid-foot. Hinge down and grip it just outside your knees.',
      'Drop your hips, flatten your back, and pull your shoulders slightly over the bar.',
      'Push the floor away, keeping the bar against your legs as you stand.',
      'Lock out with hips and knees together, then reverse the motion to lower.',
    ],
    tips: ['Brace hard before every rep.', 'Hips and shoulders rise at the same time.', 'Don’t lean back at the top.'],
    anim: {
      duration: 3.8,
      props: [{ type: 'barbell' }],
      base: { ik: { foot: [0.07, 0] }, footAngle: 0, armAbs: 0, sh: [0, 0, 0.06], el: [-0.05, 0, 0] },
      keys: [
        { t: 0, pos: [0, 0.58, -0.2], rot: [0.85, 0, 0], spine: [0.1, 0, 0], neck: [-0.55, 0, 0], armAbs: -0.06 },
        { t: 0.4, pos: [0, 0.985, 0], rot: [0.02, 0, 0], armAbs: -0.24 },
        { t: 0.55, pos: [0, 0.985, 0], rot: [0.02, 0, 0], armAbs: -0.24 },
        { t: 1, pos: [0, 0.58, -0.2], rot: [0.85, 0, 0], spine: [0.1, 0, 0], neck: [-0.55, 0, 0], armAbs: -0.06 },
      ],
    },
  },
  {
    id: 'glute-bridge',
    name: 'Glute Bridge',
    primary: ['glutes'],
    secondary: ['hamstrings', 'lower_back'],
    equipment: 'Bodyweight',
    level: 'Beginner',
    sets: '3 × 15',
    steps: [
      'Lie on your back with knees bent and feet flat, hip-width apart.',
      'Rest your arms by your sides, palms down.',
      'Drive through your heels and lift your hips until knees, hips and shoulders form a straight line.',
      'Squeeze your glutes for a second at the top, then lower slowly.',
    ],
    tips: ['Push through your heels, not your toes.', 'Don’t over-arch your lower back at the top.', 'Keep your ribs down.'],
    anim: {
      duration: 3,
      cam: FLOOR_CAM,
      legPref: [1, 0],
      props: [{ type: 'mat', z: 0.05 }],
      base: { ik: { foot: [0.07, 0.5] }, footAngle: 0, armAbs: -H, sh: [0, 0, 0.3] },
      keys: loop(
        { pos: [0, 0.12, 0], rot: [-H, 0, 0], neck: [0, 0, 0] },
        { pos: [0, 0.31, 0], rot: [-H - 0.42, 0, 0], neck: [0.42, 0, 0] },
        0.4, 0.2,
      ),
    },
  },
  {
    id: 'calf-raise',
    name: 'Standing Calf Raise',
    primary: ['calves'],
    secondary: [],
    equipment: 'Bodyweight',
    level: 'Beginner',
    sets: '3 × 15–20',
    steps: [
      'Stand tall with feet hip-width apart. Hold a wall if you need balance.',
      'Push through the balls of your feet and rise as high as you can.',
      'Pause and squeeze your calves at the top.',
      'Lower your heels slowly back to the floor.',
    ],
    tips: ['Use the full range: all the way up, all the way down.', 'Go slow; don’t bounce.', 'Do them on a step for a deeper stretch.'],
    anim: {
      duration: 2.2,
      base: { sh: [0, 0, 0.08], el: [-0.15, 0, 0] },
      keys: loop(
        { pos: [0, 0.99, 0], footAngle: 0, ik: { foot: [0.07, 0] } },
        { pos: [0, 1.055, -0.01], footAngle: 0.55, ik: { foot: [0.135, -0.018] } },
        0.4, 0.2,
      ),
    },
  },
  {
    id: 'single-calf-raise',
    name: 'Single-Leg Calf Raise',
    primary: ['calves'],
    secondary: [],
    equipment: 'Bodyweight',
    level: 'Intermediate',
    sets: '3 × 12 each leg',
    steps: [
      'Stand on one foot and bend the other knee so that foot is off the floor.',
      'Rise onto the ball of the standing foot as high as you can.',
      'Pause at the top, then lower under control.',
      'Finish your reps, then switch legs.',
    ],
    tips: ['Touch a wall lightly for balance.', 'Keep the standing knee straight but not locked.'],
    anim: {
      duration: 2.2,
      base: { sh: [0, 0, 0.12], el: [-0.2, 0, 0], hipR: [-0.15, 0, 0], knR: [1.3, 0, 0], anR: [0.4, 0, 0] },
      keys: loop(
        { pos: [0, 0.99, 0], footAngleL: 0, ik: { footL: [0.07, 0] } },
        { pos: [0, 1.055, -0.01], footAngleL: 0.55, ik: { footL: [0.135, -0.018] } },
        0.4, 0.2,
      ),
    },
  },

  // ---------------------------------------------------------------- CHEST
  {
    id: 'push-up',
    name: 'Push-Up',
    primary: ['chest', 'triceps'],
    secondary: ['shoulders', 'abs'],
    equipment: 'Bodyweight',
    level: 'Beginner',
    sets: '3 × 10–15',
    steps: [
      'Start in a high plank with hands slightly wider than your shoulders.',
      'Keep your body in one straight line from head to heels.',
      'Bend your elbows to about 45° from your body and lower your chest to just above the floor.',
      'Press the floor away to straighten your arms.',
    ],
    tips: ['Squeeze your glutes and abs so your hips don’t sag.', 'Elbows angle back, not straight out to the sides.', 'Too hard? Do them from your knees or with hands on a bench.'],
    anim: {
      duration: 2.6,
      cam: { pos: [2.9, 1.15, 0.9], target: [0, 0.3, -0.05] },
      props: [{ type: 'mat', z: -0.05 }],
      base: { ik: { hand: [0.045, 0.62], foot: [0.17, -0.75] }, footAngle: 1.35, handAngle: -H, sh: [0, 0, 0.22], neck: [-0.15, 0, 0] },
      keys: loop(
        { pos: [0, 0.455, 0.135], rot: [H - 0.312, 0, 0] },
        { pos: [0, 0.256, 0.176], rot: [H - 0.093, 0, 0] },
      ),
    },
  },
  {
    id: 'db-bench-press',
    name: 'Dumbbell Bench Press',
    primary: ['chest'],
    secondary: ['triceps', 'shoulders'],
    equipment: 'Dumbbells, bench',
    level: 'Beginner',
    sets: '4 × 8–12',
    steps: [
      'Lie on a flat bench with a dumbbell in each hand and feet flat on the floor.',
      'Press the dumbbells up over your chest, palms facing your feet.',
      'Lower them slowly to the sides of your chest, elbows about 45–70° from your body.',
      'Press back up until your arms are straight and the dumbbells nearly touch.',
    ],
    tips: ['Pull your shoulder blades back and down into the bench.', 'Keep your wrists stacked over your elbows.', 'Control the way down: 2–3 seconds.'],
    anim: {
      duration: 3.2,
      cam: { pos: [2.5, 1.6, 1.4], target: [0, 0.55, -0.1] },
      legPref: [1, 0],
      props: [{ type: 'dumbbell' }, { type: 'bench', x: 0, z: -0.2, height: 0.45, length: 1.25, width: 0.32 }],
      base: { pos: [0, 0.56, 0.3], rot: [-H, 0, 0], ik: { foot: [0.07, 0.78] }, footAngle: 0 },
      keys: loop(
        { sh: [-H, H, 0], el: [0, 0, 0] },
        { sh: [0.35, 0, 1.25], el: [-1.55, 0, 0] },
      ),
    },
  },
  {
    id: 'db-fly',
    name: 'Dumbbell Fly',
    primary: ['chest'],
    secondary: ['shoulders'],
    equipment: 'Dumbbells, bench',
    level: 'Intermediate',
    sets: '3 × 10–12',
    steps: [
      'Lie on a bench and hold the dumbbells over your chest, palms facing each other.',
      'Keep a slight bend in your elbows and open your arms wide in an arc.',
      'Lower until you feel a stretch across your chest, with arms about level with the bench.',
      'Bring the dumbbells back together as if hugging a big tree.',
    ],
    tips: ['Keep the elbow angle fixed: the move happens at the shoulder.', 'Go light; this is a stretch exercise, not a strength test.', 'Don’t drop the weights below shoulder level.'],
    anim: {
      duration: 3.4,
      cam: { pos: [2.5, 1.6, 1.4], target: [0, 0.55, -0.1] },
      legPref: [1, 0],
      props: [{ type: 'dumbbell' }, { type: 'bench', x: 0, z: -0.2, height: 0.45, length: 1.25, width: 0.32 }],
      base: { pos: [0, 0.56, 0.3], rot: [-H, 0, 0], ik: { foot: [0.07, 0.78] }, footAngle: 0, el: [0, 0, -0.35] },
      keys: loop({ sh: [-H, 0, 0.05] }, { sh: [-H, 0, H + 0.15] }),
    },
  },

  // ---------------------------------------------------------------- ARMS
  {
    id: 'bicep-curl',
    name: 'Dumbbell Bicep Curl',
    primary: ['biceps'],
    secondary: ['forearms'],
    equipment: 'Dumbbells',
    level: 'Beginner',
    sets: '3 × 10–12',
    steps: [
      'Stand tall holding dumbbells at your sides, palms facing forward.',
      'Keep your elbows pinned to your sides.',
      'Curl the weights up toward your shoulders by bending only at the elbow.',
      'Squeeze at the top, then lower slowly until your arms are straight.',
    ],
    tips: ['Don’t swing your body to lift the weight.', 'Keep your upper arms still.', 'Lower slower than you lift.'],
    anim: {
      duration: 2.8,
      props: [{ type: 'dumbbell' }],
      base: { ...STAND },
      keys: loop(
        { sh: [0.05, 0, 0.24], el: [-0.12, H, 0] },
        { sh: [-0.15, 0, 0.16], el: [-2.3, H, 0] },
      ),
    },
  },
  {
    id: 'hammer-curl',
    name: 'Hammer Curl',
    primary: ['biceps', 'forearms'],
    secondary: [],
    equipment: 'Dumbbells',
    level: 'Beginner',
    sets: '3 × 10–12',
    steps: [
      'Stand holding dumbbells at your sides with palms facing your body.',
      'Keep that neutral "hammer" grip the whole time.',
      'Curl the weights up toward your shoulders.',
      'Lower under control.',
    ],
    tips: ['Elbows stay by your sides.', 'This grip works the forearm (brachioradialis) more than a normal curl.'],
    anim: {
      duration: 2.8,
      props: [{ type: 'dumbbell' }],
      base: { ...STAND },
      keys: loop(
        { sh: [0.05, 0, 0.08], el: [-0.12, 0, 0] },
        { sh: [-0.15, 0, 0.08], el: [-2.3, 0, 0] },
      ),
    },
  },
  {
    id: 'overhead-triceps',
    name: 'Overhead Triceps Extension',
    primary: ['triceps'],
    secondary: ['shoulders'],
    equipment: 'Dumbbell',
    level: 'Beginner',
    sets: '3 × 10–12',
    steps: [
      'Hold one dumbbell overhead with both hands cupping the top end.',
      'Keep your upper arms close to your head, pointing up.',
      'Bend your elbows to lower the weight behind your head.',
      'Straighten your arms to press it back up.',
    ],
    tips: ['Only your forearms move.', 'Brace your abs so your lower back doesn’t arch.', 'Keep your elbows pointing forward, not flaring out.'],
    anim: {
      duration: 3,
      props: [{ type: 'dbMid' }],
      base: { pos: [0, 0.995, 0] },
      keys: loop(
        { sh: [-2.75, 0, -0.2], el: [-2.25, 0, 0] },
        { sh: [-2.85, 0, -0.2], el: [-0.12, 0, 0] },
      ),
    },
  },
  {
    id: 'bench-dip',
    name: 'Bench Dip',
    primary: ['triceps'],
    secondary: ['chest', 'shoulders'],
    equipment: 'Bench',
    level: 'Beginner',
    sets: '3 × 10–15',
    steps: [
      'Sit on the edge of a bench, hands next to your hips, fingers forward.',
      'Slide your hips off the bench with legs out in front, heels on the floor.',
      'Bend your elbows straight back to lower your hips toward the floor.',
      'Press through your palms to straighten your arms.',
    ],
    tips: ['Keep your back close to the bench.', 'Stop when your upper arms are about parallel to the floor.', 'Bend your knees to make it easier.'],
    anim: {
      duration: 2.8,
      cam: { pos: [2.3, 1.3, 2.4], target: [0, 0.55, 0] },
      legPref: [1, 0],
      props: [{ type: 'bench', x: 0, z: -0.36, height: 0.45, length: 0.36, width: 1.1 }],
      base: { ik: { hand: [0.48, -0.2], foot: [0.07, 0.72] }, footAngle: -0.25, handAngle: -H, sh: [0, 0, 0.12] },
      keys: loop(
        { pos: [0, 0.5, 0.03], rot: [0.05, 0, 0] },
        { pos: [0, 0.27, 0.0], rot: [0.1, 0, 0], spine: [0.05, 0, 0] },
      ),
    },
  },

  // ---------------------------------------------------------------- SHOULDERS
  {
    id: 'shoulder-press',
    name: 'Dumbbell Shoulder Press',
    primary: ['shoulders'],
    secondary: ['triceps', 'traps'],
    equipment: 'Dumbbells',
    level: 'Beginner',
    sets: '4 × 8–10',
    steps: [
      'Stand tall with dumbbells at shoulder height, palms facing forward.',
      'Brace your core and squeeze your glutes.',
      'Press the weights straight overhead until your arms are fully extended.',
      'Lower back to shoulder height under control.',
    ],
    tips: ['Don’t lean back. Ribs down.', 'Forearms stay vertical.', 'Bring your head slightly forward at the top.'],
    anim: {
      duration: 3,
      props: [{ type: 'dumbbell' }],
      base: { pos: [0, 0.995, 0] },
      keys: loop(
        { sh: [-H, 0, 1.4], el: [-1.75, 0, 0] },
        { sh: [0, -H, 2.95], el: [-0.08, 0, 0] },
      ),
    },
  },
  {
    id: 'lateral-raise',
    name: 'Lateral Raise',
    primary: ['shoulders'],
    secondary: ['traps'],
    equipment: 'Dumbbells',
    level: 'Beginner',
    sets: '3 × 12–15',
    steps: [
      'Stand holding light dumbbells at your sides.',
      'With a slight bend in the elbows, raise your arms out to the sides.',
      'Stop when your arms are level with your shoulders.',
      'Lower slowly.',
    ],
    tips: ['Lead with your elbows, not your hands.', 'Don’t shrug: keep your traps relaxed.', 'Go light and control the movement.'],
    anim: {
      duration: 2.8,
      props: [{ type: 'dumbbell' }],
      base: { pos: [0, 0.995, 0], el: [-0.25, 0, 0] },
      keys: loop({ sh: [0, 0, 0.12] }, { sh: [-0.2, 0, 1.5] }, 0.45, 0.08),
    },
  },

  // ---------------------------------------------------------------- BACK
  {
    id: 'bent-over-row',
    name: 'Barbell Bent-Over Row',
    primary: ['lats', 'traps'],
    secondary: ['biceps', 'lower_back', 'forearms'],
    equipment: 'Barbell',
    level: 'Intermediate',
    sets: '4 × 8–10',
    steps: [
      'Hold a barbell, hinge forward at the hips with soft knees and a flat back.',
      'Let the bar hang below your shoulders at arm’s length.',
      'Pull the bar to your lower ribs, driving your elbows back.',
      'Squeeze your shoulder blades together, then lower under control.',
    ],
    tips: ['Keep your torso still; don’t yank with your back.', 'Think "elbows to hips".', 'Neck in line with your spine.'],
    anim: {
      duration: 2.6,
      props: [{ type: 'barbell' }],
      handRel: true,
      base: { pos: [0, 0.9, -0.12], rot: [0.95, 0, 0], spine: [0.1, 0, 0], neck: [-0.6, 0, 0], ik: { foot: [0.07, 0] }, footAngle: 0, sh: [0, 0, 0.1] },
      keys: loop({ ik: { hand: [-0.57, 0.02] } }, { ik: { hand: [-0.3, -0.2] } }),
    },
  },
  {
    id: 'chin-up',
    name: 'Chin-Up',
    primary: ['lats', 'biceps'],
    secondary: ['forearms', 'abs', 'shoulders'],
    equipment: 'Pull-up bar',
    level: 'Intermediate',
    sets: '3 × max reps',
    steps: [
      'Hang from a bar with palms facing you, hands about shoulder-width apart.',
      'Pull your shoulder blades down and back.',
      'Pull yourself up until your chin clears the bar.',
      'Lower all the way down until your arms are straight.',
    ],
    tips: ['No kipping or swinging.', 'Lead with your chest.', 'Can’t do one yet? Use a band or do slow negatives.'],
    anim: {
      duration: 3.2,
      cam: { pos: [2.6, 1.9, 3.0], target: [0, 1.35, 0] },
      armPref: [-1, 0.4],
      props: [{ type: 'pullbar', y: 2.155, z: 0.1 }],
      base: { ik: { hand: [2.1, 0.1] }, handAngle: PI, rot: [-0.08, 0, 0], hip: [-0.25, 0, 0], kn: [0.7, 0, 0], an: [0.4, 0, 0], sh: [0, 0, 0.05] },
      keys: loop({ pos: [0, 1.1, -0.02] }, { pos: [0, 1.52, -0.02], neck: [-0.15, 0, 0] }),
    },
  },
  {
    id: 'shrug',
    name: 'Dumbbell Shrug',
    primary: ['traps'],
    secondary: ['forearms'],
    equipment: 'Dumbbells',
    level: 'Beginner',
    sets: '3 × 12–15',
    steps: [
      'Stand tall holding heavy dumbbells at your sides.',
      'Keep your arms straight.',
      'Lift your shoulders straight up toward your ears.',
      'Hold for a second, then lower slowly.',
    ],
    tips: ['Lift straight up; don’t roll your shoulders.', 'Don’t bend your elbows.'],
    anim: {
      duration: 2.4,
      props: [{ type: 'dumbbell' }],
      base: { pos: [0, 0.995, 0], sh: [0, 0, 0.1], el: [-0.05, 0, 0] },
      keys: loop({ shrug: 0 }, { shrug: 0.065 }, 0.4, 0.2),
    },
  },
  {
    id: 'superman',
    name: 'Superman',
    primary: ['lower_back'],
    secondary: ['glutes', 'hamstrings', 'shoulders'],
    equipment: 'Bodyweight',
    level: 'Beginner',
    sets: '3 × 12 (2 s hold)',
    steps: [
      'Lie face down with your arms stretched out in front of you.',
      'Keep your neck neutral, looking at the floor.',
      'Lift your arms, chest and legs off the floor at the same time.',
      'Hold for 2 seconds, then lower slowly.',
    ],
    tips: ['Lift with your back and glutes, not by flinging your limbs.', 'Small lifts are fine. Control matters more.'],
    anim: {
      duration: 3.2,
      cam: FLOOR_CAM,
      props: [{ type: 'mat', z: 0.15 }],
      base: { pos: [0, 0.13, -0.15], rot: [H, 0, 0], sh: [0, 0, 0.3], el: [-0.05, 0, 0], an: [1.2, 0, 0] },
      keys: loop(
        { armAbs: -H, neck: [-0.1, 0, 0], hip: [0.02, 0, 0] },
        { armAbs: -H - 0.4, spine: [-0.22, 0, 0], chest: [-0.15, 0, 0], neck: [-0.3, 0, 0], hip: [0.32, 0, 0] },
        0.45, 0.15,
      ),
    },
  },

  // ---------------------------------------------------------------- CORE
  {
    id: 'crunch',
    name: 'Crunch',
    primary: ['abs'],
    secondary: ['obliques'],
    equipment: 'Bodyweight',
    level: 'Beginner',
    sets: '3 × 15–20',
    steps: [
      'Lie on your back with knees bent and feet flat on the floor.',
      'Reach your arms toward your knees.',
      'Curl your head, shoulders and upper back off the floor by contracting your abs.',
      'Pause, then lower slowly.',
    ],
    tips: ['Think "ribs toward hips".', 'Don’t pull on your neck.', 'Breathe out as you curl up.'],
    anim: {
      duration: 2.6,
      cam: FLOOR_CAM,
      legPref: [1, 0],
      props: [{ type: 'mat', z: 0.05 }],
      base: { pos: [0, 0.12, 0.15], rot: [-H, 0, 0], ik: { foot: [0.07, 0.62] }, footAngle: 0, el: [-0.1, 0, 0] },
      keys: loop({ neck: [0.1, 0, 0], sh: [-0.3, 0, 0.14] }, { spine: [0.42, 0, 0], chest: [0.3, 0, 0], neck: [0.35, 0, 0], sh: [-0.6, 0, 0.12] }),
    },
  },
  {
    id: 'leg-raise',
    name: 'Lying Leg Raise',
    primary: ['abs'],
    secondary: ['obliques'],
    equipment: 'Bodyweight',
    level: 'Intermediate',
    sets: '3 × 10–12',
    steps: [
      'Lie on your back, legs straight, arms by your sides.',
      'Press your lower back into the floor.',
      'Keeping your legs straight, lift them until they point at the ceiling.',
      'Lower slowly, stopping just before your heels touch the floor.',
    ],
    tips: ['Don’t let your lower back arch off the floor.', 'Bend your knees slightly to make it easier.'],
    anim: {
      duration: 3.2,
      cam: FLOOR_CAM,
      props: [{ type: 'mat', z: 0.05 }],
      base: { pos: [0, 0.12, 0.1], rot: [-H, 0, 0], sh: [0, 0, 0.15], el: [0, 0, 0], kn: [0.05, 0, 0], an: [0.6, 0, 0] },
      keys: loop({ hip: [-0.08, 0, 0] }, { hip: [-1.5, 0, 0] }),
    },
  },
  {
    id: 'plank',
    name: 'Plank',
    primary: ['abs'],
    secondary: ['obliques', 'shoulders', 'lower_back', 'glutes'],
    equipment: 'Bodyweight',
    level: 'Beginner',
    sets: '3 × 30–60 s',
    steps: [
      'Rest on your forearms with elbows under your shoulders.',
      'Step your feet back so your body forms a straight line.',
      'Brace your abs and squeeze your glutes.',
      'Hold the position while breathing steadily.',
    ],
    tips: ['Don’t let your hips sag or pike up.', 'Push the floor away with your forearms.', 'Quality beats time: stop when your form breaks.'],
    anim: {
      duration: 4,
      cam: { pos: [2.9, 1.15, 0.9], target: [0, 0.25, -0.05] },
      props: [{ type: 'mat', z: -0.05 }],
      base: { rot: [H - 0.114, 0, 0], armAbs: 0, el: [-H, 0, 0], sh: [0, 0, 0.05], ik: { foot: [0.17, -0.75] }, footAngle: 1.35, neck: [-0.1, 0, 0] },
      keys: [
        { t: 0, pos: [0, 0.276, 0.174] },
        { t: 0.5, pos: [0, 0.284, 0.174] },
        { t: 1, pos: [0, 0.276, 0.174] },
      ],
    },
  },
  {
    id: 'russian-twist',
    name: 'Russian Twist',
    primary: ['obliques'],
    secondary: ['abs'],
    equipment: 'Medicine ball (optional)',
    level: 'Intermediate',
    sets: '3 × 20 (10 each side)',
    steps: [
      'Sit with knees bent and lean back to about 45°, feet off the floor if you can.',
      'Hold a ball or your hands together in front of your chest.',
      'Rotate your torso to bring the ball beside one hip.',
      'Rotate to the other side. That’s one rep.',
    ],
    tips: ['Turn your shoulders, not just your arms.', 'Keep your chest up and back straight.', 'Put your heels down to make it easier.'],
    anim: {
      duration: 3,
      cam: { pos: [2.2, 1.2, 2.4], target: [0, 0.45, 0] },
      props: [{ type: 'mat', z: 0.1 }, { type: 'ball' }],
      base: { pos: [0, 0.14, 0], rot: [-0.55, 0, 0], hip: [-1.66, 0, 0.12], kn: [0.6, 0, 0], an: [0.25, 0, 0], sh: [-1.15, 0, -0.3], el: [-0.7, 0, 0], neck: [0.25, 0, 0] },
      keys: [
        { t: 0 },
        { t: 0.25, chest: [0, 0.55, 0], spine: [0, 0.25, 0] },
        { t: 0.5 },
        { t: 0.75, chest: [0, -0.55, 0], spine: [0, -0.25, 0] },
        { t: 1 },
      ],
    },
  },
  {
    id: 'side-bend',
    name: 'Dumbbell Side Bend',
    primary: ['obliques'],
    secondary: ['lower_back'],
    equipment: 'Dumbbell',
    level: 'Beginner',
    sets: '3 × 12 each side',
    steps: [
      'Stand tall holding a dumbbell in one hand at your side.',
      'Bend sideways toward the dumbbell, sliding it down your leg.',
      'Use the obliques on the opposite side to pull yourself back up past upright.',
      'Finish your reps, then switch hands.',
    ],
    tips: ['Bend straight sideways, not forward or back.', 'Move slowly and keep your hips still.'],
    anim: {
      duration: 3,
      props: [{ type: 'dumbbell', hand: 'R' }],
      base: { pos: [0, 0.995, 0], sh: [0, 0, 0.06], el: [-0.1, 0, 0] },
      keys: [
        { t: 0 },
        { t: 0.35, spine: [0, 0, 0.22], chest: [0, 0, 0.14] },
        { t: 0.45, spine: [0, 0, 0.22], chest: [0, 0, 0.14] },
        { t: 0.8, spine: [0, 0, -0.1], chest: [0, 0, -0.06] },
        { t: 1 },
      ],
    },
  },
  {
    id: 'farmer-march',
    name: 'Farmer’s March',
    primary: ['forearms', 'traps'],
    secondary: ['abs', 'obliques', 'glutes'],
    equipment: 'Dumbbells',
    level: 'Beginner',
    sets: '3 × 40 s',
    steps: [
      'Pick up heavy dumbbells and stand tall with them at your sides.',
      'Pull your shoulders back and brace your core.',
      'March in place, lifting each knee to hip height.',
      'Keep your grip tight and your torso still the whole time.',
    ],
    tips: ['Don’t let the weights swing.', 'Stand tall; don’t lean to one side.', 'Walk for distance once you’ve got the hang of it.'],
    anim: {
      duration: 1.8,
      props: [{ type: 'dumbbell' }],
      base: { sh: [0, 0, 0.12], el: [-0.05, 0, 0] },
      keys: [
        { t: 0, pos: [0, 0.995, 0] },
        { t: 0.25, pos: [0, 1.0, 0], hipL: [-1.1, 0, 0], knL: [1.3, 0, 0], anL: [0.3, 0, 0], spine: [0, 0.04, 0] },
        { t: 0.5, pos: [0, 0.995, 0] },
        { t: 0.75, pos: [0, 1.0, 0], hipR: [-1.1, 0, 0], knR: [1.3, 0, 0], anR: [0.3, 0, 0], spine: [0, -0.04, 0] },
        { t: 1, pos: [0, 0.995, 0] },
      ],
    },
  },
  // ---------------------------------------------------------------- HEAD-SPECIFIC
  {
    id: 'incline-db-press',
    name: 'Incline Dumbbell Press',
    primary: ['chest', 'shoulders'],
    secondary: ['triceps'],
    equipment: 'Dumbbells, incline bench',
    level: 'Intermediate',
    sets: '4 × 8–10',
    steps: [
      'Set a bench to about 30–40° and lie back with a dumbbell in each hand.',
      'Press the dumbbells up over your upper chest, palms facing forward.',
      'Lower them to the top of your chest, elbows slightly tucked.',
      'Press back up and slightly in until your arms are straight.',
    ],
    tips: ['Higher than 45° turns it into a shoulder press.', 'Keep your shoulder blades pinned to the bench.', 'Feel the stretch across the collarbone.'],
    anim: {
      duration: 3.2,
      cam: { pos: [2.6, 1.7, 1.5], target: [0, 0.75, -0.1] },
      legPref: [1, 0],
      props: [{ type: 'dumbbell' }, { type: 'bench', x: 0, z: 0.05, height: 0.45, incline: 0.62 }],
      base: { pos: [0, 0.575, 0.12], rot: [-0.95, 0, 0], neck: [0.25, 0, 0], ik: { foot: [0.07, 0.62] }, footAngle: 0 },
      keys: loop(
        { sh: [-2.15, H, 0], el: [0, 0, 0] },
        { sh: [-0.3, 0, 1.2], el: [-1.55, 0, 0] },
      ),
    },
  },
  {
    id: 'drag-curl',
    name: 'Dumbbell Drag Curl',
    primary: ['biceps'],
    secondary: ['forearms'],
    equipment: 'Dumbbells',
    level: 'Intermediate',
    sets: '3 × 10–12',
    steps: [
      'Stand tall holding dumbbells at your sides, palms facing forward.',
      'Curl the weights up while pulling your elbows back behind your body.',
      'Keep the dumbbells close, "dragging" them up the front of your torso.',
      'Squeeze at the top, then lower slowly along the same path.',
    ],
    tips: ['Elbows travel back, not forward. That keeps the long head working.', 'Go lighter than a normal curl.', 'Don’t lean back.'],
    anim: {
      duration: 2.8,
      props: [{ type: 'dumbbell' }],
      base: { ...STAND },
      keys: loop(
        { sh: [0.05, 0, 0.24], el: [-0.12, H, 0] },
        { sh: [0.6, 0, 0.32], el: [-1.95, H, 0] },
      ),
    },
  },
  {
    id: 'wide-curl',
    name: 'Wide-Grip Curl',
    primary: ['biceps'],
    secondary: ['forearms'],
    equipment: 'Dumbbells',
    level: 'Beginner',
    sets: '3 × 10–12',
    steps: [
      'Stand holding dumbbells with your arms angled out from your sides, palms forward.',
      'Keep the upper arms still at that angle.',
      'Curl the weights up toward your shoulders.',
      'Lower under control until your arms are straight.',
    ],
    tips: ['The wider arm angle shifts more work to the short (inner) head.', 'Keep your wrists straight.', 'No swinging.'],
    anim: {
      duration: 2.8,
      props: [{ type: 'dumbbell' }],
      base: { ...STAND },
      keys: loop(
        { sh: [0, 0, 0.42], el: [-0.12, H, 0] },
        { sh: [-0.12, 0, 0.42], el: [-2.25, H, 0] },
      ),
    },
  },
  {
    id: 'reverse-curl',
    name: 'Reverse Curl',
    primary: ['forearms', 'biceps'],
    secondary: [],
    equipment: 'Dumbbells',
    level: 'Beginner',
    sets: '3 × 12',
    steps: [
      'Stand holding dumbbells with an overhand grip, palms facing behind you.',
      'Pin your elbows to your sides.',
      'Curl the weights up, keeping the palms facing down.',
      'Lower slowly.',
    ],
    tips: ['The palms-down grip shifts work onto the brachioradialis and brachialis.', 'Keep the wrists straight; don’t let them droop.'],
    anim: {
      duration: 2.6,
      props: [{ type: 'dumbbell' }],
      base: { ...STAND },
      keys: loop(
        { sh: [-0.12, 0, 0.22], el: [-0.12, -H, 0] },
        { sh: [-0.15, 0, 0.16], el: [-2.2, -H, 0] },
      ),
    },
  },
  {
    id: 'diamond-push-up',
    name: 'Close-Grip Push-Up',
    primary: ['triceps', 'chest'],
    secondary: ['shoulders'],
    equipment: 'Bodyweight',
    level: 'Intermediate',
    sets: '3 × 8–12',
    steps: [
      'Start in a high plank with your hands under your chest, close together.',
      'Keep your elbows tucked tight to your ribs.',
      'Lower your chest toward your hands.',
      'Press back up by straightening your arms.',
    ],
    tips: ['Elbows brush your sides; they don’t flare.', 'Body stays in one straight line.', 'Too hard? Do them from your knees.'],
    anim: {
      duration: 2.6,
      cam: { pos: [2.9, 1.15, 0.9], target: [0, 0.3, -0.05] },
      props: [{ type: 'mat', z: -0.05 }],
      base: { ik: { hand: [0.045, 0.62], foot: [0.17, -0.75] }, footAngle: 1.35, handAngle: -H, sh: [0, 0, 0.03], neck: [-0.15, 0, 0] },
      keys: loop(
        { pos: [0, 0.455, 0.135], rot: [H - 0.312, 0, 0] },
        { pos: [0, 0.27, 0.172], rot: [H - 0.11, 0, 0] },
      ),
    },
  },
  {
    id: 'front-raise',
    name: 'Front Raise',
    primary: ['shoulders'],
    secondary: ['chest'],
    equipment: 'Dumbbells',
    level: 'Beginner',
    sets: '3 × 12',
    steps: [
      'Stand holding dumbbells in front of your thighs, palms facing you.',
      'With a slight bend in the elbows, raise both arms straight in front of you.',
      'Stop at shoulder height.',
      'Lower slowly.',
    ],
    tips: ['Don’t swing or lean back.', 'Stop at shoulder height.', 'Light weight, slow tempo.'],
    anim: {
      duration: 2.8,
      props: [{ type: 'dumbbell' }],
      base: { pos: [0, 0.995, 0] },
      keys: loop({ sh: [-0.32, 0, 0.12], el: [-0.12, -H, 0] }, { sh: [-1.55, 0, 0.12], el: [-0.12, -H, 0] }, 0.45, 0.08),
    },
  },
  {
    id: 'reverse-fly',
    name: 'Bent-Over Reverse Fly',
    primary: ['shoulders', 'upper_back'],
    secondary: ['traps', 'rotator_cuff'],
    equipment: 'Dumbbells',
    level: 'Beginner',
    sets: '3 × 12–15',
    steps: [
      'Hold light dumbbells and hinge forward until your torso is nearly parallel to the floor.',
      'Let the weights hang under your shoulders, palms facing each other.',
      'With soft elbows, raise your arms out to the sides.',
      'Squeeze your shoulder blades at the top, then lower slowly.',
    ],
    tips: ['Lead with the elbows and pinkies.', 'Keep your back flat and still.', 'Go light: the rear delts are small.'],
    anim: {
      duration: 2.8,
      props: [{ type: 'dumbbell' }],
      base: { pos: [0, 0.9, -0.12], rot: [0.95, 0, 0], spine: [0.1, 0, 0], neck: [-0.6, 0, 0], ik: { foot: [0.07, 0] }, footAngle: 0, el: [-0.25, 0, 0] },
      keys: loop({ sh: [-1.05, 0, 0.12] }, { sh: [-1.05, 0, 1.35] }, 0.45, 0.1),
    },
  },
  {
    id: 'external-rotation',
    name: 'Band External Rotation',
    primary: ['rotator_cuff'],
    secondary: ['shoulders'],
    equipment: 'Resistance band',
    level: 'Beginner',
    sets: '3 × 15 each arm',
    steps: [
      'Stand with your elbows bent to 90°, tucked against your sides, forearms pointing forward.',
      'Hold a band between your hands.',
      'Rotate your forearms outward, keeping the elbows pinned.',
      'Return slowly.',
    ],
    tips: ['Elbows stay glued to your sides.', 'Small, controlled movement; it’s not about load.', 'Great as a warm-up before pressing.'],
    anim: {
      duration: 2.4,
      base: { pos: [0, 0.995, 0] },
      keys: loop({ sh: [0, 0, 0.05], el: [-H, 0, 0] }, { sh: [0, 1.05, 0.05], el: [-H, 0, 0] }, 0.45, 0.1),
    },
  },
  {
    id: 'hip-abduction',
    name: 'Standing Hip Abduction',
    primary: ['glutes'],
    secondary: ['hip_flexors'],
    equipment: 'Bodyweight or band',
    level: 'Beginner',
    sets: '3 × 15 each leg',
    steps: [
      'Stand tall; hold onto something for balance if you need to.',
      'Keeping the leg straight and toes forward, lift one leg out to the side.',
      'Pause at the top, then lower slowly.',
      'Finish your reps, then switch legs.',
    ],
    tips: ['Don’t lean your torso to the side.', 'Toes point forward, not up.', 'Add a band above the knees to make it harder.'],
    anim: {
      duration: 2.4,
      base: { sh: [0, 0, 0.12], el: [-0.15, 0, 0] },
      keys: loop(
        { pos: [0, 0.995, 0], hipL: [0, 0, 0.05], hipR: [0, 0, 0.05] },
        { pos: [-0.025, 0.995, 0], rot: [0, 0, -0.05], hipL: [0, 0, 0.62], hipR: [0, 0, 0.0] },
        0.45, 0.12,
      ),
    },
  },
  {
    id: 'sumo-squat',
    name: 'Sumo Squat',
    primary: ['adductors', 'glutes', 'quads'],
    secondary: ['hamstrings'],
    equipment: 'Bodyweight',
    level: 'Beginner',
    sets: '3 × 12–15',
    steps: [
      'Stand with your feet much wider than shoulder-width, toes turned out.',
      'Keep your chest up and sit straight down between your heels.',
      'Push your knees out over your toes as you lower.',
      'Drive back up, squeezing your glutes and inner thighs.',
    ],
    tips: ['Knees follow the toes.', 'Torso stays upright.', 'The wide stance works the adductors.'],
    anim: {
      duration: 3.2,
      base: { ik: { foot: [0.07, 0] }, footAngle: 0, hip: [0, 0, 0.36], sh: [-0.55, 0, 0.3], el: [-2.0, H, 0] },
      keys: loop({ pos: [0, 0.94, 0] }, { pos: [0, 0.62, -0.08], rot: [0.18, 0, 0], neck: [-0.15, 0, 0] }),
    },
  },
  {
    id: 'standing-leg-curl',
    name: 'Standing Leg Curl',
    primary: ['hamstrings'],
    secondary: ['calves'],
    equipment: 'Bodyweight or ankle weight',
    level: 'Beginner',
    sets: '3 × 12 each leg',
    steps: [
      'Stand tall, holding a wall in front of you for balance.',
      'Keeping your thighs in line, bend one knee and bring the heel toward your glutes.',
      'Squeeze the hamstring at the top.',
      'Lower slowly. Finish your reps, then switch legs.',
    ],
    tips: ['Don’t let the knee drift forward.', 'Control the lowering.', 'Knee-only curls are the best way to train the short head of the biceps femoris.'],
    anim: {
      duration: 2.4,
      base: { pos: [0, 0.995, 0], sh: [-1.25, 0, 0.12], el: [-0.25, 0, 0] },
      keys: loop({ hipL: [0, 0, 0.03], knL: [0.05, 0, 0] }, { hipL: [0.12, 0, 0.03], knL: [1.9, 0, 0], anL: [0.35, 0, 0] }, 0.45, 0.12),
    },
  },
  {
    id: 'tibialis-raise',
    name: 'Tibialis Raise',
    primary: ['shins'],
    secondary: [],
    equipment: 'Bodyweight',
    level: 'Beginner',
    sets: '3 × 20',
    steps: [
      'Stand with your back against a wall, heels about a foot in front of you.',
      'Keep your legs straight and lift your toes as high as you can.',
      'Pause at the top.',
      'Lower slowly without letting the toes slap down.',
    ],
    tips: ['Heels stay planted.', 'Go for a burn: high reps work best.', 'Great for runners and knee health.'],
    anim: {
      duration: 2,
      base: { sh: [0, 0, 0.1], el: [-0.15, 0, 0] },
      keys: loop({ pos: [0, 0.995, 0], an: [0, 0, 0] }, { pos: [0, 1.006, 0], an: [-0.42, 0, 0] }, 0.4, 0.15),
    },
  },

];

export const EXERCISE_BY_ID = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));

// Which individual heads each exercise works. Lists are [primary, secondary].
// Group ids (e.g. 'quads') expand to every part in that group.
const PARTS_FOR = {
  squat: [['quads', 'glute_max', 'add_magnus'], ['bf_long', 'semitend', 'semimem', 'lower_back', 'soleus', 'rectus_abd']],
  'split-squat': [['vastus_lat', 'vastus_med', 'vastus_int', 'rectus_fem', 'glute_max'], ['glute_med', 'add_magnus', 'bf_long', 'semitend', 'gastroc_med', 'gastroc_lat']],
  rdl: [['bf_long', 'semitend', 'semimem', 'glute_max'], ['lower_back', 'add_magnus', 'fds', 'fcu_hum', 'trap_upper', 'trap_mid', 'lat_dorsi']],
  deadlift: [['glute_max', 'bf_long', 'semitend', 'semimem', 'lower_back', 'vastus_lat', 'vastus_med', 'vastus_int'], ['rectus_fem', 'add_magnus', 'trap_upper', 'trap_mid', 'lat_dorsi', 'fds', 'fcu_hum', 'fcu_uln', 'rectus_abd']],
  'glute-bridge': [['glute_max'], ['glute_med', 'bf_long', 'semitend', 'semimem', 'lower_back']],
  'calf-raise': [['gastroc_med', 'gastroc_lat', 'soleus'], ['plantaris', 'fib_long', 'fib_brev']],
  'single-calf-raise': [['gastroc_med', 'gastroc_lat', 'soleus'], ['plantaris', 'fib_long', 'fib_brev', 'glute_med']],
  'push-up': [['pec_stern', 'pec_abd', 'triceps_lat', 'triceps_med'], ['pec_clav', 'delt_front', 'triceps_long', 'serratus', 'rectus_abd']],
  'db-bench-press': [['pec_stern', 'pec_abd'], ['pec_clav', 'delt_front', 'triceps_lat', 'triceps_med', 'triceps_long']],
  'db-fly': [['pec_stern', 'pec_clav'], ['pec_abd', 'delt_front', 'biceps_short', 'coracobrachialis']],
  'bicep-curl': [['biceps_long', 'biceps_short'], ['brachialis', 'brachioradialis', 'fcr', 'pronator_hum']],
  'hammer-curl': [['brachialis', 'brachioradialis'], ['biceps_long', 'ecrl', 'ecrb']],
  'overhead-triceps': [['triceps_long'], ['triceps_lat', 'triceps_med']],
  'bench-dip': [['triceps_lat', 'triceps_med'], ['triceps_long', 'delt_front', 'pec_abd', 'pec_stern']],
  'shoulder-press': [['delt_front', 'delt_side'], ['triceps_lat', 'triceps_med', 'triceps_long', 'trap_upper', 'pec_clav', 'serratus', 'supraspinatus']],
  'lateral-raise': [['delt_side'], ['delt_front', 'supraspinatus', 'trap_upper']],
  'bent-over-row': [['lat_dorsi', 'trap_mid', 'rhomboid_major', 'rhomboid_minor'], ['teres_major', 'delt_rear', 'infraspinatus', 'biceps_long', 'biceps_short', 'brachialis', 'brachioradialis', 'lower_back', 'fds']],
  'chin-up': [['lat_dorsi', 'biceps_short', 'biceps_long'], ['teres_major', 'brachialis', 'trap_lower', 'rhomboid_major', 'pec_abd', 'rectus_abd', 'fds']],
  shrug: [['trap_upper'], ['levator_scap', 'trap_mid', 'fds', 'fcu_hum']],
  superman: [['ilio_lumb', 'ilio_thor', 'longissimus', 'spinalis'], ['glute_max', 'bf_long', 'semitend', 'trap_lower', 'delt_rear']],
  crunch: [['rectus_abd'], ['ext_oblique']],
  'leg-raise': [['rectus_abd', 'iliacus', 'psoas'], ['rectus_fem', 'ext_oblique', 'tfl', 'sartorius']],
  plank: [['rectus_abd'], ['ext_oblique', 'serratus', 'delt_front', 'glute_max', 'rectus_fem', 'vastus_lat']],
  'russian-twist': [['ext_oblique'], ['rectus_abd', 'iliacus', 'psoas']],
  'side-bend': [['ext_oblique'], ['ilio_lumb', 'longissimus']],
  'farmer-march': [['fds', 'fcu_hum', 'fcu_uln', 'fcr', 'trap_upper'], ['rectus_abd', 'ext_oblique', 'glute_med', 'iliacus', 'psoas', 'gastroc_med', 'soleus']],
  'incline-db-press': [['pec_clav', 'delt_front'], ['pec_stern', 'triceps_lat', 'triceps_med', 'triceps_long', 'serratus']],
  'drag-curl': [['biceps_long'], ['biceps_short', 'brachialis', 'brachioradialis']],
  'wide-curl': [['biceps_short'], ['biceps_long', 'brachialis', 'coracobrachialis']],
  'reverse-curl': [['brachioradialis', 'brachialis'], ['ecrl', 'ecrb', 'ext_dig', 'biceps_long']],
  'diamond-push-up': [['triceps_lat', 'triceps_med', 'triceps_long'], ['pec_stern', 'pec_clav', 'delt_front', 'rectus_abd']],
  'front-raise': [['delt_front'], ['pec_clav', 'delt_side', 'serratus', 'trap_upper']],
  'reverse-fly': [['delt_rear', 'rhomboid_major', 'rhomboid_minor'], ['trap_mid', 'infraspinatus', 'teres_minor', 'trap_lower']],
  'external-rotation': [['infraspinatus', 'teres_minor'], ['delt_rear', 'supraspinatus']],
  'hip-abduction': [['glute_med', 'glute_min'], ['tfl', 'glute_max', 'sartorius']],
  'sumo-squat': [['add_magnus', 'add_longus', 'glute_max', 'vastus_med'], ['add_brevis', 'gracilis', 'vastus_lat', 'rectus_fem', 'semitend']],
  'standing-leg-curl': [['bf_short', 'bf_long', 'semitend', 'semimem'], ['gastroc_med', 'gastroc_lat', 'gracilis', 'sartorius']],
  'tibialis-raise': [['tib_ant'], ['edl', 'ehl']],
};

const expand = (list) => list.flatMap((id) => (GROUPS[id] ? GROUPS[id].parts : [id]));
for (const e of EXERCISES) {
  const p = PARTS_FOR[e.id];
  e.parts = p ? { primary: expand(p[0]), secondary: expand(p[1]).filter((x) => !expand(p[0]).includes(x)) } : { primary: expand(e.primary), secondary: expand(e.secondary) };
  // groups touched (for group pages), derived from parts so the two never disagree
  const pg = (ids) => [...new Set(ids.map((x) => PART_GROUP[x]))];
  e.primary = pg(e.parts.primary);
  e.secondary = pg(e.parts.secondary).filter((g) => !e.primary.includes(g));
}

// Exercises for a group id or a part id, primary first.
export function exercisesFor(id) {
  const isPart = !GROUPS[id];
  const prim = [];
  const sec = [];
  for (const e of EXERCISES) {
    const P = isPart ? e.parts.primary : e.primary;
    const S = isPart ? e.parts.secondary : e.secondary;
    if (P.includes(id)) prim.push({ ex: e, role: 'primary' });
    else if (S.includes(id)) sec.push({ ex: e, role: 'secondary' });
  }
  return [...prim, ...sec];
}
