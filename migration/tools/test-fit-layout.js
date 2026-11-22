#!/usr/bin/env node
'use strict';

/**
 * Phone fit-layout browser test for the gated P030-S01 pilot.
 *
 * Every imgur request is fulfilled with a synthetic 16:9 SVG so the layout can
 * be measured without downloading, viewing, copying, or rehosting any original
 * image. The test covers:
 *  - the opt-in data-layout attribute and the per-slideshow gate;
 *  - contain + blurred backdrop on portrait/tall frames (phone and the 987 px
 *    Behance column), with no overflow or duplicated image elements;
 *  - the original cover behavior on a wide landscape frame;
 *  - backdrop refresh on navigation, dots, counter, and fullscreen.
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');
const { createPilotServer } = require('./serve');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, '03_REBUILT_SLIDESHOWS', 'data');
const FIT_ID = 'P030-S01';
const CLASSIC_ID = 'P020-S01';

const fitData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, FIT_ID + '.json'), 'utf8'));
const classicData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, CLASSIC_ID + '.json'), 'utf8'));
const FIT_URLS = fitData.images.map(image => image.src);
const CLASSIC_URLS = classicData.images.map(image => image.src);

const results = [];
const failures = [];
let syntheticImageRequests = 0;

function record(name, passed, detail) {
  results.push({ name, passed, detail: detail === undefined ? null : detail });
  if (!passed) failures.push(name + (detail ? ': ' + detail : ''));
}

function assert(condition, name, detail) {
  record(name, Boolean(condition), detail);
  return Boolean(condition);
}

function assertEqual(actual, expected, name) {
  return assert(actual === expected, name,
    'expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual));
}

function wait(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
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
  }, expected, { timeout: 10000 });
}

async function state(page) {
  return page.evaluate(() => {
    const container = document.getElementById('slideshow');
    const firstSlide = document.querySelector('.slide');
    const firstImage = firstSlide ? firstSlide.querySelector('img') : null;
    const backdrop = firstSlide ? getComputedStyle(firstSlide, '::before') : null;
    const slides = Array.from(document.querySelectorAll('.slide'));
    const withBackdrop = slides
      .map((slide, index) => ({
        index,
        value: slide.style.getPropertyValue('--slide-image')
      }))
      .filter(item => item.value);
    const containerRect = container.getBoundingClientRect();
    return {
      layout: container.getAttribute('data-layout'),
      innerWidth,
      innerHeight,
      objectFit: firstImage ? getComputedStyle(firstImage).objectFit : null,
      imageCount: document.querySelectorAll('.slide img').length,
      slideCount: slides.length,
      dotCount: document.querySelectorAll('.dot').length,
      fullscreenButtons: document.querySelectorAll('#fullscreenBtn').length,
      counter: document.getElementById('pageNumber').textContent,
      activeDot: Array.from(document.querySelectorAll('.dot'))
        .findIndex(dot => dot.classList.contains('active')),
      transform: document.getElementById('slidesContainer').style.transform,
      backdropImage: backdrop ? backdrop.backgroundImage : null,
      backdropFilter: backdrop ? backdrop.filter : null,
      backdropContent: backdrop ? backdrop.content : null,
      withBackdrop,
      container: {
        width: containerRect.width,
        height: containerRect.height,
        radius: getComputedStyle(container).borderRadius
      },
      scrollWidth: document.documentElement.scrollWidth,
      scrollHeight: document.documentElement.scrollHeight
    };
  });
}

async function openSlide(context, base, id, total) {
  const page = await context.newPage();
  await page.goto(base + '/exec?slide=' + id, { waitUntil: 'domcontentloaded' });
  await waitForSlides(page, total);
  await wait(200);
  return page;
}

async function main() {
  const server = createPilotServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 1107 } });

  // A synthetic 16:9 SVG keeps the exact geometry without touching imgur.
  const syntheticSvg = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900">',
    '<rect width="1600" height="900" fill="#1d4ed8"/>',
    '<circle cx="800" cy="450" r="220" fill="#f59e0b"/>',
    '<rect x="80" y="80" width="360" height="180" fill="#ffffff" opacity="0.7"/>',
    '</svg>'
  ].join('');
  await context.route('https://i.imgur.com/**', route => {
    syntheticImageRequests += 1;
    return route.fulfill({
      status: 200,
      contentType: 'image/svg+xml',
      body: syntheticSvg
    });
  });
  await context.route('https://fonts.googleapis.com/**', route => route.fulfill({
    status: 200,
    contentType: 'text/css; charset=utf-8',
    body: ''
  }));
  await context.route('https://fonts.gstatic.com/**', route => route.abort());

  try {
    // ------------------------------------------------------------ phone portrait
    const phone = await openSlide(context, base, FIT_ID, FIT_URLS.length);
    await phone.setViewportSize({ width: 390, height: 1107 });
    await wait(200);
    const phoneState = await state(phone);

    assertEqual(phoneState.layout, 'fit', 'phone: opt-in layout attribute');
    assertEqual(phoneState.objectFit, 'contain', 'phone: whole image is contained');
    assertEqual(phoneState.imageCount, FIT_URLS.length, 'phone: no duplicate image elements');
    assertEqual(phoneState.slideCount, FIT_URLS.length, 'phone: slide count');
    assertEqual(phoneState.dotCount, FIT_URLS.length, 'phone: dot count');
    assertEqual(phoneState.fullscreenButtons, 1, 'phone: exactly one fullscreen button');
    assertEqual(phoneState.counter, '1 / ' + FIT_URLS.length, 'phone: initial counter');
    assertEqual(phoneState.activeDot, 0, 'phone: initial active dot');
    assert(phoneState.withBackdrop.length >= 1 && phoneState.withBackdrop.length <= 3,
      'phone: only the active slide and its neighbors keep a backdrop',
      JSON.stringify(phoneState.withBackdrop.map(item => item.index)));
    assert(
      phoneState.withBackdrop.some(item =>
        item.index === 0 && item.value.includes(FIT_URLS[0])),
      'phone: active backdrop reuses the first remote URL',
      JSON.stringify(phoneState.withBackdrop)
    );
    assert(/url\(/.test(phoneState.backdropImage || '') &&
      phoneState.backdropImage.includes(FIT_URLS[0]),
      'phone: ::before resolves the same image URL',
      phoneState.backdropImage);
    assert(/blur\(/.test(phoneState.backdropFilter || ''),
      'phone: ::before applies a blur filter',
      phoneState.backdropFilter);
    assertEqual(phoneState.backdropContent, '""', 'phone: ::before is generated');
    assert(phoneState.scrollWidth <= phoneState.innerWidth,
      'phone: no horizontal overflow',
      phoneState.scrollWidth + ' vs ' + phoneState.innerWidth);
    assert(phoneState.scrollHeight <= phoneState.innerHeight,
      'phone: no vertical overflow',
      phoneState.scrollHeight + ' vs ' + phoneState.innerHeight);
    assertEqual(Math.round(phoneState.container.width), 390, 'phone: container width');
    assertEqual(Math.round(phoneState.container.height), 1107, 'phone: container height');
    assertEqual(phoneState.container.radius, '20px', 'phone: container radius');

    // Navigation keeps the backdrop in sync and never duplicates the image.
    await phone.click('.next');
    await waitForCounter(phone, '2 / ' + FIT_URLS.length);
    await wait(150);
    const phoneNext = await state(phone);
    assertEqual(phoneNext.counter, '2 / ' + FIT_URLS.length, 'phone: next counter');
    assertEqual(phoneNext.activeDot, 1, 'phone: next active dot');
    assertEqual(phoneNext.transform, 'translateX(-100vw)', 'phone: next transform');
    assertEqual(phoneNext.imageCount, FIT_URLS.length, 'phone: image count after next');
    assert(
      phoneNext.withBackdrop.some(item =>
        item.index === 1 && item.value.includes(FIT_URLS[1])),
      'phone: second slide backdrop uses the second remote URL',
      JSON.stringify(phoneNext.withBackdrop)
    );

    await phone.click('.dot:nth-child(4)');
    await waitForCounter(phone, '4 / ' + FIT_URLS.length);
    await wait(150);
    const phoneLast = await state(phone);
    assertEqual(phoneLast.counter, '4 / ' + FIT_URLS.length, 'phone: dot jump counter');
    assertEqual(phoneLast.activeDot, 3, 'phone: dot jump active dot');
    assert(
      phoneLast.withBackdrop.some(item =>
        item.index === 3 && item.value.includes(FIT_URLS[3])),
      'phone: last slide backdrop uses the fourth remote URL',
      JSON.stringify(phoneLast.withBackdrop)
    );

    // Fullscreen remains exactly one button and targets the slideshow.
    await phone.click('#fullscreenBtn');
    await wait(500);
    const fullscreen = await phone.evaluate(() => {
      const element = document.fullscreenElement;
      return {
        native: Boolean(element),
        target: element ? element.id : null,
        theater: document.getElementById('slideshow').classList.contains('theater-mode'),
        aria: document.getElementById('fullscreenBtn').getAttribute('aria-label')
      };
    });
    assert((fullscreen.native && fullscreen.target === 'slideshow') || fullscreen.theater,
      'phone: fullscreen enters native or theater mode', JSON.stringify(fullscreen));
    await phone.keyboard.press('Escape');
    await wait(400);
    await phone.close();

    // ------------------------------------------ Behance column (987 x 1107)
    const column = await openSlide(context, base, FIT_ID, FIT_URLS.length);
    await column.setViewportSize({ width: 987, height: 1107 });
    await wait(200);
    const columnState = await state(column);
    assertEqual(columnState.objectFit, 'contain',
      'Behance column: tall frame uses contain');
    assert(columnState.withBackdrop.length >= 1,
      'Behance column: backdrop is present');
    await column.close();

    // ------------------------------------------------- wide landscape frame
    const desktop = await openSlide(context, base, FIT_ID, FIT_URLS.length);
    await desktop.setViewportSize({ width: 1335, height: 1107 });
    await wait(200);
    const desktopState = await state(desktop);
    assertEqual(desktopState.objectFit, 'cover',
      'wide frame: original cover behavior is preserved');
    assertEqual(desktopState.withBackdrop.length, 0,
      'wide frame: no backdrop is created');
    assertEqual(desktopState.backdropImage, 'none',
      'wide frame: ::before has no background image');
    await desktop.close();

    // ------------------------------------------------- non-gated slideshow
    const classic = await openSlide(context, base, CLASSIC_ID, CLASSIC_URLS.length);
    await classic.setViewportSize({ width: 390, height: 1052 });
    await wait(200);
    const classicState = await state(classic);
    assertEqual(classicState.layout, '',
      'non-gated slideshow: no fit layout attribute');
    assertEqual(classicState.objectFit, 'cover',
      'non-gated slideshow: cover behavior is unchanged on a phone');
    assertEqual(classicState.withBackdrop.length, 0,
      'non-gated slideshow: no backdrop is created');
    assertEqual(classicState.fullscreenButtons, 1,
      'non-gated slideshow: exactly one fullscreen button');
    await classic.close();

    assert(syntheticImageRequests > 0,
      'layout test used synthetic local images only',
      syntheticImageRequests + ' synthetic requests');
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }

  const passed = results.filter(result => result.passed).length;
  console.log(JSON.stringify({
    scope: {
      fitSlideshow: FIT_ID,
      classicSlideshow: CLASSIC_ID,
      syntheticImageRequests
    },
    checks: results.length,
    passed,
    failed: results.length - passed,
    failures,
    results
  }, null, 2));
  if (failures.length) process.exit(1);
}

main().catch(error => {
  console.error('ERROR: ' + error.stack);
  process.exit(1);
});
