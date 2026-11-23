#!/usr/bin/env node
'use strict';

/**
 * P001-S01 pilot browser and router tests.
 *
 * Runs against the local router emulator in serve.js. This is not a
 * deployment: it exercises the same single-slideshow contract, the fullscreen
 * behavior, and two-iframe/two-context isolation before anything is published.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { chromium } = require('playwright-core');
const { createPilotServer, NOT_FOUND_HTML } = require('./serve');

const ROOT = path.resolve(__dirname, '..');
const DATA_FILE = path.join(ROOT, '03_REBUILT_SLIDESHOWS', 'data', 'P001-S01.json');
const RESULTS_DIR = path.join(ROOT, '01_AUDIT', 'evidence', 'phase2-pilot');
const SLIDE = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
const EXPECTED_URLS = SLIDE.images.map(image => image.src);
const TOTAL = SLIDE.images.length;

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

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

/**
 * Image bytes are intentionally not requested. Tests validate the document,
 * URLs, navigation, and fullscreen behavior without downloading or viewing any
 * remote image. Every imgur request is aborted at the network layer.
 */
async function blockImages(context) {
  await context.route('https://i.imgur.com/**', route => {
    blockedImageRequests += 1;
    return route.abort();
  });
  return context;
}

async function newBlockedContext(browser, options) {
  return blockImages(await browser.newContext(options));
}

async function waitForSlides(frame) {
  await frame.waitForFunction(expected => {
    return document.querySelectorAll('.slide').length === expected &&
      document.querySelectorAll('.dot').length === expected;
  }, TOTAL, { timeout: 30000 });
}

function wait(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

async function counter(frame) {
  return frame.evaluate(() => document.getElementById('pageNumber').textContent);
}

async function waitForCounter(frame, expected) {
  await frame.waitForFunction(
    value => document.getElementById('pageNumber').textContent === value,
    expected,
    { timeout: 10000 }
  );
  assertEqual(await counter(frame), expected, 'counter');
}

async function activeDot(frame) {
  return frame.evaluate(() => {
    const dots = Array.from(document.querySelectorAll('.dot'));
    return dots.findIndex(dot => dot.classList.contains('active'));
  });
}

async function transformValue(frame) {
  return frame.evaluate(() => document.getElementById('slidesContainer').style.transform);
}

async function storageSnapshot(frame) {
  return frame.evaluate(() => {
    const read = name => {
      try {
        return { entries: window[name].length, blocked: false };
      } catch (error) {
        return { entries: null, blocked: true };
      }
    };
    let cookie;
    try {
      cookie = document.cookie;
    } catch (error) {
      cookie = 'blocked';
    }
    return {
      localStorage: read('localStorage'),
      sessionStorage: read('sessionStorage'),
      cookie
    };
  });
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
      aria: document.getElementById('fullscreenBtn').getAttribute('aria-label'),
      note: Boolean(document.querySelector('.fullscreen-note')),
      noteVisible: Boolean(document.querySelector('.fullscreen-note.is-visible'))
    };
  });
}

async function main() {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });

  const server = createPilotServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  const canonicalUrl = base + '/exec?slide=P001-S01';
  const errorPages = [
    ['missing slide', '/exec'],
    ['empty slide', '/exec?slide='],
    ['unknown slide', '/exec?slide=P999-S99'],
    ['repeated same slide', '/exec?slide=P001-S01&slide=P001-S01'],
    ['repeated different slide', '/exec?slide=P001-S01&slide=P002-S01'],
    ['comma-separated list', '/exec?slide=P001-S01,P002-S01'],
    ['wildcard value', '/exec?slide=all'],
    ['wrong parameter name', '/exec?sid=P001-S01']
  ];

  // ------------------------------------------------------------ router tests
  const canonical = await fetchText(canonicalUrl);
  await test('Router: canonical request returns HTTP 200 HTML', () => {
    assertEqual(canonical.status, 200, 'status');
    assert(/text\/html/.test(canonical.headers.get('content-type')), 'content type is not HTML');
  });

  await test('Router: canonical response contains exactly the 17 audited image URLs in order', () => {
    const urls = imageSources(canonical.body);
    assertEqual(urls.length, TOTAL, 'image count');
    urls.forEach((url, index) => assertEqual(url, EXPECTED_URLS[index], 'image ' + (index + 1)));
  });

  await test('Router: canonical response contains no other slideshow ID or image URL', () => {
    const ids = Array.from(new Set(canonical.body.match(/P\d{3}-S\d{2}/g) || []));
    assert(ids.every(id => id === 'P001-S01'), 'unexpected IDs: ' + ids.join(', '));
    const urls = imageSources(canonical.body);
    assert(urls.every(url => EXPECTED_URLS.includes(url)), 'unexpected image URL');
    assert(!/P002|P003|P004|P005|P006|P007|P008|P009|P010|P011/.test(canonical.body),
      'response mentions another project');
  });

  await test('Router: canonical response contains no gallery, catalog, index, or links', () => {
    assert(!/<a\s/i.test(canonical.body), 'response contains a link');
    assert(!/gallery|catalog|all slideshows|index of/i.test(canonical.body),
      'response contains gallery wording');
    assertEqual((canonical.body.match(/<iframe/g) || []).length, 0, 'nested iframes');
  });

  for (const [name, route] of errorPages) {
    await test('Router: rejects ' + name, async () => {
      const page = await fetchText(base + route);
      assertEqual(page.status, 200, 'status mirrors Apps Script');
      assertEqual(page.body, NOT_FOUND_HTML, 'expected the neutral error page');
      assert(!/<img/i.test(page.body), 'error page contains an image');
      assert(!/<a\s/i.test(page.body), 'error page contains a link');
      assert(!/P\d{3}-S\d{2}/.test(page.body), 'error page contains a slideshow ID');
    });
  }

  await test('Router: normalizes lowercase and padded IDs to the same slideshow', async () => {
    for (const route of ['/exec?slide=p001-s01', '/exec?slide=%20P001-S01%20', '/exec?slide=P001-S01%20']) {
      const page = await fetchText(base + route);
      assertEqual(page.body, canonical.body, route + ' differs from canonical');
    }
  });

  await test('Router: decodes an encoded slide key and still requires exactly one', async () => {
    const valid = await fetchText(base + '/exec?%73lide=P001-S01');
    assertEqual(valid.body, canonical.body, 'encoded key should serve the slideshow');
    const repeated = await fetchText(base + '/exec?slide=P001-S01&%73lide=P001-S01');
    assertEqual(repeated.body, NOT_FOUND_HTML, 'encoded repeated key should be rejected');
  });

  await test('Router: exposes no other route or file listing', async () => {
    for (const route of ['/', '/index.html', '/gallery', '/preview/P001-S01.html', '/P001-S01']) {
      const page = await fetchText(base + route);
      assertEqual(page.status, 404, route + ' status');
      assert(!/<img|<iframe|<a\s/i.test(page.body), route + ' exposed markup');
    }
  });

  await test('Server: repeated requests are byte-identical (stateless rendering)', async () => {
    const second = await fetchText(canonicalUrl);
    assertEqual(sha256(second.body), sha256(canonical.body), 'response hash');
    assertEqual(second.body.length, canonical.body.length, 'response length');
  });

  await test('Server: concurrent valid and invalid requests do not interfere', async () => {
    const [a, b, c, d] = await Promise.all([
      fetchText(canonicalUrl),
      fetchText(base + '/exec?slide=P999-S99'),
      fetchText(canonicalUrl),
      fetchText(base + '/exec?slide=P001-S01&slide=P002-S01')
    ]);
    assertEqual(a.body, canonical.body, 'valid A');
    assertEqual(c.body, canonical.body, 'valid C');
    assertEqual(b.body, NOT_FOUND_HTML, 'invalid B');
    assertEqual(d.body, NOT_FOUND_HTML, 'invalid D');
  });

  // ----------------------------------------------------------- browser tests
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const browserVersion = browser.version();
  const context = await newBlockedContext(browser, { viewport: { width: 1335, height: 805 } });
  const page = await context.newPage();
  await page.bringToFront();
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  await page.goto(canonicalUrl, { waitUntil: 'domcontentloaded' });
  await waitForSlides(page);
  await wait(200);

  await test('Browser: renders 17 slides, 17 dots, counter 1 / 17, and exact URLs', async () => {
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
        objectFit: getComputedStyle(first).objectFit,
        radius: getComputedStyle(container).borderRadius,
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        scrollHeight: document.documentElement.scrollHeight,
        clientHeight: document.documentElement.clientHeight,
        localStorage: (() => { try { return window.localStorage.length; } catch (error) { return 'blocked'; } })(),
        sessionStorage: (() => { try { return window.sessionStorage.length; } catch (error) { return 'blocked'; } })(),
        cookie: (() => { try { return document.cookie; } catch (error) { return 'blocked'; } })()
      };
    });
    assertEqual(state.slides, TOTAL, 'slides');
    assertEqual(state.dots, TOTAL, 'dots');
    assertEqual(state.counter, '1 / 17', 'counter');
    assertEqual(state.activeDot, 0, 'active dot');
    state.srcs.forEach((src, index) => assertEqual(src, EXPECTED_URLS[index], 'image ' + (index + 1)));
    assertEqual(state.objectFit, 'cover', 'object-fit');
    assertEqual(state.radius, '20px', 'container radius');
    assertEqual(state.scrollWidth, state.clientWidth, 'horizontal scroll width');
    assertEqual(state.scrollHeight, state.clientHeight, 'vertical scroll height');
    assertEqual(state.localStorage, 0, 'localStorage entries');
    assertEqual(state.sessionStorage, 0, 'sessionStorage entries');
    assertEqual(state.cookie, '', 'cookies');
  });

  await test('Browser: embed has no scrollbars at 1335 x 805', async () => {
    const metrics = await page.evaluate(() => ({
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      scrollWidth: document.documentElement.scrollWidth,
      scrollHeight: document.documentElement.scrollHeight
    }));
    assertEqual(metrics.innerWidth, 1335, 'inner width');
    assertEqual(metrics.innerHeight, 805, 'inner height');
    assert(metrics.scrollWidth <= metrics.innerWidth, 'horizontal overflow');
    assert(metrics.scrollHeight <= metrics.innerHeight, 'vertical overflow');
  });

  await test('Browser: next advances one slide, dot, and transform', async () => {
    await page.click('.next');
    await waitForCounter(page, '2 / 17');
    assertEqual(await activeDot(page), 1, 'active dot');
    assertEqual(await transformValue(page), 'translateX(-100vw)', 'transform');
    await wait(100);
  });

  await test('Browser: dots jump directly to a slide', async () => {
    await page.click('.dot:nth-child(10)');
    await waitForCounter(page, '10 / 17');
    assertEqual(await activeDot(page), 9, 'active dot');
    assertEqual(await transformValue(page), 'translateX(-900vw)', 'transform');
  });

  await test('Browser: previous and wrap-around navigation match the original behavior', async () => {
    await page.click('.prev');
    await waitForCounter(page, '9 / 17');
    await page.click('.dot:nth-child(1)');
    await waitForCounter(page, '1 / 17');
    await page.click('.prev');
    await waitForCounter(page, '17 / 17');
    assertEqual(await activeDot(page), 16, 'last dot');
    await page.click('.next');
    await waitForCounter(page, '1 / 17');
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

  await test('Browser: native fullscreen exit restores normal layout', async () => {
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
    assertEqual(Math.round(layout.width), 1335, 'container width');
    assertEqual(Math.round(layout.height), 805, 'container height');
    assertEqual(layout.radius, '20px', 'restored radius');
    assert(layout.scrollWidth <= 1335, 'horizontal overflow after exit');
    assert(layout.scrollHeight <= 805, 'vertical overflow after exit');
  });

  await test('Browser: no uncaught JavaScript errors', () => {
    assertEqual(pageErrors.length, 0, 'page errors: ' + pageErrors.join(' | '));
  });

  // ------------------------------------------------- forced fallback tests
  const fallbackPage = await context.newPage();
  await fallbackPage.bringToFront();
  await fallbackPage.goto(canonicalUrl, { waitUntil: 'domcontentloaded' });
  await waitForSlides(fallbackPage);
  await fallbackPage.evaluate(() => {
    const container = document.getElementById('slideshow');
    container.requestFullscreen = () => Promise.reject(new Error('fullscreen denied'));
  });

  await test('Fallback: denied native request activates theater mode locally', async () => {
    await fallbackPage.click('#fullscreenBtn');
    await fallbackPage.waitForTimeout(500);
    const state = await fullscreenState(fallbackPage);
    assertEqual(state.native, null, 'native fullscreen should be absent');
    assertEqual(state.theater, true, 'theater mode');
    assertEqual(state.aria, 'Exit fullscreen', 'button label');
    assertEqual(state.note, false, 'fallback note absent');
    assertEqual(state.noteVisible, false, 'fallback note not visible');
  });

  await test('Fallback: second click exits theater mode and clears the state', async () => {
    await fallbackPage.click('#fullscreenBtn');
    await fallbackPage.waitForTimeout(500);
    const state = await fullscreenState(fallbackPage);
    assertEqual(state.theater, false, 'theater mode after exit');
    assertEqual(state.aria, 'Enter fullscreen', 'button label after exit');
  });

  await test('Fallback: missing Fullscreen API activates theater mode without errors', async () => {
    const noApiPage = await context.newPage();
    await noApiPage.bringToFront();
    const errors = [];
    noApiPage.on('pageerror', error => errors.push(error.message));
    await noApiPage.goto(canonicalUrl, { waitUntil: 'domcontentloaded' });
    await waitForSlides(noApiPage);
    await noApiPage.evaluate(() => {
      const container = document.getElementById('slideshow');
      container.requestFullscreen = undefined;
      container.webkitRequestFullscreen = undefined;
      container.mozRequestFullScreen = undefined;
      container.msRequestFullscreen = undefined;
    });
    await noApiPage.click('#fullscreenBtn');
    await noApiPage.waitForTimeout(400);
    const state = await fullscreenState(noApiPage);
    assertEqual(state.theater, true, 'theater mode');
    assertEqual(state.aria, 'Exit fullscreen', 'button label');
    assertEqual(errors.length, 0, 'page errors: ' + errors.join(' | '));
    await noApiPage.close();
  });

  // ----------------------------------------------------- two-iframe isolation
  const isolationPage = await context.newPage();
  await isolationPage.bringToFront();
  const isolationErrors = [];
  isolationPage.on('pageerror', error => isolationErrors.push(error.message));

  // Two instances of the same pilot slideshow at different widths. The test
  // harness is local only and is never written to the deployment outputs.
  const safeHarness = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
body{margin:0;background:#222;display:flex;gap:16px;padding:16px;align-items:flex-start}
iframe{border:0;border-radius:20px;overflow:hidden;background:#111}
</style></head><body>
<iframe id="left" src="${canonicalUrl}" width="660" height="398"
        allowfullscreen allow="fullscreen"></iframe>
<iframe id="right" src="${canonicalUrl}" width="500" height="398"
        allowfullscreen allow="fullscreen"></iframe>
</body></html>`;

  await isolationPage.setContent(safeHarness, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await isolationPage.waitForFunction(() => document.querySelectorAll('iframe').length === 2, null,
    { timeout: 10000 });
  await isolationPage.waitForTimeout(500);
  const frames = isolationPage.frames().filter(frame =>
    frame !== isolationPage.mainFrame() && frame.url().startsWith(base + '/exec'));
  assertEqual(frames.length, 2, 'iframe count');
  const left = frames[0];
  const right = frames[1];
  await waitForSlides(left);
  await waitForSlides(right);
  await waitForCounter(left, '1 / 17');
  await waitForCounter(right, '1 / 17');

  await test('Isolation: each iframe renders its own independent first slide', async () => {
    assertEqual(await counter(left), '1 / 17', 'left counter');
    assertEqual(await counter(right), '1 / 17', 'right counter');
    const widths = await isolationPage.evaluate(() => [
      document.getElementById('left').getBoundingClientRect().width,
      document.getElementById('right').getBoundingClientRect().width
    ]);
    assert(widths[0] !== widths[1], 'iframes did not keep distinct widths');
  });

  await test('Isolation: navigating one iframe does not change the other', async () => {
    await left.click('.next');
    await left.click('.next');
    await waitForCounter(left, '3 / 17');
    assertEqual(await counter(right), '1 / 17', 'right counter after left navigation');
    await right.click('.dot:nth-child(8)');
    await waitForCounter(right, '8 / 17');
    assertEqual(await counter(left), '3 / 17', 'left counter after right navigation');
    assertEqual(await activeDot(left), 2, 'left active dot');
    assertEqual(await activeDot(right), 7, 'right active dot');
  });

  await test('Isolation: hover state does not leak between iframes', async () => {
    await isolationPage.mouse.move(2, 2);
    await isolationPage.waitForTimeout(500);
    const leftHidden = await left.evaluate(() =>
      getComputedStyle(document.querySelector('.prev')).opacity);
    const rightHidden = await right.evaluate(() =>
      getComputedStyle(document.querySelector('.prev')).opacity);
    assertEqual(leftHidden, '0', 'left arrow opacity without hover');
    assertEqual(rightHidden, '0', 'right arrow opacity without hover');
    await right.hover('#slideshow');
    await isolationPage.waitForTimeout(500);
    const leftStillHidden = await left.evaluate(() =>
      getComputedStyle(document.querySelector('.prev')).opacity);
    const rightShown = await right.evaluate(() =>
      getComputedStyle(document.querySelector('.prev')).opacity);
    assertEqual(leftStillHidden, '0', 'left arrow opacity while hovering right');
    assertEqual(rightShown, '1', 'right arrow opacity while hovered');
  });

  await test('Isolation: fullscreen in one iframe leaves the other unchanged', async () => {
    await left.click('#fullscreenBtn');
    await isolationPage.waitForTimeout(600);
    const leftState = await fullscreenState(left);
    assert(leftState.native === 'slideshow' || leftState.theater,
      'left iframe did not enter fullscreen or theater mode');
    assertEqual(await counter(left), '3 / 17', 'left counter during fullscreen');
    assertEqual(await counter(right), '8 / 17', 'right counter during left fullscreen');
    const rightState = await fullscreenState(right);
    assertEqual(rightState.native, null, 'right iframe fullscreen element');
    assertEqual(rightState.theater, false, 'right iframe theater mode');
    await left.click('#fullscreenBtn');
    await isolationPage.waitForTimeout(500);
    assertEqual((await fullscreenState(left)).native, null, 'left fullscreen after exit');
  });

  await test('Isolation: reloading one iframe does not reset the other', async () => {
    await right.goto(canonicalUrl, { waitUntil: 'domcontentloaded' });
    await waitForSlides(right);
    await waitForCounter(right, '1 / 17');
    assertEqual(await counter(left), '3 / 17', 'left counter after right reload');
  });

  await test('Isolation: neither iframe writes navigation state to storage', async () => {
    for (const [name, frame] of [['left', left], ['right', right]]) {
      const storage = await storageSnapshot(frame);
      assert(storage.localStorage.entries === 0 || storage.localStorage.blocked,
        name + ' localStorage entries: ' + JSON.stringify(storage.localStorage));
      assert(storage.sessionStorage.entries === 0 || storage.sessionStorage.blocked,
        name + ' sessionStorage entries: ' + JSON.stringify(storage.sessionStorage));
      assert(storage.cookie === '' || storage.cookie === 'blocked',
        name + ' cookies: ' + storage.cookie);
    }
  });

  await test('Isolation: no uncaught errors in the two-iframe page', () => {
    assertEqual(isolationErrors.length, 0, 'page errors: ' + isolationErrors.join(' | '));
  });

  // ------------------------------------------------------ two visitor contexts
  await test('Isolation: two browser contexts keep independent slides simultaneously', async () => {
    const visitorA = await newBlockedContext(browser);
    const visitorB = await newBlockedContext(browser);
    const pageA = await visitorA.newPage();
    const pageB = await visitorB.newPage();
    await pageA.bringToFront();
    await pageB.bringToFront();
    await pageA.goto(canonicalUrl, { waitUntil: 'domcontentloaded' });
    await pageB.goto(canonicalUrl, { waitUntil: 'domcontentloaded' });
    await waitForSlides(pageA);
    await waitForSlides(pageB);
    for (let i = 0; i < 3; i++) await pageA.click('.next');
    await waitForCounter(pageA, '4 / 17');
    for (let i = 0; i < 8; i++) await pageB.click('.next');
    await waitForCounter(pageB, '9 / 17');
    assertEqual(await counter(pageA), '4 / 17', 'visitor A counter');
    assertEqual(await counter(pageB), '9 / 17', 'visitor B counter');
    const cookieA = (await storageSnapshot(pageA)).cookie;
    const cookieB = (await storageSnapshot(pageB)).cookie;
    assertEqual(cookieA, '', 'visitor A cookies');
    assertEqual(cookieB, '', 'visitor B cookies');
    await visitorA.close();
    await visitorB.close();
  });

  await context.close();
  await browser.close();
  await new Promise(resolve => server.close(resolve));

  const report = {
    pilot: 'P001-S01',
    generatedAt: new Date().toISOString(),
    browser: 'Chrome ' + browserVersion,
    viewport: '1335 x 805',
    imageCount: TOTAL,
    embedHeight: SLIDE.embed_height,
    checks: results.length,
    passed: results.length - failures.length,
    failed: failures.length,
    failures,
    fullscreen: 'native tested; denial and missing-API fallbacks tested',
    images: 'no imgur request was made; browser image routes were aborted; ' +
      'the audited URLs were verified from the DOM and static files only',
    imageRequestsBlocked: blockedImageRequests,
    results
  };

  const reportFile = path.join(RESULTS_DIR, 'pilot-test-results.json');
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2) + '\n', 'utf8');

  console.log(JSON.stringify({
    pilot: report.pilot,
    browser: report.browser,
    checks: report.checks,
    passed: report.passed,
    failed: report.failed,
    failures: report.failures,
    evidence: path.relative(ROOT, RESULTS_DIR),
    report: path.relative(ROOT, reportFile)
  }, null, 2));

  if (failures.length) process.exit(1);
}

main().catch(error => {
  console.error('ERROR: ' + error.stack);
  process.exit(1);
});
