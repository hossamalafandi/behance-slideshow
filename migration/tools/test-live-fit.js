#!/usr/bin/env node
'use strict';

/**
 * Focused live check for the global phone fit layout.
 *
 * Usage:
 *   node test-live-fit.js <https://script.google.com/macros/s/.../exec>
 *
 * The live slideshow is loaded inside Behance-like outer iframes at a phone
 * width, the 987 px Behance column, and a wide landscape width. Every imgur
 * request is fulfilled with a synthetic 16:9 SVG, so no original image is
 * downloaded or viewed.
 */

const { chromium } = require('playwright-core');

const url = process.argv[2];
if (!url || !/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url)) {
  console.error('Usage: node test-live-fit.js <https://script.google.com/macros/s/.../exec>');
  process.exit(2);
}

const FIT_ID = 'P030-S01';
const SECOND_ID = 'P020-S01';
const FIT_ASPECT = 2560 / 1440;
const FIT_ASPECT_TEXT = FIT_ASPECT.toFixed(6);
const SECOND_ASPECT = 2560 / 1440;
const SECOND_ASPECT_TEXT = SECOND_ASPECT.toFixed(6);
const results = [];
const failures = [];
let syntheticRequests = 0;

function record(name, passed, detail) {
  results.push({ name, passed, detail: detail === undefined ? null : detail });
  if (!passed) failures.push(name + (detail ? ': ' + detail : ''));
}

function assert(condition, name, detail) {
  record(name, Boolean(condition), detail);
}

function assertEqual(actual, expected, name) {
  assert(actual === expected, name,
    'expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual));
}

function assertClose(actual, expected, tolerance, name) {
  assert(Math.abs(actual - expected) <= tolerance, name,
    'expected ' + expected + ' +/- ' + tolerance + ', got ' + actual);
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

async function openEmbed(context, id, width, height, total) {
  const page = await context.newPage();
  const html = [
    '<!DOCTYPE html><html><body style="margin:0;background:#222">',
    '<iframe id="embed" src="' + url + '?slide=' + id + '" width="' + width +
      '" height="' + height + '"',
    ' style="border:0;border-radius:20px;overflow:hidden"',
    ' allowfullscreen allow="fullscreen"></iframe>',
    '</body></html>'
  ].join('');
  await page.setContent(html, { waitUntil: 'domcontentloaded' });
  const frame = await findSlideshowFrame(page, 45000);
  if (!frame) {
    await page.close();
    throw new Error(id + ': live slideshow frame did not load');
  }
  await frame.waitForFunction(expected => {
    return document.querySelectorAll('.slide').length === expected &&
      document.querySelectorAll('.dot').length === expected;
  }, total, { timeout: 45000, polling: 100 });
  await wait(250);
  return { page, frame };
}

async function state(frame) {
  return frame.evaluate(() => {
    const container = document.getElementById('slideshow');
    const firstSlide = document.querySelector('.slide');
    const firstImage = firstSlide ? firstSlide.querySelector('img') : null;
    const before = firstSlide ? getComputedStyle(firstSlide, '::before') : null;
    const rect = container.getBoundingClientRect();
    const imageRect = firstImage ? firstImage.getBoundingClientRect() : null;
    return {
      innerWidth,
      innerHeight,
      layout: container.getAttribute('data-layout'),
      styleAttr: container.getAttribute('style'),
      fitAspect: getComputedStyle(container).getPropertyValue('--fit-aspect').trim(),
      objectFit: firstImage ? getComputedStyle(firstImage).objectFit : null,
      imageCount: document.querySelectorAll('.slide img').length,
      fullscreenButtons: document.querySelectorAll('#fullscreenBtn').length,
      counter: document.getElementById('pageNumber').textContent,
      activeDot: Array.from(document.querySelectorAll('.dot'))
        .findIndex(dot => dot.classList.contains('active')),
      transform: document.getElementById('slidesContainer').style.transform,
      backdropContent: before ? before.content : null,
      backdropImage: before ? before.backgroundImage : null,
      container: {
        top: rect.top,
        width: rect.width,
        height: rect.height,
        radius: getComputedStyle(container).borderRadius,
        paddingBottom: getComputedStyle(container).paddingBottom
      },
      image: imageRect ? {
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

function assertCard(value, label, viewportWidth, aspect, aspectText, count) {
  assertEqual(value.layout, 'fit', label + ': layout attribute');
  assertEqual(value.styleAttr, '--fit-aspect:' + aspectText,
    label + ': generated aspect style');
  assertEqual(value.objectFit, 'contain', label + ': whole image is contained');
  assertEqual(value.container.paddingBottom, '0px',
    label + ': card has no reserved control strip');
  assertEqual(value.container.radius, '20px', label + ': card radius');
  assertEqual(value.imageCount, count, label + ': no duplicate image elements');
  assertEqual(value.fullscreenButtons, 1, label + ': exactly one fullscreen button');
  assertClose(value.container.width, viewportWidth, 1,
    label + ': card fills the iframe width');
  assertClose(value.container.height, viewportWidth / aspect, 1,
    label + ': card height follows the image aspect');
  assertClose(value.container.top,
    (value.innerHeight - value.container.height) / 2, 2,
    label + ': card is vertically centered');
  assertClose(value.image.width, value.container.width, 1,
    label + ': image element fills the card width');
  assertClose(value.image.height, value.container.height, 1,
    label + ': image element fills the card height');
  assertClose(value.imageNatural.width / value.imageNatural.height,
    aspect, 0.001, label + ': displayed image keeps its own ratio');
  assertEqual(value.backdropContent, 'none',
    label + ': no ::before backdrop is generated');
  assertEqual(value.backdropImage, 'none',
    label + ': no blurred background image');
  assert(value.scrollWidth <= value.innerWidth,
    label + ': no horizontal overflow',
    value.scrollWidth + ' vs ' + value.innerWidth);
  assert(value.scrollHeight <= value.innerHeight,
    label + ': no vertical overflow',
    value.scrollHeight + ' vs ' + value.innerHeight);
}

async function main() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext();

  const syntheticSvg = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900">',
    '<rect width="1600" height="900" fill="#1d4ed8"/>',
    '<circle cx="800" cy="450" r="220" fill="#f59e0b"/>',
    '</svg>'
  ].join('');
  await context.route('https://i.imgur.com/**', route => {
    syntheticRequests += 1;
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
    // --------------------------------------------------- live phone portrait
    const phoneEmbed = await openEmbed(context, FIT_ID, 390, 1107, 4);
    const phone = await state(phoneEmbed.frame);
    assertCard(phone, 'live phone', 390,
      FIT_ASPECT, FIT_ASPECT_TEXT, 4);
    assertEqual(phone.counter, '1 / 4', 'live phone: initial counter');
    assertEqual(phone.activeDot, 0, 'live phone: initial active dot');

    await phoneEmbed.frame.click('.next');
    await phoneEmbed.frame.waitForFunction(() => {
      return document.getElementById('pageNumber').textContent === '2 / 4';
    }, null, { timeout: 10000 });
    await wait(200);
    const phoneNext = await state(phoneEmbed.frame);
    assertEqual(phoneNext.counter, '2 / 4', 'live phone: next counter');
    assertEqual(phoneNext.activeDot, 1, 'live phone: next active dot');
    assertEqual(phoneNext.transform, 'translateX(-100vw)', 'live phone: next transform');
    assertClose(phoneNext.container.width / phoneNext.container.height,
      FIT_ASPECT, 0.001, 'live phone: next keeps the card ratio');
    await phoneEmbed.page.close();

    // --------------------------------------- live Behance column (987 x 1107)
    const columnEmbed = await openEmbed(context, FIT_ID, 987, 1107, 4);
    const column = await state(columnEmbed.frame);
    assertCard(column, 'live Behance column', 987,
      FIT_ASPECT, FIT_ASPECT_TEXT, 4);
    await columnEmbed.page.close();

    // -------------------------------------------------- live wide landscape
    const wideEmbed = await openEmbed(context, FIT_ID, 1335, 1107, 4);
    const wide = await state(wideEmbed.frame);
    assertEqual(wide.layout, 'fit', 'live wide: opt-in layout attribute');
    assertEqual(wide.objectFit, 'cover', 'live wide: original cover behavior');
    assertClose(wide.container.width, 1335, 1, 'live wide: original full width');
    assertClose(wide.container.height, 1107, 1, 'live wide: original full height');
    assertEqual(wide.container.paddingBottom, '50px',
      'live wide: original control strip');
    assertEqual(wide.backdropContent, 'none', 'live wide: no backdrop');
    assertEqual(wide.backdropImage, 'none', 'live wide: no background image');
    await wideEmbed.page.close();

    // ------------------------------- live second slideshow on a phone frame
    const secondEmbed = await openEmbed(context, SECOND_ID, 390, 1052, 4);
    const second = await state(secondEmbed.frame);
    assertCard(second, 'live phone', 390,
      SECOND_ASPECT, SECOND_ASPECT_TEXT, 4);
    await secondEmbed.page.close();
  } finally {
    await browser.close();
  }

  const passed = results.filter(result => result.passed).length;
  console.log(JSON.stringify({
    deployment: url,
    scope: {
      fitSlideshow: FIT_ID,
      secondSlideshow: SECOND_ID,
      fitAspect: FIT_ASPECT_TEXT,
      secondAspect: SECOND_ASPECT_TEXT
    },
    browser: 'Chrome',
    syntheticImageRequests: syntheticRequests,
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
