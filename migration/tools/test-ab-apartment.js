#!/usr/bin/env node
'use strict';

/**
 * Local AB-Apartment page suite.
 *
 * Loads the page in Behance-like frames at 987x2750 and 390x2750 and exercises
 * all seven archived room slideshows. Imgur and the fonts are stubbed.
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');
const data = require('./ab-apartment-data');
const { createPilotServer } = require('./serve');

const ROOT = path.resolve(__dirname, '..');
const PREVIEW_FILE = path.join(ROOT, '03_REBUILT_SLIDESHOWS', 'preview', 'ab-apartment.html');
const PRODUCTION_FILE = path.join(ROOT, '04_APPS_SCRIPT', 'ABApartment.html');
const ASSET_DIR = path.resolve(ROOT, '..', 'assets', 'ab-apartment');
const RESULTS_DIR = path.join(ROOT, '01_AUDIT', 'evidence', 'ab-apartment');
const REPORT_FILE = path.join(RESULTS_DIR, 'ab-apartment-test-results.json');
const BEHANCE_WIDTH = 987;
const PHONE_WIDTH = 390;
const BEHANCE_HEIGHT = data.EMBED_HEIGHT;
const COUNTS = data.SLIDESHOWS.map(room => room.images.length);

const checks = [];
const failures = [];
let blockedImgurRequests = 0;

function check(name, condition, detail) {
  const passed = Boolean(condition);
  checks.push({ name, passed, detail: detail === undefined ? null : String(detail) });
  if (!passed) failures.push(name + (detail === undefined ? '' : ': ' + detail));
  return passed;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function wait(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

function imageTags(html) {
  return Array.from(html.matchAll(/<img\b[^>]*>/g)).map(match => match[0]);
}

function attr(tag, name) {
  const match = new RegExp('\\b' + name + '="([^"]*)"').exec(tag);
  return match ? match[1] : '';
}

const SLIDE_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="3721" height="2631"><rect width="3721" height="2631" fill="#17324d"/><circle cx="1860" cy="1315" r="400" fill="#e2a24a"/></svg>';
const SLIDE_H_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="724"><rect width="1024" height="724" fill="#17324d"/><circle cx="512" cy="362" r="160" fill="#e2a24a"/></svg>';
const LOGO_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="#000"/></svg>';

function staticChecks() {
  const production = fs.readFileSync(PRODUCTION_FILE, 'utf8');
  const preview = fs.readFileSync(PREVIEW_FILE, 'utf8');
  const images = imageTags(production);
  const hero = images.filter(tag => attr(tag, 'alt') === data.HERO.alt);
  const slides = images.filter(tag => / image \d+$/.test(attr(tag, 'alt')));
  const tools = images.filter(tag => / Logo$/.test(attr(tag, 'alt')));

  check('page title is exact', production.includes('<title>' + data.PAGE_TITLE + '</title>'));
  check('page has no Google Sites chrome',
    !/sites\.google\.com|sitesv-images|googleusercontent|view\/hossam-alafandi|Report abuse/i
      .test(production));
  check('page has no Vimeo or Drive embeds',
    !/player\.vimeo\.com|drive\.google\.com|youtube\.com/i.test(production));
  check('room headings are exact and in order',
    JSON.stringify(Array.from(production.matchAll(/<h3>([^<]+)<\/h3>/g))
      .map(match => match[1])) ===
      JSON.stringify(data.SLIDESHOWS.map(room => room.title)));
  check('page has 7 slideshows', (production.match(/class="slideshow"/g) || []).length === 7);
  check('page has 37 slides', slides.length === 37, slides.length);
  check('slideshow counts are 7/6/5/5/5/4/5',
    JSON.stringify(Array.from(production.matchAll(/data-count="(\d+)"/g))
      .map(match => Number(match[1]))) === JSON.stringify(COUNTS));
  check('every slideshow starts at 1 / its count',
    COUNTS.every(count => production.includes('>1 / ' + count + '</span>')));
  check('page has 42 images', images.length === 42, images.length);
  check('page has one hero and 4 tools',
    hero.length === 1 && tools.length === 4, [hero.length, tools.length].join('/'));
  check('hero uses the 1920 desktop file and 768 phone source',
    attr(hero[0] || '', 'src') === data.assetUrl(data.PRODUCTION_ASSET_BASE, 'hero', 1920) &&
      production.includes('<source media="(max-width: 700px)" srcset="' +
        data.assetUrl(data.PRODUCTION_ASSET_BASE, 'hero', 768) + '">'));
  check('all 37 slides provide phone h JPG sources',
    (production.match(/<source media="\(max-width: 700px\)" srcset="https:\/\/i\.imgur\.com\/[A-Za-z0-9]+h\.jpg">/g) || [])
      .length === 37);
  check('all 37 slides use desktop Imgur images',
    slides.every(tag => /^https:\/\/i\.imgur\.com\/[A-Za-z0-9]+\.(?:jpg|png)$/.test(
      attr(tag, 'src'))));
  check('only the first slide in each room is eager',
    (production.match(/loading="eager"/g) || []).length === 8 &&
      (production.match(/loading="lazy"/g) || []).length === 34);
  check('tool logos match the exact Imgur PNGs',
    tools.length === 4 &&
      tools.every((tag, index) => attr(tag, 'src') === data.toolUrl(data.TOOLS[index].id)));
  check('page has no anchors or popup navigation',
    !/<a\b|window\.open|target="_blank"/i.test(production));
  check('page uses no storage, cookies, or messaging',
    !/localStorage|sessionStorage|indexedDB|document\.cookie|postMessage|BroadcastChannel/i
      .test(production));
  check('page has no external scripts', !/<script\b[^>]*\bsrc=/i.test(production));
  check('page keeps the fixed 2750 px embed height',
    data.EMBED_HEIGHT === 2750 && data.EMBED_WIDTH === '100%');
  check('page has the phone breakpoint', /@media \(max-width: 700px\)/.test(production));
  check('hero assets exist on disk',
    ['hero-1920.jpg', 'hero-768.jpg'].every(name => fs.existsSync(path.join(ASSET_DIR, name))));
  check('preview uses local hero assets',
    preview.includes(data.PREVIEW_ASSET_BASE + 'hero-1920.jpg') &&
      preview.includes(data.PREVIEW_ASSET_BASE + 'hero-768.jpg'));
}

async function blockThirdParty(context) {
  await context.route('https://i.imgur.com/**', route => {
    blockedImgurRequests += 1;
    const url = route.request().url();
    const isTool = data.TOOLS.some(tool => url === data.toolUrl(tool.id));
    const body = isTool ? LOGO_SVG
      : /h\.jpg$/.test(url) ? SLIDE_H_SVG : SLIDE_SVG;
    return route.fulfill({ status: 200, contentType: 'image/svg+xml', body });
  });
  await context.route('https://fonts.googleapis.com/**', route => route.fulfill({
    status: 200, contentType: 'text/css; charset=utf-8', body: ''
  }));
  await context.route('https://fonts.gstatic.com/**', route => route.abort());
}

function wrapperHtml(base, width) {
  return [
    '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>',
    'html,body{margin:0;padding:0;background:#fff}',
    'iframe{display:block;border:0}',
    '</style></head><body>',
    '<iframe id="embed" src="' + base + '/exec?page=ab-apartment" width="' + width +
      '" height="' + BEHANCE_HEIGHT + '"',
    ' sandbox="allow-same-origin allow-scripts allow-pointer-lock allow-forms"',
    ' allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowfullscreen></iframe>',
    '</body></html>'
  ].join('');
}

async function findPageFrame(page) {
  for (let attempt = 0; attempt < 240; attempt++) {
    for (const frame of page.frames()) {
      try {
        const ready = await frame.evaluate(() =>
          document.querySelectorAll('.slideshow').length === 7);
        if (ready) return frame;
      } catch (error) {
        // Frame is still navigating.
      }
    }
    await wait(250);
  }
  return null;
}

async function runViewport(browser, base, label, width) {
  const context = await browser.newContext({
    viewport: { width, height: BEHANCE_HEIGHT },
    deviceScaleFactor: 1,
    locale: 'en-US'
  });
  await blockThirdParty(context);
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  try {
    await page.setContent(wrapperHtml(base, width), { waitUntil: 'domcontentloaded' });
    const frame = await findPageFrame(page);
    check(label + ': the sandboxed page frame loads', Boolean(frame));
    assert(frame, 'page frame did not load');

    await frame.waitForFunction(() =>
      document.querySelectorAll('.slideshow').length === 7 &&
      document.querySelectorAll('.slide').length === 37 &&
      document.querySelectorAll('.slide-dot').length === 37, null,
      { timeout: 30000, polling: 100 });
    await frame.evaluate(() => document.fonts.ready.then(() => true));
    await frame.waitForFunction(() => {
      const selected = Array.from(document.querySelectorAll(
        '.hero img, .slideshow .slide:first-child img, .tools-row img'));
      return selected.length === 12 &&
        selected.every(image => image.complete && image.naturalWidth > 0);
    }, null, { timeout: 30000, polling: 100 });
    await wait(300);

    const state = await frame.evaluate(() => {
      const rect = element => {
        const box = element.getBoundingClientRect();
        return { x: Math.round(box.x), y: Math.round(box.y + scrollY),
          width: Math.round(box.width), height: Math.round(box.height) };
      };
      const sourceOf = image => {
        const picture = image.parentElement;
        const source = picture && picture.tagName === 'PICTURE'
          ? picture.querySelector('source[media]') : null;
        if (source && window.matchMedia &&
            window.matchMedia(source.getAttribute('media')).matches) {
          return source.getAttribute('srcset');
        }
        return image.currentSrc || image.getAttribute('src');
      };
      return {
        inner: [innerWidth, innerHeight],
        scroll: [document.documentElement.scrollWidth, document.documentElement.scrollHeight],
        body: [document.body.scrollWidth, document.body.scrollHeight],
        main: rect(document.getElementById('page')),
        headings: Array.from(document.querySelectorAll('h3')).map(h => h.textContent.trim()),
        rooms: document.querySelectorAll('.room').length,
        slideshows: Array.from(document.querySelectorAll('.slideshow')).map(slideshow => {
          const stage = slideshow.querySelector('.slideshow-stage');
          const slide = slideshow.querySelector('.slide');
          return {
            count: Number(slideshow.getAttribute('data-count')),
            stage: stage.getBoundingClientRect().width,
            slide: slide.getBoundingClientRect().width,
            track: slideshow.querySelector('.slideshow-track').getBoundingClientRect().width,
            counter: slideshow.querySelector('.slide-counter').textContent,
            dots: slideshow.querySelectorAll('.slide-dot').length
          };
        }),
        roomsGridDisplay: getComputedStyle(document.querySelector('.rooms-grid')).display,
        roomsGridColumns: getComputedStyle(document.querySelector('.rooms-grid'))
          .gridTemplateColumns.trim().split(/\s+/).length,
        roomWidth: document.querySelector('.room').getBoundingClientRect().width,
        hero: sourceOf(document.querySelector('.hero img')),
        firstSlides: Array.from(document.querySelectorAll('.slideshow .slide:first-child img'))
          .map(sourceOf),
        tools: Array.from(document.querySelectorAll('.tools-row img')).map(image => image.src),
        toolsTitleAlign: getComputedStyle(document.getElementById('tools-title')).textAlign
      };
    });

    check(label + ': frame viewport is ' + width + 'x' + BEHANCE_HEIGHT,
      state.inner[0] === width && state.inner[1] === BEHANCE_HEIGHT);
    check(label + ': page fills exactly ' + BEHANCE_HEIGHT + ' px',
      state.scroll[1] === BEHANCE_HEIGHT && state.body[1] === BEHANCE_HEIGHT &&
        Math.abs(state.main.height - BEHANCE_HEIGHT) <= 1,
      JSON.stringify({ scroll: state.scroll, body: state.body, main: state.main.height }));
    check(label + ': no horizontal overflow',
      state.scroll[0] === width && state.body[0] === width);
    check(label + ': 7 rooms and headings are exact',
      state.rooms === 7 &&
        JSON.stringify(state.headings) ===
          JSON.stringify(data.SLIDESHOWS.map(room => room.title)));
    check(label + ': each room has a full-width slideshow track',
      state.slideshows.length === 7 &&
        state.slideshows.every(slideshow =>
          slideshow.dots === slideshow.count &&
          slideshow.counter === '1 / ' + slideshow.count &&
          Math.abs(slideshow.slide - slideshow.stage) <= 1 &&
          Math.abs(slideshow.track - slideshow.stage * slideshow.count) <= 2),
      JSON.stringify(state.slideshows));
    check(label + ': desktop uses two columns and phone uses one',
      width <= 700
        ? state.roomsGridDisplay === 'block'
        : state.roomsGridDisplay === 'grid' && state.roomsGridColumns === 2,
      state.roomsGridDisplay + ' / ' + state.roomsGridColumns);
    if (width <= 700) {
      check(label + ': phone room stays compact enough to avoid page-end space',
        state.roomWidth <= 231, state.roomWidth);
    }
    check(label + ': hero uses the right source',
      state.hero.includes(width <= 700 ? 'hero-768.jpg' : 'hero-1920.jpg'));
    check(label + ': all first slides use the right Imgur source',
      state.firstSlides.length === 7 &&
        state.firstSlides.every(src => width <= 700
          ? /https:\/\/i\.imgur\.com\/[A-Za-z0-9]+h\.jpg$/.test(src)
          : /https:\/\/i\.imgur\.com\/[A-Za-z0-9]+\.jpg$/.test(src)));
    check(label + ': 4 tools use the exact Imgur logos',
      state.tools.length === 4 &&
        state.tools.every((src, index) => src === data.toolUrl(data.TOOLS[index].id)));
    check(label + ': TOOLS USED is centered',
      state.toolsTitleAlign === 'center', state.toolsTitleAlign);

    const first = '#slideshow-p004-s01';
    await frame.click(first + ' .slide-arrow.next');
    await frame.waitForFunction(selector =>
      document.querySelector(selector + ' .slide-counter').textContent === '2 / 7',
      first, { timeout: 10000, polling: 100 });
    await frame.click(first + ' .slide-dot:nth-child(4)');
    await frame.waitForFunction(selector =>
      document.querySelector(selector + ' .slide-counter').textContent === '4 / 7',
      first, { timeout: 10000, polling: 100 });
    await frame.press(first, 'End');
    await frame.waitForFunction(selector =>
      document.querySelector(selector + ' .slide-counter').textContent === '7 / 7',
      first, { timeout: 10000, polling: 100 });
    await frame.press(first, 'Home');
    await frame.waitForFunction(selector =>
      document.querySelector(selector + ' .slide-counter').textContent === '1 / 7',
      first, { timeout: 10000, polling: 100 });
    check(label + ': first room navigation and keyboard work', true);

    check(label + ': no page errors', pageErrors.length === 0, pageErrors.join(' | '));
  } finally {
    await context.close();
  }
}

async function main() {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  staticChecks();

  const server = createPilotServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;

  let browser;
  try {
    browser = await chromium.launch({ channel: 'chrome', headless: true });
    await runViewport(browser, base, 'desktop 987x' + BEHANCE_HEIGHT, BEHANCE_WIDTH);
    await runViewport(browser, base, 'phone 390x' + BEHANCE_HEIGHT, PHONE_WIDTH);
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }

  const failed = checks.filter(item => !item.passed);
  const report = {
    scope: {
      page: '?page=ab-apartment',
      behanceFrames: [BEHANCE_WIDTH + 'x' + BEHANCE_HEIGHT,
        PHONE_WIDTH + 'x' + BEHANCE_HEIGHT],
      slideshows: data.SLIDESHOWS.length,
      slides: data.SLIDESHOWS.reduce((sum, room) => sum + room.images.length, 0),
      assets: 2
    },
    browser: browser ? 'Chrome ' + browser.version() : null,
    checks: checks.length,
    passed: checks.length - failed.length,
    failed: failed.length,
    blockedImgurRequests,
    failures,
    results: checks
  };
  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2) + '\n', 'utf8');

  console.log(JSON.stringify({
    scope: report.scope,
    browser: report.browser,
    checks: report.checks,
    passed: report.passed,
    failed: report.failed,
    blockedImgurRequests,
    report: path.relative(ROOT, REPORT_FILE)
  }, null, 2));

  if (failures.length) process.exit(1);
}

main().catch(error => {
  console.error('ERROR: ' + error.stack);
  process.exit(1);
});
