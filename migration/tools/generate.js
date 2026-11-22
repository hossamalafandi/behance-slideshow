#!/usr/bin/env node
'use strict';

/**
 * Phase 2 generator — full approved build.
 *
 * Generates one data file and one preview per selected slideshow, and always
 * writes the complete 48-slideshow server-side lookup. Behance snippets are
 * regenerated for every project so the width rule is applied consistently.
 *
 * Behance keeps only the iframe width and height attributes and builds its own
 * fixed-height wrapper. Frames at or above 1200 px (Behance's maximum embed
 * width) use width="100%"; narrower frames keep their audited pixel width so
 * side-by-side companions are not stretched and cropped.
 *
 * Usage:
 *   node generate.js --all --deployment-id <id>
 *   node generate.js --slide P001-S01 --deployment-id <id>
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const CONFIG_PATH = path.join(ROOT, '01_AUDIT', 'slides.config.json');
const IMAGES_CSV = path.join(ROOT, '01_AUDIT', 'images.csv');
const LAYOUT_CONFIG_PATH = path.join(ROOT, '01_AUDIT', 'layout.config.json');
const TEMPLATE_PATH = path.join(ROOT, '04_APPS_SCRIPT', 'Slideshow.html');
const DATA_DIR = path.join(ROOT, '03_REBUILT_SLIDESHOWS', 'data');
const PREVIEW_DIR = path.join(ROOT, '03_REBUILT_SLIDESHOWS', 'preview');
const APPS_DIR = path.join(ROOT, '04_APPS_SCRIPT');
const BEHANCE_DIR = path.join(ROOT, '05_BEHANCE_OUTPUT');

const BEHANCE_MAX_WIDTH = 1200;
const EXPECTED_GLOBAL_HASH = '4338768034a434082e6bc3e2ddffb3a4214e5498f097c1cfc0d3429d3eb93d85';
const EXPECTED_SLIDESHOWS = 48;
const EXPECTED_IMAGE_SLOTS = 339;
const EXPECTED_UNIQUE_URLS = 336;
const EXPECTED_PROJECTS = 37;

function fail(message) {
  throw new Error(message);
}

function parseArgs(argv) {
  const options = { slides: [], all: false, deploymentId: null };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--all') {
      options.all = true;
    } else if (arg === '--slide') {
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
  if (options.all && options.slides.length) {
    fail('Use either --all or --slide, not both');
  }
  if (!options.all && options.slides.length === 0) {
    fail('Use --all for the complete build, or --slide <ID> for a preview-only rebuild');
  }
  if (options.deploymentId && !/^[A-Za-z0-9_-]+$/.test(options.deploymentId)) {
    fail('Invalid deployment ID format');
  }
  return options;
}

function readLayoutConfig() {
  if (!fs.existsSync(LAYOUT_CONFIG_PATH)) {
    fail('Missing 01_AUDIT/layout.config.json');
  }
  const config = JSON.parse(fs.readFileSync(LAYOUT_CONFIG_PATH, 'utf8'));
  const setting = config.fit;
  if (setting !== 'all' && !Array.isArray(setting)) {
    fail('layout.config.json "fit" must be "all" or an array of slideshow IDs');
  }
  if (setting === 'all') {
    return { all: true, ids: [] };
  }
  const ids = setting.map(id => String(id).trim().toUpperCase());
  if (ids.some(id => !/^P\d{3}-S\d{2}$/.test(id))) {
    fail('layout.config.json contains an invalid slideshow ID');
  }
  return { all: false, ids: Array.from(new Set(ids)) };
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

function layoutStyleFor(slide) {
  if (slide.layout !== 'fit' || !slide.images || !slide.images.length) return '';
  const first = slide.images[0];
  const width = Number(first.w);
  const height = Number(first.h);
  if (!Number.isFinite(width) || !Number.isFinite(height) ||
      width <= 0 || height <= 0) {
    return '';
  }
  return ' style="--fit-aspect:' + (width / height).toFixed(6) + '"';
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

function buildSlide(source, csvRows, fitIds) {
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
  if (source.image_count !== images.length) {
    fail(source.slideshow_id + ' image_count does not match its image list');
  }

  const embedWidth = Number(source.frame_w);
  // Prefer the audited frame height: the stored aspect is rounded to two
  // decimals, which can shift a tall portrait frame by one pixel.
  const embedHeight = Number.isFinite(source.frame_h) && source.frame_h > 0
    ? source.frame_h
    : Math.round(source.frame_w / source.aspect);
  if (!Number.isFinite(embedWidth) || embedWidth <= 0 ||
      !Number.isFinite(embedHeight) || embedHeight <= 0) {
    fail(source.slideshow_id + ' has an invalid frame width, height, or aspect ratio');
  }

  const snippetWidth = embedWidth >= BEHANCE_MAX_WIDTH ? '100%' : String(embedWidth);

  return {
    slideshow_id: source.slideshow_id,
    project_id: source.project_id,
    project_title: source.project_title,
    section_label: source.section_label,
    descriptor: source.descriptor,
    source_url: source.project_url,
    embed_width: embedWidth,
    embed_height: embedHeight,
    snippet_width: snippetWidth,
    aspect: source.aspect,
    radius_px: source.radius_px,
    object_fit: source.object_fit,
    // Omitted entirely for classic slides so their data files stay unchanged.
    layout: fitIds.has(source.slideshow_id) ? 'fit' : undefined,
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
    .replace('<?= layoutMode ?>', slide.layout === 'fit' ? 'fit' : '')
    .replace('<?!= layoutStyle ?>', layoutStyleFor(slide))
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
    '  width="' + slide.snippet_width + '"',
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

  const layout = readLayoutConfig();
  const configuredIds = config.slideshows.map(source => source.slideshow_id);
  for (const id of layout.ids) {
    if (!configuredIds.includes(id)) {
      fail('layout.config.json contains an unknown slideshow: ' + id);
    }
  }
  const fitIds = new Set(layout.all ? configuredIds : layout.ids);

  const allSlides = config.slideshows.map(source => buildSlide(source, imagesCsv.rows, fitIds));
  const allIds = allSlides.map(slide => slide.slideshow_id);
  if (new Set(allIds).size !== allIds.length) {
    fail('Duplicate slideshow IDs in slides.config.json');
  }
  const knownIds = new Set(allIds);
  for (const row of imagesCsv.rows) {
    if (!knownIds.has(row.slideshow_id)) {
      fail('images.csv contains an unknown slideshow: ' + row.slideshow_id);
    }
  }

  const selectedIds = options.all ? allIds : options.slides;
  for (const id of selectedIds) {
    if (!knownIds.has(id)) fail('Unknown slideshow: ' + id);
  }
  const selected = selectedIds.map(id => allSlides.find(slide => slide.slideshow_id === id));

  // Write the selected data and preview artifacts.
  for (const slide of selected) {
    const dataFile = path.join(DATA_DIR, slide.slideshow_id + '.json');
    writeFile(dataFile, JSON.stringify(slide, null, 2) + '\n');

    const previewFile = path.join(PREVIEW_DIR, slide.slideshow_id + '.html');
    writeFile(previewFile, renderPreview(template, slide));
  }

  // The server-side map is always complete. A preview-only rebuild can never
  // drop another slideshow from the deployed lookup.
  const slideMap = {};
  for (const slide of allSlides) {
    slideMap[slide.slideshow_id] = slide;
  }

  const dataSource = [
    '/**',
    ' * Generated by tools/generate.js. Do not edit by hand.',
    ' * Current build: all 48 audited slideshows.',
    ' * The SLIDES lookup is server-side and is never sent wholesale to a client.',
    ' */',
    'var SLIDES = ' + JSON.stringify(slideMap, null, 2) + ';',
    ''
  ].join('\n');
  writeFile(path.join(APPS_DIR, 'SlidesData.gs'), dataSource);

  // Rebuild every project snippet from the full set, so a preview-only rebuild
  // cannot leave a stale width or height behind.
  const byProject = new Map();
  for (const slide of allSlides) {
    if (!byProject.has(slide.project_id)) byProject.set(slide.project_id, []);
    byProject.get(slide.project_id).push(slide);
  }
  if (byProject.size !== EXPECTED_PROJECTS) {
    fail('Expected ' + EXPECTED_PROJECTS + ' projects with slideshows, found ' + byProject.size);
  }

  for (const [projectId, slides] of byProject) {
    const first = slides[0];
    const lines = [
      '# ' + projectId + ' — ' + first.project_title,
      '',
      'Generated embeds. Every snippet below loads exactly one slideshow and must',
      'be placed in its own Behance project section. The URL points at the shared',
      'standalone Web App deployment; the production deployment is untouched.',
      '',
      'Behance keeps only the iframe width and height and adds its own fixed-height',
      'wrapper. Frames at or above ' + BEHANCE_MAX_WIDTH + ' px use `width="100%"`;',
      'narrower frames keep their audited pixel width so they are not stretched.',
      ''
    ];
    for (const slide of slides) {
      lines.push(
        '## ' + slide.slideshow_id + ' — ' + slide.section_label,
        '',
        'Width: ' + (slide.snippet_width === '100%'
          ? '100% (audited frame ' + slide.embed_width + ' px)'
          : slide.snippet_width + ' px (audited frame width)') + '.',
        'Height: ' + slide.embed_height + ' px (audited frame height).',
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
      width: slide.snippet_width,
      height: slide.embed_height,
      layout: slide.layout || 'classic'
    })),
    serverMap: allSlides.length,
    projects: byProject.size,
    deployment: options.deploymentId || '<NEW_DEPLOYMENT_ID>',
    note: 'Complete server map and all project snippets rebuilt.'
  }, null, 2));
}

try {
  main();
} catch (error) {
  console.error('ERROR: ' + error.message);
  process.exit(1);
}
