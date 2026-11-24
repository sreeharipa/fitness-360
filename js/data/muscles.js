// Muscle groups shown on the 3D body.
// `view` decides which side the camera turns to when a muscle is picked from the list.
export const MUSCLES = {
  chest: {
    name: 'Chest',
    latin: 'Pectoralis major & minor',
    view: 'front',
    desc: 'Big fan-shaped muscles across the front of the ribcage. They push your arms forward and pull them across your body: think push-ups, presses and hugs.',
  },
  shoulders: {
    name: 'Shoulders',
    latin: 'Deltoids (front, side, rear)',
    view: 'front',
    desc: 'Three-headed cap over the shoulder joint. Lifts the arm forward, out to the side and back. Strong delts give the upper body its width.',
  },
  biceps: {
    name: 'Biceps',
    latin: 'Biceps brachii',
    view: 'front',
    desc: 'Front of the upper arm. Bends the elbow and turns the palm up. They also help with every pulling movement.',
  },
  triceps: {
    name: 'Triceps',
    latin: 'Triceps brachii',
    view: 'back',
    desc: 'Back of the upper arm, about two-thirds of its size. Straightens the elbow, so it works hard in presses, push-ups and dips.',
  },
  forearms: {
    name: 'Forearms',
    latin: 'Wrist flexors & extensors',
    view: 'front',
    desc: 'Many small muscles that control the wrist and fingers. They decide how strong your grip is for deadlifts, rows and carries.',
  },
  abs: {
    name: 'Abs',
    latin: 'Rectus abdominis',
    view: 'front',
    desc: 'The "six-pack" running down the front of the stomach. It curls the spine forward and braces the core to protect your back.',
  },
  obliques: {
    name: 'Obliques',
    latin: 'External & internal obliques',
    view: 'front',
    desc: 'Along the sides of the waist. They twist and side-bend the torso and stop it from rotating when it shouldn’t.',
  },
  traps: {
    name: 'Traps',
    latin: 'Trapezius',
    view: 'back',
    desc: 'Diamond-shaped muscle from the neck to the mid back. Shrugs, retracts and stabilises the shoulder blades.',
  },
  lats: {
    name: 'Lats',
    latin: 'Latissimus dorsi',
    view: 'back',
    desc: 'The widest muscle of the back. Pulls the arms down and back, which is what gives the back its V-taper. Used in pull-ups and rows.',
  },
  lower_back: {
    name: 'Lower Back',
    latin: 'Erector spinae',
    view: 'back',
    desc: 'Two columns of muscle along the spine. They keep you upright and hold the back straight when you hinge and lift.',
  },
  glutes: {
    name: 'Glutes',
    latin: 'Gluteus maximus & medius',
    view: 'back',
    desc: 'The strongest muscles in the body. They extend the hip for standing up, climbing, sprinting and jumping.',
  },
  quads: {
    name: 'Quads',
    latin: 'Quadriceps femoris',
    view: 'front',
    desc: 'Four muscles on the front of the thigh. They straighten the knee for squats, lunges, stairs and jumping.',
  },
  hamstrings: {
    name: 'Hamstrings',
    latin: 'Biceps femoris, semitendinosus, semimembranosus',
    view: 'back',
    desc: 'Back of the thigh. They bend the knee and extend the hip, and matter a lot for sprinting and for keeping knees healthy.',
  },
  calves: {
    name: 'Calves',
    latin: 'Gastrocnemius & soleus',
    view: 'back',
    desc: 'Lower leg. They point the foot and push you off the ground with every step, run and jump.',
  },
};

export const MUSCLE_IDS = Object.keys(MUSCLES);
