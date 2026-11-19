#!/usr/bin/env node
'use strict';

/**
 * Phase 2 static validation — all 47 slideshows.
 *
 * Verifies the frozen audit data, every generated data file and preview, every
 * project snippet, the complete server-side lookup, and the static
 * independent-embed rules. No network requests and no image downloads are
 * performed.
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

const EXPECTED_DEPLOYMENT_ID =
  'AKfycbzV7OufIj8Q6yLZaKxccF_ETSNJ3l76gMV_s0cvIzkPnxND7ofDwOMn35gdPO_JxlZfHA';
const EXPECTED_GLOBAL_HASH = '882a952d07cc442466cb2d7a3e3369ecb44a9a9e20fd299ca5f6f9e52ae001d0';
const EXPECTED_SLIDESHOWS = 47;
const EXPECTED_PROJECTS = 36;
const EXPECTED_IMAGE_SLOTS = 335;
const EXPECTED_UNIQUE_URLS = 331;
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

  const sources = config.slideshows;
  const ids = sources.map(source => source.slideshow_id);
  const projectIds = Array.from(new Set(sources.map(source => source.project_id)));

  check('slideshow IDs are unique', new Set(ids).size === ids.length);
  check('36 projects have slideshows', projectIds.length === EXPECTED_PROJECTS,
    'found ' + projectIds.length);
  check('P024 has no invented slideshow', !ids.some(id => id.startsWith('P024-')));
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
  check('P032-S01 preserves the repeated image at positions 2 and 3',
    Boolean(p032) && p032.expectedUrls[1] === p032.expectedUrls[2] &&
      p032.expectedUrls[1] === 'https://i.imgur.com/1MWxYk7.jpeg');
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
  check('SlidesData.gs has no P024 or P036 entries',
    !mapKeys.some(id => id.startsWith('P024-') || id.startsWith('P036-')));
  const mapUrls = dataSource.match(/https:\/\/i\.imgur\.com\/[^"']+/g) || [];
  check('SlidesData.gs contains exactly 335 image URL occurrences',
    mapUrls.length === EXPECTED_IMAGE_SLOTS, 'found ' + mapUrls.length);
  check('SlidesData.gs contains no URL outside the frozen audit',
    mapUrls.every(url => uniqueUrls.has(url)));

  // ------------------------------------------------------- per-slide artifacts
  const dataById = new Map();
  const previewById = new Map();

  for (const id of ids) {
    const { source, expectedUrls } = byId.get(id);
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
    check(id + ': preview has a non-blocking fallback note', /fullscreen-note/.test(preview));
    check(id + ': preview does not call alert()', !/\balert\s*\(/.test(preview));
    check(id + ': preview does not use storage or messaging',
      !/localStorage|sessionStorage|indexedDB|document\.cookie|postMessage|BroadcastChannel/i
        .test(preview));

    check(id + ': preview uses a 20px radius',
      (preview.match(/border-radius:\s*20px/g) || []).length >= 2);
    check(id + ': preview uses cover object fit', /object-fit:\s*cover/.test(preview));
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
  check('all 47 slideshows have exactly one snippet',
    totalIframes === EXPECTED_SLIDESHOWS, 'found ' + totalIframes);

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
  check('router has only one HTML response path per request',
    !/createHtmlOutput\([\s\S]*SLIDES/.test(router));

  // -------------------------------------------------------------------- hygiene
  const previewFiles = listFiles(PREVIEW_DIR).filter(file => !file.endsWith('.gitkeep'));
  const dataFiles = listFiles(DATA_DIR).filter(file => !file.endsWith('.gitkeep'));
  const behanceFiles = listFiles(BEHANCE_DIR).filter(file => !file.endsWith('.gitkeep'));
  const previewNames = previewFiles.map(file => path.basename(file)).sort();
  const dataNames = dataFiles.map(file => path.basename(file)).sort();
  const behanceNames = behanceFiles.map(file => path.basename(file)).sort();
  const expectedPreviewNames = ids.map(id => id + '.html').sort();
  const expectedDataNames = ids.map(id => id + '.json').sort();
  const expectedBehanceNames = projectIds.map(id => id + '.md').sort();

  check('preview output contains exactly the 47 audited slideshows',
    JSON.stringify(previewNames) === JSON.stringify(expectedPreviewNames),
    previewNames.join(', '));
  check('data output contains exactly the 47 audited slideshows',
    JSON.stringify(dataNames) === JSON.stringify(expectedDataNames),
    dataNames.join(', '));
  check('Behance output contains exactly the 36 projects',
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
