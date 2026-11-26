#!/usr/bin/env node
'use strict';

/**
 * Local Cellphone Store page suite.
 *
 * Checks the generated page and loads it in Behance-like sandboxed frames at
 * 987x11500 and 390x11500. Imgur, Vimeo, and the map are stubbed; the copied
 * jsDelivr/local assets are served by the local router.
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');
const data = require('./cellphone-data');
const { createPilotServer, NOT_FOUND_HTML } = require('./serve');

const ROOT = path.resolve(__dirname, '..');
const PREVIEW_FILE = path.join(ROOT, '03_REBUILT_SLIDESHOWS', 'preview', 'cellphone-store.html');
const PRODUCTION_FILE = path.join(ROOT, '04_APPS_SCRIPT', 'CellphoneStore.html');
const ASSET_DIR = path.resolve(ROOT, '..', 'assets', 'cellphone-store');
const RESULTS_DIR = path.join(ROOT, '01_AUDIT', 'evidence', 'cellphone-store');
const REPORT_FILE = path.join(RESULTS_DIR, 'cellphone-store-test-results.json');
const BEHANCE_WIDTH = 987;
const PHONE_WIDTH = 390;
const BEHANCE_HEIGHT = data.EMBED_HEIGHT;

const VIMEO_IDS = [
  '1245908917', '1245909044', '1245909094', '1245909398',
  '1245912603', '1245912647', '1245912852', '1245913033', '1245913587'
];

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

const SHOT_SVG = [
  '<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="1700">',
  '<rect width="1280" height="1700" fill="#17324d"/>',
  '<circle cx="640" cy="850" r="220" fill="#e2a24a"/>',
  '</svg>'
].join('');
const SLIDE_SVG = [
  '<svg xmlns="http://www.w3.org/2000/svg" width="2000" height="2667">',
  '<rect width="2000" height="2667" fill="#1c2a3a"/>',
  '<circle cx="1000" cy="1333" r="320" fill="#e2a24a"/>',
  '</svg>'
].join('');
const SLIDE_H_SVG = [
  '<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1365">',
  '<rect width="1024" height="1365" fill="#1c2a3a"/>',
  '<circle cx="512" cy="682" r="160" fill="#e2a24a"/>',
  '</svg>'
].join('');
const LOGO_SVG = [
  '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">',
  '<rect width="200" height="200" fill="#000"/>',
  '<text x="100" y="110" font-family="Arial" font-size="26" fill="#fff" text-anchor="middle">LOGO</text>',
  '</svg>'
].join('');
const VIDEO_HTML = [
  '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Vimeo</title></head>',
  '<body style="margin:0;background:#111;color:#fff;display:flex;align-items:center;',
  'justify-content:center;height:100%;font-family:Arial">VIDEO</body></html>'
].join('');
const MAP_HTML = [
  '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Map</title></head>',
  '<body style="margin:0;background:#ddeeff;display:flex;align-items:center;',
  'justify-content:center;font-family:Arial">MAP</body></html>'
].join('');

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

function staticChecks() {
  const production = fs.readFileSync(PRODUCTION_FILE, 'utf8');
  const preview = fs.readFileSync(PREVIEW_FILE, 'utf8');
  const images = imageTags(production);

  check('page title is exact', production.includes('<title>' + data.PAGE_TITLE + '</title>'));
  check('page has no Google Sites chrome',
    !/sites\.google\.com|sitesv-images|googleusercontent|view\/hossam-alafandi|Report abuse/i
      .test(production));
  check('page has no Drive or YouTube video embeds',
    !/drive\.google\.com|youtube\.com|youtu\.be/i.test(production));
  check('page has 5 section headings',
    JSON.stringify(Array.from(production.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/g))
      .map(match => match[1].replace(/<[^>]+>/g, '').trim())) ===
      JSON.stringify(['OVERVIEW', 'WORK DEVELOPMENT STAGES', 'Render VS Reality',
        'LOCATION', 'TOOLS USED']));
  check('page has 7 stage articles',
    (production.match(/<article class="stage"/g) || []).length === 7);
  check('stage titles are exact and in order',
    JSON.stringify(Array.from(production.matchAll(/<h3>([^<]+)<\/h3>/g))
      .map(match => match[1])) === JSON.stringify(data.STAGES.map(stage => stage.title)));
  check('page has 9 Vimeo iframes',
    (production.match(/<iframe\b[^>]*player\.vimeo\.com\/video\//g) || []).length === 9);
  check('Vimeo IDs are exact and in order',
    JSON.stringify(Array.from(production.matchAll(
      /player\.vimeo\.com\/video\/(\d+)/g)).map(match => match[1])) ===
      JSON.stringify(VIMEO_IDS));
  check('page has one map iframe',
    (production.match(/<iframe\b/g) || []).length === 10 &&
      production.includes('class="map-frame" src="' +
        data.MAP_URL.replace(/&/g, '&amp;') + '"'));
  check('page has 38 images', images.length === 38, images.length);

  const hero = images.filter(tag => attr(tag, 'alt') === data.HERO.alt);
  const slides = images.filter(tag => /^Cellphone Store render \d+$/.test(attr(tag, 'alt')));
  const tools = images.filter(tag => / Logo$/.test(attr(tag, 'alt')));
  const shots = images.filter(tag => {
    const src = attr(tag, 'src');
    return src.includes('/cellphone-store/') && attr(tag, 'alt') !== data.HERO.alt;
  });
  check('page has one hero, 21 copied shots, 11 slides, and 4 tools',
    hero.length === 1 && shots.length === 21 && slides.length === 11 && tools.length === 4,
    [hero.length, shots.length, slides.length, tools.length].join('/'));
  check('hero uses the 1920 desktop file and 768 phone source',
    attr(hero[0] || '', 'src') === data.assetUrl(data.PRODUCTION_ASSET_BASE, 'hero', 1920) &&
      production.includes('<source media="(max-width: 700px)" srcset="' +
        data.assetUrl(data.PRODUCTION_ASSET_BASE, 'hero', 768) + '">'));
  check('copied shots use 1280 desktop files',
    shots.every(tag => /-1280\.jpg$/.test(attr(tag, 'src'))));
  check('copied shots provide 768 phone sources',
    (production.match(/<source media="\(max-width: 700px\)" srcset="[^"]+-768\.jpg">/g) || [])
      .length === 22);
  check('slides use the full Imgur JPGs on desktop',
    slides.every((tag, index) => attr(tag, 'src') === data.renderUrl(data.RENDERS[index])));
  check('slides provide the h JPGs on phone',
    (production.match(/<source media="\(max-width: 700px\)" srcset="https:\/\/i\.imgur\.com\/[A-Za-z0-9]+h\.jpg">/g) || [])
      .length === 11);
  check('slideshow starts with 1 / 11 and has 11 dots',
    production.includes('>1 / ' + data.RENDERS.length + '</span>') &&
      production.includes('var count = slides.length'));
  check('slideshow track is 11 frames wide',
    production.includes('width: ' + (data.RENDERS.length * 100) + '%;'));
  check('page has the slideshow fullscreen viewer',
    production.includes('id="slideFullscreen"') &&
      production.includes('id="slideFullscreenViewer"') &&
      production.includes('id="slideFsImage"') &&
      production.includes('slide-fs-open'));
  check('tool logos match the exact Imgur PNGs',
    tools.length === 4 &&
      tools.every((tag, index) => attr(tag, 'src') === data.toolUrl(data.TOOLS[index].id)));
  check('page has no anchors or popup navigation',
    !/<a\b|window\.open|target="_blank"/i.test(production));
  check('page uses no storage, cookies, or messaging',
    !/localStorage|sessionStorage|indexedDB|document\.cookie|postMessage|BroadcastChannel/i
      .test(production));
  check('page has no external scripts',
    !/<script\b[^>]*\bsrc=/i.test(production));
  check('page keeps the fixed 13320 px embed height',
    data.EMBED_HEIGHT === 13320 && data.EMBED_WIDTH === '100%');
  check('page has the phone breakpoint', /@media \(max-width: 700px\)/.test(production));

  const referenced = Array.from(new Set(Array.from(production.matchAll(
    /cdn\.jsdelivr\.net\/gh\/hossamalafandi\/behance-slideshow@main\/assets\/cellphone-store\/([A-Za-z0-9._-]+)/g
  )).map(match => match[1]))).sort();
  check('production references exactly the 44 copied assets',
    JSON.stringify(referenced) === JSON.stringify(expectedAssets()),
    referenced.length + ' referenced');
  check('preview references the local copied assets',
    expectedAssets().every(name => preview.includes(data.PREVIEW_ASSET_BASE + name)));
  check('each copied asset exists on disk',
    expectedAssets().every(name => fs.existsSync(path.join(ASSET_DIR, name))));
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
  await context.route('https://maps-api-ssl.google.com/**', route => route.fulfill({
    status: 200, contentType: 'text/html; charset=utf-8', body: MAP_HTML
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
    '<iframe id="embed" src="' + base + '/exec?page=cellphone-store" width="' + width +
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
      document.querySelectorAll('.slide').length === 11 &&
      document.querySelectorAll('.slide-dot').length === 11, null,
      { timeout: 30000, polling: 100 });
    await frame.evaluate(() => document.fonts.ready.then(() => true));
    await frame.waitForFunction(() => {
      const images = Array.from(document.querySelectorAll(
        '.hero img, .shot img, .tools-row img, .slide:first-child img'));
      return images.length === 27 &&
        images.every(image => image.complete && image.naturalWidth > 0);
    }, null, { timeout: 30000, polling: 100 });
    await wait(400);

    const state = await frame.evaluate(() => {
      const rect = element => {
        const box = element.getBoundingClientRect();
        return { x: Math.round(box.x), y: Math.round(box.y + scrollY),
          width: Math.round(box.width), height: Math.round(box.height) };
      };
      const style = element => getComputedStyle(element);
      const videoFrames = Array.from(document.querySelectorAll('.video-frame'));
      return {
        inner: [innerWidth, innerHeight],
        scroll: [document.documentElement.scrollWidth, document.documentElement.scrollHeight],
        body: [document.body.scrollWidth, document.body.scrollHeight],
        main: rect(document.getElementById('page')),
        headings: Array.from(document.querySelectorAll('h2')).map(h => h.textContent.trim()),
        stagesTitle: rect(document.getElementById('stages-title')),
        stages: document.querySelectorAll('.stage').length,
        videos: videoFrames.map(frame => ({
          src: frame.querySelector('iframe').src,
          ratio: frame.getBoundingClientRect().width / frame.getBoundingClientRect().height,
          ...rect(frame)
        })),
        videoRowDisplay: style(document.querySelector('.video-row')).display,
        videoRowOverflow: style(document.querySelector('.video-row')).overflowX,
        shots: Array.from(document.querySelectorAll('.shot img')).map(image => ({
          src: image.currentSrc || image.getAttribute('src'),
          natural: [image.naturalWidth, image.naturalHeight],
          ...rect(image)
        })),
        slides: Array.from(document.querySelectorAll('.slide img')).map(image => ({
          src: image.currentSrc || image.getAttribute('src'),
          natural: [image.naturalWidth, image.naturalHeight]
        })),
        tools: Array.from(document.querySelectorAll('.tools-row img')).map(image => ({
          src: image.currentSrc || image.getAttribute('src'),
          natural: [image.naturalWidth, image.naturalHeight]
        })),
        counter: document.getElementById('slideCounter').textContent,
        dots: document.querySelectorAll('.slide-dot').length,
        stageWidth: document.getElementById('slideshowStage').getBoundingClientRect().width,
        slideWidth: document.querySelector('.slide').getBoundingClientRect().width,
        trackWidth: document.getElementById('slideshowTrack').getBoundingClientRect().width,
        map: document.querySelector('.map-frame').src,
        stageTops: Array.from(document.querySelectorAll('.stage')).map(stage => ({
          id: stage.id, ...rect(stage)
        }))
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
    check(label + ': headings and stages are exact',
      JSON.stringify(state.headings) === JSON.stringify([
        'OVERVIEW', 'WORK DEVELOPMENT STAGES', 'Render VS Reality', 'LOCATION', 'TOOLS USED'
      ]) && state.stages === 7,
      state.headings.join(', ') + ' / ' + state.stages);
    check(label + ': WORK DEVELOPMENT STAGES is one line on desktop',
      width <= 700 || state.stagesTitle.height <= 70,
      JSON.stringify(state.stagesTitle));
    const stageGaps = state.stageTops.slice(1).map((stage, index) =>
      stage.y - (state.stageTops[index].y + state.stageTops[index].height));
    check(label + ': stage sections keep normal spacing',
      stageGaps.every(gap => gap <= 100), stageGaps.join(', '));
    check(label + ': 9 Vimeo videos use 9:16 frames',
      state.videos.length === 9 &&
        state.videos.every(video => /player\.vimeo\.com\/video\/\d+/.test(video.src)) &&
        state.videos.every(video => Math.abs(video.ratio - 9 / 16) <= 0.01),
      JSON.stringify(state.videos.map(video => [video.ratio, video.src.slice(-24)])));
    check(label + ': two-video stages stack vertically on phone',
      width <= 700
        ? state.videoRowDisplay === 'grid' && state.videoRowOverflow === 'visible'
        : state.videoRowDisplay === 'grid' && state.videoRowOverflow === 'visible',
      state.videoRowDisplay + ' / ' + state.videoRowOverflow);
    check(label + ': 21 copied shots use the right source size',
      state.shots.length === 21 &&
        state.shots.every(shot => shot.src.includes(
          width <= 700 ? '-768.jpg' : '-1280.jpg')),
      state.shots.length + ' / ' + (state.shots[0] && state.shots[0].src));
    check(label + ': slides use the right Imgur source',
      state.slides.length === 11 &&
        (width <= 700
          ? /https:\/\/i\.imgur\.com\/[A-Za-z0-9]+h\.jpg$/.test(state.slides[0].src)
          : /https:\/\/i\.imgur\.com\/[A-Za-z0-9]+\.jpg$/.test(state.slides[0].src)),
      state.slides.length + ' / ' + (state.slides[0] && state.slides[0].src));
    check(label + ': first slide decodes at the expected size',
      width <= 700
        ? state.slides[0].natural[0] === 1024 && state.slides[0].natural[1] === 1365
        : state.slides[0].natural[0] === 2000 && state.slides[0].natural[1] === 2667,
      state.slides[0].natural.join('x'));
    check(label + ': 4 tools use the exact Imgur logos',
      state.tools.length === 4 &&
        state.tools.every((tool, index) =>
          tool.src === data.toolUrl(data.TOOLS[index].id) &&
          tool.natural[0] === 200 && tool.natural[1] === 200));
    check(label + ': the map keeps the exact URL',
      state.map === data.MAP_URL, state.map);
    check(label + ': slideshow starts at 1 / 11 with 11 dots',
      state.counter === '1 / 11' && state.dots === 11,
      state.counter + ' / ' + state.dots);
    check(label + ': slideshow track is 11 full frames wide',
      Math.abs(state.slideWidth - state.stageWidth) <= 1 &&
        Math.abs(state.trackWidth - state.stageWidth * 11) <= 2,
      JSON.stringify({ stage: state.stageWidth, slide: state.slideWidth,
        track: state.trackWidth }));

    await frame.click('#slideNext');
    await frame.waitForFunction(() =>
      document.getElementById('slideCounter').textContent === '2 / 11', null,
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
    await frame.click('.slide-dot:nth-child(5)');
    await frame.waitForFunction(() =>
      document.getElementById('slideCounter').textContent === '5 / 11', null,
      { timeout: 10000, polling: 100 });
    check(label + ': dot 5 jumps to 5 / 11', true);
    await frame.press('#rendersSlideshow', 'End');
    await frame.waitForFunction(() =>
      document.getElementById('slideCounter').textContent === '11 / 11', null,
      { timeout: 10000, polling: 100 });
    await frame.waitForFunction(expectedWidth => {
      const image = document.querySelectorAll('.slide img')[10];
      return image && image.complete && image.naturalWidth === expectedWidth;
    }, width <= 700 ? 1024 : 2000, { timeout: 15000, polling: 100 });
    check(label + ': End loads the 11th slide at the expected size',
      await frame.evaluate(() =>
        document.querySelectorAll('.slide img')[10].naturalWidth) ===
          (width <= 700 ? 1024 : 2000));
    await frame.press('#rendersSlideshow', 'Home');
    await frame.waitForFunction(() =>
      document.getElementById('slideCounter').textContent === '1 / 11', null,
      { timeout: 10000, polling: 100 });
    check(label + ': keyboard End and Home work', true);

    await frame.evaluate(() => {
      const stage = document.getElementById('slideshowStage');
      const fire = (type, x, y) => {
        const event = new Event(type, { bubbles: true, cancelable: true });
        Object.defineProperty(event, type === 'touchstart' ? 'touches' : 'changedTouches', {
          value: [{ clientX: x, clientY: y }]
        });
        stage.dispatchEvent(event);
      };
      fire('touchstart', 300, 120);
      fire('touchend', 180, 120);
    });
    await frame.waitForFunction(() =>
      document.getElementById('slideCounter').textContent === '2 / 11', null,
      { timeout: 10000, polling: 100 });
    check(label + ': horizontal swipe changes the slide', true);

    if (width <= 700) {
      await frame.evaluate(() => {
        Object.defineProperty(screen, 'width', { configurable: true, get: () => 390 });
        Object.defineProperty(screen, 'height', { configurable: true, get: () => 844 });
        Object.defineProperty(screen, 'availWidth', { configurable: true, get: () => 390 });
        Object.defineProperty(screen, 'availHeight', { configurable: true, get: () => 844 });
      });
      await frame.press('#rendersSlideshow', 'Home');
      await frame.waitForFunction(() =>
        document.getElementById('slideCounter').textContent === '1 / 11', null,
        { timeout: 10000, polling: 100 });
      await frame.click('#slideFullscreen');
      await wait(400);
      const fs = await frame.evaluate(() => {
        const viewer = document.getElementById('slideFullscreenViewer');
        const image = document.getElementById('slideFsImage');
        const box = viewer.getBoundingClientRect();
        return {
          open: viewer.classList.contains('is-open') && !viewer.hidden,
          height: box.height,
          top: box.top,
          src: image.getAttribute('src'),
          natural: [image.naturalWidth, image.naturalHeight],
          counter: document.getElementById('slideFsCounter').textContent,
          label: document.getElementById('slideFullscreen').getAttribute('aria-label'),
          body: document.body.classList.contains('slide-fs-open')
        };
      });
      check(label + ': phone slideshow fullscreen opens with vertical space',
        fs.open && Math.abs(fs.height - 844) <= 1 && fs.top >= 0 &&
          fs.src === data.renderThumbUrl(data.RENDERS[0]) &&
          fs.counter === '1 / 11' &&
          fs.label === 'Exit fullscreen' && fs.body,
        JSON.stringify(fs));
      await frame.click('#slideFsNext');
      await frame.waitForFunction(() =>
        document.getElementById('slideFsCounter').textContent === '2 / 11' &&
        document.getElementById('slideCounter').textContent === '2 / 11', null,
        { timeout: 10000, polling: 100 });
      check(label + ': phone fullscreen navigation stays in sync', true);
      await frame.click('#slideFsClose');
      await wait(300);
      check(label + ': phone fullscreen closes cleanly',
        await frame.evaluate(() =>
          document.getElementById('slideFullscreenViewer').hidden &&
          !document.body.classList.contains('slide-fs-open')));

      await frame.click('#slideFullscreen');
      await wait(300);
      await frame.evaluate(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      });
      await wait(300);
      check(label + ': Escape closes the phone slideshow fullscreen',
        await frame.evaluate(() =>
          document.getElementById('slideFullscreenViewer').hidden));
    }

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
