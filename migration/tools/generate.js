#!/usr/bin/env node
'use strict';

/**
 * Phase 2 generator — approved IDs only.
 *
 * The P001-S01 pilot passed its real Behance gate on 2026-11-19. The approved
 * set now also includes the P011-S01 repair. Running with no --slide argument
 * is still an error, so this tool cannot accidentally process all 47
 * slideshows.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const CONFIG_PATH = path.join(ROOT, '01_AUDIT', 'slides.config.json');
const IMAGES_CSV = path.join(ROOT, '01_AUDIT', 'images.csv');
const TEMPLATE_PATH = path.join(ROOT, '04_APPS_SCRIPT', 'Slideshow.html');
const DATA_DIR = path.join(ROOT, '03_REBUILT_SLIDESHOWS', 'data');
const PREVIEW_DIR = path.join(ROOT, '03_REBUILT_SLIDESHOWS', 'preview');
const APPS_DIR = path.join(ROOT, '04_APPS_SCRIPT');
const BEHANCE_DIR = path.join(ROOT, '05_BEHANCE_OUTPUT');

const APPROVED_IDS = new Set(['P001-S01', 'P011-S01']);
const REQUIRED_COMPANION = { 'P011-S01': 'P001-S01' };
const EXPECTED_GLOBAL_HASH = '882a952d07cc442466cb2d7a3e3369ecb44a9a9e20fd299ca5f6f9e52ae001d0';
const EXPECTED_SLIDESHOWS = 47;
const EXPECTED_IMAGE_SLOTS = 335;
const EXPECTED_UNIQUE_URLS = 331;

function fail(message) {
  throw new Error(message);
}

function parseArgs(argv) {
  const options = { slides: [], deploymentId: null };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--slide') {
      if (!argv[i + 1]) fail('--slide needs an ID');
      options.slides.push(argv[++i]);
    } else if (arg.startsWith('--slide=')) {
      options.slides.push(arg.slice('--slide='.length));
    } else if (arg === '--deployment-id') {
      if (!argv[i + 1]) fail('--deployment-id needs a value');
      options.deploymentId = argv[++i];
    } else if (arg.startsWith('--deployment-id=')) {
      options.deploymentId = arg.slice('--deployment-id='.length);
    } else {
      fail('Unknown argument: ' + arg);
    }
  }
  options.slides = Array.from(new Set(options.slides.map(id => id.trim().toUpperCase())));
  if (options.slides.length === 0) {
    fail('Refusing to generate without --slide. Approved IDs: ' + Array.from(APPROVED_IDS).join(', '));
  }
  for (const id of options.slides) {
    if (!APPROVED_IDS.has(id)) {
      fail('Refusing to generate ' + id + '. Only the approved IDs are enabled: ' +
        Array.from(APPROVED_IDS).join(', '));
    }
  }
  // The generated SlidesData.gs replaces the previous map. Keep the already
  // deployed pilot in the same build whenever the repair is generated.
  for (const id of options.slides) {
    const companion = REQUIRED_COMPANION[id];
    if (companion && !options.slides.includes(companion)) {
      options.slides.unshift(companion);
    }
  }
  if (options.deploymentId && !/^[A-Za-z0-9_-]+$/.test(options.deploymentId)) {
    fail('Invalid deployment ID format');
  }
  return options;
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
  const lines = fs.readFileSync(file, 'utf8').trim().split(/\r?\n/);
  const header = parseCsvLine(lines[0]);
  const rows = lines.slice(1).map((line, index) => {
    const fields = parseCsvLine(line);
    if (fields.length !== header.length) {
      fail('Bad CSV row ' + (index + 2) + ': expected ' + header.length + ' fields');
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

function renderImages(images) {
  return images.map((image, index) => {
    // Every archived original marks its images loading="eager". Preserve that
    // so navigation never reveals an unloaded slide.
    const loading = 'eager';
    const alt = escapeHtml(image.alt || ('Slide ' + (index + 1)));
    return '    <div class="slide"><img src="' + image.src +
      '" alt="' + alt + '" loading="' + loading + '"></div>';
  }).join('\n');
}

function buildPilotSlide(source, csvRows) {
  if (!source) fail('Missing slideshow in slides.config.json');
  const images = source.images.map((image, index) => {
    if (!image.src || !/^https?:\/\//.test(image.src)) {
      fail(source.slideshow_id + ' image ' + (index + 1) + ' has no remote URL');
    }
    if (image.order !== index + 1) {
      fail(source.slideshow_id + ' image order is not contiguous');
    }
    return {
      order: image.order,
      src: image.src,
      w: image.w,
      h: image.h,
      alt: image.alt || ('Slide ' + (index + 1))
    };
  });

  const csvUrls = csvRows
    .filter(row => row.slideshow_id === source.slideshow_id)
    .sort((a, b) => Number(a.order) - Number(b.order))
    .map(row => row.original_url);

  if (images.length !== csvUrls.length) {
    fail(source.slideshow_id + ' image count differs from images.csv');
  }
  images.forEach((image, index) => {
    if (image.src !== csvUrls[index]) {
      fail(source.slideshow_id + ' image ' + (index + 1) + ' differs from images.csv');
    }
  });

  // Prefer the audited frame height: the stored aspect is rounded to two
  // decimals, which can shift a tall portrait frame by one pixel.
  const embedHeight = Number.isFinite(source.frame_h) && source.frame_h > 0
    ? source.frame_h
    : Math.round(source.frame_w / source.aspect);
  if (!Number.isFinite(embedHeight) || embedHeight <= 0) {
    fail(source.slideshow_id + ' has an invalid frame height or aspect ratio');
  }

  return {
    slideshow_id: source.slideshow_id,
    project_id: source.project_id,
    project_title: source.project_title,
    section_label: source.section_label,
    descriptor: source.descriptor,
    source_url: source.project_url,
    embed_width: source.frame_w,
    embed_height: embedHeight,
    aspect: source.aspect,
    radius_px: source.radius_px,
    object_fit: source.object_fit,
    fullscreen_required: true,
    repair_note: source.repair_note || null,
    image_count: images.length,
    images: images
  };
}

function renderPreview(template, slide) {
  const pageTitle = slide.project_title + ' — ' + slide.section_label;
  let html = template
    .replace('<?= pageTitle ?>', escapeHtml(pageTitle))
    .replace('<?!= imagesHtml ?>', renderImages(slide.images));
  if (/<\?/.test(html)) {
    fail('Unreplaced Apps Script template directive remains in preview');
  }
  return html;
}

function buildSnippet(slide, deploymentId) {
  const base = deploymentId
    ? 'https://script.google.com/macros/s/' + deploymentId + '/exec'
    : 'https://script.google.com/macros/s/<NEW_DEPLOYMENT_ID>/exec';
  return [
    '<iframe',
    '  src="' + base + '?slide=' + slide.slideshow_id + '"',
    '  width="100%"',
    '  height="' + slide.embed_height + '"',
    '  style="border:0;border-radius:20px;overflow:hidden"',
    '  loading="lazy"',
    '  allowfullscreen',
    '  allow="fullscreen">',
    '</iframe>'
  ].join('\n');
}

function writeFile(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, 'utf8');
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  const imagesCsv = readCsv(IMAGES_CSV);
  const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');

  if (!Array.isArray(config.slideshows) || config.slideshows.length !== EXPECTED_SLIDESHOWS) {
    fail('Expected ' + EXPECTED_SLIDESHOWS + ' slideshows in slides.config.json');
  }
  if (imagesCsv.rows.length !== EXPECTED_IMAGE_SLOTS) {
    fail('Expected ' + EXPECTED_IMAGE_SLOTS + ' rows in images.csv');
  }
  const allCsvUrls = imagesCsv.rows.map(row => row.original_url);
  if (new Set(allCsvUrls).size !== EXPECTED_UNIQUE_URLS) {
    fail('Expected ' + EXPECTED_UNIQUE_URLS + ' unique URLs in images.csv');
  }
  if (sha256(allCsvUrls) !== EXPECTED_GLOBAL_HASH) {
    fail('The global image URL hash changed; refusing to generate');
  }

  const selected = options.slides.map(id => {
    const source = config.slideshows.find(slide => slide.slideshow_id === id);
    return buildPilotSlide(source, imagesCsv.rows);
  });

  const slideMap = {};
  for (const slide of selected) {
    slideMap[slide.slideshow_id] = slide;
    const dataFile = path.join(DATA_DIR, slide.slideshow_id + '.json');
    writeFile(dataFile, JSON.stringify(slide, null, 2) + '\n');

    const previewFile = path.join(PREVIEW_DIR, slide.slideshow_id + '.html');
    writeFile(previewFile, renderPreview(template, slide));
  }

  const dataSource = [
    '/**',
    ' * Generated by tools/generate.js. Do not edit by hand.',
    ' * Current build: approved set — P001-S01 and P011-S01.',
    ' * The SLIDES lookup is server-side and is never sent wholesale to a client.',
    ' */',
    'var SLIDES = ' + JSON.stringify(slideMap, null, 2) + ';',
    ''
  ].join('\n');
  writeFile(path.join(APPS_DIR, 'SlidesData.gs'), dataSource);

  const byProject = new Map();
  for (const slide of selected) {
    if (!byProject.has(slide.project_id)) byProject.set(slide.project_id, []);
    byProject.get(slide.project_id).push(slide);
  }

  for (const [projectId, slides] of byProject) {
    const first = slides[0];
    const lines = [
      '# ' + projectId + ' — ' + first.project_title,
      '',
      'Generated embed. Every snippet below loads exactly one slideshow and must',
      'be placed in its own Behance project section. The URL points at the new',
      'standalone Web App deployment; the production deployment is untouched.',
      ''
    ];
    for (const slide of slides) {
      lines.push(
        '## ' + slide.slideshow_id + ' — ' + slide.section_label,
        '',
        'Height: ' + slide.embed_height + ' px (from the audited frame height).',
        ''
      );
      if (slide.repair_note) {
        lines.push('**Repair:** ' + slide.repair_note, '');
      }
      lines.push(
        '```html',
        buildSnippet(slide, options.deploymentId),
        '```',
        ''
      );
    }
    writeFile(path.join(BEHANCE_DIR, projectId + '.md'), lines.join('\n'));
  }

  console.log(JSON.stringify({
    generated: selected.map(slide => ({
      slideshow_id: slide.slideshow_id,
      images: slide.image_count,
      embed_height: slide.embed_height
    })),
    deployment: options.deploymentId || '<NEW_DEPLOYMENT_ID>',
    note: 'Approved-ID allowlist enforced; no other slideshow was processed.'
  }, null, 2));
}

try {
  main();
} catch (error) {
  console.error('ERROR: ' + error.message);
  process.exit(1);
}
