'use strict';

/**
 * Single source of truth for the Al-Rashed standalone project page.
 *
 * The page is served by the existing Apps Script deployment at
 * `?page=al-rashed`. It is independent of the 48 `?slide=` slideshows and the
 * 38 `?tools=` strips; nothing here is imported by those routes.
 */

const DEPLOYMENT_ID =
  'AKfycbzV7OufIj8Q6yLZaKxccF_ETSNJ3l76gMV_s0cvIzkPnxND7ofDwOMn35gdPO_JxlZfHA';

const PAGE_CODE = 'al-rashed';
const PAGE_TITLE = 'Al-Rashed Project — Hossam Alafandi';
const EMBED_WIDTH = '100%';
// Fixed Behance height, sized to the 987 px Behance project column and the
// 390 px phone column. Slightly shorter than the widest desktop preview, so
// desktop frames taller than 1080 px get a small, natural internal scroll.
const EMBED_HEIGHT = 2980;

const PRODUCTION_ASSET_BASE =
  'https://cdn.jsdelivr.net/gh/hossamalafandi/behance-slideshow@main/assets/al-rashed/';
const PREVIEW_ASSET_BASE = '/assets/al-rashed/';

const HERO = {
  name: 'hero',
  widths: [768, 1280, 1920],
  alt: 'Al-Rashed project exterior at dusk'
};

const REAL_PHOTOS = [
  {
    name: 'real1',
    file: 'real1-768.jpg',
    desktop: 'real1-1280.jpg',
    alt: 'Al-Rashed project real photo 1'
  },
  {
    name: 'real2',
    file: 'real2-768.jpg',
    desktop: 'real2-1280.jpg',
    alt: 'Al-Rashed project real photo 2'
  },
  {
    name: 'real3',
    file: 'real3-768.jpg',
    desktop: 'real3-1280.jpg',
    alt: 'Al-Rashed project real photo 3'
  }
];

const RENDERS = [
  'ywuUBKU', 'Lw0l4UR', 'xJzxFii', 'RL8gZTj', '3RgRGON', 'CI2Ej0t',
  'dei3yVA', 'jHF9GCZ', '4TmXfzM', 'h5R61ib', 'L4ohWrb', 'i0AkyTA',
  'wLaKx3a', 'Sl4bfoI', 'Gq92nle', 'u1XPsAL', 'qI1GMsI'
];

const TOOLS = [
  { id: 'znQK1ti', name: '3ds Max' },
  { id: 'STZTRZr', name: 'Revit' },
  { id: 'eusbdWx', name: 'AutoCAD' },
  { id: '6sW1ghq', name: 'Photoshop' },
  { id: '8y2GzCS', name: 'Lumion' }
];

const MAP_URL =
  'https://maps-api-ssl.google.com/maps?hl=en-US&ll=24.687677,46.763814&output=embed&z=19';

const OVERVIEW_TEXT =
  'Al-Rashed or (Zahret Al-Khuzama) project is a residential complex comprising two main housing types. On the east and west sides, there are clusters of four villas each, with each villa spanning three floors and covering approximately 225 m² per floor. Additionally, the project includes 24 apartments arranged in a repetitive housing block made up of 8 modules, each containing 3 apartments of varying sizes.';

const COPYRIGHT_TEXT = '© 2025 HOSSAM ALAFANDI. All rights reserved.';

function renderUrl(id) {
  return 'https://i.imgur.com/' + id + 'h.jpeg';
}

function toolUrl(id) {
  return 'https://i.imgur.com/' + id + '.png';
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
    '  allow="fullscreen">',
    '</iframe>'
  ].join('\n');
}

module.exports = {
  DEPLOYMENT_ID,
  PAGE_CODE,
  PAGE_TITLE,
  EMBED_WIDTH,
  EMBED_HEIGHT,
  PRODUCTION_ASSET_BASE,
  PREVIEW_ASSET_BASE,
  HERO,
  REAL_PHOTOS,
  RENDERS,
  TOOLS,
  MAP_URL,
  OVERVIEW_TEXT,
  COPYRIGHT_TEXT,
  renderUrl,
  toolUrl,
  embedUrl,
  embedSnippet
};
