// Faithful canvas portraits of the Survey Corps heroes, drawn from the real designs:
// Eren's shaggy brown hair and green eyes, Mikasa's black bob and red scarf, Levi's
// black undercut curtain and dull grey eyes with dark circles and white ascot, Armin's
// blond undercut with straight bangs and big blue eyes, and the squad's own cuts
// (Sasha's auburn ponytail, Connie's buzz cut, Jean's spiky ash-brown undercut,
// Hange's ponytail and glasses, Erwin's swept blond hair and thick brows). No stills,
// no photos: every line is drawn here in code.
import { HEROES, SQUAD } from './config.js';

export function heroById(id) {
  return HEROES.find((h) => h.id === id) || HEROES[0];
}
export function squadById(id) {
  return SQUAD.find((s) => s.id === id) || SQUAD[0];
}

/** Shared face: skin, eyes in the hero's colour, brows, nose, mouth. s = head radius. */
function drawFace(ctx, person, cx, cy, s) {
  ctx.fillStyle = person.skin;
  ctx.beginPath();
  ctx.ellipse(cx, cy, s * 0.82, s, 0, 0, Math.PI * 2);
  ctx.fill();
  // Ears.
  ctx.beginPath(); ctx.ellipse(cx - s * 0.82, cy, s * 0.14, s * 0.22, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + s * 0.82, cy, s * 0.14, s * 0.22, 0, 0, Math.PI * 2); ctx.fill();
  // Eyes: anime-style, coloured iris with a white highlight.
  const eyeY = cy - s * 0.08;
  const eyeDX = s * 0.34;
  const eyeW = s * 0.26;
  const eyeH = s * 0.34;
  for (const side of [-1, 1]) {
    const ex = cx + side * eyeDX;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.ellipse(ex, eyeY, eyeW, eyeH, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = person.eyes;
    ctx.beginPath(); ctx.ellipse(ex, eyeY + eyeH * 0.08, eyeW * 0.72, eyeH * 0.78, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#14100c';
    ctx.beginPath(); ctx.arc(ex, eyeY + eyeH * 0.08, eyeW * 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(ex - eyeW * 0.22, eyeY - eyeH * 0.22, eyeW * 0.2, 0, Math.PI * 2); ctx.fill();
    // Upper lash line.
    ctx.strokeStyle = '#1a1210';
    ctx.lineWidth = Math.max(1.5, s * 0.06);
    ctx.beginPath(); ctx.ellipse(ex, eyeY - eyeH * 0.42, eyeW * 1.05, eyeH * 0.42, 0, Math.PI, Math.PI * 2); ctx.stroke();
  }
  // Levi's dark circles under the eyes.
  if (person.id === 'levi') {
    ctx.strokeStyle = 'rgba(60,50,45,0.55)';
    ctx.lineWidth = Math.max(1, s * 0.05);
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(cx + side * eyeDX, eyeY + eyeH * 0.55, eyeW * 0.8, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
    }
  }
  // Brows: Erwin's are famously thick.
  ctx.strokeStyle = person.hair;
  ctx.lineWidth = person.id === 'erwin' ? Math.max(3, s * 0.16) : Math.max(2, s * 0.09);
  ctx.lineCap = 'round';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(cx + side * eyeDX - eyeW * 0.9, eyeY - eyeH * 0.85);
    ctx.lineTo(cx + side * eyeDX + eyeW * 0.85, eyeY - eyeH * 0.95);
    ctx.stroke();
  }
  // Nose and mouth.
  ctx.strokeStyle = 'rgba(120,70,45,0.7)';
  ctx.lineWidth = Math.max(1, s * 0.05);
  ctx.beginPath(); ctx.moveTo(cx, cy + s * 0.12); ctx.lineTo(cx - s * 0.06, cy + s * 0.38); ctx.stroke();
  ctx.strokeStyle = '#8a4a3a';
  ctx.lineWidth = Math.max(1.5, s * 0.07);
  ctx.beginPath(); ctx.moveTo(cx - s * 0.22, cy + s * 0.58); ctx.quadraticCurveTo(cx, cy + s * 0.68, cx + s * 0.22, cy + s * 0.58); ctx.stroke();
  if (person.glasses) drawGlasses(ctx, cx, cy - s * 0.08, s);
}

function drawGlasses(ctx, cx, cy, s) {
  ctx.strokeStyle = '#2a2a2a';
  ctx.lineWidth = Math.max(1.5, s * 0.06);
  for (const side of [-1, 1]) {
    ctx.beginPath(); ctx.arc(cx + side * s * 0.34, cy, s * 0.3, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.beginPath(); ctx.moveTo(cx - s * 0.05, cy); ctx.lineTo(cx + s * 0.05, cy); ctx.stroke();
}

/** Hair per character, drawn over the face. */
function drawHair(ctx, person, cx, cy, s) {
  const hair = person.hair;
  ctx.fillStyle = hair;
  const top = cy - s;
  if (person.hairStyle === 'shaggy') {
    // Eren: messy medium spikes falling over the forehead.
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.95, cy - s * 0.1);
    ctx.quadraticCurveTo(cx - s * 1.05, top - s * 0.35, cx - s * 0.4, top - s * 0.3);
    ctx.quadraticCurveTo(cx - s * 0.1, top - s * 0.55, cx + s * 0.25, top - s * 0.28);
    ctx.quadraticCurveTo(cx + s * 0.85, top - s * 0.42, cx + s * 0.95, cy - s * 0.05);
    ctx.quadraticCurveTo(cx + s * 0.8, cy - s * 0.55, cx + s * 0.45, cy - s * 0.45);
    ctx.quadraticCurveTo(cx + s * 0.2, cy - s * 0.75, cx, cy - s * 0.5);
    ctx.quadraticCurveTo(cx - s * 0.25, cy - s * 0.8, cx - s * 0.5, cy - s * 0.5);
    ctx.quadraticCurveTo(cx - s * 0.8, cy - s * 0.6, cx - s * 0.95, cy - s * 0.1);
    ctx.fill();
  } else if (person.hairStyle === 'bob') {
    // Mikasa: straight black bob with bangs, chin-length, framing the face.
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.95, cy + s * 0.55);
    ctx.quadraticCurveTo(cx - s * 1.05, top - s * 0.25, cx, top - s * 0.3);
    ctx.quadraticCurveTo(cx + s * 1.05, top - s * 0.25, cx + s * 0.95, cy + s * 0.55);
    ctx.quadraticCurveTo(cx + s * 0.9, cy - s * 0.35, cx + s * 0.72, cy - s * 0.35);
    ctx.quadraticCurveTo(cx + s * 0.55, cy - s * 0.62, cx + s * 0.2, cy - s * 0.55);
    ctx.quadraticCurveTo(cx, cy - s * 0.68, cx - s * 0.2, cy - s * 0.55);
    ctx.quadraticCurveTo(cx - s * 0.55, cy - s * 0.62, cx - s * 0.72, cy - s * 0.35);
    ctx.quadraticCurveTo(cx - s * 0.9, cy - s * 0.35, cx - s * 0.95, cy + s * 0.55);
    ctx.fill();
  } else if (person.hairStyle === 'undercut') {
    // Levi: short undercut curtain, neat fringe parted in the middle.
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.88, cy - s * 0.15);
    ctx.quadraticCurveTo(cx - s * 0.95, top - s * 0.3, cx - s * 0.3, top - s * 0.32);
    ctx.quadraticCurveTo(cx, top - s * 0.42, cx + s * 0.3, top - s * 0.32);
    ctx.quadraticCurveTo(cx + s * 0.95, top - s * 0.3, cx + s * 0.88, cy - s * 0.15);
    ctx.quadraticCurveTo(cx + s * 0.8, cy - s * 0.5, cx + s * 0.42, cy - s * 0.52);
    ctx.quadraticCurveTo(cx + s * 0.15, cy - s * 0.72, cx, cy - s * 0.5);
    ctx.quadraticCurveTo(cx - s * 0.15, cy - s * 0.72, cx - s * 0.42, cy - s * 0.52);
    ctx.quadraticCurveTo(cx - s * 0.8, cy - s * 0.5, cx - s * 0.88, cy - s * 0.15);
    ctx.fill();
  } else if (person.hairStyle === 'bangs') {
    // Armin: blond undercut with straight bangs across the whole forehead.
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.9, cy - s * 0.05);
    ctx.quadraticCurveTo(cx - s * 1.0, top - s * 0.3, cx, top - s * 0.34);
    ctx.quadraticCurveTo(cx + s * 1.0, top - s * 0.3, cx + s * 0.9, cy - s * 0.05);
    ctx.lineTo(cx + s * 0.86, cy + s * 0.35);
    ctx.quadraticCurveTo(cx + s * 0.6, cy - s * 0.45, cx + s * 0.3, cy - s * 0.42);
    ctx.quadraticCurveTo(cx, cy - s * 0.5, cx - s * 0.3, cy - s * 0.42);
    ctx.quadraticCurveTo(cx - s * 0.6, cy - s * 0.45, cx - s * 0.86, cy + s * 0.35);
    ctx.closePath();
    ctx.fill();
  } else if (person.hairStyle === 'ponytail') {
    // Sasha / Hange: hair pulled back, tail falling behind one shoulder.
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.85, cy - s * 0.2);
    ctx.quadraticCurveTo(cx - s * 0.95, top - s * 0.3, cx, top - s * 0.34);
    ctx.quadraticCurveTo(cx + s * 0.95, top - s * 0.3, cx + s * 0.85, cy - s * 0.2);
    ctx.quadraticCurveTo(cx + s * 0.7, cy - s * 0.55, cx + s * 0.3, cy - s * 0.5);
    ctx.quadraticCurveTo(cx, cy - s * 0.62, cx - s * 0.3, cy - s * 0.5);
    ctx.quadraticCurveTo(cx - s * 0.7, cy - s * 0.55, cx - s * 0.85, cy - s * 0.2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + s * 0.55, top - s * 0.1);
    ctx.quadraticCurveTo(cx + s * 1.25, cy + s * 0.5, cx + s * 0.95, cy + s * 1.5);
    ctx.quadraticCurveTo(cx + s * 0.7, cy + s * 0.6, cx + s * 0.45, top + s * 0.1);
    ctx.closePath();
    ctx.fill();
  } else if (person.hairStyle === 'buzz') {
    // Connie: close buzz cut, just a cap of hair.
    ctx.beginPath();
    ctx.ellipse(cx, top + s * 0.12, s * 0.82, s * 0.42, 0, Math.PI, Math.PI * 2);
    ctx.fill();
  } else if (person.hairStyle === 'spiky') {
    // Jean: spiky ash-brown hair, undercut at the sides.
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.9, cy - s * 0.1);
    for (let i = 0; i <= 6; i += 1) {
      const t = i / 6;
      const px = cx - s * 0.9 + t * s * 1.8;
      const py = top - s * (0.25 + (i % 2 === 0 ? 0.28 : 0.08));
      ctx.lineTo(px, py);
      ctx.lineTo(px + s * 0.14, cy - s * 0.55);
    }
    ctx.lineTo(cx + s * 0.9, cy - s * 0.1);
    ctx.quadraticCurveTo(cx + s * 0.7, cy - s * 0.5, cx, cy - s * 0.55);
    ctx.quadraticCurveTo(cx - s * 0.7, cy - s * 0.5, cx - s * 0.9, cy - s * 0.1);
    ctx.fill();
  } else {
    // Erwin: swept-back blond side part.
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.88, cy - s * 0.2);
    ctx.quadraticCurveTo(cx - s * 0.95, top - s * 0.3, cx - s * 0.1, top - s * 0.34);
    ctx.quadraticCurveTo(cx + s * 0.7, top - s * 0.42, cx + s * 0.9, cy - s * 0.25);
    ctx.quadraticCurveTo(cx + s * 0.75, cy - s * 0.55, cx + s * 0.35, cy - s * 0.55);
    ctx.quadraticCurveTo(cx, cy - s * 0.68, cx - s * 0.35, cy - s * 0.55);
    ctx.quadraticCurveTo(cx - s * 0.75, cy - s * 0.55, cx - s * 0.88, cy - s * 0.2);
    ctx.fill();
  }
}

/** Survey Corps uniform: beige cropped jacket, white shirt, brown leather harness,
 *  green cloak behind the shoulders, Wings of Freedom on the back. */
function drawUniform(ctx, person, cx, cy, s) {
  // Green cloak.
  if (person.cloak) {
    ctx.fillStyle = '#2e5d33';
    ctx.beginPath();
    ctx.moveTo(cx - s * 1.5, cy + s * 1.1);
    ctx.quadraticCurveTo(cx - s * 1.9, cy + s * 2.6, cx - s * 1.2, cy + s * 3.1);
    ctx.lineTo(cx + s * 1.2, cy + s * 3.1);
    ctx.quadraticCurveTo(cx + s * 1.9, cy + s * 2.6, cx + s * 1.5, cy + s * 1.1);
    ctx.closePath();
    ctx.fill();
    // Wings of Freedom emblem.
    ctx.strokeStyle = '#d8c98a';
    ctx.lineWidth = Math.max(1.5, s * 0.07);
    ctx.beginPath();
    ctx.moveTo(cx, cy + s * 1.9);
    ctx.quadraticCurveTo(cx - s * 0.35, cy + s * 1.55, cx - s * 0.55, cy + s * 1.95);
    ctx.moveTo(cx, cy + s * 1.9);
    ctx.quadraticCurveTo(cx + s * 0.35, cy + s * 1.55, cx + s * 0.55, cy + s * 1.95);
    ctx.stroke();
  }
  // Jacket.
  ctx.fillStyle = '#c9b18c';
  ctx.beginPath();
  ctx.moveTo(cx - s * 1.25, cy + s * 1.15);
  ctx.quadraticCurveTo(cx - s * 1.35, cy + s * 2.9, cx - s * 0.9, cy + s * 3.05);
  ctx.lineTo(cx + s * 0.9, cy + s * 3.05);
  ctx.quadraticCurveTo(cx + s * 1.35, cy + s * 2.9, cx + s * 1.25, cy + s * 1.15);
  ctx.closePath();
  ctx.fill();
  // White shirt V.
  ctx.fillStyle = '#f2ede2';
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.42, cy + s * 1.1);
  ctx.lineTo(cx + s * 0.42, cy + s * 1.1);
  ctx.lineTo(cx, cy + s * 1.95);
  ctx.closePath();
  ctx.fill();
  // Brown leather harness straps.
  ctx.strokeStyle = '#6b4a2f';
  ctx.lineWidth = Math.max(2, s * 0.14);
  ctx.beginPath();
  ctx.moveTo(cx - s * 1.1, cy + s * 1.35); ctx.lineTo(cx - s * 0.25, cy + s * 2.9);
  ctx.moveTo(cx + s * 1.1, cy + s * 1.35); ctx.lineTo(cx + s * 0.25, cy + s * 2.9);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - s * 1.2, cy + s * 2.2); ctx.lineTo(cx + s * 1.2, cy + s * 2.2);
  ctx.stroke();
  // Mikasa's red scarf, wrapped at the neck and trailing.
  if (person.scarf) {
    ctx.fillStyle = person.scarf;
    ctx.beginPath();
    ctx.ellipse(cx, cy + s * 1.05, s * 0.72, s * 0.34, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + s * 0.35, cy + s * 1.1);
    ctx.quadraticCurveTo(cx + s * 1.1, cy + s * 1.9, cx + s * 0.85, cy + s * 2.7);
    ctx.lineTo(cx + s * 0.45, cy + s * 2.6);
    ctx.quadraticCurveTo(cx + s * 0.6, cy + s * 1.8, cx + s * 0.1, cy + s * 1.2);
    ctx.closePath();
    ctx.fill();
  }
  // Levi's white ascot at the collar.
  if (person.ascot) {
    ctx.fillStyle = '#f4f1e8';
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.4, cy + s * 1.05);
    ctx.lineTo(cx + s * 0.4, cy + s * 1.05);
    ctx.lineTo(cx + s * 0.15, cy + s * 1.7);
    ctx.lineTo(cx - s * 0.15, cy + s * 1.7);
    ctx.closePath();
    ctx.fill();
  }
}

/** Big portrait for the title screen and character select. (x, y) is the head centre. */
export function drawHeroPortrait(ctx, person, x, y, s) {
  drawUniform(ctx, person, x, y, s);
  drawFace(ctx, person, x, y, s);
  drawHair(ctx, person, x, y, s);
}

/** Small in-game sprite: the soldier mid-swing, cloak flaring, dual blades out.
 *  slashT 0..1 animates the blade arc; flip faces left when facing < 0. */
export function drawHeroSprite(ctx, hero, x, y, facing, slashT, swinging) {
  const s = 11;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing, 1);
  // Green cloak flaring behind.
  ctx.fillStyle = '#2e5d33';
  ctx.beginPath();
  ctx.moveTo(-6, -14);
  ctx.quadraticCurveTo(-26 - (swinging ? 10 : 0), -2, -20, 16);
  ctx.lineTo(-2, 14);
  ctx.closePath();
  ctx.fill();
  // Legs and boots.
  ctx.strokeStyle = '#3a2e22';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, 8); ctx.lineTo(-6, 22); ctx.moveTo(0, 8); ctx.lineTo(7, 20); ctx.stroke();
  // Torso: beige jacket + harness.
  ctx.fillStyle = '#c9b18c';
  ctx.fillRect(-7, -14, 14, 24);
  ctx.strokeStyle = '#6b4a2f';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-7, -8); ctx.lineTo(7, 4); ctx.moveTo(7, -8); ctx.lineTo(-7, 4); ctx.stroke();
  // ODM gear boxes on the hips.
  ctx.fillStyle = '#4a4a4a';
  ctx.fillRect(-11, 2, 6, 8);
  ctx.fillRect(5, 2, 6, 8);
  // Head + hair.
  ctx.fillStyle = hero.skin;
  ctx.beginPath(); ctx.arc(2, -20, s, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = hero.hair;
  ctx.beginPath(); ctx.arc(2, -23, s, Math.PI, Math.PI * 2); ctx.fill();
  if (hero.hairStyle === 'bob') { ctx.fillRect(-9, -24, 4, 12); ctx.fillRect(9, -24, 4, 12); }
  if (hero.hairStyle === 'ponytail') { ctx.fillRect(-12, -26, 5, 12); }
  if (hero.hairStyle === 'bangs') { ctx.fillRect(-8, -30, 20, 5); }
  // Eye.
  ctx.fillStyle = hero.eyes;
  ctx.beginPath(); ctx.arc(7, -21, 2.4, 0, Math.PI * 2); ctx.fill();
  // Mikasa's red scarf / Levi's white ascot, visible even at sprite size.
  if (hero.scarf) {
    ctx.fillStyle = hero.scarf;
    ctx.fillRect(-8, -14, 16, 4);
    ctx.fillRect(-14, -12, 5, 12);
  }
  if (hero.ascot) { ctx.fillStyle = '#f4f1e8'; ctx.fillRect(-3, -14, 7, 6); }
  // Dual blades: out and arcing while slashing.
  const armAngle = slashT > 0 ? -1.2 + slashT * 2.4 : -0.4;
  ctx.strokeStyle = '#dfe6ea';
  ctx.lineWidth = 2.5;
  for (const arm of [-1, 1]) {
    const ax = 6;
    const ay = -6 + arm * 5;
    const bx = ax + Math.cos(armAngle + arm * 0.5) * 18;
    const by = ay + Math.sin(armAngle + arm * 0.5) * 18;
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
  }
  ctx.restore();
  // Slash arc flash.
  if (slashT > 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha = 0.85 * (1 - slashT);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, 0, 46, -1.1 + slashT * 1.4, 0.4 + slashT * 1.4);
    ctx.stroke();
    ctx.globalAlpha = 0.5 * (1 - slashT);
    ctx.strokeStyle = '#ffd76a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 56, -1.1 + slashT * 1.4, 0.4 + slashT * 1.4);
    ctx.stroke();
    ctx.restore();
  }
}
