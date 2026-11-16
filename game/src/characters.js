// Skyfall Slayers — hero art (original anime design).
// Pure canvas 2D. No network, no libraries, fully deterministic.
// Portraits: (x, y) is the HEAD CENTRE, s = head radius.
// Sprites: (x, y) is the body centre, ~50px tall, head radius ~11.
//
// NOTE (2026-11-16, found while re-verifying the rename): heroById used to return
// the art-only ROSTER entry, which has no speed/slashRate stats — so the first
// play step computed maxSpeed = 340 * undefined = NaN and the soldier's x/vx
// went NaN the moment a game started (proven identical on unmodified HEAD
// 232efe8 via git stash). It now merges the art entry with the matching config
// HEROES entry, so a picked hero always carries its real stats.
import { HEROES } from './config.js';

// ---------------------------------------------------------------- roster ----
export const ROSTER = [
  { id: 'kael',   name: 'Kael Voss',     title: 'The Vanguard',          hair: '#7a3b22', hairStyle: 'shaggy',   eyes: '#3f7d3a', skin: '#f2c9a0', scarf: null,     ascot: false, cloak: true, glasses: false },
  { id: 'sera',   name: 'Sera Quinn',    title: 'Fastest Blades',        hair: '#161616', hairStyle: 'bob',      eyes: '#4a4a52', skin: '#f5d0b0', scarf: '#0f766e', ascot: false, cloak: true, glasses: false },
  { id: 'dain',   name: 'Dain Mercer',   title: "The Corps' Strongest",  hair: '#0d0d0d', hairStyle: 'undercut', eyes: '#8a8f98', skin: '#f0c8a0', scarf: null,     ascot: true,  cloak: true, glasses: false },
  { id: 'milo',   name: 'Milo Thorne',   title: 'Strategist',            hair: '#f2d06b', hairStyle: 'bangs',    eyes: '#2a9d8f', skin: '#f6d3b3', scarf: null,     ascot: false, cloak: true, glasses: false },
  { id: 'pippa',  name: 'Pippa Lane',    title: 'Snack Scout',           hair: '#a34d2d', hairStyle: 'ponytail', eyes: '#7a4a2a', skin: '#f2c9a0', scarf: null,     ascot: false, cloak: true, glasses: false },
  { id: 'theo',   name: 'Theo Marsh',    title: 'The Loyal',             hair: '#2e2e2e', hairStyle: 'buzz',     eyes: '#6b5a4a', skin: '#e8b98f', scarf: null,     ascot: false, cloak: true, glasses: false },
  { id: 'marcus', name: 'Marcus Hale',   title: 'By the Book',           hair: '#9a8f7a', hairStyle: 'spiky',    eyes: '#7a5a3a', skin: '#f0c8a0', scarf: null,     ascot: false, cloak: true, glasses: false },
  { id: 'wren',   name: 'Wren Solace',   title: 'Research Lead',         hair: '#6b4a2f', hairStyle: 'ponytail', eyes: '#5a3a22', skin: '#f5d0b0', scarf: null,     ascot: false, cloak: true, glasses: true },
  { id: 'alden',  name: 'Alden Cross',   title: 'Commander',             hair: '#e8d27a', hairStyle: 'side',     eyes: '#3a6ea5', skin: '#eec39a', scarf: null,     ascot: false, cloak: true, glasses: false },
];

export function heroById(id) {
  const art = ROSTER.find((h) => h.id === id) || ROSTER[0];
  const stats = HEROES.find((h) => h.id === id) || HEROES[0];
  return { ...stats, ...art };
}

export function squadById(id) {
  return ROSTER.find((h) => h.id === id) || ROSTER[0];
}

// ------------------------------------------------------------- helpers -----
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (n >> 16) + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) + amt));
  const b = Math.max(0, Math.min(255, (n & 0xff) + amt));
  return `rgb(${r},${g},${b})`;
}

function skinGrad(ctx, x, y, s, skin) {
  const g = ctx.createRadialGradient(x - s * 0.3, y - s * 0.4, s * 0.1, x, y, s * 1.35);
  g.addColorStop(0, shade(skin, 22));
  g.addColorStop(0.55, skin);
  g.addColorStop(1, shade(skin, -28));
  return g;
}

function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

// Per-character face geometry: jaw taper (1 = round, lower = narrower),
// chin point (0 = soft, 1 = sharp), brow style, eye height factor.
const FACE = {
  kael:   { jaw: 0.80, chin: 0.55, brow: 'thickAngled', eyeH: 1.0,  frown: true },
  sera:   { jaw: 0.92, chin: 0.25, brow: 'straight',    eyeH: 0.95, frown: false },
  dain:   { jaw: 0.70, chin: 0.85, brow: 'thinLow',     eyeH: 0.9,  frown: false, darkCircles: true },
  milo:   { jaw: 0.96, chin: 0.15, brow: 'softArched',  eyeH: 1.18, frown: false },
  pippa:  { jaw: 0.90, chin: 0.30, brow: 'softArched',  eyeH: 1.0,  frown: false },
  theo:   { jaw: 0.86, chin: 0.35, brow: 'thickAngled', eyeH: 0.95, frown: false },
  marcus: { jaw: 0.82, chin: 0.45, brow: 'thickAngled', eyeH: 0.95, frown: false },
  wren:   { jaw: 0.90, chin: 0.30, brow: 'softArched',  eyeH: 1.05, frown: false },
  alden:  { jaw: 0.78, chin: 0.40, brow: 'thick',       eyeH: 0.95, frown: false },
};
function faceOf(person) {
  return FACE[person.id] || { jaw: 0.88, chin: 0.35, brow: 'softArched', eyeH: 1.0, frown: false };
}

// Face outline path (not filled here — caller fills with gradient).
function facePath(ctx, x, y, s, f) {
  const top = y - s * 0.98;
  const cheekY = y + s * 0.08;
  const chinY = y + s * 0.98;
  const hw = s * 0.94;                 // half width at cheek
  const jawW = s * 0.94 * f.jaw;        // half width at jaw
  const chinW = s * 0.30 + s * 0.22 * (1 - f.chin);
  ctx.beginPath();
  ctx.moveTo(x - hw * 0.82, top + s * 0.28);
  ctx.bezierCurveTo(x - hw * 1.02, top + s * 0.05, x - hw, cheekY - s * 0.25, x - hw, cheekY);
  ctx.bezierCurveTo(x - hw, cheekY + s * 0.42, x - jawW, chinY - s * 0.38, x - chinW, chinY - s * 0.10);
  ctx.quadraticCurveTo(x - chinW * 0.4, chinY + s * (0.06 - f.chin * 0.10), x, chinY + s * (0.02 - f.chin * 0.06));
  ctx.quadraticCurveTo(x + chinW * 0.4, chinY + s * (0.06 - f.chin * 0.10), x + chinW, chinY - s * 0.10);
  ctx.bezierCurveTo(x + jawW, chinY - s * 0.38, x + hw, cheekY + s * 0.42, x + hw, cheekY);
  ctx.bezierCurveTo(x + hw, cheekY - s * 0.25, x + hw * 1.02, top + s * 0.05, x + hw * 0.82, top + s * 0.28);
  ctx.closePath();
}

// One big anime eye. (cx, cy) = eye centre, w/h = almond size.
function drawEye(ctx, cx, cy, w, h, irisColor, opts) {
  const o = opts || {};
  // Almond outline (sclera).
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx - w / 2, cy + h * 0.08);
  ctx.quadraticCurveTo(cx - w * 0.28, cy - h * 0.62, cx + w * 0.12, cy - h * 0.5);
  ctx.quadraticCurveTo(cx + w * 0.52, cy - h * 0.42, cx + w / 2, cy + h * 0.02);
  ctx.quadraticCurveTo(cx + w * 0.28, cy + h * 0.5, cx - w * 0.12, cy + h * 0.46);
  ctx.quadraticCurveTo(cx - w * 0.42, cy + h * 0.42, cx - w / 2, cy + h * 0.08);
  ctx.closePath();
  ctx.fillStyle = '#fdfdf8';
  ctx.fill();
  ctx.clip();
  // Iris: radial gradient, slightly large so the top is cut by the lid.
  const iw = w * 0.52;
  const ig = ctx.createRadialGradient(cx, cy - h * 0.05, iw * 0.08, cx, cy, iw * 0.62);
  ig.addColorStop(0, shade(irisColor, 55));
  ig.addColorStop(0.55, irisColor);
  ig.addColorStop(1, shade(irisColor, -55));
  ctx.fillStyle = ig;
  ctx.beginPath();
  ctx.ellipse(cx, cy - h * 0.02, iw / 2, h * 0.52, 0, 0, Math.PI * 2);
  ctx.fill();
  // Pupil.
  ctx.fillStyle = '#14100c';
  ctx.beginPath();
  ctx.ellipse(cx, cy - h * 0.02, iw * 0.20, h * 0.26, 0, 0, Math.PI * 2);
  ctx.fill();
  // Highlights: one big, one small.
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.beginPath();
  ctx.ellipse(cx - iw * 0.16, cy - h * 0.22, iw * 0.13, h * 0.15, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.beginPath();
  ctx.ellipse(cx + iw * 0.18, cy + h * 0.14, iw * 0.07, h * 0.08, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Thick upper lash line with a corner flick.
  ctx.strokeStyle = '#1c1410';
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(1.4, h * 0.16);
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.52, cy + h * 0.02);
  ctx.quadraticCurveTo(cx - w * 0.25, cy - h * 0.66, cx + w * 0.18, cy - h * 0.52);
  ctx.quadraticCurveTo(cx + w * 0.44, cy - h * 0.46, cx + w * 0.56, cy - h * 0.30);
  ctx.stroke();
  // Outer-corner flick.
  ctx.lineWidth = Math.max(1.2, h * 0.12);
  ctx.beginPath();
  ctx.moveTo(cx + w * 0.50, cy - h * 0.32);
  ctx.lineTo(cx + w * 0.66, cy - h * 0.52);
  ctx.stroke();
  // Lower lash hints.
  ctx.strokeStyle = 'rgba(28,20,16,0.55)';
  ctx.lineWidth = Math.max(0.8, h * 0.06);
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.18, cy + h * 0.48);
  ctx.quadraticCurveTo(cx + w * 0.08, cy + h * 0.58, cx + w * 0.32, cy + h * 0.44);
  ctx.stroke();
  if (o.darkCircles) {
    ctx.strokeStyle = 'rgba(90,60,50,0.35)';
    ctx.lineWidth = Math.max(1, h * 0.10);
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.28, cy + h * 0.62);
    ctx.quadraticCurveTo(cx, cy + h * 0.78, cx + w * 0.30, cy + h * 0.60);
    ctx.stroke();
  }
}

function drawBrow(ctx, cx, cy, w, dir, style, color) {
  // dir: -1 left eye, +1 right eye (mirrors the slant).
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (style === 'thickAngled') {
    ctx.lineWidth = w * 0.16;
    ctx.moveTo(cx - w * 0.5 * dir, cy + w * 0.10);
    ctx.quadraticCurveTo(cx, cy - w * 0.22, cx + w * 0.5 * dir, cy - w * 0.02);
  } else if (style === 'thinLow') {
    ctx.lineWidth = w * 0.09;
    ctx.moveTo(cx - w * 0.5 * dir, cy + w * 0.06);
    ctx.quadraticCurveTo(cx, cy - w * 0.10, cx + w * 0.5 * dir, cy + w * 0.02);
  } else if (style === 'thick') {
    ctx.lineWidth = w * 0.20;
    ctx.moveTo(cx - w * 0.5 * dir, cy);
    ctx.quadraticCurveTo(cx, cy - w * 0.20, cx + w * 0.5 * dir, cy - w * 0.06);
  } else if (style === 'straight') {
    ctx.lineWidth = w * 0.12;
    ctx.moveTo(cx - w * 0.5 * dir, cy - w * 0.02);
    ctx.quadraticCurveTo(cx, cy - w * 0.12, cx + w * 0.5 * dir, cy - w * 0.04);
  } else { // softArched
    ctx.lineWidth = w * 0.12;
    ctx.moveTo(cx - w * 0.5 * dir, cy + w * 0.08);
    ctx.quadraticCurveTo(cx, cy - w * 0.24, cx + w * 0.5 * dir, cy - w * 0.02);
  }
  ctx.stroke();
}

// A single hair strand: thick shadow stroke + thin highlight stroke.
function strand(ctx, pts, w, color, hi) {
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.stroke();
  if (hi) {
    ctx.strokeStyle = hi;
    ctx.lineWidth = Math.max(0.7, w * 0.35);
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.stroke();
  }
}

// Wings of Dawn emblem: two mirrored feathered wings in gold.
function drawWingsEmblem(ctx, cx, cy, sc) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(sc, sc);
  ctx.fillStyle = '#d8c98a';
  ctx.strokeStyle = '#8a7a4a';
  ctx.lineWidth = 0.8;
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const spread = i * 0.55;
      ctx.beginPath();
      ctx.moveTo(side * 2, 2 - i * 1.5);
      ctx.quadraticCurveTo(side * (10 + i * 3), -6 - spread * 4, side * (15 + i * 2.5), -12 - i * 3.5);
      ctx.quadraticCurveTo(side * (11 + i * 2), -4 - i * 2, side * 3, 5 - i * 1.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }
  ctx.fillStyle = '#b09a55';
  ctx.beginPath();
  ctx.ellipse(0, 2.5, 2.2, 3.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ------------------------------------------------------------- hair --------
// Draws the hair for a portrait. Base mass first, then individual strands.
function drawHairPortrait(ctx, person, x, y, s) {
  const c = person.hair;
  const hi = shade(c, 42);
  const lo = shade(c, -38);
  const u = s / 30;
  ctx.lineJoin = 'round';
  const style = person.hairStyle;
  // Common base: a cap over the top of the head, slightly wider than the face.
  const baseTop = (over) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(x - s * 1.02, y - s * 0.10);
    ctx.bezierCurveTo(x - s * 1.06, y - s * 0.95, x - s * 0.55, y - s * 1.22, x, y - s * 1.24);
    ctx.bezierCurveTo(x + s * 0.55, y - s * 1.22, x + s * 1.06, y - s * 0.95, x + s * 1.02, y - s * 0.10);
    ctx.bezierCurveTo(x + s * 0.98, y + s * (over || 0.28), x + s * 0.55, y + s * 0.30, x + s * 0.42, y - s * 0.05);
    ctx.lineTo(x - s * 0.42, y - s * 0.05);
    ctx.bezierCurveTo(x - s * 0.55, y + s * 0.30, x - s * 0.98, y + s * (over || 0.28), x - s * 1.02, y - s * 0.10);
    ctx.closePath();
    ctx.fill();
  };

  if (style === 'shaggy') {
    // Kael: messy layered spikes over the forehead, longer at the sides.
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(x - s * 1.04, y - s * 0.05);
    ctx.bezierCurveTo(x - s * 1.10, y - s * 0.9, x - s * 0.6, y - s * 1.26, x, y - s * 1.26);
    ctx.bezierCurveTo(x + s * 0.6, y - s * 1.26, x + s * 1.10, y - s * 0.9, x + s * 1.04, y - s * 0.05);
    ctx.lineTo(x + s * 0.86, y + s * 0.42);
    ctx.lineTo(x + s * 0.62, y + s * 0.10);
    ctx.lineTo(x + s * 0.44, y + s * 0.38);
    ctx.lineTo(x + s * 0.20, y + s * 0.06);
    ctx.lineTo(x, y + s * 0.34);
    ctx.lineTo(x - s * 0.20, y + s * 0.06);
    ctx.lineTo(x - s * 0.44, y + s * 0.38);
    ctx.lineTo(x - s * 0.62, y + s * 0.10);
    ctx.lineTo(x - s * 0.86, y + s * 0.42);
    ctx.closePath();
    ctx.fill();
    const spikes = [
      [[-0.55, -1.05], [-0.72, -0.55], [-0.62, -0.18]],
      [[-0.28, -1.14], [-0.38, -0.62], [-0.30, -0.28]],
      [[0.02, -1.16], [-0.02, -0.66], [0.08, -0.30]],
      [[0.30, -1.12], [0.36, -0.62], [0.30, -0.24]],
      [[0.58, -1.02], [0.72, -0.55], [0.60, -0.16]],
      [[-0.85, -0.80], [-0.95, -0.30], [-0.88, 0.10]],
      [[0.85, -0.80], [0.95, -0.30], [0.88, 0.10]],
      [[-0.42, -0.95], [-0.55, -0.45], [-0.48, -0.05]],
      [[0.44, -0.95], [0.56, -0.45], [0.48, -0.05]],
    ];
    for (const p of spikes) {
      strand(ctx, p.map(([a, b]) => [x + a * s, y + b * s]), 3.2 * u, lo, hi);
    }
  } else if (style === 'bob') {
    // Sera: straight black bob, bangs, chin-length, side locks framing face.
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(x - s * 1.04, y + s * 0.62);
    ctx.bezierCurveTo(x - s * 1.10, y - s * 0.5, x - s * 0.62, y - s * 1.24, x, y - s * 1.26);
    ctx.bezierCurveTo(x + s * 0.62, y - s * 1.24, x + s * 1.10, y - s * 0.5, x + s * 1.04, y + s * 0.62);
    ctx.quadraticCurveTo(x + s * 0.9, y + s * 0.78, x + s * 0.72, y + s * 0.66);
    ctx.lineTo(x + s * 0.60, y - s * 0.30);
    ctx.lineTo(x - s * 0.60, y - s * 0.30);
    ctx.lineTo(x - s * 0.72, y + s * 0.66);
    ctx.quadraticCurveTo(x - s * 0.9, y + s * 0.78, x - s * 1.04, y + s * 0.62);
    ctx.closePath();
    ctx.fill();
    // Bangs: straight fringe with a slight centre dip.
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(x - s * 0.78, y - s * 0.42);
    ctx.quadraticCurveTo(x, y - s * 0.78, x + s * 0.78, y - s * 0.42);
    ctx.lineTo(x + s * 0.70, y - s * 0.05);
    ctx.quadraticCurveTo(x + s * 0.35, y - s * 0.28, x, y - s * 0.30);
    ctx.quadraticCurveTo(x - s * 0.35, y - s * 0.28, x - s * 0.70, y - s * 0.05);
    ctx.closePath();
    ctx.fill();
    const locks = [
      [[-0.78, -0.55], [-0.92, 0.05], [-0.86, 0.62]],
      [[-0.55, -0.62], [-0.66, 0.0], [-0.60, 0.55]],
      [[0.78, -0.55], [0.92, 0.05], [0.86, 0.62]],
      [[0.55, -0.62], [0.66, 0.0], [0.60, 0.55]],
      [[-0.30, -0.85], [-0.38, -0.35], [-0.32, -0.05]],
      [[0.30, -0.85], [0.38, -0.35], [0.32, -0.05]],
      [[0.0, -1.05], [0.0, -0.55], [0.02, -0.28]],
    ];
    for (const p of locks) strand(ctx, p.map(([a, b]) => [x + a * s, y + b * s]), 2.6 * u, lo, hi);
  } else if (style === 'undercut') {
    // Dain: neat curtain fringe parted in the middle, short sides.
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(x - s * 0.98, y - s * 0.12);
    ctx.bezierCurveTo(x - s * 1.0, y - s * 0.9, x - s * 0.5, y - s * 1.22, x, y - s * 1.22);
    ctx.bezierCurveTo(x + s * 0.5, y - s * 1.22, x + s * 1.0, y - s * 0.9, x + s * 0.98, y - s * 0.12);
    ctx.lineTo(x + s * 0.88, y - s * 0.05);
    ctx.quadraticCurveTo(x + s * 0.5, y - s * 0.30, x, y - s * 0.32);
    ctx.quadraticCurveTo(x - s * 0.5, y - s * 0.30, x - s * 0.88, y - s * 0.05);
    ctx.closePath();
    ctx.fill();
    const fringe = [
      [[-0.42, -0.95], [-0.52, -0.55], [-0.44, -0.18]],
      [[-0.18, -1.05], [-0.22, -0.60], [-0.16, -0.22]],
      [[0.18, -1.05], [0.22, -0.60], [0.16, -0.22]],
      [[0.42, -0.95], [0.52, -0.55], [0.44, -0.18]],
      [[-0.66, -0.80], [-0.78, -0.40], [-0.74, -0.02]],
      [[0.66, -0.80], [0.78, -0.40], [0.74, -0.02]],
      [[0.0, -1.10], [0.0, -0.70], [0.0, -0.34]],
    ];
    for (const p of fringe) strand(ctx, p.map(([a, b]) => [x + a * s, y + b * s]), 2.8 * u, lo, hi);
  } else if (style === 'bangs') {
    // Milo: blond, straight bangs across the whole forehead, rounded top.
    baseTop(0.30);
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(x - s * 0.82, y - s * 0.50);
    ctx.quadraticCurveTo(x, y - s * 0.92, x + s * 0.82, y - s * 0.50);
    ctx.lineTo(x + s * 0.74, y - s * 0.12);
    ctx.quadraticCurveTo(x + s * 0.4, y - s * 0.34, x, y - s * 0.34);
    ctx.quadraticCurveTo(x - s * 0.4, y - s * 0.34, x - s * 0.74, y - s * 0.12);
    ctx.closePath();
    ctx.fill();
    const strands = [
      [[-0.60, -0.75], [-0.68, -0.30], [-0.62, -0.10]],
      [[-0.30, -0.85], [-0.36, -0.35], [-0.30, -0.14]],
      [[0.0, -0.88], [0.0, -0.38], [0.02, -0.16]],
      [[0.30, -0.85], [0.36, -0.35], [0.30, -0.14]],
      [[0.60, -0.75], [0.68, -0.30], [0.62, -0.10]],
      [[-0.85, -0.60], [-0.92, -0.10], [-0.86, 0.22]],
      [[0.85, -0.60], [0.92, -0.10], [0.86, 0.22]],
    ];
    for (const p of strands) strand(ctx, p.map(([a, b]) => [x + a * s, y + b * s]), 2.8 * u, lo, hi);
  } else if (style === 'ponytail') {
    // Pippa / Wren: pulled-back hair, high tail flowing to the side.
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(x - s * 0.98, y - s * 0.15);
    ctx.bezierCurveTo(x - s * 1.02, y - s * 0.9, x - s * 0.5, y - s * 1.22, x, y - s * 1.22);
    ctx.bezierCurveTo(x + s * 0.5, y - s * 1.22, x + s * 1.02, y - s * 0.9, x + s * 0.98, y - s * 0.15);
    ctx.quadraticCurveTo(x + s * 0.7, y - s * 0.35, x + s * 0.4, y - s * 0.30);
    ctx.quadraticCurveTo(x, y - s * 0.55, x - s * 0.4, y - s * 0.30);
    ctx.quadraticCurveTo(x - s * 0.7, y - s * 0.35, x - s * 0.98, y - s * 0.15);
    ctx.closePath();
    ctx.fill();
    // Tail: gathered at the crown, flowing up-right with a wave.
    const tailBaseX = x + s * 0.30;
    const tailBaseY = y - s * 1.05;
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(tailBaseX - s * 0.22, tailBaseY);
    ctx.bezierCurveTo(tailBaseX + s * 0.55, tailBaseY - s * 0.55, tailBaseX + s * 1.05, tailBaseY - s * 0.35, tailBaseX + s * 1.28, tailBaseY + s * 0.15);
    ctx.bezierCurveTo(tailBaseX + s * 1.10, tailBaseY + s * 0.45, tailBaseX + s * 0.72, tailBaseY + s * 0.42, tailBaseX + s * 0.42, tailBaseY + s * 0.28);
    ctx.bezierCurveTo(tailBaseX + s * 0.28, tailBaseY + s * 0.10, tailBaseX + s * 0.05, tailBaseY + s * 0.05, tailBaseX - s * 0.22, tailBaseY);
    ctx.closePath();
    ctx.fill();
    // Tie band.
    ctx.fillStyle = person.id === 'wren' ? '#3a3a3a' : '#5a2d18';
    ellipse(ctx, tailBaseX - s * 0.16, tailBaseY + s * 0.02, s * 0.10, s * 0.08);
    const tstrands = [
      [[0.35, -1.05], [0.85, -1.35], [1.15, -0.95]],
      [[0.30, -1.00], [0.70, -1.15], [1.05, -0.70]],
      [[0.25, -0.95], [0.55, -0.95], [0.95, -0.45]],
      [[-0.45, -0.85], [-0.55, -0.45], [-0.48, -0.12]],
      [[0.45, -0.85], [0.55, -0.45], [0.48, -0.12]],
      [[-0.05, -1.05], [-0.08, -0.60], [-0.04, -0.30]],
    ];
    for (const p of tstrands) strand(ctx, p.map(([a, b]) => [x + a * s, y + b * s]), 2.8 * u, lo, hi);
  } else if (style === 'buzz') {
    // Theo: very short buzz — a thin cap hugging the skull + texture strokes.
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(x - s * 0.96, y - s * 0.05);
    ctx.bezierCurveTo(x - s * 1.0, y - s * 0.85, x - s * 0.5, y - s * 1.16, x, y - s * 1.16);
    ctx.bezierCurveTo(x + s * 0.5, y - s * 1.16, x + s * 1.0, y - s * 0.85, x + s * 0.96, y - s * 0.05);
    ctx.quadraticCurveTo(x + s * 0.6, y - s * 0.28, x, y - s * 0.30);
    ctx.quadraticCurveTo(x - s * 0.6, y - s * 0.28, x - s * 0.96, y - s * 0.05);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = lo;
    ctx.lineWidth = 1.2 * u;
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(x + i * s * 0.22, y - s * (0.95 - Math.abs(i) * 0.06));
      ctx.lineTo(x + i * s * 0.24, y - s * (0.62 - Math.abs(i) * 0.04));
      ctx.stroke();
    }
  } else if (style === 'spiky') {
    // Marcus: spiky ash-brown undercut, spikes up and out.
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(x - s * 1.0, y - s * 0.10);
    ctx.lineTo(x - s * 1.12, y - s * 0.55);
    ctx.lineTo(x - s * 0.82, y - s * 0.72);
    ctx.lineTo(x - s * 0.78, y - s * 1.12);
    ctx.lineTo(x - s * 0.42, y - s * 0.92);
    ctx.lineTo(x - s * 0.22, y - s * 1.28);
    ctx.lineTo(x + s * 0.10, y - s * 0.98);
    ctx.lineTo(x + s * 0.42, y - s * 1.24);
    ctx.lineTo(x + s * 0.60, y - s * 0.92);
    ctx.lineTo(x + s * 0.94, y - s * 1.05);
    ctx.lineTo(x + s * 0.92, y - s * 0.62);
    ctx.lineTo(x + s * 1.12, y - s * 0.42);
    ctx.lineTo(x + s * 1.0, y - s * 0.10);
    ctx.quadraticCurveTo(x + s * 0.5, y - s * 0.30, x, y - s * 0.32);
    ctx.quadraticCurveTo(x - s * 0.5, y - s * 0.30, x - s * 1.0, y - s * 0.10);
    ctx.closePath();
    ctx.fill();
    const spikes = [
      [[-0.55, -0.90], [-0.78, -0.55], [-0.60, -0.22]],
      [[-0.20, -1.05], [-0.26, -0.60], [-0.18, -0.24]],
      [[0.15, -1.02], [0.20, -0.60], [0.14, -0.24]],
      [[0.50, -0.95], [0.68, -0.55], [0.55, -0.20]],
      [[-0.80, -0.70], [-0.92, -0.30], [-0.84, 0.02]],
      [[0.80, -0.70], [0.92, -0.30], [0.84, 0.02]],
    ];
    for (const p of spikes) strand(ctx, p.map(([a, b]) => [x + a * s, y + b * s]), 3 * u, lo, hi);
  } else if (style === 'side') {
    // Alden: swept-back blond side part, neat combed strands.
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(x - s * 1.0, y - s * 0.12);
    ctx.bezierCurveTo(x - s * 1.04, y - s * 0.9, x - s * 0.55, y - s * 1.24, x, y - s * 1.24);
    ctx.bezierCurveTo(x + s * 0.55, y - s * 1.24, x + s * 1.04, y - s * 0.9, x + s * 1.0, y - s * 0.12);
    ctx.quadraticCurveTo(x + s * 0.75, y - s * 0.42, x + s * 0.30, y - s * 0.46);
    ctx.quadraticCurveTo(x - s * 0.2, y - s * 0.50, x - s * 0.55, y - s * 0.34);
    ctx.quadraticCurveTo(x - s * 0.85, y - s * 0.22, x - s * 1.0, y - s * 0.12);
    ctx.closePath();
    ctx.fill();
    const sweeps = [
      [[-0.55, -1.02], [-0.10, -0.78], [0.35, -0.55]],
      [[-0.35, -1.12], [0.10, -0.92], [0.55, -0.68]],
      [[-0.05, -1.16], [0.35, -1.00], [0.72, -0.78]],
      [[0.20, -1.10], [0.55, -0.95], [0.85, -0.70]],
      [[-0.75, -0.80], [-0.45, -0.55], [-0.30, -0.32]],
      [[0.70, -0.85], [0.85, -0.50], [0.86, -0.15]],
    ];
    for (const p of sweeps) strand(ctx, p.map(([a, b]) => [x + a * s, y + b * s]), 2.8 * u, lo, hi);
  } else {
    baseTop(0.30);
  }
  // Soft top-light sheen on every style.
  ctx.strokeStyle = 'rgba(255,255,255,0.16)';
  ctx.lineWidth = 2 * u;
  ctx.beginPath();
  ctx.arc(x, y - s * 0.28, s * 0.78, Math.PI * 1.15, Math.PI * 1.85);
  ctx.stroke();
}

// ------------------------------------------------------------ portrait -----
export function drawHeroPortrait(ctx, person, x, y, s) {
  const p = person || ROSTER[0];
  const f = faceOf(p);
  const u = s / 30;
  ctx.save();

  // ---- cloak behind the shoulders (green, with folds) ----
  if (p.cloak) {
    ctx.fillStyle = '#2e5d33';
    ctx.beginPath();
    ctx.moveTo(x - s * 0.55, y + s * 0.95);
    ctx.quadraticCurveTo(x - s * 1.55, y + s * 1.05, x - s * 1.75, y + s * 2.05);
    ctx.lineTo(x + s * 1.75, y + s * 2.05);
    ctx.quadraticCurveTo(x + s * 1.55, y + s * 1.05, x + s * 0.55, y + s * 0.95);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.28)';
    ctx.lineWidth = 1.6 * u;
    for (const off of [-1.15, -0.55, 0.55, 1.15]) {
      ctx.beginPath();
      ctx.moveTo(x + off * s, y + s * 1.12);
      ctx.quadraticCurveTo(x + off * s * 1.08, y + s * 1.55, x + off * s * 1.12, y + s * 2.02);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.beginPath();
    ctx.moveTo(x - s * 1.5, y + s * 1.2);
    ctx.quadraticCurveTo(x - s * 1.62, y + s * 1.6, x - s * 1.68, y + s * 2.0);
    ctx.stroke();
  }

  // ---- neck ----
  ctx.fillStyle = shade(p.skin, -18);
  ctx.fillRect(x - s * 0.30, y + s * 0.78, s * 0.60, s * 0.42);
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(x - s * 0.30, y + s * 0.78, s * 0.60, s * 0.10);

  // ---- jacket torso ----
  const jg = ctx.createLinearGradient(x - s, y + s, x + s, y + s * 2);
  jg.addColorStop(0, '#d6c096');
  jg.addColorStop(0.5, '#c9b18c');
  jg.addColorStop(1, '#a98f66');
  ctx.fillStyle = jg;
  ctx.beginPath();
  ctx.moveTo(x - s * 1.28, y + s * 1.05);
  ctx.quadraticCurveTo(x - s * 1.45, y + s * 1.5, x - s * 1.42, y + s * 2.05);
  ctx.lineTo(x + s * 1.42, y + s * 2.05);
  ctx.quadraticCurveTo(x + s * 1.45, y + s * 1.5, x + s * 1.28, y + s * 1.05);
  ctx.quadraticCurveTo(x, y + s * 0.82, x - s * 1.28, y + s * 1.05);
  ctx.closePath();
  ctx.fill();
  // Jacket fold lines + shading under the collar.
  ctx.strokeStyle = 'rgba(90,65,35,0.30)';
  ctx.lineWidth = 1.4 * u;
  for (const off of [-0.85, -0.35, 0.35, 0.85]) {
    ctx.beginPath();
    ctx.moveTo(x + off * s, y + s * 1.25);
    ctx.quadraticCurveTo(x + off * s * 1.05, y + s * 1.65, x + off * s * 1.02, y + s * 2.02);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(0,0,0,0.14)';
  ctx.beginPath();
  ctx.ellipse(x, y + s * 1.12, s * 0.55, s * 0.14, 0, 0, Math.PI * 2);
  ctx.fill();

  // ---- white shirt V + collar ----
  ctx.fillStyle = '#f2ede2';
  ctx.beginPath();
  ctx.moveTo(x - s * 0.34, y + s * 0.98);
  ctx.lineTo(x + s * 0.34, y + s * 0.98);
  ctx.lineTo(x, y + s * 1.42);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#c9b18c';
  ctx.beginPath();
  ctx.moveTo(x - s * 0.42, y + s * 0.96);
  ctx.lineTo(x - s * 0.08, y + s * 1.18);
  ctx.lineTo(x - s * 0.30, y + s * 1.28);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + s * 0.42, y + s * 0.96);
  ctx.lineTo(x + s * 0.08, y + s * 1.18);
  ctx.lineTo(x + s * 0.30, y + s * 1.28);
  ctx.closePath();
  ctx.fill();
  // Buttons.
  ctx.fillStyle = '#5a4632';
  ellipse(ctx, x, y + s * 1.62, s * 0.055, s * 0.055);
  ellipse(ctx, x, y + s * 1.86, s * 0.055, s * 0.055);

  // ---- harness straps + gold buckles ----
  ctx.strokeStyle = '#6b4a2f';
  ctx.lineWidth = s * 0.14;
  ctx.beginPath();
  ctx.moveTo(x - s * 1.18, y + s * 1.18);
  ctx.lineTo(x + s * 0.55, y + s * 2.02);
  ctx.moveTo(x + s * 1.18, y + s * 1.18);
  ctx.lineTo(x - s * 0.55, y + s * 2.02);
  ctx.stroke();
  ctx.fillStyle = '#d8b45a';
  ctx.fillRect(x - s * 0.42, y + s * 1.52, s * 0.16, s * 0.12);
  ctx.fillRect(x + s * 0.26, y + s * 1.52, s * 0.16, s * 0.12);

  // ---- Wings of Dawn emblem on the chest ----
  // drawWingsEmblem scales its ~34-unit-wide wingspan by `sc`, so pass a
  // small factor: total width ≈ s * 0.028 * 34 ≈ 0.95 * s.
  drawWingsEmblem(ctx, x, y + s * 1.78, s * 0.028);

  // ---- ears ----
  ctx.fillStyle = skinGrad(ctx, x, y, s, p.skin);
  ellipse(ctx, x - s * 0.94, y + s * 0.05, s * 0.13, s * 0.20);
  ellipse(ctx, x + s * 0.94, y + s * 0.05, s * 0.13, s * 0.20);

  // ---- face ----
  facePath(ctx, x, y, s, f);
  ctx.fillStyle = skinGrad(ctx, x, y, s, p.skin);
  ctx.fill();
  // Soft cheek + jaw shading.
  ctx.save();
  facePath(ctx, x, y, s, f);
  ctx.clip();
  const sh = ctx.createRadialGradient(x - s * 0.85, y + s * 0.45, s * 0.1, x - s * 0.85, y + s * 0.45, s * 0.9);
  sh.addColorStop(0, 'rgba(150,80,50,0.20)');
  sh.addColorStop(1, 'rgba(150,80,50,0)');
  ctx.fillStyle = sh;
  ctx.fillRect(x - s * 1.2, y - s * 0.4, s * 1.4, s * 1.6);
  const sh2 = ctx.createRadialGradient(x + s * 0.85, y + s * 0.45, s * 0.1, x + s * 0.85, y + s * 0.45, s * 0.9);
  sh2.addColorStop(0, 'rgba(150,80,50,0.20)');
  sh2.addColorStop(1, 'rgba(150,80,50,0)');
  ctx.fillStyle = sh2;
  ctx.fillRect(x - s * 0.2, y - s * 0.4, s * 1.4, s * 1.6);
  // Blush.
  ctx.fillStyle = 'rgba(230,110,110,0.20)';
  ellipse(ctx, x - s * 0.52, y + s * 0.34, s * 0.20, s * 0.11);
  ellipse(ctx, x + s * 0.52, y + s * 0.34, s * 0.20, s * 0.11);
  ctx.restore();

  // ---- eyes ----
  const eyeW = s * 0.46;
  const eyeH = s * 0.34 * f.eyeH;
  const eyeY = y - s * 0.06;
  const eyeDX = s * 0.40;
  drawEye(ctx, x - eyeDX, eyeY, eyeW, eyeH, p.eyes, { darkCircles: !!f.darkCircles });
  drawEye(ctx, x + eyeDX, eyeY, eyeW, eyeH, p.eyes, { darkCircles: !!f.darkCircles });
  // Brows.
  drawBrow(ctx, x - eyeDX, eyeY - eyeH * 0.85, eyeW * 0.95, -1, f.brow, shade(p.hair, -10));
  drawBrow(ctx, x + eyeDX, eyeY - eyeH * 0.85, eyeW * 0.95, 1, f.brow, shade(p.hair, -10));

  // ---- nose ----
  ctx.strokeStyle = 'rgba(120,70,45,0.55)';
  ctx.lineWidth = Math.max(1, s * 0.05);
  ctx.beginPath();
  ctx.moveTo(x + s * 0.02, y + s * 0.16);
  ctx.quadraticCurveTo(x - s * 0.02, y + s * 0.30, x - s * 0.05, y + s * 0.36);
  ctx.stroke();
  ctx.fillStyle = 'rgba(120,70,45,0.35)';
  ellipse(ctx, x - s * 0.02, y + s * 0.38, s * 0.05, s * 0.03);

  // ---- lips ----
  ctx.strokeStyle = '#9a5a48';
  ctx.lineWidth = Math.max(1.2, s * 0.06);
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (f.frown) {
    ctx.moveTo(x - s * 0.20, y + s * 0.60);
    ctx.quadraticCurveTo(x, y + s * 0.50, x + s * 0.20, y + s * 0.60);
  } else {
    ctx.moveTo(x - s * 0.20, y + s * 0.56);
    ctx.quadraticCurveTo(x, y + s * 0.62, x + s * 0.20, y + s * 0.56);
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,200,180,0.35)';
  ellipse(ctx, x, y + s * 0.66, s * 0.10, s * 0.035);

  // ---- hair (over the forehead) ----
  drawHairPortrait(ctx, p, x, y, s);

  // ---- glasses (Wren) ----
  if (p.glasses) {
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = Math.max(1.2, s * 0.05);
    ctx.beginPath();
    ctx.arc(x - eyeDX, eyeY, eyeW * 0.62, 0, Math.PI * 2);
    ctx.arc(x + eyeDX, eyeY, eyeW * 0.62, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - eyeDX + eyeW * 0.62, eyeY - s * 0.02);
    ctx.lineTo(x + eyeDX - eyeW * 0.62, eyeY - s * 0.02);
    ctx.moveTo(x - eyeDX - eyeW * 0.62, eyeY);
    ctx.lineTo(x - s * 0.95, eyeY - s * 0.05);
    ctx.moveTo(x + eyeDX + eyeW * 0.62, eyeY);
    ctx.lineTo(x + s * 0.95, eyeY - s * 0.05);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = Math.max(1, s * 0.05);
    ctx.beginPath();
    ctx.moveTo(x - eyeDX - eyeW * 0.25, eyeY - eyeW * 0.28);
    ctx.lineTo(x - eyeDX + eyeW * 0.05, eyeY + eyeW * 0.18);
    ctx.moveTo(x + eyeDX - eyeW * 0.25, eyeY - eyeW * 0.28);
    ctx.lineTo(x + eyeDX + eyeW * 0.05, eyeY + eyeW * 0.18);
    ctx.stroke();
  }

  // ---- scarf (Sera) ----
  if (p.scarf) {
    ctx.fillStyle = p.scarf;
    ctx.beginPath();
    ctx.moveTo(x - s * 0.52, y + s * 0.82);
    ctx.quadraticCurveTo(x, y + s * 1.02, x + s * 0.52, y + s * 0.82);
    ctx.lineTo(x + s * 0.52, y + s * 1.10);
    ctx.quadraticCurveTo(x, y + s * 1.30, x - s * 0.52, y + s * 1.10);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.30)';
    ctx.lineWidth = 1.1 * u;
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(x + i * s * 0.13, y + s * 0.88);
      ctx.lineTo(x + i * s * 0.13, y + s * 1.16);
      ctx.stroke();
    }
    // Flowing end over the shoulder.
    ctx.fillStyle = shade(p.scarf, -18);
    ctx.beginPath();
    ctx.moveTo(x + s * 0.30, y + s * 1.05);
    ctx.quadraticCurveTo(x + s * 0.95, y + s * 1.25, x + s * 1.05, y + s * 1.75);
    ctx.quadraticCurveTo(x + s * 0.72, y + s * 1.85, x + s * 0.62, y + s * 1.45);
    ctx.quadraticCurveTo(x + s * 0.45, y + s * 1.22, x + s * 0.30, y + s * 1.05);
    ctx.closePath();
    ctx.fill();
  }

  // ---- ascot (Dain), dark navy ----
  if (p.ascot) {
    ctx.fillStyle = '#1f2a44';
    ctx.beginPath();
    ctx.moveTo(x - s * 0.16, y + s * 1.02);
    ctx.lineTo(x + s * 0.16, y + s * 1.02);
    ctx.lineTo(x + s * 0.10, y + s * 1.22);
    ctx.lineTo(x - s * 0.10, y + s * 1.22);
    ctx.closePath();
    ctx.fill();
    ellipse(ctx, x, y + s * 1.06, s * 0.13, s * 0.10);
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 1 * u;
    ctx.beginPath();
    ctx.moveTo(x - s * 0.10, y + s * 1.14);
    ctx.lineTo(x - s * 0.22, y + s * 1.34);
    ctx.moveTo(x + s * 0.10, y + s * 1.14);
    ctx.lineTo(x + s * 0.22, y + s * 1.34);
    ctx.stroke();
  }

  ctx.restore();
}

// -------------------------------------------------------------- sprite -----
// In-game soldier. (x, y) = body centre. Total footprint ~50px tall:
// head centre (0,-14) r=11, feet at +25. facing -1 flips horizontally.
export function drawHeroSprite(ctx, hero, x, y, facing, slashT, swinging) {
  const p = hero || ROSTER[0];
  const dir = facing >= 0 ? 1 : -1;
  const phase = typeof swinging === 'number' ? swinging : (swinging ? 0.7 : 0);
  const run = Math.sin(phase) * 4;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir, 1);

  // ---- cloak flaring behind ----
  if (p.cloak) {
    ctx.fillStyle = '#2e5d33';
    ctx.beginPath();
    ctx.moveTo(-4, -8);
    ctx.quadraticCurveTo(-20, -2, -24, 12);
    ctx.quadraticCurveTo(-12, 10, -6, 8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#d8c98a';
    ctx.beginPath();
    ctx.moveTo(-14, -2);
    ctx.lineTo(-9, -4);
    ctx.lineTo(-11, 1);
    ctx.closePath();
    ctx.fill();
  }

  // ---- legs + boots (running pose) ----
  ctx.strokeStyle = '#4a3a28';
  ctx.lineCap = 'round';
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.moveTo(-2, 4);
  ctx.lineTo(-5 + run * 0.5, 20);
  ctx.moveTo(3, 4);
  ctx.lineTo(7 - run * 0.5, 20);
  ctx.stroke();
  ctx.fillStyle = '#2e2118';
  ctx.fillRect(-8 + run * 0.5, 19, 7, 4);
  ctx.fillRect(4 - run * 0.5, 19, 7, 4);

  // ---- jacket torso ----
  const jg = ctx.createLinearGradient(0, -8, 0, 8);
  jg.addColorStop(0, '#d6c096');
  jg.addColorStop(1, '#a98f66');
  ctx.fillStyle = jg;
  ctx.beginPath();
  ctx.moveTo(-8, -8);
  ctx.quadraticCurveTo(-10, 2, -8, 7);
  ctx.lineTo(8, 7);
  ctx.quadraticCurveTo(10, 2, 8, -8);
  ctx.closePath();
  ctx.fill();
  // Shirt V.
  ctx.fillStyle = '#f2ede2';
  ctx.beginPath();
  ctx.moveTo(-3, -8);
  ctx.lineTo(3, -8);
  ctx.lineTo(0, -2);
  ctx.closePath();
  ctx.fill();
  // Harness straps.
  ctx.strokeStyle = '#6b4a2f';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-8, -6);
  ctx.lineTo(6, 6);
  ctx.moveTo(8, -6);
  ctx.lineTo(-6, 6);
  ctx.stroke();
  // Skyhook hip boxes.
  ctx.fillStyle = '#5a4632';
  ctx.fillRect(-11, 0, 4, 6);
  ctx.fillRect(7, 0, 4, 6);
  ctx.fillStyle = '#8a8f98';
  ctx.fillRect(-11, 2, 4, 1.5);
  ctx.fillRect(7, 2, 4, 1.5);

  // ---- back arm + blade arm ----
  ctx.strokeStyle = '#c9b18c';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(-6, -4);
  ctx.lineTo(-11, 3);
  ctx.stroke();
  // Blade arm forward.
  const armA = slashT > 0 ? -0.9 : -0.35;
  const hx = 8 + Math.cos(armA) * 8;
  const hy = -4 + Math.sin(armA) * 8;
  ctx.beginPath();
  ctx.moveTo(6, -4);
  ctx.lineTo(hx, hy);
  ctx.stroke();
  ctx.fillStyle = '#2e2118';
  ctx.beginPath();
  ctx.arc(hx, hy, 2.2, 0, 0, Math.PI * 2);
  ctx.fill();

  // ---- blades + slash arc ----
  if (slashT > 0) {
    const a = 1 - slashT;
    ctx.strokeStyle = `rgba(230,235,240,${0.95 * (1 - a * 0.5)})`;
    ctx.lineWidth = 2.2;
    for (const off of [0, 0.5]) {
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.lineTo(hx + 16 - off * 6, hy - 10 + a * 14 + off * 8);
      ctx.stroke();
    }
    // Slash-arc flash.
    ctx.strokeStyle = `rgba(255,255,255,${0.85 * slashT})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(hx + 6, hy + 2, 20, -1.9 + a * 1.2, -0.2 + a * 1.2);
    ctx.stroke();
  } else {
    ctx.strokeStyle = '#dfe4e8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    ctx.lineTo(hx + 13, hy - 9);
    ctx.stroke();
  }

  // ---- neck + head ----
  ctx.fillStyle = shade(p.skin, -12);
  ctx.fillRect(-3, -13, 6, 5);
  const f = faceOf(p);
  const hx0 = 0;
  const hy0 = -14;
  const hr = 11;
  facePath(ctx, hx0, hy0, hr, f);
  ctx.fillStyle = skinGrad(ctx, hx0, hy0, hr, p.skin);
  ctx.fill();
  // Blush hint.
  ctx.fillStyle = 'rgba(230,110,110,0.18)';
  ellipse(ctx, hx0 - hr * 0.5, hy0 + hr * 0.35, hr * 0.18, hr * 0.10);
  ellipse(ctx, hx0 + hr * 0.5, hy0 + hr * 0.35, hr * 0.18, hr * 0.10);

  // ---- sprite eyes: two, with iris colour ----
  for (const sgn of [-1, 1]) {
    const ex = hx0 + sgn * hr * 0.38;
    const ey = hy0 - hr * 0.05;
    ctx.fillStyle = '#fdfdf8';
    ctx.beginPath();
    ctx.ellipse(ex, ey, hr * 0.20, hr * 0.26, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = p.eyes;
    ctx.beginPath();
    ctx.ellipse(ex, ey, hr * 0.12, hr * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#14100c';
    ctx.beginPath();
    ctx.ellipse(ex, ey, hr * 0.06, hr * 0.10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.ellipse(ex - hr * 0.05, ey - hr * 0.08, hr * 0.045, hr * 0.06, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1c1410';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(ex - hr * 0.20, ey - hr * 0.20);
    ctx.quadraticCurveTo(ex, ey - hr * 0.30, ex + hr * 0.20, ey - hr * 0.18);
    ctx.stroke();
  }
  // Sprite brows.
  ctx.strokeStyle = shade(p.hair, -10);
  ctx.lineWidth = 1.1;
  for (const sgn of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(hx0 + sgn * hr * 0.58, hy0 - hr * 0.48);
    ctx.quadraticCurveTo(hx0 + sgn * hr * 0.38, hy0 - hr * 0.62, hx0 + sgn * hr * 0.18, hy0 - hr * 0.50);
    ctx.stroke();
  }
  // Nose + mouth dots.
  ctx.strokeStyle = 'rgba(120,70,45,0.6)';
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(hx0, hy0 + hr * 0.18);
  ctx.lineTo(hx0 - 0.8, hy0 + hr * 0.32);
  ctx.stroke();
  ctx.strokeStyle = '#9a5a48';
  ctx.beginPath();
  ctx.moveTo(hx0 - hr * 0.18, hy0 + hr * 0.52);
  ctx.quadraticCurveTo(hx0, hy0 + hr * (f.frown ? 0.46 : 0.58), hx0 + hr * 0.18, hy0 + hr * 0.52);
  ctx.stroke();
  if (f.darkCircles) {
    ctx.strokeStyle = 'rgba(90,60,50,0.35)';
    ctx.lineWidth = 0.9;
    for (const sgn of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(hx0 + sgn * hr * 0.58, hy0 + hr * 0.28);
      ctx.quadraticCurveTo(hx0 + sgn * hr * 0.38, hy0 + hr * 0.40, hx0 + sgn * hr * 0.18, hy0 + hr * 0.28);
      ctx.stroke();
    }
  }

  // ---- sprite hair: silhouette per style + a few strands ----
  const c = p.hair;
  const hi = shade(c, 42);
  const lo = shade(c, -38);
  const st = p.hairStyle;
  ctx.fillStyle = c;
  ctx.beginPath();
  if (st === 'bob') {
    ctx.moveTo(hx0 - hr * 1.02, hy0 + hr * 0.55);
    ctx.bezierCurveTo(hx0 - hr * 1.08, hy0 - hr * 0.5, hx0 - hr * 0.6, hy0 - hr * 1.2, hx0, hy0 - hr * 1.22);
    ctx.bezierCurveTo(hx0 + hr * 0.6, hy0 - hr * 1.2, hx0 + hr * 1.08, hy0 - hr * 0.5, hx0 + hr * 1.02, hy0 + hr * 0.55);
    ctx.lineTo(hx0 + hr * 0.62, hy0 - hr * 0.25);
    ctx.lineTo(hx0 - hr * 0.62, hy0 - hr * 0.25);
    ctx.closePath();
  } else if (st === 'ponytail') {
    ctx.moveTo(hx0 - hr * 0.98, hy0 - hr * 0.1);
    ctx.bezierCurveTo(hx0 - hr * 1.0, hy0 - hr * 0.9, hx0 - hr * 0.5, hy0 - hr * 1.2, hx0, hy0 - hr * 1.2);
    ctx.bezierCurveTo(hx0 + hr * 0.5, hy0 - hr * 1.2, hx0 + hr * 1.0, hy0 - hr * 0.9, hx0 + hr * 0.98, hy0 - hr * 0.1);
    ctx.quadraticCurveTo(hx0 + hr * 0.5, hy0 - hr * 0.35, hx0, hy0 - hr * 0.4);
    ctx.quadraticCurveTo(hx0 - hr * 0.5, hy0 - hr * 0.35, hx0 - hr * 0.98, hy0 - hr * 0.1);
    ctx.closePath();
  } else if (st === 'spiky') {
    ctx.moveTo(hx0 - hr * 1.0, hy0 - hr * 0.05);
    ctx.lineTo(hx0 - hr * 1.1, hy0 - hr * 0.6);
    ctx.lineTo(hx0 - hr * 0.75, hy0 - hr * 0.75);
    ctx.lineTo(hx0 - hr * 0.7, hy0 - hr * 1.15);
    ctx.lineTo(hx0 - hr * 0.35, hy0 - hr * 0.9);
    ctx.lineTo(hx0 - hr * 0.15, hy0 - hr * 1.25);
    ctx.lineTo(hx0 + hr * 0.2, hy0 - hr * 0.95);
    ctx.lineTo(hx0 + hr * 0.55, hy0 - hr * 1.2);
    ctx.lineTo(hx0 + hr * 0.7, hy0 - hr * 0.85);
    ctx.lineTo(hx0 + hr * 1.05, hy0 - hr * 0.95);
    ctx.lineTo(hx0 + hr * 1.0, hy0 - hr * 0.05);
    ctx.quadraticCurveTo(hx0 + hr * 0.5, hy0 - hr * 0.32, hx0, hy0 - hr * 0.34);
    ctx.quadraticCurveTo(hx0 - hr * 0.5, hy0 - hr * 0.32, hx0 - hr * 1.0, hy0 - hr * 0.05);
    ctx.closePath();
  } else if (st === 'shaggy') {
    ctx.moveTo(hx0 - hr * 1.02, hy0 - hr * 0.05);
    ctx.bezierCurveTo(hx0 - hr * 1.08, hy0 - hr * 0.9, hx0 - hr * 0.55, hy0 - hr * 1.22, hx0, hy0 - hr * 1.22);
    ctx.bezierCurveTo(hx0 + hr * 0.55, hy0 - hr * 1.22, hx0 + hr * 1.08, hy0 - hr * 0.9, hx0 + hr * 1.02, hy0 - hr * 0.05);
    ctx.lineTo(hx0 + hr * 0.8, hy0 + hr * 0.35);
    ctx.lineTo(hx0 + hr * 0.55, hy0 + hr * 0.05);
    ctx.lineTo(hx0 + hr * 0.3, hy0 + hr * 0.3);
    ctx.lineTo(hx0, hy0 + hr * 0.05);
    ctx.lineTo(hx0 - hr * 0.3, hy0 + hr * 0.3);
    ctx.lineTo(hx0 - hr * 0.55, hy0 + hr * 0.05);
    ctx.lineTo(hx0 - hr * 0.8, hy0 + hr * 0.35);
    ctx.closePath();
  } else {
    // undercut / bangs / buzz / side: neat cap with a fringe line.
    ctx.moveTo(hx0 - hr * 0.98, hy0 - hr * 0.08);
    ctx.bezierCurveTo(hx0 - hr * 1.0, hy0 - hr * 0.9, hx0 - hr * 0.5, hy0 - hr * 1.2, hx0, hy0 - hr * 1.2);
    ctx.bezierCurveTo(hx0 + hr * 0.5, hy0 - hr * 1.2, hx0 + hr * 1.0, hy0 - hr * 0.9, hx0 + hr * 0.98, hy0 - hr * 0.08);
    ctx.quadraticCurveTo(hx0 + hr * 0.5, hy0 - hr * 0.32, hx0, hy0 - hr * 0.34);
    ctx.quadraticCurveTo(hx0 - hr * 0.5, hy0 - hr * 0.32, hx0 - hr * 0.98, hy0 - hr * 0.08);
    ctx.closePath();
  }
  ctx.fill();
  // A few highlight strands on the cap.
  ctx.strokeStyle = hi;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(hx0 - hr * 0.45, hy0 - hr * 0.95);
  ctx.quadraticCurveTo(hx0 - hr * 0.2, hy0 - hr * 0.55, hx0 - hr * 0.25, hy0 - hr * 0.28);
  ctx.moveTo(hx0 + hr * 0.1, hy0 - hr * 1.0);
  ctx.quadraticCurveTo(hx0 + hr * 0.3, hy0 - hr * 0.6, hx0 + hr * 0.28, hy0 - hr * 0.3);
  ctx.stroke();
  ctx.strokeStyle = lo;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(hx0 - hr * 0.65, hy0 - hr * 0.7);
  ctx.quadraticCurveTo(hx0 - hr * 0.75, hy0 - hr * 0.3, hx0 - hr * 0.7, hy0 + hr * 0.05);
  ctx.moveTo(hx0 + hr * 0.65, hy0 - hr * 0.7);
  ctx.quadraticCurveTo(hx0 + hr * 0.75, hy0 - hr * 0.3, hx0 + hr * 0.7, hy0 + hr * 0.05);
  ctx.stroke();
  // Ponytail tail on the sprite.
  if (st === 'ponytail') {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(hx0 + hr * 0.15, hy0 - hr * 1.05);
    ctx.bezierCurveTo(hx0 + hr * 0.9, hy0 - hr * 1.35, hx0 + hr * 1.35, hy0 - hr * 0.9, hx0 + hr * 1.25, hy0 - hr * 0.35);
    ctx.bezierCurveTo(hx0 + hr * 0.9, hy0 - hr * 0.45, hx0 + hr * 0.55, hy0 - hr * 0.7, hx0 + hr * 0.15, hy0 - hr * 1.05);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = hi;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(hx0 + hr * 0.35, hy0 - hr * 1.05);
    ctx.quadraticCurveTo(hx0 + hr * 0.9, hy0 - hr * 1.1, hx0 + hr * 1.1, hy0 - hr * 0.65);
    ctx.stroke();
  }
  // Bob side locks in front of the ears.
  if (st === 'bob') {
    ctx.fillStyle = c;
    ctx.fillRect(hx0 - hr * 1.0, hy0 - hr * 0.1, hr * 0.22, hr * 0.62);
    ctx.fillRect(hx0 + hr * 0.78, hy0 - hr * 0.1, hr * 0.22, hr * 0.62);
  }
  // Glasses on the sprite (Wren).
  if (p.glasses) {
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(hx0 - hr * 0.38, hy0 - hr * 0.05, hr * 0.28, 0, Math.PI * 2);
    ctx.arc(hx0 + hr * 0.38, hy0 - hr * 0.05, hr * 0.28, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(hx0 - hr * 0.10, hy0 - hr * 0.08);
    ctx.lineTo(hx0 + hr * 0.10, hy0 - hr * 0.08);
    ctx.stroke();
  }
  // Scarf / ascot on the sprite.
  if (p.scarf) {
    ctx.fillStyle = p.scarf;
    ctx.fillRect(-6, -10, 12, 4);
    ctx.beginPath();
    ctx.moveTo(4, -8);
    ctx.quadraticCurveTo(11, -4, 12, 4);
    ctx.quadraticCurveTo(8, 5, 7, 0);
    ctx.quadraticCurveTo(6, -4, 4, -8);
    ctx.closePath();
    ctx.fill();
  }
  if (p.ascot) {
    ctx.fillStyle = '#f4f1e8';
    ctx.beginPath();
    ctx.ellipse(0, -8, 3.4, 2.6, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
