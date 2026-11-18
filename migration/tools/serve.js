#!/usr/bin/env node
'use strict';

/**
 * Local router emulator for the pilot.
 *
 * Mirrors the deployed doGet contract without deploying anything:
 *   /exec?slide=P001-S01  -> one self-contained slideshow
 *   every other request    -> neutral error page with no links
 *
 * There is deliberately no index, gallery, catalog, or static file route. The
 * only HTML this server returns is one slideshow or the neutral error page.
 */

const fs = require('fs');
const http = require('http');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA_SOURCE = path.join(ROOT, '04_APPS_SCRIPT', 'SlidesData.gs');
const PREVIEW_DIR = path.join(ROOT, '03_REBUILT_SLIDESHOWS', 'preview');
const PORT = Number(process.env.PILOT_PORT || 4173);

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

function countSlideParameters(queryString) {
  if (!queryString) return 0;
  return queryString.split('&').reduce((count, pair) => {
    const rawKey = pair.split('=')[0].replace(/\+/g, ' ');
    let key;
    try {
      key = decodeURIComponent(rawKey);
    } catch (error) {
      key = rawKey;
    }
    return key === 'slide' ? count + 1 : count;
  }, 0);
}

function createPilotServer() {
  const slides = loadSlides();

  return http.createServer((request, response) => {
    const url = new URL(request.url, 'http://127.0.0.1');

    // Only the single-slideshow endpoint exists. Nothing else is routed, so
    // the server can never expose a gallery or a file listing.
    if (url.pathname !== '/exec') {
      send(response, 404, 'text/plain; charset=utf-8', 'Not found');
      return;
    }

    if (countSlideParameters(url.search.slice(1)) !== 1) {
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

function send(response, status, contentType, body) {
  response.writeHead(status, {
    'Content-Type': contentType,
    'Cache-Control': 'no-store',
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

module.exports = { createPilotServer, countSlideParameters, loadSlides, NOT_FOUND_HTML };

if (require.main === module) {
  start(PORT).then(() => {
    console.log('Pilot router listening on http://127.0.0.1:' + PORT + '/exec?slide=P001-S01');
  });
}
