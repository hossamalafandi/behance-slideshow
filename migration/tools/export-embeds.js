#!/usr/bin/env node
'use strict';

/**
 * Export every generated Behance embed into two consolidated deliverables:
 *
 *   05_BEHANCE_OUTPUT/ALL_EMBEDS.md
 *   05_BEHANCE_OUTPUT/ALL_EMBEDS.csv
 *
 * The Markdown file is grouped by project and is the primary copy/paste source.
 * The CSV contains one row per slideshow with the permanent ID, audited frame
 * dimensions, declared iframe dimensions, image count, and a single-line embed
 * code for spreadsheet use.
 *
 * This script reads only the generated JSON data files. It does not fetch,
 * open, or inspect any image, and it does not deploy or publish anything.
 *
 * Usage:
 *   node export-embeds.js [--deployment-id <id>]
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CONFIG_PATH = path.join(ROOT, '01_AUDIT', 'slides.config.json');
const DATA_DIR = path.join(ROOT, '03_REBUILT_SLIDESHOWS', 'data');
const OUTPUT_DIR = path.join(ROOT, '05_BEHANCE_OUTPUT');
const DEFAULT_DEPLOYMENT_ID =
  'AKfycbzV7OufIj8Q6yLZaKxccF_ETSNJ3l76gMV_s0cvIzkPnxND7ofDwOMn35gdPO_JxlZfHA';
const EXPECTED_SLIDESHOWS = 47;
const EXPECTED_PROJECTS = 36;

function fail(message) {
  throw new Error(message);
}

function option(name, fallback) {
  const index = process.argv.indexOf('--' + name);
  return index !== -1 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

function csvField(value) {
  const text = String(value);
  return /[",\r\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
}

function markdownCell(value) {
  return String(value).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

function buildEmbedUrl(deploymentId, slideshowId) {
  return 'https://script.google.com/macros/s/' + deploymentId + '/exec?slide=' + slideshowId;
}

function buildSnippet(deploymentId, slide) {
  return [
    '<iframe',
    '  src="' + buildEmbedUrl(deploymentId, slide.slideshow_id) + '"',
    '  width="' + slide.snippet_width + '"',
    '  height="' + slide.embed_height + '"',
    '  style="border:0;border-radius:20px;overflow:hidden"',
    '  loading="lazy"',
    '  allowfullscreen',
    '  allow="fullscreen">',
    '</iframe>'
  ].join('\n');
}

function buildCompactSnippet(deploymentId, slide) {
  return '<iframe src="' + buildEmbedUrl(deploymentId, slide.slideshow_id) +
    '" width="' + slide.snippet_width + '" height="' + slide.embed_height +
    '" style="border:0;border-radius:20px;overflow:hidden" loading="lazy"' +
    ' allowfullscreen allow="fullscreen"></iframe>';
}

function iframeWidthLabel(slide) {
  return slide.snippet_width === '100%'
    ? '100% (audited frame ' + slide.embed_width + ' px)'
    : slide.snippet_width + ' px';
}

function main() {
  const deploymentId = option('deployment-id',
    process.env.SLIDESHOW_DEPLOYMENT_ID || DEFAULT_DEPLOYMENT_ID);
  if (!/^[A-Za-z0-9_-]+$/.test(deploymentId)) {
    fail('Invalid deployment ID format');
  }

  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  if (!Array.isArray(config.slideshows) ||
      config.slideshows.length !== EXPECTED_SLIDESHOWS) {
    fail('Expected ' + EXPECTED_SLIDESHOWS + ' slideshows in slides.config.json');
  }

  const slides = config.slideshows.map(source => {
    const file = path.join(DATA_DIR, source.slideshow_id + '.json');
    if (!fs.existsSync(file)) {
      fail('Missing generated data file: ' + source.slideshow_id + '.json');
    }
    const slide = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (slide.slideshow_id !== source.slideshow_id) {
      fail('Data file ID mismatch for ' + source.slideshow_id);
    }
    if (slide.project_id !== source.project_id) {
      fail('Data file project mismatch for ' + source.slideshow_id);
    }
    if (!slide.snippet_width || !slide.embed_width || !slide.embed_height ||
        !slide.image_count || !Array.isArray(slide.images)) {
      fail('Data file is incomplete for ' + source.slideshow_id);
    }
    if (slide.images.length !== slide.image_count) {
      fail('Image count mismatch for ' + source.slideshow_id);
    }
    return slide;
  });

  const byProject = new Map();
  for (const slide of slides) {
    if (!byProject.has(slide.project_id)) byProject.set(slide.project_id, []);
    byProject.get(slide.project_id).push(slide);
  }
  if (byProject.size !== EXPECTED_PROJECTS) {
    fail('Expected ' + EXPECTED_PROJECTS + ' projects, found ' + byProject.size);
  }

  const markdown = [
    '# All 47 Behance Embed Codes',
    '',
    'This is the complete copy/paste source for every slideshow. The codes are',
    'grouped by project in Behance page order. Each code block loads exactly one',
    'slideshow through its permanent ID and is independent of every other embed.',
    '',
    '- **Deployment:** `' + deploymentId + '`',
    '- **Deployment version:** 3',
    '- **Slideshows:** 47',
    '- **Projects:** 36',
    '- **Image slots:** 335 (exact remote URLs and order preserved)',
    '',
    'Use the project section below, or the quick-reference table, to find the',
    'slideshow you need. Copy the entire code block, including the `<iframe>` tags.',
    '',
    '> Do not paste more than one slideshow into a single embed. P024 is blocked',
    '> and P036 has no slideshow; both are listed at the end.',
    '',
    '## Quick reference',
    '',
    '| # | Project | Slideshow | Section | Frame | Iframe | Images |',
    '|---:|---|---|---|---|---|---:|'
  ];

  let number = 0;
  for (const [projectId, projectSlides] of byProject) {
    for (const slide of projectSlides) {
      number += 1;
      markdown.push('| ' + number +
        ' | ' + markdownCell(projectId + ' — ' + slide.project_title) +
        ' | `' + slide.slideshow_id + '`' +
        ' | ' + markdownCell(slide.section_label) +
        ' | ' + slide.embed_width + ' × ' + slide.embed_height +
        ' | ' + markdownCell(iframeWidthLabel(slide) + ' × ' + slide.embed_height + ' px') +
        ' | ' + slide.image_count + ' |');
    }
  }

  markdown.push('');
  for (const [projectId, projectSlides] of byProject) {
    const first = projectSlides[0];
    markdown.push(
      '## ' + projectId + ' — ' + first.project_title,
      ''
    );
    for (const slide of projectSlides) {
      markdown.push(
        '### ' + slide.slideshow_id + ' — ' + slide.section_label,
        '',
        '- **Permanent ID:** `' + slide.slideshow_id + '`',
        '- **Audited frame:** ' + slide.embed_width + ' × ' + slide.embed_height + ' px',
        '- **Iframe dimensions:** `width="' + slide.snippet_width + '"` × ' +
          '`height="' + slide.embed_height + '"`',
        '- **Images:** ' + slide.image_count,
        '- **Source:** ' + slide.source_url,
        ''
      );
      if (slide.repair_note) {
        markdown.push('**Repair:** ' + slide.repair_note, '');
      }
      markdown.push(
        '```html',
        buildSnippet(deploymentId, slide),
        '```',
        ''
      );
    }
  }

  markdown.push(
    '## Not included',
    '',
    '| Project | Status | Reason |',
    '|---|---|---|',
    '| P024 | BLOCKED | The audited source link truncates to `http://ww`; no valid slideshow URL exists. The ID is reserved and no code was invented. |',
    '| P036 | NO_SLIDESHOW | The project page contains static images only; there is no interactive slideshow to migrate. |',
    ''
  );

  const csvHeader = [
    'project_order',
    'project_id',
    'project_title',
    'slideshow_id',
    'section_label',
    'frame_width_px',
    'frame_height_px',
    'iframe_width',
    'iframe_height_px',
    'image_count',
    'deployment_url',
    'source_url',
    'embed_code'
  ];
  const csvRows = [];
  let projectOrder = 0;
  for (const [projectId, projectSlides] of byProject) {
    projectOrder += 1;
    for (const slide of projectSlides) {
      csvRows.push([
        projectOrder,
        projectId,
        slide.project_title,
        slide.slideshow_id,
        slide.section_label,
        slide.embed_width,
        slide.embed_height,
        slide.snippet_width,
        slide.embed_height,
        slide.image_count,
        'https://script.google.com/macros/s/' + deploymentId + '/exec',
        slide.source_url,
        buildCompactSnippet(deploymentId, slide)
      ]);
    }
  }
  const csv = [csvHeader, ...csvRows]
    .map(row => row.map(csvField).join(','))
    .join('\n') + '\n';

  const readme = [
    '# Behance Embed Output',
    '',
    'All 47 slideshows are generated, deployed, and ready for manual copy/paste.',
    '',
    '## Files',
    '',
    '| File | Use |',
    '|---|---|',
    '| `ALL_EMBEDS.md` | **Primary copy/paste source.** Every code block, grouped by project, with IDs and dimensions. |',
    '| `ALL_EMBEDS.csv` | Spreadsheet version: one row per slideshow with a single-line embed code. |',
    '| `P001.md` … `P038.md` | Per-project files, in Behance page order. Use these when working one project at a time. |',
    '',
    '## Deployment',
    '',
    '`https://script.google.com/macros/s/' + deploymentId + '/exec`',
    '',
    'Deployment version 3. Every code uses one `?slide=<ID>` value and loads',
    'exactly one slideshow. The production Apps Script deployment is untouched.',
    '',
    '## How to use',
    '',
    '1. Open `ALL_EMBEDS.md` (or the per-project file for the project you are editing).',
    '2. Find the permanent slideshow ID, for example `P001-S01`.',
    '3. Copy the entire `<iframe>…</iframe>` code block.',
    '4. Paste it into the matching Behance project section.',
    '5. Keep one slideshow per embed; do not combine codes.',
    '',
    'The declared width and height are the values Behance reads. Frames at or',
    'above 1200 px use `width="100%"`; narrower frames keep their audited pixel',
    'width. Heights are per slideshow and must not be changed.',
    '',
    '## Not included',
    '',
    '- **P024** is blocked: its source link truncates to `http://ww`, so no URL',
    '  exists. The permanent ID is reserved; no code was invented.',
    '- **P036** has no slideshow: its project page contains static images only.',
    ''
  ].join('\n');

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUTPUT_DIR, 'ALL_EMBEDS.md'), markdown.join('\n'), 'utf8');
  fs.writeFileSync(path.join(OUTPUT_DIR, 'ALL_EMBEDS.csv'), csv, 'utf8');
  fs.writeFileSync(path.join(OUTPUT_DIR, 'README.md'), readme, 'utf8');

  console.log(JSON.stringify({
    slideshows: slides.length,
    projects: byProject.size,
    imageSlots: slides.reduce((sum, slide) => sum + slide.image_count, 0),
    deployment: deploymentId,
    outputs: [
      'migration/05_BEHANCE_OUTPUT/ALL_EMBEDS.md',
      'migration/05_BEHANCE_OUTPUT/ALL_EMBEDS.csv',
      'migration/05_BEHANCE_OUTPUT/README.md'
    ]
  }, null, 2));
}

try {
  main();
} catch (error) {
  console.error('ERROR: ' + error.message);
  process.exit(1);
}
