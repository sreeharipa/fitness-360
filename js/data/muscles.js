// Muscle groups and their individual heads/parts. Part ids match the meshes in
// assets/anatomy.json (built by tools/build-anatomy.mjs from BodyParts3D).
// `view` decides which side the camera turns to when picked from the list.

export const GROUPS = {
  chest: {
    name: 'Chest',
    latin: 'Pectoralis major & minor',
    view: 'front',
    desc: 'A fan-shaped muscle with three heads across the front of the ribcage. It pushes your arms forward and pulls them across the body.',
    parts: ['pec_clav', 'pec_stern', 'pec_abd', 'pec_minor'],
  },
  shoulders: {
    name: 'Shoulders',
    latin: 'Deltoideus',
    view: 'front',
    desc: 'Three heads capping the shoulder joint. Front, side and rear each lift the arm in a different direction.',
    parts: ['delt_front', 'delt_side', 'delt_rear'],
  },
  rotator_cuff: {
    name: 'Rotator cuff',
    latin: 'Supraspinatus, infraspinatus, teres minor, subscapularis',
    view: 'back',
    desc: 'Four small muscles that hold the ball of the shoulder in its socket and rotate the arm. They are key for healthy, pain-free pressing.',
    parts: ['supraspinatus', 'infraspinatus', 'teres_minor', 'subscapularis'],
  },
  biceps: {
    name: 'Biceps & brachialis',
    latin: 'Biceps brachii, brachialis',
    view: 'front',
    desc: 'The front of the upper arm. The two biceps heads bend the elbow and turn the palm up. The brachialis underneath is the pure elbow flexor.',
    parts: ['biceps_long', 'biceps_short', 'brachialis', 'coracobrachialis'],
  },
  triceps: {
    name: 'Triceps',
    latin: 'Triceps brachii',
    view: 'back',
    desc: 'Three heads on the back of the upper arm, about two-thirds of its size. They straighten the elbow, and the long head also pulls the arm down and back.',
    parts: ['triceps_long', 'triceps_lat', 'triceps_med'],
  },
  forearms: {
    name: 'Forearms',
    latin: 'Wrist & finger flexors and extensors',
    view: 'front',
    desc: 'Flexors on the palm side and extensors on the back control the wrist, fingers and grip. The brachioradialis also bends the elbow.',
    parts: ['brachioradialis', 'pronator_hum', 'pronator_uln', 'fcr', 'palmaris', 'fcu_hum', 'fcu_uln', 'fds', 'ecrl', 'ecrb', 'ext_dig', 'edm', 'ecu', 'epl', 'epb'],
  },
  abs: {
    name: 'Abs',
    latin: 'Rectus abdominis',
    view: 'front',
    desc: 'The "six-pack". It curls the spine forward and braces the trunk. The tendinous bands across it create the separate blocks.',
    parts: ['rectus_abd'],
  },
  obliques: {
    name: 'Obliques',
    latin: 'Obliquus externus abdominis',
    view: 'front',
    desc: 'The sides of the waist. They twist and side-bend the trunk, and resist rotation when you carry or brace.',
    parts: ['ext_oblique'],
  },
  serratus: {
    name: 'Serratus',
    latin: 'Serratus anterior',
    view: 'front',
    desc: 'Finger-like slips along the side of the ribs. The serratus pulls the shoulder blade forward around the ribcage, as at the top of a push-up or punch.',
    parts: ['serratus'],
  },
  traps: {
    name: 'Traps',
    latin: 'Trapezius',
    view: 'back',
    desc: 'A large diamond across the upper back with three parts. The upper part shrugs, the middle part squeezes the shoulder blades together, and the lower part pulls them down.',
    parts: ['trap_upper', 'trap_mid', 'trap_lower'],
  },
  upper_back: {
    name: 'Rhomboids',
    latin: 'Rhomboid major & minor, levator scapulae',
    view: 'back',
    desc: 'Between the shoulder blades, under the traps. These muscles pull the shoulder blades together and are key for posture and rows.',
    parts: ['rhomboid_major', 'rhomboid_minor', 'levator_scap'],
  },
  lats: {
    name: 'Lats',
    latin: 'Latissimus dorsi, teres major',
    view: 'back',
    desc: 'The widest muscle of the back, running from the pelvis and spine up into the armpit. It pulls the arm down and back in pull-ups and rows.',
    parts: ['lat_dorsi', 'teres_major'],
  },
  lower_back: {
    name: 'Lower back',
    latin: 'Erector spinae',
    view: 'back',
    desc: 'Three columns either side of the spine. They straighten and stabilise the back in deadlifts, squats and everyday lifting.',
    parts: ['ilio_lumb', 'ilio_thor', 'longissimus', 'spinalis'],
  },
  glutes: {
    name: 'Glutes',
    latin: 'Gluteus maximus, medius, minimus',
    view: 'back',
    desc: 'The maximus extends the hip, and is the engine of squats, deadlifts and sprints. The medius and minimus on the side hold the pelvis level.',
    parts: ['glute_max', 'glute_med', 'glute_min'],
  },
  hip_flexors: {
    name: 'Hip flexors',
    latin: 'Iliopsoas, sartorius, tensor fasciae latae',
    view: 'front',
    desc: 'Muscles that lift the thigh forward. The iliopsoas is the strongest; the sartorius is the longest muscle in the body.',
    parts: ['iliacus', 'psoas', 'sartorius', 'tfl'],
  },
  adductors: {
    name: 'Adductors',
    latin: 'Adductor longus, brevis, magnus, gracilis, pectineus',
    view: 'front',
    desc: 'The inner thigh. They pull the legs together, and the adductor magnus is also a powerful hip extensor in squats.',
    parts: ['add_longus', 'add_brevis', 'add_magnus', 'gracilis', 'pectineus'],
  },
  quads: {
    name: 'Quads',
    latin: 'Quadriceps femoris',
    view: 'front',
    desc: 'Four heads on the front of the thigh that straighten the knee. The rectus femoris also crosses the hip and helps lift the thigh.',
    parts: ['rectus_fem', 'vastus_lat', 'vastus_med', 'vastus_int'],
  },
  hamstrings: {
    name: 'Hamstrings',
    latin: 'Biceps femoris, semitendinosus, semimembranosus',
    view: 'back',
    desc: 'The back of the thigh. They bend the knee and extend the hip; every head except the short head of the biceps crosses both joints.',
    parts: ['bf_long', 'bf_short', 'semitend', 'semimem'],
  },
  calves: {
    name: 'Calves',
    latin: 'Gastrocnemius, soleus',
    view: 'back',
    desc: 'The two-headed gastrocnemius and the flat soleus underneath raise the heel. Straight-knee work hits the gastrocnemius; bent-knee work hits the soleus.',
    parts: ['gastroc_med', 'gastroc_lat', 'soleus', 'plantaris'],
  },
  shins: {
    name: 'Shins',
    latin: 'Tibialis anterior, fibularis',
    view: 'front',
    desc: 'The front and outside of the lower leg. These muscles lift the toes and steady the ankle, and help prevent shin splints.',
    parts: ['tib_ant', 'edl', 'ehl', 'fib_long', 'fib_brev'],
  },
  neck: {
    name: 'Neck',
    latin: 'Sternocleidomastoid',
    view: 'front',
    desc: 'The rope-like muscle on each side of the neck. It turns and bends the head.',
    parts: ['scm'],
  },
};

// Per-part info. `name` is the anatomical name; `alias` is the gym name when there is one.
export const PARTS = {
  pec_clav: { name: 'Clavicular head', alias: 'Upper chest', desc: 'Runs from the collarbone. Most active when pressing on an incline or raising the arm forward and up.' },
  pec_stern: { name: 'Sternocostal head', alias: 'Mid chest', desc: 'The bulk of the chest, from the breastbone. Flat presses and flyes hit it hardest.' },
  pec_abd: { name: 'Abdominal head', alias: 'Lower chest', desc: 'The lowest fibres, from the abdominal sheath. Dips and decline presses that drive the arm down and forward work it most.' },
  pec_minor: { name: 'Pectoralis minor', desc: 'A small muscle under the pecs that tilts the shoulder blade forward and down. Tightness here rounds the shoulders.' },

  delt_front: { name: 'Anterior deltoid', alias: 'Front delt', desc: 'Raises the arm forward. It works hard in every press, so most lifters get plenty.' },
  delt_side: { name: 'Lateral deltoid', alias: 'Side delt', desc: 'Raises the arm out to the side and gives the shoulders their width. Lateral raises isolate it.' },
  delt_rear: { name: 'Posterior deltoid', alias: 'Rear delt', desc: 'Pulls the arm back and out. Often under-trained; reverse flyes and pull-aparts target it.' },

  supraspinatus: { name: 'Supraspinatus', desc: 'Sits above the shoulder-blade spine and starts lifting the arm out to the side.' },
  infraspinatus: { name: 'Infraspinatus', desc: 'Covers the back of the shoulder blade and rotates the arm outward. Strong external rotators protect the shoulder.' },
  teres_minor: { name: 'Teres minor', desc: 'Small partner of the infraspinatus; also rotates the arm outward.' },
  subscapularis: { name: 'Subscapularis', desc: 'On the front surface of the shoulder blade, against the ribs. It rotates the arm inward.' },

  biceps_long: { name: 'Long head', alias: 'Outer biceps', desc: 'The outer head. It starts above the shoulder joint, so it gets the most stretch with the arm behind the body (incline or drag curls).' },
  biceps_short: { name: 'Short head', alias: 'Inner biceps', desc: 'The inner head. It starts at the front of the shoulder blade, so curls with the arms in front or a wider grip emphasise it.' },
  brachialis: { name: 'Brachialis', desc: 'Lies under the biceps and is the strongest elbow flexor in any grip. Hammer and reverse curls target it.' },
  coracobrachialis: { name: 'Coracobrachialis', desc: 'A small muscle high on the inner arm that helps raise the arm forward and toward the body.' },

  triceps_long: { name: 'Long head', desc: 'The largest head. It crosses the shoulder, so overhead extensions (arm up) stretch and train it best.' },
  triceps_lat: { name: 'Lateral head', desc: 'The outer horseshoe. It works hardest in pushdowns, close presses and dips.' },
  triceps_med: { name: 'Medial head', desc: 'Lies deep, under the other two heads. It is active in every elbow extension, especially at lockout.' },

  brachioradialis: { name: 'Brachioradialis', desc: 'The big forearm muscle near the elbow. It bends the elbow, especially with a thumbs-up or palms-down grip.' },
  pronator_hum: { name: 'Pronator teres (humeral head)', desc: 'Turns the palm down.' },
  pronator_uln: { name: 'Pronator teres (ulnar head)', desc: 'Small deep head of the pronator teres; turns the palm down.' },
  fcr: { name: 'Flexor carpi radialis', desc: 'Bends the wrist toward the palm and thumb side.' },
  palmaris: { name: 'Palmaris longus', desc: 'Thin wrist flexor; missing in about 1 in 7 people.' },
  fcu_hum: { name: 'Flexor carpi ulnaris (humeral head)', desc: 'Bends the wrist toward the pinky side. Important for grip.' },
  fcu_uln: { name: 'Flexor carpi ulnaris (ulnar head)', desc: 'Second head of the flexor carpi ulnaris.' },
  fds: { name: 'Flexor digitorum superficialis', desc: 'Curls the fingers. This is your main grip muscle in deadlifts and carries.' },
  ecrl: { name: 'Extensor carpi radialis longus', desc: 'Lifts the back of the hand; it fires to stabilise the wrist whenever you grip.' },
  ecrb: { name: 'Extensor carpi radialis brevis', desc: 'Wrist extensor; it is the muscle involved in tennis elbow.' },
  ext_dig: { name: 'Extensor digitorum', desc: 'Straightens the fingers.' },
  edm: { name: 'Extensor digiti minimi', desc: 'Straightens the little finger.' },
  ecu: { name: 'Extensor carpi ulnaris', desc: 'Extends the wrist toward the pinky side.' },
  epl: { name: 'Extensor pollicis longus', desc: 'Straightens the thumb.' },
  epb: { name: 'Extensor pollicis brevis', desc: 'Straightens the base of the thumb.' },

  rectus_abd: { name: 'Rectus abdominis', alias: 'Six-pack', desc: 'Flexes the spine (crunches) and tilts the pelvis back (leg raises). It braces the trunk in every heavy lift.' },
  ext_oblique: { name: 'External oblique', desc: 'Rotates the trunk to the opposite side and bends it sideways.' },
  serratus: { name: 'Serratus anterior', desc: 'Keeps the shoulder blade flat on the ribs and pushes it forward.' },

  trap_upper: { name: 'Upper trapezius', desc: 'Elevates the shoulder blades (shrugs) and helps rotate them as you lift overhead.' },
  trap_mid: { name: 'Middle trapezius', desc: 'Squeezes the shoulder blades together, as in rows.' },
  trap_lower: { name: 'Lower trapezius', desc: 'Pulls the shoulder blades down and helps rotate them upward. It is often weak in desk workers.' },

  rhomboid_major: { name: 'Rhomboid major', desc: 'Pulls the shoulder blade toward the spine.' },
  rhomboid_minor: { name: 'Rhomboid minor', desc: 'Small upper rhomboid; works with the rhomboid major.' },
  levator_scap: { name: 'Levator scapulae', desc: 'Lifts the shoulder blade and tilts the neck. A common spot for neck tension.' },

  lat_dorsi: { name: 'Latissimus dorsi', desc: 'Pulls the arm down and back toward the body. Pull-ups, rows and pulldowns train it.' },
  teres_major: { name: 'Teres major', alias: "Lat's little helper", desc: 'Works with the lats to pull the arm down and back.' },

  ilio_lumb: { name: 'Iliocostalis lumborum', desc: 'The outer erector column in the low back.' },
  ilio_thor: { name: 'Iliocostalis thoracis', desc: 'The outer erector column at rib level.' },
  longissimus: { name: 'Longissimus thoracis', desc: 'The middle and largest erector column. It keeps the back straight under load.' },
  spinalis: { name: 'Spinalis thoracis', desc: 'The innermost erector, right next to the spine.' },

  glute_max: { name: 'Gluteus maximus', desc: 'The largest muscle in the body. It extends and externally rotates the hip.' },
  glute_med: { name: 'Gluteus medius', desc: 'On the side of the hip. It abducts the thigh and holds the pelvis level when you stand on one leg.' },
  glute_min: { name: 'Gluteus minimus', desc: 'Lies under the medius and helps it.' },

  iliacus: { name: 'Iliacus', desc: 'Lines the inside of the pelvis and flexes the hip.' },
  psoas: { name: 'Psoas major', desc: 'Runs from the lumbar spine to the thigh. It is the main hip flexor and also stabilises the low back.' },
  sartorius: { name: 'Sartorius', desc: 'A long strap from hip to knee that flexes, abducts and rotates the thigh.' },
  tfl: { name: 'Tensor fasciae latae', desc: 'Small muscle at the front of the hip that tightens the IT band.' },

  add_longus: { name: 'Adductor longus', desc: 'The most prominent adductor; pulls the thigh inward.' },
  add_brevis: { name: 'Adductor brevis', desc: 'Short adductor under the longus.' },
  add_magnus: { name: 'Adductor magnus', desc: 'The largest adductor. Its rear part works like a hamstring and is very active in deep squats.' },
  gracilis: { name: 'Gracilis', desc: 'A thin strap on the inner thigh that crosses the knee.' },
  pectineus: { name: 'Pectineus', desc: 'Small, high adductor that also flexes the hip.' },

  rectus_fem: { name: 'Rectus femoris', desc: 'The only quad head that crosses the hip, so it also lifts the thigh forward.' },
  vastus_lat: { name: 'Vastus lateralis', alias: 'Outer quad', desc: 'The largest quad head, on the outside of the thigh.' },
  vastus_med: { name: 'Vastus medialis', alias: 'Teardrop', desc: 'The teardrop above the inner knee. It is important for knee tracking, especially near full lockout.' },
  vastus_int: { name: 'Vastus intermedius', desc: 'Sits deep, under the rectus femoris, and straightens the knee.' },

  bf_long: { name: 'Biceps femoris (long head)', desc: 'Outer hamstring that crosses the hip and knee. It is worked hardest by hip hinges such as RDLs.' },
  bf_short: { name: 'Biceps femoris (short head)', desc: 'The only hamstring part that crosses just the knee, so leg curls are what train it.' },
  semitend: { name: 'Semitendinosus', desc: 'Inner hamstring with a long tendon. Strongly involved in leg curls and Nordic curls.' },
  semimem: { name: 'Semimembranosus', desc: 'Broad inner hamstring under the semitendinosus.' },

  gastroc_med: { name: 'Gastrocnemius (medial head)', desc: 'Inner calf head. It crosses the knee, so straight-leg calf raises train it best.' },
  gastroc_lat: { name: 'Gastrocnemius (lateral head)', desc: 'Outer calf head; also best trained with straight knees.' },
  soleus: { name: 'Soleus', desc: 'Flat muscle under the gastrocnemius. It takes over in bent-knee calf raises and is crucial for running.' },
  plantaris: { name: 'Plantaris', desc: 'A tiny muscle with a very long tendon that assists the calf.' },

  tib_ant: { name: 'Tibialis anterior', desc: 'Lifts the foot and toes. Training it helps prevent shin splints.' },
  edl: { name: 'Extensor digitorum longus', desc: 'Lifts the toes and the foot.' },
  ehl: { name: 'Extensor hallucis longus', desc: 'Lifts the big toe.' },
  fib_long: { name: 'Fibularis longus', desc: 'Outer shin muscle that points the foot and steadies the ankle.' },
  fib_brev: { name: 'Fibularis brevis', desc: 'Shorter fibularis that steadies the ankle against rolling.' },

  scm: { name: 'Sternocleidomastoid', desc: 'Turns the head to the opposite side and flexes the neck.' },
};

export const GROUP_IDS = Object.keys(GROUPS);
export const PART_GROUP = {};
for (const [g, info] of Object.entries(GROUPS)) for (const p of info.parts) PART_GROUP[p] = g;
export const partName = (id) => PARTS[id]?.alias || PARTS[id]?.name || id;
