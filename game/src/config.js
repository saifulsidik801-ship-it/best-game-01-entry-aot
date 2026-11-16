// Tunables, the playable roster and the Titan kinds. Every hero below is drawn from the
// real Attack on Titan designs: hair colour and cut, eye colour, and the one item that
// identifies them at a glance (Mikasa's red scarf, Levi's white ascot, Armin's blond
// undercut with bangs, Eren's shaggy brown hair and green eyes). Titan kinds follow the
// series too: the skinless red-muscled 60 m Colossal, the plate-armoured 15 m Armored,
// the athletic long-haired Female, the furred ape-like Beast, and deformed pure Titans.
export const VIEW = { width: 1280, height: 720 };
export const STEP = 1 / 60;
export const BEST_KEY = 'titan-slayer-best';
export const GROUND_Y = 648;
export const WALL_X = 96;
export const GRAVITY = 1500;
export const MAX_LIVES = 3;
export const VICTORY_WAVE = 10;

/** Playable Survey Corps soldiers. stats: swing speed, slash rate, move speed. */
export const HEROES = [
  {
    id: 'eren', name: 'EREN YEAGER', title: 'The Attack Titan',
    hair: '#6b4a2f', hairStyle: 'shaggy', eyes: '#3f7d3a', skin: '#f2c9a0',
    scarf: null, ascot: false, cloak: true,
    desc: 'Shaggy brown hair, fierce green eyes. Balanced blade work.',
    speed: 1.0, slashRate: 1.0, swing: 1.0,
  },
  {
    id: 'mikasa', name: 'MIKASA ACKERMAN', title: 'Humanity\u2019s Second Strongest',
    hair: '#161616', hairStyle: 'bob', eyes: '#4a4a52', skin: '#f5d0b0',
    scarf: '#c0392b', ascot: false, cloak: true,
    desc: 'Black bob, calm grey eyes, the red scarf Eren gave her. Fastest blades.',
    speed: 1.08, slashRate: 1.3, swing: 1.05,
  },
  {
    id: 'levi', name: 'LEVI ACKERMAN', title: 'Humanity\u2019s Strongest Soldier',
    hair: '#0d0d0d', hairStyle: 'undercut', eyes: '#8a8f98', skin: '#f0c8a0',
    scarf: null, ascot: true, cloak: true,
    desc: 'Black undercut curtain, dull grey eyes, white ascot. Deadliest slashes.',
    speed: 1.05, slashRate: 1.15, swing: 1.2,
  },
  {
    id: 'armin', name: 'ARMIN ARLERT', title: 'The Strategist',
    hair: '#f2d06b', hairStyle: 'bangs', eyes: '#4a7ec2', skin: '#f6d3b3',
    scarf: null, ascot: false, cloak: true,
    desc: 'Blond undercut with bangs, big blue eyes. Repairs the Wall between waves.',
    speed: 0.95, slashRate: 1.0, swing: 0.95, wallRepair: 25,
  },
];

/** The rest of the 104th and the Corps, shown on the title screen's squad strip and
 *  heard in radio chatter during play. */
export const SQUAD = [
  { id: 'sasha', name: 'SASHA', hair: '#a34d2d', hairStyle: 'ponytail', eyes: '#7a4a2a', skin: '#f2c9a0', line: 'Potato break after this one!' },
  { id: 'connie', name: 'CONNIE', hair: '#2e2e2e', hairStyle: 'buzz', eyes: '#6b5a4a', skin: '#e8b98f', line: 'I\u2019m right behind you, Eren!' },
  { id: 'jean', name: 'JEAN', hair: '#9a8f7a', hairStyle: 'spiky', eyes: '#7a5a3a', skin: '#f0c8a0', line: 'Keep formation! Don\u2019t be reckless!' },
  { id: 'hange', name: 'HANGE', hair: '#6b4a2f', hairStyle: 'ponytail', eyes: '#5a3a22', skin: '#f5d0b0', glasses: true, line: 'Fascinating! Its nape is exposed!' },
  { id: 'erwin', name: 'ERWIN', hair: '#e8d27a', hairStyle: 'side', eyes: '#3a6ea5', skin: '#eec39a', line: 'Soldiers! Give your hearts! Hold the Wall!' },
];

/** Titan kinds: height in metres (game scale), speed, nape hits to kill, score. */
export const TITAN_KINDS = {
  pure:    { name: 'Pure Titan',    meters: 7,  speed: 26, hits: 1, score: 100, body: '#e8c39a' },
  tall:    { name: 'Tall Pure',     meters: 12, speed: 22, hits: 1, score: 150, body: '#d9a87e' },
  female:  { name: 'FEMALE TITAN', meters: 14, speed: 52, hits: 2, score: 500, body: '#f0c8a0' },
  beast:   { name: 'BEAST TITAN',  meters: 17, speed: 34, hits: 3, score: 800, body: '#8a6a4a' },
  armored: { name: 'ARMORED TITAN',meters: 15, speed: 40, hits: 3, score: 1000, body: '#cbb59a' },
  colossal:{ name: 'COLOSSAL TITAN',meters: 60, speed: 12, hits: 5, score: 3000, body: '#c0392b' },
};

/** Boss of each boss wave. */
export const BOSS_WAVES = { 5: 'female', 7: 'beast', 9: 'armored', 10: 'colossal' };

/** Anchors the ODM cables can hook: rooftops and the Wall top across Shiganshina. */
export const ANCHORS = [
  { x: 150, y: 300 }, { x: 300, y: 250 }, { x: 430, y: 330 }, { x: 560, y: 240 },
  { x: 690, y: 320 }, { x: 820, y: 250 }, { x: 950, y: 330 }, { x: 1080, y: 260 },
  { x: 1210, y: 330 }, { x: 60, y: 180 },
];

/** Rooftop silhouettes drawn behind play (x, roofY, width, height, roof colour). */
export const BUILDINGS = [
  { x: 120, y: 470, w: 150, h: 178, roof: '#8a3b2e' },
  { x: 290, y: 420, w: 130, h: 228, roof: '#7a3226' },
  { x: 440, y: 490, w: 140, h: 158, roof: '#8a3b2e' },
  { x: 600, y: 430, w: 150, h: 218, roof: '#6e2c22' },
  { x: 770, y: 480, w: 140, h: 168, roof: '#8a3b2e' },
  { x: 930, y: 440, w: 150, h: 208, roof: '#7a3226' },
  { x: 1100, y: 490, w: 140, h: 158, roof: '#8a3b2e' },
];
