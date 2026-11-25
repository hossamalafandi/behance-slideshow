#!/usr/bin/env node
'use strict';

/**
 * Local router emulator for the deployed Apps Script contract.
 *
 * Mirrors the deployed doGet behavior without deploying anything:
 *   /exec?slide=P001-S01  -> one self-contained slideshow
 *   /exec?page=al-rashed  -> the standalone Al-Rashed project page
 *   /assets/al-rashed/*   -> local page images (preview only)
 *   every other request   -> neutral error page with no links
 *
 * There is deliberately no index, gallery, catalog, or directory listing.
 * Only the single-slideshow route, the one project page, and the approved
 * page assets are served.
 */

const fs = require('fs');
const http = require('http');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA_SOURCE = path.join(ROOT, '04_APPS_SCRIPT', 'SlidesData.gs');
const PREVIEW_DIR = path.join(ROOT, '03_REBUILT_SLIDESHOWS', 'preview');
const PAGE_PREVIEWS = {
  'al-rashed': path.join(PREVIEW_DIR, 'al-rashed.html'),
  'cellphone-store': path.join(PREVIEW_DIR, 'cellphone-store.html')
};
const PAGE_PREVIEW = PAGE_PREVIEWS['al-rashed'];
const ASSET_DIR = path.resolve(ROOT, '..', 'assets', 'al-rashed');
const CELLPHONE_ASSET_DIR = path.resolve(ROOT, '..', 'assets', 'cellphone-store');
const PAGE_CODE = 'al-rashed';
const ASSET_PREFIX = '/assets/al-rashed/';
const CELLPHONE_ASSET_PREFIX = '/assets/cellphone-store/';
const PORT = Number(process.env.PILOT_PORT || 4173);

const IMAGE_TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp'
};

const NOT_FOUND_HTML = [
  '<!DOCTYPE html>',
  '<html lang="en"><head>',
  '<meta charset="UTF-8">',
  '<meta name="viewport" content="width=device-width, initial-scale=1">',
  '<title>Slideshow unavailable</title>',
  '<style>',
  'html,body{height:100%;margin:0}',
  'body{display:flex;align-items:center;justify-content:center;background:#111;color:#fff;font-family:Arial,sans-serif}',
  'main{max-width:32rem;padding:2rem;text-align:center}',
  'h1{font-size:1.25rem;font-weight:500;margin:0 0 .5rem}',
  'p{font-size:.95rem;line-height:1.5;margin:0;color:#ccc}',
  '</style></head><body>',
  '<main><h1>Slideshow unavailable</h1>',
  '<p>This slideshow could not be loaded. Please check the link.</p></main>',
  '</body></html>'
].join('');

function loadSlides() {
  const source = fs.readFileSync(DATA_SOURCE, 'utf8');
  const match = /var SLIDES = ([\s\S]*?);\s*$/.exec(source);
  if (!match) throw new Error('SlidesData.gs has no SLIDES lookup');
  return JSON.parse(match[1]);
}

function countParameters(queryString, keyName) {
  if (!queryString) return 0;
  return queryString.split('&').reduce((count, pair) => {
    const rawKey = pair.split('=')[0].replace(/\+/g, ' ');
    let key;
    try {
      key = decodeURIComponent(rawKey);
    } catch (error) {
      key = rawKey;
    }
    return key === keyName ? count + 1 : count;
  }, 0);
}

function countSlideParameters(queryString) {
  return countParameters(queryString, 'slide');
}

function serveAsset(response, pathname, prefix, directory) {
  const encodedName = pathname.slice(prefix.length);
  let name;
  try {
    name = decodeURIComponent(encodedName);
  } catch (error) {
    send(response, 404, 'text/plain; charset=utf-8', 'Not found');
    return;
  }

  if (!/^[A-Za-z0-9._-]+$/.test(name) || name.startsWith('.')) {
    send(response, 404, 'text/plain; charset=utf-8', 'Not found');
    return;
  }

  const file = path.join(directory, name);
  const type = IMAGE_TYPES[path.extname(name).toLowerCase()];
  if (!type || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    send(response, 404, 'text/plain; charset=utf-8', 'Not found');
    return;
  }

  send(response, 200, type, fs.readFileSync(file), 'public, max-age=3600');
}

function createPilotServer() {
  const slides = loadSlides();

  return http.createServer((request, response) => {
    const url = new URL(request.url, 'http://127.0.0.1');

    if (url.pathname.startsWith(ASSET_PREFIX)) {
      serveAsset(response, url.pathname, ASSET_PREFIX, ASSET_DIR);
      return;
    }

    if (url.pathname.startsWith(CELLPHONE_ASSET_PREFIX)) {
      serveAsset(response, url.pathname, CELLPHONE_ASSET_PREFIX, CELLPHONE_ASSET_DIR);
      return;
    }

    // Only the two single-item endpoints exist. Nothing else is routed, so
    // the server can never expose a gallery or a file listing.
    if (url.pathname !== '/exec') {
      send(response, 404, 'text/plain; charset=utf-8', 'Not found');
      return;
    }

    const queryString = url.search.slice(1);
    const slideCount = countParameters(queryString, 'slide');
    const toolsCount = countParameters(queryString, 'tools');
    const pageCount = countParameters(queryString, 'page');

    if (pageCount === 1 && slideCount === 0 && toolsCount === 0) {
      const rawPage = url.searchParams.get('page');
      const key = typeof rawPage === 'string' ? rawPage.trim().toLowerCase() : '';
      const previewFile = Object.prototype.hasOwnProperty.call(PAGE_PREVIEWS, key)
        ? PAGE_PREVIEWS[key] : null;
      if (!previewFile || !fs.existsSync(previewFile)) {
        send(response, 200, 'text/html; charset=utf-8', NOT_FOUND_HTML);
        return;
      }
      send(response, 200, 'text/html; charset=utf-8', fs.readFileSync(previewFile, 'utf8'));
      return;
    }

    if (slideCount !== 1 || pageCount !== 0 || toolsCount !== 0) {
      send(response, 200, 'text/html; charset=utf-8', NOT_FOUND_HTML);
      return;
    }

    const raw = url.searchParams.get('slide');
    if (typeof raw !== 'string' || raw.trim() === '') {
      send(response, 200, 'text/html; charset=utf-8', NOT_FOUND_HTML);
      return;
    }

    const id = raw.trim().toUpperCase();
    const slide = Object.prototype.hasOwnProperty.call(slides, id) ? slides[id] : null;
    if (!slide) {
      send(response, 200, 'text/html; charset=utf-8', NOT_FOUND_HTML);
      return;
    }

    const previewFile = path.join(PREVIEW_DIR, slide.slideshow_id + '.html');
    if (!fs.existsSync(previewFile)) {
      send(response, 200, 'text/html; charset=utf-8', NOT_FOUND_HTML);
      return;
    }

    send(response, 200, 'text/html; charset=utf-8', fs.readFileSync(previewFile, 'utf8'));
  });
}

function send(response, status, contentType, body, cacheControl) {
  response.writeHead(status, {
    'Content-Type': contentType,
    'Cache-Control': cacheControl || 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  response.end(body);
}

function start(port) {
  const server = createPilotServer();
  return new Promise(resolve => {
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

module.exports = {
  createPilotServer,
  countParameters,
  countSlideParameters,
  loadSlides,
  NOT_FOUND_HTML,
  PAGE_CODE,
  PAGE_PREVIEW,
  PAGE_PREVIEWS,
  ASSET_DIR,
  CELLPHONE_ASSET_DIR
};

if (require.main === module) {
  start(PORT).then(() => {
    console.log('Pilot router listening on http://127.0.0.1:' + PORT + '/exec?slide=P001-S01');
    console.log('Al-Rashed page: http://127.0.0.1:' + PORT + '/exec?page=al-rashed');
  });
}
