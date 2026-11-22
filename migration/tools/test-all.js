#!/usr/bin/env node
'use strict';

/**
 * All-slideshow local browser and router suite.
 *
 * Exercises every audited slideshow through the local router emulator:
 *  - exact image URLs and order, eager loading, no downloads;
 *  - the audited dimensions and no scrollbars;
 *  - dots, counter, next/previous, dot jumps, and wrap-around;
 *  - hover-revealed arrows, counter, and side shadows;
 *  - native fullscreen (or the theater fallback) and a clean exit;
 *  - no storage, messaging, nested embeds, or page errors.
 *
 * Every i.imgur.com request is aborted. Font stylesheets are fulfilled with an
 * empty stylesheet so the behavioral suite never waits on a third-party font.
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');
const { createPilotServer, NOT_FOUND_HTML } = require('./serve');

const ROOT = path.resolve(__dirname, '..');
const CONFIG = JSON.parse(fs.readFileSync(
  path.join(ROOT, '01_AUDIT', 'slides.config.json'), 'utf8'));
const DATA_DIR = path.join(ROOT, '03_REBUILT_SLIDESHOWS', 'data');
const RESULTS_DIR = path.join(ROOT, '01_AUDIT', 'evidence', 'phase2-bulk');

const slides = CONFIG.slideshows.map(source => {
  const data = JSON.parse(fs.readFileSync(
    path.join(DATA_DIR, source.slideshow_id + '.json'), 'utf8'));
  const firstImage = data.images[0];
  const imageAspect = firstImage.w / firstImage.h;
  return {
    id: source.slideshow_id,
    project: source.project_id,
    width: data.embed_width,
    height: data.embed_height,
    fit: data.layout === 'fit',
    cardHeight: Math.min(data.embed_width / imageAspect, data.embed_height),
    urls: data.images.map(image => image.src),
    total: data.images.length
  };
});

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

function assertClose(actual, expected, tolerance, label) {
  assert(Math.abs(actual - expected) <= tolerance, label + ': expected ' +
    expected + ' +/- ' + tolerance + ', got ' + actual);
}

function wait(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

async function fetchText(url) {
  const response = await fetch(url, { redirect: 'follow' });
  return { status: response.status, headers: response.headers, body: await response.text() };
}

function imageSources(html) {
  return Array.from(html.matchAll(/<img\s+src="([^"]+)"/g)).map(match => match[1]);
}

async function blockAssets(context) {
  await context.route('https://i.imgur.com/**', route => {
    blockedImageRequests += 1;
    return route.abort();
  });
  await context.route('https://fonts.googleapis.com/**', route => route.fulfill({
    status: 200,
    contentType: 'text/css; charset=utf-8',
    body: ''
  }));
  await context.route('https://fonts.gstatic.com/**', route => route.abort());
}

async function waitForSlides(page, total) {
  await page.waitForFunction(expected => {
    return document.querySelectorAll('.slide').length === expected &&
      document.querySelectorAll('.dot').length === expected;
  }, total, { timeout: 30000, polling: 100 });
}

async function waitForCounter(page, expected) {
  await page.waitForFunction(value => {
    return document.getElementById('pageNumber').textContent === value;
  }, expected, { timeout: 10000, polling: 100 });
}

async function counter(page) {
  return page.evaluate(() => document.getElementById('pageNumber').textContent);
}

async function activeDot(page) {
  return page.evaluate(() => Array.from(document.querySelectorAll('.dot'))
    .findIndex(dot => dot.classList.contains('active')));
}

async function transformValue(page) {
  return page.evaluate(() => document.getElementById('slidesContainer').style.transform);
}

async function fullscreenState(page) {
  return page.evaluate(() => {
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

async function runSlide(context, base, slide, checks) {
  const page = await context.newPage();
  await page.setViewportSize({ width: slide.width, height: slide.height });
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  try {
    await page.goto(base + '/exec?slide=' + slide.id, { waitUntil: 'domcontentloaded' });
    await waitForSlides(page, slide.total);
    await wait(150);

    const initial = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('.slide img'));
      const first = images[0];
      const container = document.getElementById('slideshow');
      const dotContainer = document.getElementById('dotContainer');
      const button = document.getElementById('fullscreenBtn');
      const containerRect = container.getBoundingClientRect();
      const dotRect = dotContainer.getBoundingClientRect();
      const buttonRect = button.getBoundingClientRect();
      const style = getComputedStyle(container);
      const storage = read => {
        try {
          return window[read].length;
        } catch (error) {
          return 'blocked';
        }
      };
      return {
        slides: document.querySelectorAll('.slide').length,
        dots: document.querySelectorAll('.dot').length,
        counter: document.getElementById('pageNumber').textContent,
        activeDot: Array.from(document.querySelectorAll('.dot'))
          .findIndex(dot => dot.classList.contains('active')),
        srcs: images.map(image => image.src),
        eager: images.every(image => image.getAttribute('loading') === 'eager'),
        lazy: images.some(image => image.getAttribute('loading') === 'lazy'),
        objectFit: getComputedStyle(first).objectFit,
        layout: container.getAttribute('data-layout'),
        radius: style.borderRadius,
        paddingBottom: style.paddingBottom,
        background: style.backgroundColor,
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        scrollWidth: document.documentElement.scrollWidth,
        scrollHeight: document.documentElement.scrollHeight,
        button: {
          width: buttonRect.width,
          height: buttonRect.height,
          left: buttonRect.left,
          top: buttonRect.top,
          right: buttonRect.right,
          bottom: buttonRect.bottom
        },
        dotBox: { width: dotRect.width, left: dotRect.left, right: dotRect.right },
        containerBox: {
          top: containerRect.top,
          width: containerRect.width,
          height: containerRect.height
        },
        nested: document.querySelectorAll('iframe, embed, object').length,
        localStorage: storage('localStorage'),
        sessionStorage: storage('sessionStorage'),
        cookie: (() => { try { return document.cookie; } catch (error) { return 'blocked'; } })()
      };
    });

    checks.push({ name: slide.id + ': renders ' + slide.total + ' slides and dots',
      passed: initial.slides === slide.total && initial.dots === slide.total,
      detail: initial.slides + ' slides, ' + initial.dots + ' dots' });
    assertEqual(initial.slides, slide.total, 'slides');
    assertEqual(initial.dots, slide.total, 'dots');
    assertEqual(initial.counter, '1 / ' + slide.total, 'counter');
    assertEqual(initial.activeDot, 0, 'active dot');
    assertEqual(initial.srcs.length, slide.total, 'image count');
    initial.srcs.forEach((src, index) =>
      assertEqual(src, slide.urls[index], 'image ' + (index + 1)));
    assert(initial.eager, 'not every image is eager');
    assert(!initial.lazy, 'an image is lazy');
    const fitActive = slide.fit && slide.width <= slide.height;
    if (fitActive) {
      assertEqual(initial.layout, 'fit', 'layout');
      assertEqual(initial.objectFit, 'contain', 'object-fit');
      assertEqual(initial.paddingBottom, '0px', 'fit padding');
      assertClose(initial.containerBox.width, slide.width, 1, 'card width');
      assertClose(initial.containerBox.height, slide.cardHeight, 1, 'card height');
      assertClose(initial.containerBox.top,
        (slide.height - slide.cardHeight) / 2, 2, 'card top');
    } else {
      assertEqual(initial.objectFit, 'cover', 'object-fit');
      assertEqual(initial.paddingBottom, '50px', 'control strip padding');
      assertEqual(Math.round(initial.containerBox.width), slide.width, 'container width');
      assertEqual(Math.round(initial.containerBox.height), slide.height, 'container height');
    }
    assertEqual(initial.radius, '20px', 'container radius');
    assertEqual(initial.background, 'rgba(0, 0, 0, 0)', 'background');
    assertEqual(initial.innerWidth, slide.width, 'viewport width');
    assertEqual(initial.innerHeight, slide.height, 'viewport height');
    assert(initial.scrollWidth <= initial.innerWidth, 'horizontal overflow');
    assert(initial.scrollHeight <= initial.innerHeight, 'vertical overflow');
    assertEqual(initial.nested, 0, 'nested embeds');
    assert(initial.button.width > 0 && initial.button.height > 0, 'fullscreen button is not visible');
    assert(initial.button.left >= 0 && initial.button.top >= 0 &&
      initial.button.right <= initial.innerWidth && initial.button.bottom <= initial.innerHeight,
      'fullscreen button is outside the viewport');
    assert(initial.dotBox.width <= initial.innerWidth, 'dot container is wider than the frame');
    assert(initial.dotBox.left >= 0 && initial.dotBox.right <= initial.innerWidth,
      'dot container is outside the frame');
    assertEqual(initial.localStorage, 0, 'localStorage entries');
    assertEqual(initial.sessionStorage, 0, 'sessionStorage entries');
    assertEqual(initial.cookie, '', 'cookies');

    await page.click('.next');
    await waitForCounter(page, '2 / ' + slide.total);
    assertEqual(await activeDot(page), 1, 'active dot after next');
    assertEqual(await transformValue(page), 'translateX(-100vw)', 'transform after next');

    await page.click('.dot:nth-child(3)');
    await waitForCounter(page, '3 / ' + slide.total);
    assertEqual(await activeDot(page), 2, 'active dot after dot jump');
    assertEqual(await transformValue(page), 'translateX(-200vw)', 'transform after dot jump');

    await page.click('.prev');
    await waitForCounter(page, '2 / ' + slide.total);
    await page.click('.dot:nth-child(1)');
    await waitForCounter(page, '1 / ' + slide.total);
    await page.click('.prev');
    await waitForCounter(page, slide.total + ' / ' + slide.total);
    assertEqual(await activeDot(page), slide.total - 1, 'last dot after wrap');
    await page.click('.next');
    await waitForCounter(page, '1 / ' + slide.total);

    await page.mouse.move(5, 5);
    await page.hover('#slideshow');
    await wait(500);
    const hover = await page.evaluate(() => ({
      prev: getComputedStyle(document.querySelector('.prev')).opacity,
      next: getComputedStyle(document.querySelector('.next')).opacity,
      counter: getComputedStyle(document.getElementById('pageNumber')).opacity,
      leftShadow: getComputedStyle(document.querySelector('.side-shadow.left')).opacity,
      rightShadow: getComputedStyle(document.querySelector('.side-shadow.right')).opacity
    }));
    assertEqual(hover.prev, '1', 'shown previous arrow');
    assertEqual(hover.next, '1', 'shown next arrow');
    assertEqual(hover.counter, '1', 'shown counter');
    assertEqual(hover.leftShadow, '1', 'shown left shadow');
    assertEqual(hover.rightShadow, '1', 'shown right shadow');

    await page.click('#fullscreenBtn');
    await wait(600);
    const fullscreen = await fullscreenState(page);
    assert(fullscreen.native === 'slideshow' || fullscreen.theater,
      'fullscreen did not activate: ' + JSON.stringify(fullscreen));
    if (fullscreen.native === 'slideshow') {
      assertEqual(fullscreen.dotsInsideFullscreen, true, 'dots inside fullscreen');
    }
    assertEqual(fullscreen.aria, 'Exit fullscreen', 'fullscreen button label');
    await page.click('#fullscreenBtn');
    await wait(500);
    const exited = await fullscreenState(page);
    assertEqual(exited.native, null, 'fullscreen element after exit');
    assertEqual(exited.theater, false, 'theater mode after exit');
    assertEqual(exited.aria, 'Enter fullscreen', 'fullscreen button label after exit');

    const restored = await page.evaluate(() => {
      const container = document.getElementById('slideshow');
      const rect = container.getBoundingClientRect();
      const style = getComputedStyle(container);
      return {
        layout: container.getAttribute('data-layout'),
        top: rect.top,
        width: rect.width,
        height: rect.height,
        radius: style.borderRadius,
        paddingBottom: style.paddingBottom,
        objectFit: getComputedStyle(document.querySelector('.slide img')).objectFit,
        scrollWidth: document.documentElement.scrollWidth,
        scrollHeight: document.documentElement.scrollHeight
      };
    });
    if (fitActive) {
      assertEqual(restored.layout, 'fit', 'restored layout');
      assertEqual(restored.objectFit, 'contain', 'restored object-fit');
      assertEqual(restored.paddingBottom, '0px', 'restored fit padding');
      assertClose(restored.width, slide.width, 1, 'restored width');
      assertClose(restored.height, slide.cardHeight, 1, 'restored height');
      assertClose(restored.top, (slide.height - slide.cardHeight) / 2, 2,
        'restored card top');
    } else {
      assertEqual(restored.objectFit, 'cover', 'restored object-fit');
      assertEqual(restored.paddingBottom, '50px', 'restored control strip padding');
      assertEqual(Math.round(restored.width), slide.width, 'restored width');
      assertEqual(Math.round(restored.height), slide.height, 'restored height');
    }
    assertEqual(restored.radius, '20px', 'restored radius');
    assert(restored.scrollWidth <= slide.width, 'horizontal overflow after exit');
    assert(restored.scrollHeight <= slide.height, 'vertical overflow after exit');

    assertEqual(pageErrors.length, 0, 'page errors: ' + pageErrors.join(' | '));
    checks.push({ name: slide.id + ': navigation, hover, and fullscreen pass', passed: true });
  } finally {
    await page.close();
  }
}

async function main() {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  const server = createPilotServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;

  // ------------------------------------------------------------ router checks
  const routerChecks = [];
  for (const slide of slides) {
    const response = await fetchText(base + '/exec?slide=' + slide.id);
    routerChecks.push({
      name: slide.id + ': router returns HTTP 200 HTML',
      passed: response.status === 200 && /text\/html/.test(response.headers.get('content-type')),
      detail: response.status
    });
    const urls = imageSources(response.body);
    const ids = Array.from(new Set(response.body.match(/P\d{3}-S\d{2}/g) || []));
    routerChecks.push({
      name: slide.id + ': router returns exactly the audited URLs in order',
      passed: urls.length === slide.total && urls.every((url, index) => url === slide.urls[index]),
      detail: urls.length + ' images'
    });
    routerChecks.push({
      name: slide.id + ': router response contains no other slideshow',
      passed: ids.every(id => id === slide.id) && urls.every(url => slide.urls.includes(url)),
      detail: ids.join(', ')
    });
    routerChecks.push({
      name: slide.id + ': router response is a single slideshow, not a gallery',
      passed: !/<a\s|<iframe|<embed|<object|gallery|catalog/i.test(response.body),
      detail: 'no links, nested embeds, or gallery wording'
    });
    routerChecks.push({
      name: slide.id + ': router preserves eager loading on every image',
      passed: (response.body.match(/loading="eager"/g) || []).length === slide.total &&
        !/loading="lazy"/.test(response.body)
    });
  }

  const rejectionRoutes = [
    '/exec',
    '/exec?slide=',
    '/exec?slide=P001-S01&slide=P001-S01',
    '/exec?slide=P001-S01&slide=P011-S01',
    '/exec?slide=P001-S01,P011-S01',
    '/exec?slide=all',
    '/exec?slide=P999-S99'
  ];
  for (const route of rejectionRoutes) {
    const page = await fetchText(base + route);
    routerChecks.push({
      name: 'router rejects ' + route,
      passed: page.status === 200 && page.body === NOT_FOUND_HTML &&
        !/P\d{3}-S\d{2}/.test(page.body),
      detail: 'neutral response'
    });
  }
  const lower = await fetchText(base + '/exec?slide=p001-s01');
  routerChecks.push({
    name: 'router accepts a lowercase ID after normalization',
    passed: lower.status === 200 && imageSources(lower.body).length === 17
  });
  for (const route of ['/', '/index.html', '/preview/P001-S01.html']) {
    const page = await fetchText(base + route);
    routerChecks.push({
      name: 'router has no route for ' + route,
      passed: page.status === 404 && page.body === 'Not found'
    });
  }

  // ----------------------------------------------------------- browser checks
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const browserVersion = browser.version();
  const context = await browser.newContext();
  await blockAssets(context);

  const slideChecks = [];
  for (const slide of slides) {
    const checks = [];
    try {
      await runSlide(context, base, slide, checks);
      results.push({ id: slide.id, passed: true, checks });
    } catch (error) {
      checks.push({ name: slide.id + ': FAILED', passed: false, detail: error.message });
      results.push({ id: slide.id, passed: false, checks, error: error.message });
      failures.push(slide.id + ': ' + error.message);
    }
    console.log((results[results.length - 1].passed ? 'PASS  ' : 'FAIL  ') +
      slide.id + ' (' + slide.width + 'x' + slide.height + ', ' + slide.total + ' images)');
    slideChecks.push(...checks);
  }

  await browser.close();
  await new Promise(resolve => server.close(resolve));

  const allChecks = [...routerChecks, ...slideChecks];
  const failedChecks = allChecks.filter(check => !check.passed);
  const report = {
    scope: {
      slideshows: slides.length,
      projects: new Set(slides.map(slide => slide.project)).size,
      imageSlots: slides.reduce((sum, slide) => sum + slide.total, 0)
    },
    browser: 'Chrome ' + browserVersion,
    checks: allChecks.length,
    passed: allChecks.length - failedChecks.length,
    failed: failedChecks.length,
    slideshowsPassed: results.filter(result => result.passed).length,
    slideshowsFailed: results.filter(result => !result.passed).length,
    blockedImageRequests,
    failures,
    results
  };
  const reportFile = path.join(RESULTS_DIR, 'bulk-local-test-results.json');
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2) + '\n', 'utf8');

  console.log(JSON.stringify({
    scope: report.scope,
    browser: report.browser,
    checks: report.checks,
    passed: report.passed,
    failed: report.failed,
    slideshowsPassed: report.slideshowsPassed,
    slideshowsFailed: report.slideshowsFailed,
    blockedImageRequests,
    report: path.relative(ROOT, reportFile)
  }, null, 2));

  if (failures.length) process.exit(1);
}

main().catch(error => {
  console.error('ERROR: ' + error.stack);
  process.exit(1);
});
