'use strict';

const DEPLOYMENT_ID =
  'AKfycbzV7OufIj8Q6yLZaKxccF_ETSNJ3l76gMV_s0cvIzkPnxND7ofDwOMn35gdPO_JxlZfHA';

const PAGE_TITLE = 'DK-Apartment — Hossam Alafandi';
const PAGE_CODE = 'dk-apartment';
const EMBED_HEIGHT = 4400;
const EMBED_WIDTH = '100%';
const PRODUCTION_ASSET_BASE =
  'https://cdn.jsdelivr.net/gh/hossamalafandi/behance-slideshow@main/assets/dk-apartment/';
const PREVIEW_ASSET_BASE = '/assets/dk-apartment/';

const HERO = {
  file: 'hero',
  alt: 'DK-Apartment interior',
  title: 'DK-APARTMENT',
  location: 'SYRIA, HAMA',
  year: '- 2026 -'
};

const OVERVIEW_TEXT =
  'The apartment\'s design balanced aesthetics with practical considerations. Material ' +
  'selection, colors, textures, and decorative elements were carefully chosen to reflect ' +
  'the client\'s preferences, while surface conditions and potential moisture-related ' +
  'issues were considered to ensure suitable finishes and long-term durability.';

const RENDERS = [
  'PE64JPS', 'UguOsh7', 'rZuFFsF', 'DgRW7Ud', 'ZdxERME', 'PzAxrI1',
  'Q5YIWr7', 'lYAraEp', 'TzQqwvD', 'ubTjwCd', 'GDyxMRo', 'cmWXlSL',
  '2Nvavbw', 'ojMreDQ', 'zdH9f9X', 'PtGtb8x', 'zrKlCcu', 'X42daE7',
  'qwCnuaQ', 'uufpmxx', 'r1WXD2y', 'p91pIbR', 'hu4tSIB', 'GDF3zGw',
  '48bAxEG', 'PcvNdEE', '8Mj7KQW', 'I2rvmJv', 'zwG0A1p', 'i1JdvmJ',
  'p9q0cqs', 'rI67398', '9TVeN6b', 'twGESWa', '3V6en9l', 'Xud5gCu',
  'O47TEam', 'kwGqXJs'
];

function renderUrl(id) {
  return 'https://i.imgur.com/' + id + '.jpg';
}

function renderThumbUrl(id) {
  return 'https://i.imgur.com/' + id + 'h.jpg';
}

const VIDEOS = [
  { name: 'IMG_3011', id: '1250270804', title: 'DK-Apartment — IMG_3011' },
  { name: 'IMG_3045', id: '1250270805', title: 'DK-Apartment — IMG_3045' }
];

const CAPTION = 'on-site works in progress.';

const IMAGES = [
  { name: 'images-left-top', alt: 'DK-Apartment on-site photo 1' },
  { name: 'images-left-bottom', alt: 'DK-Apartment on-site photo 2' },
  { name: 'images-middle-top', alt: 'DK-Apartment on-site photo 3' }
];

const TOOLS = [
  { name: '3ds Max', id: 'znQK1ti' },
  { name: 'AutoCAD', id: 'eusbdWx' },
  { name: 'Corona', id: 'X4WSOcP' },
  { name: 'Photoshop', id: '6sW1ghq' }
];

function toolUrl(id) {
  return 'https://i.imgur.com/' + id + '.png';
}

function vimeoEmbed(video) {
  return 'https://player.vimeo.com/video/' + video.id +
    '?dnt=1&title=0&byline=0&portrait=0';
}

const COPYRIGHT_TEXT = '© 2025 HOSSAM ALAFANDI. All rights reserved.';

function assetUrl(base, name, size) {
  return base + name + '-' + size + '.jpg';
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
  RENDERS,
  renderUrl,
  renderThumbUrl,
  VIDEOS,
  CAPTION,
  IMAGES,
  TOOLS,
  toolUrl,
  vimeoEmbed,
  COPYRIGHT_TEXT,
  assetUrl,
  embedUrl,
  embedSnippet
};
