#!/usr/bin/env node
'use strict';

/**
 * Live African Cafeteria page suite.
 *
 * Runs against the deployed Apps Script URL:
 *  - the new page route and the existing page/slide/tools routes;
 *  - the 8 copied page files on jsDelivr;
 *  - both Behance-like frames, 2 boards, 8 renders, 5 materials, 4 tools.
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');
const data = require('./african-cafeteria-data');

const ROOT = path.resolve(__dirname, '..');
const RESULTS_DIR = path.join(ROOT, '01_AUDIT', 'evidence', 'african-cafeteria');
const REPORT_FILE = path.join(RESULTS_DIR, 'african-cafeteria-live-test-results.json');
const BEHANCE_WIDTH = 987;
const PHONE_WIDTH = 390;
const BEHANCE_HEIGHT = data.EMBED_HEIGHT;
const ASSET_NAMES = [
  'hero-1920.jpg', 'hero-768.jpg',
  'board-1-2048.jpg', 'board-1-1280.jpg', 'board-1-768.jpg',
  'board-2-2048.jpg', 'board-2-1280.jpg', 'board-2-768.jpg',
  'material-clay.jpg', 'material-wood.jpg', 'material-brick.jpg',
  'material-straw.jpg', 'material-plants.jpg'
];

const url = process.argv[2];
if (!url || !/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url)) {
  console.error('Usage: node test-live-african-cafeteria.js <https://script.google.com/macros/s/.../exec>');
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

const SLIDE_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="1250" height="1200"><rect width="1250" height="1200" fill="#2a1b12"/><circle cx="625" cy="600" r="260" fill="#d8a345"/></svg>';
const LOGO_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="220" height="140"><rect width="220" height="140" fill="#b85a32"/><text x="110" y="80" font-size="42" fill="#fff" text-anchor="middle">T</text></svg>';

async function assetChecks() {
  for (const name of ASSET_NAMES) {
    const assetUrl = data.PRODUCTION_ASSET_BASE + name;
    let last = { name, error: 'not attempted' };
    for (let attempt = 1; attempt <= 4; attempt++) {
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
      await wait(700 * attempt);
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
              document.querySelector('.plate') ||
              document.querySelector('.slideshow') ||
              document.getElementById('rendersViewer') ||
              document.getElementById('renderSlideshow'));
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
              boards: document.querySelectorAll('.plate').length,
              materials: document.querySelectorAll('.material').length,
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
  const page = await loadRoute(context, '?page=' + data.PAGE_CODE);
  check('route: ?page=' + data.PAGE_CODE + ' returns the standalone page',
    Boolean(page) && page.kind === 'page' && page.boards === 2, page && page.kind);
  check('route: page title is exact',
    Boolean(page) && page.title === data.PAGE_TITLE, page && page.title);
  check('route: page has 2 boards, 5 materials and 8 renders',
    Boolean(page) && page.boards === 2 && page.materials === 5 &&
      (page.html.match(/class="slide"/g) || []).length === 8,
    page ? page.boards + ' / ' + page.materials + ' / ' +
      (page.html.match(/class="slide"/g) || []).length : null);
  check('route: page has both viewers and eight film thumbs',
    Boolean(page) && page.html.includes('id="boardViewer"') &&
      page.html.includes('id="caRenderFs"') &&
      (page.html.match(/class="film-thumb"/g) || []).length === 8);
  check('route: page has the 8 copied page files',
    Boolean(page) && ASSET_NAMES.every(name =>
      page.html.includes(data.PRODUCTION_ASSET_BASE + name)));
  check('route: page has no Drive, Google Sites, or video chrome',
    Boolean(page) &&
      !/drive\.google\.com|sites\.google\.com|sitesv-images|googleusercontent|player\.vimeo\.com/i
        .test(page.html));
  check('route: page has no anchors or top navigation',
    Boolean(page) && !/<a\b|target="_blank"/i.test(page.html));

  for (const key of ['al-rashed', 'cellphone-store', 'dk-apartment', 'ab-apartment',
    'college-of-architecture-and-arts']) {
    const result = await loadRoute(context, '?page=' + key);
    check('route: ?page=' + key + ' still returns its page',
      Boolean(result) && result.kind === 'page');
  }

  const slide = await loadRoute(context, '?slide=P004-S01');
  check('route: ?slide=P004-S01 still returns its 7-slide page',
    Boolean(slide) && slide.kind === 'slides' && slide.slides === 7,
    slide ? slide.kind + ' / ' + slide.slides : null);
  const tools = await loadRoute(context, '?tools=P004');
  check('route: ?tools=P004 still returns a logo strip',
    Boolean(tools) && tools.kind === 'tools' && tools.logos === 1);

  const rejected = ['', '?page=', '?page=nope', '?page=' + data.PAGE_CODE + '/',
    '?page=' + data.PAGE_CODE + '&page=' + data.PAGE_CODE,
    '?page=' + data.PAGE_CODE + '&slide=P004-S01',
    '?slide=P004-S01&page=' + data.PAGE_CODE,
    '?page=' + data.PAGE_CODE + '&tools=P004'];
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
    return route.fulfill({
      status: 200,
      contentType: 'image/svg+xml',
      body: isTool ? LOGO_SVG : SLIDE_SVG
    });
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
    '<iframe id="embed" src="' + url + '?page=' + data.PAGE_CODE + '" width="' + width +
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
          document.querySelectorAll('.plate').length === 2);
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
      document.querySelectorAll('.plate').length === 2 &&
      document.querySelectorAll('.slide').length === 8 &&
      document.querySelectorAll('.film-thumb').length === 8 &&
      document.querySelectorAll('.material').length === 5, null,
      { timeout: 60000, polling: 100 });
    await frame.waitForFunction(() => {
      const selected = Array.from(document.querySelectorAll(
        '.hero img, .plate img, .slide:first-child img, .film-thumb img, .tools-row img, .swatch img'));
      return selected.length === 21 &&
        selected.every(image => image.complete && image.naturalWidth > 0);
    }, null, { timeout: 60000, polling: 100 });
    await wait(1800);

    await frame.evaluate(() => {
      Object.defineProperty(screen, 'width', { configurable: true, get: () => window.innerWidth });
      Object.defineProperty(screen, 'height', { configurable: true, get: () => 900 });
      Object.defineProperty(screen, 'availWidth', { configurable: true, get: () => window.innerWidth });
      Object.defineProperty(screen, 'availHeight', { configurable: true, get: () => 900 });
    });

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
        hero: sourceOf(document.querySelector('.hero img')),
        boards: Array.from(document.querySelectorAll('.plate img')).map(sourceOf),
        boardGridDisplay: getComputedStyle(document.querySelector('.boards-grid')).display,
        materialsDisplay: getComputedStyle(document.querySelector('.materials-grid')).display,
        materials: document.querySelectorAll('.material').length,
        materialImgs: Array.from(document.querySelectorAll('.swatch img')).map(image => image.src),
        slides: Array.from(document.querySelectorAll('.slide img')).map(sourceOf),
        filmThumbs: document.querySelectorAll('.film-thumb').length,
        counter: document.getElementById('renderCounter').textContent,
        code: document.getElementById('renderCode').textContent,
        tools: Array.from(document.querySelectorAll('.tool img')).map(image => image.src),
        reveals: Array.from(document.querySelectorAll('.reveal'))
          .filter(node => node.classList.contains('is-visible')).length,
        revealTotal: document.querySelectorAll('.reveal').length
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
    check(label + ': hero uses the right source',
      state.hero.includes(width <= 700 ? 'hero-768.jpg' : 'hero-1920.jpg'));
    check(label + ': both boards use the right source',
      state.boards.length === 2 &&
        state.boards.every(src => src.includes(width <= 700 ? '-768.jpg' : '-1280.jpg')));
    check(label + ': desktop shows two board columns and phone stacks them',
      width <= 700
        ? state.boardGridDisplay === 'block'
        : state.boardGridDisplay === 'grid');
    check(label + ': five materials and the correct material layout',
      state.materials === 5 &&
        (width <= 700 ? state.materialsDisplay === 'flex' : state.materialsDisplay === 'grid'),
      state.materialsDisplay);
    check(label + ': five material crops use the production project images',
      state.materialImgs.length === 5 &&
        state.materialImgs.every((src, index) =>
          src === data.PRODUCTION_ASSET_BASE + data.MATERIALS[index].file + '.jpg'),
      state.materialImgs.join(', '));
    check(label + ': all eight renders use the right Imgur source',
      state.slides.length === 8 &&
        state.slides.every(src => width <= 700
          ? /https:\/\/i\.imgur\.com\/[A-Za-z0-9]+h\.jpg$/.test(src)
          : /https:\/\/i\.imgur\.com\/[A-Za-z0-9]+\.jpeg$/.test(src)));
    check(label + ': film has eight thumbs and starts at 01 / 08',
      state.filmThumbs === 8 && state.counter === '01 / 08' &&
        state.code === 'INT / ' + data.RENDERS[0].code);
    check(label + ': four tools use the exact Imgur logos',
      state.tools.length === 4 &&
        state.tools.every((src, index) => src === data.toolUrl(data.TOOLS[index].id)));
    check(label + ': all reveals are visible without an inner scroll',
      state.reveals === state.revealTotal, state.reveals + '/' + state.revealTotal);

    await frame.click('#renderSlideshow .render-arrow.next');
    await frame.waitForFunction(() =>
      document.getElementById('renderCounter').textContent === '02 / 08',
      null, { timeout: 15000, polling: 100 });
    await frame.click('.film-thumb[data-index="5"]');
    await frame.waitForFunction(() =>
      document.getElementById('renderCounter').textContent === '06 / 08',
      null, { timeout: 15000, polling: 100 });
    check(label + ': live render navigation works', true);

    await frame.click('#renderFsButton');
    await wait(500);
    const fs = await frame.evaluate(() => {
      const viewer = document.getElementById('caRenderFs');
      const image = document.getElementById('caRenderFsImage');
      const box = viewer.getBoundingClientRect();
      return {
        open: viewer.classList.contains('is-open') && !viewer.hidden,
        height: Math.round(box.height),
        top: Math.round(box.top),
        src: image.getAttribute('src'),
        counter: document.getElementById('caRenderFsCounter').textContent,
        backdrop: getComputedStyle(document.getElementById('caRenderFsBackdrop'))
          .backgroundImage,
        body: document.body.classList.contains('render-fs-open')
      };
    });
    check(label + ': live render fullscreen uses a 900 px panel',
      fs.open && fs.height === 900 && fs.top >= 0 && fs.body &&
        fs.counter === '6 / 8' && fs.backdrop.includes('imgur'),
      JSON.stringify(fs));
    check(label + ': live render fullscreen uses the right source',
      width <= 700
        ? /https:\/\/i\.imgur\.com\/[A-Za-z0-9]+h\.jpg$/.test(fs.src)
        : /https:\/\/i\.imgur\.com\/[A-Za-z0-9]+\.jpeg$/.test(fs.src));
    await frame.click('#caRenderFsNext');
    await frame.waitForFunction(() =>
      document.getElementById('caRenderFsCounter').textContent === '7 / 8' &&
      document.getElementById('renderCounter').textContent === '07 / 08',
      null, { timeout: 15000, polling: 100 });
    check(label + ': live render fullscreen navigation stays in sync', true);
    await frame.click('#caRenderFsClose');
    await wait(300);
    check(label + ': live render fullscreen closes cleanly',
      await frame.evaluate(() =>
        document.getElementById('caRenderFs').hidden &&
        !document.body.classList.contains('render-fs-open')));

    await frame.click('.plate[data-index="0"]');
    await wait(600);
    const board = await frame.evaluate(() => {
      const viewer = document.getElementById('boardViewer');
      const image = document.getElementById('bvImage');
      const box = viewer.getBoundingClientRect();
      return {
        open: viewer.classList.contains('is-open') && !viewer.hidden,
        height: Math.round(box.height),
        top: Math.round(box.top),
        src: image.getAttribute('src'),
        plate: document.getElementById('bvPlate').textContent,
        title: document.getElementById('bvTitle').textContent,
        count: document.getElementById('bvCount').textContent,
        zoom: document.getElementById('bvZoomReset').textContent,
        body: document.body.classList.contains('board-open')
      };
    });
    check(label + ': live board viewer opens as a 900 px panel',
      board.open && board.height === 900 && board.top >= 0 && board.body &&
        board.plate === 'PLATE 01' && board.title === 'PLANS & SECTIONS' &&
        board.count === '01 / 02' && board.zoom === '100%',
      JSON.stringify(board));
    check(label + ': live board viewer uses the right inspection file',
      board.src.includes(width <= 700 ? 'board-1-1280.jpg' : 'board-1-2048.jpg'));

    await frame.click('#bvZoomIn');
    await wait(250);
    check(label + ': live board zoom works',
      await frame.evaluate(() => document.getElementById('bvZoomReset').textContent === '135%'));
    await frame.click('#bvNext');
    await wait(500);
    const nextBoard = await frame.evaluate(() => ({
      plate: document.getElementById('bvPlate').textContent,
      title: document.getElementById('bvTitle').textContent,
      count: document.getElementById('bvCount').textContent,
      zoom: document.getElementById('bvZoomReset').textContent
    }));
    check(label + ': live board viewer steps to plate two and resets zoom',
      nextBoard.plate === 'PLATE 02' &&
        nextBoard.title === 'MATERIALS & DETAILS' &&
        nextBoard.count === '02 / 02' &&
        nextBoard.zoom === '100%', JSON.stringify(nextBoard));
    await frame.press('#boardViewer', 'Escape');
    await wait(300);
    check(label + ': live Escape closes the board viewer',
      await frame.evaluate(() =>
        document.getElementById('boardViewer').hidden &&
        !document.body.classList.contains('board-open')));

    check(label + ': no page errors', pageErrors.length === 0,
      pageErrors.join(' | '));
  } finally {
    await context.close();
  }
}

async function main() {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  check('deployment URL matches the shared deployment ID',
    url === data.embedUrl().replace('?page=' + data.PAGE_CODE, ''), url);

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
      page: '?page=' + data.PAGE_CODE,
      behanceFrames: [BEHANCE_WIDTH + 'x' + BEHANCE_HEIGHT,
        PHONE_WIDTH + 'x' + BEHANCE_HEIGHT],
      boards: data.BOARDS.length,
      renders: data.RENDERS.length,
      materials: data.MATERIALS.length,
      tools: data.TOOLS.length,
      assets: ASSET_NAMES.length
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
