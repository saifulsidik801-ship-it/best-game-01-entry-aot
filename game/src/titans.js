// Titan Slayer — Titan art (menacing re-author).
// Pure canvas 2D. No network, no libraries, fully deterministic.
// A Titan is anchored at (titan.x, titan.feetY) with total height titan.height.
// napePosition MUST stay exactly { x: x + h*0.10, y: feetY - h*0.80, r: h*0.075 }.

// ---------------------------------------------------------------- helpers --
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (n >> 16) + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) + amt));
  const b = Math.max(0, Math.min(255, (n & 0xff) + amt));
  return `rgb(${r},${g},${b})`;
}

function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function skinGrad(ctx, x, y, r, skin) {
  const g = ctx.createRadialGradient(x - r * 0.4, y - r * 0.5, r * 0.1, x, y, r * 1.4);
  g.addColorStop(0, shade(skin, 26));
  g.addColorStop(0.55, skin);
  g.addColorStop(1, shade(skin, -34));
  return g;
}

// ------------------------------------------------------------ kind defs ----
const KINDS = {
  pure:     { name: 'Pure Titan',     skin: '#e8c39a', heightMin: 42,  heightMax: 72,  hits: 1, maxHits: 1, speed: 0.55, score: 100 },
  tall:     { name: 'Tall Titan',     skin: '#d9a87e', heightMin: 75,  heightMax: 115, hits: 2, maxHits: 2, speed: 0.45, score: 200 },
  female:   { name: 'Female Titan',   skin: '#f0c8a0', heightMin: 85,  heightMax: 100, hits: 3, maxHits: 3, speed: 0.70, score: 400 },
  beast:    { name: 'Beast Titan',    skin: '#8a6a4a', heightMin: 95,  heightMax: 115, hits: 4, maxHits: 4, speed: 0.40, score: 500 },
  armored:  { name: 'Armored Titan',  skin: '#cbb59a', heightMin: 85,  heightMax: 105, hits: 5, maxHits: 5, speed: 0.50, score: 600 },
  colossal: { name: 'Colossal Titan', skin: '#c0392b', heightMin: 170, heightMax: 210, hits: 8, maxHits: 8, speed: 0.25, score: 1500 },
};

export function titanKindDef(kind) {
  const d = KINDS[kind] || KINDS.pure;
  return {
    kind, name: d.name, skin: d.skin,
    heightMin: d.heightMin, heightMax: d.heightMax,
    minHeight: d.heightMin, maxHeight: d.heightMax,
    hits: d.hits, maxHits: d.maxHits, hp: d.hits,
    speed: d.speed, walkSpeed: d.speed, score: d.score,
  };
}

// ------------------------------------------------------------ nape ---------
export function napePosition(titan) {
  return { x: titan.x + titan.height * 0.10, y: titan.feetY - titan.height * 0.80, r: titan.height * 0.075 };
}

// ------------------------------------------------------------ steam --------
export function drawSteam(ctx, x, y, r, time, seed) {
  ctx.save();
  for (let i = 0; i < 5; i++) {
    const cyc = ((time * 0.35 + seed * 0.37 + i * 0.23) % 1);
    const wy = y - cyc * r * 1.6;
    const wx = x + Math.sin(time * 0.9 + seed * 2.1 + i * 1.7) * r * 0.28 + (i - 2) * r * 0.16;
    const wr = r * (0.22 + cyc * 0.42);
    const a = 0.34 * (1 - cyc) * (0.6 + 0.4 * Math.sin(time + i * 2.0));
    ctx.fillStyle = `rgba(238,238,244,${Math.max(0, a).toFixed(3)})`;
    ctx.beginPath();
    ctx.ellipse(wx, wy, wr, wr * 0.62, (i * 0.4), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// ------------------------------------------------------------ titan --------
export function drawTitan(ctx, titan, time) {
  const h = titan.height;
  const x = titan.x;
  const feetY = titan.feetY;
  const kind = titan.kind || 'pure';
  const skin = titan.skin || (KINDS[kind] || KINDS.pure).skin;
  const deform = titan.deform || 0;
  const wp = titan.walkPhase || 0;
  const swing = Math.sin(wp);
  const swing2 = Math.sin(wp + Math.PI);
  const flash = titan.flash || 0;
  const grabT = titan.grabT || 0;
  const u = h / 100; // scale unit

  // Head radius by kind: pure oversized, colossal tiny, others mid.
  const headR = kind === 'pure' ? h * 0.105 : kind === 'colossal' ? h * 0.045 : kind === 'tall' ? h * 0.07 : h * 0.078;
  const headCX = x + h * 0.02 + deform * h * 0.02;
  const headCY = feetY - h + headR * 1.05;
  const hipY = feetY - h * 0.42;
  const shoulderY = feetY - h * 0.70;
  const shoulderW = kind === 'armored' || kind === 'colossal' ? h * 0.17 : kind === 'beast' ? h * 0.16 : h * 0.145;
  const armLen = kind === 'beast' ? h * 0.55 : kind === 'colossal' ? h * 0.30 : h * 0.40;
  const legLen = h * 0.42;
  const dark = shade(skin, -46);
  const light = shade(skin, 30);

  ctx.save();

  // ---- far arm (behind torso) ----
  drawArm(ctx, x - shoulderW, shoulderY, armLen, swing2 * h * 0.05, skin, dark, kind, true, h);
  // ---- far leg ----
  drawLeg(ctx, x - h * 0.055, hipY, legLen, swing2 * h * 0.045, skin, dark, kind, feetY, u);

  // ---- torso ----
  const torsoG = ctx.createLinearGradient(x - shoulderW, shoulderY, x + shoulderW, hipY);
  torsoG.addColorStop(0, light);
  torsoG.addColorStop(0.5, skin);
  torsoG.addColorStop(1, dark);
  ctx.fillStyle = torsoG;
  ctx.beginPath();
  ctx.moveTo(x - shoulderW * 0.92, shoulderY + h * 0.02);
  ctx.bezierCurveTo(x - shoulderW * 1.08, hipY - h * 0.12, x - h * 0.075, hipY + h * 0.01, x - h * 0.065, hipY + h * 0.02);
  ctx.lineTo(x + h * 0.065, hipY + h * 0.02);
  ctx.bezierCurveTo(x + h * 0.075, hipY + h * 0.01, x + shoulderW * 1.08, hipY - h * 0.12, x + shoulderW * 0.92, shoulderY + h * 0.02);
  ctx.quadraticCurveTo(x, shoulderY - h * 0.03, x - shoulderW * 0.92, shoulderY + h * 0.02);
  ctx.closePath();
  ctx.fill();
  // Belly shading for pure titans.
  if (kind === 'pure') {
    ctx.fillStyle = 'rgba(120,70,40,0.18)';
    ctx.beginPath();
    ctx.ellipse(x, hipY - h * 0.10, h * 0.075, h * 0.10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(120,70,40,0.25)';
    ctx.lineWidth = Math.max(1, u * 0.8);
    ctx.beginPath();
    ctx.arc(x, hipY - h * 0.16, h * 0.05, 0.3, Math.PI - 0.3);
    ctx.stroke();
  }
  // Chest muscle lines (female / colossal).
  if (kind === 'female' || kind === 'colossal') {
    ctx.strokeStyle = kind === 'colossal' ? 'rgba(90,10,5,0.55)' : 'rgba(140,90,55,0.35)';
    ctx.lineWidth = Math.max(1, u * 1.0);
    for (const sgn of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(x + sgn * h * 0.02, shoulderY + h * 0.06);
      ctx.quadraticCurveTo(x + sgn * h * 0.09, shoulderY + h * 0.12, x + sgn * h * 0.07, shoulderY + h * 0.20);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + sgn * h * 0.02, shoulderY + h * 0.22);
      ctx.quadraticCurveTo(x + sgn * h * 0.08, shoulderY + h * 0.26, x + sgn * h * 0.05, shoulderY + h * 0.30);
      ctx.stroke();
    }
    // Centre line down the abs.
    ctx.beginPath();
    ctx.moveTo(x, shoulderY + h * 0.08);
    ctx.lineTo(x, hipY - h * 0.02);
    ctx.stroke();
  }
  // Neck folds under the chin.
  ctx.strokeStyle = 'rgba(60,30,15,0.35)';
  ctx.lineWidth = Math.max(1, u * 1.1);
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(x + h * 0.02, headCY + headR * 0.9 + i * headR * 0.22, headR * (0.75 + i * 0.12), 0.25, Math.PI - 0.25);
    ctx.stroke();
  }

  // ---- armored plates on the torso ----
  if (kind === 'armored') {
    drawArmorPlates(ctx, x, shoulderY, hipY, shoulderW, h);
  }
  // ---- colossal ribs + muscle striations ----
  if (kind === 'colossal') {
    drawColossalTorso(ctx, x, shoulderY, hipY, shoulderW, h, time);
  }
  // ---- beast fur over the torso ----
  if (kind === 'beast') {
    drawFur(ctx, x, shoulderY, hipY, shoulderW, h, '#6a4a30', '#5a3d24');
  }

  // ---- female long blond hair down the back ----
  if (kind === 'female') {
    ctx.fillStyle = '#e8c86a';
    ctx.beginPath();
    ctx.moveTo(headCX - headR * 0.85, headCY - headR * 0.3);
    ctx.bezierCurveTo(headCX - headR * 1.15, shoulderY + h * 0.05, headCX - headR * 0.95, hipY - h * 0.08, headCX - headR * 0.55, hipY + h * 0.02);
    ctx.lineTo(headCX - headR * 0.15, hipY + h * 0.02);
    ctx.bezierCurveTo(headCX - headR * 0.35, hipY - h * 0.12, headCX - headR * 0.45, shoulderY + h * 0.02, headCX - headR * 0.5, headCY + headR * 0.4);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#b89a45';
    ctx.lineWidth = Math.max(0.8, u * 0.9);
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(headCX - headR * (0.55 + i * 0.12), headCY + headR * 0.2);
      ctx.quadraticCurveTo(headCX - headR * (0.7 + i * 0.1), shoulderY + h * 0.12, headCX - headR * (0.5 + i * 0.1), hipY - h * 0.02);
      ctx.stroke();
    }
  }

  // ---- near leg ----
  drawLeg(ctx, x + h * 0.055, hipY, legLen, swing * h * 0.045, skin, dark, kind, feetY, u);
  // ---- near arm ----
  drawArm(ctx, x + shoulderW, shoulderY, armLen, swing * h * 0.05, skin, dark, kind, false, h);

  // ---- head ----
  drawTitanHead(ctx, kind, headCX, headCY, headR, skin, dark, light, deform, time, h);

  // ---- pulsing red nape glow (gameplay-critical weak point) ----
  const nape = napePosition(titan);
  const pulse = 0.30 + 0.16 * Math.sin(time * 3.2);
  const ng = ctx.createRadialGradient(nape.x, nape.y, 1, nape.x, nape.y, nape.r * 2.4);
  ng.addColorStop(0, `rgba(255,40,25,${pulse.toFixed(3)})`);
  ng.addColorStop(0.5, `rgba(255,40,25,${(pulse * 0.45).toFixed(3)})`);
  ng.addColorStop(1, 'rgba(255,40,25,0)');
  ctx.fillStyle = ng;
  ctx.beginPath();
  ctx.arc(nape.x, nape.y, nape.r * 2.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = `rgba(255,60,40,${(pulse + 0.15).toFixed(3)})`;
  ellipse(ctx, nape.x, nape.y, nape.r * 0.55, nape.r * 0.75);

  // ---- colossal steam ----
  if (kind === 'colossal') {
    drawSteam(ctx, x - h * 0.10, shoulderY, h * 0.16, time, 1.3);
    drawSteam(ctx, x + h * 0.12, hipY - h * 0.10, h * 0.14, time, 4.7);
    drawSteam(ctx, headCX, headCY - headR, h * 0.10, time, 8.2);
  }

  // ---- grab telegraph: pulsing red arcs ----
  if (grabT > 0) {
    const ga = 0.35 + 0.30 * Math.sin(time * 10);
    ctx.strokeStyle = `rgba(255,45,20,${Math.max(0.1, ga).toFixed(3)})`;
    ctx.lineWidth = Math.max(2, u * 2.2);
    ctx.beginPath();
    ctx.arc(x, feetY - h * 0.5, h * 0.42, -2.4, -0.7);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, feetY - h * 0.5, h * 0.42, Math.PI + 0.7, Math.PI + 2.4);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, feetY - h * 0.5, h * 0.30, -1.2, 1.2);
    ctx.stroke();
  }

  // ---- hit flash: white wash over the body ----
  if (flash > 0) {
    ctx.globalAlpha = Math.min(0.65, flash * 0.65);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(x, feetY - h * 0.5, h * 0.20, h * 0.52, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

function drawLeg(ctx, hipX, hipY, legLen, swingX, skin, dark, kind, feetY, u) {
  const footX = hipX + swingX;
  const footY = feetY;
  const wTop = kind === 'beast' ? 9 : 8;
  const wBot = 5.5;
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.moveTo(hipX - wTop * u, hipY);
  ctx.lineTo(hipX + wTop * u, hipY);
  ctx.lineTo(footX + wBot * u, footY - 3 * u);
  ctx.lineTo(footX - wBot * u, footY - 3 * u);
  ctx.closePath();
  ctx.fill();
  // Shading on the inner leg.
  ctx.strokeStyle = 'rgba(60,30,15,0.28)';
  ctx.lineWidth = Math.max(1, u * 1.2);
  ctx.beginPath();
  ctx.moveTo(hipX + wTop * u * 0.4, hipY + legLen * 0.25);
  ctx.lineTo(footX + wBot * u * 0.4, footY - 5 * u);
  ctx.stroke();
  // Foot.
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.ellipse(footX + (swingX >= 0 ? 3 : -3) * u, footY - 2 * u, 8 * u, 3.2 * u, 0, 0, Math.PI * 2);
  ctx.fill();
  if (kind === 'beast') {
    ctx.fillStyle = '#5a3d24';
    ctx.beginPath();
    ctx.ellipse(hipX, hipY + legLen * 0.4, 6 * u, 9 * u, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  if (kind === 'armored') {
    ctx.strokeStyle = '#8a7a62';
    ctx.lineWidth = Math.max(1, u * 1.4);
    ctx.beginPath();
    ctx.moveTo(hipX - wTop * u * 0.8, hipY + legLen * 0.45);
    ctx.lineTo(hipX + wTop * u * 0.8, hipY + legLen * 0.45);
    ctx.stroke();
  }
}

function drawArm(ctx, shX, shY, armLen, swingX, skin, dark, kind, far, h) {
  const u = h / 100;
  const handX = shX + (far ? -1 : 1) * h * 0.045 + swingX;
  const handY = shY + armLen;
  const wTop = kind === 'beast' ? 7.5 : 6.5;
  ctx.fillStyle = far ? shade(skin, -22) : skin;
  ctx.beginPath();
  ctx.moveTo(shX - wTop * u, shY);
  ctx.lineTo(shX + wTop * u, shY);
  ctx.lineTo(handX + 4.5 * u, handY);
  ctx.lineTo(handX - 4.5 * u, handY);
  ctx.closePath();
  ctx.fill();
  // Hand: mitten with finger lines.
  ctx.fillStyle = far ? shade(skin, -22) : skin;
  ctx.beginPath();
  ctx.ellipse(handX, handY + 2 * u, 6 * u, 7 * u, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(60,30,15,0.35)';
  ctx.lineWidth = Math.max(0.8, u * 0.9);
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(handX + i * 3 * u, handY + 3 * u);
    ctx.lineTo(handX + i * 3 * u, handY + 8 * u);
    ctx.stroke();
  }
  if (kind === 'beast') {
    ctx.fillStyle = '#5a3d24';
    ctx.beginPath();
    ctx.ellipse(shX, shY + armLen * 0.45, 5.5 * u, 10 * u, 0, 0, Math.PI * 2);
    ctx.fill();
    // Long claws.
    ctx.strokeStyle = '#d8cfc0';
    ctx.lineWidth = Math.max(1, u * 1.1);
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(handX + i * 3 * u, handY + 7 * u);
      ctx.lineTo(handX + i * 4 * u, handY + 13 * u);
      ctx.stroke();
    }
  }
  if (kind === 'armored') {
    ctx.strokeStyle = '#8a7a62';
    ctx.lineWidth = Math.max(1, u * 1.4);
    ctx.beginPath();
    ctx.moveTo(shX - wTop * u * 0.8, shY + armLen * 0.4);
    ctx.lineTo(shX + wTop * u * 0.8, shY + armLen * 0.4);
    ctx.moveTo(shX - wTop * u * 0.8, shY + armLen * 0.7);
    ctx.lineTo(shX + wTop * u * 0.8, shY + armLen * 0.7);
    ctx.stroke();
  }
}

function drawArmorPlates(ctx, x, shoulderY, hipY, shoulderW, h) {
  const u = h / 100;
  const rows = 3;
  const cols = 3;
  const top = shoulderY + h * 0.03;
  const bot = hipY - h * 0.02;
  const w = shoulderW * 1.7;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const px = x - w / 2 + (c * w) / cols;
      const py = top + (r * (bot - top)) / rows;
      const pw = w / cols - 1.5 * u;
      const ph = (bot - top) / rows - 1.5 * u;
      const pg = ctx.createLinearGradient(px, py, px, py + ph);
      pg.addColorStop(0, '#d8c8ae');
      pg.addColorStop(1, '#b8a88e');
      ctx.fillStyle = pg;
      ctx.fillRect(px, py, pw, ph);
      // Bevel highlight on top edge.
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(px, py, pw, Math.max(1, u * 1.1));
      // Dark seam.
      ctx.strokeStyle = '#8a7a62';
      ctx.lineWidth = Math.max(1, u * 1.2);
      ctx.strokeRect(px, py, pw, ph);
      // Rivet.
      ctx.fillStyle = '#8a7a62';
      ctx.beginPath();
      ctx.arc(px + pw / 2, py + ph / 2, Math.max(1, u * 0.9), 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawColossalTorso(ctx, x, shoulderY, hipY, shoulderW, h, time) {
  const u = h / 100;
  // Exposed ribs: pale bone arcs across the chest.
  ctx.strokeStyle = 'rgba(232,220,200,0.85)';
  ctx.lineWidth = Math.max(1.5, u * 1.6);
  for (let i = 0; i < 4; i++) {
    const ry = shoulderY + h * (0.10 + i * 0.07);
    ctx.beginPath();
    ctx.arc(x, ry, shoulderW * (0.72 - i * 0.06), 0.35, Math.PI - 0.35);
    ctx.stroke();
  }
  // Spine hint down the centre.
  ctx.strokeStyle = 'rgba(232,220,200,0.55)';
  ctx.lineWidth = Math.max(1, u * 1.2);
  ctx.beginPath();
  ctx.moveTo(x, shoulderY + h * 0.08);
  ctx.lineTo(x, hipY - h * 0.02);
  ctx.stroke();
  // Muscle striations: many curved fibre lines.
  ctx.strokeStyle = 'rgba(120,15,8,0.5)';
  ctx.lineWidth = Math.max(0.8, u * 0.9);
  for (let i = 0; i < 7; i++) {
    const fy = shoulderY + h * (0.06 + i * 0.045);
    const side = i % 2 === 0 ? -1 : 1;
    ctx.beginPath();
    ctx.moveTo(x + side * h * 0.02, fy);
    ctx.quadraticCurveTo(x + side * h * 0.10, fy + h * 0.02, x + side * h * 0.07, fy + h * 0.045);
    ctx.stroke();
  }
  // Glowing ember cracks.
  const ember = 0.55 + 0.35 * Math.sin(time * 2.4);
  ctx.strokeStyle = `rgba(255,${Math.round(90 + 60 * ember)},20,${ember.toFixed(3)})`;
  ctx.lineWidth = Math.max(1, u * 1.3);
  const cracks = [
    [[-0.06, 0.10], [-0.02, 0.16], [-0.07, 0.22]],
    [[0.08, 0.14], [0.04, 0.20], [0.09, 0.26]],
    [[-0.03, 0.24], [0.01, 0.30], [-0.04, 0.35]],
  ];
  for (const pts of cracks) {
    ctx.beginPath();
    ctx.moveTo(x + pts[0][0] * h, shoulderY + pts[0][1] * h);
    ctx.lineTo(x + pts[1][0] * h, shoulderY + pts[1][1] * h);
    ctx.lineTo(x + pts[2][0] * h, shoulderY + pts[2][1] * h);
    ctx.stroke();
  }
}

function drawFur(ctx, x, shoulderY, hipY, shoulderW, h, furA, furB) {
  const u = h / 100;
  // Shaggy fur clumps: overlapping arcs over torso and shoulders.
  ctx.fillStyle = furA;
  const rows = 5;
  for (let r = 0; r < rows; r++) {
    const fy = shoulderY + h * 0.02 + (r * (hipY - shoulderY)) / rows;
    const fw = shoulderW * (1.05 - r * 0.04);
    for (let i = -2; i <= 2; i++) {
      const fx = x + (i * fw) / 2.4 + ((r % 2) - 0.5) * fw * 0.14;
      ctx.beginPath();
      ctx.arc(fx, fy, h * 0.035, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = (i + r) % 2 === 0 ? furB : furA;
    }
  }
  // Shoulder tufts.
  ctx.fillStyle = furB;
  for (const sgn of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(x + sgn * shoulderW * 0.9, shoulderY + h * 0.03, h * 0.045, Math.PI * 0.9, Math.PI * 2.1);
    ctx.fill();
  }
}

// ------------------------------------------------------------ titan head ----
function drawTitanHead(ctx, kind, cx, cy, hr, skin, dark, light, deform, time, h) {
  const u = h / 100;
  const wide = kind === 'pure' ? 1.12 : kind === 'colossal' ? 0.92 : 1.0;
  const tall = kind === 'pure' ? 1.05 : 1.0;

  // Skull / face base.
  if (kind === 'colossal') {
    // Skinless red muscle skull with cracks.
    const cg = ctx.createRadialGradient(cx - hr * 0.3, cy - hr * 0.4, hr * 0.1, cx, cy, hr * 1.5);
    cg.addColorStop(0, '#d84a35');
    cg.addColorStop(0.6, '#c0392b');
    cg.addColorStop(1, '#7e1d10');
    ctx.fillStyle = cg;
  } else if (kind === 'armored') {
    ctx.fillStyle = skinGrad(ctx, cx, cy, hr, skin);
  } else {
    ctx.fillStyle = skinGrad(ctx, cx, cy, hr, skin);
  }
  ctx.beginPath();
  ctx.ellipse(cx, cy, hr * wide, hr * tall, 0, 0, Math.PI * 2);
  ctx.fill();

  // Beast: heavy brow ridge + muzzle + fur fringe.
  if (kind === 'beast') {
    ctx.fillStyle = '#6a4a30';
    ctx.beginPath();
    ctx.ellipse(cx, cy - hr * 0.55, hr * 1.05, hr * 0.42, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#a8845e';
    ctx.beginPath();
    ctx.ellipse(cx, cy + hr * 0.42, hr * 0.62, hr * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Armored: face plates.
  if (kind === 'armored') {
    ctx.strokeStyle = '#8a7a62';
    ctx.lineWidth = Math.max(1, u * 1.3);
    ctx.beginPath();
    ctx.moveTo(cx - hr * 0.9, cy - hr * 0.1);
    ctx.lineTo(cx + hr * 0.9, cy - hr * 0.1);
    ctx.moveTo(cx - hr * 0.7, cy + hr * 0.45);
    ctx.lineTo(cx + hr * 0.7, cy + hr * 0.45);
    ctx.stroke();
    ctx.fillStyle = '#8a7a62';
    for (const sgn of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(cx + sgn * hr * 0.45, cy - hr * 0.45, Math.max(1, u * 0.9), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // Colossal: cracked skull + ember cracks.
  if (kind === 'colossal') {
    ctx.strokeStyle = 'rgba(90,10,5,0.7)';
    ctx.lineWidth = Math.max(1, u * 1.2);
    ctx.beginPath();
    ctx.moveTo(cx - hr * 0.5, cy - hr * 0.7);
    ctx.lineTo(cx - hr * 0.1, cy - hr * 0.3);
    ctx.lineTo(cx - hr * 0.45, cy + hr * 0.1);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + hr * 0.55, cy - hr * 0.6);
    ctx.lineTo(cx + hr * 0.2, cy - hr * 0.2);
    ctx.lineTo(cx + hr * 0.5, cy + hr * 0.2);
    ctx.stroke();
    const ember = 0.55 + 0.35 * Math.sin(time * 2.4 + 1);
    ctx.strokeStyle = `rgba(255,120,30,${ember.toFixed(3)})`;
    ctx.lineWidth = Math.max(0.8, u * 1.0);
    ctx.beginPath();
    ctx.moveTo(cx - hr * 0.3, cy - hr * 0.5);
    ctx.lineTo(cx - hr * 0.1, cy - hr * 0.25);
    ctx.stroke();
  }

  // ---- eyes: sunken, vacant, tiny pupils ----
  const eyeDX = hr * 0.42;
  const eyeY = cy - hr * 0.12;
  const eyeW = hr * (kind === 'female' ? 0.42 : 0.36);
  const eyeH = hr * (kind === 'female' ? 0.30 : 0.24);
  for (const sgn of [-1, 1]) {
    const ex = cx + sgn * eyeDX;
    // Sunken socket shadow.
    ctx.fillStyle = 'rgba(40,18,8,0.55)';
    ctx.beginPath();
    ctx.ellipse(ex, eyeY, eyeW * 0.75, eyeH * 0.95, 0, 0, Math.PI * 2);
    ctx.fill();
    if (kind === 'female') {
      // Narrowed, lidded eyes with lashes.
      ctx.fillStyle = '#fdfdf8';
      ctx.beginPath();
      ctx.ellipse(ex, eyeY, eyeW * 0.55, eyeH * 0.62, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3a5a8a';
      ctx.beginPath();
      ctx.ellipse(ex, eyeY, eyeW * 0.22, eyeH * 0.34, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#14100c';
      ctx.beginPath();
      ctx.ellipse(ex, eyeY, eyeW * 0.10, eyeH * 0.18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#1c1410';
      ctx.lineWidth = Math.max(1, u * 1.1);
      ctx.beginPath();
      ctx.moveTo(ex - eyeW * 0.55, eyeY - eyeH * 0.35);
      ctx.quadraticCurveTo(ex, eyeY - eyeH * 0.75, ex + eyeW * 0.55, eyeY - eyeH * 0.3);
      ctx.stroke();
    } else if (kind === 'colossal') {
      // Glowing ember eyes.
      const eg = 0.6 + 0.3 * Math.sin(time * 3 + sgn);
      ctx.fillStyle = `rgba(255,${Math.round(120 + 60 * eg)},30,0.95)`;
      ctx.beginPath();
      ctx.ellipse(ex, eyeY, eyeW * 0.28, eyeH * 0.32, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1a0500';
      ctx.beginPath();
      ctx.ellipse(ex, eyeY, eyeW * 0.10, eyeH * 0.16, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Vacant: mostly white with a tiny dark pupil, slightly crossed.
      ctx.fillStyle = '#f4ede2';
      ctx.beginPath();
      ctx.ellipse(ex, eyeY, eyeW * 0.55, eyeH * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#241608';
      ctx.beginPath();
      ctx.ellipse(ex + sgn * eyeW * 0.06, eyeY + eyeH * 0.08, eyeW * 0.13, eyeH * 0.20, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // Heavy brow shadow above the eyes.
  ctx.fillStyle = 'rgba(50,25,10,0.35)';
  ctx.beginPath();
  ctx.ellipse(cx, eyeY - eyeH * 0.95, hr * 0.95, hr * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(50,25,10,0.5)';
  ctx.lineWidth = Math.max(1, u * 1.2);
  ctx.beginPath();
  ctx.moveTo(cx - hr * 0.85, eyeY - eyeH * 0.75);
  ctx.quadraticCurveTo(cx, eyeY - eyeH * 1.15, cx + hr * 0.85, eyeY - eyeH * 0.75);
  ctx.stroke();

  // ---- nose: two small nostril shadows ----
  ctx.fillStyle = 'rgba(60,30,15,0.4)';
  ellipse(ctx, cx - hr * 0.10, cy + hr * 0.28, hr * 0.05, hr * 0.035);
  ellipse(ctx, cx + hr * 0.10, cy + hr * 0.28, hr * 0.05, hr * 0.035);

  // ---- grin: wide, crooked, square teeth + gum line ----
  const grinY = cy + hr * (kind === 'beast' ? 0.42 : 0.52);
  const grinW = hr * (kind === 'pure' ? 1.35 : kind === 'female' ? 0.85 : 1.05);
  const grinH = hr * (kind === 'pure' ? 0.42 : 0.30);
  // Mouth cavity.
  ctx.fillStyle = '#4a1408';
  ctx.beginPath();
  ctx.ellipse(cx, grinY, grinW / 2, grinH / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  // Gum line.
  ctx.fillStyle = '#b05a50';
  ctx.beginPath();
  ctx.ellipse(cx, grinY - grinH * 0.28, grinW * 0.46, grinH * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();
  // Individual square teeth (top row, slightly crooked by deform).
  const teeth = kind === 'pure' ? 7 : 5;
  const toothW = grinW * 0.82 / teeth;
  for (let i = 0; i < teeth; i++) {
    const tx = cx - (grinW * 0.82) / 2 + toothW * (i + 0.5);
    const crooked = ((i * 7 + Math.round(deform * 10)) % 3 - 1) * hr * 0.03;
    ctx.fillStyle = '#f2ead8';
    ctx.fillRect(tx - toothW * 0.42, grinY - grinH * 0.42 + crooked, toothW * 0.84, grinH * 0.42);
    ctx.strokeStyle = 'rgba(60,30,15,0.6)';
    ctx.lineWidth = Math.max(0.6, u * 0.7);
    ctx.strokeRect(tx - toothW * 0.42, grinY - grinH * 0.42 + crooked, toothW * 0.84, grinH * 0.42);
  }
  // Bottom teeth hints.
  ctx.fillStyle = 'rgba(242,234,216,0.85)';
  for (let i = 0; i < teeth - 2; i++) {
    const tx = cx - (grinW * 0.7) / 2 + (grinW * 0.7 / (teeth - 2)) * (i + 0.5);
    ctx.fillRect(tx - toothW * 0.3, grinY + grinH * 0.18, toothW * 0.6, grinH * 0.22);
  }
  // Beast fangs.
  if (kind === 'beast') {
    ctx.fillStyle = '#f2ead8';
    for (const sgn of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(cx + sgn * grinW * 0.32, grinY - grinH * 0.40);
      ctx.lineTo(cx + sgn * grinW * 0.24, grinY + grinH * 0.10);
      ctx.lineTo(cx + sgn * grinW * 0.40, grinY - grinH * 0.30);
      ctx.closePath();
      ctx.fill();
    }
  }
  // Female: long blond hair framing the face.
  if (kind === 'female') {
    ctx.fillStyle = '#e8c86a';
    ctx.beginPath();
    ctx.moveTo(cx - hr * 1.0, cy - hr * 0.5);
    ctx.quadraticCurveTo(cx - hr * 1.05, cy + hr * 0.9, cx - hr * 0.75, cy + hr * 1.15);
    ctx.lineTo(cx - hr * 0.55, cy + hr * 0.9);
    ctx.quadraticCurveTo(cx - hr * 0.7, cy, cx - hr * 0.62, cy - hr * 0.55);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + hr * 1.0, cy - hr * 0.5);
    ctx.quadraticCurveTo(cx + hr * 1.05, cy + hr * 0.9, cx + hr * 0.75, cy + hr * 1.15);
    ctx.lineTo(cx + hr * 0.55, cy + hr * 0.9);
    ctx.quadraticCurveTo(cx + hr * 0.7, cy, cx + hr * 0.62, cy - hr * 0.55);
    ctx.closePath();
    ctx.fill();
    // Bangs across the forehead.
    ctx.beginPath();
    ctx.moveTo(cx - hr * 0.85, cy - hr * 0.55);
    ctx.quadraticCurveTo(cx, cy - hr * 1.0, cx + hr * 0.85, cy - hr * 0.55);
    ctx.lineTo(cx + hr * 0.7, cy - hr * 0.15);
    ctx.quadraticCurveTo(cx + hr * 0.3, cy - hr * 0.42, cx, cy - hr * 0.42);
    ctx.quadraticCurveTo(cx - hr * 0.3, cy - hr * 0.42, cx - hr * 0.7, cy - hr * 0.15);
    ctx.closePath();
    ctx.fill();
  }
  // Skin shading on the cheeks + jaw.
  ctx.fillStyle = 'rgba(90,40,20,0.16)';
  ctx.beginPath();
  ctx.ellipse(cx - hr * 0.72, cy + hr * 0.35, hr * 0.22, hr * 0.34, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + hr * 0.72, cy + hr * 0.35, hr * 0.22, hr * 0.34, 0, 0, Math.PI * 2);
  ctx.fill();
}
