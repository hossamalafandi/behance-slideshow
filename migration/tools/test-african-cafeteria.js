#!/usr/bin/env node
'use strict';

/**
 * Local African Cafeteria page suite.
 *
 * Loads the page in Behance-like frames at 987x3980 and 390x3980 and exercises
 * the two presentation boards and the eight-render slideshow. Imgur and the
 * fonts are stubbed.
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');
const data = require('./african-cafeteria-data');
const { createPilotServer } = require('./serve');

const ROOT = path.resolve(__dirname, '..');
const PREVIEW_FILE = path.join(ROOT, '03_REBUILT_SLIDESHOWS', 'preview',
  'african-cafeteria.html');
const PRODUCTION_FILE = path.join(ROOT, '04_APPS_SCRIPT', 'AfricanCafeteria.html');
const ASSET_DIR = path.resolve(ROOT, '..', 'assets', 'african-cafeteria');
const RESULTS_DIR = path.join(ROOT, '01_AUDIT', 'evidence', 'african-cafeteria');
const REPORT_FILE = path.join(RESULTS_DIR, 'african-cafeteria-test-results.json');
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

const SLIDE_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="1250" height="1200"><rect width="1250" height="1200" fill="#2a1b12"/><circle cx="625" cy="600" r="260" fill="#d8a345"/></svg>';
const LOGO_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="220" height="140"><rect width="220" height="140" fill="#b85a32"/><text x="110" y="80" font-size="42" fill="#fff" text-anchor="middle">T</text></svg>';

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
  const materialImages = data.MATERIALS.map(material =>
    data.PRODUCTION_ASSET_BASE + material.file + '.jpg');

  check('page title is exact',
    production.includes('<title>' + data.PAGE_TITLE + '</title>'));
  check('page has no Google Sites chrome',
    !/sites\.google\.com|sitesv-images|googleusercontent|view\/hossam-alafandi|Report abuse/i
      .test(production));
  check('page has no Vimeo, Drive or YouTube embeds',
    !/player\.vimeo\.com|drive\.google\.com|youtube\.com/i.test(production));
  check('all three original overview paragraphs are exact',
    data.OVERVIEW.paragraphs.every(paragraph => production.includes(paragraph.text)));
  check('original semester and year are exact',
    production.includes(data.HERO.semester) && production.includes(data.HERO.year));
  check('page has 1 hero, 2 boards, 8 slides, 8 film thumbs and 4 tools',
    hero.length === 1 && boards.length === 2 && slides.length === 8 &&
      film.length === 8 && tools.length === 4,
    [hero.length, boards.length, slides.length, film.length, tools.length].join('/'));
  check('page has 30 images', images.length === 30, images.length);
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
  check('all 8 slides use the exact Imgur originals',
    slides.every((tag, index) => attr(tag, 'src') === data.renderUrl(data.RENDERS[index].id)));
  check('all 8 slides provide exact phone h JPG sources',
    data.RENDERS.every(render => production.includes(
      '<source media="(max-width: 700px)" srcset="' +
      data.renderThumbUrl(render.id) + '">')));
  check('film thumbs use the exact phone h JPG sources',
    data.RENDERS.every(render => production.includes(
      '<img src="' + data.renderThumbUrl(render.id) + '" alt="" loading="lazy"')));
  check('only the hero, first slide and material crops are eager',
    (production.match(/loading="eager"/g) || []).length === 7 &&
      (production.match(/loading="lazy"/g) || []).length === 21);
  check('all 4 tool logos use the exact Imgur PNGs',
    tools.length === 4 &&
      tools.every((tag, index) => attr(tag, 'src') === data.toolUrl(data.TOOLS[index].id)));
  check('page has 5 material cards',
    (production.match(/class="material material--/g) || []).length === 5);
  check('all 5 material cards use project-render crops',
    materialImages.every(src => production.includes('src="' + src + '"')));
  check('page has no anchors or popup navigation',
    !/<a\b|window\.open|target="_blank"/i.test(production));
  check('page uses no storage, cookies, or messaging',
    !/localStorage|sessionStorage|indexedDB|document\.cookie|postMessage|BroadcastChannel/i
      .test(production));
  check('page has no external scripts', !/<script\b[^>]*\bsrc=/i.test(production));
  check('page keeps the fixed 3980 px embed height',
    data.EMBED_HEIGHT === 3980 && data.EMBED_WIDTH === '100%');
  check('page has the phone breakpoint', /@media \(max-width: 700px\)/.test(production));
  check('page has one render viewer and one board viewer',
    production.includes('id="caRenderFs"') && production.includes('id="boardViewer"'));
  check('page has eight film buttons and eight slides',
    (production.match(/class="film-thumb"/g) || []).length === 8 &&
      (production.match(/class="slide"/g) || []).length === 8);
  check('page keeps the exact copyright',
    production.includes(data.COPYRIGHT_TEXT));
  check('all 13 page assets exist on disk',
    ['hero-1920.jpg', 'hero-768.jpg',
      'board-1-2048.jpg', 'board-1-1280.jpg', 'board-1-768.jpg',
      'board-2-2048.jpg', 'board-2-1280.jpg', 'board-2-768.jpg',
      'material-clay.jpg', 'material-wood.jpg', 'material-brick.jpg',
      'material-straw.jpg', 'material-plants.jpg']
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
          document.querySelectorAll('.slide').length === 8);
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
      document.querySelectorAll('.plate').length === 2 &&
      document.querySelectorAll('.slide').length === 8 &&
      document.querySelectorAll('.film-thumb').length === 8 &&
      document.querySelectorAll('.material').length === 5, null,
      { timeout: 30000, polling: 100 });
    await frame.waitForFunction(() => {
      const selected = Array.from(document.querySelectorAll(
        '.hero img, .plate img, .slide:first-child img, .film-thumb img, .tools-row img, .swatch img'));
      return selected.length === 21 &&
        selected.every(image => image.complete && image.naturalWidth > 0);
    }, null, { timeout: 30000, polling: 100 });
    await wait(1600);

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
        inner: [innerWidth, innerHeight],
        scroll: [document.documentElement.scrollWidth, document.documentElement.scrollHeight],
        body: [document.body.scrollWidth, document.body.scrollHeight],
        main: rect(document.getElementById('page')),
        hero: sourceOf(document.querySelector('.hero img')),
        boards: Array.from(document.querySelectorAll('.plate img')).map(sourceOf),
        boardGridDisplay: getComputedStyle(document.querySelector('.boards-grid')).display,
        materials: Array.from(document.querySelectorAll('.material')).map(rect),
        materialsDisplay: getComputedStyle(document.querySelector('.materials-grid')).display,
        materialImgs: Array.from(document.querySelectorAll('.swatch img')).map(image => image.src),
        slides: Array.from(document.querySelectorAll('.slide img')).map(sourceOf),
        filmThumbs: document.querySelectorAll('.film-thumb').length,
        counter: document.getElementById('renderCounter').textContent,
        code: document.getElementById('renderCode').textContent,
        tools: Array.from(document.querySelectorAll('.tool img')).map(image => image.src),
        toolLabels: Array.from(document.querySelectorAll('.tool span')).map(span => span.textContent),
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
        ? state.boardGridDisplay === 'block'
        : state.boardGridDisplay === 'grid');
    check(label + ': five material cards are present and the phone rail is horizontal',
      state.materials.length === 5 &&
        (width <= 700 ? state.materialsDisplay === 'flex' : state.materialsDisplay === 'grid'),
      state.materialsDisplay);
    check(label + ': five material crops use the local project images',
      state.materialImgs.length === 5 &&
        state.materialImgs.every((src, index) =>
          src.includes(data.PREVIEW_ASSET_BASE + data.MATERIALS[index].file + '.jpg')),
      state.materialImgs.join(', '));
    check(label + ': all eight renders use the right Imgur source',
      state.slides.length === 8 &&
        state.slides.every(src => width <= 700
          ? /https:\/\/i\.imgur\.com\/[A-Za-z0-9]+h\.jpg$/.test(src)
          : /https:\/\/i\.imgur\.com\/[A-Za-z0-9]+\.jpeg$/.test(src)));
    check(label + ': film has eight thumbs and starts at 01 / 08',
      state.filmThumbs === 8 && state.counter === '01 / 08' &&
        state.code === INT_CODE(),
      state.counter + ' / ' + state.code);
    check(label + ': four tools use the exact Imgur logos and labels',
      state.tools.length === 4 &&
        state.tools.every((src, index) => src === data.toolUrl(data.TOOLS[index].id)) &&
        JSON.stringify(state.toolLabels) ===
          JSON.stringify(data.TOOLS.map(tool => tool.name)));
    check(label + ': all reveals are visible without an inner scroll',
      state.reveals === state.revealTotal, state.reveals + '/' + state.revealTotal);

    await frame.click('#renderSlideshow .render-arrow.next');
    await frame.waitForFunction(() =>
      document.getElementById('renderCounter').textContent === '02 / 08',
      null, { timeout: 10000, polling: 100 });
    await frame.click('.film-thumb[data-index="5"]');
    await frame.waitForFunction(() =>
      document.getElementById('renderCounter').textContent === '06 / 08',
      null, { timeout: 10000, polling: 100 });
    await frame.focus('#renderSlideshow');
    await frame.press('#renderSlideshow', 'End');
    await frame.waitForFunction(() =>
      document.getElementById('renderCounter').textContent === '08 / 08',
      null, { timeout: 10000, polling: 100 });
    await frame.press('#renderSlideshow', 'Home');
    await frame.waitForFunction(() =>
      document.getElementById('renderCounter').textContent === '01 / 08',
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
        counter: document.getElementById('caRenderFsCounter').textContent,
        backdrop: getComputedStyle(document.getElementById('caRenderFsBackdrop')).backgroundImage,
        body: document.body.classList.contains('render-fs-open')
      };
    });
    check(label + ': render fullscreen uses a 900 px panel',
      fs.open && fs.height === 900 && fs.top >= 0 && fs.body &&
        fs.counter === '1 / 8' && fs.backdrop.includes('imgur'),
      JSON.stringify(fs));
    check(label + ': render fullscreen uses the current rendered source',
      width <= 700
        ? /https:\/\/i\.imgur\.com\/[A-Za-z0-9]+h\.jpg$/.test(fs.src)
        : /https:\/\/i\.imgur\.com\/[A-Za-z0-9]+\.jpeg$/.test(fs.src),
      fs.src);
    await frame.click('#caRenderFsNext');
    await frame.waitForFunction(() =>
      document.getElementById('caRenderFsCounter').textContent === '2 / 8' &&
      document.getElementById('renderCounter').textContent === '02 / 08',
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
        plate: document.getElementById('bvPlate').textContent,
        title: document.getElementById('bvTitle').textContent,
        count: document.getElementById('bvCount').textContent,
        zoom: document.getElementById('bvZoomReset').textContent,
        body: document.body.classList.contains('board-open')
      };
    });
    check(label + ': board viewer opens as a 900 px panel',
      board.open && board.height === 900 && board.top >= 0 && board.body &&
        board.plate === 'PLATE 01' && board.title === 'PLANS & SECTIONS' &&
        board.count === '01 / 02' && board.zoom === '100%',
      JSON.stringify(board));
    check(label + ': board viewer uses the right inspection file',
      board.src.includes(width <= 700 ? 'board-1-1280.jpg' : 'board-1-2048.jpg'),
      board.src);

    await frame.click('#bvZoomIn');
    await wait(250);
    check(label + ': board zoom works',
      await frame.evaluate(() =>
        document.getElementById('bvZoomReset').textContent === '135%'));

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
        nextBoard.title === 'MATERIALS & DETAILS' &&
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

function INT_CODE() {
  return 'INT / ' + data.RENDERS[0].code;
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
      page: '?page=' + data.PAGE_CODE,
      behanceFrames: [BEHANCE_WIDTH + 'x' + BEHANCE_HEIGHT,
        PHONE_WIDTH + 'x' + BEHANCE_HEIGHT],
      boards: data.BOARDS.length,
      renders: data.RENDERS.length,
      materials: data.MATERIALS.length,
      tools: data.TOOLS.length,
      assets: 13
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
