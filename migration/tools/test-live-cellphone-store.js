#!/usr/bin/env node
'use strict';

/**
 * Live Cellphone Store page suite.
 *
 * Runs against the deployed Apps Script URL:
 *  - the page route and the existing Al-Rashed, slide, and tools routes;
 *  - all 44 copied jsDelivr assets resolve as JPEGs;
 *  - both Behance-like frames fill the fixed 11500 px height;
 *  - 9 Vimeo videos, 21 copied shots, 11 slides, 4 tools, and the map;
 *  - slideshow navigation and phone/desktop source selection.
 *
 * Imgur, Vimeo, and the map are fulfilled with synthetic content, so no
 * original media is downloaded.
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');
const data = require('./cellphone-data');

const ROOT = path.resolve(__dirname, '..');
const RESULTS_DIR = path.join(ROOT, '01_AUDIT', 'evidence', 'cellphone-store');
const REPORT_FILE = path.join(RESULTS_DIR, 'cellphone-store-live-test-results.json');
const BEHANCE_WIDTH = 987;
const PHONE_WIDTH = 390;
const BEHANCE_HEIGHT = data.EMBED_HEIGHT;
const VIMEO_IDS = [
  '1245908917', '1245909044', '1245909094', '1245909398',
  '1245912603', '1245912647', '1245912852', '1245913033', '1245913587'
];

const url = process.argv[2];
if (!url || !/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url)) {
  console.error('Usage: node test-live-cellphone-store.js <https://script.google.com/macros/s/.../exec>');
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

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function wait(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

function expectedAssets() {
  const names = new Set(['hero-1920.jpg', 'hero-768.jpg']);
  const add = name => {
    names.add(name + '-1280.jpg');
    names.add(name + '-768.jpg');
  };
  data.STAGES.forEach(stage => {
    (stage.images || []).forEach(add);
    if (stage.drawing) add(stage.drawing);
    (stage.groups || []).forEach(group => group.images.forEach(add));
  });
  data.REALITY.forEach(item => {
    add(item.render);
    add(item.photo);
  });
  return Array.from(names).sort();
}

const SLIDE_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="2000" height="2667"><rect width="2000" height="2667" fill="#1c2a3a"/></svg>';
const SLIDE_H_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1365"><rect width="1024" height="1365" fill="#1c2a3a"/></svg>';
const LOGO_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="#000"/></svg>';
const VIDEO_HTML = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Vimeo</title></head><body style="margin:0;background:#111;color:#fff;display:flex;align-items:center;justify-content:center;height:100%;font-family:Arial">VIDEO</body></html>';
const MAP_HTML = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Map</title></head><body style="margin:0;background:#ddeeff;display:flex;align-items:center;justify-content:center;font-family:Arial">MAP</body></html>';

async function assetChecks() {
  const assets = expectedAssets();
  for (const name of assets) {
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
      await wait(400 * attempt);
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
              body: body.slice(0, 200),
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

async function loadRouteRetry(context, query) {
  let result = await loadRoute(context, query);
  if (!result) {
    await wait(1200);
    result = await loadRoute(context, query);
  }
  return result;
}

async function routeChecks(context) {
  const page = await loadRouteRetry(context, '?page=cellphone-store');
  check('route: ?page=cellphone-store returns the standalone page',
    Boolean(page) && page.kind === 'page', page && page.kind);
  check('route: page title is exact',
    Boolean(page) && page.title === data.PAGE_TITLE, page && page.title);
  check('route: page has 9 Vimeo iframes',
    Boolean(page) &&
      (page.html.match(/player\.vimeo\.com\/video\/\d+/g) || []).length === 9);
  check('route: page has the 44 copied assets',
    Boolean(page) && expectedAssets().every(name =>
      page.html.includes(data.PRODUCTION_ASSET_BASE + name)));
  check('route: page has 21 copied shot images',
    Boolean(page) &&
      (page.html.match(/class="shot(?:\s|")/g) || []).length === 21,
    page ? (page.html.match(/class="shot(?:\s|")/g) || []).length : null);
  check('route: page has 11 slides and the 1 / 11 counter',
    Boolean(page) && (page.html.match(/class="slide"/g) || []).length === 11 &&
      page.html.includes('1 / ' + data.RENDERS.length));
  check('route: page has one map iframe',
    Boolean(page) && page.html.includes('class="map-frame"'));
  check('route: page has no Drive, Google Sites, or YouTube chrome',
    Boolean(page) &&
      !/drive\.google\.com|sites\.google\.com|sitesv-images|googleusercontent|youtube\.com/i
        .test(page.html));
  check('route: page has no anchors or top navigation',
    Boolean(page) && !/<a\b|target="_blank"/i.test(page.html));

  const upper = await loadRouteRetry(context, '?page=CELLPHONE-STORE');
  check('route: cellphone-store page value is case-insensitive',
    Boolean(upper) && upper.kind === 'page', upper && upper.kind);

  const alRashed = await loadRouteRetry(context, '?page=al-rashed');
  check('route: ?page=al-rashed still returns its page',
    Boolean(alRashed) && alRashed.kind === 'page' &&
      alRashed.title === 'Al-Rashed Project — Hossam Alafandi',
    alRashed && alRashed.title);

  const slide = await loadRouteRetry(context, '?slide=P002-S01');
  check('route: ?slide=P002-S01 still returns its 11-slide page',
    Boolean(slide) && slide.kind === 'slides' && slide.slides === 11 && !slide.page,
    slide ? slide.kind + ' / ' + slide.slides : null);
  const tools = await loadRouteRetry(context, '?tools=P002');
  check('route: ?tools=P002 still returns a logo strip',
    Boolean(tools) && tools.kind === 'tools' && tools.logos === 1 && !tools.page,
    tools ? tools.kind + ' / ' + tools.logos : null);

  const rejected = ['', '?page=', '?page=nope', '?page=cellphone-store/',
    '?page=cellphone-store&page=cellphone-store',
    '?page=cellphone-store&slide=P002-S01',
    '?slide=P002-S01&page=cellphone-store',
    '?page=cellphone-store&tools=P002'];
  for (const query of rejected) {
    const result = await loadRouteRetry(context, query);
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
  await context.route('https://maps-api-ssl.google.com/**', route => route.fulfill({
    status: 200, contentType: 'text/html; charset=utf-8', body: MAP_HTML
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
    '<iframe id="embed" src="' + url + '?page=cellphone-store" width="' + width +
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
    assert(frame, 'live page frame did not load');

    await frame.waitForFunction(() =>
      document.querySelectorAll('.slide').length === 11 &&
      document.querySelectorAll('.slide-dot').length === 11, null,
      { timeout: 45000, polling: 100 });
    await frame.evaluate(() => document.fonts.ready.then(() => true));
    await frame.waitForFunction(() => {
      const images = Array.from(document.querySelectorAll(
        '.hero img, .shot img, .slide img, .tools-row img'));
      return images.length === 37 && images.every(image => image.complete && image.naturalWidth > 0);
    }, null, { timeout: 45000, polling: 100 });
    await wait(400);

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
        stages: document.querySelectorAll('.stage').length,
        videos: Array.from(document.querySelectorAll('.video-frame iframe')).map(iframe => iframe.src),
        shots: Array.from(document.querySelectorAll('.shot img')).map(image => ({
          src: image.currentSrc || image.getAttribute('src')
        })),
        slides: Array.from(document.querySelectorAll('.slide img')).map(image => ({
          src: image.currentSrc || image.getAttribute('src'),
          natural: [image.naturalWidth, image.naturalHeight]
        })),
        tools: Array.from(document.querySelectorAll('.tools-row img')).map(image => image.src),
        map: document.querySelector('.map-frame').src,
        counter: document.getElementById('slideCounter').textContent,
        dots: document.querySelectorAll('.slide-dot').length
      };
    });

    check(label + ': title is exact', state.title === data.PAGE_TITLE);
    check(label + ': frame viewport is ' + width + 'x' + BEHANCE_HEIGHT,
      state.inner[0] === width && state.inner[1] === BEHANCE_HEIGHT,
      state.inner.join('x'));
    check(label + ': page fills exactly ' + BEHANCE_HEIGHT + ' px',
      state.scroll[1] === BEHANCE_HEIGHT && state.body[1] === BEHANCE_HEIGHT &&
        Math.abs(state.main.height - BEHANCE_HEIGHT) <= 1,
      JSON.stringify({ scroll: state.scroll, body: state.body, main: state.main.height }));
    check(label + ': no horizontal overflow',
      state.scroll[0] === width && state.body[0] === width,
      state.scroll[0] + ' / ' + state.body[0]);
    check(label + ': headings and stages are exact',
      JSON.stringify(state.headings) === JSON.stringify([
        'OVERVIEW', 'WORK DEVELOPMENT STAGES', 'Render VS Reality', 'LOCATION', 'TOOLS USED'
      ]) && state.stages === 7,
      state.headings.join(', ') + ' / ' + state.stages);
    check(label + ': 9 Vimeo videos are present in order',
      JSON.stringify(state.videos.map(src =>
        (src.match(/video\/(\d+)/) || [])[1])) === JSON.stringify(VIMEO_IDS),
      state.videos.length + ' videos');
    check(label + ': 21 copied shots use the right source size',
      state.shots.length === 21 &&
        state.shots.every(shot => shot.src.includes(
          width <= 700 ? '-768.jpg' : '-1280.jpg')),
      state.shots.length + ' / ' + (state.shots[0] && state.shots[0].src));
    check(label + ': 11 slides use the right Imgur size',
      state.slides.length === 11 &&
        state.slides.every(slide => width <= 700
          ? /https:\/\/i\.imgur\.com\/[A-Za-z0-9]+h\.jpg$/.test(slide.src)
          : /https:\/\/i\.imgur\.com\/[A-Za-z0-9]+\.jpg$/.test(slide.src)),
      state.slides.length + ' / ' + (state.slides[0] && state.slides[0].src));
    check(label + ': first slide decodes at the expected size',
      width <= 700
        ? state.slides[0].natural[0] === 1024 && state.slides[0].natural[1] === 1365
        : state.slides[0].natural[0] === 2000 && state.slides[0].natural[1] === 2667,
      state.slides[0].natural.join('x'));
    check(label + ': 4 tools use the exact Imgur logos',
      state.tools.length === 4 &&
        state.tools.every((src, index) => src === data.toolUrl(data.TOOLS[index].id)));
    check(label + ': the map keeps the exact URL',
      state.map === data.MAP_URL, state.map);
    check(label + ': slideshow starts at 1 / 11 with 11 dots',
      state.counter === '1 / 11' && state.dots === 11,
      state.counter + ' / ' + state.dots);

    await frame.click('#slideNext');
    await frame.waitForFunction(() =>
      document.getElementById('slideCounter').textContent === '2 / 11', null,
      { timeout: 15000, polling: 100 });
    check(label + ': live next moves to 2 / 11', true);
    await frame.click('.slide-dot:nth-child(5)');
    await frame.waitForFunction(() =>
      document.getElementById('slideCounter').textContent === '5 / 11', null,
      { timeout: 15000, polling: 100 });
    check(label + ': live dot 5 jumps to 5 / 11', true);

    check(label + ': no page errors', pageErrors.length === 0,
      pageErrors.join(' | '));
  } finally {
    await context.close();
  }
}

async function main() {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  check('deployment URL matches the shared deployment ID',
    url === data.embedUrl().replace('?page=cellphone-store', ''),
    url);

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
      page: '?page=cellphone-store',
      behanceFrames: [BEHANCE_WIDTH + 'x' + BEHANCE_HEIGHT,
        PHONE_WIDTH + 'x' + BEHANCE_HEIGHT],
      stages: data.STAGES.length,
      videos: VIMEO_IDS.length,
      assets: expectedAssets().length
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
