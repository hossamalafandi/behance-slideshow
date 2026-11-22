#!/usr/bin/env node
'use strict';

/**
 * Focused live check for the P030-S01 phone fit-layout pilot.
 *
 * Usage:
 *   node test-live-fit.js <https://script.google.com/macros/s/.../exec>
 *
 * The live slideshow is loaded inside Behance-like outer iframes at a phone
 * width and a wide landscape width. Every imgur request is fulfilled with a
 * synthetic 16:9 SVG, so no original image is downloaded or viewed.
 */

const { chromium } = require('playwright-core');

const url = process.argv[2];
if (!url || !/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url)) {
  console.error('Usage: node test-live-fit.js <https://script.google.com/macros/s/.../exec>');
  process.exit(2);
}

const FIT_ID = 'P030-S01';
const CLASSIC_ID = 'P020-S01';
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
    const backdrop = firstSlide ? getComputedStyle(firstSlide, '::before') : null;
    const slides = Array.from(document.querySelectorAll('.slide'));
    return {
      innerWidth,
      innerHeight,
      layout: container.getAttribute('data-layout'),
      objectFit: firstImage ? getComputedStyle(firstImage).objectFit : null,
      imageCount: document.querySelectorAll('.slide img').length,
      fullscreenButtons: document.querySelectorAll('#fullscreenBtn').length,
      counter: document.getElementById('pageNumber').textContent,
      activeDot: Array.from(document.querySelectorAll('.dot'))
        .findIndex(dot => dot.classList.contains('active')),
      transform: document.getElementById('slidesContainer').style.transform,
      backdropImage: backdrop ? backdrop.backgroundImage : null,
      backdropFilter: backdrop ? backdrop.filter : null,
      withBackdrop: slides
        .map((slide, index) => ({
          index,
          value: slide.style.getPropertyValue('--slide-image')
        }))
        .filter(item => item.value),
      scrollWidth: document.documentElement.scrollWidth,
      scrollHeight: document.documentElement.scrollHeight
    };
  });
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
    assertEqual(phone.layout, 'fit', 'live phone: P030 opt-in layout attribute');
    assertEqual(phone.objectFit, 'contain', 'live phone: whole image is contained');
    assertEqual(phone.imageCount, 4, 'live phone: no duplicate image elements');
    assertEqual(phone.fullscreenButtons, 1, 'live phone: exactly one fullscreen button');
    assertEqual(phone.counter, '1 / 4', 'live phone: initial counter');
    assert(phone.withBackdrop.length >= 1 && phone.withBackdrop.length <= 3,
      'live phone: backdrop is limited to the active slide and neighbors',
      String(phone.withBackdrop.length));
    assert(phone.withBackdrop.some(item =>
      item.index === 0 && item.value.includes('dreLaoI.jpeg')),
      'live phone: active backdrop uses the first P030 URL',
      JSON.stringify(phone.withBackdrop));
    assert(/url\(/.test(phone.backdropImage || '') &&
      phone.backdropImage.includes('dreLaoI.jpeg'),
      'live phone: ::before resolves the same image URL',
      phone.backdropImage);
    assert(/blur\(/.test(phone.backdropFilter || ''),
      'live phone: ::before applies the blur filter',
      phone.backdropFilter);
    assert(phone.scrollWidth <= phone.innerWidth,
      'live phone: no horizontal overflow',
      phone.scrollWidth + ' vs ' + phone.innerWidth);
    assert(phone.scrollHeight <= phone.innerHeight,
      'live phone: no vertical overflow',
      phone.scrollHeight + ' vs ' + phone.innerHeight);

    await phoneEmbed.frame.click('.next');
    await phoneEmbed.frame.waitForFunction(() => {
      return document.getElementById('pageNumber').textContent === '2 / 4';
    }, null, { timeout: 10000 });
    await wait(200);
    const phoneNext = await state(phoneEmbed.frame);
    assertEqual(phoneNext.counter, '2 / 4', 'live phone: next counter');
    assertEqual(phoneNext.activeDot, 1, 'live phone: next active dot');
    assertEqual(phoneNext.transform, 'translateX(-100vw)', 'live phone: next transform');
    assert(phoneNext.withBackdrop.some(item =>
      item.index === 1 && item.value.includes('UKgOr45.jpeg')),
      'live phone: second slide backdrop uses the second URL',
      JSON.stringify(phoneNext.withBackdrop));
    await phoneEmbed.page.close();

    // -------------------------------------------------- live wide landscape
    const wideEmbed = await openEmbed(context, FIT_ID, 1335, 1107, 4);
    const wide = await state(wideEmbed.frame);
    assertEqual(wide.layout, 'fit', 'live wide: P030 opt-in layout attribute');
    assertEqual(wide.objectFit, 'cover', 'live wide: original cover behavior');
    assertEqual(wide.withBackdrop.length, 0, 'live wide: no backdrop is created');
    assertEqual(wide.backdropImage, 'none', 'live wide: ::before has no background');
    await wideEmbed.page.close();

    // ------------------------------------ live non-gated slideshow on phone
    const classicEmbed = await openEmbed(context, CLASSIC_ID, 390, 1052, 4);
    const classic = await state(classicEmbed.frame);
    assertEqual(classic.layout, '', 'live phone: P020 has no fit layout');
    assertEqual(classic.objectFit, 'cover', 'live phone: P020 cover behavior is unchanged');
    assertEqual(classic.withBackdrop.length, 0, 'live phone: P020 has no backdrop');
    assertEqual(classic.imageCount, 4, 'live phone: P020 keeps four image elements');
    assertEqual(classic.fullscreenButtons, 1,
      'live phone: P020 has exactly one fullscreen button');
    await classicEmbed.page.close();
  } finally {
    await browser.close();
  }

  const passed = results.filter(result => result.passed).length;
  console.log(JSON.stringify({
    deployment: url,
    scope: { fitSlideshow: FIT_ID, classicSlideshow: CLASSIC_ID },
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
