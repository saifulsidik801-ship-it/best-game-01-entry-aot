// Boot and the one loop: input is read every frame, the world advances in fixed 1/60 s
// steps, and the renderer paints what is there. Screens: title (pick your soldier),
// play, paused, game over and victory.
//
// ?seed=N fixes the wave pattern. ?shot=title|play|boss|victory|end (with &seed=N)
// stages that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.
import { BEST_KEY, HEROES, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_GRAB, EVENT_KILL, EVENT_OVER, EVENT_SLASH, EVENT_SPARK, EVENT_VICTORY, EVENT_WALL_HIT, EVENT_WAVE_CLEAR } from './world.js';
import { ACTION_CONFIRM, ACTION_PAUSE, ACTION_SLASH, createInput } from './input.js';
import { createAudio } from './audio.js';
import { heroById } from './characters.js';
import { createPainter, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_VICTORY, heroCardAt } from './render.js';
import { stageShot } from './shots.js';

const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed), HEROES[0]);
const renderer = createPainter(canvas);
const audio = createAudio();

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best, scene.heroId);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let selectedHero = HEROES[0].id;
  let accumulator = 0;
  let last = performance.now();
  let pendingSlash = false;

  // Play-test hook: the scripted player reads and steers through this.
  window.__game = {
    get screen() { return screen; },
    get state() { return world.state; },
    get wave() { return world.state.wave; },
    get score() { return world.state.score; },
    get lives() { return world.state.lives; },
    get wallHP() { return world.state.wallHP; },
    get ravagers() { return world.state.ravagers; },
    get kills() { return world.state.kills; },
    get player() { return world.state.player; },
    selectHero(id) { selectedHero = id; },
  };

  // Digit keys pick the soldier on the title screen; M mutes anywhere.
  const digitPressed = new Set();
  window.addEventListener('keydown', (event) => {
    if (/^Digit[1-4]$/.test(event.code)) digitPressed.add(Number(event.code.slice(5)));
    if (event.code === 'KeyM') {
      const muted = audio.toggleMute();
      announce(muted ? 'Muted.' : 'Sound on.');
    }
  });

  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    audio.unlock();
    world.reset(heroById(selectedHero));
    accumulator = 0;
    pendingSlash = false;
    screen = SCREEN_PLAY;
    announce(`Playing as ${world.state.hero.name}. Slash the Ravagers' napes.`);
  }

  function endGame(victory) {
    screen = victory ? SCREEN_VICTORY : SCREEN_OVER;
    if (world.state.score > best) {
      best = world.state.score;
      saveBest(best);
    }
    if (victory) audio.victory();
    else audio.gameOver();
    announce(victory
      ? `Victory! Wall Aegis stands. Score ${world.state.score}.`
      : `Game over. Score ${world.state.score}. Best ${best}.`);
  }

  function playEvents(events) {
    if (events & EVENT_SLASH) audio.slash();
    if (events & EVENT_SPARK) audio.spark();
    if (events & EVENT_KILL) audio.kill();
    if (events & EVENT_WALL_HIT) audio.wallHit();
    if (events & EVENT_GRAB) audio.grab();
    if (events & EVENT_WAVE_CLEAR) audio.waveClear();
    if (events & EVENT_VICTORY) endGame(true);
    else if (events & EVENT_OVER) endGame(false);
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    const actions = input.takeActions();
    if (actions & ACTION_SLASH) pendingSlash = true;

    if (screen === SCREEN_TITLE) {
      // Pick a soldier with 1-4 or by clicking their card; any other confirm starts.
      for (let i = 0; i < HEROES.length; i += 1) {
        if (digitPressed.has(i + 1)) {
          digitPressed.delete(i + 1);
          selectedHero = HEROES[i].id;
          audio.unlock();
          audio.click();
        }
      }
      let confirmStarts = !!(actions & ACTION_CONFIRM);
      const mouse = input.mouse();
      if (mouse.down) {
        const picked = heroCardAt(mouse.x, mouse.y);
        if (picked) {
          selectedHero = picked;
          audio.unlock();
          audio.click();
          confirmStarts = false;
        }
      }
      if (confirmStarts) startGame();
      while (accumulator >= STEP && screen === SCREEN_TITLE) {
        world.step(STEP, { direction: 0, jumpHeld: false, grapple: null, slash: false }, true);
        accumulator -= STEP;
      }
    } else if (screen === SCREEN_PLAY) {
      if (actions & ACTION_PAUSE) {
        screen = SCREEN_PAUSED;
        announce('Paused.');
      } else {
        while (accumulator >= STEP && screen === SCREEN_PLAY) {
          const mouse = input.mouse();
          const events = world.step(STEP, {
            direction: input.direction(),
            jumpHeld: input.jumpHeld(),
            grapple: { down: mouse.down, x: mouse.x, y: mouse.y },
            slash: pendingSlash,
          });
          pendingSlash = false;
          accumulator -= STEP;
          playEvents(events);
        }
      }
    } else if (screen === SCREEN_PAUSED) {
      if (actions & (ACTION_PAUSE | ACTION_CONFIRM)) {
        screen = SCREEN_PLAY;
        announce('Playing.');
      }
      accumulator = 0;
    } else {
      // Game over / victory: Space or click fights again.
      if (actions & ACTION_CONFIRM) startGame();
      accumulator = 0;
    }
    if (pendingSlash && screen !== SCREEN_PLAY) pendingSlash = false;
    renderer.draw(world.state, screen, best, selectedHero);
  }

  // Leaving the tab pauses a running game rather than letting Ravagers march unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  announce('Skyfall Slayers. Pick your soldier, press Space or click to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
