#!/usr/bin/env node
'use strict';

/**
 * Standalone Al-Rashed project page suite.
 *
 * Verifies the new `?page=al-rashed` route without touching the 48 slideshow
 * routes:
 *  - the generated production and local preview pages come from one source;
 *  - the page contains no Google Sites header, navigation, or footer;
 *  - the 17 render URLs and 5 tool logos keep their exact Imgur URLs and order;
 *  - the 9 owner-approved page images are served locally and referenced through
 *    jsDelivr in production;
 *  - the strict page router rejects missing, repeated, mixed, and unknown page
 *    values while `?slide=` keeps working;
 *  - the page fits exactly in Behance-like sandboxed frames at 987x2980 and
 *    390x2980 with no horizontal or vertical overflow;
 *  - navigation, dots, counter, keyboard, swipe, and both fullscreen paths work;
 *  - the photo grid, map, tools row, and copyright render correctly on desktop
 *    and phone.
 *
 * Every Imgur request is fulfilled with a synthetic SVG and every Google Maps
 * request with a tiny local document, so no original image or map tile is
 * downloaded. The 9 local page images are small, committed derivatives.
 *
 * Usage:
 *   node test-al-rashed.js
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');
const { createPilotServer, NOT_FOUND_HTML } = require('./serve');
const data = require('./al-rashed-data');

const ROOT = path.resolve(__dirname, '..');
const PREVIEW_FILE = path.join(ROOT, '03_REBUILT_SLIDESHOWS', 'preview', 'al-rashed.html');
const PRODUCTION_FILE = path.join(ROOT, '04_APPS_SCRIPT', 'AlRashed.html');
const ASSET_DIR = path.resolve(ROOT, '..', 'assets', 'al-rashed');
const RESULTS_DIR = path.join(ROOT, '01_AUDIT', 'evidence', 'al-rashed');
const REPORT_FILE = path.join(RESULTS_DIR, 'al-rashed-test-results.json');
const BEHANCE_HEIGHT = data.EMBED_HEIGHT;
const BEHANCE_WIDTH = 987;
const PHONE_WIDTH = 390;

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

const EXPECTED_ASSETS = [
  { name: 'hero-768.jpg', width: 768, height: 432, maxBytes: 80 * 1024 },
  { name: 'hero-1280.jpg', width: 1280, height: 720, maxBytes: 180 * 1024 },
  { name: 'hero-1920.jpg', width: 1920, height: 1080, maxBytes: 340 * 1024 },
  { name: 'real1-768.jpg', width: 768, height: 577, maxBytes: 120 * 1024 },
  { name: 'real1-1280.jpg', width: 1277, height: 960, maxBytes: 300 * 1024 },
  { name: 'real2-768.jpg', width: 768, height: 577, maxBytes: 120 * 1024 },
  { name: 'real2-1280.jpg', width: 1277, height: 960, maxBytes: 300 * 1024 },
  { name: 'real3-768.jpg', width: 768, height: 577, maxBytes: 120 * 1024 },
  { name: 'real3-1280.jpg', width: 1280, height: 962, maxBytes: 260 * 1024 }
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

function assertEqual(actual, expected, label) {
  assert(actual === expected, label + ': expected ' + JSON.stringify(expected) +
    ', got ' + JSON.stringify(actual));
}

function assertClose(actual, expected, tolerance, label) {
  assert(Math.abs(actual - expected) <= tolerance, label + ': expected ' +
    expected + ' +/- ' + tolerance + ', got ' + actual);
}

function wait(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function attribute(tag, name) {
  const match = new RegExp('\\b' + name + '="([^"]*)"').exec(tag);
  return match ? match[1] : null;
}

function imageTags(html) {
  return Array.from(html.matchAll(/<img\b[^>]*>/g)).map(match => ({
    tag: match[0],
    src: attribute(match[0], 'src'),
    alt: attribute(match[0], 'alt'),
    loading: attribute(match[0], 'loading'),
    fetchpriority: attribute(match[0], 'fetchpriority')
  }));
}

function cssPixels(value) {
  return Number.parseFloat(String(value));
}

function translatePercent(value) {
  const match = /translateX\((-?[0-9.]+)%\)/.exec(value || '');
  return match ? Number.parseFloat(match[1]) : NaN;
}

async function fetchResponse(base, route) {
  const response = await fetch(base + route, { redirect: 'manual' });
  return {
    status: response.status,
    type: response.headers.get('content-type') || '',
    cache: response.headers.get('cache-control') || '',
    body: await response.text()
  };
}

function staticChecks() {
  const production = read(PRODUCTION_FILE);
  const preview = read(PREVIEW_FILE);
  const normalizedProduction = production
    .split(data.PRODUCTION_ASSET_BASE).join('ASSET/');
  const normalizedPreview = preview
    .split(data.PREVIEW_ASSET_BASE).join('ASSET/');

  check('data: exactly 17 unique renders', data.RENDERS.length === 17 &&
    new Set(data.RENDERS).size === 17, data.RENDERS.length);
  check('data: exactly 5 unique tools', data.TOOLS.length === 5 &&
    new Set(data.TOOLS.map(tool => tool.id)).size === 5, data.TOOLS.length);
  check('data: fixed Behance height is 2980', data.EMBED_HEIGHT === 2980,
    data.EMBED_HEIGHT);
  check('data: map URL is the audited embed URL', data.MAP_URL ===
    'https://maps-api-ssl.google.com/maps?hl=en-US&ll=24.687677,46.763814&output=embed&z=19');

  check('production page exists', fs.existsSync(PRODUCTION_FILE));
  check('preview page exists', fs.existsSync(PREVIEW_FILE));
  check('production and preview come from the same generator',
    normalizedProduction === normalizedPreview,
    production.length + ' vs ' + preview.length);
  check('production page uses jsDelivr for page images',
    production.includes(data.PRODUCTION_ASSET_BASE) &&
      !/(?:src|srcset)="\/assets\/al-rashed\//.test(production));
  check('preview page uses the local asset route',
    preview.includes(data.PREVIEW_ASSET_BASE) &&
      !preview.includes(data.PRODUCTION_ASSET_BASE));
  check('page title is exact',
    production.includes('<title>' + data.PAGE_TITLE + '</title>'));
  check('page declares the phone viewport',
    /<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">/.test(production));
  check('page keeps a dark color scheme', /<meta name="color-scheme" content="dark">/.test(production));
  check('page loads only the Lexend font stylesheet',
    (production.match(/<link\b/g) || []).length === 3 &&
      /fonts\.googleapis\.com\/css2\?family=Lexend:wght@100;200;300;900/.test(production));
  check('page has one inline script and no external script',
    (production.match(/<script\b/g) || []).length === 1 &&
      !/<script\b[^>]*\bsrc=/.test(production));
  check('page has no template directives', !/<\?/.test(production));
  check('page has no anchors or site navigation',
    !/<a\b/i.test(production) && !/<nav\b/i.test(production) &&
      !/role="banner"/i.test(production));
  check('page contains no Google Sites chrome or links',
    !/sites\.google\.com|googleusercontent|atari|view\/hossam-alafandi|Report abuse|Skip to content/i
      .test(production));
  check('page contains no data, file, or blob URLs',
    !/["'](?:data:|file:|blob:)/i.test(production));
  check('page contains no slideshow or tools route',
    !/[?&](?:slide|tools)=/i.test(production) && !/P\d{3}-S\d{2}/.test(production));
  check('page has exactly one iframe, the map',
    (production.match(/<iframe\b/g) || []).length === 1 &&
      production.includes('src="' + data.MAP_URL.replace(/&/g, '&amp;') + '"'));
  check('map iframe has a title and lazy loading',
    /<iframe class="map-frame" src="[^"]+"\s+title="Al-Rashed project location map" loading="lazy"/.test(production));
  check('page has no external embeds besides the map',
    !/<embed|<object/i.test(production));

  const images = imageTags(production);
  const renders = images.filter(image => /^Al-Rashed project render \d+$/.test(image.alt || ''));
  const photos = images.filter(image => /^Al-Rashed project real photo \d$/.test(image.alt || ''));
  const tools = images.filter(image => data.TOOLS.some(tool => tool.name === image.alt));
  const hero = images.filter(image => image.alt === data.HERO.alt);
  check('page has exactly 27 images', images.length === 27, images.length);
  check('page has one hero image', hero.length === 1);
  check('page has 17 render images', renders.length === 17, renders.length);
  check('page has 3 real photos', photos.length === 3, photos.length);
  check('page has 5 tool logos', tools.length === 5, tools.length);
  check('render URLs match the data exactly in order',
    renders.length === 17 &&
      renders.every((image, index) => image.src === data.renderUrl(data.RENDERS[index])));
  check('render images use the full-resolution Imgur originals',
    renders.every(image => /^https:\/\/i\.imgur\.com\/[A-Za-z0-9]+\.jpeg$/.test(image.src)));
  check('render pictures provide the 1024x576 h variant on phone',
    (production.match(
      /<source media="\(max-width: 700px\)" srcset="https:\/\/i\.imgur\.com\/[A-Za-z0-9]+h\.jpeg">/g
    ) || []).length === 17);
  check('only the first render is eager; the rest are lazy',
    renders[0] && renders[0].loading === 'eager' &&
      renders.slice(1).every(image => image.loading === 'lazy'));
  check('real photos use the 1280 desktop files',
    photos.length === 3 &&
      photos.every((image, index) => image.src ===
        data.PRODUCTION_ASSET_BASE + data.REAL_PHOTOS[index].desktop));
  check('real photos are lazy', photos.every(image => image.loading === 'lazy'));
  check('tool URLs match the data exactly in order',
    tools.length === 5 &&
      tools.every((image, index) => image.src === data.toolUrl(data.TOOLS[index].id)));
  check('tool logos are lazy and have alt text',
    tools.every(image => image.loading === 'lazy' && Boolean(image.alt)));
  check('hero is eager with high fetch priority',
    hero.length === 1 && hero[0].loading === 'eager' &&
      hero[0].fetchpriority === 'high');
  check('hero has a 768 phone source and a 1280/1920 desktop srcset',
    production.includes('<source media="(max-width: 700px)" srcset="' +
      data.PRODUCTION_ASSET_BASE + 'hero-768.jpg">') &&
      production.includes('srcset="' + data.PRODUCTION_ASSET_BASE + 'hero-1280.jpg 1280w, ' +
        data.PRODUCTION_ASSET_BASE + 'hero-1920.jpg 1920w"'));
  check('real photos have 768 phone sources',
    data.REAL_PHOTOS.every(photo => production.includes(
      '<source media="(max-width: 700px)" srcset="' + data.PRODUCTION_ASSET_BASE + photo.file + '">')));

  const referencedAssets = Array.from(new Set(
    Array.from(production.matchAll(
      /https:\/\/cdn\.jsdelivr\.net\/gh\/hossamalafandi\/behance-slideshow@main\/assets\/al-rashed\/([A-Za-z0-9._-]+)/g
    )).map(match => match[1])
  )).sort();
  check('production references exactly the 9 approved page assets',
    JSON.stringify(referencedAssets) ===
      JSON.stringify(EXPECTED_ASSETS.map(asset => asset.name).sort()),
    referencedAssets.join(', '));
  check('preview references exactly the 9 local page assets',
    EXPECTED_ASSETS.every(asset => preview.includes(data.PREVIEW_ASSET_BASE + asset.name)));

  check('page builds 17 dots and the 1 / 17 counter',
    /var count = slides.length/.test(production) &&
      production.includes('1 / ' + data.RENDERS.length) &&
      /render-dot/.test(production));
  check('page has next, previous, and fullscreen controls',
    /id="renderPrev"/.test(production) && /id="renderNext"/.test(production) &&
      /id="renderFullscreen"/.test(production));
  check('page supports keyboard navigation',
    /ArrowLeft/.test(production) && /ArrowRight/.test(production) &&
      /event\.key === 'Home'/.test(production) && /event\.key === 'End'/.test(production));
  check('page supports horizontal swipe with a vertical guard',
    /touchstart/.test(production) && /touchend/.test(production) &&
      /Math\.abs\(dx\) >= 40/.test(production));
  check('page attempts native fullscreen first',
    /requestFullscreen/.test(production) && /fullscreenerror/.test(production) &&
      /fullscreenchange/.test(production));
  check('page keeps the approved quiet theater fallback',
    /theater-mode/.test(production) && /theater-open/.test(production) &&
      !/fullscreen-note|Native fullscreen is unavailable|\balert\s*\(/.test(production));
  check('page has a phone-only fullscreen viewer',
    /id="phoneFullscreen"/.test(production) &&
      /id="phoneFsImage"/.test(production) &&
      /id="phoneFsClose"/.test(production) &&
      /id="phoneFsPrev"/.test(production) &&
      /id="phoneFsNext"/.test(production) &&
      /phone-fs-open/.test(production) &&
      /phoneIsLandscape/.test(production) &&
      /rotate\('/.test(production));
  check('phone fullscreen viewer uses the full-resolution render source',
    /function phoneSourceAt/.test(production) &&
      /image\.getAttribute\('src'\)/.test(production) &&
      /phoneFsImage\.src = full/.test(production));
  check('page uses no storage, cookies, or messaging',
    !/localStorage|sessionStorage|indexedDB|document\.cookie|postMessage|BroadcastChannel/i
      .test(production));
  check('page uses no top navigation or popups',
    !/window\.open|target="_blank"|top\.location|parent\.location/i.test(production));
  check('page respects reduced motion', /prefers-reduced-motion: reduce/.test(production));
  check('page has the phone breakpoint', /@media \(max-width: 700px\)/.test(production));
  check('page keeps the subtle copyright line',
    production.includes('<footer class="copyright">' + data.COPYRIGHT_TEXT + '</footer>'));
  check('page keeps the exact overview text',
    production.includes('Al-Rashed or (Zahret Al-Khuzama) project is a residential complex'));
  check('page uses a 16:9 render stage',
    /aspect-ratio:\s*16 \/ 9/.test(production) && /object-fit:\s*cover/.test(production));
  check('page uses a 1:2.05 desktop photo grid',
    /grid-template-columns:\s*1fr 2\.05fr/.test(production));
  check('page stacks the photos on phone',
    /\.photo-grid \{\s*grid-template-columns:\s*1fr;/.test(production));
  check('page uses 5 tool columns',
    /grid-template-columns:\s*repeat\(5, 1fr\)/.test(production));

  const snippet = data.embedSnippet();
  check('embed snippet is a 2980 px fluid iframe',
    snippet.includes('width="100%"') && snippet.includes('height="2980"') &&
      snippet.includes('allowfullscreen') && snippet.includes('allow="fullscreen"') &&
      !/\bsandbox\b/i.test(snippet));
  check('embed snippet targets the page route exactly once',
    snippet.includes('/exec?page=al-rashed') &&
      (snippet.match(/\?page=/g) || []).length === 1);
}

function assetChecks() {
  const rootFiles = fs.readdirSync(ASSET_DIR, { withFileTypes: true })
    .filter(entry => entry.isFile())
    .map(entry => entry.name)
    .sort();
  check('assets: exactly the 9 approved files are present',
    JSON.stringify(rootFiles) ===
      JSON.stringify(EXPECTED_ASSETS.map(asset => asset.name).sort()),
    rootFiles.join(', '));
  for (const asset of EXPECTED_ASSETS) {
    const file = path.join(ASSET_DIR, asset.name);
    if (!fs.existsSync(file)) {
      check('assets: ' + asset.name + ' exists', false);
      continue;
    }
    const buffer = fs.readFileSync(file);
    check('assets: ' + asset.name + ' is a JPEG',
      buffer.length > 4 && buffer[0] === 0xff && buffer[1] === 0xd8 &&
        buffer[buffer.length - 2] === 0xff && buffer[buffer.length - 1] === 0xd9);
    check('assets: ' + asset.name + ' is optimized',
      buffer.length <= asset.maxBytes, buffer.length + ' bytes');
  }
}

async function routerChecks(base) {
  const page = await fetchResponse(base, '/exec?page=al-rashed');
  const preview = read(PREVIEW_FILE);
  check('router: page returns HTTP 200 HTML',
    page.status === 200 && /text\/html/.test(page.type),
    page.status + ' ' + page.type);
  check('router: page returns the generated preview byte-for-byte',
    page.body === preview, page.body.length + ' vs ' + preview.length);
  check('router: page is served without cache', /no-store/.test(page.cache), page.cache);

  const upper = await fetchResponse(base, '/exec?page=AL-RASHED');
  check('router: page value is case-insensitive', upper.body === preview);
  const spaced = await fetchResponse(base, '/exec?page=%20al-rashed%20');
  check('router: page value is trimmed', spaced.body === preview);

  const rejected = [
    '/exec?page=',
    '/exec?page',
    '/exec?page=al-rashed-project',
    '/exec?page=P001-S01',
    '/exec?page=al-rashed&page=al-rashed',
    '/exec?page=al-rashed&page=nope',
    '/exec?page=al-rashed&slide=P001-S01',
    '/exec?page=al-rashed&tools=P001',
    '/exec?slide=P001-S01&page=al-rashed',
    '/exec?page=al-rashed%00',
    '/exec?page=al-rashed/'
  ];
  for (const route of rejected) {
    const result = await fetchResponse(base, route);
    check('router: rejects ' + route,
      result.status === 200 && result.body === NOT_FOUND_HTML &&
        !/AL-RASHED PROJECT|REAL PHOTOS|assets\/al-rashed/i.test(result.body),
      'neutral response');
  }

  const slide = await fetchResponse(base, '/exec?slide=P001-S01');
  check('router: the 48-slide route still works',
    slide.status === 200 && /id="slideshow"/.test(slide.body) &&
      (slide.body.match(/<div class="slide">/g) || []).length === 17 &&
      !/id="page"|REAL PHOTOS|TOOLS USED/.test(slide.body));

  for (const route of ['/', '/index.html', '/al-rashed.html', '/preview/al-rashed.html']) {
    const result = await fetchResponse(base, route);
    check('router: no route for ' + route,
      result.status === 404 && result.body === 'Not found', result.status);
  }

  for (const asset of EXPECTED_ASSETS) {
    const result = await fetchResponse(base, '/assets/al-rashed/' + asset.name);
    check('assets: route serves ' + asset.name,
      result.status === 200 && result.type === 'image/jpeg' &&
        /max-age=3600/.test(result.cache),
      result.status + ' ' + result.type);
  }

  const blockedAssets = [
    '/assets/al-rashed/raw/hero-original.jpg',
    '/assets/al-rashed/raw/',
    '/assets/al-rashed/',
    '/assets/al-rashed/nope.jpg',
    '/assets/al-rashed/..%2F..%2Fpackage.json',
    '/assets/al-rashed/%2e%2e%2f%2e%2e%2fpackage.json',
    '/assets/al-rashed/hero-768.jpg%00.png'
  ];
  for (const route of blockedAssets) {
    const result = await fetchResponse(base, route);
    check('assets: blocks ' + route,
      result.status === 404 && result.body === 'Not found', result.status);
  }
}

async function blockThirdParty(context) {
  await context.route('https://i.imgur.com/**', route => {
    blockedImgurRequests += 1;
    const url = route.request().url();
    const body = url.endsWith('.png') ? LOGO_SVG
      : /h\.jpeg$/.test(url) ? RENDER_THUMB_SVG : RENDER_SVG;
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

async function verifyAssetDimensions(browser, base) {
  const context = await browser.newContext({ viewport: { width: 800, height: 600 } });
  const page = await context.newPage();
  await page.setContent('<!DOCTYPE html><html><body></body></html>');
  const dimensions = await page.evaluate(async ({ assets, base }) => {
    const results = {};
    await Promise.all(assets.map(asset => new Promise(resolve => {
      const image = new Image();
      image.onload = () => {
        results[asset] = [image.naturalWidth, image.naturalHeight];
        resolve();
      };
      image.onerror = () => {
        results[asset] = null;
        resolve();
      };
      image.src = base + '/assets/al-rashed/' + asset;
    })));
    return results;
  }, { assets: EXPECTED_ASSETS.map(asset => asset.name), base });
  await context.close();

  for (const asset of EXPECTED_ASSETS) {
    check('assets: ' + asset.name + ' dimensions are ' + asset.width + 'x' + asset.height,
      JSON.stringify(dimensions[asset.name]) === JSON.stringify([asset.width, asset.height]),
      JSON.stringify(dimensions[asset.name]));
  }
}

function wrapperHtml(base, width) {
  return [
    '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>',
    'html,body{margin:0;padding:0;background:#fff}',
    'iframe{display:block;border:0}',
    '</style></head><body>',
    '<iframe id="embed" src="' + base + '/exec?page=al-rashed" width="' + width +
      '" height="' + BEHANCE_HEIGHT + '"',
    ' sandbox="allow-same-origin allow-scripts allow-pointer-lock allow-forms"',
    ' allowfullscreen allow="fullscreen"></iframe>',
    '</body></html>'
  ].join('');
}

async function findPageFrame(page) {
  for (let attempt = 0; attempt < 120; attempt++) {
    for (const frame of page.frames()) {
      try {
        const ready = await frame.evaluate(() =>
          Boolean(document.getElementById('rendersViewer')));
        if (ready) return frame;
      } catch (error) {
        // Frame is navigating.
      }
    }
    await wait(250);
  }
  return null;
}

async function measure(frame) {
  return frame.evaluate(() => {
    const rect = element => {
      if (!element) return null;
      const box = element.getBoundingClientRect();
      return {
        x: Math.round(box.x),
        y: Math.round(box.y),
        width: Math.round(box.width),
        height: Math.round(box.height),
        bottom: Math.round(box.bottom),
        right: Math.round(box.right)
      };
    };
    const style = element => getComputedStyle(element);
    const children = Array.from(document.querySelectorAll('main > *'));
    const boxes = children.map(element => ({
      tag: element.tagName,
      cls: element.className,
      ...rect(element)
    }));
    const gaps = boxes.slice(1).map((box, index) =>
      box.y - (boxes[index].y + boxes[index].height));
    const h2 = Array.from(document.querySelectorAll('.section h2')).map(element => ({
      text: element.textContent.trim(),
      size: parseFloat(style(element).fontSize),
      weight: style(element).fontWeight
    }));
    const photos = Array.from(document.querySelectorAll('.photo-grid > *'));
    const figures = Array.from(document.querySelectorAll('.photo-grid figure'));
    const photoImages = Array.from(document.querySelectorAll('.photo-grid img'));
    const toolImages = Array.from(document.querySelectorAll('.tools-row img'));
    const renderImages = Array.from(document.querySelectorAll('.render-slide img'));
    const stage = document.getElementById('rendersStage');
    const stageBox = stage.getBoundingClientRect();
    const heroTitle = document.querySelector('.hero h1');
    const heroSub = document.querySelector('.hero-sub');
    const copyright = document.querySelector('.copyright');
    const map = document.querySelector('.map-frame');
    const dots = Array.from(document.querySelectorAll('.render-dot'));
    const grid = document.querySelector('.photo-grid');
    return {
      inner: [innerWidth, innerHeight],
      scroll: [document.documentElement.scrollWidth, document.documentElement.scrollHeight],
      bodyScroll: [document.body.scrollWidth, document.body.scrollHeight],
      main: { ...rect(document.getElementById('page')), justify: style(document.getElementById('page')).justifyContent },
      children: boxes,
      gaps,
      hero: { ...rect(document.querySelector('.hero')), minHeight: style(document.querySelector('.hero')).minHeight },
      heroTitle: { ...rect(heroTitle), size: parseFloat(style(heroTitle).fontSize), weight: style(heroTitle).fontWeight },
      heroSub: { ...rect(heroSub), size: parseFloat(style(heroSub).fontSize), weight: style(heroSub).fontWeight },
      h2,
      stage: { ...rect(stage), ratio: stageBox.width / stageBox.height, objectFit: style(renderImages[0]).objectFit },
      renders: renderImages.map(image => ({ src: image.currentSrc || image.src, width: image.naturalWidth, height: image.naturalHeight })),
      dots: dots.length,
      counter: document.getElementById('renderCounter').textContent,
      currentDot: dots.findIndex(dot => dot.getAttribute('aria-current') === 'true'),
      photoGridColumns: style(grid).gridTemplateColumns,
      photoTracks: style(grid).gridTemplateColumns.trim().split(/\s+/).length,
      photoFigures: figures.map(figure => ({ ...rect(figure), radius: style(figure).borderRadius })),
      photoImages: photoImages.map(image => ({ ...rect(image), src: image.currentSrc || image.src })),
      photoColumns: photos.length,
      map: { ...rect(map), src: map.getAttribute('src') },
      tools: toolImages.map(image => ({ ...rect(image), src: image.currentSrc || image.src, filter: style(image).filter, natural: [image.naturalWidth, image.naturalHeight] })),
      toolsRow: rect(document.querySelector('.tools-row')),
      copyright: { ...rect(copyright), text: copyright.textContent.trim(), size: parseFloat(style(copyright).fontSize) },
      links: document.querySelectorAll('a').length,
      navs: document.querySelectorAll('nav').length,
      iframes: document.querySelectorAll('iframe').length,
      scripts: document.querySelectorAll('script').length,
      externalScripts: document.querySelectorAll('script[src]').length,
      cookie: document.cookie,
      localStorage: (() => { try { return localStorage.length; } catch (error) { return 'blocked'; } })(),
      sessionStorage: (() => { try { return sessionStorage.length; } catch (error) { return 'blocked'; } })(),
      scrollbarWidth: innerWidth - document.documentElement.clientWidth
    };
  });
}

async function runViewport(browser, base, label, width, expected) {
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
    await page.setContent(wrapperHtml(base, width), { waitUntil: 'domcontentloaded' });
    const frame = await findPageFrame(page);
    check(label + ': the sandboxed page frame loads', Boolean(frame));
    assert(frame, 'page frame did not load');

    await frame.waitForFunction(() =>
      document.querySelectorAll('.render-slide').length === 17 &&
      document.querySelectorAll('.render-dot').length === 17, null,
      { timeout: 30000, polling: 100 });
    await frame.evaluate(() => document.fonts.ready.then(() => true));
    await frame.waitForFunction(() => {
      const visible = Array.from(document.querySelectorAll(
        '.hero img, .photo-grid img, .tools-row img, .render-slide:first-child img'));
      return visible.length === 10 &&
        visible.every(image => image.complete && image.naturalWidth > 0);
    }, null, { timeout: 30000, polling: 100 });
    await wait(400);

    const state = await measure(frame);
    check(label + ': frame viewport is ' + width + 'x' + BEHANCE_HEIGHT,
      state.inner[0] === width && state.inner[1] === BEHANCE_HEIGHT,
      state.inner.join('x'));
    check(label + ': page fills exactly ' + BEHANCE_HEIGHT + ' px',
      state.scroll[1] === BEHANCE_HEIGHT && state.bodyScroll[1] === BEHANCE_HEIGHT &&
        state.main.height === BEHANCE_HEIGHT,
      JSON.stringify({ scroll: state.scroll, body: state.bodyScroll, main: state.main.height }));
    check(label + ': no horizontal overflow',
      state.scroll[0] === width && state.bodyScroll[0] === width &&
        state.scrollbarWidth === 0,
      JSON.stringify({ scroll: state.scroll[0], body: state.bodyScroll[0] }));
    check(label + ': main distributes the exact height',
      state.main.justify === 'space-between' &&
        state.children.length === 7 &&
        state.children[0].y === 0 &&
        state.children[state.children.length - 1].bottom === BEHANCE_HEIGHT,
      JSON.stringify({ justify: state.main.justify, children: state.children.length,
        first: state.children[0].y, last: state.children[state.children.length - 1].bottom }));
    check(label + ': gaps stay small and non-negative',
      state.gaps.every(gap => gap >= 0 && gap <= 30), state.gaps.join(', '));
    check(label + ': hero height is ' + expected.hero,
      Math.abs(state.hero.height - expected.hero) <= 1, state.hero.height);
    check(label + ': hero title is ' + expected.heroTitle + ' px',
      Math.abs(state.heroTitle.size - expected.heroTitle) <= 0.05, state.heroTitle.size);
    check(label + ': hero subtitle is ' + expected.heroSub + ' px',
      Math.abs(state.heroSub.size - expected.heroSub) <= 0.05, state.heroSub.size);
    check(label + ': section headings are ' + expected.h2 + ' px',
      state.h2.length === 5 && state.h2.every(heading =>
        Math.abs(heading.size - expected.h2) <= 0.05 && heading.weight === '900'),
      state.h2.map(heading => heading.size).join(', '));
    check(label + ': section heading text is exact',
      JSON.stringify(state.h2.map(heading => heading.text)) ===
        JSON.stringify(['OVERVIEW', 'RENDERS', 'REAL PHOTOS', 'LOCATION', 'TOOLS USED']),
      state.h2.map(heading => heading.text).join(', '));
    check(label + ': render stage is 16:9 and fits the content width',
      Math.abs(state.stage.ratio - 16 / 9) <= 0.01 &&
        Math.abs(state.stage.width - expected.stageWidth) <= 1 &&
        state.stage.objectFit === 'cover',
      JSON.stringify(state.stage));
    check(label + ': 17 renders, 17 dots, and the 1 / 17 counter',
      state.renders.length === 17 && state.dots === 17 &&
        state.counter === '1 / 17' && state.currentDot === 0,
      state.renders.length + ' / ' + state.dots + ' / ' + state.counter);
    check(label + ': render URLs match the expected source in order',
      state.renders.every((image, index) => image.src === expected.renderUrls[index]));
    check(label + ': the first render image decodes at ' +
      expected.renderWidth + 'x' + expected.renderHeight,
      state.renders[0] && state.renders[0].width === expected.renderWidth &&
        state.renders[0].height === expected.renderHeight,
      state.renders[0] ? state.renders[0].width + 'x' + state.renders[0].height : 'missing');

    check(label + ': photo grid uses ' + expected.photoColumns + ' layout column(s)',
      state.photoTracks === expected.photoColumns,
      state.photoTracks + ' (' + state.photoGridColumns + ')');
    check(label + ': all three real photos are visible with a 20px radius',
      state.photoFigures.length === 3 &&
        state.photoFigures.every(figure => figure.width > 0 && figure.height > 0 &&
          figure.radius === '20px'));
    if (expected.photoColumns === 2) {
      check(label + ': desktop photos use a 1:2.05 two-column grid',
        state.photoFigures[0].width > 0 &&
          Math.abs(state.photoFigures[2].width / state.photoFigures[0].width - 2.05) <= 0.03,
        state.photoFigures.map(figure => figure.width).join(', '));
      check(label + ': the third photo spans the tall right column',
        state.photoFigures[2].x > state.photoFigures[0].x &&
          state.photoFigures[2].height > state.photoFigures[0].height);
    } else {
      check(label + ': phone photos stack in one column',
        state.photoFigures.every((figure, index) =>
          index === 0 || (figure.x === state.photoFigures[0].x &&
            figure.y >= state.photoFigures[index - 1].bottom)));
      check(label + ': phone photos keep a 4:3 card',
        state.photoFigures.every(figure =>
          Math.abs(figure.width / figure.height - 4 / 3) <= 0.02),
        state.photoFigures.map(figure => (figure.width / figure.height).toFixed(3)).join(', '));
    }
    check(label + ': phone and desktop photo sources are correct',
      state.photoImages.every((image, index) => expected.photoColumns === 2
        ? image.src.endsWith(data.REAL_PHOTOS[index].desktop)
        : image.src.endsWith(data.REAL_PHOTOS[index].file)));

    check(label + ': map iframe keeps the exact embed URL and height',
      state.map.src === data.MAP_URL &&
        Math.abs(state.map.height - expected.mapHeight) <= 1,
      state.map.src + ' @ ' + state.map.height);
    const mapFrame = page.frames().find(candidate =>
      candidate.url().startsWith('https://maps-api-ssl.google.com/'));
    check(label + ': map document resolves inside the iframe', Boolean(mapFrame));
    if (mapFrame) {
      check(label + ': map stub renders', /MAP/.test(await mapFrame.evaluate(() =>
        document.body.textContent)));
    }

    check(label + ': 5 tool logos sit in one row',
      state.tools.length === 5 &&
        state.tools.every(tool => tool.natural[0] === 200 && tool.natural[1] === 200) &&
        Math.abs(state.tools[0].height - expected.toolHeight) <= 1 &&
        state.tools.every(tool => Math.abs(tool.y - state.tools[0].y) <= 1),
      state.tools.map(tool => tool.height).join(', '));
    check(label + ': tool logos are grayscale until hover',
      state.tools.every(tool => /grayscale\(1\)/.test(tool.filter)));
    check(label + ': tool row fits the content width',
      state.toolsRow.width <= expected.stageWidth + 2, state.toolsRow.width);

    check(label + ': copyright is exact and sits at the page bottom',
      state.copyright.text === data.COPYRIGHT_TEXT &&
        state.copyright.bottom === BEHANCE_HEIGHT &&
        Math.abs(state.copyright.size - expected.copyrightSize) <= 0.05,
      state.copyright.text + ' @ ' + state.copyright.bottom);
    check(label + ': no links, navigation, or extra embeds',
      state.links === 0 && state.navs === 0 && state.iframes === 1);
    check(label + ': only one inline script runs',
      state.scripts === 1 && state.externalScripts === 0);
    check(label + ': no cookies or storage are used',
      state.cookie === '' &&
        (state.localStorage === 0 || state.localStorage === 'blocked') &&
        (state.sessionStorage === 0 || state.sessionStorage === 'blocked'),
      JSON.stringify({ cookie: state.cookie, local: state.localStorage,
        session: state.sessionStorage }));
    check(label + ': no Google Sites or third-party page requests',
      requests.every(request =>
        request.startsWith(base) ||
        request.startsWith('https://i.imgur.com/') ||
        request.startsWith('https://maps-api-ssl.google.com/') ||
        request.startsWith('https://fonts.googleapis.com/') ||
        request.startsWith('https://fonts.gstatic.com/')));
    check(label + ': no page errors', pageErrors.length === 0, pageErrors.join(' | '));

    // ---------------------------------------------------------- navigation
    await frame.click('#renderNext');
    await frame.waitForFunction(() =>
      document.getElementById('renderCounter').textContent === '2 / 17', null,
      { timeout: 10000, polling: 100 });
    let nav = await frame.evaluate(() => ({
      counter: document.getElementById('renderCounter').textContent,
      current: Array.from(document.querySelectorAll('.render-dot'))
        .findIndex(dot => dot.getAttribute('aria-current') === 'true'),
      transform: document.getElementById('rendersTrack').style.transform,
      hidden: Array.from(document.querySelectorAll('.render-slide'))
        .map(slide => slide.getAttribute('aria-hidden'))
    }));
    check(label + ': next moves to render 2',
      nav.counter === '2 / 17' && nav.current === 1 &&
        Math.abs(translatePercent(nav.transform) + 100 / 17) < 0.001 &&
        nav.hidden[0] === 'true' && nav.hidden[1] === 'false',
      JSON.stringify(nav));

    await frame.click('#renderPrev');
    await frame.waitForFunction(() =>
      document.getElementById('renderCounter').textContent === '1 / 17', null,
      { timeout: 10000, polling: 100 });
    check(label + ': previous returns to render 1', true);

    await frame.click('.render-dot:nth-child(5)');
    await frame.waitForFunction(() =>
      document.getElementById('renderCounter').textContent === '5 / 17', null,
      { timeout: 10000, polling: 100 });
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
    await frame.press('#rendersViewer', 'ArrowRight');
    await frame.waitForFunction(() =>
      document.getElementById('renderCounter').textContent === '6 / 17', null,
      { timeout: 10000, polling: 100 });
    await frame.press('#rendersViewer', 'End');
    await frame.waitForFunction(() =>
      document.getElementById('renderCounter').textContent === '17 / 17', null,
      { timeout: 10000, polling: 100 });
    await frame.waitForFunction(expectedWidth => {
      const image = document.querySelectorAll('.render-slide img')[16];
      return image && image.complete && image.naturalWidth === expectedWidth;
    }, expected.renderWidth, { timeout: 15000, polling: 100 });
    const lastRender = await frame.evaluate(() => {
      const image = document.querySelectorAll('.render-slide img')[16];
      return { width: image.naturalWidth, height: image.naturalHeight,
        loading: image.loading, src: image.currentSrc || image.src };
    });
    check(label + ': End reveals the 17th render at ' +
      expected.renderWidth + 'x' + expected.renderHeight,
      lastRender.width === expected.renderWidth &&
        lastRender.height === expected.renderHeight &&
        lastRender.src === expected.renderUrls[16],
      JSON.stringify(lastRender));
    await frame.press('#rendersViewer', 'Home');
    await frame.waitForFunction(() =>
      document.getElementById('renderCounter').textContent === '1 / 17', null,
      { timeout: 10000, polling: 100 });
    await frame.press('#rendersViewer', 'ArrowLeft');
    await frame.waitForFunction(() =>
      document.getElementById('renderCounter').textContent === '17 / 17', null,
      { timeout: 10000, polling: 100 });
    check(label + ': keyboard arrows, Home, and End work with wrap-around', true);

    await frame.evaluate(() => {
      const stage = document.getElementById('rendersStage');
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
      document.getElementById('renderCounter').textContent === '1 / 17', null,
      { timeout: 10000, polling: 100 });
    await frame.evaluate(() => {
      const stage = document.getElementById('rendersStage');
      const fire = (type, x, y) => {
        const event = new Event(type, { bubbles: true, cancelable: true });
        Object.defineProperty(event, type === 'touchstart' ? 'touches' : 'changedTouches', {
          value: [{ clientX: x, clientY: y }]
        });
        stage.dispatchEvent(event);
      };
      fire('touchstart', 120, 120);
      fire('touchend', 260, 120);
    });
    await frame.waitForFunction(() =>
      document.getElementById('renderCounter').textContent === '17 / 17', null,
      { timeout: 10000, polling: 100 });
    check(label + ': left and right swipe navigate', true);

    await frame.click('#rendersStage');
    check(label + ': clicking the stage focuses the viewer',
      await frame.evaluate(() => document.activeElement.id) === 'rendersViewer');

    await frame.press('#rendersViewer', 'Home');
    await frame.waitForFunction(() =>
      document.getElementById('renderCounter').textContent === '1 / 17', null,
      { timeout: 10000, polling: 100 });

    // ---------------------------------------------------------- fullscreen
    if (width <= 700) {
      await frame.evaluate(() => {
        Object.defineProperty(screen, 'width', { configurable: true, get: () => 390 });
        Object.defineProperty(screen, 'height', { configurable: true, get: () => 844 });
        Object.defineProperty(screen, 'availWidth', { configurable: true, get: () => 390 });
        Object.defineProperty(screen, 'availHeight', { configurable: true, get: () => 844 });
      });
      await frame.click('#renderFullscreen');
      await wait(500);
      await frame.waitForFunction(() => {
        const image = document.getElementById('phoneFsImage');
        return image && image.complete && image.naturalWidth === 3840;
      }, null, { timeout: 15000, polling: 100 });
      const phoneFullscreen = await frame.evaluate(() => {
        const overlay = document.getElementById('phoneFullscreen');
        const frameBox = document.getElementById('phoneFsFrame').getBoundingClientRect();
        const image = document.getElementById('phoneFsImage');
        const stageBox = document.getElementById('rendersStage').getBoundingClientRect();
        const panel = overlay.getBoundingClientRect();
        return {
          open: overlay.classList.contains('is-open') && !overlay.hidden,
          theater: document.getElementById('rendersViewer').classList.contains('theater-mode'),
          bodyLocked: document.body.classList.contains('phone-fs-open'),
          label: document.getElementById('renderFullscreen').getAttribute('aria-label'),
          pressed: document.getElementById('renderFullscreen').getAttribute('aria-pressed'),
          transform: image.style.transform,
          src: image.getAttribute('src'),
          natural: [image.naturalWidth, image.naturalHeight],
          hintHidden: document.getElementById('phoneFsHint').hidden,
          overlay: { top: panel.top, height: panel.height },
          stageTop: stageBox.top,
          frame: { width: frameBox.width, height: frameBox.height },
          counter: document.getElementById('phoneFsCounter').textContent,
          mainCounter: document.getElementById('renderCounter').textContent
        };
      });
      check(label + ': phone fullscreen opens the in-page viewer',
        phoneFullscreen.open && !phoneFullscreen.theater &&
          phoneFullscreen.bodyLocked &&
          phoneFullscreen.label === 'Exit fullscreen' &&
          phoneFullscreen.pressed === 'true' &&
          phoneFullscreen.counter === '1 / 17' &&
          phoneFullscreen.mainCounter === '1 / 17',
        JSON.stringify(phoneFullscreen));
      check(label + ': phone fullscreen uses the full-resolution render',
        phoneFullscreen.src === data.renderUrl(data.RENDERS[0]) &&
          phoneFullscreen.natural[0] === 3840 &&
          phoneFullscreen.natural[1] === 2160,
        JSON.stringify({ src: phoneFullscreen.src, natural: phoneFullscreen.natural }));
      check(label + ': phone fullscreen rotates the render and shows the hint',
        /rotate\(90deg\)/.test(phoneFullscreen.transform) &&
          !phoneFullscreen.hintHidden &&
          phoneFullscreen.frame.height > phoneFullscreen.frame.width &&
          Math.abs(phoneFullscreen.frame.width / phoneFullscreen.frame.height - 9 / 16) <= 0.02,
        JSON.stringify(phoneFullscreen.frame));
      check(label + ': phone fullscreen is anchored to the stage and fills the screen',
        Math.abs(phoneFullscreen.overlay.height - 844) <= 1 &&
          phoneFullscreen.overlay.top >= 0 &&
          phoneFullscreen.overlay.top <= phoneFullscreen.stageTop &&
          phoneFullscreen.stageTop - phoneFullscreen.overlay.top <= 200,
        JSON.stringify(phoneFullscreen.overlay));

      await frame.click('#phoneFsNext');
      await frame.waitForFunction(() =>
        document.getElementById('phoneFsCounter').textContent === '2 / 17' &&
        document.getElementById('renderCounter').textContent === '2 / 17', null,
        { timeout: 10000, polling: 100 });
      await frame.waitForFunction(() => {
        const image = document.getElementById('phoneFsImage');
        return image && image.complete && image.naturalWidth === 3840;
      }, null, { timeout: 15000, polling: 100 });
      const phoneNav = await frame.evaluate(() => ({
        src: document.getElementById('phoneFsImage').getAttribute('src'),
        counter: document.getElementById('phoneFsCounter').textContent,
        main: document.getElementById('renderCounter').textContent
      }));
      check(label + ': phone fullscreen navigation stays in sync',
        phoneNav.src === data.renderUrl(data.RENDERS[1]) &&
          phoneNav.counter === '2 / 17' && phoneNav.main === '2 / 17',
        JSON.stringify(phoneNav));

      const landscapeStub = await frame.evaluate(() => {
        try {
          Object.defineProperty(screen, 'width', { configurable: true, get: () => 844 });
          Object.defineProperty(screen, 'height', { configurable: true, get: () => 390 });
          Object.defineProperty(screen, 'availWidth', { configurable: true, get: () => 844 });
          Object.defineProperty(screen, 'availHeight', { configurable: true, get: () => 390 });
          Object.defineProperty(screen.orientation, 'type',
            { configurable: true, get: () => 'landscape-primary' });
          return true;
        } catch (error) {
          return error.message;
        }
      });
      assert(landscapeStub === true, 'could not simulate phone landscape');
      await page.evaluate(() => {
        const iframe = document.getElementById('embed');
        iframe.width = '844';
        iframe.style.width = '844px';
        window.dispatchEvent(new Event('resize'));
      });
      await frame.evaluate(() => {
        window.dispatchEvent(new Event('orientationchange'));
        if (screen.orientation && screen.orientation.dispatchEvent) {
          screen.orientation.dispatchEvent(new Event('change'));
        }
      });
      await wait(300);
      const landscapeState = await frame.evaluate(() => {
        const overlay = document.getElementById('phoneFullscreen');
        const image = document.getElementById('phoneFsImage');
        const frameBox = document.getElementById('phoneFsFrame').getBoundingClientRect();
        return {
          landscape: overlay.classList.contains('is-landscape'),
          transform: image.style.transform,
          hintHidden: document.getElementById('phoneFsHint').hidden,
          height: overlay.getBoundingClientRect().height,
          frame: { width: frameBox.width, height: frameBox.height }
        };
      });
      check(label + ': phone fullscreen switches to upright landscape',
        landscapeState.landscape &&
          /rotate\(0deg\)/.test(landscapeState.transform) &&
          landscapeState.hintHidden &&
          Math.abs(landscapeState.height - 390) <= 1 &&
          Math.abs(landscapeState.frame.width / landscapeState.frame.height - 16 / 9) <= 0.02,
        JSON.stringify(landscapeState));

      await frame.click('#phoneFsClose');
      await wait(300);
      const phoneClosed = await frame.evaluate(() => ({
        hidden: document.getElementById('phoneFullscreen').hidden,
        open: document.getElementById('phoneFullscreen').classList.contains('is-open'),
        body: document.body.classList.contains('phone-fs-open'),
        label: document.getElementById('renderFullscreen').getAttribute('aria-label'),
        counter: document.getElementById('renderCounter').textContent,
        scrollHeight: document.documentElement.scrollHeight
      }));
      check(label + ': phone fullscreen closes without changing the page height',
        phoneClosed.hidden && !phoneClosed.open && !phoneClosed.body &&
          phoneClosed.label === 'Enter fullscreen' &&
          phoneClosed.counter === '2 / 17' &&
          phoneClosed.scrollHeight === BEHANCE_HEIGHT,
        JSON.stringify(phoneClosed));

      await frame.click('#renderFullscreen');
      await wait(300);
      await frame.evaluate(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      });
      await wait(300);
      check(label + ': Escape closes the phone fullscreen viewer',
        await frame.evaluate(() =>
          document.getElementById('phoneFullscreen').hidden &&
          !document.body.classList.contains('phone-fs-open')));
    } else {
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
          pressed: document.getElementById('renderFullscreen').getAttribute('aria-pressed'),
          width: box.width,
          height: box.height
        };
      });
      check(label + ': fullscreen activates natively or with the quiet fallback',
        (fullscreen.native && fullscreen.target === 'rendersViewer') || fullscreen.theater,
        JSON.stringify(fullscreen));
      check(label + ': fullscreen updates its accessible state',
        fullscreen.label === 'Exit fullscreen' && fullscreen.pressed === 'true');
      if (fullscreen.theater) {
        check(label + ': theater fallback fills the frame and locks the body',
          Math.abs(fullscreen.width - width) <= 1 &&
            Math.abs(fullscreen.height - BEHANCE_HEIGHT) <= 1 && fullscreen.bodyLocked,
          JSON.stringify(fullscreen));
      }
      await frame.click('#renderFullscreen');
      await wait(700);
      let exited = await frame.evaluate(() => ({
        native: Boolean(document.fullscreenElement),
        theater: document.getElementById('rendersViewer').classList.contains('theater-mode'),
        label: document.getElementById('renderFullscreen').getAttribute('aria-label')
      }));
      check(label + ': fullscreen exits cleanly',
        !exited.native && !exited.theater && exited.label === 'Enter fullscreen',
        JSON.stringify(exited));

      await frame.evaluate(() => {
        const viewer = document.getElementById('rendersViewer');
        viewer.requestFullscreen = () => Promise.reject(new Error('blocked by test'));
        viewer.webkitRequestFullscreen = undefined;
        viewer.msRequestFullscreen = undefined;
      });
      await frame.click('#renderFullscreen');
      await wait(500);
      exited = await frame.evaluate(() => {
        const viewer = document.getElementById('rendersViewer');
        const box = viewer.getBoundingClientRect();
        return {
          theater: viewer.classList.contains('theater-mode'),
          bodyLocked: document.body.classList.contains('theater-open'),
          label: document.getElementById('renderFullscreen').getAttribute('aria-label'),
          width: box.width,
          height: box.height
        };
      });
      check(label + ': denied native fullscreen falls back quietly',
        exited.theater && exited.bodyLocked &&
          exited.label === 'Exit fullscreen' &&
          Math.abs(exited.width - width) <= 1 &&
          Math.abs(exited.height - BEHANCE_HEIGHT) <= 1,
        JSON.stringify(exited));
      await frame.evaluate(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      });
      await wait(300);
      check(label + ': Escape exits the fallback',
        await frame.evaluate(() => !document.getElementById('rendersViewer')
          .classList.contains('theater-mode') &&
          !document.body.classList.contains('theater-open')));
    }

    check(label + ': still no page errors after interaction',
      pageErrors.length === 0, pageErrors.join(' | '));
  } finally {
    await context.close();
  }
}

async function main() {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  staticChecks();
  assetChecks();

  const server = createPilotServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;

  let browser;
  try {
    await routerChecks(base);
    browser = await chromium.launch({ channel: 'chrome', headless: true });
    await verifyAssetDimensions(browser, base);

    await runViewport(browser, base, 'desktop 987x2980', BEHANCE_WIDTH, {
      hero: 430,
      heroTitle: 74.025,
      heroSub: 22.67,
      h2: 64,
      stageWidth: 867,
      mapHeight: 335.58,
      photoColumns: 2,
      photoWidth: 1280,
      toolHeight: 60,
      copyrightSize: 10.67,
      renderUrls: data.RENDERS.map(id => data.renderUrl(id)),
      renderWidth: 3840,
      renderHeight: 2160
    });
    await runViewport(browser, base, 'phone 390x2980', PHONE_WIDTH, {
      hero: 435,
      heroTitle: 61.33,
      heroSub: 22.67,
      h2: 44,
      stageWidth: 342,
      mapHeight: 260,
      photoColumns: 1,
      photoWidth: 768,
      toolHeight: 48,
      copyrightSize: 11,
      renderUrls: data.RENDERS.map(id => data.renderThumbUrl(id)),
      renderWidth: 1024,
      renderHeight: 576
    });
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }

  const failed = checks.filter(item => !item.passed);
  const report = {
    scope: {
      page: '?page=al-rashed',
      behanceFrames: [BEHANCE_WIDTH + 'x' + BEHANCE_HEIGHT, PHONE_WIDTH + 'x' + BEHANCE_HEIGHT],
      renders: data.RENDERS.length,
      tools: data.TOOLS.length,
      assets: EXPECTED_ASSETS.length
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
