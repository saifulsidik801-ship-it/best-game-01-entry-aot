// Skyfall Slayers grapple check: hold the mouse, confirm the skyhook cable attaches to an
// anchor and the soldier rises off the ground, then release and confirm it lets go.
const { chromium } = require('/home/hatch/workspace/mm-wallet/node_modules/playwright-core');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const browser = await chromium.launch({
    executablePath: '/home/hatch/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome',
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 300)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 200)); });
  await page.goto('http://127.0.0.1:8080/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(800);
  await page.keyboard.press('Space');
  await sleep(400);
  const probe = () => page.evaluate(() => {
    const p = window.__game.state.player;
    return { x: Math.round(p.x), y: Math.round(p.y), grapple: p.grapple ? { ax: p.grapple.ax, ay: p.grapple.ay, len: Math.round(p.grapple.len) } : null };
  });
  const before = await probe();
  console.log('on ground:', JSON.stringify(before));
  // Hold the mouse over the rooftops and reel in with W.
  await page.mouse.move(560, 240);
  await page.mouse.down();
  await page.keyboard.down('KeyW');
  await sleep(1200);
  const mid = await probe();
  console.log('grappled, reeling:', JSON.stringify(mid));
  await page.mouse.up();
  await page.keyboard.up('KeyW');
  await sleep(600);
  const after = await probe();
  console.log('released:', JSON.stringify(after));
  const rose = before.y - mid.y;
  console.log(`rose ${rose}px while grappled:`, rose > 120 && mid.grapple ? 'PASS' : 'FAIL');
  console.log('grapple released:', after.grapple === null ? 'PASS' : 'FAIL');
  console.log('ERRORS:', errors.length ? errors.join('\n') : 'none');
  await browser.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
