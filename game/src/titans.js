// Titan art, drawn from the series' designs: pure Titans are deformed humans with
// oversized heads, vacant eyes and wide square-toothed grins; the Colossal is a
// skinless tower of red muscle venting steam; the Armored wears segmented plates;
// the Female is athletic with long blond hair; the Beast is furred and ape-like with
// arms down to its knees. Every Titan's weak point is the nape, drawn as a pulsing
// red glow at the back of the neck — slash there, nowhere else.
import { TITAN_KINDS } from './config.js';

/** The nape hitbox centre for a Titan standing at (x, feetY) with height h. */
export function napePosition(titan) {
  return { x: titan.x + titan.height * 0.10, y: titan.feetY - titan.height * 0.80, r: titan.height * 0.075 };
}

function drawFace(ctx, titan, hx, hy, hr) {
  const kind = titan.kind;
  ctx.fillStyle = titan.skin;
  ctx.beginPath(); ctx.ellipse(hx, hy, hr * 0.9, hr, 0, 0, Math.PI * 2); ctx.fill();
  // Eyes: vacant for pure Titans, fierce for shifters.
  const eyeY = hy - hr * 0.15;
  for (const side of [-1, 1]) {
    const ex = hx + side * hr * 0.32 - hr * 0.18;
    const er = hr * (kind === 'pure' || kind === 'tall' ? 0.16 + titan.deform * 0.08 : 0.14);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(ex, eyeY, er, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = kind === 'female' ? '#4a7ec2' : '#2a1a12';
    ctx.beginPath(); ctx.arc(ex, eyeY, er * 0.5, 0, Math.PI * 2); ctx.fill();
  }
  // Wide mouth with small square teeth.
  ctx.fillStyle = '#4a1410';
  ctx.beginPath();
  ctx.ellipse(hx - hr * 0.1, hy + hr * 0.42, hr * 0.55, hr * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f2ede2';
  for (let i = 0; i < 5; i += 1) {
    ctx.fillRect(hx - hr * 0.5 + i * hr * 0.2, hy + hr * 0.28, hr * 0.13, hr * 0.16);
  }
  if (kind === 'beast') {
    // Ape brow ridge and muzzle.
    ctx.fillStyle = '#6a4a30';
    ctx.fillRect(hx - hr * 0.7, hy - hr * 0.45, hr * 1.1, hr * 0.22);
    ctx.beginPath(); ctx.ellipse(hx - hr * 0.1, hy + hr * 0.3, hr * 0.4, hr * 0.3, 0, 0, Math.PI * 2); ctx.fill();
  }
}

function drawArmoredPlates(ctx, titan, x, feetY, h) {
  ctx.fillStyle = '#b8a88e';
  // Segmented plates on torso, arms and thighs, with gaps at the joints.
  ctx.beginPath(); ctx.ellipse(x, feetY - h * 0.55, h * 0.16, h * 0.24, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(x - h * 0.15, feetY - h * 0.42, h * 0.3, h * 0.1);
  ctx.fillRect(x - h * 0.13, feetY - h * 0.68, h * 0.26, h * 0.08);
  ctx.fillStyle = '#8a7a62';
  ctx.fillRect(x - h * 0.16, feetY - h * 0.52, h * 0.32, h * 0.03);
  ctx.fillRect(x - h * 0.14, feetY - h * 0.6, h * 0.28, h * 0.03);
}

export function drawTitan(ctx, titan, time) {
  const kind = titan.kind;
  const h = titan.height;
  const x = titan.x;
  const feetY = titan.feetY;
  const step = Math.sin(titan.walkPhase) * h * 0.05;
  const armSwing = Math.sin(titan.walkPhase) * h * 0.04;
  const flash = titan.flash > 0;
  ctx.save();
  if (flash) { ctx.globalAlpha = 0.75; }

  // Legs, stepping toward the Wall (left).
  ctx.fillStyle = kind === 'colossal' ? '#a02818' : kind === 'beast' ? '#6a4a30' : titan.skin;
  const legW = h * 0.075;
  ctx.beginPath(); ctx.ellipse(x - h * 0.05 + step, feetY - h * 0.16, legW, h * 0.17, 0.1, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x + h * 0.06 - step, feetY - h * 0.16, legW, h * 0.17, -0.1, 0, Math.PI * 2); ctx.fill();
  // Feet.
  ctx.beginPath(); ctx.ellipse(x - h * 0.08 + step, feetY - h * 0.015, h * 0.07, h * 0.025, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x + h * 0.09 - step, feetY - h * 0.015, h * 0.07, h * 0.025, 0, 0, Math.PI * 2); ctx.fill();

  // Torso.
  const torsoW = kind === 'beast' ? h * 0.21 : kind === 'colossal' ? h * 0.17 : h * 0.15;
  const torsoH = h * 0.42;
  ctx.fillStyle = kind === 'colossal' ? '#c0392b' : kind === 'beast' ? '#7a5638' : titan.skin;
  ctx.beginPath(); ctx.ellipse(x, feetY - h * 0.52, torsoW, torsoH, 0, 0, Math.PI * 2); ctx.fill();
  if (kind === 'colossal') {
    // Exposed muscle striations.
    ctx.strokeStyle = 'rgba(120,20,10,0.7)';
    ctx.lineWidth = Math.max(1, h * 0.012);
    for (let i = 0; i < 6; i += 1) {
      ctx.beginPath();
      ctx.moveTo(x - torsoW * 0.8, feetY - h * (0.32 + i * 0.07));
      ctx.quadraticCurveTo(x, feetY - h * (0.35 + i * 0.07), x + torsoW * 0.8, feetY - h * (0.32 + i * 0.07));
      ctx.stroke();
    }
    // Ribs showing through the chest.
    ctx.strokeStyle = 'rgba(240,180,150,0.5)';
    for (let i = 0; i < 4; i += 1) {
      ctx.beginPath();
      ctx.arc(x, feetY - h * (0.45 + i * 0.06), torsoW * (0.55 + i * 0.06), 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
    }
  }
  if (kind === 'female') {
    // Athletic definition: abs and shoulder lines.
    ctx.strokeStyle = 'rgba(150,90,60,0.6)';
    ctx.lineWidth = Math.max(1, h * 0.01);
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath(); ctx.moveTo(x - torsoW * 0.5, feetY - h * (0.42 + i * 0.09)); ctx.lineTo(x + torsoW * 0.5, feetY - h * (0.42 + i * 0.09)); ctx.stroke();
    }
  }
  if (kind === 'beast') {
    // Fur tufts on the chest and shoulders.
    ctx.fillStyle = '#5a3d24';
    for (let i = 0; i < 8; i += 1) {
      const fx = x + (i % 4 - 1.5) * torsoW * 0.45;
      const fy = feetY - h * (0.4 + Math.floor(i / 4) * 0.18);
      ctx.beginPath(); ctx.arc(fx, fy, h * 0.035, 0, Math.PI * 2); ctx.fill();
    }
  }
  if (kind === 'armored') drawArmoredPlates(ctx, titan, x, feetY, h);

  // Arms: long, hanging, swinging with the walk. The Beast's reach its knees.
  const armLen = kind === 'beast' ? h * 0.42 : h * 0.3;
  const armW = h * 0.05;
  ctx.fillStyle = kind === 'colossal' ? '#a02818' : kind === 'beast' ? '#6a4a30' : titan.skin;
  for (const side of [-1, 1]) {
    const ax = x + side * torsoW * 0.75;
    const ay = feetY - h * 0.68;
    const hx2 = ax + side * h * 0.02 + armSwing * side;
    const hy2 = ay + armLen;
    ctx.strokeStyle = ctx.fillStyle;
    ctx.lineWidth = armW;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(hx2, hy2); ctx.stroke();
    ctx.beginPath(); ctx.arc(hx2, hy2, armW * 0.62, 0, Math.PI * 2); ctx.fill();
  }

  // Head: oversized for pure Titans, tiny for the Colossal.
  const hr = kind === 'colossal' ? h * 0.045 : kind === 'pure' || kind === 'tall' ? h * 0.105 : h * 0.08;
  const hx = x - h * 0.03;
  const hy = feetY - h * 0.82;
  drawFace(ctx, titan, hx, hy, hr);
  if (kind === 'colossal') {
    // Skinless skull: red muscle, visible teeth, no lips.
    ctx.strokeStyle = 'rgba(120,20,10,0.8)';
    ctx.lineWidth = Math.max(1, h * 0.008);
    ctx.beginPath(); ctx.arc(hx, hy, hr * 0.9, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke();
  }
  if (kind === 'female') {
    // Long blond hair down the back.
    ctx.fillStyle = '#e8c86a';
    ctx.beginPath();
    ctx.moveTo(hx + hr * 0.4, hy - hr * 0.6);
    ctx.quadraticCurveTo(hx + hr * 1.3, hy + hr * 0.5, hx + hr * 0.9, feetY - h * 0.45);
    ctx.quadraticCurveTo(hx + hr * 0.5, hy + hr * 0.4, hx + hr * 0.1, hy - hr * 0.5);
    ctx.closePath();
    ctx.fill();
  }
  if (kind === 'armored') {
    // Plate helm over the brow, face exposed below.
    ctx.fillStyle = '#b8a88e';
    ctx.beginPath(); ctx.arc(hx, hy - hr * 0.25, hr * 0.95, Math.PI, Math.PI * 2); ctx.fill();
  }

  // The nape: the one weak point, a pulsing red glow at the back of the neck.
  const nape = napePosition(titan);
  const pulse = 0.55 + 0.35 * Math.sin(time * 6 + titan.walkPhase);
  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.fillStyle = '#ff2a1a';
  ctx.beginPath(); ctx.ellipse(nape.x, nape.y, nape.r * 1.15, nape.r * 0.8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = pulse * 0.5;
  ctx.fillStyle = '#ff6a3a';
  ctx.beginPath(); ctx.ellipse(nape.x, nape.y, nape.r * 1.8, nape.r * 1.3, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // Grab telegraph: the Titan rears its arm back before snatching.
  if (titan.grabT > 0) {
    ctx.strokeStyle = 'rgba(255,60,30,0.9)';
    ctx.lineWidth = Math.max(2, h * 0.02);
    ctx.beginPath();
    ctx.arc(hx, hy, hr * 1.7, -0.4, 1.2);
    ctx.stroke();
  }
  ctx.restore();
}

/** Colossal steam: pale wisps rising off its muscle, drawn in the renderer. */
export function drawSteam(ctx, x, y, r, time, seed) {
  ctx.save();
  ctx.globalAlpha = 0.28 + 0.1 * Math.sin(time * 2 + seed);
  ctx.fillStyle = '#e8e0d0';
  for (let i = 0; i < 3; i += 1) {
    const a = time * 0.7 + seed + (i * Math.PI * 2) / 3;
    const px = x + Math.cos(a) * r * 0.5;
    const py = y - r * (0.4 + (i % 2) * 0.5) - ((time * 30 + seed * 40) % 60);
    ctx.beginPath(); ctx.ellipse(px, py, r * 0.35, r * 0.5, a, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

export function titanKindDef(kind) {
  return TITAN_KINDS[kind] || TITAN_KINDS.pure;
}
