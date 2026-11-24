#!/usr/bin/env node
'use strict';

/**
 * Live Al-Rashed page suite.
 *
 * Runs against the deployed Apps Script URL after version 12 is live:
 *  - all 9 page images resolve through jsDelivr with JPEG bytes;
 *  - `?page=al-rashed` returns the page, and `?slide=` / `?tools=` still work;
 *  - mixed, repeated, and unknown values keep the neutral error page;
 *  - the page fills Behance-like sandboxed frames at 987x2980 and 390x2980;
 *  - desktop visitors receive the full-resolution 3840x2160 render originals,
 *    phone visitors receive the 1024x576 `h` variants, and both decode at the
 *    expected dimensions;
 *  - navigation, dots, keyboard, swipe, fullscreen, map, tools, and copyright
 *    all work in the live deployment.
 *
 * Every Imgur request is fulfilled with a synthetic SVG, so no original
 * slideshow render or logo is downloaded. The 9 jsDelivr files are this
 * repository's own small derivatives and are fetched to prove the CDN works.
 *
 * Usage:
 *   node test-live-al-rashed.js <deployment-url>
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');
const data = require('./al-rashed-data');

const ROOT = path.resolve(__dirname, '..');
const RESULTS_DIR = path.join(ROOT, '01_AUDIT', 'evidence', 'al-rashed');
const REPORT_FILE = path.join(RESULTS_DIR, 'al-rashed-live-test-results.json');
const BEHANCE_WIDTH = 987;
const PHONE_WIDTH = 390;
const BEHANCE_HEIGHT = data.EMBED_HEIGHT;

const url = process.argv[2];
if (!url || !/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url)) {
  console.error('Usage: node test-live-al-rashed.js <https://script.google.com/macros/s/.../exec>');
  process.exit(2);
}

const ASSETS = [
  { name: 'hero-768.jpg', width: 768, height: 432 },
  { name: 'hero-1280.jpg', width: 1280, height: 720 },
  { name: 'hero-1920.jpg', width: 1920, height: 1080 },
  ...data.REAL_PHOTOS.flatMap(photo => [
    { name: photo.file, width: 768, height: 577 },
    { name: photo.desktop,
      width: photo.desktop === 'real3-1280.jpg' ? 1280 : 1277,
      height: photo.desktop === 'real3-1280.jpg' ? 962 : 960 }
  ])
];

function renderSvg(width, height) {
  return [
    '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height + '">',
    '<rect width="' + width + '" height="' + height + '" fill="#17324d"/>',
    '<circle cx="' + width / 2 + '" cy="' + height / 2 + '" r="150" fill="#e2a24a"/>',
    '</svg>'
  ].join('');
}
const RENDER_SVG = renderSvg(3840, 2160);
const RENDER_THUMB_SVG = renderSvg(1024, 576);
const LOGO_SVG = [
  '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">',
  '<rect width="200" height="200" fill="#000"/>',
  '<text x="100" y="110" font-family="Arial" font-size="26" fill="#fff" ',
  'text-anchor="middle">LOGO</text>',
  '</svg>'
].join('');
const MAP_HTML = [
  '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Map</title></head>',
  '<body style="margin:0;background:#ddeeff;display:flex;align-items:center;',
  'justify-content:center;font-family:Arial">MAP</body></html>'
].join('');

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

function assertEqual(actual, expected, label) {
  assert(actual === expected, label + ': expected ' + JSON.stringify(expected) +
    ', got ' + JSON.stringify(actual));
}

function wait(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

function translatePercent(value) {
  const match = /translateX\((-?[0-9.]+)%\)/.exec(value || '');
  return match ? Number.parseFloat(match[1]) : NaN;
}

function isAllowedRequest(requestUrl) {
  let host;
  try {
    host = new URL(requestUrl).hostname;
  } catch (error) {
    return false;
  }
  if (host === 'sites.google.com' || host.endsWith('.sites.google.com')) {
    return false;
  }
  return host === 'script.google.com' ||
    host.endsWith('.googleusercontent.com') ||
    host === 'i.imgur.com' ||
    host === 'cdn.jsdelivr.net' ||
    host === 'maps-api-ssl.google.com' ||
    host === 'fonts.googleapis.com' ||
    host === 'fonts.gstatic.com' ||
    host === 'csp.withgoogle.com' ||
    host === 'www.google.com' ||
    host.endsWith('.gstatic.com');
}

async function assetChecks() {
  for (const asset of ASSETS) {
    const assetUrl = data.PRODUCTION_ASSET_BASE + asset.name;
    try {
      const response = await fetch(assetUrl, { redirect: 'follow' });
      const bytes = new Uint8Array(await response.arrayBuffer());
      check('jsDelivr: ' + asset.name + ' returns 200',
        response.status === 200, 'HTTP ' + response.status);
      check('jsDelivr: ' + asset.name + ' is a JPEG',
        bytes.length > 4 && bytes[0] === 0xff && bytes[1] === 0xd8 &&
          bytes[bytes.length - 2] === 0xff && bytes[bytes.length - 1] === 0xd9,
        bytes.length + ' bytes');
      check('jsDelivr: ' + asset.name + ' is the committed file',
        bytes.length > 0 && bytes.length === fs.statSync(
          path.resolve(ROOT, '..', 'assets', 'al-rashed', asset.name)).size,
        bytes.length + ' vs ' + fs.statSync(
          path.resolve(ROOT, '..', 'assets', 'al-rashed', asset.name)).size);
      check('jsDelivr: ' + asset.name + ' content type is image/jpeg',
        /^image\/jpeg\b/.test(response.headers.get('content-type') || ''),
        response.headers.get('content-type'));
    } catch (error) {
      check('jsDelivr: ' + asset.name + ' loads', false, error.message);
    }
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
            const pageRoot = Boolean(document.getElementById('rendersViewer'));
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

async function routeChecks(context) {
  const page = await loadRoute(context, '?page=al-rashed');
  check('route: ?page=al-rashed returns the standalone page',
    Boolean(page) && page.kind === 'page', page && page.kind);
  check('route: page title is exact',
    Boolean(page) && page.title === data.PAGE_TITLE, page && page.title);
  check('route: page has the standalone root',
    Boolean(page) && page.html.includes('<main id="page">'));
  check('route: page has all 17 renders',
    Boolean(page) &&
      (page.html.match(/class="render-slide"/g) || []).length === 17,
    page ? (page.html.match(/class="render-slide"/g) || []).length : null);
  check('route: page has the 17 full-resolution render originals',
    Boolean(page) &&
      (page.html.match(
        /<img src="https:\/\/i\.imgur\.com\/[A-Za-z0-9]+\.jpeg"/g
      ) || []).length === 17);
  check('route: page has the 17 phone h render sources',
    Boolean(page) &&
      (page.html.match(
        /<source media="\(max-width: 700px\)" srcset="https:\/\/i\.imgur\.com\/[A-Za-z0-9]+h\.jpeg">/g
      ) || []).length === 17);
  check('route: page has the 9 jsDelivr assets',
    Boolean(page) && ASSETS.every(asset => page.html.includes(
      data.PRODUCTION_ASSET_BASE + asset.name)));
  check('route: page has one map iframe',
    Boolean(page) && (page.html.match(/<iframe\b/g) || []).length === 1 &&
      page.html.includes('class="map-frame"'));
  check('route: page has no Google Sites chrome',
    Boolean(page) &&
      !/sites\.google\.com|googleusercontent|view\/hossam-alafandi|Report abuse/i
        .test(page.html));
  check('route: page has no slideshow catalog',
    Boolean(page) && !/P\d{3}-S\d{2}/.test(page.html));

  const upper = await loadRoute(context, '?page=AL-RASHED');
  check('route: page value is case-insensitive',
    Boolean(upper) && upper.kind === 'page', upper && upper.kind);

  const slide = await loadRoute(context, '?slide=P001-S01');
  check('route: ?slide=P001-S01 still returns its 17-slide page',
    Boolean(slide) && slide.kind === 'slides' && slide.slides === 17 &&
      !slide.page,
    slide ? slide.kind + ' / ' + slide.slides : null);
  const tools = await loadRoute(context, '?tools=P001');
  check('route: ?tools=P001 still returns a logo strip',
    Boolean(tools) && tools.kind === 'tools' && tools.logos === 1 &&
      !tools.page,
    tools ? tools.kind + ' / ' + tools.logos : null);

  const rejected = ['', '?page=', '?page=nope', '?page=al-rashed/',
    '?page=al-rashed&page=al-rashed', '?page=al-rashed&slide=P001-S01',
    '?slide=P001-S01&page=al-rashed', '?page=al-rashed&tools=P001'];
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
      : /h\.jpeg$/.test(requestUrl) ? RENDER_THUMB_SVG : RENDER_SVG;
    return route.fulfill({ status: 200, contentType: 'image/svg+xml', body });
  });
  await context.route('https://maps-api-ssl.google.com/**', route => route.fulfill({
    status: 200,
    contentType: 'text/html; charset=utf-8',
    body: MAP_HTML
  }));
  await context.route('https://fonts.googleapis.com/**', route => route.fulfill({
    status: 200,
    contentType: 'text/css; charset=utf-8',
    body: ''
  }));
  await context.route('https://fonts.gstatic.com/**', route => route.abort());
}

function wrapperHtml(width) {
  return [
    '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>',
    'html,body{margin:0;padding:0;background:#fff}',
    'iframe{display:block;border:0}',
    '</style></head><body>',
    '<iframe id="embed" src="' + url + '?page=al-rashed" width="' + width +
      '" height="' + BEHANCE_HEIGHT + '"',
    ' sandbox="allow-same-origin allow-scripts allow-pointer-lock allow-forms"',
    ' allowfullscreen allow="fullscreen"></iframe>',
    '</body></html>'
  ].join('');
}

async function findPageFrame(page) {
  for (let attempt = 0; attempt < 240; attempt++) {
    for (const frame of page.frames()) {
      try {
        const ready = await frame.evaluate(() =>
          Boolean(document.getElementById('rendersViewer')));
        if (ready) return frame;
      } catch (error) {
        // Frame is redirecting; try again.
      }
    }
    await wait(250);
  }
  return null;
}

async function runViewport(browser, label, width, expected) {
  const context = await browser.newContext({
    viewport: { width, height: BEHANCE_HEIGHT },
    deviceScaleFactor: 1,
    locale: 'en-US'
  });
  await blockThirdParty(context);
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  const requests = [];
  page.on('request', request => requests.push(request.url()));

  try {
    await page.setContent(wrapperHtml(width), { waitUntil: 'domcontentloaded' });
    const frame = await findPageFrame(page);
    check(label + ': the live sandboxed page frame loads', Boolean(frame));
    assert(frame, 'live page frame did not load');

    await frame.waitForFunction(() =>
      document.querySelectorAll('.render-slide').length === 17 &&
      document.querySelectorAll('.render-dot').length === 17, null,
      { timeout: 45000, polling: 100 });
    await frame.evaluate(() => document.fonts.ready.then(() => true));
    await frame.waitForFunction(() => {
      const visible = Array.from(document.querySelectorAll(
        '.hero img, .photo-grid img, .tools-row img, .render-slide:first-child img'));
      return visible.length === 10 &&
        visible.every(image => image.complete && image.naturalWidth > 0);
    }, null, { timeout: 45000, polling: 100 });
    await wait(400);

    const state = await frame.evaluate(() => {
      const rect = element => {
        const box = element.getBoundingClientRect();
        return {
          x: Math.round(box.x),
          y: Math.round(box.y),
          width: Math.round(box.width),
          height: Math.round(box.height),
          bottom: Math.round(box.bottom)
        };
      };
      const style = element => getComputedStyle(element);
      const images = Array.from(document.images);
      const photoImages = Array.from(document.querySelectorAll('.photo-grid img'));
      const renders = Array.from(document.querySelectorAll('.render-slide img'));
      const tools = Array.from(document.querySelectorAll('.tools-row img'));
      const counter = document.getElementById('renderCounter');
      const mapFrame = document.querySelector('.map-frame');
      const photoGrid = document.querySelector('.photo-grid');
      const hero = document.querySelector('.hero img');
      const copyright = document.querySelector('.copyright');
      return {
        title: document.title,
        inner: [innerWidth, innerHeight],
        scroll: [document.documentElement.scrollWidth,
          document.documentElement.scrollHeight],
        client: [document.documentElement.clientWidth,
          document.documentElement.clientHeight],
        main: rect(document.getElementById('page')),
        hero: { ...rect(document.querySelector('.hero')),
          src: hero.currentSrc || hero.src,
          natural: [hero.naturalWidth, hero.naturalHeight] },
        h2: Array.from(document.querySelectorAll('.section h2')).map(element =>
          element.textContent.trim()),
        overview: document.querySelector('.overview p').textContent.trim(),
        slides: document.querySelectorAll('.render-slide').length,
        dots: document.querySelectorAll('.render-dot').length,
        counter: counter.textContent,
        currentDot: Array.from(document.querySelectorAll('.render-dot'))
          .findIndex(dot => dot.getAttribute('aria-current') === 'true'),
        stage: rect(document.getElementById('rendersStage')),
        renders: renders.map(image => ({
          src: image.currentSrc || image.src,
          natural: [image.naturalWidth, image.naturalHeight]
        })),
        photoTracks: style(photoGrid).gridTemplateColumns.trim().split(/\s+/).length,
        photos: photoImages.map(image => ({
          src: image.currentSrc || image.src,
          natural: [image.naturalWidth, image.naturalHeight],
          ...rect(image)
        })),
        photoFigures: Array.from(document.querySelectorAll('.photo-grid figure'))
          .map(figure => rect(figure)),
        tools: tools.map(image => ({
          src: image.currentSrc || image.src,
          natural: [image.naturalWidth, image.naturalHeight],
          ...rect(image)
        })),
        map: { src: mapFrame.getAttribute('src'), ...rect(mapFrame) },
        copyright: { text: copyright.textContent.trim(), ...rect(copyright) },
        links: document.querySelectorAll('a').length,
        navs: document.querySelectorAll('nav').length,
        iframes: document.querySelectorAll('iframe').length,
        scripts: Array.from(document.scripts).map(script => ({
          src: script.src,
          text: script.textContent.slice(0, 160)
        })),
        cookie: document.cookie,
        localStorage: (() => { try { return localStorage.length; }
          catch (error) { return 'blocked'; } })(),
        sessionStorage: (() => { try { return sessionStorage.length; }
          catch (error) { return 'blocked'; } })(),
        images: images.length
      };
    });

    check(label + ': title is exact', state.title === data.PAGE_TITLE);
    check(label + ': frame viewport is ' + width + 'x' + BEHANCE_HEIGHT,
      state.inner[0] === width && state.inner[1] === BEHANCE_HEIGHT,
      state.inner.join('x'));
    check(label + ': page fills exactly ' + BEHANCE_HEIGHT + ' px',
      state.scroll[1] === BEHANCE_HEIGHT &&
        state.main.height === BEHANCE_HEIGHT,
      JSON.stringify({ scroll: state.scroll, main: state.main.height }));
    check(label + ': no horizontal overflow',
      state.scroll[0] === width && state.client[0] === width,
      JSON.stringify({ scroll: state.scroll[0], client: state.client[0] }));
    check(label + ': all five section headings are present',
      JSON.stringify(state.h2) ===
        JSON.stringify(['OVERVIEW', 'RENDERS', 'REAL PHOTOS', 'LOCATION', 'TOOLS USED']),
      state.h2.join(', '));
    check(label + ': overview text is exact',
      state.overview === data.OVERVIEW_TEXT);

    check(label + ': hero uses the ' + expected.heroWidth + ' px jsDelivr file',
      state.hero.src === data.PRODUCTION_ASSET_BASE + expected.heroFile &&
        Math.abs(state.hero.natural[0] / state.hero.natural[1] - 16 / 9) <= 0.01,
      JSON.stringify(state.hero));
    check(label + ': hero fills the top of the page',
      state.hero.y === 0 && state.hero.width === width, JSON.stringify(state.hero));

    check(label + ': 17 renders, 17 dots, and the 1 / 17 counter',
      state.slides === 17 && state.dots === 17 &&
        state.counter === '1 / 17' && state.currentDot === 0,
      [state.slides, state.dots, state.counter].join(' / '));
    check(label + ': live render URLs match the expected source in order',
      state.renders.length === 17 &&
        state.renders.every((image, index) =>
          image.src === expected.renderUrls[index]));
    check(label + ': first render decodes at ' + expected.renderWidth + 'x' +
      expected.renderHeight,
      state.renders[0].natural[0] === expected.renderWidth &&
        state.renders[0].natural[1] === expected.renderHeight,
      state.renders[0].natural.join('x'));
    check(label + ': render stage keeps 16:9',
      Math.abs(state.stage.width / state.stage.height - 16 / 9) <= 0.01,
      state.stage.width + 'x' + state.stage.height);

    check(label + ': photo grid uses ' + expected.photoTracks + ' track(s)',
      state.photoTracks === expected.photoTracks, state.photoTracks);
    check(label + ': 3 real photos use the expected jsDelivr files',
      state.photos.length === 3 &&
        state.photos.every((photo, index) =>
          photo.src === data.PRODUCTION_ASSET_BASE +
            expected.photoFiles[index] &&
          photo.natural[0] === expected.photoSizes[index][0] &&
          photo.natural[1] === expected.photoSizes[index][1]),
      state.photos.map(photo => photo.src.split('/').pop() + ' ' +
        photo.natural.join('x')).join(', '));
    check(label + ': all three photos are visible with rounded figures',
      state.photoFigures.length === 3 &&
        state.photoFigures.every(figure => figure.width > 0 && figure.height > 0));

    check(label + ': 5 tool logos use their exact Imgur URLs',
      state.tools.length === 5 &&
        state.tools.every((tool, index) =>
          tool.src === data.toolUrl(data.TOOLS[index].id) &&
          tool.natural[0] === 200 && tool.natural[1] === 200));
    check(label + ': tool logos share one row',
      state.tools.every(tool => Math.abs(tool.y - state.tools[0].y) <= 1));

    check(label + ': map iframe keeps the exact live URL and expected height',
      state.map.src === data.MAP_URL &&
        Math.abs(state.map.height - expected.mapHeight) <= 1,
      state.map.src + ' @ ' + state.map.height);
    const mapFrame = page.frames().find(candidate =>
      candidate.url().startsWith('https://maps-api-ssl.google.com/'));
    check(label + ': map document resolves inside the live iframe', Boolean(mapFrame));
    if (mapFrame) {
      check(label + ': map stub renders', /MAP/.test(await mapFrame.evaluate(() =>
        document.body.textContent)));
    }

    check(label + ': copyright is exact and sits at the page bottom',
      state.copyright.text === data.COPYRIGHT_TEXT &&
        state.copyright.bottom === BEHANCE_HEIGHT,
      state.copyright.text + ' @ ' + state.copyright.bottom);
    check(label + ': no links, navigation, or extra embeds',
      state.links === 0 && state.navs === 0 && state.iframes === 1);
    check(label + ': exactly one page-authored inline script runs',
      state.scripts.filter(script => /rendersViewer/.test(script.text)).length === 1);
    check(label + ': only the Apps Script jsapi external script is injected',
      state.scripts.filter(script => script.src).every(script =>
        script.src === 'https://www.google.com/jsapi'),
      state.scripts.filter(script => script.src).map(script => script.src).join(', '));
    check(label + ': no cookies or storage are used',
      state.cookie === '' &&
        (state.localStorage === 0 || state.localStorage === 'blocked') &&
        (state.sessionStorage === 0 || state.sessionStorage === 'blocked'),
      JSON.stringify({ cookie: state.cookie, local: state.localStorage,
        session: state.sessionStorage }));
    check(label + ': no Google Sites or unexpected requests',
      requests.every(isAllowedRequest));
    check(label + ': no Google Sites requests',
      requests.every(request => !/sites\.google\.com/.test(request)));

    await frame.click('#renderNext');
    await frame.waitForFunction(() =>
      document.getElementById('renderCounter').textContent === '2 / 17', null,
      { timeout: 15000, polling: 100 });
    let nav = await frame.evaluate(() => ({
      counter: document.getElementById('renderCounter').textContent,
      current: Array.from(document.querySelectorAll('.render-dot'))
        .findIndex(dot => dot.getAttribute('aria-current') === 'true'),
      transform: document.getElementById('rendersTrack').style.transform
    }));
    check(label + ': next moves to render 2',
      nav.counter === '2 / 17' && nav.current === 1 &&
        Math.abs(translatePercent(nav.transform) + 100 / 17) < 0.001,
      JSON.stringify(nav));

    await frame.click('.render-dot:nth-child(5)');
    await frame.waitForFunction(() =>
      document.getElementById('renderCounter').textContent === '5 / 17', null,
      { timeout: 15000, polling: 100 });
    nav = await frame.evaluate(() => ({
      current: Array.from(document.querySelectorAll('.render-dot'))
        .findIndex(dot => dot.getAttribute('aria-current') === 'true'),
      transform: document.getElementById('rendersTrack').style.transform
    }));
    check(label + ': dot 5 jumps to render 5',
      nav.current === 4 &&
        Math.abs(translatePercent(nav.transform) + 400 / 17) < 0.001,
      JSON.stringify(nav));

    await frame.focus('#rendersViewer');
    await frame.press('#rendersViewer', 'End');
    await frame.waitForFunction(() =>
      document.getElementById('renderCounter').textContent === '17 / 17', null,
      { timeout: 15000, polling: 100 });
    await frame.press('#rendersViewer', 'Home');
    await frame.waitForFunction(() =>
      document.getElementById('renderCounter').textContent === '1 / 17', null,
      { timeout: 15000, polling: 100 });
    check(label + ': keyboard Home and End work', true);

    await frame.evaluate(() => {
      const stage = document.getElementById('rendersStage');
      const fire = (type, x) => {
        const event = new Event(type, { bubbles: true, cancelable: true });
        Object.defineProperty(event, type === 'touchstart' ? 'touches' : 'changedTouches', {
          value: [{ clientX: x, clientY: 120 }]
        });
        stage.dispatchEvent(event);
      };
      fire('touchstart', 300);
      fire('touchend', 180);
    });
    await frame.waitForFunction(() =>
      document.getElementById('renderCounter').textContent === '2 / 17', null,
      { timeout: 15000, polling: 100 });
    await frame.evaluate(() => {
      const stage = document.getElementById('rendersStage');
      const fire = (type, x) => {
        const event = new Event(type, { bubbles: true, cancelable: true });
        Object.defineProperty(event, type === 'touchstart' ? 'touches' : 'changedTouches', {
          value: [{ clientX: x, clientY: 120 }]
        });
        stage.dispatchEvent(event);
      };
      fire('touchstart', 120);
      fire('touchend', 260);
    });
    await frame.waitForFunction(() =>
      document.getElementById('renderCounter').textContent === '1 / 17', null,
      { timeout: 15000, polling: 100 });
    await frame.evaluate(() => {
      const stage = document.getElementById('rendersStage');
      const fire = (type, x) => {
        const event = new Event(type, { bubbles: true, cancelable: true });
        Object.defineProperty(event, type === 'touchstart' ? 'touches' : 'changedTouches', {
          value: [{ clientX: x, clientY: 120 }]
        });
        stage.dispatchEvent(event);
      };
      fire('touchstart', 120);
      fire('touchend', 260);
    });
    await frame.waitForFunction(() =>
      document.getElementById('renderCounter').textContent === '17 / 17', null,
      { timeout: 15000, polling: 100 });
    check(label + ': swipe left, right, and wrap work', true);

    await frame.click('#renderFullscreen');
    await wait(900);
    const fullscreen = await frame.evaluate(() => {
      const viewer = document.getElementById('rendersViewer');
      const element = document.fullscreenElement || document.webkitFullscreenElement;
      const box = viewer.getBoundingClientRect();
      return {
        native: Boolean(element),
        target: element ? element.id : null,
        theater: viewer.classList.contains('theater-mode'),
        bodyLocked: document.body.classList.contains('theater-open'),
        label: document.getElementById('renderFullscreen').getAttribute('aria-label'),
        width: box.width,
        height: box.height
      };
    });
    check(label + ': live fullscreen activates natively or with the fallback',
      (fullscreen.native && fullscreen.target === 'rendersViewer') ||
        fullscreen.theater, JSON.stringify(fullscreen));
    check(label + ': live fullscreen updates its accessible state',
      fullscreen.label === 'Exit fullscreen');
    if (fullscreen.theater) {
      check(label + ': live fallback fills the frame',
        Math.abs(fullscreen.width - width) <= 1 &&
          Math.abs(fullscreen.height - BEHANCE_HEIGHT) <= 1 &&
          fullscreen.bodyLocked);
    }
    await frame.click('#renderFullscreen');
    await wait(700);
    const exited = await frame.evaluate(() => ({
      native: Boolean(document.fullscreenElement),
      theater: document.getElementById('rendersViewer').classList.contains('theater-mode'),
      label: document.getElementById('renderFullscreen').getAttribute('aria-label')
    }));
    check(label + ': live fullscreen exits cleanly',
      !exited.native && !exited.theater && exited.label === 'Enter fullscreen',
      JSON.stringify(exited));

    check(label + ': no page errors', pageErrors.length === 0,
      pageErrors.join(' | '));
  } finally {
    await context.close();
  }
}

async function main() {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  check('deployment URL matches the shared deployment ID',
    url === data.embedUrl().replace('?page=al-rashed', ''),
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
    await runViewport(browser, 'desktop 987x2980', BEHANCE_WIDTH, {
      heroFile: 'hero-1280.jpg',
      heroWidth: 1280,
      heroHeight: 720,
      photoTracks: 2,
      photoFiles: data.REAL_PHOTOS.map(photo => photo.desktop),
      photoSizes: [[1277, 960], [1277, 960], [1280, 962]],
      mapHeight: 335.58,
      renderUrls: data.RENDERS.map(id => data.renderUrl(id)),
      renderWidth: 3840,
      renderHeight: 2160
    });
    await runViewport(browser, 'phone 390x2980', PHONE_WIDTH, {
      heroFile: 'hero-768.jpg',
      heroWidth: 768,
      heroHeight: 432,
      photoTracks: 1,
      photoFiles: data.REAL_PHOTOS.map(photo => photo.file),
      photoSizes: [[768, 577], [768, 577], [768, 577]],
      mapHeight: 260,
      renderUrls: data.RENDERS.map(id => data.renderThumbUrl(id)),
      renderWidth: 1024,
      renderHeight: 576
    });
  } finally {
    if (browser) await browser.close();
  }

  const failed = checks.filter(item => !item.passed);
  const report = {
    url,
    scope: {
      page: '?page=al-rashed',
      behanceFrames: [BEHANCE_WIDTH + 'x' + BEHANCE_HEIGHT,
        PHONE_WIDTH + 'x' + BEHANCE_HEIGHT],
      renders: data.RENDERS.length,
      tools: data.TOOLS.length,
      assets: ASSETS.length
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
