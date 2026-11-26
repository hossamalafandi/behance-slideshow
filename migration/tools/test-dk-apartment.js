#!/usr/bin/env node
'use strict';

/**
 * Local DK-Apartment page suite.
 *
 * Loads the page in Behance-like frames at 987x2900 and 390x2900. Imgur,
 * Vimeo, and the fonts are stubbed; the copied hero is served by the local
 * router.
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');
const data = require('./dk-apartment-data');
const { createPilotServer } = require('./serve');

const ROOT = path.resolve(__dirname, '..');
const PREVIEW_FILE = path.join(ROOT, '03_REBUILT_SLIDESHOWS', 'preview', 'dk-apartment.html');
const PRODUCTION_FILE = path.join(ROOT, '04_APPS_SCRIPT', 'DKApartment.html');
const ASSET_DIR = path.resolve(ROOT, '..', 'assets', 'dk-apartment');
const RESULTS_DIR = path.join(ROOT, '01_AUDIT', 'evidence', 'dk-apartment');
const REPORT_FILE = path.join(RESULTS_DIR, 'dk-apartment-test-results.json');
const BEHANCE_WIDTH = 987;
const PHONE_WIDTH = 390;
const BEHANCE_HEIGHT = data.EMBED_HEIGHT;
const VIMEO_IDS = ['1250270804', '1250270805'];

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
const VIDEO_HTML = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Vimeo</title></head><body style="margin:0;background:#111;color:#fff;display:flex;align-items:center;justify-content:center;height:100%;font-family:Arial">VIDEO</body></html>';

function expectedAssets() {
  return [
    'hero-1920.jpg', 'hero-768.jpg',
    'images-left-top-1280.jpg', 'images-left-top-768.jpg',
    'images-left-bottom-1280.jpg', 'images-left-bottom-768.jpg',
    'images-middle-top-1280.jpg', 'images-middle-top-768.jpg'
  ].sort();
}

function staticChecks() {
  const production = fs.readFileSync(PRODUCTION_FILE, 'utf8');
  const preview = fs.readFileSync(PREVIEW_FILE, 'utf8');
  const images = imageTags(production);
  const hero = images.filter(tag => attr(tag, 'alt') === data.HERO.alt);
  const slides = images.filter(tag => /^DK-Apartment slide \d+$/.test(attr(tag, 'alt')));
  const shots = images.filter(tag => /^DK-Apartment on-site photo \d$/.test(attr(tag, 'alt')));
  const tools = images.filter(tag => / Logo$/.test(attr(tag, 'alt')));

  check('page title is exact', production.includes('<title>' + data.PAGE_TITLE + '</title>'));
  check('page has no Google Sites chrome',
    !/sites\.google\.com|sitesv-images|googleusercontent|view\/hossam-alafandi|Report abuse/i
      .test(production));
  check('page has no Drive video embeds',
    !/drive\.google\.com|youtube\.com|youtu\.be/i.test(production));
  check('page has 4 section headings',
    JSON.stringify(Array.from(production.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/g))
      .map(match => match[1].replace(/<[^>]+>/g, '').trim())) ===
      JSON.stringify(['OVERVIEW', 'PRESENTATION', 'IMAGES', 'TOOLS USED']));
  check('page has 2 Vimeo iframes',
    (production.match(/<iframe\b[^>]*player\.vimeo\.com\/video\//g) || []).length === 2);
  check('Vimeo IDs are exact and in order',
    JSON.stringify(Array.from(production.matchAll(
      /player\.vimeo\.com\/video\/(\d+)/g)).map(match => match[1])) ===
      JSON.stringify(VIMEO_IDS));
  check('page has 46 images', images.length === 46, images.length);
  check('page has one hero, 38 slides, 3 photos, and 4 tools',
    hero.length === 1 && slides.length === 38 && shots.length === 3 && tools.length === 4,
    [hero.length, slides.length, shots.length, tools.length].join('/'));
  check('hero uses the 1920 desktop file and 768 phone source',
    attr(hero[0] || '', 'src') === data.assetUrl(data.PRODUCTION_ASSET_BASE, 'hero', 1920) &&
      production.includes('<source media="(max-width: 700px)" srcset="' +
        data.assetUrl(data.PRODUCTION_ASSET_BASE, 'hero', 768) + '">'));
  check('copied photos use 1280 desktop files and 768 phone sources',
    shots.length === 3 &&
      shots.every(tag => /-1280\.jpg$/.test(attr(tag, 'src'))) &&
      (production.match(/<source media="\(max-width: 700px\)" srcset="[^"]+images-(?:left-top|left-bottom|middle-top)-768\.jpg">/g) || [])
        .length === 3);
  check('slides use the full Imgur JPGs on desktop',
    slides.every((tag, index) => attr(tag, 'src') === data.renderUrl(data.RENDERS[index])));
  check('slides provide the h JPGs on phone',
    (production.match(/<source media="\(max-width: 700px\)" srcset="https:\/\/i\.imgur\.com\/[A-Za-z0-9]+h\.jpg">/g) || [])
      .length === 38);
  check('slideshow starts with 1 / 38 and has 38 dots',
    production.includes('>1 / ' + data.RENDERS.length + '</span>') &&
      production.includes('var count = slides.length'));
  check('slideshow track is 38 frames wide',
    production.includes('width: ' + (data.RENDERS.length * 100) + '%;'));
  check('tool logos match the exact Imgur PNGs',
    tools.length === 4 &&
      tools.every((tag, index) => attr(tag, 'src') === data.toolUrl(data.TOOLS[index].id)));
  check('page has no anchors or popup navigation',
    !/<a\b|window\.open|target="_blank"/i.test(production));
  check('page uses no storage, cookies, or messaging',
    !/localStorage|sessionStorage|indexedDB|document\.cookie|postMessage|BroadcastChannel/i
      .test(production));
  check('page has no external scripts', !/<script\b[^>]*\bsrc=/i.test(production));
  check('page keeps the fixed 2900 px embed height',
    data.EMBED_HEIGHT === 2900 && data.EMBED_WIDTH === '100%');
  check('page has the phone breakpoint', /@media \(max-width: 700px\)/.test(production));
  check('preview uses local hero and photo assets',
    expectedAssets().every(name => preview.includes(data.PREVIEW_ASSET_BASE + name)));
  check('hero and copied photos exist on disk',
    expectedAssets().every(name => fs.existsSync(path.join(ASSET_DIR, name))));
  check('production references exactly the 8 copied files',
    JSON.stringify(Array.from(new Set(Array.from(production.matchAll(
      /cdn\.jsdelivr\.net\/gh\/hossamalafandi\/behance-slideshow@main\/assets\/dk-apartment\/([A-Za-z0-9._-]+)/g
    )).map(match => match[1]))).sort()) === JSON.stringify(expectedAssets()));
}

async function blockThirdParty(context) {
  await context.route('https://i.imgur.com/**', route => {
    blockedImgurRequests += 1;
    const url = route.request().url();
    const body = url.endsWith('.png') ? LOGO_SVG
      : /h\.jpg$/.test(url) ? SLIDE_H_SVG : SLIDE_SVG;
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

function wrapperHtml(base, width) {
  return [
    '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>',
    'html,body{margin:0;padding:0;background:#fff}',
    'iframe{display:block;border:0}',
    '</style></head><body>',
    '<iframe id="embed" src="' + base + '/exec?page=dk-apartment" width="' + width +
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
      document.querySelectorAll('.slide').length === 38 &&
      document.querySelectorAll('.slide-dot').length === 38, null,
      { timeout: 30000, polling: 100 });
    await frame.evaluate(() => document.fonts.ready.then(() => true));
    await frame.waitForFunction(() => {
      const selected = [
        document.querySelector('.hero img'),
        document.querySelector('.tools-row img'),
        document.querySelector('.slide:first-child img')
      ];
      return selected.every(image => image && image.complete && image.naturalWidth > 0);
    }, null, { timeout: 30000, polling: 100 });
    await wait(300);

    const state = await frame.evaluate(() => {
      const rect = element => {
        const box = element.getBoundingClientRect();
        return { x: Math.round(box.x), y: Math.round(box.y + scrollY),
          width: Math.round(box.width), height: Math.round(box.height) };
      };
      return {
        inner: [innerWidth, innerHeight],
        scroll: [document.documentElement.scrollWidth, document.documentElement.scrollHeight],
        body: [document.body.scrollWidth, document.body.scrollHeight],
        main: rect(document.getElementById('page')),
        headings: Array.from(document.querySelectorAll('h2')).map(h => h.textContent.trim()),
        slides: document.querySelectorAll('.slide').length,
        dots: document.querySelectorAll('.slide-dot').length,
        videos: Array.from(document.querySelectorAll('.video-frame iframe')).map(iframe => iframe.src),
        imagesGridDisplay: getComputedStyle(document.querySelector('.images-grid')).display,
        imageGridColumns: getComputedStyle(document.querySelector('.images-grid'))
          .gridTemplateColumns.trim().split(/\s+/).length,
        imageColumns: document.querySelectorAll('.image-column').length,
        shots: Array.from(document.querySelectorAll('.shot img')).map(image => ({
          src: image.currentSrc || image.getAttribute('src'),
          natural: [image.naturalWidth, image.naturalHeight]
        })),
        tools: Array.from(document.querySelectorAll('.tools-row img')).map(image => image.src),
        counter: document.getElementById('slideCounter').textContent,
        stageWidth: document.getElementById('slideshowStage').getBoundingClientRect().width,
        slideWidth: document.querySelector('.slide').getBoundingClientRect().width,
        trackWidth: document.getElementById('slideshowTrack').getBoundingClientRect().width,
        hero: (() => {
          const image = document.querySelector('.hero img');
          return { src: image.currentSrc || image.getAttribute('src'),
            natural: [image.naturalWidth, image.naturalHeight] };
        })(),
        firstSlide: (() => {
          const image = document.querySelector('.slide img');
          return { src: image.currentSrc || image.getAttribute('src'),
            natural: [image.naturalWidth, image.naturalHeight] };
        })()
      };
    });

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
    check(label + ': headings are exact',
      JSON.stringify(state.headings) ===
        JSON.stringify(['OVERVIEW', 'PRESENTATION', 'IMAGES', 'TOOLS USED']));
    check(label + ': 38 slides, 38 dots, and the 1 / 38 counter',
      state.slides === 38 && state.dots === 38 && state.counter === '1 / 38',
      [state.slides, state.dots, state.counter].join(' / '));
    check(label + ': slideshow track is 38 full frames wide',
      Math.abs(state.slideWidth - state.stageWidth) <= 1 &&
        Math.abs(state.trackWidth - state.stageWidth * 38) <= 2,
      JSON.stringify({ stage: state.stageWidth, slide: state.slideWidth,
        track: state.trackWidth }));
    check(label + ': hero uses the right source',
      state.hero.src.includes(width <= 700 ? 'hero-768.jpg' : 'hero-1920.jpg'));
    check(label + ': first slide uses the right Imgur source',
      width <= 700
        ? /https:\/\/i\.imgur\.com\/[A-Za-z0-9]+h\.jpg$/.test(state.firstSlide.src)
        : /https:\/\/i\.imgur\.com\/[A-Za-z0-9]+\.jpg$/.test(state.firstSlide.src));
    check(label + ': images section is masonry on desktop and a two-column grid on phone',
      state.imageColumns === 3 &&
        (width <= 700
          ? state.imagesGridDisplay === 'grid' && state.imageGridColumns === 2
          : state.imagesGridDisplay === 'flex'),
      state.imagesGridDisplay + ' / ' + state.imageGridColumns + ' / ' + state.imageColumns);
    check(label + ': 3 copied photos use the right source size',
      state.shots.length === 3 &&
        state.shots.every(shot => shot.src.includes(
          width <= 700 ? '-768.jpg' : '-1280.jpg')),
      state.shots.length + ' / ' + (state.shots[0] && state.shots[0].src));
    check(label + ': 2 Vimeo videos are present in order',
      state.videos.length === 2 &&
        state.videos.every((src, index) => src.includes(VIMEO_IDS[index])),
      state.videos.join(', '));
    check(label + ': 4 tools use the exact Imgur logos',
      state.tools.length === 4 &&
        state.tools.every((src, index) => src === data.toolUrl(data.TOOLS[index].id)));

    await frame.click('#slideNext');
    await frame.waitForFunction(() =>
      document.getElementById('slideCounter').textContent === '2 / 38', null,
      { timeout: 10000, polling: 100 });
    await wait(700);
    const framePosition = await frame.evaluate(() => {
      const stageBox = document.getElementById('slideshowStage').getBoundingClientRect();
      const slideBox = document.querySelectorAll('.slide')[1].getBoundingClientRect();
      return { stage: stageBox.x, slide: slideBox.x };
    });
    check(label + ': next reveals exactly one full frame',
      Math.abs(framePosition.slide - framePosition.stage) <= 1,
      JSON.stringify(framePosition));
    await frame.click('.slide-dot:nth-child(20)');
    await frame.waitForFunction(() =>
      document.getElementById('slideCounter').textContent === '20 / 38', null,
      { timeout: 10000, polling: 100 });
    check(label + ': dot 20 jumps to 20 / 38', true);
    await frame.press('#rendersSlideshow', 'End');
    await frame.waitForFunction(() =>
      document.getElementById('slideCounter').textContent === '38 / 38', null,
      { timeout: 10000, polling: 100 });
    await frame.press('#rendersSlideshow', 'Home');
    await frame.waitForFunction(() =>
      document.getElementById('slideCounter').textContent === '1 / 38', null,
      { timeout: 10000, polling: 100 });
    check(label + ': keyboard End and Home work', true);

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
      page: '?page=dk-apartment',
      behanceFrames: [BEHANCE_WIDTH + 'x' + BEHANCE_HEIGHT,
        PHONE_WIDTH + 'x' + BEHANCE_HEIGHT],
      slides: data.RENDERS.length,
      videos: data.VIDEOS.length,
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
