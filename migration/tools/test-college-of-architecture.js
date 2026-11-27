#!/usr/bin/env node
'use strict';

/**
 * Local College of Architecture and Arts page suite.
 *
 * Loads the page in Behance-like frames at 987x2750 and 390x2750 and exercises
 * both presentation boards and the seven-render slideshow. Imgur and the fonts
 * are stubbed.
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');
const data = require('./college-of-architecture-data');
const { createPilotServer } = require('./serve');

const ROOT = path.resolve(__dirname, '..');
const PREVIEW_FILE = path.join(ROOT, '03_REBUILT_SLIDESHOWS', 'preview',
  'college-of-architecture-and-arts.html');
const PRODUCTION_FILE = path.join(ROOT, '04_APPS_SCRIPT',
  'CollegeOfArchitectureAndArts.html');
const ASSET_DIR = path.resolve(ROOT, '..', 'assets',
  'college-of-architecture-and-arts');
const RESULTS_DIR = path.join(ROOT, '01_AUDIT', 'evidence',
  'college-of-architecture-and-arts');
const REPORT_FILE = path.join(RESULTS_DIR,
  'college-of-architecture-and-arts-test-results.json');
const BEHANCE_WIDTH = 987;
const PHONE_WIDTH = 390;
const BEHANCE_HEIGHT = data.EMBED_HEIGHT;

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

const SLIDE_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="788"><rect width="1400" height="788" fill="#17324d"/><circle cx="700" cy="394" r="200" fill="#e2a24a"/></svg>';
const LOGO_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="220" height="140"><rect width="220" height="140" fill="#1d4ed8"/><text x="110" y="80" font-size="42" fill="#fff" text-anchor="middle">T</text></svg>';

function staticChecks() {
  const production = fs.readFileSync(PRODUCTION_FILE, 'utf8');
  const preview = fs.readFileSync(PREVIEW_FILE, 'utf8');
  const images = imageTags(production);
  const hero = images.filter(tag => attr(tag, 'alt') === data.HERO.alt);
  const boards = images.filter(tag => /^Presentation board/.test(attr(tag, 'alt')));
  const slides = images.filter(tag => data.RENDERS.some(render => attr(tag, 'alt') === render.alt));
  const film = images.filter(tag => attr(tag, 'alt') === '' &&
    attr(tag, 'loading') === 'lazy');
  const tools = images.filter(tag => / Logo$/.test(attr(tag, 'alt')));

  check('page title is exact',
    production.includes('<title>' + data.PAGE_TITLE + '</title>'));
  check('page has no Google Sites chrome',
    !/sites\.google\.com|sitesv-images|googleusercontent|view\/hossam-alafandi|Report abuse/i
      .test(production));
  check('page has no Vimeo, Drive or YouTube embeds',
    !/player\.vimeo\.com|drive\.google\.com|youtube\.com/i.test(production));
  check('original overview text is exact', production.includes(data.OVERVIEW_TEXT));
  check('original semester and year are exact',
    production.includes(data.HERO.semester) && production.includes(data.HERO.year));
  check('page has 1 hero, 2 boards, 7 slides, 7 film thumbs and 5 tools',
    hero.length === 1 && boards.length === 2 && slides.length === 7 &&
      film.length === 7 && tools.length === 5,
    [hero.length, boards.length, slides.length, film.length, tools.length].join('/'));
  check('page has 24 images', images.length === 24, images.length);
  check('hero uses the 1920 desktop file and 768 phone source',
    attr(hero[0] || '', 'src') ===
      data.assetUrl(data.PRODUCTION_ASSET_BASE, 'hero', 1920) &&
      production.includes('<source media="(max-width: 700px)" srcset="' +
        data.assetUrl(data.PRODUCTION_ASSET_BASE, 'hero', 768) + '">'));
  check('both boards use 1280 desktop files and 768 phone sources',
    boards.every((tag, index) =>
      attr(tag, 'src') ===
        data.assetUrl(data.PRODUCTION_ASSET_BASE, data.BOARDS[index].file, 1280)) &&
      data.BOARDS.every(board => production.includes(
        '<source media="(max-width: 700px)" srcset="' +
        data.assetUrl(data.PRODUCTION_ASSET_BASE, board.file, 768) + '">')));
  check('board viewer keeps 2048 files for inspection',
    data.BOARDS.every(board => production.includes(
      'data-src-2048="' +
      data.assetUrl(data.PRODUCTION_ASSET_BASE, board.file, 2048) + '"')));
  check('all 7 slides use the exact Imgur originals',
    slides.every((tag, index) => attr(tag, 'src') === data.renderUrl(data.RENDERS[index].id)));
  check('all 7 slides provide exact phone h JPG sources',
    data.RENDERS.every(render => production.includes(
      '<source media="(max-width: 700px)" srcset="' +
      data.renderThumbUrl(render.id) + '">')));
  check('film thumbs use the exact phone h JPG sources',
    data.RENDERS.every(render => production.includes(
      '<img src="' + data.renderThumbUrl(render.id) + '" alt="" loading="lazy"')));
  check('only the hero and the first slide are eager',
    (production.match(/loading="eager"/g) || []).length === 2 &&
      (production.match(/loading="lazy"/g) || []).length === 20);
  check('all 5 tool logos use the exact Imgur PNGs',
    tools.length === 5 &&
      tools.every((tag, index) => attr(tag, 'src') === data.toolUrl(data.TOOLS[index].id)));
  check('page has no anchors or popup navigation',
    !/<a\b|window\.open|target="_blank"/i.test(production));
  check('page uses no storage, cookies, or messaging',
    !/localStorage|sessionStorage|indexedDB|document\.cookie|postMessage|BroadcastChannel/i
      .test(production));
  check('page has no external scripts', !/<script\b[^>]*\bsrc=/i.test(production));
  check('page keeps the fixed 2800 px embed height',
    data.EMBED_HEIGHT === 2800 && data.EMBED_WIDTH === '100%');
  check('page has the phone breakpoint', /@media \(max-width: 700px\)/.test(production));
  check('page has one render viewer and one board viewer',
    production.includes('id="caRenderFs"') && production.includes('id="boardViewer"'));
  check('page has seven board and render controls',
    (production.match(/class="film-thumb"/g) || []).length === 7 &&
      production.includes('id="renderFsButton"') &&
      production.includes('id="bvZoomIn"'));
  check('page keeps the exact copyright',
    production.includes(data.COPYRIGHT_TEXT));
  check('all 8 page assets exist on disk',
    ['hero-1920.jpg', 'hero-768.jpg',
      'board-1-2048.jpg', 'board-1-1280.jpg', 'board-1-768.jpg',
      'board-2-2048.jpg', 'board-2-1280.jpg', 'board-2-768.jpg']
      .every(name => fs.existsSync(path.join(ASSET_DIR, name))));
  check('preview uses local page assets',
    preview.includes(data.PREVIEW_ASSET_BASE + 'hero-1920.jpg') &&
      preview.includes(data.PREVIEW_ASSET_BASE + 'board-1-1280.jpg') &&
      preview.includes(data.PREVIEW_ASSET_BASE + 'board-2-1280.jpg'));
}

async function blockThirdParty(context) {
  await context.route('https://i.imgur.com/**', route => {
    blockedImgurRequests += 1;
    const url = route.request().url();
    const isTool = data.TOOLS.some(tool => url === data.toolUrl(tool.id));
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

function wrapperHtml(base, width) {
  return [
    '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>',
    'html,body{margin:0;padding:0;background:#fff}',
    'iframe{display:block;border:0}',
    '</style></head><body>',
    '<iframe id="embed" src="' + base + '/exec?page=' + data.PAGE_CODE + '" width="' + width +
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
          document.querySelectorAll('.plate').length === 2 &&
          document.querySelectorAll('.slide').length === 7);
        if (ready) return frame;
      } catch (error) {
        // Frame is still navigating.
      }
    }
    await wait(250);
  }
  return null;
}

async function runViewport(browser, base, label, width, panelHeight) {
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
      document.querySelectorAll('.plate').length === 2 &&
      document.querySelectorAll('.slide').length === 7 &&
      document.querySelectorAll('.film-thumb').length === 7, null,
      { timeout: 30000, polling: 100 });
    await frame.waitForFunction(() => {
      const selected = Array.from(document.querySelectorAll(
        '.hero img, .plate img, .slide:first-child img, .film-thumb img, .tools-row img'));
      return selected.length === 16 &&
        selected.every(image => image.complete && image.naturalWidth > 0);
    }, null, { timeout: 30000, polling: 100 });
    await wait(300);

    await frame.evaluate(() => {
      Object.defineProperty(screen, 'width', { configurable: true, get: () => window.innerWidth });
      Object.defineProperty(screen, 'height', { configurable: true, get: () => 900 });
      Object.defineProperty(screen, 'availWidth', { configurable: true, get: () => window.innerWidth });
      Object.defineProperty(screen, 'availHeight', { configurable: true, get: () => 900 });
    });

    await wait(1600);
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
        hero: sourceOf(document.querySelector('.hero img')),
        boards: Array.from(document.querySelectorAll('.plate img')).map(sourceOf),
        boardGridDisplay: getComputedStyle(document.querySelector('.boards-grid')).display,
        plateRects: Array.from(document.querySelectorAll('.plate')).map(rect),
        slides: Array.from(document.querySelectorAll('.slide img')).map(sourceOf),
        filmThumbs: document.querySelectorAll('.film-thumb').length,
        counter: document.getElementById('renderCounter').textContent,
        code: document.getElementById('renderCode').textContent,
        tools: Array.from(document.querySelectorAll('.tools-row img')).map(image => image.src),
        toolsVisible: getComputedStyle(document.querySelector('.tools-row')).opacity,
        reveals: Array.from(document.querySelectorAll('.reveal'))
          .filter(node => node.classList.contains('is-visible')).length,
        revealTotal: document.querySelectorAll('.reveal').length
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
    check(label + ': hero uses the right source',
      state.hero.includes(width <= 700 ? 'hero-768.jpg' : 'hero-1920.jpg'));
    check(label + ': both boards use the right source',
      state.boards.length === 2 &&
        state.boards.every(src => src.includes(width <= 700 ? '-768.jpg' : '-1280.jpg')));
    check(label + ': desktop shows two board columns and phone stacks them',
      width <= 700
        ? state.boardGridDisplay === 'block' &&
          Math.abs(state.plateRects[0].width - state.plateRects[1].width) <= 1
        : state.boardGridDisplay === 'grid' &&
          state.plateRects[0].y === state.plateRects[1].y &&
          state.plateRects[0].width < state.main.width / 2 + 1,
      state.boardGridDisplay + ' / ' + JSON.stringify(state.plateRects));
    check(label + ': all seven slides use the right Imgur source',
      state.slides.length === 7 &&
        state.slides.every(src => width <= 700
          ? /https:\/\/i\.imgur\.com\/[A-Za-z0-9]+h\.jpg$/.test(src)
          : /https:\/\/i\.imgur\.com\/[A-Za-z0-9]+\.jpeg$/.test(src)));
    check(label + ': film has seven thumbs and starts at 01 / 07',
      state.filmThumbs === 7 && state.counter === '01 / 07' &&
        state.code === 'CA / ' + data.RENDERS[0].code,
      state.counter + ' / ' + state.code);
    check(label + ': five tools use the exact Imgur logos',
      state.tools.length === 5 &&
        state.tools.every((src, index) => src === data.toolUrl(data.TOOLS[index].id)));
    check(label + ': all reveals are visible without an inner scroll',
      state.reveals === state.revealTotal &&
        state.toolsVisible === '1', state.reveals + '/' + state.revealTotal);

    await frame.click('#renderSlideshow .render-arrow.next');
    await frame.waitForFunction(() =>
      document.getElementById('renderCounter').textContent === '02 / 07',
      null, { timeout: 10000, polling: 100 });
    await frame.click('.film-thumb[data-index="3"]');
    await frame.waitForFunction(() =>
      document.getElementById('renderCounter').textContent === '04 / 07',
      null, { timeout: 10000, polling: 100 });
    await frame.focus('#renderSlideshow');
    await frame.press('#renderSlideshow', 'End');
    await frame.waitForFunction(() =>
      document.getElementById('renderCounter').textContent === '07 / 07',
      null, { timeout: 10000, polling: 100 });
    await frame.press('#renderSlideshow', 'Home');
    await frame.waitForFunction(() =>
      document.getElementById('renderCounter').textContent === '01 / 07',
      null, { timeout: 10000, polling: 100 });
    check(label + ': render arrows, film and keyboard work', true);

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
        natural: [image.naturalWidth, image.naturalHeight],
        counter: document.getElementById('caRenderFsCounter').textContent,
        backdrop: getComputedStyle(document.getElementById('caRenderFsBackdrop')).backgroundImage,
        body: document.body.classList.contains('render-fs-open')
      };
    });
    check(label + ': render fullscreen uses a 900 px panel',
      fs.open && fs.height === 900 && fs.top >= 0 && fs.body &&
        fs.counter === '1 / 7' && fs.backdrop.includes('imgur'),
      JSON.stringify(fs));
    check(label + ': render fullscreen uses the current rendered source',
      width <= 700
        ? /https:\/\/i\.imgur\.com\/[A-Za-z0-9]+h\.jpg$/.test(fs.src)
        : /https:\/\/i\.imgur\.com\/[A-Za-z0-9]+\.jpeg$/.test(fs.src),
      fs.src);
    await frame.click('#caRenderFsNext');
    await frame.waitForFunction(() =>
      document.getElementById('caRenderFsCounter').textContent === '2 / 7' &&
      document.getElementById('renderCounter').textContent === '02 / 07',
      null, { timeout: 10000, polling: 100 });
    check(label + ': render fullscreen navigation stays in sync', true);
    await frame.click('#caRenderFsClose');
    await wait(300);
    check(label + ': render fullscreen closes cleanly',
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
        natural: [image.naturalWidth, image.naturalHeight],
        plate: document.getElementById('bvPlate').textContent,
        title: document.getElementById('bvTitle').textContent,
        count: document.getElementById('bvCount').textContent,
        zoom: document.getElementById('bvZoomReset').textContent,
        body: document.body.classList.contains('board-open')
      };
    });
    check(label + ': board viewer opens as a 900 px panel',
      board.open && board.height === 900 && board.top >= 0 && board.body &&
        board.plate === 'PLATE 01' && board.title === 'SITE & PROGRAM' &&
        board.count === '01 / 02' && board.zoom === '100%',
      JSON.stringify(board));
    check(label + ': board viewer uses the right inspection file',
      board.src.includes(width <= 700 ? 'board-1-1280.jpg' : 'board-1-2048.jpg'),
      board.src);

    await frame.click('#bvZoomIn');
    await wait(250);
    const zoomed = await frame.evaluate(() => ({
      label: document.getElementById('bvZoomReset').textContent,
      transform: document.getElementById('bvImage').style.transform
    }));
    check(label + ': board zoom works', zoomed.label === '135%' &&
      zoomed.transform.includes('scale(1.35)'), JSON.stringify(zoomed));

    await frame.click('#bvNext');
    await wait(500);
    const nextBoard = await frame.evaluate(() => ({
      plate: document.getElementById('bvPlate').textContent,
      title: document.getElementById('bvTitle').textContent,
      count: document.getElementById('bvCount').textContent,
      zoom: document.getElementById('bvZoomReset').textContent,
      src: document.getElementById('bvImage').getAttribute('src')
    }));
    check(label + ': board viewer steps to plate two and resets zoom',
      nextBoard.plate === 'PLATE 02' &&
        nextBoard.title === 'SHOTS & CONCEPT' &&
        nextBoard.count === '02 / 02' &&
        nextBoard.zoom === '100%' &&
        nextBoard.src.includes(width <= 700 ? 'board-2-1280.jpg' : 'board-2-2048.jpg'),
      JSON.stringify(nextBoard));

    await frame.press('#boardViewer', 'Escape');
    await wait(300);
    check(label + ': Escape closes the board viewer',
      await frame.evaluate(() =>
        document.getElementById('boardViewer').hidden &&
        !document.body.classList.contains('board-open')));

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
    await runViewport(browser, base, 'desktop 987x' + BEHANCE_HEIGHT, BEHANCE_WIDTH, 900);
    await runViewport(browser, base, 'phone 390x' + BEHANCE_HEIGHT, PHONE_WIDTH, 844);
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }

  const failed = checks.filter(item => !item.passed);
  const report = {
    scope: {
      page: '?page=' + data.PAGE_CODE,
      behanceFrames: [BEHANCE_WIDTH + 'x' + BEHANCE_HEIGHT,
        PHONE_WIDTH + 'x' + BEHANCE_HEIGHT],
      boards: data.BOARDS.length,
      renders: data.RENDERS.length,
      tools: data.TOOLS.length,
      assets: 8
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
