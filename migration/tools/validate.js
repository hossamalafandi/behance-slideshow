#!/usr/bin/env node
'use strict';

/**
 * Phase 2 static validation — pilot-safe.
 *
 * Verifies the frozen audit data, the generated P001-S01 artifacts, the
 * generated Behance snippet, and the static independent-embed rules. No
 * network requests and no image downloads are performed.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const CONFIG_PATH = path.join(ROOT, '01_AUDIT', 'slides.config.json');
const IMAGES_CSV = path.join(ROOT, '01_AUDIT', 'images.csv');
const PREVIEW_DIR = path.join(ROOT, '03_REBUILT_SLIDESHOWS', 'preview');
const DATA_DIR = path.join(ROOT, '03_REBUILT_SLIDESHOWS', 'data');
const APPS_DIR = path.join(ROOT, '04_APPS_SCRIPT');
const BEHANCE_DIR = path.join(ROOT, '05_BEHANCE_OUTPUT');

const PILOT_ID = 'P001-S01';
const PILOT_PROJECT = 'P001';
const REPAIR_ID = 'P011-S01';
const REPAIR_PROJECT = 'P011';
const APPROVED_IDS = [PILOT_ID, REPAIR_ID];
const APPROVED_PROJECTS = [PILOT_PROJECT, REPAIR_PROJECT];
const EXPECTED_GLOBAL_HASH = '882a952d07cc442466cb2d7a3e3369ecb44a9a9e20fd299ca5f6f9e52ae001d0';
const EXPECTED_SLIDESHOWS = 47;
const EXPECTED_IMAGE_SLOTS = 335;
const EXPECTED_UNIQUE_URLS = 331;
const EXPECTED_PILOT_IMAGES = 17;
const EXPECTED_PILOT_HEIGHT = 805;
const EXPECTED_REPAIR_IMAGES = 20;
const EXPECTED_REPAIR_HEIGHT = 1553;

const failures = [];
const checks = [];

function check(name, condition, detail) {
  const passed = Boolean(condition);
  checks.push({ name, passed, detail: detail || null });
  if (!passed) failures.push(name + (detail ? ': ' + detail : ''));
}

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function parseCsvLine(line) {
  const fields = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const character = line[i];
    if (character === '"') {
      if (quoted && line[i + 1] === '"') {
        field += '"';
        i++;
      } else {
        quoted = !quoted;
      }
    } else if (character === ',' && !quoted) {
      fields.push(field);
      field = '';
    } else {
      field += character;
    }
  }
  fields.push(field);
  return fields;
}

function readCsv(file) {
  const lines = read(file).trim().split(/\r?\n/);
  const header = parseCsvLine(lines[0]);
  const rows = lines.slice(1).map((line, index) => {
    const fields = parseCsvLine(line);
    if (fields.length !== header.length) {
      throw new Error('Bad CSV row ' + (index + 2) + ': expected ' + header.length + ' fields');
    }
    const row = {};
    header.forEach((name, i) => { row[name] = fields[i]; });
    return row;
  });
  return { header, rows };
}

function sha256(values) {
  return crypto.createHash('sha256').update(values.join('\n')).digest('hex');
}

function extractSlides(mapSource) {
  const match = /var SLIDES = ([\s\S]*?);\s*$/.exec(mapSource);
  if (!match) throw new Error('SlidesData.gs has no `var SLIDES = ...;` block');
  return JSON.parse(match[1]);
}

function listFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? listFiles(full) : [full];
  });
}

function main() {
  // ---------------------------------------------------------------- frozen data
  const config = JSON.parse(read(CONFIG_PATH));
  const csv = readCsv(IMAGES_CSV);
  const urls = csv.rows.map(row => row.original_url);
  const uniqueUrls = new Set(urls);
  const globalHash = sha256(urls);

  check('slides.config.json has 47 slideshows',
    Array.isArray(config.slideshows) && config.slideshows.length === EXPECTED_SLIDESHOWS,
    'found ' + (config.slideshows ? config.slideshows.length : 'none'));
  check('images.csv has 335 image slots',
    csv.rows.length === EXPECTED_IMAGE_SLOTS, 'found ' + csv.rows.length);
  check('images.csv has 331 unique URLs',
    uniqueUrls.size === EXPECTED_UNIQUE_URLS, 'found ' + uniqueUrls.size);
  check('frozen ordered URL hash is unchanged',
    globalHash === EXPECTED_GLOBAL_HASH, globalHash);

  const configRows = config.slideshows.filter(slide => slide.slideshow_id === PILOT_ID);
  check('P001-S01 exists exactly once in config', configRows.length === 1,
    'found ' + configRows.length);
  const source = configRows[0];

  const csvRows = csv.rows
    .filter(row => row.slideshow_id === PILOT_ID)
    .sort((a, b) => Number(a.order) - Number(b.order));
  const expectedUrls = csvRows.map(row => row.original_url);

  check('P001-S01 has 17 audited image slots',
    csvRows.length === EXPECTED_PILOT_IMAGES, 'found ' + csvRows.length);
  check('P001-S01 CSV order is contiguous',
    csvRows.every((row, index) => Number(row.order) === index + 1));
  check('P001-S01 CSV URLs are remote https',
    expectedUrls.every(url => /^https:\/\//.test(url)));

  // ------------------------------------------------------------------ data file
  const dataFile = path.join(DATA_DIR, PILOT_ID + '.json');
  check('P001-S01 data file exists', fs.existsSync(dataFile));
  const data = JSON.parse(read(dataFile));

  check('data file contains only P001-S01 data', data.slideshow_id === PILOT_ID);
  check('data file has 17 images', data.images.length === EXPECTED_PILOT_IMAGES,
    'found ' + data.images.length);
  check('data image order is contiguous',
    data.images.every((image, index) => image.order === index + 1));
  check('data URLs match images.csv exactly in order',
    data.images.length === expectedUrls.length &&
      data.images.every((image, index) => image.src === expectedUrls[index]));
  check('data URLs are used verbatim (no local, data, or proxy paths)',
    data.images.every(image => /^https:\/\/i\.imgur\.com\//.test(image.src) ===
      /^https:\/\/i\.imgur\.com\//.test(expectedUrls[image.order - 1])));
  check('data embed height is 805 px', data.embed_height === EXPECTED_PILOT_HEIGHT,
    'found ' + data.embed_height);
  check('data derives height from the audited aspect ratio',
    data.embed_height === Math.round(source.frame_w / source.aspect));
  check('data requires fullscreen', data.fullscreen_required === true);

  // ------------------------------------------------- P011-S01 approved repair
  const repairConfigRows = config.slideshows.filter(slide => slide.slideshow_id === REPAIR_ID);
  check('P011-S01 exists exactly once in config', repairConfigRows.length === 1,
    'found ' + repairConfigRows.length);
  const repairSource = repairConfigRows[0];

  const repairCsvRows = csv.rows
    .filter(row => row.slideshow_id === REPAIR_ID)
    .sort((a, b) => Number(a.order) - Number(b.order));
  const repairUrls = repairCsvRows.map(row => row.original_url);

  check('P011-S01 has 20 audited image slots',
    repairCsvRows.length === EXPECTED_REPAIR_IMAGES, 'found ' + repairCsvRows.length);
  check('P011-S01 CSV order is contiguous',
    repairCsvRows.every((row, index) => Number(row.order) === index + 1));
  check('P011-S01 CSV URLs are remote https',
    repairUrls.every(url => /^https:\/\//.test(url)));

  const repairDataFile = path.join(DATA_DIR, REPAIR_ID + '.json');
  check('P011-S01 data file exists', fs.existsSync(repairDataFile));
  const repairData = JSON.parse(read(repairDataFile));

  check('P011-S01 data file contains only P011-S01 data',
    repairData.slideshow_id === REPAIR_ID);
  check('P011-S01 data file has 20 images',
    repairData.images.length === EXPECTED_REPAIR_IMAGES, 'found ' + repairData.images.length);
  check('P011-S01 data image order is contiguous',
    repairData.images.every((image, index) => image.order === index + 1));
  check('P011-S01 data URLs match images.csv exactly in order',
    repairData.images.length === repairUrls.length &&
      repairData.images.every((image, index) => image.src === repairUrls[index]));
  check('P011-S01 data embed height is 1553 px',
    repairData.embed_height === EXPECTED_REPAIR_HEIGHT, 'found ' + repairData.embed_height);
  check('P011-S01 data records the approved repair',
    Boolean(repairData.repair_note) && /no JavaScript/i.test(repairData.repair_note));
  check('P011-S01 data requires fullscreen', repairData.fullscreen_required === true);

  // -------------------------------------------------------------------- preview
  const previewFile = path.join(PREVIEW_DIR, PILOT_ID + '.html');
  check('P001-S01 preview exists', fs.existsSync(previewFile));
  const preview = read(previewFile);
  const previewImages = Array.from(preview.matchAll(/<img\s+src="([^"]+)"[^>]*>/g))
    .map(match => match[1]);

  check('preview has exactly 17 images', previewImages.length === EXPECTED_PILOT_IMAGES,
    'found ' + previewImages.length);
  check('preview image URLs match images.csv exactly in order',
    previewImages.length === expectedUrls.length &&
      previewImages.every((url, index) => url === expectedUrls[index]));
  check('preview matches the archived eager loading on every image',
    (preview.match(/loading="eager"/g) || []).length === EXPECTED_PILOT_IMAGES &&
      !/loading="lazy"/.test(preview));
  check('preview has no unreplaced Apps Script directives', !/<\?/.test(preview));
  check('preview has no data: or file: URLs', !/["'](?:data:|file:)/i.test(preview));
  check('preview has no other slideshow IDs',
    Array.from(new Set(preview.match(/P\d{3}-S\d{2}/g) || [])).every(id => id === PILOT_ID));
  check('preview has no URL from another slideshow',
    previewImages.every(url => expectedUrls.includes(url)));

  check('preview has exactly one fullscreen button',
    (preview.match(/id="fullscreenBtn"/g) || []).length === 1);
  check('preview has exactly one slideshow container',
    (preview.match(/class="slideshow-container"/g) || []).length === 1 &&
      (preview.match(/id="slideshow"/g) || []).length === 1);
  check('preview has exactly one dot container',
    (preview.match(/class="dot-container"/g) || []).length === 1);
  check('dots are inside the fullscreen container',
    /id="dotContainer"[^>]*><\/div>\s*<\/div>\s*<script>/.test(
      preview.replace(/\s+/g, ' ').replace(/<!--[\s\S]*?-->/g, '')) ||
    (preview.indexOf('id="dotContainer"') < preview.indexOf('</div>\n\n<script>') &&
      preview.indexOf('id="dotContainer"') > preview.indexOf('class="slideshow-container"')));
  check('preview has no nested iframe or embed of another slideshow',
    !/<iframe|<embed|<object/i.test(preview));

  check('preview uses native fullscreen first', /requestFullscreen/.test(preview));
  check('preview handles fullscreenerror', /fullscreenerror/.test(preview));
  check('preview handles fullscreenchange', /fullscreenchange/.test(preview));
  check('preview has theater-mode fallback', /theater-mode/.test(preview));
  check('preview has a non-blocking fallback note', /fullscreen-note/.test(preview));
  check('preview does not call alert()', !/\balert\s*\(/.test(preview));

  check('preview does not use localStorage', !/localStorage/.test(preview));
  check('preview does not use sessionStorage', !/sessionStorage/.test(preview));
  check('preview does not use IndexedDB', !/indexedDB/i.test(preview));
  check('preview does not use document.cookie', !/document\.cookie/.test(preview));
  check('preview does not use postMessage', !/postMessage/.test(preview));
  check('preview does not use BroadcastChannel', !/BroadcastChannel/.test(preview));

  // ------------------------------------------------- P011-S01 repair preview
  const repairPreviewFile = path.join(PREVIEW_DIR, REPAIR_ID + '.html');
  check('P011-S01 preview exists', fs.existsSync(repairPreviewFile));
  const repairPreview = read(repairPreviewFile);
  const repairPreviewImages = Array.from(repairPreview.matchAll(/<img\s+src="([^"]+)"[^>]*>/g))
    .map(match => match[1]);

  check('P011-S01 preview has exactly 20 images',
    repairPreviewImages.length === EXPECTED_REPAIR_IMAGES, 'found ' + repairPreviewImages.length);
  check('P011-S01 preview image URLs match images.csv exactly in order',
    repairPreviewImages.length === repairUrls.length &&
      repairPreviewImages.every((url, index) => url === repairUrls[index]));
  check('P011-S01 preview keeps eager loading on every image',
    (repairPreview.match(/loading="eager"/g) || []).length === EXPECTED_REPAIR_IMAGES &&
      !/loading="lazy"/.test(repairPreview));
  check('P011-S01 preview has no unreplaced Apps Script directives', !/<\?/.test(repairPreview));
  check('P011-S01 preview has no data: or file: URLs', !/["'](?:data:|file:)/i.test(repairPreview));
  check('P011-S01 preview has no other slideshow IDs',
    Array.from(new Set(repairPreview.match(/P\d{3}-S\d{2}/g) || [])).every(id => id === REPAIR_ID));
  check('P011-S01 preview has no URL from another slideshow',
    repairPreviewImages.every(url => repairUrls.includes(url)));

  check('P011-S01 preview restores the standard JavaScript',
    /<script>/.test(repairPreview) && /moveSlide/.test(repairPreview));
  const repairSourceFile = path.join(ROOT, repairSource.source_file);
  check('P011-S01 original source is archived', fs.existsSync(repairSourceFile));
  if (fs.existsSync(repairSourceFile)) {
    check('P011-S01 original source had no JavaScript',
      !/<script\b/i.test(read(repairSourceFile)));
  }

  check('P011-S01 preview has exactly one fullscreen button',
    (repairPreview.match(/id="fullscreenBtn"/g) || []).length === 1);
  check('P011-S01 preview has exactly one slideshow container',
    (repairPreview.match(/class="slideshow-container"/g) || []).length === 1 &&
      (repairPreview.match(/id="slideshow"/g) || []).length === 1);
  check('P011-S01 preview has exactly one dot container',
    (repairPreview.match(/class="dot-container"/g) || []).length === 1);
  check('P011-S01 dots are inside the fullscreen container',
    /id="dotContainer"[^>]*><\/div>\s*<\/div>\s*<script>/.test(
      repairPreview.replace(/\s+/g, ' ').replace(/<!--[\s\S]*?-->/g, '')) ||
    (repairPreview.indexOf('id="dotContainer"') < repairPreview.indexOf('</div>\n\n<script>') &&
      repairPreview.indexOf('id="dotContainer"') > repairPreview.indexOf('class="slideshow-container"')));
  check('P011-S01 preview has no nested iframe or embed of another slideshow',
    !/<iframe|<embed|<object/i.test(repairPreview));

  check('P011-S01 preview uses native fullscreen first', /requestFullscreen/.test(repairPreview));
  check('P011-S01 preview handles fullscreenerror', /fullscreenerror/.test(repairPreview));
  check('P011-S01 preview handles fullscreenchange', /fullscreenchange/.test(repairPreview));
  check('P011-S01 preview has theater-mode fallback', /theater-mode/.test(repairPreview));
  check('P011-S01 preview has a non-blocking fallback note', /fullscreen-note/.test(repairPreview));
  check('P011-S01 preview does not call alert()', !/\balert\s*\(/.test(repairPreview));
  check('P011-S01 preview does not use navigation storage or messaging',
    !/localStorage|sessionStorage|indexedDB|document\.cookie|postMessage|BroadcastChannel/i.test(repairPreview));

  // ---------------------------------------------------------------- SlidesData
  const dataSource = read(path.join(APPS_DIR, 'SlidesData.gs'));
  const slideMap = extractSlides(dataSource);
  const mapKeys = Object.keys(slideMap);
  check('SlidesData.gs contains exactly the approved slideshows',
    mapKeys.length === APPROVED_IDS.length &&
      APPROVED_IDS.every(id => mapKeys.includes(id)), mapKeys.join(', '));
  check('SlidesData.gs P001-S01 has 17 images',
    Boolean(slideMap[PILOT_ID]) && slideMap[PILOT_ID].images.length === EXPECTED_PILOT_IMAGES);
  check('SlidesData.gs P001-S01 URLs match images.csv exactly',
    Boolean(slideMap[PILOT_ID]) &&
      slideMap[PILOT_ID].images.every((image, index) => image.src === expectedUrls[index]));
  check('SlidesData.gs P011-S01 has 20 images',
    Boolean(slideMap[REPAIR_ID]) && slideMap[REPAIR_ID].images.length === EXPECTED_REPAIR_IMAGES);
  check('SlidesData.gs P011-S01 URLs match images.csv exactly',
    Boolean(slideMap[REPAIR_ID]) &&
      slideMap[REPAIR_ID].images.every((image, index) => image.src === repairUrls[index]));
  const approvedUrls = new Set([...expectedUrls, ...repairUrls]);
  check('SlidesData.gs contains no other audited image URLs',
    (dataSource.match(/https:\/\/i\.imgur\.com\/[^"']+/g) || [])
      .every(url => approvedUrls.has(url)));

  // -------------------------------------------------------------------- snippet
  const snippetFile = path.join(BEHANCE_DIR, PILOT_PROJECT + '.md');
  check('P001.md snippet file exists', fs.existsSync(snippetFile));
  const snippet = read(snippetFile);
  check('snippet has exactly one iframe', (snippet.match(/<iframe/g) || []).length === 1);
  check('snippet has exactly one slide identifier',
    (snippet.match(/\?slide=/g) || []).length === 1 &&
      /[?&]slide=P001-S01(?:["&]|$)/.test(snippet));
  check('snippet contains no other slideshow ID',
    (snippet.match(/P\d{3}-S\d{2}/g) || []).every(id => id === PILOT_ID));
  check('snippet height is 805', /\bheight="805"/.test(snippet));
  check('snippet width is 100%', /\bwidth="100%"/.test(snippet));
  check('snippet grants fullscreen (legacy attribute)', /\ballowfullscreen\b/.test(snippet));
  check('snippet grants fullscreen (Permissions Policy)', /allow="fullscreen"/.test(snippet));
  check('snippet has no sandbox attribute', !/\bsandbox\b/i.test(snippet));
  check('snippet has no gallery, list, or extra viewer markup',
    !/<a\s|<button|<script|grid|gallery/i.test(snippet));

  // ------------------------------------------------- P011-S01 repair snippet
  const repairSnippetFile = path.join(BEHANCE_DIR, REPAIR_PROJECT + '.md');
  check('P011.md snippet file exists', fs.existsSync(repairSnippetFile));
  const repairSnippet = read(repairSnippetFile);
  check('P011 snippet has exactly one iframe',
    (repairSnippet.match(/<iframe/g) || []).length === 1);
  check('P011 snippet has exactly one slide identifier',
    (repairSnippet.match(/\?slide=/g) || []).length === 1 &&
      /[?&]slide=P011-S01(?:["&]|$)/.test(repairSnippet));
  check('P011 snippet contains no other slideshow ID',
    (repairSnippet.match(/P\d{3}-S\d{2}/g) || []).every(id => id === REPAIR_ID));
  check('P011 snippet height is 1553', /\bheight="1553"/.test(repairSnippet));
  check('P011 snippet width is 100%', /\bwidth="100%"/.test(repairSnippet));
  check('P011 snippet grants fullscreen (legacy attribute)',
    /\ballowfullscreen\b/.test(repairSnippet));
  check('P011 snippet grants fullscreen (Permissions Policy)',
    /allow="fullscreen"/.test(repairSnippet));
  check('P011 snippet has no sandbox attribute', !/\bsandbox\b/i.test(repairSnippet));
  check('P011 snippet records the repair',
    /\*\*Repair:\*\*/.test(repairSnippet) && /no JavaScript/i.test(repairSnippet));
  check('P011 snippet has no gallery, list, or extra viewer markup',
    !/<a\s|<button|<script|grid|gallery/i.test(repairSnippet));

  // ---------------------------------------------------------- router (static)
  const router = read(path.join(APPS_DIR, 'Code.gs'));
  check('router counts raw slide parameters', /function countSlideParameters_/.test(router) &&
    /countSlideParameters_\(e && e\.queryString\) !== 1/.test(router));
  check('router requires a string parameter', /typeof raw !== 'string'/.test(router));
  check('router normalizes with trim and uppercase', /raw\.trim\(\)\.toUpperCase\(\)/.test(router));
  check('router uses an own-property lookup',
    /hasOwnProperty\.call\(SLIDES, id\)/.test(router));
  check('router returns the neutral error page for unknown IDs',
    /if \(!slide\) \{\s*return notFoundResponse_\(\);/.test(router));
  check('router does not serialize the SLIDES catalog', !/JSON\.stringify\(SLIDES/.test(router) &&
    !/Object\.keys\(SLIDES\)/.test(router));
  check('router uses no mutable Apps Script services',
    !/CacheService|PropertiesService|UserProperties|LockService|SpreadsheetApp/.test(router));
  const errorBody = /function notFoundResponse_\(\) \{([\s\S]*?)\n\}/.exec(router);
  check('error page contains no links or catalog',
    Boolean(errorBody) && !/<a\s|https?:\/\/|P\d{3}-S\d{2}/i.test(errorBody[1]));
  check('router has only one HTML response path per request', !/createHtmlOutput\([\s\S]*SLIDES/.test(router));

  // -------------------------------------------------------------------- hygiene
  const previewFiles = listFiles(PREVIEW_DIR).map(file => path.relative(ROOT, file))
    .filter(file => !file.endsWith('.gitkeep'));
  const dataFiles = listFiles(DATA_DIR).map(file => path.relative(ROOT, file))
    .filter(file => !file.endsWith('.gitkeep'));
  const behanceFiles = listFiles(BEHANCE_DIR).map(file => path.relative(ROOT, file))
    .filter(file => !file.endsWith('.gitkeep'));
  const previewNames = previewFiles.map(file => path.basename(file)).sort();
  const dataNames = dataFiles.map(file => path.basename(file)).sort();
  const behanceNames = behanceFiles.map(file => path.basename(file)).sort();
  check('preview output contains only the approved slideshows',
    previewNames.length === APPROVED_IDS.length &&
      previewNames.every((name, index) => name === APPROVED_IDS.slice().sort()[index] + '.html'),
    previewNames.join(', '));
  check('data output contains only the approved slideshows',
    dataNames.length === APPROVED_IDS.length &&
      dataNames.every((name, index) => name === APPROVED_IDS.slice().sort()[index] + '.json'),
    dataNames.join(', '));
  check('Behance output contains only the approved projects',
    behanceNames.length === APPROVED_PROJECTS.length &&
      behanceNames.every((name, index) => name === APPROVED_PROJECTS.slice().sort()[index] + '.md'),
    behanceNames.join(', '));
  check('no image binaries were generated',
    ![...previewFiles, ...dataFiles].some(file => /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(file)));

  const failed = checks.filter(item => !item.passed);
  const result = {
    approved: APPROVED_IDS,
    checks: checks.length,
    passed: checks.length - failed.length,
    failed: failed.length,
    failures: failed.map(item => item.name + (item.detail ? ' (' + item.detail + ')' : '')),
    frozen: {
      slideshows: config.slideshows.length,
      imageSlots: csv.rows.length,
      uniqueUrls: uniqueUrls.size,
      orderedUrlHash: globalHash
    },
    generated: {
      slideshows: APPROVED_IDS.map(id => ({
        id,
        images: slideMap[id].images.length,
        embedHeight: slideMap[id].embed_height
      })),
      deployment: /<NEW_DEPLOYMENT_ID>/.test(snippet) ? '<NEW_DEPLOYMENT_ID>' : 'set'
    }
  };

  console.log(JSON.stringify(result, null, 2));
  if (failures.length) {
    process.exit(1);
  }
}

try {
  main();
} catch (error) {
  console.error('ERROR: ' + error.message);
  process.exit(1);
}
