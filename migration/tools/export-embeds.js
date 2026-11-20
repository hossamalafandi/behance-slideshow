#!/usr/bin/env node
'use strict';

/**
 * Export every generated Behance embed into consolidated deliverables:
 *
 *   05_BEHANCE_OUTPUT/ALL_EMBEDS.md
 *   05_BEHANCE_OUTPUT/ALL_EMBEDS.csv
 *   05_BEHANCE_OUTPUT/TOOLS_USED_EMBEDS.md
 *   05_BEHANCE_OUTPUT/TOOLS_USED_EMBEDS.csv
 *
 * The Markdown files are grouped by project and are the primary copy/paste
 * sources. The CSV files contain one row per embed with a single-line code for
 * spreadsheet use.
 *
 * The slideshow codes are iframes. The TOOLS USED codes are the original
 * self-contained HTML/CSS software-logo strips from Google Sites.
 *
 * This script reads only the generated JSON data files and the extracted tools
 * JSON. It does not fetch, open, or inspect any image, and it does not deploy or
 * publish anything.
 *
 * Usage:
 *   node export-embeds.js [--deployment-id <id>]
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CONFIG_PATH = path.join(ROOT, '01_AUDIT', 'slides.config.json');
const TOOLS_PATH = path.join(ROOT, '01_AUDIT', 'tools-embeds.json');
const DATA_DIR = path.join(ROOT, '03_REBUILT_SLIDESHOWS', 'data');
const OUTPUT_DIR = path.join(ROOT, '05_BEHANCE_OUTPUT');
const DEFAULT_DEPLOYMENT_ID =
  'AKfycbzV7OufIj8Q6yLZaKxccF_ETSNJ3l76gMV_s0cvIzkPnxND7ofDwOMn35gdPO_JxlZfHA';
const EXPECTED_SLIDESHOWS = 47;
const EXPECTED_PROJECTS = 36;
const EXPECTED_TOOLS = 37;

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

function buildToolsSnippet(tools) {
  return [
    '<meta charset="UTF-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<title>' + tools.title + '</title>',
    '<style>',
    tools.style.trim(),
    '</style>',
    tools.row
  ].join('\n');
}

function buildCompactToolsSnippet(tools) {
  return '<meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<title>' + tools.title + '</title>' +
    '<style>' + tools.style.trim().replace(/\s+/g, ' ') + '</style>' +
    tools.row.replace(/\s+/g, ' ');
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

  const tools = JSON.parse(fs.readFileSync(TOOLS_PATH, 'utf8'));
  if (!Array.isArray(tools) || tools.length !== EXPECTED_TOOLS) {
    fail('Expected ' + EXPECTED_TOOLS + ' TOOLS USED strips in tools-embeds.json');
  }
  const toolsByProject = new Map();
  for (const entry of tools) {
    if (!/^P\d{3}$/.test(entry.project_id || '') ||
        !entry.project_title || !entry.url ||
        !Number.isFinite(entry.width) || !Number.isFinite(entry.height) ||
        !entry.title || !entry.style || !entry.row ||
        !Array.isArray(entry.logos) || !entry.logos.length) {
      fail('TOOLS USED entry is incomplete: ' + (entry.project_id || 'unknown'));
    }
    if (toolsByProject.has(entry.project_id)) {
      fail('Duplicate TOOLS USED entry for ' + entry.project_id);
    }
    toolsByProject.set(entry.project_id, entry);
  }
  for (const projectId of byProject.keys()) {
    if (!toolsByProject.has(projectId)) {
      fail('Missing TOOLS USED entry for ' + projectId);
    }
  }

  const projectIds = Array.from(new Set([
    ...byProject.keys(),
    ...toolsByProject.keys()
  ])).sort();
  if (projectIds.length !== EXPECTED_TOOLS) {
    fail('Expected ' + EXPECTED_TOOLS + ' projects with embed codes, found ' +
      projectIds.length);
  }

  const markdown = [
    '# All Behance Embed Codes',
    '',
    'This is the complete copy/paste source for every slideshow and every',
    'TOOLS USED strip. The sections are grouped by project in Behance page order.',
    'Each slideshow code loads exactly one slideshow through its permanent ID and',
    'is independent of every other embed. Each TOOLS USED code is the original',
    'self-contained HTML/CSS software-logo strip, not an iframe.',
    '',
    '- **Deployment:** `' + deploymentId + '`',
    '- **Deployment version:** 3',
    '- **Slideshows:** 47',
    '- **Slideshow projects:** 36',
    '- **TOOLS USED codes:** 37',
    '- **Image slots:** 335 (exact remote URLs and order preserved)',
    '',
    'Use the project sections below, or the slideshow quick-reference table, to',
    'find what you need. Copy the entire code block for each embed.',
    '',
    '> Do not paste more than one slideshow into a single embed. P024 is blocked;',
    '> P036 has no slideshow but its TOOLS USED code is included.',
    '',
    '## Slideshow quick reference',
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
  for (const projectId of projectIds) {
    const projectSlides = byProject.get(projectId) || [];
    const toolsEntry = toolsByProject.get(projectId);
    const projectTitle = projectSlides.length
      ? projectSlides[0].project_title
      : toolsEntry.project_title;
    markdown.push(
      '## ' + projectId + ' — ' + projectTitle,
      ''
    );
    if (!projectSlides.length) {
      markdown.push(
        '> No interactive slideshow on this project. The TOOLS USED code below',
        '> is the only custom embed on the page.',
        ''
      );
    }
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
    if (toolsEntry) {
      markdown.push(
        '### ' + projectId + '-TOOLS — TOOLS USED software logos',
        '',
        '- **Permanent ID:** `' + projectId + '-TOOLS`',
        '- **Strip dimensions:** ' + toolsEntry.width + ' × ' + toolsEntry.height + ' px',
        '- **Logos:** ' + toolsEntry.logos.length + ' (' +
          toolsEntry.logos.map(logo => logo.alt).join(', ') + ')',
        '- **Source:** ' + toolsEntry.url,
        '',
        '```html',
        buildToolsSnippet(toolsEntry),
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
    '| P024 | BLOCKED | The audited source link truncates to `http://ww`; no project page exists, so there is no slideshow or TOOLS USED code. The ID is reserved and no code was invented. |',
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

  const toolsMarkdown = [
    '# All 37 TOOLS USED Embed Codes',
    '',
    'These are the original self-contained HTML/CSS software-logo strips from the',
    'matching Google Sites project pages. They are raw HTML blocks, not iframes.',
    'Paste one code into the TOOLS USED section of the matching Behance project.',
    '',
    '- **Codes:** 37',
    '- **Strip height:** 127 px on every project',
    '- **Logos per strip:** 4–5',
    '- **Image URLs:** exact originals, unchanged',
    '',
    '## Quick reference',
    '',
    '| # | Project | Embed ID | Frame | Logos |',
    '|---:|---|---|---|---:|'
  ];
  let toolsNumber = 0;
  for (const projectId of projectIds) {
    const toolsEntry = toolsByProject.get(projectId);
    if (!toolsEntry) continue;
    toolsNumber += 1;
    toolsMarkdown.push('| ' + toolsNumber +
      ' | ' + markdownCell(projectId + ' — ' + toolsEntry.project_title) +
      ' | `' + projectId + '-TOOLS`' +
      ' | ' + toolsEntry.width + ' × ' + toolsEntry.height +
      ' | ' + toolsEntry.logos.length + ' |');
  }
  toolsMarkdown.push('');
  for (const projectId of projectIds) {
    const toolsEntry = toolsByProject.get(projectId);
    if (!toolsEntry) continue;
    toolsMarkdown.push(
      '## ' + projectId + ' — ' + toolsEntry.project_title,
      '',
      '- **Embed ID:** `' + projectId + '-TOOLS`',
      '- **Strip dimensions:** ' + toolsEntry.width + ' × ' + toolsEntry.height + ' px',
      '- **Logos:** ' + toolsEntry.logos.length + ' (' +
        toolsEntry.logos.map(logo => logo.alt).join(', ') + ')',
      '- **Source:** ' + toolsEntry.url,
      '',
      '```html',
      buildToolsSnippet(toolsEntry),
      '```',
      ''
    );
  }
  toolsMarkdown.push(
    '## Not included',
    '',
    'P024 has no audited project page, so it has no TOOLS USED code.',
    ''
  );

  const toolsCsvHeader = [
    'project_order',
    'project_id',
    'project_title',
    'embed_id',
    'strip_width_px',
    'strip_height_px',
    'logo_count',
    'logo_alts',
    'logo_urls',
    'source_url',
    'embed_code'
  ];
  const toolsCsvRows = [];
  projectIds.forEach((projectId, index) => {
    const toolsEntry = toolsByProject.get(projectId);
    if (!toolsEntry) return;
    toolsCsvRows.push([
      index + 1,
      projectId,
      toolsEntry.project_title,
      projectId + '-TOOLS',
      toolsEntry.width,
      toolsEntry.height,
      toolsEntry.logos.length,
      toolsEntry.logos.map(logo => logo.alt).join(' | '),
      toolsEntry.logos.map(logo => logo.src).join(' | '),
      toolsEntry.url,
      buildCompactToolsSnippet(toolsEntry)
    ]);
  });
  const toolsCsv = [toolsCsvHeader, ...toolsCsvRows]
    .map(row => row.map(csvField).join(','))
    .join('\n') + '\n';

  const readme = [
    '# Behance Embed Output',
    '',
    'All 47 slideshows and all 37 TOOLS USED strips are generated and ready for',
    'manual copy/paste.',
    '',
    '## Files',
    '',
    '| File | Use |',
    '|---|---|',
    '| `ALL_EMBEDS.md` | **Primary copy/paste source.** Every slideshow and TOOLS USED code block, grouped by project, with IDs and dimensions. |',
    '| `ALL_EMBEDS.csv` | Spreadsheet version of the 47 slideshow codes, one row per slideshow. |',
    '| `TOOLS_USED_EMBEDS.md` | All 37 TOOLS USED codes on their own, grouped by project. |',
    '| `TOOLS_USED_EMBEDS.csv` | Spreadsheet version of the 37 TOOLS USED codes. |',
    '| `P001.md` … `P038.md` | Per-project slideshow files. These contain slideshows only; use `ALL_EMBEDS.md` or `TOOLS_USED_EMBEDS.md` for TOOLS USED codes. |',
    '',
    '## Deployment',
    '',
    '`https://script.google.com/macros/s/' + deploymentId + '/exec`',
    '',
    'Deployment version 3. Every slideshow code uses one `?slide=<ID>` value and',
    'loads exactly one slideshow. The production Apps Script deployment is',
    'untouched. TOOLS USED codes do not use the deployment; they are the original',
    'self-contained HTML/CSS logo strips.',
    '',
    '## How to use',
    '',
    '### Slideshows',
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
    '### TOOLS USED',
    '',
    '1. In `ALL_EMBEDS.md`, scroll to the matching project and find the',
    '   `Pxxx-TOOLS — TOOLS USED software logos` heading.',
    '2. Copy the entire HTML code block.',
    '3. Paste it into the TOOLS USED embed on that Behance project.',
    '',
    'Each strip is 127 px high with 4–5 logos. The logo image URLs are the exact',
    'originals and must not be changed.',
    '',
    '## Not included',
    '',
    '- **P024** is blocked: its source link truncates to `http://ww`, so no project',
    '  page exists. The permanent ID is reserved; no slideshow or TOOLS USED code',
    '  was invented.',
    '- **P036** has no slideshow, but its TOOLS USED code is included in both',
    '  TOOLS USED files and in `ALL_EMBEDS.md`.',
    ''
  ].join('\n');

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUTPUT_DIR, 'ALL_EMBEDS.md'), markdown.join('\n'), 'utf8');
  fs.writeFileSync(path.join(OUTPUT_DIR, 'ALL_EMBEDS.csv'), csv, 'utf8');
  fs.writeFileSync(path.join(OUTPUT_DIR, 'TOOLS_USED_EMBEDS.md'),
    toolsMarkdown.join('\n'), 'utf8');
  fs.writeFileSync(path.join(OUTPUT_DIR, 'TOOLS_USED_EMBEDS.csv'), toolsCsv, 'utf8');
  fs.writeFileSync(path.join(OUTPUT_DIR, 'README.md'), readme, 'utf8');

  console.log(JSON.stringify({
    slideshows: slides.length,
    projects: byProject.size,
    imageSlots: slides.reduce((sum, slide) => sum + slide.image_count, 0),
    toolsStrips: tools.length,
    deployment: deploymentId,
    outputs: [
      'migration/05_BEHANCE_OUTPUT/ALL_EMBEDS.md',
      'migration/05_BEHANCE_OUTPUT/ALL_EMBEDS.csv',
      'migration/05_BEHANCE_OUTPUT/TOOLS_USED_EMBEDS.md',
      'migration/05_BEHANCE_OUTPUT/TOOLS_USED_EMBEDS.csv',
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
