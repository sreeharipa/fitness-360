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
        { pos: [0, 0.975, 0], rot: [0.03, 0, 0] },
        { pos: [0, 0.88, -0.22], rot: [1.05, 0, 0], spine: [0.05, 0, 0], neck: [-0.55, 0, 0] },
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
        { t: 0, pos: [0, 0.58, -0.2], rot: [0.85, 0, 0], spine: [0.1, 0, 0], neck: [-0.55, 0, 0] },
        { t: 0.4, pos: [0, 0.985, 0], rot: [0.02, 0, 0] },
        { t: 0.55, pos: [0, 0.985, 0], rot: [0.02, 0, 0] },
        { t: 1, pos: [0, 0.58, -0.2], rot: [0.85, 0, 0], spine: [0.1, 0, 0], neck: [-0.55, 0, 0] },
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
        { sh: [0.05, 0, 0.08], el: [-0.12, H, 0] },
        { sh: [-0.15, 0, 0.08], el: [-2.3, H, 0] },
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
      base: { pos: [0, 0.12, 0.15], rot: [-H, 0, 0], ik: { foot: [0.07, 0.62] }, footAngle: 0, sh: [-0.75, 0, 0.12], el: [-0.1, 0, 0] },
      keys: loop({ neck: [0.1, 0, 0] }, { spine: [0.42, 0, 0], chest: [0.3, 0, 0], neck: [0.35, 0, 0] }),
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
];

export const EXERCISE_BY_ID = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));

export function exercisesFor(muscleId) {
  const prim = EXERCISES.filter((e) => e.primary.includes(muscleId));
  const sec = EXERCISES.filter((e) => !e.primary.includes(muscleId) && e.secondary.includes(muscleId));
  return [...prim.map((e) => ({ ex: e, role: 'primary' })), ...sec.map((e) => ({ ex: e, role: 'secondary' }))];
}
