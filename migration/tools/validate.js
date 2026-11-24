#!/usr/bin/env node
'use strict';

/**
 * Phase 2 static validation — all 48 slideshows and the standalone page.
 *
 * Verifies the frozen audit data, every generated data file and preview, every
 * project snippet, the complete server-side lookup, the standalone Al-Rashed
 * page, and the static independent-embed rules. No network requests and no
 * image downloads are performed.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const pageData = require('./al-rashed-data');

const ROOT = path.resolve(__dirname, '..');
const CONFIG_PATH = path.join(ROOT, '01_AUDIT', 'slides.config.json');
const IMAGES_CSV = path.join(ROOT, '01_AUDIT', 'images.csv');
const LAYOUT_CONFIG_PATH = path.join(ROOT, '01_AUDIT', 'layout.config.json');
const PREVIEW_DIR = path.join(ROOT, '03_REBUILT_SLIDESHOWS', 'preview');
const DATA_DIR = path.join(ROOT, '03_REBUILT_SLIDESHOWS', 'data');
const APPS_DIR = path.join(ROOT, '04_APPS_SCRIPT');
const BEHANCE_DIR = path.join(ROOT, '05_BEHANCE_OUTPUT');
const ASSETS_DIR = path.resolve(ROOT, '..', 'assets', 'al-rashed');
const PAGE_PREVIEW = path.join(PREVIEW_DIR, 'al-rashed.html');
const PAGE_PRODUCTION = path.join(APPS_DIR, 'AlRashed.html');
const PAGE_DELIVERABLE = path.join(BEHANCE_DIR, 'AL_RASHED_EMBED.md');
const PAGE_ASSETS = [
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

const EXPECTED_DEPLOYMENT_ID =
  'AKfycbzV7OufIj8Q6yLZaKxccF_ETSNJ3l76gMV_s0cvIzkPnxND7ofDwOMn35gdPO_JxlZfHA';
const EXPECTED_GLOBAL_HASH = '4338768034a434082e6bc3e2ddffb3a4214e5498f097c1cfc0d3429d3eb93d85';
const EXPECTED_SLIDESHOWS = 48;
const EXPECTED_PROJECTS = 37;
const EXPECTED_IMAGE_SLOTS = 339;
const EXPECTED_UNIQUE_URLS = 336;
const BEHANCE_MAX_WIDTH = 1200;
const REPAIR_ID = 'P011-S01';

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

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
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

function jpegDimensions(buffer) {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset++;
      continue;
    }
    const marker = buffer[offset + 1];
    if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2;
      continue;
    }
    const length = buffer.readUInt16BE(offset + 2);
    if (marker >= 0xc0 && marker <= 0xcf &&
        marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7)
      };
    }
    offset += 2 + length;
  }
  return null;
}

function main() {
  // ---------------------------------------------------------------- frozen data
  const config = JSON.parse(read(CONFIG_PATH));
  const csv = readCsv(IMAGES_CSV);
  const urls = csv.rows.map(row => row.original_url);
  const uniqueUrls = new Set(urls);
  const globalHash = sha256(urls);

  check('slides.config.json has 48 slideshows',
    Array.isArray(config.slideshows) && config.slideshows.length === EXPECTED_SLIDESHOWS,
    'found ' + (config.slideshows ? config.slideshows.length : 'none'));
  check('images.csv has 339 image slots',
    csv.rows.length === EXPECTED_IMAGE_SLOTS, 'found ' + csv.rows.length);
  check('images.csv has 336 unique URLs',
    uniqueUrls.size === EXPECTED_UNIQUE_URLS, 'found ' + uniqueUrls.size);
  check('frozen ordered URL hash is unchanged',
    globalHash === EXPECTED_GLOBAL_HASH, globalHash);

  const sources = config.slideshows;
  const ids = sources.map(source => source.slideshow_id);
  const projectIds = Array.from(new Set(sources.map(source => source.project_id)));

  // --------------------------------------------------------------- layout gate
  const layoutConfig = JSON.parse(read(LAYOUT_CONFIG_PATH));
  const fitSetting = layoutConfig.fit;
  check('layout.config.json uses "all" or an ID array',
    fitSetting === 'all' || Array.isArray(fitSetting),
    typeof fitSetting);
  const fitIds = new Set();
  if (fitSetting === 'all') {
    ids.forEach(id => fitIds.add(id));
  } else if (Array.isArray(fitSetting)) {
    const normalizedFitIds = fitSetting.map(id => String(id).trim().toUpperCase());
    check('layout.config.json fit IDs are unique',
      new Set(normalizedFitIds).size === normalizedFitIds.length);
    normalizedFitIds.forEach(id => {
      check('layout.config.json fit ID is known: ' + id, ids.includes(id));
      if (ids.includes(id)) fitIds.add(id);
    });
  }

  check('slideshow IDs are unique', new Set(ids).size === ids.length);
  check('37 projects have slideshows', projectIds.length === EXPECTED_PROJECTS,
    'found ' + projectIds.length);
  check('P024 has its audited slideshow with four images',
    sources.some(source => source.slideshow_id === 'P024-S01' && source.images.length === 4));
  check('P036 remains without a slideshow', !ids.some(id => id.startsWith('P036-')));

  const byId = new Map();
  for (const source of sources) {
    const rows = csv.rows
      .filter(row => row.slideshow_id === source.slideshow_id)
      .sort((a, b) => Number(a.order) - Number(b.order));
    const expectedUrls = rows.map(row => row.original_url);
    byId.set(source.slideshow_id, { source, rows, expectedUrls });

    check(source.slideshow_id + ': has ' + source.image_count + ' audited image slots',
      rows.length === source.image_count, 'found ' + rows.length);
    check(source.slideshow_id + ': CSV order is contiguous',
      rows.every((row, index) => Number(row.order) === index + 1));
    check(source.slideshow_id + ': CSV URLs are remote https',
      expectedUrls.every(url => /^https:\/\//.test(url)));
    check(source.slideshow_id + ': CSV unique count matches the audit',
      new Set(expectedUrls).size === Number(source.unique_images),
      new Set(expectedUrls).size + ' vs ' + source.unique_images);
    check(source.slideshow_id + ': frame dimensions are positive',
      Number(source.frame_w) > 0 && Number(source.frame_h) > 0,
      source.frame_w + ' x ' + source.frame_h);
  }

  check('every images.csv row belongs to a configured slideshow',
    csv.rows.every(row => byId.has(row.slideshow_id)));
  const p032 = byId.get('P032-S01');
  check('P032-S01 keeps the original image at position 2',
    Boolean(p032) && p032.expectedUrls[1] === 'https://i.imgur.com/1MWxYk7.jpeg');
  check('P032-S01 has the owner replacement at position 3',
    Boolean(p032) && p032.expectedUrls[2] === 'https://i.imgur.com/PjEUKuC.jpeg');
  const p024 = byId.get('P024-S01');
  check('P024-S01 preserves the audited image order',
    Boolean(p024) && p024.expectedUrls.join(',') ===
      'https://i.imgur.com/bvRTvZo.jpeg,https://i.imgur.com/YqKMfyA.jpeg,https://i.imgur.com/iYzCXGC.jpeg,https://i.imgur.com/5vPqYBR.jpeg');
  const p026s02 = byId.get('P026-S02');
  check('P026-S02 remains a 3-image companion',
    Boolean(p026s02) && p026s02.expectedUrls.length === 3);
  const p011 = byId.get('P011-S01');
  check('P011-S01 records the approved repair',
    Boolean(p011) && Boolean(p011.source.repair_note) &&
      /no JavaScript/i.test(p011.source.repair_note));

  // ---------------------------------------------------------------- SlidesData
  const dataSource = read(path.join(APPS_DIR, 'SlidesData.gs'));
  const slideMap = extractSlides(dataSource);
  const mapKeys = Object.keys(slideMap);
  check('SlidesData.gs contains all 47 slideshows',
    mapKeys.length === EXPECTED_SLIDESHOWS && ids.every(id => mapKeys.includes(id)),
    mapKeys.length + ' keys');
  check('SlidesData.gs preserves the audited order',
    mapKeys.join(',') === ids.join(','));
  check('SlidesData.gs layout flags match layout.config.json',
    ids.every(id => fitIds.has(id)
      ? slideMap[id].layout === 'fit'
      : !Object.prototype.hasOwnProperty.call(slideMap[id], 'layout')),
    fitIds.size + ' fit slideshow(s)');
  check('SlidesData.gs has no P036 entry',
    !mapKeys.some(id => id.startsWith('P036-')));
  const mapUrls = dataSource.match(/https:\/\/i\.imgur\.com\/[^"']+/g) || [];
  check('SlidesData.gs contains exactly 339 image URL occurrences',
    mapUrls.length === EXPECTED_IMAGE_SLOTS, 'found ' + mapUrls.length);
  check('SlidesData.gs contains no URL outside the frozen audit',
    mapUrls.every(url => uniqueUrls.has(url)));

  // ------------------------------------------------------- per-slide artifacts
  const dataById = new Map();
  const previewById = new Map();

  for (const id of ids) {
    const { source, expectedUrls } = byId.get(id);
    const fitLayout = fitIds.has(id);
    const expectedSnippetWidth = source.frame_w >= BEHANCE_MAX_WIDTH
      ? '100%'
      : String(source.frame_w);

    // ------------------------------------------------------------- data file
    const dataFile = path.join(DATA_DIR, id + '.json');
    check(id + ': data file exists', fs.existsSync(dataFile));
    const data = JSON.parse(read(dataFile));
    dataById.set(id, data);

    check(id + ': data ID matches', data.slideshow_id === id);
    check(id + ': data project matches', data.project_id === source.project_id);
    check(id + ': data title matches', data.project_title === source.project_title);
    check(id + ': data section matches', data.section_label === source.section_label);
    check(id + ': data source URL matches', data.source_url === source.project_url);
    check(id + ': data frame width matches the audit',
      data.embed_width === source.frame_w, data.embed_width + ' vs ' + source.frame_w);
    check(id + ': data frame height matches the audit',
      data.embed_height === source.frame_h, data.embed_height + ' vs ' + source.frame_h);
    check(id + ': data snippet width follows the Behance rule',
      data.snippet_width === expectedSnippetWidth,
      data.snippet_width + ' vs ' + expectedSnippetWidth);
    check(id + ': data aspect matches the audit', data.aspect === source.aspect);
    check(id + ': data radius is 20px', data.radius_px === '20px');
    check(id + ': data object fit is cover', data.object_fit === 'cover');
    check(id + ': data layout matches the gate',
      fitLayout ? data.layout === 'fit' : !Object.prototype.hasOwnProperty.call(data, 'layout'),
      fitLayout ? String(data.layout) : 'unexpected layout flag');
    check(id + ': data requires fullscreen', data.fullscreen_required === true);
    check(id + ': data image count matches the audit',
      data.image_count === expectedUrls.length, data.image_count + ' vs ' + expectedUrls.length);
    check(id + ': data has the audited images', data.images.length === expectedUrls.length);
    check(id + ': data image order is contiguous',
      data.images.every((image, index) => image.order === index + 1));
    check(id + ': data URLs match images.csv exactly in order',
      data.images.length === expectedUrls.length &&
        data.images.every((image, index) => image.src === expectedUrls[index]));
    check(id + ': data URLs are remote https',
      data.images.every(image => /^https:\/\//.test(image.src)));
    check(id + ': data repair note is correct',
      id === REPAIR_ID
        ? Boolean(data.repair_note) && /no JavaScript/i.test(data.repair_note)
        : data.repair_note === null);
    check(id + ': SlidesData entry matches the data file',
      JSON.stringify(slideMap[id]) === JSON.stringify(data));

    // --------------------------------------------------------------- preview
    const previewFile = path.join(PREVIEW_DIR, id + '.html');
    check(id + ': preview exists', fs.existsSync(previewFile));
    const preview = read(previewFile);
    previewById.set(id, preview);
    const previewImages = Array.from(preview.matchAll(/<img\s+src="([^"]+)"[^>]*>/g))
      .map(match => match[1]);

    check(id + ': preview has the audited image count',
      previewImages.length === expectedUrls.length,
      previewImages.length + ' vs ' + expectedUrls.length);
    check(id + ': preview has the audited slide count',
      (preview.match(/<div class="slide">/g) || []).length === expectedUrls.length);
    check(id + ': preview URLs match images.csv exactly in order',
      previewImages.length === expectedUrls.length &&
        previewImages.every((url, index) => url === expectedUrls[index]));
    check(id + ': preview keeps eager loading on every image',
      (preview.match(/loading="eager"/g) || []).length === expectedUrls.length &&
        !/loading="lazy"/.test(preview));
    check(id + ': preview has no unreplaced Apps Script directives', !/<\?/.test(preview));
    check(id + ': preview has no data or file URLs', !/["'](?:data:|file:)/i.test(preview));
    check(id + ': preview has no other slideshow IDs',
      Array.from(new Set(preview.match(/P\d{3}-S\d{2}/g) || []))
        .every(found => found === id));
    check(id + ': preview has no URL from another slideshow',
      previewImages.every(url => expectedUrls.includes(url)));

    check(id + ': preview has exactly one fullscreen button',
      (preview.match(/id="fullscreenBtn"/g) || []).length === 1);
    check(id + ': preview has exactly one slideshow container',
      (preview.match(/class="slideshow-container"/g) || []).length === 1 &&
        (preview.match(/id="slideshow"/g) || []).length === 1);
    const layoutAttribute =
      /<div class="slideshow-container" id="slideshow" data-layout="([^"]*)"(?: style="--fit-aspect:([0-9.]+)")?>/.exec(preview);
    check(id + ': preview layout attribute matches the gate',
      fitLayout
        ? Boolean(layoutAttribute) && layoutAttribute[1] === 'fit'
        : !layoutAttribute || layoutAttribute[1] === '',
      layoutAttribute ? layoutAttribute[1] : 'absent');
    if (fitLayout) {
      const expectedAspect =
        (Number(source.images[0].w) / Number(source.images[0].h)).toFixed(6);
      check(id + ': preview card uses the first image aspect ratio',
        Boolean(layoutAttribute) && layoutAttribute[2] === expectedAspect,
        layoutAttribute ? String(layoutAttribute[2]) : 'absent');
    } else {
      check(id + ': classic preview has no fit aspect style',
        !layoutAttribute || layoutAttribute[2] === undefined,
        layoutAttribute ? String(layoutAttribute[2]) : 'absent');
    }
    check(id + ': preview has exactly one dot container',
      (preview.match(/class="dot-container"/g) || []).length === 1);
    const dotIndex = preview.indexOf('id="dotContainer"');
    const scriptIndex = preview.indexOf('<script>');
    const betweenDotsAndScript = preview.slice(dotIndex, scriptIndex);
    check(id + ': dots are inside the fullscreen container',
      dotIndex > preview.indexOf('id="slideshow"') &&
        /<\/div>\s*<\/div>\s*$/.test(betweenDotsAndScript));
    check(id + ': preview has no nested iframe or embed',
      !/<iframe|<embed|<object/i.test(preview));

    check(id + ': preview uses native fullscreen first', /requestFullscreen/.test(preview));
    check(id + ': preview handles fullscreenerror', /fullscreenerror/.test(preview));
    check(id + ': preview handles fullscreenchange', /fullscreenchange/.test(preview));
    check(id + ': preview has theater-mode fallback', /theater-mode/.test(preview));
    check(id + ': preview fallback stays quiet', !/fullscreen-note/.test(preview) &&
      !/Native fullscreen is unavailable/.test(preview));
    check(id + ': preview does not call alert()', !/\balert\s*\(/.test(preview));
    check(id + ': preview does not use storage or messaging',
      !/localStorage|sessionStorage|indexedDB|document\.cookie|postMessage|BroadcastChannel/i
        .test(preview));

    check(id + ': preview uses a 20px radius',
      (preview.match(/border-radius:\s*20px/g) || []).length >= 2);
    check(id + ': preview uses cover object fit', /object-fit:\s*cover/.test(preview));
    if (fitLayout) {
      check(id + ': preview includes the portrait fit layout',
        /@media \(max-aspect-ratio: 1\/1\)/.test(preview) &&
          /aspect-ratio:\s*var\(--fit-aspect/.test(preview) &&
          /object-fit:\s*contain/.test(preview));
      check(id + ': preview sizes the card without a blurred backdrop',
        /padding-bottom:\s*0/.test(preview) &&
          !/--slide-image/.test(preview) &&
          !/filter:\s*blur/.test(preview));
    }
    check(id + ': preview keeps a transparent background',
      /background-color:\s*transparent/.test(preview));
    check(id + ': preview reveals arrows on hover',
      /\.slideshow-container:hover \.prev/.test(preview) &&
        /\.slideshow-container:hover \.next/.test(preview));
    check(id + ': preview reveals shadows on hover',
      /\.slideshow-container:hover \.side-shadow/.test(preview));
    check(id + ': preview fills the iframe',
      /width:\s*100vw/.test(preview) && /height:\s*100vh/.test(preview));
    check(id + ': preview title matches the project',
      preview.includes('<title>' +
        escapeHtml(source.project_title + ' — ' + source.section_label) + '</title>'));

    if (id === REPAIR_ID) {
      check(id + ': preview restores the standard JavaScript',
        /<script>/.test(preview) && /moveSlide/.test(preview));
      const sourceFile = path.join(ROOT, source.source_file);
      check(id + ': original source is archived', fs.existsSync(sourceFile));
      if (fs.existsSync(sourceFile)) {
        check(id + ': original source had no JavaScript',
          !/<script\b/i.test(read(sourceFile)));
      }
    }
  }

  // -------------------------------------------------------------------- snippet
  let totalIframes = 0;
  for (const projectId of projectIds) {
    const projectSlides = sources.filter(source => source.project_id === projectId);
    const snippetFile = path.join(BEHANCE_DIR, projectId + '.md');
    check(projectId + ': snippet file exists', fs.existsSync(snippetFile));
    const snippet = read(snippetFile);
    const blocks = Array.from(snippet.matchAll(/<iframe\b[\s\S]*?<\/iframe>/g))
      .map(match => match[0]);

    check(projectId + ': has one iframe per slideshow',
      blocks.length === projectSlides.length,
      blocks.length + ' vs ' + projectSlides.length);
    totalIframes += blocks.length;

    projectSlides.forEach((source, index) => {
      const data = dataById.get(source.slideshow_id);
      const block = blocks[index] || '';
      const src = /\bsrc="([^"]+)"/.exec(block);
      const width = /\bwidth="([^"]+)"/.exec(block);
      const height = /\bheight="([^"]+)"/.exec(block);
      const srcValue = src ? src[1] : '';

      check(source.slideshow_id + ': snippet src targets exactly this slideshow',
        Boolean(src) && srcValue.includes(EXPECTED_DEPLOYMENT_ID) &&
          new RegExp('[?&]slide=' + source.slideshow_id + '(?:["&]|$)').test(srcValue),
        srcValue);
      check(source.slideshow_id + ': snippet has exactly one slide parameter',
        (block.match(/\?slide=/g) || []).length === 1);
      check(source.slideshow_id + ': snippet width follows the Behance rule',
        Boolean(width) && width[1] === data.snippet_width,
        width ? width[1] + ' vs ' + data.snippet_width : 'missing');
      check(source.slideshow_id + ': snippet height matches the audit',
        Boolean(height) && Number(height[1]) === data.embed_height,
        height ? height[1] + ' vs ' + data.embed_height : 'missing');
      check(source.slideshow_id + ': snippet grants fullscreen (legacy)',
        /\ballowfullscreen\b/.test(block));
      check(source.slideshow_id + ': snippet grants fullscreen (policy)',
        /allow="fullscreen"/.test(block));
      check(source.slideshow_id + ': snippet has no sandbox',
        !/\bsandbox\b/i.test(block));
      check(source.slideshow_id + ': snippet has the 20px radius style',
        /border-radius:\s*20px/.test(block));
      check(source.slideshow_id + ': snippet contains no other slideshow ID',
        Array.from(new Set(block.match(/P\d{3}-S\d{2}/g) || []))
          .every(found => found === source.slideshow_id));
    });

    check(projectId + ': snippet file has no placeholder deployment',
      !/<NEW_DEPLOYMENT_ID>/.test(snippet));
    check(projectId + ': snippet file has no gallery or viewer markup',
      !/<a\s|<button|<script|gallery/i.test(snippet));
  }
  check('all 48 slideshows have exactly one snippet',
    totalIframes === EXPECTED_SLIDESHOWS, 'found ' + totalIframes);

  // ---------------------------------------------------------- router (static)
  const router = read(path.join(APPS_DIR, 'Code.gs'));
  const slideshowTemplate = read(path.join(APPS_DIR, 'Slideshow.html'));
  check('template carries the opt-in portrait fit layout',
    /data-layout="<\?= layoutMode \?>"<\?!= layoutStyle \?>/.test(slideshowTemplate) &&
      /@media \(max-aspect-ratio: 1\/1\)/.test(slideshowTemplate) &&
      /aspect-ratio:\s*var\(--fit-aspect/.test(slideshowTemplate) &&
      /object-fit:\s*contain/.test(slideshowTemplate) &&
      !/--slide-image/.test(slideshowTemplate));
  check('router passes the generated layout mode and aspect to the template',
    /template\.layoutMode\s*=\s*slide\.layout === 'fit' \? 'fit' : ''/.test(router) &&
      /template\.layoutStyle\s*=\s*layoutStyle_\(slide\)/.test(router));
  check('router computes the fit aspect from the first image',
    /function layoutStyle_\(slide\)/.test(router) &&
      /slide\.images\[0\]/.test(router) &&
      /toFixed\(6\)/.test(router));
  check('router counts raw slide and tools parameters',
    /function countQueryParameters_/.test(router) &&
    /countQueryParameters_\(queryString, 'slide'\)/.test(router) &&
    /countQueryParameters_\(queryString, 'tools'\)/.test(router));
  check('router counts the raw page parameter',
    /countQueryParameters_\(queryString, 'page'\)/.test(router));
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
  check('router has only one HTML response path per request',
    !/createHtmlOutput\([\s\S]*SLIDES/.test(router));

  // ------------------------------------------------------- standalone page
  check('Al-Rashed production page exists', fs.existsSync(PAGE_PRODUCTION));
  check('Al-Rashed preview page exists', fs.existsSync(PAGE_PREVIEW));
  check('Al-Rashed embed deliverable exists', fs.existsSync(PAGE_DELIVERABLE));

  if (fs.existsSync(PAGE_PRODUCTION) && fs.existsSync(PAGE_PREVIEW)) {
    const pageProduction = read(PAGE_PRODUCTION);
    const pagePreview = read(PAGE_PREVIEW);
    const normalizedProduction = pageProduction
      .split(pageData.PRODUCTION_ASSET_BASE).join('ASSET/');
    const normalizedPreview = pagePreview
      .split(pageData.PREVIEW_ASSET_BASE).join('ASSET/');

    check('Al-Rashed production and preview share one generated source',
      normalizedProduction === normalizedPreview);
    check('Al-Rashed production uses jsDelivr',
      pageProduction.includes(pageData.PRODUCTION_ASSET_BASE) &&
        !/(?:src|srcset)="\/assets\/al-rashed\//.test(pageProduction));
    check('Al-Rashed preview uses the local asset route',
      pagePreview.includes(pageData.PREVIEW_ASSET_BASE) &&
        !pagePreview.includes(pageData.PRODUCTION_ASSET_BASE));
    check('Al-Rashed page title is exact',
      pageProduction.includes('<title>' + pageData.PAGE_TITLE + '</title>'));
    check('Al-Rashed page has no template directives',
      !/<\?/.test(pageProduction));
    check('Al-Rashed page has no Google Sites chrome',
      !/sites\.google\.com|googleusercontent|atari|view\/hossam-alafandi|Report abuse|Skip to content/i
        .test(pageProduction));
    check('Al-Rashed page has no site navigation or anchors',
      !/<nav\b/i.test(pageProduction) && !/<a\b/i.test(pageProduction));
    check('Al-Rashed page has no data, file, or blob URLs',
      !/["'](?:data:|file:|blob:)/i.test(pageProduction));
    check('Al-Rashed page has no slideshow or tools route',
      !/[?&](?:slide|tools)=/i.test(pageProduction) &&
        !/P\d{3}-S\d{2}/.test(pageProduction));
    check('Al-Rashed page has exactly one iframe, the map',
      (pageProduction.match(/<iframe\b/g) || []).length === 1 &&
        pageProduction.includes('src="' + escapeHtml(pageData.MAP_URL) + '"'));
    check('Al-Rashed page uses the fixed 2980 px Behance height in data',
      pageData.EMBED_HEIGHT === 2980 && pageData.EMBED_WIDTH === '100%');

    const pageImages = Array.from(pageProduction.matchAll(/<img\b[^>]*>/g))
      .map(match => match[0]);
    const pageImageSource = tag => {
      const match = /\bsrc="([^"]*)"/.exec(tag);
      return match ? match[1] : '';
    };
    const pageImageAlt = tag => {
      const match = /\balt="([^"]*)"/.exec(tag);
      return match ? match[1] : '';
    };
    const renderTags = pageImages.filter(tag =>
      /^Al-Rashed project render \d+$/.test(pageImageAlt(tag)));
    const photoTags = pageImages.filter(tag =>
      /^Al-Rashed project real photo \d$/.test(pageImageAlt(tag)));
    const toolTags = pageImages.filter(tag =>
      pageData.TOOLS.some(tool => tool.name === pageImageAlt(tag)));
    const heroTags = pageImages.filter(tag => pageImageAlt(tag) === pageData.HERO.alt);

    check('Al-Rashed page has 26 images', pageImages.length === 26,
      pageImages.length + ' images');
    check('Al-Rashed page has one hero, 17 renders, 3 photos, and 5 tools',
      heroTags.length === 1 && renderTags.length === 17 &&
        photoTags.length === 3 && toolTags.length === 5,
      [heroTags.length, renderTags.length, photoTags.length, toolTags.length].join('/'));
    check('Al-Rashed render URLs match the data exactly in order',
      renderTags.length === 17 &&
        renderTags.every((tag, index) =>
          pageImageSource(tag) === pageData.renderUrl(pageData.RENDERS[index])));
    check('Al-Rashed renders use the 1024x576 h variant',
      renderTags.every(tag => /^https:\/\/i\.imgur\.com\/[A-Za-z0-9]+h\.jpeg$/.test(
        pageImageSource(tag))));
    check('Al-Rashed only eagerly loads the first render',
      /\bloading="eager"/.test(renderTags[0] || '') &&
        renderTags.slice(1).every(tag => /\bloading="lazy"/.test(tag)));
    check('Al-Rashed real photos match the 1280 desktop files',
      photoTags.length === 3 &&
        photoTags.every((tag, index) => pageImageSource(tag) ===
          pageData.PRODUCTION_ASSET_BASE + pageData.REAL_PHOTOS[index].desktop));
    check('Al-Rashed tool URLs match the data exactly in order',
      toolTags.length === 5 &&
        toolTags.every((tag, index) =>
          pageImageSource(tag) === pageData.toolUrl(pageData.TOOLS[index].id)));
    check('Al-Rashed hero is eager with high priority',
      heroTags.length === 1 && /\bloading="eager"/.test(heroTags[0]) &&
        /\bfetchpriority="high"/.test(heroTags[0]));
    check('Al-Rashed page includes the 768 phone sources',
      pageData.REAL_PHOTOS.every(photo =>
        pageProduction.includes('<source media="(max-width: 700px)" srcset="' +
          pageData.PRODUCTION_ASSET_BASE + photo.file + '">')) &&
        pageProduction.includes('<source media="(max-width: 700px)" srcset="' +
          pageData.PRODUCTION_ASSET_BASE + 'hero-768.jpg">'));
    check('Al-Rashed page keeps the exact overview and copyright text',
      pageProduction.includes('Al-Rashed or (Zahret Al-Khuzama) project') &&
        pageProduction.includes('<footer class="copyright">' +
          escapeHtml(pageData.COPYRIGHT_TEXT) + '</footer>'));
    check('Al-Rashed page keeps the 16:9 stage, 1:2.05 grid, and 5 tool columns',
      /aspect-ratio:\s*16 \/ 9/.test(pageProduction) &&
        /grid-template-columns:\s*1fr 2\.05fr/.test(pageProduction) &&
        /grid-template-columns:\s*repeat\(5, 1fr\)/.test(pageProduction));
    check('Al-Rashed page keeps native fullscreen and the quiet fallback',
      /requestFullscreen/.test(pageProduction) &&
        /fullscreenerror/.test(pageProduction) &&
        /theater-mode/.test(pageProduction) &&
        !/fullscreen-note|Native fullscreen is unavailable|\balert\s*\(/.test(pageProduction));
    check('Al-Rashed page uses no storage, cookies, or messaging',
      !/localStorage|sessionStorage|indexedDB|document\.cookie|postMessage|BroadcastChannel/i
        .test(pageProduction));
    check('Al-Rashed page supports keyboard and swipe navigation',
      /ArrowLeft/.test(pageProduction) && /ArrowRight/.test(pageProduction) &&
        /touchstart/.test(pageProduction) && /touchend/.test(pageProduction));

    const referencedPageAssets = Array.from(new Set(
      Array.from(pageProduction.matchAll(
        /https:\/\/cdn\.jsdelivr\.net\/gh\/hossamalafandi\/behance-slideshow@main\/assets\/al-rashed\/([A-Za-z0-9._-]+)/g
      )).map(match => match[1])
    )).sort();
    check('Al-Rashed production references exactly the 9 approved assets',
      JSON.stringify(referencedPageAssets) ===
        JSON.stringify(PAGE_ASSETS.map(asset => asset.name).sort()),
      referencedPageAssets.join(', '));
    check('Al-Rashed preview references exactly the 9 local assets',
      PAGE_ASSETS.every(asset =>
        pagePreview.includes(pageData.PREVIEW_ASSET_BASE + asset.name)));

    const assetFiles = fs.existsSync(ASSETS_DIR)
      ? fs.readdirSync(ASSETS_DIR, { withFileTypes: true })
        .filter(entry => entry.isFile())
        .map(entry => entry.name)
        .sort()
      : [];
    check('Al-Rashed asset folder contains exactly the 9 approved files',
      JSON.stringify(assetFiles) ===
        JSON.stringify(PAGE_ASSETS.map(asset => asset.name).sort()),
      assetFiles.join(', '));
    for (const asset of PAGE_ASSETS) {
      const file = path.join(ASSETS_DIR, asset.name);
      check('Al-Rashed asset exists: ' + asset.name, fs.existsSync(file));
      if (!fs.existsSync(file)) continue;
      const buffer = fs.readFileSync(file);
      const dimensions = jpegDimensions(buffer);
      check('Al-Rashed asset is a JPEG: ' + asset.name,
        Boolean(dimensions));
      check('Al-Rashed asset dimensions are ' + asset.width + 'x' + asset.height + ': ' + asset.name,
        Boolean(dimensions) && dimensions.width === asset.width &&
          dimensions.height === asset.height,
        dimensions ? dimensions.width + 'x' + dimensions.height : 'unreadable');
      check('Al-Rashed asset is optimized: ' + asset.name,
        buffer.length > 0 && buffer.length <= asset.maxBytes,
        buffer.length + ' bytes');
    }
    const gitignoreFile = path.resolve(ROOT, '..', '.gitignore');
    check('Al-Rashed raw originals are gitignored',
      fs.existsSync(gitignoreFile) &&
        /assets\/al-rashed\/raw\//.test(read(gitignoreFile)));

    const snippet = pageData.embedSnippet();
    check('Al-Rashed embed snippet is the exact 2980 px fluid iframe',
      snippet.includes('src="' + pageData.embedUrl() + '"') &&
        snippet.includes('width="100%"') && snippet.includes('height="2980"') &&
        snippet.includes('allowfullscreen') &&
        snippet.includes('allow="fullscreen"') && !/\bsandbox\b/i.test(snippet));
  }

  if (fs.existsSync(PAGE_DELIVERABLE)) {
    const deliverable = read(PAGE_DELIVERABLE);
    check('Al-Rashed deliverable contains the exact iframe snippet',
      deliverable.includes(pageData.embedSnippet()));
    check('Al-Rashed deliverable documents the 2980 px height',
      /2980/.test(deliverable));
    check('Al-Rashed deliverable documents phone and desktop behavior',
      /phone/i.test(deliverable) && /desktop/i.test(deliverable));
    check('Al-Rashed deliverable documents rollback',
      /rollback/i.test(deliverable));
    check('Al-Rashed deliverable keeps the 48 slideshow embeds unchanged',
      /48/.test(deliverable) && /unchanged|untouched|do not/i.test(deliverable));
    check('Al-Rashed deliverable documents the approved image exception',
      /jsDelivr/i.test(deliverable) &&
        /Google Sites/i.test(deliverable) && /9|nine/i.test(deliverable));
  }

  check('router serves the standalone Al-Rashed page',
    /function alRashedResponse_/.test(router) &&
      /createHtmlOutputFromFile\('AlRashed'\)/.test(router) &&
      /setXFrameOptionsMode\(HtmlService\.XFrameOptionsMode\.ALLOWALL\)/.test(router) &&
      /raw\.trim\(\)\.toLowerCase\(\) !== 'al-rashed'/.test(router));
  check('router requires exactly one page parameter and no slide/tools',
    /pageCount === 1 && slideCount === 0 && toolsCount === 0/.test(router) &&
      /slideCount === 1 && toolsCount === 0 && pageCount === 0/.test(router) &&
      /toolsCount === 1 && slideCount === 0 && pageCount === 0/.test(router));
  const pageRouteBody = /function alRashedResponse_\(e\) \{([\s\S]*?)\n\}/.exec(router);
  check('Al-Rashed route never serializes the slideshow catalog',
    Boolean(pageRouteBody) && !/SLIDES|TOOLS|P\d{3}-S\d{2}/.test(pageRouteBody[1]));
  check('Al-Rashed route returns the neutral error for other page values',
    Boolean(pageRouteBody) && /return notFoundResponse_\(\);/.test(pageRouteBody[1]));

  const serveSource = read(path.join(__dirname, 'serve.js'));
  check('local router mirrors the page route',
    /PAGE_CODE = 'al-rashed'/.test(serveSource) &&
      /pageCount === 1 && slideCount === 0 && toolsCount === 0/.test(serveSource) &&
      /PAGE_PREVIEW/.test(serveSource));
  check('local router serves only the approved page assets',
    /ASSET_PREFIX = '\/assets\/al-rashed\/'/.test(serveSource) &&
      /\[A-Za-z0-9\._-\]\+/.test(serveSource) &&
      /name\.startsWith\('\.'\)/.test(serveSource));
  check('local router keeps raw originals unreachable',
    /raw/.test(serveSource) && /404/.test(serveSource));

  // -------------------------------------------------------------------- hygiene
  const previewFiles = listFiles(PREVIEW_DIR).filter(file => !file.endsWith('.gitkeep'));
  const dataFiles = listFiles(DATA_DIR).filter(file => !file.endsWith('.gitkeep'));
  const behanceFiles = listFiles(BEHANCE_DIR).filter(file => !file.endsWith('.gitkeep'));
  const previewNames = previewFiles.map(file => path.basename(file)).sort();
  const dataNames = dataFiles.map(file => path.basename(file)).sort();
  const behanceNames = behanceFiles.map(file => path.basename(file)).sort();
  const expectedPreviewNames = ids.map(id => id + '.html').concat('al-rashed.html').sort();
  const expectedDataNames = ids.map(id => id + '.json').sort();
  const expectedBehanceNames = [
    ...projectIds.map(id => id + '.md'),
    'ALL_EMBEDS.md',
    'ALL_EMBEDS.csv',
    'AL_RASHED_EMBED.md',
    'README.md',
    'TOOLS_USED_EMBEDS.md',
    'TOOLS_USED_EMBEDS.csv'
  ].sort();

  check('preview output contains exactly the 48 slideshows and the standalone page',
    JSON.stringify(previewNames) === JSON.stringify(expectedPreviewNames),
    previewNames.join(', '));
  check('data output contains exactly the 48 audited slideshows',
    JSON.stringify(dataNames) === JSON.stringify(expectedDataNames),
    dataNames.join(', '));
  check('Behance output contains exactly the expected files',
    JSON.stringify(behanceNames) === JSON.stringify(expectedBehanceNames),
    behanceNames.join(', '));
  check('no image binaries were generated',
    ![...previewFiles, ...dataFiles, ...behanceFiles]
      .some(file => /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(file)));

  const failed = checks.filter(item => !item.passed);
  const result = {
    scope: {
      slideshows: sources.length,
      projects: projectIds.length,
      imageSlots: csv.rows.length,
      uniqueUrls: uniqueUrls.size,
      orderedUrlHash: globalHash
    },
    checks: checks.length,
    passed: checks.length - failed.length,
    failed: failed.length,
    failures: failed.map(item => item.name + (item.detail ? ' (' + item.detail + ')' : '')),
    widths: {
      fluid: sources.filter(source => source.frame_w >= BEHANCE_MAX_WIDTH).length,
      fixed: sources.filter(source => source.frame_w < BEHANCE_MAX_WIDTH).length
    },
    generated: {
      slideshows: sources.map(source => ({
        id: source.slideshow_id,
        images: byId.get(source.slideshow_id).expectedUrls.length,
        width: dataById.get(source.slideshow_id).snippet_width,
        height: dataById.get(source.slideshow_id).embed_height
      })),
      projects: projectIds.length,
      deployment: EXPECTED_DEPLOYMENT_ID
    }
  };

  console.log(JSON.stringify(result, null, 2));
  if (failures.length) process.exit(1);
}

try {
  main();
} catch (error) {
  console.error('ERROR: ' + error.stack);
  process.exit(1);
}
