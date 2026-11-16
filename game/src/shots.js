// The screenshot scenes behind ?shot=title|play|boss|victory|end. Each one plays the
// real rules forward from a fresh world for a fixed number of steps, steered by an
// autopilot that hooks anchors, swings to the nearest Ravager's nape and slashes it —
// so the frame is what a short game really looks like, and the same seed always
// gives the same frame. The end scene's pilot never slashes, so the Wall falls as
// a hurried player would lose it.
import { STEP } from './config.js';
import { EVENT_OVER } from './world.js';
import { napePosition } from './ravagers.js';
import { heroById } from './characters.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, SCREEN_VICTORY } from './render.js';

const SAMPLE = STEP;
const TITLE_SECONDS = 6;
const PLAY_SECONDS = 24;
const BOSS_SECONDS = 10;
const END_LIMIT_SECONDS = 240;

/** Steer the soldier at the nearest Ravager's nape: run toward it, grapple up when
 *  the nape is high, release to drop onto it, slash in range. */
function autopilot(state, slash) {
  const p = state.player;
  let target = null;
  let bestD = Infinity;
  for (const t of state.ravagers) {
    const nape = napePosition(t);
    const d = Math.hypot(p.x - nape.x, p.y - nape.y);
    if (d < bestD) { bestD = d; target = { ravager: t, nape }; }
  }
  if (!target) return { direction: 0, jumpHeld: false, grapple: null, slash: false };
  // Hold the line: never chase a Ravager off the right edge — wait at x=950 for it
  // to walk into the fight, so the frame stays mid-screen.
  if (target.nape.x > 1100) {
    const hx = 950 - p.x;
    return { direction: Math.abs(hx) > 20 ? Math.sign(hx) : 0, jumpHeld: false, grapple: null, slash: false };
  }
  const dx = target.nape.x - p.x;
  const dy = target.nape.y - p.y;
  const direction = Math.abs(dx) > 24 ? Math.sign(dx) : 0;
  // Grapple while the nape is well above us; let go once we are level with it.
  const wantGrapple = dy < -130;
  const jumpHeld = wantGrapple || (p.grounded && dy < -90);
  return {
    direction,
    jumpHeld,
    grapple: wantGrapple ? { down: true, x: target.nape.x, y: target.nape.y } : null,
    slash: slash && bestD < 82,
  };
}

/** Run the world forward for `seconds` under the autopilot; stop early on game over. */
function simulate(world, seconds, slash) {
  const steps = Math.floor(seconds / SAMPLE);
  for (let i = 0; i < steps; i += 1) {
    const events = world.step(SAMPLE, autopilot(world.state, slash));
    if (events & EVENT_OVER) break;
  }
}

/** Like simulate, but stop the moment `stopWhen(state)` is true — used to catch the
 *  exact frame of a nape slash for the screenshots. */
function simulateUntil(world, seconds, slash, stopWhen) {
  const steps = Math.floor(seconds / SAMPLE);
  for (let i = 0; i < steps; i += 1) {
    const events = world.step(SAMPLE, autopilot(world.state, slash));
    if (events & EVENT_OVER) break;
    if (stopWhen(world.state)) break;
  }
}

/** True while the soldier is mid-slash within reach of a Ravager's nape. */
function midNapeSlash(state) {
  const p = state.player;
  if (p.slashT <= 0.3) return false;
  for (const t of state.ravagers) {
    const nape = napePosition(t);
    if (Math.hypot(p.x - nape.x, p.y - nape.y) < 110) return true;
  }
  return false;
}

export function stageShot(name, world) {
  if (name === 'play') {
    world.reset(world.state.hero);
    simulateUntil(world, PLAY_SECONDS, true, midNapeSlash);
    return { screen: SCREEN_PLAY, best: 1240, heroId: world.state.hero.id };
  }
  if (name === 'boss') {
    world.reset(heroById('dain'));
    world.jumpToWave(10);
    // Only the Colossus on the field, centre-screen, no escort to distract the pilot.
    world.state.spawnList = [];
    world.state.ravagers = world.state.ravagers.filter((t) => t === world.state.boss);
    const boss = world.state.boss;
    if (boss) boss.x = 880;
    world.state.player.x = 760;
    world.state.player.y = 300;
    world.state.player.grapple = { ax: 820, ay: 250, len: 110 };
    simulateUntil(world, BOSS_SECONDS, true, midNapeSlash);
    return { screen: SCREEN_PLAY, best: 4860, heroId: 'dain' };
  }
  if (name === 'victory') {
    world.reset(world.state.hero);
    world.state.score = 8450;
    world.state.kills = 42;
    world.state.wave = 10;
    world.state.slashes = 61;
    world.state.victory = true;
    return { screen: SCREEN_VICTORY, best: 8450, heroId: world.state.hero.id };
  }
  if (name === 'end') {
    world.reset(world.state.hero);
    simulate(world, END_LIMIT_SECONDS, false);
    return { screen: SCREEN_OVER, best: 2310, heroId: world.state.hero.id };
  }
  // Title: let the demo world run behind the portraits.
  world.reset(world.state.hero);
  simulate(world, TITLE_SECONDS, true);
  world.state.score = 0;
  return { screen: SCREEN_TITLE, best: 4860, heroId: world.state.hero.id };
}
