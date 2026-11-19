#!/usr/bin/env node
'use strict';

/**
 * P011-S01 approved-repair tests.
 *
 * Verifies the rebuilt slideshow without requesting any image bytes:
 *  - 20 original URLs in the original order;
 *  - the shared JavaScript restores arrows, generated dots, and the counter;
 *  - the 1335 x 1553 portrait frame has no scrollbars;
 *  - fullscreen still targets only #slideshow;
 *  - P011-S01 and P001-S01 remain independent in two iframes.
 *
 * The archived P011 source had no <script> block. The generated preview is
 * expected to have one; that difference is the approved repair.
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');
const { createPilotServer, NOT_FOUND_HTML } = require('./serve');

const ROOT = path.resolve(__dirname, '..');
const DATA_FILE = path.join(ROOT, '03_REBUILT_SLIDESHOWS', 'data', 'P011-S01.json');
const SOURCE_FILE = path.join(ROOT, '02_SOURCE_BACKUP', 'P011',
  'P011-oa-ap-family-majlis-S01-renders.original.html');
const RESULTS_DIR = path.join(ROOT, '01_AUDIT', 'evidence', 'phase2-repair');
const SLIDE = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
const EXPECTED_URLS = SLIDE.images.map(image => image.src);
const TOTAL = SLIDE.images.length;
const WIDTH = 1335;
const HEIGHT = 1553;

const results = [];
const failures = [];
let blockedImageRequests = 0;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertEqual(actual, expected, label) {
  assert(actual === expected, label + ': expected ' + JSON.stringify(expected) +
    ', got ' + JSON.stringify(actual));
}

async function test(name, fn) {
  try {
    const detail = await fn();
    results.push({ name, passed: true, detail: detail === undefined ? null : detail });
  } catch (error) {
    results.push({ name, passed: false, detail: error.message });
    failures.push(name + ': ' + error.message);
  }
}

async function fetchText(url) {
  const response = await fetch(url, { redirect: 'follow' });
  return { status: response.status, headers: response.headers, body: await response.text() };
}

function imageSources(html) {
  return Array.from(html.matchAll(/<img\s+src="([^"]+)"/g)).map(match => match[1]);
}

function wait(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

async function blockImages(context) {
  await context.route('https://i.imgur.com/**', route => {
    blockedImageRequests += 1;
    return route.abort();
  });
  // The font stylesheet is parser-blocking. Serve an empty stylesheet so the
  // local behavioral suite never waits on a third-party font request.
  await context.route('https://fonts.googleapis.com/**', route => route.fulfill({
    status: 200,
    contentType: 'text/css; charset=utf-8',
    body: ''
  }));
  await context.route('https://fonts.gstatic.com/**', route => route.abort());
  return context;
}

async function waitForSlides(frame, expectedTotal = TOTAL) {
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    try {
      const state = await frame.evaluate(() => ({
        slides: document.querySelectorAll('.slide').length,
        dots: document.querySelectorAll('.dot').length
      }));
      if (state.slides === expectedTotal && state.dots === expectedTotal) return;
    } catch (error) {
      // The frame may still be navigating.
    }
    await wait(100);
  }
  throw new Error('slideshow did not initialize with ' + expectedTotal + ' slides');
}

async function counter(frame) {
  return frame.evaluate(() => document.getElementById('pageNumber').textContent);
}

async function waitForCounter(frame, expected) {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    try {
      if (await counter(frame) === expected) return;
    } catch (error) {
      // The frame may still be navigating.
    }
    await wait(100);
  }
  assertEqual(await counter(frame), expected, 'counter');
}

async function activeDot(frame) {
  return frame.evaluate(() => Array.from(document.querySelectorAll('.dot'))
    .findIndex(dot => dot.classList.contains('active')));
}

async function transformValue(frame) {
  return frame.evaluate(() => document.getElementById('slidesContainer').style.transform);
}

async function fullscreenState(frame) {
  return frame.evaluate(() => {
    const container = document.getElementById('slideshow');
    const dotContainer = document.getElementById('dotContainer');
    return {
      native: document.fullscreenElement ? document.fullscreenElement.id : null,
      theater: container.classList.contains('theater-mode'),
      dotsInsideFullscreen: document.fullscreenElement
        ? document.fullscreenElement.contains(dotContainer)
        : null,
      aria: document.getElementById('fullscreenBtn').getAttribute('aria-label')
    };
  });
}

async function main() {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });

  const server = createPilotServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  const canonicalUrl = base + '/exec?slide=P011-S01';
  const pilotUrl = base + '/exec?slide=P001-S01';

  // ------------------------------------------------------------ router tests
  const canonical = await fetchText(canonicalUrl);
  await test('Router: P011-S01 returns HTTP 200 HTML', () => {
    assertEqual(canonical.status, 200, 'status');
    assert(/text\/html/.test(canonical.headers.get('content-type')), 'content type is not HTML');
  });

  await test('Router: response contains exactly the 20 audited URLs in order', () => {
    const urls = imageSources(canonical.body);
    assertEqual(urls.length, TOTAL, 'image count');
    urls.forEach((url, index) => assertEqual(url, EXPECTED_URLS[index], 'image ' + (index + 1)));
  });

  await test('Router: response contains no other slideshow ID or URL', () => {
    const ids = Array.from(new Set(canonical.body.match(/P\d{3}-S\d{2}/g) || []));
    assert(ids.every(id => id === 'P011-S01'), 'unexpected IDs: ' + ids.join(', '));
    const urls = imageSources(canonical.body);
    assert(urls.every(url => EXPECTED_URLS.includes(url)), 'unexpected image URL');
    assert(!/P001|P002|P003|P004|P005|P006|P007|P008|P009|P010/.test(canonical.body),
      'response mentions another project');
  });

  await test('Router: response contains no gallery, catalog, index, or links', () => {
    assert(!/<a\s/i.test(canonical.body), 'response contains a link');
    assert(!/gallery|catalog|all slideshows|index of/i.test(canonical.body),
      'response contains gallery wording');
    assertEqual((canonical.body.match(/<iframe/g) || []).length, 0, 'nested iframes');
  });

  await test('Router: P011 rejects missing, repeated, and unknown IDs', async () => {
    for (const route of [
      '/exec',
      '/exec?slide=',
      '/exec?slide=P011-S01&slide=P011-S01',
      '/exec?slide=P011-S01&slide=P001-S01',
      '/exec?slide=P011-S01,P001-S01',
      '/exec?slide=all',
      '/exec?slide=P999-S99'
    ]) {
      const page = await fetchText(base + route);
      assertEqual(page.status, 200, route + ' status');
      assertEqual(page.body, NOT_FOUND_HTML, route + ' should be neutral');
      assert(!/P\d{3}-S\d{2}/.test(page.body), route + ' contains an ID');
    }
  });

  await test('Router: P011 and P001 responses are different documents', async () => {
    const pilot = await fetchText(pilotUrl);
    assert(pilot.body !== canonical.body, 'responses are identical');
    assertEqual(imageSources(pilot.body).length, 17, 'P001 image count');
  });

  // ----------------------------------------------------------- browser tests
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const browserVersion = browser.version();
  const context = await blockImages(await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT }
  }));
  const page = await context.newPage();
  await page.bringToFront();
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  await page.goto(canonicalUrl, { waitUntil: 'domcontentloaded' });
  await waitForSlides(page);
  await wait(200);

  await test('Repair: original source had no JavaScript; generated page has it', () => {
    const original = fs.readFileSync(SOURCE_FILE, 'utf8');
    const generated = fs.readFileSync(path.join(ROOT, '03_REBUILT_SLIDESHOWS', 'preview',
      'P011-S01.html'), 'utf8');
    assert(!/<script\b/i.test(original), 'original source unexpectedly contains a script');
    assert(/<script>/.test(generated) && /moveSlide/.test(generated),
      'generated page is missing the standard script');
  });

  await test('Browser: renders 20 slides, 20 dots, counter 1 / 20, and exact URLs', async () => {
    const state = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('.slide img'));
      const first = images[0];
      const container = document.getElementById('slideshow');
      return {
        slides: document.querySelectorAll('.slide').length,
        dots: document.querySelectorAll('.dot').length,
        counter: document.getElementById('pageNumber').textContent,
        activeDot: Array.from(document.querySelectorAll('.dot'))
          .findIndex(dot => dot.classList.contains('active')),
        srcs: images.map(image => image.src),
        eager: images.every(image => image.getAttribute('loading') === 'eager'),
        objectFit: getComputedStyle(first).objectFit,
        radius: getComputedStyle(container).borderRadius,
        localStorage: (() => { try { return window.localStorage.length; } catch (error) { return 'blocked'; } })(),
        sessionStorage: (() => { try { return window.sessionStorage.length; } catch (error) { return 'blocked'; } })(),
        cookie: (() => { try { return document.cookie; } catch (error) { return 'blocked'; } })()
      };
    });
    assertEqual(state.slides, TOTAL, 'slides');
    assertEqual(state.dots, TOTAL, 'dots');
    assertEqual(state.counter, '1 / 20', 'counter');
    assertEqual(state.activeDot, 0, 'active dot');
    assert(state.eager, 'not every image is eager');
    state.srcs.forEach((src, index) => assertEqual(src, EXPECTED_URLS[index], 'image ' + (index + 1)));
    assertEqual(state.objectFit, 'cover', 'object-fit');
    assertEqual(state.radius, '20px', 'container radius');
    assertEqual(state.localStorage, 0, 'localStorage entries');
    assertEqual(state.sessionStorage, 0, 'sessionStorage entries');
    assertEqual(state.cookie, '', 'cookies');
  });

  await test('Browser: no scrollbars at 1335 x 1553', async () => {
    const metrics = await page.evaluate(() => ({
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      scrollWidth: document.documentElement.scrollWidth,
      scrollHeight: document.documentElement.scrollHeight
    }));
    assertEqual(metrics.innerWidth, WIDTH, 'inner width');
    assertEqual(metrics.innerHeight, HEIGHT, 'inner height');
    assert(metrics.scrollWidth <= metrics.innerWidth, 'horizontal overflow');
    assert(metrics.scrollHeight <= metrics.innerHeight, 'vertical overflow');
  });

  await test('Browser: next advances one slide, dot, and transform', async () => {
    await page.click('.next');
    await waitForCounter(page, '2 / 20');
    assertEqual(await activeDot(page), 1, 'active dot');
    assertEqual(await transformValue(page), 'translateX(-100vw)', 'transform');
    await wait(100);
  });

  await test('Browser: dots jump directly to a slide', async () => {
    await page.click('.dot:nth-child(10)');
    await waitForCounter(page, '10 / 20');
    assertEqual(await activeDot(page), 9, 'active dot');
    assertEqual(await transformValue(page), 'translateX(-900vw)', 'transform');
  });

  await test('Browser: previous and wrap-around navigation work', async () => {
    await page.click('.prev');
    await waitForCounter(page, '9 / 20');
    await page.click('.dot:nth-child(1)');
    await waitForCounter(page, '1 / 20');
    await page.click('.prev');
    await waitForCounter(page, '20 / 20');
    assertEqual(await activeDot(page), 19, 'last dot');
    await page.click('.next');
    await waitForCounter(page, '1 / 20');
  });

  await test('Browser: hover reveals arrows, counter, and shadows', async () => {
    await page.mouse.move(10, 10);
    await page.hover('#slideshow');
    await page.waitForTimeout(500);
    const shown = await page.evaluate(() => ({
      prev: getComputedStyle(document.querySelector('.prev')).opacity,
      pageNumber: getComputedStyle(document.getElementById('pageNumber')).opacity,
      shadows: getComputedStyle(document.querySelector('.side-shadow.left')).opacity
    }));
    assertEqual(shown.prev, '1', 'shown arrow opacity');
    assertEqual(shown.pageNumber, '1', 'shown counter opacity');
    assertEqual(shown.shadows, '1', 'shown shadow opacity');
  });

  await test('Browser: native fullscreen targets only this container and keeps dots inside', async () => {
    await page.click('#fullscreenBtn');
    await page.waitForTimeout(600);
    const state = await fullscreenState(page);
    assertEqual(state.native, 'slideshow', 'native fullscreen element');
    assertEqual(state.theater, false, 'theater mode should not be active');
    assertEqual(state.dotsInsideFullscreen, true, 'dots should be inside the fullscreen element');
    assertEqual(state.aria, 'Exit fullscreen', 'button label');
    await page.click('#fullscreenBtn');
    await page.waitForTimeout(500);
    const exited = await fullscreenState(page);
    assertEqual(exited.native, null, 'fullscreen element after exit');
    assertEqual(exited.aria, 'Enter fullscreen', 'button label after exit');
  });

  await test('Browser: native fullscreen exit restores the portrait layout', async () => {
    const layout = await page.evaluate(() => {
      const container = document.getElementById('slideshow');
      return {
        width: container.getBoundingClientRect().width,
        height: container.getBoundingClientRect().height,
        radius: getComputedStyle(container).borderRadius,
        scrollWidth: document.documentElement.scrollWidth,
        scrollHeight: document.documentElement.scrollHeight
      };
    });
    assertEqual(Math.round(layout.width), WIDTH, 'container width');
    assertEqual(Math.round(layout.height), HEIGHT, 'container height');
    assertEqual(layout.radius, '20px', 'restored radius');
    assert(layout.scrollWidth <= WIDTH, 'horizontal overflow after exit');
    assert(layout.scrollHeight <= HEIGHT, 'vertical overflow after exit');
  });

  await test('Browser: no uncaught JavaScript errors', () => {
    assertEqual(pageErrors.length, 0, 'page errors: ' + pageErrors.join(' | '));
  });

  // ------------------------------------------- two different IDs side by side
  const isolationPage = await context.newPage();
  await isolationPage.bringToFront();
  const isolationErrors = [];
  isolationPage.on('pageerror', error => isolationErrors.push(error.message));

  const harness = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
body{margin:0;background:#222;display:flex;gap:16px;padding:16px;align-items:flex-start}
iframe{border:0;border-radius:20px;overflow:hidden;background:#111}
</style></head><body>
<iframe id="portrait" src="${canonicalUrl}" width="660" height="768"
        allowfullscreen allow="fullscreen"></iframe>
<iframe id="landscape" src="${pilotUrl}" width="660" height="398"
        allowfullscreen allow="fullscreen"></iframe>
</body></html>`;

  await isolationPage.setContent(harness, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await isolationPage.waitForFunction(() => document.querySelectorAll('iframe').length === 2, null,
    { timeout: 10000 });
  await isolationPage.waitForTimeout(500);
  const frames = isolationPage.frames().filter(frame =>
    frame !== isolationPage.mainFrame() && frame.url().startsWith(base + '/exec'));
  assertEqual(frames.length, 2, 'iframe count');
  const portrait = frames.find(frame => frame.url().includes('P011-S01'));
  const landscape = frames.find(frame => frame.url().includes('P001-S01'));
  assert(portrait && landscape, 'did not find both slideshow frames');
  await waitForSlides(portrait);
  await waitForSlides(landscape, 17);
  await waitForCounter(portrait, '1 / 20');
  await waitForCounter(landscape, '1 / 17');

  await test('Independence: P011 and P001 keep their own sequences and dimensions', async () => {
    assertEqual(await counter(portrait), '1 / 20', 'portrait counter');
    assertEqual(await counter(landscape), '1 / 17', 'landscape counter');
    const state = await isolationPage.evaluate(() => ({
      portrait: document.getElementById('portrait').getBoundingClientRect().height,
      landscape: document.getElementById('landscape').getBoundingClientRect().height
    }));
    assertEqual(Math.round(state.portrait), 768, 'portrait iframe height');
    assertEqual(Math.round(state.landscape), 398, 'landscape iframe height');
    assert(state.portrait !== state.landscape, 'iframes share a height');
  });

  await test('Independence: navigating one slideshow does not change the other', async () => {
    await portrait.click('.next');
    await portrait.click('.next');
    await waitForCounter(portrait, '3 / 20');
    assertEqual(await counter(landscape), '1 / 17', 'landscape after portrait navigation');
    await landscape.click('.dot:nth-child(8)');
    await waitForCounter(landscape, '8 / 17');
    assertEqual(await counter(portrait), '3 / 20', 'portrait after landscape navigation');
    assertEqual(await activeDot(portrait), 2, 'portrait active dot');
    assertEqual(await activeDot(landscape), 7, 'landscape active dot');
  });

  await test('Independence: fullscreen in one slideshow leaves the other unchanged', async () => {
    await portrait.click('#fullscreenBtn');
    await isolationPage.waitForTimeout(600);
    const portraitState = await fullscreenState(portrait);
    assert(portraitState.native === 'slideshow' || portraitState.theater,
      'portrait did not enter fullscreen or theater mode');
    assertEqual(await counter(portrait), '3 / 20', 'portrait counter during fullscreen');
    assertEqual(await counter(landscape), '8 / 17', 'landscape counter during portrait fullscreen');
    const landscapeState = await fullscreenState(landscape);
    assertEqual(landscapeState.native, null, 'landscape fullscreen element');
    assertEqual(landscapeState.theater, false, 'landscape theater mode');
    await portrait.click('#fullscreenBtn');
    await isolationPage.waitForTimeout(500);
    assertEqual((await fullscreenState(portrait)).native, null, 'portrait fullscreen after exit');
  });

  await test('Independence: no cross-iframe errors or shared storage', async () => {
    assertEqual(isolationErrors.length, 0, 'page errors: ' + isolationErrors.join(' | '));
    for (const frame of [portrait, landscape]) {
      const storage = await frame.evaluate(() => ({
        localStorage: (() => { try { return window.localStorage.length; } catch (error) { return 'blocked'; } })(),
        sessionStorage: (() => { try { return window.sessionStorage.length; } catch (error) { return 'blocked'; } })(),
        cookie: (() => { try { return document.cookie; } catch (error) { return 'blocked'; } })()
      }));
      assert(storage.localStorage === 0 || storage.localStorage === 'blocked',
        'localStorage entries: ' + storage.localStorage);
      assert(storage.sessionStorage === 0 || storage.sessionStorage === 'blocked',
        'sessionStorage entries: ' + storage.sessionStorage);
      assert(storage.cookie === '' || storage.cookie === 'blocked',
        'cookies: ' + storage.cookie);
    }
  });

  await test('Images: every request was blocked and none was downloaded', () => {
    assert(blockedImageRequests > 0, 'no image request was intercepted');
  });

  await browser.close();
  await new Promise(resolve => server.close(resolve));

  const report = {
    slideshow: 'P011-S01',
    repair: SLIDE.repair_note,
    browser: 'Chrome ' + browserVersion,
    frame: { width: WIDTH, height: HEIGHT },
    checks: results.length,
    passed: results.length - failures.length,
    failed: failures.length,
    blockedImageRequests,
    failures,
    results
  };
  const reportFile = path.join(RESULTS_DIR, 'p011-test-results.json');
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2) + '\n', 'utf8');
  console.log(JSON.stringify({
    slideshow: report.slideshow,
    browser: report.browser,
    checks: report.checks,
    passed: report.passed,
    failed: report.failed,
    blockedImageRequests,
    report: path.relative(ROOT, reportFile)
  }, null, 2));

  if (failures.length) process.exit(1);
}

main().catch(error => {
  console.error('ERROR: ' + error.stack);
  process.exit(1);
});
