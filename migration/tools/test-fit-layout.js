#!/usr/bin/env node
'use strict';

/**
 * Phone fit-layout browser test for the global fit layout.
 *
 * Every imgur request is fulfilled with a synthetic 16:9 SVG so the layout can
 * be measured without downloading, viewing, copying, or rehosting any original
 * image. The test covers:
 *  - the data-layout attribute and generated per-slideshow aspect;
 *  - a slideshow card sized to the first image's aspect ratio on portrait/tall
 *    frames (phone and the 987 px Behance column), centered with no blur and
 *    no overflow;
 *  - the original full-frame cover behavior on a wide landscape frame;
 *  - navigation, dots, counter, and fullscreen filling the screen.
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');
const { createPilotServer } = require('./serve');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, '03_REBUILT_SLIDESHOWS', 'data');
const FIT_ID = 'P030-S01';
const SECOND_ID = 'P020-S01';

const fitData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, FIT_ID + '.json'), 'utf8'));
const secondData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, SECOND_ID + '.json'), 'utf8'));
const FIT_URLS = fitData.images.map(image => image.src);
const SECOND_URLS = secondData.images.map(image => image.src);
const FIT_ASPECT = fitData.images[0].w / fitData.images[0].h;
const FIT_ASPECT_TEXT = FIT_ASPECT.toFixed(6);
const SECOND_ASPECT = secondData.images[0].w / secondData.images[0].h;
const SECOND_ASPECT_TEXT = SECOND_ASPECT.toFixed(6);

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

function assertClose(actual, expected, tolerance, name) {
  return assert(Math.abs(actual - expected) <= tolerance, name,
    'expected ' + expected + ' +/- ' + tolerance + ', got ' + actual);
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
    const before = firstSlide ? getComputedStyle(firstSlide, '::before') : null;
    const rect = container.getBoundingClientRect();
    const imageRect = firstImage ? firstImage.getBoundingClientRect() : null;
    const slides = Array.from(document.querySelectorAll('.slide'));
    return {
      layout: container.getAttribute('data-layout'),
      styleAttr: container.getAttribute('style'),
      fitAspect: getComputedStyle(container).getPropertyValue('--fit-aspect').trim(),
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
      backdropContent: before ? before.content : null,
      backdropImage: before ? before.backgroundImage : null,
      slidesWithBackdrop: slides
        .filter(slide => slide.style.getPropertyValue('--slide-image')).length,
      container: {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        radius: getComputedStyle(container).borderRadius,
        paddingBottom: getComputedStyle(container).paddingBottom
      },
      image: imageRect ? {
        top: imageRect.top,
        left: imageRect.left,
        width: imageRect.width,
        height: imageRect.height
      } : null,
      imageNatural: firstImage ? {
        width: firstImage.naturalWidth,
        height: firstImage.naturalHeight
      } : null,
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

async function assertCard(stateValue, label, viewportWidth,
  aspect, aspectText, urls) {
  assertEqual(stateValue.layout, 'fit', label + ': layout attribute');
  assertEqual(stateValue.fitAspect, aspectText,
    label + ': first image aspect is exposed to CSS');
  assertEqual(stateValue.objectFit, 'contain', label + ': whole image is contained');
  assertEqual(stateValue.container.paddingBottom, '0px',
    label + ': card has no reserved control strip');
  assertEqual(stateValue.container.radius, '20px', label + ': card radius');
  assertEqual(stateValue.imageCount, urls.length,
    label + ': no duplicate image elements');
  assertEqual(stateValue.slideCount, urls.length, label + ': slide count');
  assertEqual(stateValue.dotCount, urls.length, label + ': dot count');
  assertEqual(stateValue.fullscreenButtons, 1,
    label + ': exactly one fullscreen button');

  assertClose(stateValue.container.width, viewportWidth, 1,
    label + ': card fills the iframe width');
  assertClose(stateValue.container.height, viewportWidth / aspect, 1,
    label + ': card height follows the image aspect');
  assertClose(stateValue.container.aspectRatioValue,
    aspect, 0.001, label + ': card ratio is the image ratio');
  assertClose(stateValue.container.top,
    (stateValue.innerHeight - stateValue.container.height) / 2, 2,
    label + ': card is vertically centered');
  assertClose(stateValue.image.width, stateValue.container.width, 1,
    label + ': image element fills the card width');
  assertClose(stateValue.image.height, stateValue.container.height, 1,
    label + ': image element fills the card height');
  assertClose(stateValue.imageNatural.width / stateValue.imageNatural.height,
    aspect, 0.001, label + ': displayed image keeps its own ratio');

  assertEqual(stateValue.backdropContent, 'none',
    label + ': no ::before backdrop is generated');
  assertEqual(stateValue.backdropImage, 'none',
    label + ': no blurred background image');
  assertEqual(stateValue.slidesWithBackdrop, 0,
    label + ': no slide carries a backdrop URL');
  assert(stateValue.scrollWidth <= stateValue.innerWidth,
    label + ': no horizontal overflow',
    stateValue.scrollWidth + ' vs ' + stateValue.innerWidth);
  assert(stateValue.scrollHeight <= stateValue.innerHeight,
    label + ': no vertical overflow',
    stateValue.scrollHeight + ' vs ' + stateValue.innerHeight);
}

async function main() {
  const server = createPilotServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 1107 } });

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
    // Expose a numeric ratio for the helper without adding browser code.
    phoneState.container.aspectRatioValue =
      phoneState.container.width / phoneState.container.height;

    await assertCard(phoneState, 'phone', 390,
      FIT_ASPECT, FIT_ASPECT_TEXT, FIT_URLS);
    assertEqual(phoneState.counter, '1 / ' + FIT_URLS.length, 'phone: initial counter');
    assertEqual(phoneState.activeDot, 0, 'phone: initial active dot');
    assert(phoneState.styleAttr &&
      phoneState.styleAttr.includes('--fit-aspect:' + FIT_ASPECT_TEXT),
      'phone: generated fit aspect is present in the markup',
      phoneState.styleAttr);

    // Navigation keeps the card and the image ratio unchanged.
    await phone.click('.next');
    await waitForCounter(phone, '2 / ' + FIT_URLS.length);
    await wait(150);
    const phoneNext = await state(phone);
    assertEqual(phoneNext.counter, '2 / ' + FIT_URLS.length, 'phone: next counter');
    assertEqual(phoneNext.activeDot, 1, 'phone: next active dot');
    assertEqual(phoneNext.transform, 'translateX(-100vw)', 'phone: next transform');
    assertClose(phoneNext.container.width / phoneNext.container.height,
      FIT_ASPECT, 0.001, 'phone: next keeps the card ratio');
    assertEqual(phoneNext.imageCount, FIT_URLS.length, 'phone: image count after next');

    await phone.click('.dot:nth-child(4)');
    await waitForCounter(phone, '4 / ' + FIT_URLS.length);
    await wait(150);
    const phoneLast = await state(phone);
    assertEqual(phoneLast.counter, '4 / ' + FIT_URLS.length, 'phone: dot jump counter');
    assertEqual(phoneLast.activeDot, 3, 'phone: dot jump active dot');
    assertEqual(phoneLast.transform, 'translateX(-300vw)', 'phone: dot jump transform');

    // Fullscreen always fills the screen on a portrait phone.
    await phone.click('#fullscreenBtn');
    await wait(600);
    const fullscreen = await phone.evaluate(() => {
      const element = document.fullscreenElement;
      const container = document.getElementById('slideshow');
      const rect = container.getBoundingClientRect();
      const image = document.querySelector('.slide img');
      return {
        native: Boolean(element),
        target: element ? element.id : null,
        theater: container.classList.contains('theater-mode'),
        width: rect.width,
        height: rect.height,
        objectFit: getComputedStyle(image).objectFit,
        paddingBottom: getComputedStyle(container).paddingBottom,
        radius: getComputedStyle(container).borderRadius
      };
    });
    assert((fullscreen.native && fullscreen.target === 'slideshow') || fullscreen.theater,
      'phone: fullscreen enters native or theater mode', JSON.stringify(fullscreen));
    assertClose(fullscreen.width, 390, 2, 'phone: fullscreen fills the width');
    assertClose(fullscreen.height, 1107, 2, 'phone: fullscreen fills the height');
    assertEqual(fullscreen.objectFit, 'contain',
      'phone: fullscreen keeps the whole image visible');
    assertEqual(fullscreen.radius, '0px', 'phone: fullscreen drops the card radius');
    await phone.click('#fullscreenBtn');
    await phone.waitForFunction(() => !document.fullscreenElement, null, { timeout: 10000 });
    await wait(500);
    const phoneRestored = await state(phone);
    phoneRestored.container.aspectRatioValue =
      phoneRestored.container.width / phoneRestored.container.height;
    assertClose(phoneRestored.container.height, 390 / FIT_ASPECT, 1,
      'phone: exit returns to the image-ratio card');
    await phone.close();

    // ------------------------------------------ Behance column (987 x 1107)
    const column = await openSlide(context, base, FIT_ID, FIT_URLS.length);
    await column.setViewportSize({ width: 987, height: 1107 });
    await wait(200);
    const columnState = await state(column);
    columnState.container.aspectRatioValue =
      columnState.container.width / columnState.container.height;
    await assertCard(columnState, 'Behance column', 987,
      FIT_ASPECT, FIT_ASPECT_TEXT, FIT_URLS);
    await column.close();

    // ------------------------------------------------- wide landscape frame
    const desktop = await openSlide(context, base, FIT_ID, FIT_URLS.length);
    await desktop.setViewportSize({ width: 1335, height: 1107 });
    await wait(200);
    const desktopState = await state(desktop);
    assertEqual(desktopState.layout, 'fit', 'wide frame: opt-in layout attribute');
    assertEqual(desktopState.objectFit, 'cover',
      'wide frame: original cover behavior is preserved');
    assertClose(desktopState.container.width, 1335, 1,
      'wide frame: original full width');
    assertClose(desktopState.container.height, 1107, 1,
      'wide frame: original full height');
    assertEqual(desktopState.container.paddingBottom, '50px',
      'wide frame: original control strip is preserved');
    assertEqual(desktopState.backdropContent, 'none',
      'wide frame: no backdrop is generated');
    assertEqual(desktopState.backdropImage, 'none',
      'wide frame: no background image');
    await desktop.close();

    // ------------------------------------ second slideshow on a phone frame
    const second = await openSlide(context, base, SECOND_ID, SECOND_URLS.length);
    await second.setViewportSize({ width: 390, height: 1052 });
    await wait(200);
    const secondState = await state(second);
    secondState.container.aspectRatioValue =
      secondState.container.width / secondState.container.height;
    await assertCard(secondState, 'second slideshow', 390,
      SECOND_ASPECT, SECOND_ASPECT_TEXT, SECOND_URLS);
    assert(secondState.styleAttr &&
      secondState.styleAttr.includes('--fit-aspect:' + SECOND_ASPECT_TEXT),
      'second slideshow: generated fit aspect is present in the markup',
      secondState.styleAttr);
    await second.close();

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
      secondSlideshow: SECOND_ID,
      fitAspect: FIT_ASPECT_TEXT,
      secondAspect: SECOND_ASPECT_TEXT,
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
