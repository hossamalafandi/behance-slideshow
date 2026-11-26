#!/usr/bin/env node
'use strict';

/**
 * Live DK-Apartment page suite.
 *
 * Runs against the deployed Apps Script URL:
 *  - the new page route and the existing Al-Rashed/Cellphone/slide/tools routes;
 *  - the 2 copied hero files on jsDelivr;
 *  - both Behance-like frames, 38 slides, 2 Vimeo videos, 4 tools.
 *
 * Imgur, Vimeo, and the fonts are stubbed, so no original media is downloaded.
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');
const data = require('./dk-apartment-data');

const ROOT = path.resolve(__dirname, '..');
const RESULTS_DIR = path.join(ROOT, '01_AUDIT', 'evidence', 'dk-apartment');
const REPORT_FILE = path.join(RESULTS_DIR, 'dk-apartment-live-test-results.json');
const BEHANCE_WIDTH = 987;
const PHONE_WIDTH = 390;
const BEHANCE_HEIGHT = data.EMBED_HEIGHT;
const VIMEO_IDS = ['1250270804', '1250270805'];

const url = process.argv[2];
if (!url || !/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url)) {
  console.error('Usage: node test-live-dk-apartment.js <https://script.google.com/macros/s/.../exec>');
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
const VIDEO_HTML = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Vimeo</title></head><body style="margin:0;background:#111;color:#fff;display:flex;align-items:center;justify-content:center;height:100%;font-family:Arial">VIDEO</body></html>';

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
  const page = await loadRoute(context, '?page=dk-apartment');
  check('route: ?page=dk-apartment returns the standalone page',
    Boolean(page) && page.kind === 'page', page && page.kind);
  check('route: page title is exact',
    Boolean(page) && page.title === data.PAGE_TITLE, page && page.title);
  check('route: page has 38 slides and the 1 / 38 counter',
    Boolean(page) && (page.html.match(/class="slide"/g) || []).length === 38 &&
      page.html.includes('1 / ' + data.RENDERS.length));
  check('route: page has 2 Vimeo iframes in order',
    Boolean(page) &&
      JSON.stringify(Array.from(page.html.matchAll(
        /player\.vimeo\.com\/video\/(\d+)/g)).map(match => match[1])) ===
        JSON.stringify(VIMEO_IDS));
  check('route: page has the 2 copied hero files',
    Boolean(page) &&
      page.html.includes(data.PRODUCTION_ASSET_BASE + 'hero-1920.jpg') &&
      page.html.includes(data.PRODUCTION_ASSET_BASE + 'hero-768.jpg'));
  check('route: page has no Drive, Google Sites, or YouTube chrome',
    Boolean(page) &&
      !/drive\.google\.com|sites\.google\.com|sitesv-images|googleusercontent|youtube\.com/i
        .test(page.html));
  check('route: page has no anchors or top navigation',
    Boolean(page) && !/<a\b|target="_blank"/i.test(page.html));

  const alRashed = await loadRoute(context, '?page=al-rashed');
  check('route: ?page=al-rashed still returns its page',
    Boolean(alRashed) && alRashed.kind === 'page' &&
      alRashed.title === 'Al-Rashed Project — Hossam Alafandi');
  const cellphone = await loadRoute(context, '?page=cellphone-store');
  check('route: ?page=cellphone-store still returns its page',
    Boolean(cellphone) && cellphone.kind === 'page' &&
      cellphone.title === 'Cellphone Store — Hossam Alafandi');

  const slide = await loadRoute(context, '?slide=P003-S01');
  check('route: ?slide=P003-S01 still returns its 38-slide page',
    Boolean(slide) && slide.kind === 'slides' && slide.slides === 38,
    slide ? slide.kind + ' / ' + slide.slides : null);
  const tools = await loadRoute(context, '?tools=P003');
  check('route: ?tools=P003 still returns a logo strip',
    Boolean(tools) && tools.kind === 'tools' && tools.logos === 1);

  const rejected = ['', '?page=', '?page=nope', '?page=dk-apartment/',
    '?page=dk-apartment&page=dk-apartment',
    '?page=dk-apartment&slide=P003-S01',
    '?slide=P003-S01&page=dk-apartment',
    '?page=dk-apartment&tools=P003'];
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
    const body = requestUrl.endsWith('.png') ? LOGO_SVG
      : /h\.jpg$/.test(requestUrl) ? SLIDE_H_SVG : SLIDE_SVG;
    return route.fulfill({ status: 200, contentType: 'image/svg+xml', body });
  });
  await context.route('https://player.vimeo.com/**', route => route.fulfill({
    status: 200, contentType: 'text/html; charset=utf-8', body: VIDEO_HTML
  }));
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
    '<iframe id="embed" src="' + url + '?page=dk-apartment" width="' + width +
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
          Boolean(document.getElementById('rendersSlideshow')));
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
      document.querySelectorAll('.slide').length === 38 &&
      document.querySelectorAll('.slide-dot').length === 38, null,
      { timeout: 45000, polling: 100 });
    await frame.evaluate(() => document.fonts.ready.then(() => true));
    await frame.waitForFunction(() => {
      const selected = [
        document.querySelector('.hero img'),
        document.querySelector('.tools-row img'),
        document.querySelector('.slide:first-child img')
      ];
      return selected.every(image => image && image.complete && image.naturalWidth > 0);
    }, null, { timeout: 60000, polling: 100 });
    await wait(300);

    const state = await frame.evaluate(() => {
      const rect = element => {
        const box = element.getBoundingClientRect();
        return { x: Math.round(box.x), y: Math.round(box.y + scrollY),
          width: Math.round(box.width), height: Math.round(box.height) };
      };
      return {
        title: document.title,
        inner: [innerWidth, innerHeight],
        scroll: [document.documentElement.scrollWidth, document.documentElement.scrollHeight],
        body: [document.body.scrollWidth, document.body.scrollHeight],
        main: rect(document.getElementById('page')),
        headings: Array.from(document.querySelectorAll('h2')).map(h => h.textContent.trim()),
        slides: document.querySelectorAll('.slide').length,
        dots: document.querySelectorAll('.slide-dot').length,
        videos: Array.from(document.querySelectorAll('.video-frame iframe')).map(iframe => iframe.src),
        videoColumns: getComputedStyle(document.querySelector('.video-row'))
          .gridTemplateColumns.trim().split(/\s+/).length,
        tools: Array.from(document.querySelectorAll('.tools-row img')).map(image => image.src),
        counter: document.getElementById('slideCounter').textContent,
        stageWidth: document.getElementById('slideshowStage').getBoundingClientRect().width,
        slideWidth: document.querySelector('.slide').getBoundingClientRect().width,
        trackWidth: document.getElementById('slideshowTrack').getBoundingClientRect().width,
        hero: (() => {
          const image = document.querySelector('.hero img');
          return image.currentSrc || image.getAttribute('src');
        })(),
        firstSlide: (() => {
          const image = document.querySelector('.slide img');
          return image.currentSrc || image.getAttribute('src');
        })()
      };
    });

    check(label + ': title is exact', state.title === data.PAGE_TITLE);
    check(label + ': frame viewport is ' + width + 'x' + BEHANCE_HEIGHT,
      state.inner[0] === width && state.inner[1] === BEHANCE_HEIGHT);
    check(label + ': page fills exactly ' + BEHANCE_HEIGHT + ' px',
      state.scroll[1] === BEHANCE_HEIGHT && state.body[1] === BEHANCE_HEIGHT &&
        Math.abs(state.main.height - BEHANCE_HEIGHT) <= 1,
      JSON.stringify({ scroll: state.scroll, body: state.body, main: state.main.height }));
    check(label + ': no horizontal overflow',
      state.scroll[0] === width && state.body[0] === width);
    check(label + ': headings are exact',
      JSON.stringify(state.headings) ===
        JSON.stringify(['OVERVIEW', 'PRESENTATION', 'IMAGES', 'TOOLS USED']));
    check(label + ': 38 slides, 38 dots, and the 1 / 38 counter',
      state.slides === 38 && state.dots === 38 && state.counter === '1 / 38');
    check(label + ': slideshow track is 38 full frames wide',
      Math.abs(state.slideWidth - state.stageWidth) <= 1 &&
        Math.abs(state.trackWidth - state.stageWidth * 38) <= 2,
      JSON.stringify({ stage: state.stageWidth, slide: state.slideWidth,
        track: state.trackWidth }));
    check(label + ': hero uses the right source',
      state.hero.includes(width <= 700 ? 'hero-768.jpg' : 'hero-1920.jpg'));
    check(label + ': first slide uses the right Imgur source',
      width <= 700
        ? /https:\/\/i\.imgur\.com\/[A-Za-z0-9]+h\.jpg$/.test(state.firstSlide)
        : /https:\/\/i\.imgur\.com\/[A-Za-z0-9]+\.jpg$/.test(state.firstSlide));
    check(label + ': 2 Vimeo videos are present in order',
      state.videos.length === 2 &&
        state.videos.every((src, index) => src.includes(VIMEO_IDS[index])));
    check(label + ': video row is 2 columns on desktop and 1 on phone',
      state.videoColumns === (width <= 700 ? 1 : 2), state.videoColumns);
    check(label + ': 4 tools use the exact Imgur logos',
      state.tools.length === 4 &&
        state.tools.every((src, index) => src === data.toolUrl(data.TOOLS[index].id)));

    await frame.click('#slideNext');
    await frame.waitForFunction(() =>
      document.getElementById('slideCounter').textContent === '2 / 38', null,
      { timeout: 15000, polling: 100 });
    check(label + ': live next moves to 2 / 38', true);
    await frame.click('.slide-dot:nth-child(20)');
    await frame.waitForFunction(() =>
      document.getElementById('slideCounter').textContent === '20 / 38', null,
      { timeout: 15000, polling: 100 });
    check(label + ': live dot 20 jumps to 20 / 38', true);

    check(label + ': no page errors', pageErrors.length === 0,
      pageErrors.join(' | '));
  } finally {
    await context.close();
  }
}

async function main() {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  check('deployment URL matches the shared deployment ID',
    url === data.embedUrl().replace('?page=dk-apartment', ''), url);

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
      page: '?page=dk-apartment',
      behanceFrames: [BEHANCE_WIDTH + 'x' + BEHANCE_HEIGHT,
        PHONE_WIDTH + 'x' + BEHANCE_HEIGHT],
      slides: data.RENDERS.length,
      videos: data.VIDEOS.length,
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
