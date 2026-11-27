#!/usr/bin/env node
'use strict';

/**
 * Live AB-Apartment page suite.
 *
 * Runs against the deployed Apps Script URL:
 *  - the new page route and the existing Al-Rashed/Cellphone/DK/slide/tools routes;
 *  - the 2 copied hero files on jsDelivr;
 *  - both Behance-like frames, 7 room slideshows, 37 slides, 4 tools.
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');
const data = require('./ab-apartment-data');

const ROOT = path.resolve(__dirname, '..');
const RESULTS_DIR = path.join(ROOT, '01_AUDIT', 'evidence', 'ab-apartment');
const REPORT_FILE = path.join(RESULTS_DIR, 'ab-apartment-live-test-results.json');
const BEHANCE_WIDTH = 987;
const PHONE_WIDTH = 390;
const BEHANCE_HEIGHT = data.EMBED_HEIGHT;
const COUNTS = data.SLIDESHOWS.map(room => room.images.length);
const TOTAL_SLIDES = COUNTS.reduce((sum, count) => sum + count, 0);

const url = process.argv[2];
if (!url || !/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url)) {
  console.error('Usage: node test-live-ab-apartment.js <https://script.google.com/macros/s/.../exec>');
  process.exit(2);
}

const checks = [];
const failures = [];
let blockedImgurRequests = 0;

function check(name, condition, detail) {
  const passed = Boolean(condition);
  checks.push({ name, passed, detail: detail === undefined ? null : String(detail) });
  if (!passed) failures.push(name + (detail === undefined ? '' : ': ' + detail));
  return passed;
}

function wait(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

const SLIDE_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="3721" height="2631"><rect width="3721" height="2631" fill="#17324d"/></svg>';
const SLIDE_H_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="724"><rect width="1024" height="724" fill="#17324d"/></svg>';
const LOGO_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="#000"/></svg>';

async function assetChecks() {
  for (const name of ['hero-1920.jpg', 'hero-768.jpg']) {
    const assetUrl = data.PRODUCTION_ASSET_BASE + name;
    let last = { name, error: 'not attempted' };
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await fetch(assetUrl, { redirect: 'follow' });
        const bytes = await response.arrayBuffer();
        last = {
          name,
          status: response.status,
          type: response.headers.get('content-type') || '',
          length: bytes.byteLength
        };
        if (response.status === 200 && bytes.byteLength > 0) break;
      } catch (error) {
        last = { name, error: error.message };
      }
      await wait(500 * attempt);
    }
    check('jsDelivr: ' + name + ' resolves',
      last.status === 200 && /^image\/jpeg\b/.test(last.type) && last.length > 0,
      JSON.stringify(last));
  }
}

async function loadRoute(context, query) {
  const page = await context.newPage();
  try {
    await page.goto(url + query, { waitUntil: 'domcontentloaded', timeout: 60000 });
    for (let attempt = 0; attempt < 240; attempt++) {
      for (const frame of page.frames()) {
        if (!/googleusercontent\.com/.test(frame.url())) continue;
        try {
          const state = await frame.evaluate(() => {
            const body = document.body ? document.body.textContent.trim() : '';
            const pageRoot = Boolean(
              document.querySelector('.slideshow') ||
              document.getElementById('rendersSlideshow') ||
              document.getElementById('rendersViewer'));
            const slides = document.querySelectorAll('.slide').length;
            const logos = document.querySelectorAll('.logo-row').length;
            let kind = null;
            if (pageRoot) kind = 'page';
            else if (slides > 0) kind = 'slides';
            else if (logos > 0) kind = 'tools';
            else if (/Slideshow unavailable/.test(body)) kind = 'neutral';
            return {
              kind,
              title: document.title,
              slides,
              logos,
              page: pageRoot,
              html: kind ? document.documentElement.outerHTML : ''
            };
          });
          if (state.kind) return state;
        } catch (error) {
          // The user-code frame is still navigating.
        }
      }
      await wait(250);
    }
    return null;
  } finally {
    await page.close();
  }
}

async function routeChecks(context) {
  const page = await loadRoute(context, '?page=ab-apartment');
  check('route: ?page=ab-apartment returns the standalone page',
    Boolean(page) && page.kind === 'page', page && page.kind);
  check('route: page title is exact',
    Boolean(page) && page.title === data.PAGE_TITLE, page && page.title);
  check('route: page has 7 slideshows and 37 slides',
    Boolean(page) && (page.html.match(/class="slideshow"/g) || []).length === 7 &&
      (page.html.match(/class="slide"/g) || []).length === TOTAL_SLIDES,
    page ? (page.html.match(/class="slide"/g) || []).length : null);
  check('route: page has 7 fullscreen buttons and the viewer',
    Boolean(page) && (page.html.match(/class="slide-fs-button"/g) || []).length === 7 &&
      page.html.includes('id="abSlideFs"') &&
      page.html.includes('id="abSlideFsImage"'));
  check('route: page has the 2 copied hero files',
    Boolean(page) &&
      page.html.includes(data.PRODUCTION_ASSET_BASE + 'hero-1920.jpg') &&
      page.html.includes(data.PRODUCTION_ASSET_BASE + 'hero-768.jpg'));
  check('route: page has no Drive, Google Sites, or video chrome',
    Boolean(page) &&
      !/drive\.google\.com|sites\.google\.com|sitesv-images|googleusercontent|player\.vimeo\.com/i
        .test(page.html));
  check('route: page has no anchors or top navigation',
    Boolean(page) && !/<a\b|target="_blank"/i.test(page.html));

  const alRashed = await loadRoute(context, '?page=al-rashed');
  check('route: ?page=al-rashed still returns its page',
    Boolean(alRashed) && alRashed.kind === 'page');
  const cellphone = await loadRoute(context, '?page=cellphone-store');
  check('route: ?page=cellphone-store still returns its page',
    Boolean(cellphone) && cellphone.kind === 'page');
  const dk = await loadRoute(context, '?page=dk-apartment');
  check('route: ?page=dk-apartment still returns its page',
    Boolean(dk) && dk.kind === 'page');

  const slide = await loadRoute(context, '?slide=P004-S01');
  check('route: ?slide=P004-S01 still returns its 7-slide page',
    Boolean(slide) && slide.kind === 'slides' && slide.slides === 7,
    slide ? slide.kind + ' / ' + slide.slides : null);
  const tools = await loadRoute(context, '?tools=P004');
  check('route: ?tools=P004 still returns a logo strip',
    Boolean(tools) && tools.kind === 'tools' && tools.logos === 1);

  const rejected = ['', '?page=', '?page=nope', '?page=ab-apartment/',
    '?page=ab-apartment&page=ab-apartment',
    '?page=ab-apartment&slide=P004-S01',
    '?slide=P004-S01&page=ab-apartment',
    '?page=ab-apartment&tools=P004'];
  for (const query of rejected) {
    const result = await loadRoute(context, query);
    check('route: rejects ' + (query || '(no query)'),
      Boolean(result) && result.kind === 'neutral' && !result.page &&
        result.slides === 0 && result.logos === 0,
      result ? result.kind : 'no user-code frame');
  }
}

async function blockThirdParty(context) {
  await context.route('https://i.imgur.com/**', route => {
    blockedImgurRequests += 1;
    const requestUrl = route.request().url();
    const isTool = data.TOOLS.some(tool => requestUrl === data.toolUrl(tool.id));
    const body = isTool ? LOGO_SVG
      : /h\.jpg$/.test(requestUrl) ? SLIDE_H_SVG : SLIDE_SVG;
    return route.fulfill({ status: 200, contentType: 'image/svg+xml', body });
  });
  await context.route('https://fonts.googleapis.com/**', route => route.fulfill({
    status: 200, contentType: 'text/css; charset=utf-8', body: ''
  }));
  await context.route('https://fonts.gstatic.com/**', route => route.abort());
}

function wrapperHtml(width) {
  return [
    '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>',
    'html,body{margin:0;padding:0;background:#fff}',
    'iframe{display:block;border:0}',
    '</style></head><body>',
    '<iframe id="embed" src="' + url + '?page=ab-apartment" width="' + width +
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

async function runViewport(browser, label, width) {
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
    await page.setContent(wrapperHtml(width), { waitUntil: 'domcontentloaded' });
    const frame = await findPageFrame(page);
    check(label + ': the live sandboxed page frame loads', Boolean(frame));
    if (!frame) throw new Error('live page frame did not load');

    await frame.waitForFunction(() =>
      document.querySelectorAll('.slideshow').length === 7 &&
      document.querySelectorAll('.slide').length === 37 &&
      document.querySelectorAll('.slide-dot').length === 37, null,
      { timeout: 45000, polling: 100 });
    await frame.evaluate(() => document.fonts.ready.then(() => true));
    await frame.waitForFunction(() => {
      const selected = Array.from(document.querySelectorAll(
        '.hero img, .slideshow .slide:first-child img, .tools-row img'));
      return selected.length === 12 &&
        selected.every(image => image.complete && image.naturalWidth > 0);
    }, null, { timeout: 60000, polling: 100 });
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
        title: document.title,
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
        toolsTitleAlign: getComputedStyle(document.getElementById('tools-title')).textAlign,
        fsButtons: document.querySelectorAll('.slide-fs-button').length
      };
    });

    check(label + ': title is exact', state.title === data.PAGE_TITLE);
    check(label + ': frame viewport is ' + width + 'x' + BEHANCE_HEIGHT,
      state.inner[0] === width && state.inner[1] === BEHANCE_HEIGHT);
    check(label + ': page fills exactly ' + BEHANCE_HEIGHT + ' px',
      state.scroll[1] === BEHANCE_HEIGHT && state.body[1] === BEHANCE_HEIGHT &&
        Math.abs(state.main.height - BEHANCE_HEIGHT) <= 1);
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
        : state.roomsGridDisplay === 'grid' && state.roomsGridColumns === 2);
    if (width <= 700) {
      check(label + ': phone room stays compact',
        state.roomWidth <= 231, state.roomWidth);
    }
    check(label + ': hero uses the right source',
      state.hero.includes(width <= 700 ? 'hero-768.jpg' : 'hero-1920.jpg'));
    check(label + ': all first slides use the right Imgur source',
      state.firstSlides.length === 7 &&
        state.firstSlides.every(src => width <= 700
          ? /https:\/\/i\.imgur\.com\/[A-Za-z0-9]+h\.jpg$/.test(src)
          : /https:\/\/i\.imgur\.com\/[A-Za-z0-9]+\.(?:jpg|png)$/.test(src)));
    check(label + ': 4 tools use the exact Imgur logos',
      state.tools.length === 4 &&
        state.tools.every((src, index) => src === data.toolUrl(data.TOOLS[index].id)));
    check(label + ': TOOLS USED is centered',
      state.toolsTitleAlign === 'center', state.toolsTitleAlign);
    check(label + ': each room has a fullscreen button',
      state.fsButtons === 7, state.fsButtons);

    const first = '#slideshow-p004-s01';
    await frame.click(first + ' .slide-arrow.next');
    await frame.waitForFunction(selector =>
      document.querySelector(selector + ' .slide-counter').textContent === '2 / 7',
      first, { timeout: 15000, polling: 100 });
    await frame.click(first + ' .slide-dot:nth-child(4)');
    await frame.waitForFunction(selector =>
      document.querySelector(selector + ' .slide-counter').textContent === '4 / 7',
      first, { timeout: 15000, polling: 100 });
    check(label + ': live first-room navigation works', true);

    if (width <= 700) {
      await frame.press(first, 'Home');
      await frame.waitForFunction(selector =>
        document.querySelector(selector + ' .slide-counter').textContent === '1 / 7',
        first, { timeout: 15000, polling: 100 });
      await frame.evaluate(() => {
        Object.defineProperty(screen, 'width', { configurable: true, get: () => 390 });
        Object.defineProperty(screen, 'height', { configurable: true, get: () => 844 });
        Object.defineProperty(screen, 'availWidth', { configurable: true, get: () => 390 });
        Object.defineProperty(screen, 'availHeight', { configurable: true, get: () => 844 });
      });
      await frame.click(first + ' .slide-fs-button');
      await wait(400);
      const fs = await frame.evaluate(() => {
        const viewer = document.getElementById('abSlideFs');
        const image = document.getElementById('abSlideFsImage');
        const box = viewer.getBoundingClientRect();
        return {
          open: viewer.classList.contains('is-open') && !viewer.hidden,
          height: box.height,
          top: box.top,
          src: image.getAttribute('src'),
          counter: document.getElementById('abSlideFsCounter').textContent,
          backdrop: getComputedStyle(document.getElementById('abSlideFsBackdrop'))
            .backgroundImage,
          body: document.body.classList.contains('slide-fs-open')
        };
      });
      check(label + ': live phone fullscreen uses the maximum screen space',
        fs.open && Math.abs(fs.height - 844) <= 1 && fs.top >= 0 &&
          /https:\/\/i\.imgur\.com\/[A-Za-z0-9]+h\.jpg$/.test(fs.src) &&
          fs.counter === '1 / 7' && fs.body &&
          fs.backdrop.includes('i.imgur.com'),
        JSON.stringify(fs));
      await frame.click('#abSlideFsNext');
      await frame.waitForFunction(() =>
        document.getElementById('abSlideFsCounter').textContent === '2 / 7' &&
        document.querySelector('#slideshow-p004-s01 .slide-counter').textContent === '2 / 7',
        null, { timeout: 15000, polling: 100 });
      check(label + ': live phone fullscreen navigation stays in sync', true);
      await frame.click('#abSlideFsClose');
      await wait(300);
      check(label + ': live phone fullscreen closes cleanly',
        await frame.evaluate(() =>
          document.getElementById('abSlideFs').hidden &&
          !document.body.classList.contains('slide-fs-open')));
    }

    check(label + ': no page errors', pageErrors.length === 0,
      pageErrors.join(' | '));
  } finally {
    await context.close();
  }
}

async function main() {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  check('deployment URL matches the shared deployment ID',
    url === data.embedUrl().replace('?page=ab-apartment', ''), url);

  await assetChecks();

  let browser;
  try {
    browser = await chromium.launch({ channel: 'chrome', headless: true });
    const routeContext = await browser.newContext({ locale: 'en-US' });
    await blockThirdParty(routeContext);
    try {
      await routeChecks(routeContext);
    } finally {
      await routeContext.close();
    }
    await runViewport(browser, 'desktop 987x' + BEHANCE_HEIGHT, BEHANCE_WIDTH);
    await runViewport(browser, 'phone 390x' + BEHANCE_HEIGHT, PHONE_WIDTH);
  } finally {
    if (browser) await browser.close();
  }

  const failed = checks.filter(item => !item.passed);
  const report = {
    url,
    scope: {
      page: '?page=ab-apartment',
      behanceFrames: [BEHANCE_WIDTH + 'x' + BEHANCE_HEIGHT,
        PHONE_WIDTH + 'x' + BEHANCE_HEIGHT],
      slideshows: data.SLIDESHOWS.length,
      slides: TOTAL_SLIDES,
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
