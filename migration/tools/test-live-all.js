#!/usr/bin/env node
'use strict';

/**
 * Live Apps Script batch suite — all 47 slideshows.
 *
 * Each slideshow is loaded in a fresh iframe with the same allowfullscreen /
 * allow="fullscreen" attributes as the Behance snippet. Full-width frames use
 * the 987 px Behance column width measured on the real page; fixed-width
 * frames use their audited pixel width. Every image request is aborted.
 *
 * Usage: node test-live-all.js <deployment-url>
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');

const ROOT = path.resolve(__dirname, '..');
const CONFIG = JSON.parse(fs.readFileSync(
  path.join(ROOT, '01_AUDIT', 'slides.config.json'), 'utf8'));
const DATA_DIR = path.join(ROOT, '03_REBUILT_SLIDESHOWS', 'data');
const RESULTS_DIR = path.join(ROOT, '01_AUDIT', 'evidence', 'phase2-bulk');
const BEHANCE_COLUMN = 987;

const url = process.argv[2];
if (!url || !/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url)) {
  console.error('Usage: node test-live-all.js <https://script.google.com/macros/s/.../exec>');
  process.exit(2);
}

const slides = CONFIG.slideshows.map(source => {
  const data = JSON.parse(fs.readFileSync(
    path.join(DATA_DIR, source.slideshow_id + '.json'), 'utf8'));
  return {
    id: source.slideshow_id,
    project: source.project_id,
    width: data.embed_width >= 1200 ? BEHANCE_COLUMN : Math.min(data.embed_width, BEHANCE_COLUMN),
    height: data.embed_height,
    urls: data.images.map(image => image.src),
    total: data.images.length
  };
});

let blockedImages = 0;
const results = [];
const failures = [];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertEqual(actual, expected, label) {
  assert(actual === expected, label + ': expected ' + JSON.stringify(expected) +
    ', got ' + JSON.stringify(actual));
}

function wait(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
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

async function findWrapperFrame(page, timeout) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    for (const frame of page.frames()) {
      if (!frame.url().startsWith('https://script.google.com/macros/s/')) continue;
      try {
        const hasWrapper = await frame.evaluate(() => Boolean(document.getElementById('sandboxFrame')));
        if (hasWrapper) return frame;
      } catch (error) {
        // Try again.
      }
    }
    await wait(250);
  }
  return null;
}

async function routerCheck(query) {
  const response = await fetch(url + query, { redirect: 'follow' });
  const html = await response.text();
  return {
    query,
    status: response.status,
    unavailable: html.includes('Slideshow unavailable')
  };
}

async function runSlide(context, slide, checks) {
  const page = await context.newPage();
  await page.setViewportSize({
    width: slide.width + 60,
    height: Math.min(slide.height + 100, 2000)
  });
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  try {
    const html = [
      '<!DOCTYPE html><html><body style="margin:0;background:#222">',
      '<iframe id="embed" src="' + url + '?slide=' + slide.id + '" width="' + slide.width +
        '" height="' + slide.height + '"',
      ' style="border:0;border-radius:20px;overflow:hidden"',
      ' allowfullscreen allow="fullscreen"></iframe>',
      '</body></html>'
    ].join('');

    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    const frame = await findSlideshowFrame(page, 45000);
    const wrapper = await findWrapperFrame(page, 20000);
    checks.push({ name: slide.id + ': reaches the live slideshow frame', passed: Boolean(frame) });
    assert(frame, 'live slideshow frame did not load');
    checks.push({ name: slide.id + ': reaches the Apps Script wrapper', passed: Boolean(wrapper) });
    assert(wrapper, 'Apps Script wrapper did not load');

    await frame.waitForFunction(expected => {
      return document.querySelectorAll('.slide').length === expected &&
        document.querySelectorAll('.dot').length === expected;
    }, slide.total, { timeout: 45000, polling: 100 });

    const embedRect = await page.evaluate(() => {
      const rect = document.getElementById('embed').getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    });
    assertEqual(embedRect.width, slide.width, 'embed width');
    assertEqual(embedRect.height, slide.height, 'embed height');

    const wrapperState = await wrapper.evaluate(() => {
      const banner = document.getElementById('warning');
      const sandbox = document.getElementById('sandboxFrame');
      return {
        bannerHeight: banner ? banner.getBoundingClientRect().height : null,
        sandboxHeight: sandbox ? sandbox.getBoundingClientRect().height : null
      };
    });
    checks.push({
      name: slide.id + ': no visible Google banner',
      passed: wrapperState.bannerHeight === 0,
      detail: wrapperState.bannerHeight + ' px'
    });
    assertEqual(wrapperState.bannerHeight, 0, 'banner height');
    checks.push({
      name: slide.id + ': sandbox receives the full ' + slide.height + ' px',
      passed: wrapperState.sandboxHeight === slide.height,
      detail: wrapperState.sandboxHeight + ' px'
    });
    assertEqual(wrapperState.sandboxHeight, slide.height, 'sandbox height');

    const initial = await frame.evaluate(() => {
      const images = Array.from(document.querySelectorAll('.slide img'));
      return {
        innerWidth,
        innerHeight,
        slides: document.querySelectorAll('.slide').length,
        dots: document.querySelectorAll('.dot').length,
        counter: document.getElementById('pageNumber').textContent,
        activeDot: Array.from(document.querySelectorAll('.dot'))
          .findIndex(dot => dot.classList.contains('active')),
        srcs: images.map(image => image.src),
        eager: images.every(image => image.getAttribute('loading') === 'eager'),
        fullscreenButton: Boolean(document.getElementById('fullscreenBtn')),
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        scrollHeight: document.documentElement.scrollHeight,
        clientHeight: document.documentElement.clientHeight
      };
    });

    assertEqual(initial.innerWidth, slide.width, 'live viewport width');
    assertEqual(initial.innerHeight, slide.height, 'live viewport height');
    assertEqual(initial.slides, slide.total, 'live slides');
    assertEqual(initial.dots, slide.total, 'live dots');
    assertEqual(initial.counter, '1 / ' + slide.total, 'live counter');
    assertEqual(initial.activeDot, 0, 'live active dot');
    assertEqual(initial.srcs.length, slide.total, 'live image count');
    initial.srcs.forEach((src, index) =>
      assertEqual(src, slide.urls[index], 'live image ' + (index + 1)));
    assert(initial.eager, 'live image is not eager');
    assert(initial.fullscreenButton, 'live fullscreen button is missing');
    assertEqual(initial.scrollWidth, initial.clientWidth, 'live horizontal overflow');
    assertEqual(initial.scrollHeight, initial.clientHeight, 'live vertical overflow');
    checks.push({ name: slide.id + ': live URLs, dots, counter, and dimensions pass', passed: true });

    await frame.click('.next');
    await frame.waitForFunction(expected => {
      return document.getElementById('pageNumber').textContent === '2 / ' + expected;
    }, slide.total, { timeout: 15000, polling: 100 });
    const afterNext = await frame.evaluate(() => ({
      counter: document.getElementById('pageNumber').textContent,
      active: Array.from(document.querySelectorAll('.dot'))
        .findIndex(dot => dot.classList.contains('active')),
      transform: document.getElementById('slidesContainer').style.transform
    }));
    assertEqual(afterNext.counter, '2 / ' + slide.total, 'live counter after next');
    assertEqual(afterNext.active, 1, 'live active dot after next');
    assertEqual(afterNext.transform, 'translateX(-100vw)', 'live transform after next');

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
    assert((fullscreen.native && fullscreen.targetIsContainer) || fullscreen.theater,
      'live fullscreen did not activate: ' + JSON.stringify(fullscreen));
    checks.push({
      name: slide.id + ': live fullscreen targets the slideshow',
      passed: true,
      detail: JSON.stringify(fullscreen)
    });

    await frame.click('#fullscreenBtn');
    await wait(900);
    const exited = await frame.evaluate(() => ({
      native: Boolean(document.fullscreenElement),
      theater: document.getElementById('slideshow').classList.contains('theater-mode'),
      aria: document.getElementById('fullscreenBtn').getAttribute('aria-label')
    }));
    assert(!exited.native && !exited.theater, 'live fullscreen did not exit');
    assertEqual(exited.aria, 'Enter fullscreen', 'live fullscreen label after exit');

    assertEqual(pageErrors.length, 0, 'live page errors: ' + pageErrors.join(' | '));
    checks.push({ name: slide.id + ': live navigation and fullscreen pass', passed: true });
  } finally {
    await page.close();
  }
}

async function main() {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const browserVersion = browser.version();
  const context = await browser.newContext({ locale: 'en-US' });
  await context.route('https://i.imgur.com/**', route => {
    blockedImages += 1;
    return route.abort();
  });
  await context.route('https://fonts.googleapis.com/**', route => route.fulfill({
    status: 200,
    contentType: 'text/css; charset=utf-8',
    body: ''
  }));
  await context.route('https://fonts.gstatic.com/**', route => route.abort());

  const retriedSlides = [];
  for (const slide of slides) {
    let completed = false;
    for (let attempt = 1; attempt <= 2 && !completed; attempt++) {
      const checks = [];
      try {
        await runSlide(context, slide, checks);
        results.push({ id: slide.id, passed: true, attempts: attempt, checks });
        if (attempt > 1) retriedSlides.push(slide.id);
        completed = true;
      } catch (error) {
        checks.push({ name: slide.id + ': attempt ' + attempt + ' failed', passed: false,
          detail: error.message });
        if (attempt === 2) {
          results.push({ id: slide.id, passed: false, attempts: attempt, checks,
            error: error.message });
          failures.push(slide.id + ': ' + error.message);
          completed = true;
        } else {
          console.log('RETRY ' + slide.id + ' — ' + error.message);
          await wait(1500);
        }
      }
    }
    console.log((results[results.length - 1].passed ? 'PASS  ' : 'FAIL  ') +
      slide.id + ' (' + slide.width + 'x' + slide.height + ', ' + slide.total + ' images)');
    await wait(200);
  }

  const routerChecks = [];
  for (const query of ['', '?slide=NOPE-S99', '?slide=P001-S01&slide=P001-S01']) {
    const check = await routerCheck(query);
    routerChecks.push({
      name: 'live router rejects ' + (query || '(missing slide)'),
      passed: check.status === 200 && check.unavailable,
      detail: 'HTTP ' + check.status
    });
  }

  await browser.close();

  const allChecks = [...results.flatMap(result => result.checks), ...routerChecks];
  const failedChecks = allChecks.filter(check => !check.passed);
  const report = {
    url,
    scope: {
      slideshows: slides.length,
      projects: new Set(slides.map(slide => slide.project)).size,
      imageSlots: slides.reduce((sum, slide) => sum + slide.total, 0),
      behanceColumn: BEHANCE_COLUMN
    },
    browser: 'Chrome ' + browserVersion,
    checks: allChecks.length,
    passed: allChecks.length - failedChecks.length,
    failed: failedChecks.length,
    slideshowsPassed: results.filter(result => result.passed).length,
    slideshowsFailed: results.filter(result => !result.passed).length,
    retriedSlides,
    blockedImages,
    failures,
    routerChecks,
    results
  };
  const reportFile = path.join(RESULTS_DIR, 'bulk-live-test-results.json');
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2) + '\n', 'utf8');

  console.log(JSON.stringify({
    scope: report.scope,
    browser: report.browser,
    checks: report.checks,
    passed: report.passed,
    failed: report.failed,
    slideshowsPassed: report.slideshowsPassed,
    slideshowsFailed: report.slideshowsFailed,
    retriedSlides,
    blockedImages,
    report: path.relative(ROOT, reportFile)
  }, null, 2));

  if (failures.length) process.exit(1);
}

main().catch(error => {
  console.error('ERROR: ' + error.stack);
  process.exit(1);
});
