'use strict';

/**
 * Source data for the standalone African Cafeteria page.
 *
 * Page source: Google Sites
 *   /view/hossam-alafandi/collage/african-cafeteria
 *
 * The hero and the two presentation boards are Google Sites images, so they are
 * copied into assets/african-cafeteria/ (page-only exception, see
 * IMAGE_HOSTING_POLICY.md). The eight renders keep their exact Imgur URLs.
 */

const DEPLOYMENT_ID =
  'AKfycbzV7OufIj8Q6yLZaKxccF_ETSNJ3l76gMV_s0cvIzkPnxND7ofDwOMn35gdPO_JxlZfHA';

const PAGE_TITLE = 'African Cafeteria — Hossam Alafandi';
const PAGE_CODE = 'african-cafeteria';
const EMBED_HEIGHT = 3980;
const EMBED_WIDTH = '100%';
const PRODUCTION_ASSET_BASE =
  'https://cdn.jsdelivr.net/gh/hossamalafandi/behance-slideshow@main/assets/african-cafeteria/';
const PREVIEW_ASSET_BASE = '/assets/african-cafeteria/';

const HERO = {
  file: 'hero',
  alt: 'Woven thatch ceiling and rattan pendants above the Tea House sign',
  kicker: 'ACADEMIC PROJECT / INTERIOR DESIGN',
  title: 'African Cafeteria',
  school: 'AL-WATANIYA PRIVATE UNIVERSITY',
  semester: '5TH YEAR, FIRST SEMESTER',
  year: '- 2024 -'
};

const OVERVIEW = {
  lead: 'A social and cultural hub.',
  eyebrow: 'THE CONCEPT',
  paragraphs: [
    {
      label: 'THE PROPOSAL',
      text: 'The project is an interior design proposal for a university cafeteria, ' +
        'developed within the framework of exploring diverse decorative styles. The ' +
        'chosen concept centers on the African aesthetic, aiming to create a vibrant ' +
        'and authentic spatial experience that reflects cultural identity while ' +
        'maintaining functionality and comfort.'
    },
    {
      label: 'MATERIALITY',
      text: 'The design approach was grounded in research into the materials and ' +
        'techniques most common in African environments. Natural elements such as ' +
        'clay, wood, brick, straw, and African plants were employed to emphasize ' +
        'warmth and authenticity. In addition, traditional African accessories and ' +
        'handcrafted details were incorporated to narrate the lifestyle and heritage ' +
        'of the continent, enriching the atmosphere with cultural depth.'
    },
    {
      label: 'ATMOSPHERE',
      text: 'The cafeteria space is conceived not only as a place for dining but as ' +
        'a social and cultural hub, where the design addresses the need for an ' +
        'engaging and immersive environment. The spatial composition, material ' +
        'palette, and decorative details come together to transform the cafeteria ' +
        'into a welcoming setting that harmonizes functionality with a distinctive ' +
        'aesthetic identity.'
    }
  ],
  quote: 'The cafeteria space is conceived not only as a place for dining but as a ' +
    'social and cultural hub.'
};

const MATERIALS = [
  {
    name: 'CLAY',
    note: 'EARTHEN PLASTER & HAND-FORMED VESSELS',
    key: 'clay',
    file: 'material-clay',
    alt: 'Hand-formed clay vessels and a clay planter'
  },
  {
    name: 'WOOD',
    note: 'CARVED SCREENS, BEAMS & LIVE-EDGE TABLES',
    key: 'wood',
    file: 'material-wood',
    alt: 'Live-edge timber table and carved wooden chairs'
  },
  {
    name: 'BRICK',
    note: 'WARM MASONRY ARCHES & RECLAIMED WALLS',
    key: 'brick',
    file: 'material-brick',
    alt: 'Warm brick arches in the dining hall'
  },
  {
    name: 'STRAW',
    note: 'THATCHED CANOPIES & WOVEN LIGHTING',
    key: 'straw',
    file: 'material-straw',
    alt: 'Thatched ceiling and a woven pendant light'
  },
  {
    name: 'PLANTS',
    note: 'CACTI & AFRICAN GREENERY',
    key: 'plants',
    file: 'material-plants',
    alt: 'Cactus garden beside the lounge seating'
  }
];

const BOARDS = [
  {
    file: 'board-1',
    plate: 'PLATE 01',
    title: 'PLANS & SECTIONS',
    meta: 'GROUND FLOOR · MAIN SECTION · FRONT ELEVATION · CUTAWAY',
    alt: 'Presentation board one: ground-floor plan, main section, front elevation, cutaway and material notes'
  },
  {
    file: 'board-2',
    plate: 'PLATE 02',
    title: 'MATERIALS & DETAILS',
    meta: 'SITE PHOTOS · DETAIL SHEET · WALL DETAIL · PLAN',
    alt: 'Presentation board two: interior atmosphere photographs, detail sheet, wall detail and plan'
  }
];

const RENDERS = [
  {
    id: 'mqO7Tux',
    code: 'INT-01',
    alt: 'Dining hall with arched brick niches, woven pendants and a timber ceiling'
  },
  {
    id: '5yiTXg8',
    code: 'INT-02',
    alt: 'Lounge corner with rattan chairs, an African mask and a cactus garden'
  },
  {
    id: 'JqSmE5t',
    code: 'INT-03',
    alt: 'Tea House neon sign above a live-edge communal table'
  },
  {
    id: 'dOOMI2U',
    code: 'INT-04',
    alt: 'Coffee bar with a slatted timber counter and woven pendant lights'
  },
  {
    id: 'vXf69lo',
    code: 'INT-05',
    alt: 'Close-up of a woven bamboo pendant under a thatched ceiling'
  },
  {
    id: '9ihs7gg',
    code: 'INT-06',
    alt: 'Carved African mask and spear installation beside rattan seating'
  },
  {
    id: 'GWAWab9',
    code: 'INT-07',
    alt: 'African headrest sculpture on a plaster wall under a brass sconce'
  },
  {
    id: 'ZrLYu6n',
    code: 'INT-08',
    alt: 'Patterned African vessels and dried grasses beside a clay planter'
  }
];

const TOOLS = [
  { name: '3ds Max', id: 'znQK1ti' },
  { name: 'AutoCAD', id: 'eusbdWx' },
  { name: 'Corona', id: 'X4WSOcP' },
  { name: 'Photoshop', id: '6sW1ghq' }
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
  OVERVIEW,
  MATERIALS,
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
