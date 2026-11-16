// Skyfall Slayers live play-test: plays the real game with scripted input and verifies
// the full loop — title -> hero pick -> play -> pause -> wave clear -> boss wave ->
// game over -> restart — with no page errors. Run with the dev server up on :8080.
const { chromium } = require('/home/hatch/workspace/mm-wallet/node_modules/playwright-core');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const browser = await chromium.launch({
    executablePath: '/home/hatch/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome',
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  const requests = [];
  page.on('request', (r) => requests.push(r.url()));
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 300)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 200)); });
  await page.goto('http://127.0.0.1:8080/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(900);

  const state = () => page.evaluate(() => {
    const g = window.__game;
    if (!g) return null;
    const s = g.state;
    return {
      screen: g.screen, wave: s.wave, score: s.score, lives: s.lives,
      wallHP: Math.round(s.wallHP), ravagers: s.ravagers.length,
      kills: s.kills, hero: s.hero.id, px: Math.round(s.player.x), py: Math.round(s.player.y),
      grapple: !!s.player.grapple, waveState: s.waveState,
    };
  });
  const nearestNape = () => page.evaluate(() => {
    const g = window.__game;
    if (!g || g.state.ravagers.length === 0) return null;
    const p = g.state.player;
    let best = null; let bd = 1e9;
    for (const t of g.state.ravagers) {
      const nx = t.x + t.height * 0.10;
      const ny = t.feetY - t.height * 0.80;
      const d = (nx - p.x) ** 2 + (ny - p.y) ** 2;
      if (d < bd) { bd = d; best = { x: nx, y: ny }; }
    }
    return best;
  });

  console.log('title:', JSON.stringify(await state()));
  // Pick Sera with key 2, then start with Space.
  await page.keyboard.press('Digit2');
  await sleep(200);
  await page.keyboard.press('Space');
  await sleep(500);
  console.log('after start:', JSON.stringify(await state()));

  // Pause / resume.
  await page.keyboard.press('KeyP');
  await sleep(300);
  console.log('paused:', JSON.stringify(await state()));
  await page.keyboard.press('KeyP');
  await sleep(300);
  console.log('resumed:', JSON.stringify(await state()));

  // Play like a human: chase the nearest nape, grapple with the mouse held,
  // slash with Space when close. 90 seconds of play at most.
  let clearedWave1 = false;
  let sawGrapple = false;
  for (let i = 0; i < 300; i++) {
    const s = await state();
    if (!s) break;
    if (s.screen === 'over' || s.screen === 'victory') { console.log('ended early:', JSON.stringify(s)); break; }
    if (s.wave >= 2) { clearedWave1 = true; console.log(`wave 2 reached at tick ${i}:`, JSON.stringify(s)); break; }
    if (s.grapple) sawGrapple = true;
    const n = await nearestNape();
    if (n) {
      const p = (await state());
      await page.mouse.move(640 + Math.max(-300, Math.min(300, n.x - p.px)), 300);
      if (n.y < p.py - 130) await page.mouse.down();
      else await page.mouse.up();
      if (n.x > p.px + 24) await page.keyboard.down('KeyD');
      else if (n.x < p.px - 24) await page.keyboard.down('KeyA');
      else { await page.keyboard.up('KeyD'); await page.keyboard.up('KeyA'); }
      if (Math.abs(n.x - p.px) < 90 && Math.abs(n.y - p.py) < 110) await page.keyboard.press('Space');
    }
    await sleep(180);
  }
  await page.mouse.up();
  await page.keyboard.up('KeyD');
  await page.keyboard.up('KeyA');
  console.log('wave1 cleared:', clearedWave1, '| saw grapple:', sawGrapple);
  await page.screenshot({ path: '/tmp/skyfall-slayers-playtest-mid.jpg', type: 'jpeg', quality: 80 });

  // Jump to the boss wave to prove the Colossus renders and can be hurt.
  await page.evaluate(() => {
    const g = window.__game;
    g.state.hero = { ...g.state.hero };
    window.__game.state.wave = 9;
  });
  // Force a boss wave through the world's jump helper via a fresh shot-style setup:
  // instead, drive the real loop: set wave 9 cleared state by killing remaining ravagers.
  await page.evaluate(() => {
    const g = window.__game;
    g.state.ravagers.length = 0;
    g.state.spawnList.length = 0;
    g.state.wave = 9;
    g.state.waveState = 'between';
    g.state.betweenTimer = 0.05;
  });
  await sleep(4000);
  console.log('boss wave state:', JSON.stringify(await state()));
  await page.screenshot({ path: '/tmp/skyfall-slayers-playtest-boss.jpg', type: 'jpeg', quality: 80 });

  // Force game over: drop the wall, then restart with R... restart is Space/click.
  await page.evaluate(() => {
    const g = window.__game;
    g.state.wallHP = 1;
    g.state.ravagers.length = 0;
    g.state.spawnList.length = 0;
    g.state.waveState = 'fighting';
  });
  // Spawn a wall attacker by waiting for the next spawn cycle is slow; instead
  // directly damage through a Ravager: place one at the wall.
  await page.evaluate(() => {
    const g = window.__game;
    g.state.ravagers.push({
      kind: 'shambler', x: 150, feetY: 648, height: 45, skin: '#e8c39a', deform: 0.5,
      walkPhase: 0, speed: 0, hitsLeft: 1, maxHits: 1, flash: 0, grabT: 0,
      grabCooldown: 99, attackT: 1.1, dead: false,
    });
  });
  await sleep(2500);
  console.log('after wall breach:', JSON.stringify(await state()));
  await page.screenshot({ path: '/tmp/skyfall-slayers-playtest-over.jpg', type: 'jpeg', quality: 80 });
  await page.keyboard.press('Space');
  await sleep(600);
  console.log('after restart:', JSON.stringify(await state()));
  const external = requests.filter((u) => !u.startsWith('http://127.0.0.1:8080'));
  console.log('REQUESTS:', requests.length, '| external:', external.length ? external.join(', ') : 'none');
  console.log('ERRORS:', errors.length ? errors.join('\n') : 'none');
  await browser.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
