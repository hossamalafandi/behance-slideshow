'use strict';

const path = require('path');

const DEPLOYMENT_ID =
  'AKfycbzV7OufIj8Q6yLZaKxccF_ETSNJ3l76gMV_s0cvIzkPnxND7ofDwOMn35gdPO_JxlZfHA';

const PAGE_TITLE = 'AB-Apartment — Hossam Alafandi';
const PAGE_CODE = 'ab-apartment';
const EMBED_HEIGHT = 2750;
const EMBED_WIDTH = '100%';
const PRODUCTION_ASSET_BASE =
  'https://cdn.jsdelivr.net/gh/hossamalafandi/behance-slideshow@main/assets/ab-apartment/';
const PREVIEW_ASSET_BASE = '/assets/ab-apartment/';

const HERO = {
  file: 'hero',
  alt: 'AB-Apartment interior',
  title: 'AB-APARTMENT',
  location: 'SYRIA, HAMA',
  year: '- 2026 -'
};

const OVERVIEW_TEXT =
  'This 150 m² apartment features a modern interior defined by warm colors, refined ' +
  'materials, and a cohesive contemporary aesthetic. The layout includes three bedrooms, ' +
  'a kitchen, two living rooms, and two bathrooms, combining comfort, and functionality.';

const ROOMS = [
  { code: 'P004-S01', title: 'LIVING ROOM', column: 'left' },
  { code: 'P004-S02', title: 'RECIPTION', column: 'left' },
  { code: 'P004-S03', title: 'GIRLS BEDROOM', column: 'left' },
  { code: 'P004-S04', title: 'MASTER BEDROOM', column: 'right' },
  { code: 'P004-S05', title: 'KITCHEN', column: 'right' },
  { code: 'P004-S06', title: 'BOYS BEDROOM', column: 'right' },
  { code: 'P004-S07', title: 'BATHROOM', column: 'right' }
];

function loadSlideshow(code) {
  const file = path.join(__dirname, '..', '03_REBUILT_SLIDESHOWS', 'data', code + '.json');
  const source = require(file);
  return {
    code: code,
    width: source.width,
    height: source.height,
    images: source.images.map(image => ({
      src: image.src,
      thumb: image.src.replace(/\.(jpg|jpeg|png)$/i, 'h.jpg'),
      w: image.w,
      h: image.h
    }))
  };
}

const SLIDESHOWS = ROOMS.map(room => {
  const slideshow = loadSlideshow(room.code);
  return {
    ...room,
    ...slideshow
  };
});

const TOOLS = [
  { name: '3ds Max', id: 'znQK1ti' },
  { name: 'AutoCAD', id: 'eusbdWx' },
  { name: 'Corona', id: 'X4WSOcP' },
  { name: 'Photoshop', id: '6sW1ghq' }
];

function toolUrl(id) {
  return 'https://i.imgur.com/' + id + '.png';
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
  ROOMS,
  SLIDESHOWS,
  TOOLS,
  toolUrl,
  COPYRIGHT_TEXT,
  assetUrl,
  embedUrl,
  embedSnippet
};
