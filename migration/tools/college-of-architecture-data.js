'use strict';

/**
 * Source data for the standalone College of Architecture and Arts page.
 *
 * Page source: Google Sites draft
 *   /p/1i355mqTkgrZEzYxNElpMK7062TzOZF3B
 *
 * The two presentation boards and the hero are Google Sites images, so they
 * are copied into assets/college-of-architecture-and-arts/ (page-only
 * exception, see IMAGE_HOSTING_POLICY.md). The seven renders keep their exact
 * Imgur URLs.
 */

const DEPLOYMENT_ID =
  'AKfycbzV7OufIj8Q6yLZaKxccF_ETSNJ3l76gMV_s0cvIzkPnxND7ofDwOMn35gdPO_JxlZfHA';

const PAGE_TITLE = 'College of Architecture and Arts — Hossam Alafandi';
const PAGE_CODE = 'college-of-architecture-and-arts';
const EMBED_HEIGHT = 2800;
const EMBED_WIDTH = '100%';
const PRODUCTION_ASSET_BASE =
  'https://cdn.jsdelivr.net/gh/hossamalafandi/behance-slideshow@main/assets/college-of-architecture-and-arts/';
const PREVIEW_ASSET_BASE = '/assets/college-of-architecture-and-arts/';

const HERO = {
  file: 'hero',
  alt: 'College of Architecture and Arts seen from above at dusk',
  kicker: 'GRADUATION PROJECT',
  title: 'COLLEGE OF ARCHITECTURE AND ARTS',
  school: 'AL-WATANIYA PRIVATE UNIVERSITY',
  year: '- 2024 -',
  semester: '5TH YEAR, FIRST SEMESTER'
};

const OVERVIEW_TEXT =
  'This architectural project, the College of Architecture and Arts, serves approximately ' +
  '1,500 students. The project integrates educational, administrative, and social spaces ' +
  'within an efficient campus layout, emphasizing accessibility and inclusivity. Key ' +
  'facilities include lecture halls, studios, laboratories, libraries, exhibition halls, ' +
  'and a central auditorium to support learning and collaboration. The design balances ' +
  'functional needs, spatial organization, and architectural expression, promoting academic ' +
  'excellence and social interaction.';

const STATS = [
  { value: '1,500', label: 'STUDENTS' },
  { value: '5TH', label: 'YEAR' },
  { value: '02', label: 'BOARDS' },
  { value: '07', label: 'RENDERS' }
];

const PROGRAM = [
  'LECTURE HALLS',
  'DESIGN STUDIOS',
  'LABORATORIES',
  'LIBRARIES',
  'EXHIBITION HALLS',
  'AUDITORIUM'
];

const BOARDS = [
  {
    file: 'board-1',
    plate: 'PLATE 01',
    title: 'SITE & PROGRAM',
    meta: 'SITE STRATEGY · EXPLODED PROGRAM · SECTIONS',
    alt: 'Presentation board one: site plan, floor plans, exploded programme diagram and section drawings'
  },
  {
    file: 'board-2',
    plate: 'PLATE 02',
    title: 'SHOTS & CONCEPT',
    meta: 'MASTER PLAN · CONCEPT SKETCHES · AERIAL SHOTS',
    alt: 'Presentation board two: master plan, concept sketches and aerial renders of the college'
  }
];

const RENDERS = [
  {
    id: 'rsQGtCg',
    code: 'EXT-01',
    alt: 'Aerial view of the college at dusk with the illuminated courtyard'
  },
  {
    id: 'dX7JCC7',
    code: 'EXT-02',
    alt: 'Close aerial view of the white looping roof and warm-lit courtyard'
  },
  {
    id: 'KgSoAxJ',
    code: 'EXT-03',
    alt: 'Elevated view of the campus, landscaped forecourt and parking court'
  },
  {
    id: 'GoBu1tK',
    code: 'EXT-04',
    alt: 'Aerial view of the main entrance, canopy and parking court at dusk'
  },
  {
    id: 'RDsNRTZ',
    code: 'EXT-05',
    alt: 'Aerial view of the angular wings and inner courtyard'
  },
  {
    id: 'w2F0hT6',
    code: 'EXT-06',
    alt: 'Courtyard view looking up at the layered white canopies'
  },
  {
    id: 'HEELBsD',
    code: 'EXT-07',
    alt: 'Courtyard with planted islands beneath the curved canopy'
  }
];

const TOOLS = [
  { name: '3ds Max', id: 'znQK1ti' },
  { name: 'Revit', id: 'STZTRZr' },
  { name: 'AutoCAD', id: 'eusbdWx' },
  { name: 'Photoshop', id: '6sW1ghq' },
  { name: 'Lumion', id: '8y2GzCS' }
];

const COPYRIGHT_TEXT = '© 2025 HOSSAM ALAFANDI. All rights reserved.';

function assetUrl(base, name, size) {
  return base + name + '-' + size + '.jpg';
}

function toolUrl(id) {
  return 'https://i.imgur.com/' + id + '.png';
}

function renderUrl(id) {
  return 'https://i.imgur.com/' + id + '.jpeg';
}

function renderThumbUrl(id) {
  return 'https://i.imgur.com/' + id + 'h.jpg';
}

function embedUrl(deploymentId) {
  return 'https://script.google.com/macros/s/' +
    (deploymentId || DEPLOYMENT_ID) + '/exec?page=' + PAGE_CODE;
}

function embedSnippet(deploymentId) {
  return [
    '<iframe',
    '  src="' + embedUrl(deploymentId) + '"',
    '  width="' + EMBED_WIDTH + '"',
    '  height="' + EMBED_HEIGHT + '"',
    '  style="border:0;overflow:hidden"',
    '  loading="lazy"',
    '  allowfullscreen',
    '  allow="autoplay; fullscreen; picture-in-picture; encrypted-media">',
    '</iframe>'
  ].join('\n');
}

module.exports = {
  DEPLOYMENT_ID,
  PAGE_TITLE,
  PAGE_CODE,
  EMBED_HEIGHT,
  EMBED_WIDTH,
  PRODUCTION_ASSET_BASE,
  PREVIEW_ASSET_BASE,
  HERO,
  OVERVIEW_TEXT,
  STATS,
  PROGRAM,
  BOARDS,
  RENDERS,
  TOOLS,
  COPYRIGHT_TEXT,
  assetUrl,
  toolUrl,
  renderUrl,
  renderThumbUrl,
  embedUrl,
  embedSnippet
};
