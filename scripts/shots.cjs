// Skyfall Slayers screenshot harness: plain Playwright Chromium (the game is served
// locally, so no egress proxy is needed), opens each ?shot= mode, waits for
// window.__shotReady, and saves a 1280x800 JPEG into screenshots/. Run from the
// repo root with the dev server up on :8080.
const { chromium } = require('/home/hatch/workspace/mm-wallet/node_modules/playwright-core');
const fs = require('node:fs');
const path = require('node:path');

async function main() {
  const repo = path.join(__dirname, '..');
  const shots = JSON.parse(fs.readFileSync(path.join(repo, 'shots.json'), 'utf-8'));
  const browser = await chromium.launch({
    executablePath: '/home/hatch/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome',
    args: ['--no-sandbox'],
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  for (const shot of shots) {
    const page = await context.newPage();
    page.on('console', (m) => { if (m.type() === 'error') console.log(`[${shot.name}] console error:`, m.text()); });
    page.on('pageerror', (e) => console.log(`[${shot.name}] pageerror:`, String(e).slice(0, 300)));
    const url = `http://127.0.0.1:8080/${shot.query}`;
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    try {
      await page.waitForFunction(() => window.__shotReady === true, null, { timeout: 15000 });
    } catch {
      console.log(`[${shot.name}] __shotReady never fired — screenshotting anyway`);
    }
    await page.waitForTimeout(400);
    const out = path.join(repo, 'screenshots', shot.name);
    await page.screenshot({ path: out, type: 'jpeg', quality: 82 });
    const size = fs.statSync(out).size;
    console.log(`${shot.name}: ${size} bytes ${size <= 262144 ? 'OK' : 'TOO BIG'}`);
    await page.close();
  }
  await browser.close();
  console.log('done');
}

main().catch((err) => { console.error(err); process.exit(1); });
