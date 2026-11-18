/**
 * Live Apps Script deployment smoke test.
 *
 * Usage: node test-deployment.js <deployment-url> [--headful]
 *
 * This test never requests image bytes. Every i.imgur.com request is aborted;
 * only the HTML, CSS, and JavaScript of the deployment are exercised.
 */
const { chromium } = require('playwright-core');

const url = process.argv[2];
const headful = process.argv.includes('--headful');

if (!url || !/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url)) {
  console.error('Usage: node test-deployment.js <https://script.google.com/macros/s/.../exec> [--headful]');
  process.exit(2);
}

const results = [];
let blockedImages = 0;

function record(name, passed, detail) {
  results.push({ name, passed, detail });
  console.log((passed ? 'PASS  ' : 'FAIL  ') + name + (detail ? ' — ' + detail : ''));
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function findSlideshowFrame(page, timeout) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    for (const frame of page.frames()) {
      try {
        const count = await frame.evaluate(() => document.querySelectorAll('.slide').length);
        if (count > 0) return frame;
      } catch (error) {
        // Cross-origin navigation in progress; try again.
      }
    }
    await wait(250);
  }
  return null;
}

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: !headful });
  const context = await browser.newContext({ viewport: { width: 1335, height: 805 } });
  await context.route('https://i.imgur.com/**', route => {
    blockedImages += 1;
    return route.abort();
  });

  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  await page.goto(url + '?slide=P001-S01', { waitUntil: 'domcontentloaded', timeout: 60000 });
  const frame = await findSlideshowFrame(page, 45000);

  record('Live page reaches the slideshow frame', Boolean(frame));
  if (!frame) {
    console.log(JSON.stringify({ results, blockedImages }, null, 2));
    await browser.close();
    process.exit(1);
  }

  await frame.waitForFunction(() => {
    return document.querySelectorAll('.slide').length === 17 &&
      document.querySelectorAll('.dot').length === 17;
  }, null, { timeout: 30000 });

  const initial = await frame.evaluate(() => {
    const images = Array.from(document.querySelectorAll('.slide img'));
    return {
      slides: images.length,
      dots: document.querySelectorAll('.dot').length,
      counter: document.getElementById('pageNumber').textContent,
      srcs: images.map(image => image.src),
      containerWidth: document.getElementById('slidesContainer').style.width,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      scrollHeight: document.documentElement.scrollHeight,
      clientHeight: document.documentElement.clientHeight,
      fullscreenButton: Boolean(document.getElementById('fullscreenBtn')),
      eager: images.every(image => image.getAttribute('loading') === 'eager')
    };
  });

  record('17 slides and 17 dots render', initial.slides === 17 && initial.dots === 17,
    initial.slides + ' slides, ' + initial.dots + ' dots');
  record('Counter starts at 1 / 17', initial.counter === '1 / 17', initial.counter);
  record('All images are eager and remote imgur URLs',
    initial.eager && initial.srcs.every(src => src.startsWith('https://i.imgur.com/')),
    initial.srcs.length + ' remote URLs');
  const banner = await page.evaluate(() => {
    const bar = document.getElementById('warning');
    if (!bar) return { present: false, height: 0 };
    const rect = bar.getBoundingClientRect();
    return { present: true, height: rect.height, text: (bar.innerText || '').trim().slice(0, 160) };
  });
  record('No Google warning banner wraps the app', !banner.present,
    banner.present ? banner.height + ' px: ' + banner.text.replace(/\s+/g, ' ') : 'none');
  record('Slideshow receives the full 805 px iframe height',
    initial.clientHeight === 805, initial.clientHeight + ' px');
  record('No scrollbars at 1335 x 805',
    initial.scrollWidth === initial.clientWidth && initial.scrollHeight === initial.clientHeight,
    initial.scrollWidth + 'x' + initial.scrollHeight);
  record('Fullscreen button exists', initial.fullscreenButton);

  await frame.click('.next');
  await frame.waitForFunction(() => document.getElementById('pageNumber').textContent === '2 / 17');
  const afterNext = await frame.evaluate(() => ({
    counter: document.getElementById('pageNumber').textContent,
    active: Array.from(document.querySelectorAll('.dot')).findIndex(dot => dot.classList.contains('active')),
    transform: document.getElementById('slidesContainer').style.transform
  }));
  record('Next advances to 2 / 17', afterNext.counter === '2 / 17', afterNext.counter);
  record('Active dot follows navigation', afterNext.active === 1, 'dot ' + (afterNext.active + 1));
  record('Transform advances one viewport', afterNext.transform === 'translateX(-100vw)', afterNext.transform);

  await frame.click('#fullscreenBtn');
  await wait(1200);
  const fullscreen = await frame.evaluate(() => {
    const element = document.fullscreenElement || document.webkitFullscreenElement;
    return {
      native: Boolean(element),
      targetIsContainer: element ? element.id === 'slideshow' : false,
      theater: document.getElementById('slideshow').classList.contains('theater-mode'),
      aria: document.getElementById('fullscreenBtn').getAttribute('aria-label')
    };
  });
  record('Fullscreen click enters native fullscreen or theater mode',
    (fullscreen.native && fullscreen.targetIsContainer) || fullscreen.theater,
    JSON.stringify(fullscreen));

  if (fullscreen.native) {
    await frame.click('#fullscreenBtn');
    await wait(800);
    const exited = await frame.evaluate(() => !document.fullscreenElement);
    record('Fullscreen button exits native fullscreen', exited);
  } else {
    await frame.click('#fullscreenBtn');
    await wait(400);
    const exited = await frame.evaluate(() => !document.getElementById('slideshow').classList.contains('theater-mode'));
    record('Second click leaves theater mode', exited);
  }

  record('No uncaught page errors', pageErrors.length === 0, pageErrors.join(' | '));
  record('No image request was allowed', blockedImages > 0,
    blockedImages + ' imgur requests blocked');

  const failed = results.filter(result => !result.passed);
  console.log(JSON.stringify({
    url,
    checks: results.length,
    passed: results.length - failed.length,
    failed: failed.length,
    blockedImages,
    pageErrors,
    results
  }, null, 2));

  await browser.close();
  process.exit(failed.length ? 1 : 0);
})().catch(async error => {
  console.error('ERROR: ' + error.stack);
  process.exit(1);
});
