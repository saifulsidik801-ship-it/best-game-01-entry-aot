// The simulation: ODM-gear swinging, nape slashes, Titans marching on Wall Maria,
// waves that escalate to the four shifter bosses, and the win/lose loop. One metre
// is 6.4 px, so the 60 m Colossal towers 384 px over Shiganshina's rooftops.
import {
  ANCHORS, GRAVITY, GROUND_Y, MAX_LIVES, STEP, TITAN_KINDS, BOSS_WAVES, VICTORY_WAVE,
  VIEW, WALL_X, HEROES,
} from './config.js';
import { napePosition } from './titans.js';

export const EVENT_HIT = 1;
export const EVENT_KILL = 2;
export const EVENT_OVER = 4;
export const EVENT_WAVE_CLEAR = 8;
export const EVENT_VICTORY = 16;
export const EVENT_WALL_HIT = 32;
export const EVENT_GRAB = 64;
export const EVENT_SLASH = 128;
export const EVENT_SPARK = 256;

const METER = 6.4;
const SLASH_RANGE = 88;
const COMBO_WINDOW = 3;

function makeTitan(random, kind, x) {
  const def = TITAN_KINDS[kind];
  const height = def.meters * METER * random.range(0.92, 1.08);
  const skins = ['#e8c39a', '#d9a87e', '#c99a72', '#e0b48e'];
  return {
    kind, x, feetY: GROUND_Y, height,
    skin: kind === 'colossal' ? '#c0392b' : random.pick(skins),
    deform: random.next(),
    walkPhase: random.range(0, Math.PI * 2),
    speed: def.speed * random.range(0.9, 1.15),
    hitsLeft: def.hits,
    maxHits: def.hits,
    flash: 0,
    grabT: 0,
    grabCooldown: random.range(1, 3),
    attackT: 0,
    dead: false,
  };
}

export function createWorld(random, hero) {
  const state = {
    hero: hero || HEROES[0],
    player: null,
    titans: [],
    particles: [],
    texts: [],
    wave: 0,
    spawnList: [],
    spawnTimer: 0,
    waveState: 'between',
    betweenTimer: 2.5,
    wallHP: 100,
    score: 0,
    combo: 0,
    comboTimer: 0,
    kills: 0,
    lives: MAX_LIVES,
    time: 0,
    shake: 0,
    boss: null,
    chatter: '',
    chatterTimer: 0,
    over: false,
    victory: false,
    slashes: 0,
    banner: '',
    bannerTimer: 0,
  };

  function resetPlayer() {
    state.player = {
      x: 420, y: GROUND_Y - 30, vx: 0, vy: 0,
      facing: 1, grounded: true, grapple: null,
      slashT: 0, slashCooldown: 0, invuln: 0,
    };
  }

  function burst(x, y, color, count, speed) {
    for (let i = 0; i < count; i += 1) {
      const a = random.range(0, Math.PI * 2);
      const v = random.range(speed * 0.3, speed);
      state.particles.push({
        x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60,
        life: random.range(0.4, 0.9), maxLife: 0.9, color, size: random.range(2, 6),
      });
    }
  }

  function addText(x, y, text, color) {
    state.texts.push({ x, y, text, color: color || '#ffd76a', life: 1.1 });
  }

  function startWave(n) {
    state.wave = n;
    state.waveState = 'fighting';
    state.spawnList = [];
    const count = 2 + n;
    for (let i = 0; i < count; i += 1) {
      state.spawnList.push(random.next() < 0.3 ? 'tall' : 'pure');
    }
    const bossKind = BOSS_WAVES[n];
    if (bossKind) state.spawnList.push(bossKind);
    state.spawnTimer = 0.8;
    state.banner = bossKind
      ? `${TITAN_KINDS[bossKind].name} APPROACHES!`
      : `WAVE ${n} — TITANS INBOUND`;
    state.bannerTimer = 2.2;
    state.chatter = n === 1
      ? 'Erwin: Soldiers! Give your hearts! Hold the Wall!'
      : pickChatter();
    state.chatterTimer = 5;
  }

  function pickChatter() {
    const lines = [
      'Sasha: Potato break after this one!',
      'Connie: I\u2019m right behind you!',
      'Jean: Keep formation! Don\u2019t be reckless!',
      'Hange: Fascinating! Its nape is exposed!',
      'Erwin: Advance! For humanity!',
      'Mikasa: Eren, I\u2019ve got your back.',
      'Levi: Tsk. Don\u2019t die, brats.',
      'Armin: Aim for the nape — one metre down, one across!',
    ];
    return random.pick(lines);
  }

  function killTitan(titan, index) {
    titan.dead = true;
    state.titans.splice(index, 1);
    state.kills += 1;
    state.combo += 1;
    state.comboTimer = COMBO_WINDOW;
    const base = TITAN_KINDS[titan.kind].score;
    const gained = base + state.combo * 10;
    state.score += gained;
    const nape = napePosition(titan);
    burst(nape.x, nape.y, '#c0392b', 22, 260);
    burst(titan.x, titan.feetY - titan.height * 0.4, '#e8e0d0', 12, 140);
    addText(titan.x, titan.feetY - titan.height - 10, `+${gained}`, '#ffd76a');
    if (state.combo >= 3) addText(titan.x, titan.feetY - titan.height - 34, `COMBO x${state.combo}!`, '#ff6a3a');
    if (titan.kind === 'colossal') burst(titan.x, titan.feetY - titan.height * 0.5, '#e8e0d0', 40, 320);
    if (state.boss === titan) state.boss = null;
  }

  function spawnNext() {
    const kind = state.spawnList.shift();
    const x = VIEW.width + random.range(0, 60);
    const titan = makeTitan(random, kind, x);
    state.titans.push(titan);
    if (BOSS_WAVES[state.wave] === kind) state.boss = titan;
  }

  function stepPlayer(dt, input) {
    const p = state.player;
    const hero = state.hero;
    p.slashCooldown = Math.max(0, p.slashCooldown - dt);
    p.invuln = Math.max(0, p.invuln - dt);
    if (p.slashT > 0) p.slashT = Math.max(0, p.slashT - dt / 0.35);

    // Run / steer.
    const accel = p.grounded ? 1500 : 900;
    const maxSpeed = 340 * hero.speed;
    p.vx += input.direction * accel * dt;
    if (input.direction === 0 && p.grounded) p.vx *= Math.max(0, 1 - 8 * dt);
    p.vx = Math.max(-maxSpeed, Math.min(maxSpeed, p.vx));
    if (input.direction !== 0) p.facing = input.direction;

    // Jump.
    if (input.jumpHeld && p.grounded) {
      p.vy = -640;
      p.grounded = false;
    }

    // ODM grapple: hold the mouse to hook the nearest anchor above.
    if (input.grapple && input.grapple.down && !p.grapple) {
      let best = null;
      let bestD = 560;
      for (const a of ANCHORS) {
        const dx = a.x - p.x;
        const dy = a.y - p.y;
        const d = Math.hypot(dx, dy);
        if (d < bestD && a.y < p.y + 60) { best = a; bestD = d; }
      }
      if (best) p.grapple = { ax: best.x, ay: best.y, len: bestD };
    }
    if (p.grapple && (!input.grapple || !input.grapple.down)) p.grapple = null;
    if (p.grapple) {
      // Reel in while swinging, faster with W held.
      p.grapple.len = Math.max(70, p.grapple.len - (input.jumpHeld ? 150 : 55) * dt);
      const dx = p.x - p.grapple.ax;
      const dy = p.y - p.grapple.ay;
      const dist = Math.hypot(dx, dy);
      if (dist > p.grapple.len) {
        const nx = dx / dist;
        const ny = dy / dist;
        p.x = p.grapple.ax + nx * p.grapple.len;
        p.y = p.grapple.ay + ny * p.grapple.len;
        // Kill the outward radial velocity: the cable holds, the swing keeps.
        const radial = p.vx * nx + p.vy * ny;
        if (radial > 0) { p.vx -= radial * nx; p.vy -= radial * ny; }
        // A tug along the cable when reeling.
        p.vx -= nx * 60 * dt;
        p.vy -= ny * 60 * dt;
      }
    }

    // Gravity and ground.
    p.vy += GRAVITY * dt * (p.grapple ? 0.55 : 1);
    p.vy = Math.min(p.vy, 900);
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.y >= GROUND_Y - 30) {
      p.y = GROUND_Y - 30;
      p.vy = 0;
      p.grounded = true;
    } else if (p.y < 30) {
      p.y = 30;
      p.vy = Math.max(0, p.vy);
    }
    if (p.x < WALL_X + 16) { p.x = WALL_X + 16; p.vx = Math.max(0, p.vx); }
    if (p.x > VIEW.width - 14) { p.x = VIEW.width - 14; p.vx = Math.min(0, p.vx); }

    // Slash.
    if (input.slash && p.slashCooldown <= 0) {
      p.slashT = 1;
      p.slashCooldown = 0.45 / hero.slashRate;
      state.slashes += 1;
      return true;
    }
    return false;
  }

  function resolveSlash() {
    const p = state.player;
    let hitNape = false;
    let sparked = false;
    for (let i = state.titans.length - 1; i >= 0; i -= 1) {
      const t = state.titans[i];
      const nape = napePosition(t);
      const dNape = Math.hypot(p.x - nape.x, (p.y - 6) - nape.y);
      if (dNape < SLASH_RANGE + nape.r) {
        t.hitsLeft -= 1;
        t.flash = 0.18;
        hitNape = true;
        burst(nape.x, nape.y, '#ff2a1a', 10, 200);
        if (t.hitsLeft <= 0) killTitan(t, i);
        continue;
      }
      const dBody = Math.hypot(p.x - t.x, (p.y - 6) - (t.feetY - t.height * 0.45));
      if (dBody < t.height * 0.42 + 20) {
        sparked = true;
        burst(p.x + p.facing * 20, p.y - 6, '#dfe6ea', 6, 160);
      }
    }
    return { hitNape, sparked };
  }

  function stepTitans(dt) {
    let events = 0;
    for (let i = state.titans.length - 1; i >= 0; i -= 1) {
      const t = state.titans[i];
      t.flash = Math.max(0, t.flash - dt);
      t.grabCooldown = Math.max(0, t.grabCooldown - dt);
      t.walkPhase += dt * (t.speed / (t.height * 0.09));
      const p = state.player;
      const atWall = t.x < WALL_X + 70;
      if (atWall) {
        t.attackT += dt;
        if (t.attackT >= 1.2) {
          t.attackT = 0;
          const dmg = t.kind === 'pure' || t.kind === 'tall' ? 8 : 15;
          state.wallHP = Math.max(0, state.wallHP - dmg);
          state.shake = 0.35;
          events |= EVENT_WALL_HIT;
          burst(WALL_X + 30, t.feetY - t.height * 0.5, '#8a7a62', 10, 180);
          if (state.wallHP <= 0) {
            state.over = true;
            events |= EVENT_OVER;
          }
        }
      } else {
        t.x -= t.speed * dt;
      }
      // Grab: telegraph, then snatch a low player in reach.
      const dx = Math.abs(p.x - t.x);
      const inReach = dx < t.height * 0.38 && p.y > t.feetY - t.height * 0.9;
      if (t.grabT > 0) {
        t.grabT -= dt;
        if (t.grabT <= 0) {
          if (inReach && p.invuln <= 0) {
            state.lives -= 1;
            state.combo = 0;
            p.x = Math.min(VIEW.width - 100, t.x + 260);
            p.y = t.feetY - 260;
            p.vx = 320;
            p.vy = -320;
            p.grapple = null;
            p.invuln = 2;
            state.shake = 0.5;
            events |= EVENT_GRAB;
            burst(p.x, p.y, '#c0392b', 14, 220);
            if (state.lives <= 0) {
              state.over = true;
              events |= EVENT_OVER;
            }
          }
          t.grabCooldown = 2.5;
        }
      } else if (inReach && t.grabCooldown <= 0 && !atWall) {
        t.grabT = 0.5;
      }
    }
    return events;
  }

  function step(dt, input, demo) {
    if (state.over || state.victory) return 0;
    state.time += dt;
    let events = 0;
    state.shake = Math.max(0, state.shake - dt);
    state.bannerTimer = Math.max(0, state.bannerTimer - dt);
    state.comboTimer -= dt;
    if (state.comboTimer <= 0) state.combo = 0;
    state.chatterTimer -= dt;
    if (state.chatterTimer <= 0) {
      state.chatter = pickChatter();
      state.chatterTimer = 7;
    }

    // Waves.
    if (state.waveState === 'between') {
      state.betweenTimer -= dt;
      if (state.betweenTimer <= 0) startWave(state.wave + 1);
    } else if (state.spawnList.length > 0) {
      state.spawnTimer -= dt;
      if (state.spawnTimer <= 0) {
        spawnNext();
        state.spawnTimer = Math.max(0.7, 1.7 - state.wave * 0.08);
      }
    } else if (state.titans.length === 0) {
      // Wave cleared.
      events |= EVENT_WAVE_CLEAR;
      const repair = state.hero.wallRepair || 12;
      state.wallHP = Math.min(100, state.wallHP + repair);
      if (state.wave >= VICTORY_WAVE) {
        state.victory = true;
        events |= EVENT_VICTORY;
      } else {
        state.waveState = 'between';
        state.betweenTimer = 3.5;
        state.banner = `WAVE ${state.wave} CLEARED!  WALL +${repair}`;
        state.bannerTimer = 2.2;
      }
    }

    const slashed = stepPlayer(dt, input || { direction: 0, jumpHeld: false, grapple: null, slash: false });
    if (slashed) {
      events |= EVENT_SLASH;
      const result = resolveSlash();
      if (result.hitNape) events |= EVENT_KILL;
      if (result.sparked) events |= EVENT_SPARK;
    }
    events |= stepTitans(dt);

    // Particles and floating text.
    for (let i = state.particles.length - 1; i >= 0; i -= 1) {
      const pt = state.particles[i];
      pt.life -= dt;
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vy += 300 * dt;
      if (pt.life <= 0) state.particles.splice(i, 1);
    }
    for (let i = state.texts.length - 1; i >= 0; i -= 1) {
      const tx = state.texts[i];
      tx.life -= dt;
      tx.y -= 40 * dt;
      if (tx.life <= 0) state.texts.splice(i, 1);
    }
    if (demo) state.player.invuln = Math.max(state.player.invuln, 0.5);
    return events;
  }

  function reset(hero) {
    state.hero = hero || HEROES[0];
    resetPlayer();
    state.titans = [];
    state.particles = [];
    state.texts = [];
    state.wave = 0;
    state.spawnList = [];
    state.spawnTimer = 0;
    state.waveState = 'between';
    state.betweenTimer = 2.5;
    state.wallHP = 100;
    state.score = 0;
    state.combo = 0;
    state.comboTimer = 0;
    state.kills = 0;
    state.lives = MAX_LIVES;
    state.time = 0;
    state.shake = 0;
    state.boss = null;
    state.chatter = 'Erwin: Soldiers! Give your hearts! Hold the Wall!';
    state.chatterTimer = 5;
    state.over = false;
    state.victory = false;
    state.slashes = 0;
    state.banner = 'DEFEND WALL MARIA';
    state.bannerTimer = 2.2;
  }

  reset(hero);
  return {
    state,
    reset,
    step,
    startWave,
    /** Test/shot helper: jump straight into a wave with its boss on the field. */
    jumpToWave(n) {
      reset(state.hero);
      state.wave = n - 1;
      state.waveState = 'between';
      state.betweenTimer = 0.01;
      state.score = 1240;
      state.kills = 9;
      state.wallHP = 78;
      step(STEP, { direction: 0, jumpHeld: false, grapple: null, slash: false });
      // Force the boss out at once so the shot frames it.
      while (state.spawnList.length > 0) spawnNext();
      state.player.x = 640;
      state.player.y = 300;
      state.player.grapple = { ax: 690, ay: 320, len: 120 };
    },
  };
}
