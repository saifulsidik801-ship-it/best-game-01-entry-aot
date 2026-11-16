// Everything the player sees: Aurelia at dusk under Wall Aegis, the Ravagers, the
// swinging soldier, the HUD, and every screen — title with the four hero portraits,
// pause, game over and victory. Canvas 2D only, no images, no network.
import { ANCHORS, BUILDINGS, GROUND_Y, HEROES, SQUAD, VIEW, WALL_X } from './config.js';
import { drawHeroPortrait, drawHeroSprite, heroById, squadById } from './characters.js';
import { drawSteam, drawRavager, napePosition } from './ravagers.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';
export const SCREEN_VICTORY = 'victory';

const SKY_TOP = '#2a1a3a';
const SKY_MID = '#c65a2e';
const SKY_LOW = '#e8a04c';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawBackground(ctx, time) {
  // Dusk sky.
  const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  sky.addColorStop(0, SKY_TOP);
  sky.addColorStop(0.55, SKY_MID);
  sky.addColorStop(1, SKY_LOW);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VIEW.width, GROUND_Y + 4);
  // Low sun.
  ctx.fillStyle = '#ffd9a0';
  ctx.beginPath(); ctx.arc(1010, 300, 46, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,200,130,0.35)';
  ctx.beginPath(); ctx.arc(1010, 300, 80, 0, Math.PI * 2); ctx.fill();
  // Drifting clouds.
  ctx.fillStyle = 'rgba(40,25,45,0.5)';
  for (let i = 0; i < 4; i += 1) {
    const cx = ((i * 340 + time * 12) % 1500) - 120;
    const cy = 90 + i * 42;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 90, 18, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 50, cy + 8, 60, 14, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Distant outer wall on the horizon.
  ctx.fillStyle = '#5a4a58';
  ctx.fillRect(0, 470, VIEW.width, 26);
  ctx.fillStyle = '#6a5568';
  for (let x = 40; x < VIEW.width; x += 90) ctx.fillRect(x, 452, 34, 44);
  // Aurelia rooftops.
  for (const b of BUILDINGS) {
    ctx.fillStyle = '#3a2c28';
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.fillStyle = b.roof;
    ctx.beginPath();
    ctx.moveTo(b.x - 8, b.y);
    ctx.lineTo(b.x + b.w / 2, b.y - 34);
    ctx.lineTo(b.x + b.w + 8, b.y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,220,150,0.75)';
    for (let wy = b.y + 22; wy < b.y + b.h - 20; wy += 44) {
      for (let wx = b.x + 18; wx < b.x + b.w - 18; wx += 44) {
        ctx.fillRect(wx, wy, 12, 16);
      }
    }
  }
  // Wall Aegis, the 50 m ring wall on the left.
  ctx.fillStyle = '#9a8a72';
  ctx.fillRect(0, 130, WALL_X, GROUND_Y - 130);
  ctx.fillStyle = '#8a7a62';
  for (let y = 150; y < GROUND_Y; y += 34) {
    for (let x = (y % 68 === 0 ? 0 : 18); x < WALL_X; x += 36) {
      ctx.fillRect(x, y, 30, 3);
    }
  }
  ctx.fillStyle = '#7a6a52';
  ctx.fillRect(0, 130, WALL_X, 14);
  // Wings of Dawn banner on the Wall.
  ctx.fillStyle = '#2e5d33';
  ctx.fillRect(28, 150, 40, 64);
  ctx.strokeStyle = '#d8c98a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(48, 168);
  ctx.quadraticCurveTo(38, 186, 34, 200);
  ctx.moveTo(48, 168);
  ctx.quadraticCurveTo(58, 186, 62, 200);
  ctx.stroke();
  // Cobblestone street.
  ctx.fillStyle = '#4a3a30';
  ctx.fillRect(0, GROUND_Y, VIEW.width, VIEW.height - GROUND_Y);
  ctx.fillStyle = '#5a483c';
  for (let y = GROUND_Y + 12; y < VIEW.height; y += 22) {
    for (let x = (y % 44 === 0 ? 0 : 16); x < VIEW.width; x += 34) {
      ctx.fillRect(x, y, 26, 4);
    }
  }
}

function drawAnchors(ctx) {
  for (const a of ANCHORS) {
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath(); ctx.arc(a.x, a.y, 4, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(a.x, a.y, 8, 0, Math.PI * 2); ctx.stroke();
  }
}

function drawCable(ctx, player) {
  if (!player.grapple) return;
  ctx.strokeStyle = '#d8d8d8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(player.x, player.y - 10);
  ctx.lineTo(player.grapple.ax, player.grapple.ay);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(216,216,216,0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(player.x + 6, player.y - 4);
  ctx.lineTo(player.grapple.ax + 4, player.grapple.ay + 4);
  ctx.stroke();
}

function drawRavagers(ctx, state) {
  for (const t of state.ravagers) {
    drawRavager(ctx, t, state.time);
    if (t.kind === 'colossus') {
      drawSteam(ctx, t.x, t.feetY - t.height * 0.7, t.height * 0.16, state.time, t.deform * 10);
      drawSteam(ctx, t.x - t.height * 0.08, t.feetY - t.height * 0.4, t.height * 0.12, state.time, t.deform * 20);
    }
    // Nape marker: a red chevron over the weak point when the player is close.
    const p = state.player;
    const nape = napePosition(t);
    if (Math.hypot(p.x - nape.x, p.y - nape.y) < 320) {
      const bob = Math.sin(state.time * 5) * 4;
      ctx.fillStyle = '#ff2a1a';
      ctx.font = 'bold 13px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('▼ NAPE', nape.x, nape.y - nape.r - 14 + bob);
    }
    // Boss health bar above a boss Ravager.
    if (state.boss === t) {
      const w = 130;
      const x = t.x - w / 2;
      const y = t.feetY - t.height - 34;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(x - 2, y - 2, w + 4, 12);
      ctx.fillStyle = '#c0392b';
      ctx.fillRect(x, y, w * (t.hitsLeft / t.maxHits), 8);
    }
  }
}

function drawParticles(ctx, state) {
  for (const pt of state.particles) {
    ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
    ctx.fillStyle = pt.color;
    ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'center';
  for (const tx of state.texts) {
    ctx.globalAlpha = Math.min(1, tx.life);
    ctx.fillStyle = tx.color;
    ctx.font = 'bold 20px Arial, sans-serif';
    ctx.fillText(tx.text, tx.x, tx.y);
  }
  ctx.globalAlpha = 1;
}

function drawMakefunBadge(ctx, x, y) {
  ctx.save();
  ctx.fillStyle = 'rgba(20,12,20,0.72)';
  roundRect(ctx, x, y, 118, 30, 15);
  ctx.fill();
  ctx.fillStyle = '#7ef0c1';
  ctx.beginPath(); ctx.arc(x + 18, y + 15, 7, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#14100c';
  ctx.font = 'bold 11px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('▶', x + 18, y + 19);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('make.fun', x + 32, y + 20);
  ctx.restore();
}

function drawHud(ctx, state, best) {
  // Top bar.
  ctx.fillStyle = 'rgba(15,10,15,0.62)';
  ctx.fillRect(0, 0, VIEW.width, 64);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px Arial, sans-serif';
  ctx.fillText(`SCORE ${state.score}`, 18, 30);
  ctx.fillStyle = '#ffd76a';
  ctx.font = 'bold 17px Arial, sans-serif';
  ctx.fillText(`BEST ${Math.max(best, state.score)}`, 18, 54);
  if (state.combo >= 2) {
    ctx.fillStyle = '#ff6a3a';
    ctx.font = 'bold 22px Arial, sans-serif';
    ctx.fillText(`COMBO x${state.combo}`, 400, 32);
  }
  // Wave centre.
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px Arial, sans-serif';
  const remaining = state.ravagers.length + state.spawnList.length;
  ctx.fillText(state.waveState === 'between' ? `WAVE ${state.wave + 1} INCOMING` : `WAVE ${state.wave} / 10`, 640, 28);
  ctx.fillStyle = '#ffb0a0';
  ctx.font = 'bold 15px Arial, sans-serif';
  ctx.fillText(state.waveState === 'between' ? 'Get ready — hook an anchor!' : `${remaining} Ravager${remaining === 1 ? '' : 's'} left`, 640, 52);
  // Lives as blades.
  for (let i = 0; i < state.lives; i += 1) {
    ctx.strokeStyle = '#dfe6ea';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(300 + i * 26, 46); ctx.lineTo(314 + i * 26, 22); ctx.stroke();
  }
  // Wall integrity bar.
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px Arial, sans-serif';
  ctx.fillText('WALL AEGIS', 1120, 16);
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(1120, 22, 140, 12);
  ctx.fillStyle = state.wallHP > 40 ? '#7ec850' : '#ff3a2a';
  ctx.fillRect(1120, 22, 140 * (state.wallHP / 100), 12);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px Arial, sans-serif';
  ctx.fillText(`${Math.ceil(state.wallHP)}%`, 1120, 48);
  drawMakefunBadge(ctx, 976, 66);
  // Radio chatter.
  if (state.chatter) {
    ctx.fillStyle = 'rgba(15,10,15,0.6)';
    roundRect(ctx, 16, VIEW.height - 64, 560, 30, 8);
    ctx.fill();
    ctx.fillStyle = '#cfe8ff';
    ctx.font = '15px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`📻 ${state.chatter}`, 28, VIEW.height - 44);
  }
  // Controls hint.
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = '13px Arial, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('HOLD MOUSE: SKYHOOK GRAPPLE  •  SPACE: SLASH THE NAPE  •  A/D: MOVE  •  W: JUMP  •  P: PAUSE  •  M: MUTE', VIEW.width - 16, VIEW.height - 14);
  // Wave banner.
  if (state.bannerTimer > 0 && state.banner) {
    const a = Math.min(1, state.bannerTimer);
    ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(15,10,15,0.55)';
    ctx.fillRect(0, 250, VIEW.width, 64);
    ctx.fillStyle = '#ffd76a';
    ctx.font = 'bold 34px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(state.banner, 640, 294);
    ctx.globalAlpha = 1;
  }
}

function drawTitle(ctx, state, best, selectedHero) {
  // A Colossus looms behind the title, half in the dusk haze.
  ctx.save();
  ctx.globalAlpha = 0.4;
  drawRavager(ctx, { kind: 'colossus', x: 1130, feetY: GROUND_Y, height: 560, skin: '#c0392b', deform: 0.5, walkPhase: 0.6, flash: 0, grabT: 0 }, state.time);
  ctx.restore();
  ctx.fillStyle = 'rgba(15,8,12,0.45)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  drawMakefunBadge(ctx, VIEW.width - 140, 18);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ff3a2a';
  ctx.font = 'bold 15px Arial, sans-serif';
  ctx.fillText('A U R E L I A   •   W A L L   A E G I S', 640, 62);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 64px Arial, sans-serif';
  ctx.fillText('SKYFALL SLAYERS', 640, 122);
  ctx.fillStyle = '#ffd76a';
  ctx.font = 'bold 26px Arial, sans-serif';
  ctx.fillText('— SKYHOOK ARCADE —', 640, 158);
  ctx.fillStyle = '#e8e0d0';
  ctx.font = '17px Arial, sans-serif';
  ctx.fillText('Swing with your skyhook gear. Slash the glowing nape. Hold Wall Aegis.', 640, 188);

  // Hero select cards.
  const cardW = TITLE_CARDS.cardW;
  const gap = TITLE_CARDS.gap;
  const totalW = HEROES.length * cardW + (HEROES.length - 1) * gap;
  const startX = (VIEW.width - totalW) / 2;
  HEROES.forEach((hero, i) => {
    const x = startX + i * (cardW + gap);
    const y = TITLE_CARDS.y;
    const selected = hero.id === selectedHero;
    ctx.fillStyle = selected ? 'rgba(192,57,43,0.35)' : 'rgba(15,10,15,0.62)';
    roundRect(ctx, x, y, cardW, TITLE_CARDS.h, 12);
    ctx.fill();
    ctx.strokeStyle = selected ? '#ff3a2a' : 'rgba(255,255,255,0.25)';
    ctx.lineWidth = selected ? 3 : 1.5;
    roundRect(ctx, x, y, cardW, TITLE_CARDS.h, 12);
    ctx.stroke();
    drawHeroPortrait(ctx, hero, x + cardW / 2, y + 58, 38);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Arial, sans-serif';
    ctx.fillText(hero.name, x + cardW / 2, y + 168);
    ctx.fillStyle = '#ffd76a';
    ctx.font = 'italic 13px Arial, sans-serif';
    ctx.fillText(hero.title, x + cardW / 2, y + 188);
    // Key hint in the card's top-right corner, clear of the description.
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.font = 'bold 13px Arial, sans-serif';
    ctx.fillText(`[${i + 1}]`, x + cardW - 20, y + 24);
    // Description wrapped to two lines.
    ctx.fillStyle = '#d8d0c0';
    ctx.font = '12px Arial, sans-serif';
    const words = hero.desc.split(' ');
    const lines = [''];
    for (const w of words) {
      const last = lines[lines.length - 1];
      if ((last + ' ' + w).trim().length > 32 && last !== '') lines.push(w);
      else lines[lines.length - 1] = last ? `${last} ${w}` : w;
    }
    ctx.fillText(lines[0] ?? '', x + cardW / 2, y + 208);
    if (lines[1]) ctx.fillText(lines[1], x + cardW / 2, y + 224);
  });

  // Squad strip: the rest of the Corps.
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px Arial, sans-serif';
  ctx.fillText('— YOUR SQUAD —', 640, 492);
  SQUAD.forEach((member, i) => {
    const cx = 640 + (i - 2) * 150;
    drawHeroPortrait(ctx, squadById(member.id), cx, 528, 24);
    ctx.fillStyle = '#e8e0d0';
    ctx.font = 'bold 13px Arial, sans-serif';
    ctx.fillText(member.name, cx, 606);
  });

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px Arial, sans-serif';
  const blink = 0.6 + 0.4 * Math.sin(state.time * 4);
  ctx.globalAlpha = blink;
  ctx.fillText('CLICK OR PRESS SPACE TO START', 640, 648);
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#c8c0b0';
  ctx.font = '14px Arial, sans-serif';
  ctx.fillText('HOLD MOUSE to grapple  •  SPACE to slash the nape  •  A/D to move  •  W to jump  •  1-4 to pick your soldier', 640, 676);
  if (best > 0) {
    ctx.fillStyle = '#ffd76a';
    ctx.font = 'bold 15px Arial, sans-serif';
    ctx.fillText(`BEST SCORE: ${best}`, 640, 700);
  }
}

function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(10,6,10,0.66)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 52px Arial, sans-serif';
  ctx.fillText('PAUSED', 640, 330);
  ctx.fillStyle = '#d8d0c0';
  ctx.font = '18px Arial, sans-serif';
  ctx.fillText('Press P or Space to keep fighting. The Ravagers wait for no one.', 640, 372);
}

function drawEndScreen(ctx, state, best, victory) {
  ctx.fillStyle = victory ? 'rgba(20,50,25,0.72)' : 'rgba(40,8,8,0.72)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.textAlign = 'center';
  if (victory) {
    ctx.fillStyle = '#ffd76a';
    ctx.font = 'bold 56px Arial, sans-serif';
    ctx.fillText('WALL AEGIS STANDS!', 640, 250);
    ctx.fillStyle = '#ffffff';
    ctx.font = '22px Arial, sans-serif';
    ctx.fillText('Every Ravager slain — even the Colossus. Aurelia fights another day.', 640, 296);
  } else {
    ctx.fillStyle = '#ff3a2a';
    ctx.font = 'bold 56px Arial, sans-serif';
    ctx.fillText(state.wallHP <= 0 ? 'THE WALL HAS FALLEN' : 'YOU WERE EATEN', 640, 250);
    ctx.fillStyle = '#ffffff';
    ctx.font = '22px Arial, sans-serif';
    ctx.fillText(state.wallHP <= 0 ? 'The Ravagers pour through the breach...' : 'A Ravager got its hands on you. The Corps will avenge you.', 640, 296);
  }
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 30px Arial, sans-serif';
  ctx.fillText(`SCORE ${state.score}   •   BEST ${Math.max(best, state.score)}`, 640, 360);
  ctx.fillStyle = '#d8d0c0';
  ctx.font = '19px Arial, sans-serif';
  ctx.fillText(`Ravagers slain: ${state.kills}   •   Waves cleared: ${state.wave}   •   Slashes: ${state.slashes}`, 640, 400);
  ctx.fillStyle = '#ffd76a';
  ctx.font = 'bold 20px Arial, sans-serif';
  const blink = 0.6 + 0.4 * Math.sin(state.time * 4);
  ctx.globalAlpha = blink;
  ctx.fillText('PRESS SPACE OR CLICK TO FIGHT AGAIN', 640, 470);
  ctx.globalAlpha = 1;
}

/** Title-screen hero card layout, shared by the painter and the click picker. */
export const TITLE_CARDS = { cardW: 250, gap: 24, y: 214, h: 236 };

/** Hero id whose title card holds (x, y), or null. */
export function heroCardAt(x, y) {
  const totalW = HEROES.length * TITLE_CARDS.cardW + (HEROES.length - 1) * TITLE_CARDS.gap;
  const startX = (VIEW.width - totalW) / 2;
  if (y < TITLE_CARDS.y || y > TITLE_CARDS.y + TITLE_CARDS.h) return null;
  for (let i = 0; i < HEROES.length; i += 1) {
    const cx = startX + i * (TITLE_CARDS.cardW + TITLE_CARDS.gap);
    if (x >= cx && x <= cx + TITLE_CARDS.cardW) return HEROES[i].id;
  }
  return null;
}

export function createPainter(canvas) {
  canvas.width = VIEW.width;
  canvas.height = VIEW.height;
  const ctx = canvas.getContext('2d');
  return {
    draw(state, screen, best, selectedHero) {
      ctx.save();
      if (state.shake > 0) {
        const s = state.shake * 14;
        ctx.translate((Math.random() - 0.5) * s, (Math.random() - 0.5) * s);
      }
      drawBackground(ctx, state.time);
      if (screen === SCREEN_TITLE) {
        drawTitle(ctx, state, best, selectedHero);
        ctx.restore();
        return;
      }
      drawAnchors(ctx);
      drawRavagers(ctx, state);
      drawCable(ctx, state.player);
      const p = state.player;
      if (p.invuln <= 0 || Math.floor(state.time * 12) % 2 === 0) {
        drawHeroSprite(ctx, state.hero, p.x, p.y, p.facing, p.slashT, !!p.grapple);
      }
      drawParticles(ctx, state);
      // The HUD (and its wave banner) only belongs to live play and pause; the end
      // screens carry their own text and must not fight it.
      if (screen === SCREEN_PLAY || screen === SCREEN_PAUSED) drawHud(ctx, state, best);
      if (screen === SCREEN_PAUSED) drawPaused(ctx);
      if (screen === SCREEN_OVER) drawEndScreen(ctx, state, best, false);
      if (screen === SCREEN_VICTORY) drawEndScreen(ctx, state, best, true);
      ctx.restore();
    },
  };
}
