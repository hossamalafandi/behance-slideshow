#!/usr/bin/env node
'use strict';

/**
 * Generate the standalone Al-Rashed project page.
 *
 * Outputs:
 *   migration/04_APPS_SCRIPT/AlRashed.html              production page
 *   migration/03_REBUILT_SLIDESHOWS/preview/al-rashed.html  local preview
 *
 * Production images use jsDelivr; the preview uses the local `/assets/al-rashed/`
 * route served by `serve.js`. Both files come from this one source.
 *
 * Usage:
 *   node generate-al-rashed.js
 */

const fs = require('fs');
const path = require('path');
const data = require('./al-rashed-data');

const ROOT = path.resolve(__dirname, '..');
const APPS_DIR = path.join(ROOT, '04_APPS_SCRIPT');
const PREVIEW_DIR = path.join(ROOT, '03_REBUILT_SLIDESHOWS', 'preview');
const PRODUCTION_FILE = path.join(APPS_DIR, 'AlRashed.html');
const PREVIEW_FILE = path.join(PREVIEW_DIR, 'al-rashed.html');

function fail(message) {
  throw new Error(message);
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

function heroMarkup(assetBase) {
  const src = name => assetBase + name;
  return [
    '<picture class="hero-media">',
    '  <source media="(max-width: 700px)" srcset="' + src('hero-768.jpg') + '">',
    '  <img src="' + src('hero-1920.jpg') + '"',
    '       srcset="' + src('hero-1280.jpg') + ' 1280w, ' + src('hero-1920.jpg') + ' 1920w"',
    '       sizes="100vw" alt="' + escapeHtml(data.HERO.alt) + '"',
    '       loading="eager" fetchpriority="high" decoding="async">',
    '</picture>'
  ].join('\n      ');
}

function renderSlides() {
  return data.RENDERS.map((id, index) => {
    const loading = index === 0 ? ' loading="eager"' : ' loading="lazy"';
    return [
      '          <figure class="render-slide" aria-roledescription="slide" aria-label="Render ' +
        (index + 1) + ' of ' + data.RENDERS.length + '">',
      '            <img src="' + escapeHtml(data.renderUrl(id)) + '" alt="Al-Rashed project render ' +
        (index + 1) + '"' + loading + ' decoding="async">',
      '          </figure>'
    ].join('\n');
  }).join('\n');
}

function photoMarkup(photo, assetBase, extraClass) {
  return [
    '<figure' + (extraClass ? ' class="' + extraClass + '"' : '') + '>',
    '  <picture>',
    '    <source media="(max-width: 700px)" srcset="' + assetBase + photo.file + '">',
    '    <img src="' + assetBase + photo.desktop + '" alt="' + escapeHtml(photo.alt) + '"',
    '         loading="lazy" decoding="async">',
    '  </picture>',
    '</figure>'
  ].join('\n      ');
}

function toolsMarkup() {
  return data.TOOLS.map(tool =>
    '      <img src="' + escapeHtml(data.toolUrl(tool.id)) + '" alt="' + escapeHtml(tool.name) +
    '" loading="lazy" decoding="async">'
  ).join('\n');
}

function buildPage(assetBase) {
  if (!/^https?:\/\/|^\//.test(assetBase)) {
    fail('Asset base must be an https URL or an absolute local path');
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="color-scheme" content="dark">
<title>${escapeHtml(data.PAGE_TITLE)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Lexend:wght@100;200;300;900&amp;display=swap" rel="stylesheet">
<style>
  :root {
    --bg: #000;
    --ink: #f9f9f9;
    --muted: rgba(249, 249, 249, 0.62);
    --pad: 60px;
    --section-y: 44px;
    --radius: 20px;
  }

  * { box-sizing: border-box; }

  html {
    background: var(--bg);
    -webkit-text-size-adjust: 100%;
  }

  body {
    margin: 0;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    overflow-x: hidden;
    background: var(--bg);
    color: var(--ink);
    font-family: 'Lexend', Arial, sans-serif;
    font-weight: 100;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  }

  main {
    display: flex;
    flex: 1 0 auto;
    flex-direction: column;
    justify-content: space-between;
    width: 100%;
    min-height: 100vh;
  }

  img { max-width: 100%; }

  .wrap {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 var(--pad);
  }

  /* ---------------------------------------------------------------- hero */
  .hero {
    position: relative;
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    justify-content: center;
    min-height: 430px;
    overflow: hidden;
    padding: 56px 24px;
    background: #050505;
    text-align: center;
    isolation: isolate;
  }

  .hero-media,
  .hero-media img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  .hero-media img {
    display: block;
    object-fit: cover;
    object-position: center bottom;
  }

  .hero-shade {
    position: absolute;
    inset: 0;
    z-index: 1;
    background: linear-gradient(180deg, rgba(0, 0, 0, 0.18) 0%, rgba(0, 0, 0, 0.12) 44%, rgba(0, 0, 0, 0.46) 100%);
  }

  .hero-content {
    position: relative;
    z-index: 2;
    width: 100%;
    max-width: 1100px;
    margin: 0 auto;
  }

  .hero h1 {
    margin: 0 0 10px;
    font-size: clamp(61.33px, 7.5vw, 96px);
    font-weight: 900;
    line-height: 1.15;
    letter-spacing: 0.01em;
    text-wrap: balance;
    text-shadow: 0 3px 32px rgba(0, 0, 0, 0.48);
  }

  .hero-sub {
    margin: 0;
    font-size: clamp(22.67px, 1.667vw, 24px);
    font-weight: 100;
    line-height: 1.25;
    letter-spacing: 0.06em;
    text-shadow: 0 2px 20px rgba(0, 0, 0, 0.45);
  }

  .hero-sub + .hero-sub { margin-top: 2px; }

  /* ------------------------------------------------------------ sections */
  .section {
    flex: 0 0 auto;
    padding: var(--section-y) 0;
  }

  .section h2 {
    margin: 0 0 16px;
    font-size: 64px;
    font-weight: 900;
    line-height: 1.2;
    letter-spacing: 0.005em;
  }

  .overview p {
    max-width: 1080px;
    margin: 0;
    font-size: 16px;
    font-weight: 100;
    line-height: 1.8;
    color: var(--ink);
    text-wrap: pretty;
  }

  /* -------------------------------------------------------------- renders */
  .renders-section { padding-bottom: calc(var(--section-y) + 2px); }

  .renders-viewer {
    position: relative;
    border-radius: var(--radius);
    outline: none;
  }

  .renders-viewer:focus-visible {
    outline: 2px solid rgba(249, 249, 249, 0.8);
    outline-offset: 6px;
  }

  .renders-stage {
    position: relative;
    aspect-ratio: 16 / 9;
    overflow: hidden;
    border-radius: var(--radius);
    background: #080808;
    cursor: grab;
    touch-action: pan-y;
  }

  .renders-stage:active { cursor: grabbing; }

  .renders-track {
    display: flex;
    width: calc(var(--count, 17) * 100%);
    height: 100%;
    transition: transform 0.5s cubic-bezier(0.22, 0.61, 0.36, 1);
    will-change: transform;
  }

  .render-slide {
    flex: 0 0 calc(100% / var(--count, 17));
    height: 100%;
    margin: 0;
    overflow: hidden;
  }

  .render-slide img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    user-select: none;
    -webkit-user-drag: none;
    pointer-events: none;
  }

  .render-hud {
    position: absolute;
    top: 14px;
    right: 14px;
    z-index: 4;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .render-counter,
  .render-fs {
    border: 1px solid rgba(255, 255, 255, 0.14);
    background: rgba(0, 0, 0, 0.5);
    color: #fff;
    -webkit-backdrop-filter: blur(8px);
    backdrop-filter: blur(8px);
  }

  .render-counter {
    padding: 7px 11px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 200;
    line-height: 1;
    letter-spacing: 0.08em;
    white-space: nowrap;
  }

  .render-fs {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 34px;
    padding: 0;
    border-radius: 999px;
    font-family: inherit;
    font-size: 18px;
    line-height: 1;
    cursor: pointer;
  }

  .render-fs:hover { background: rgba(0, 0, 0, 0.76); }

  .render-fs:focus-visible,
  .render-arrow:focus-visible,
  .render-dot:focus-visible {
    outline: 2px solid #fff;
    outline-offset: 2px;
  }

  .render-arrow {
    position: absolute;
    top: 50%;
    z-index: 3;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    padding: 0;
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.45);
    color: #fff;
    font-family: inherit;
    font-size: 18px;
    line-height: 1;
    cursor: pointer;
    opacity: 0;
    transform: translateY(-50%);
    transition: opacity 0.2s ease, background 0.2s ease;
    -webkit-backdrop-filter: blur(6px);
    backdrop-filter: blur(6px);
  }

  .render-arrow.prev { left: 14px; }
  .render-arrow.next { right: 14px; }
  .render-arrow:hover { background: rgba(0, 0, 0, 0.72); }

  .renders-stage:hover .render-arrow,
  .renders-stage:focus-within .render-arrow { opacity: 1; }

  .render-dots {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 30px;
    padding-top: 16px;
  }

  .render-dot {
    width: 10px;
    height: 10px;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: #4a4a4a;
    cursor: pointer;
    transition: background 0.2s ease, transform 0.2s ease;
  }

  .render-dot:hover { background: #8a8a8a; }

  .render-dot[aria-current="true"] {
    background: var(--ink);
    transform: scale(1.12);
  }

  /* Native fullscreen and the quiet fallback share the same geometry. */
  .renders-viewer:fullscreen,
  .renders-viewer.theater-mode {
    display: flex;
    flex-direction: column;
    justify-content: center;
    width: 100vw;
    height: 100vh;
    padding: 2vh 2vw;
    border-radius: 0;
    background: #000;
  }

  .renders-viewer.theater-mode {
    position: fixed;
    inset: 0;
    z-index: 2147483647;
  }

  .renders-viewer:fullscreen .renders-stage,
  .renders-viewer.theater-mode .renders-stage {
    width: min(100%, calc(177.78vh - 171px));
    margin: 0 auto;
    border-radius: 12px;
  }

  .renders-viewer:fullscreen .render-dots,
  .renders-viewer.theater-mode .render-dots { padding-top: 14px; }

  body.theater-open { overflow: hidden; }

  /* --------------------------------------------------------------- photos */
  .photo-grid {
    display: grid;
    grid-template-columns: 1fr 2.05fr;
    gap: 16px;
  }

  .photo-col {
    display: grid;
    gap: 16px;
  }

  .photo-grid figure {
    margin: 0;
    overflow: hidden;
    border-radius: var(--radius);
    background: #080808;
  }

  .photo-col figure { aspect-ratio: 4 / 3; }
  .photo-main { height: 100%; }

  .photo-grid picture {
    display: block;
    width: 100%;
    height: 100%;
  }

  .photo-grid img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  /* ------------------------------------------------------------- location */
  .map-frame {
    display: block;
    width: 100%;
    height: clamp(240px, 34vw, 420px);
    border: 0;
    border-radius: var(--radius);
    background: #080808;
  }

  /* ---------------------------------------------------------------- tools */
  .tools h2 { text-align: center; }

  .tools-row {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    align-items: center;
    justify-items: center;
    gap: 24px;
    min-height: 60px;
    margin-top: 24px;
  }

  .tools-row img {
    display: block;
    width: auto;
    height: auto;
    max-width: 100%;
    max-height: 60px;
    filter: grayscale(100%);
    opacity: 0.9;
    transition: filter 0.3s ease, transform 0.3s ease, opacity 0.3s ease;
  }

  @media (hover: hover) {
    .tools-row img:hover {
      filter: none;
      opacity: 1;
      transform: scale(1.06);
    }
  }

  /* ------------------------------------------------------------ copyright */
  .copyright {
    flex: 0 0 auto;
    padding: 20px 24px 28px;
    font-size: 10.67px;
    font-weight: 900;
    line-height: 1.5;
    letter-spacing: 0.06em;
    text-align: center;
    color: var(--ink);
    opacity: 0.62;
  }

  /* ------------------------------------------------------------ responsive */
  @media (max-width: 900px) {
    .section h2 { font-size: 52px; }
  }

  @media (max-width: 700px) {
    :root {
      --pad: 24px;
      --section-y: 44px;
    }

    .hero {
      min-height: 435px;
      padding: 56px 24px;
    }

    .hero h1 { font-size: 61.33px; }
    .hero-sub { font-size: 22.67px; }

    .section h2 {
      margin-bottom: 16px;
      font-size: 44px;
    }

    .overview p { line-height: 1.75; }

    .photo-grid {
      grid-template-columns: 1fr;
      gap: 14px;
    }

    .photo-col { gap: 14px; }
    .photo-grid figure,
    .photo-main { aspect-ratio: 4 / 3; height: auto; }

    .map-frame { height: 260px; }

    .render-hud {
      top: 10px;
      right: 10px;
    }

    .render-arrow {
      width: 38px;
      height: 38px;
      opacity: 0.82;
    }

    .render-arrow.prev { left: 8px; }
    .render-arrow.next { right: 8px; }

    .render-dots {
      gap: 6px;
      padding-top: 14px;
    }

    .render-dot {
      width: 8px;
      height: 8px;
    }

    .tools-row {
      gap: 10px;
      min-height: 48px;
      margin-top: 20px;
    }

    .tools-row img { max-height: 48px; }

    .copyright {
      padding: 20px 24px 26px;
      font-size: 11px;
    }
  }

  @media (max-width: 380px) {
    :root { --pad: 20px; }
    .hero h1 { font-size: 54px; }
  }

  @media (prefers-reduced-motion: reduce) {
    .renders-track { transition: none; }
    .render-arrow,
    .render-dot,
    .tools-row img { transition: none; }
  }
</style>
</head>
<body>
<main id="page">
  <header class="hero">
    ${heroMarkup(assetBase)}
    <div class="hero-shade"></div>
    <div class="hero-content">
      <h1>AL-RASHED PROJECT</h1>
      <p class="hero-sub">SAUDI ARABIA</p>
      <p class="hero-sub">- 2024 -</p>
    </div>
  </header>

  <section class="section overview" aria-labelledby="overview-title">
    <div class="wrap">
      <h2 id="overview-title">OVERVIEW</h2>
      <p>${escapeHtml(data.OVERVIEW_TEXT)}</p>
    </div>
  </section>

  <section class="section renders-section" aria-labelledby="renders-title">
    <div class="wrap">
      <h2 id="renders-title">RENDERS</h2>
      <div class="renders-viewer" id="rendersViewer" tabindex="0" role="region"
           aria-roledescription="carousel" aria-label="Al-Rashed project renders">
        <div class="renders-stage" id="rendersStage">
          <div class="renders-track" id="rendersTrack">
${renderSlides()}
          </div>
          <div class="render-hud">
            <span class="render-counter" id="renderCounter" aria-live="polite">1 / ${data.RENDERS.length}</span>
            <button class="render-fs" id="renderFullscreen" type="button"
                    aria-label="Enter fullscreen" title="Fullscreen" aria-pressed="false">⛶</button>
          </div>
          <button class="render-arrow prev" id="renderPrev" type="button" aria-label="Previous render">❮</button>
          <button class="render-arrow next" id="renderNext" type="button" aria-label="Next render">❯</button>
        </div>
        <div class="render-dots" id="renderDots" role="group" aria-label="Choose a render"></div>
      </div>
    </div>
  </section>

  <section class="section photos" aria-labelledby="photos-title">
    <div class="wrap">
      <h2 id="photos-title">REAL PHOTOS</h2>
      <div class="photo-grid">
        <div class="photo-col">
      ${photoMarkup(data.REAL_PHOTOS[0], assetBase)}
      ${photoMarkup(data.REAL_PHOTOS[1], assetBase)}
        </div>
      ${photoMarkup(data.REAL_PHOTOS[2], assetBase, 'photo-main')}
      </div>
    </div>
  </section>

  <section class="section location" aria-labelledby="location-title">
    <div class="wrap">
      <h2 id="location-title">LOCATION</h2>
      <iframe class="map-frame" src="${escapeHtml(data.MAP_URL)}"
              title="Al-Rashed project location map" loading="lazy"
              referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>
    </div>
  </section>

  <section class="section tools" aria-labelledby="tools-title">
    <div class="wrap">
      <h2 id="tools-title">TOOLS USED</h2>
      <div class="tools-row" aria-label="Software used">
${toolsMarkup()}
      </div>
    </div>
  </section>

  <footer class="copyright">${escapeHtml(data.COPYRIGHT_TEXT)}</footer>
</main>

<script>
(function () {
  'use strict';

  var viewer = document.getElementById('rendersViewer');
  if (!viewer) return;

  var stage = document.getElementById('rendersStage');
  var track = document.getElementById('rendersTrack');
  var slides = Array.prototype.slice.call(track.querySelectorAll('.render-slide'));
  var dotsBox = document.getElementById('renderDots');
  var counter = document.getElementById('renderCounter');
  var prev = document.getElementById('renderPrev');
  var next = document.getElementById('renderNext');
  var fsButton = document.getElementById('renderFullscreen');
  var count = slides.length;
  var index = 0;

  viewer.style.setProperty('--count', String(count));

  var dots = slides.map(function (_, i) {
    var dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'render-dot';
    dot.setAttribute('aria-label', 'Show render ' + (i + 1) + ' of ' + count);
    dot.addEventListener('click', function () { show(i); });
    dotsBox.appendChild(dot);
    return dot;
  });

  function preload(at) {
    if (!count) return;
    var target = slides[((at % count) + count) % count];
    if (!target) return;
    var image = target.querySelector('img');
    if (!image || image.complete) return;
    var warm = new Image();
    warm.decoding = 'async';
    warm.src = image.getAttribute('src');
  }

  function show(nextIndex) {
    if (typeof nextIndex !== 'number' || !isFinite(nextIndex)) return;
    index = ((nextIndex % count) + count) % count;
    track.style.transform = 'translateX(-' + (index * 100 / count) + '%)';

    dots.forEach(function (dot, i) {
      if (i === index) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });

    slides.forEach(function (slide, i) {
      slide.setAttribute('aria-hidden', i === index ? 'false' : 'true');
    });

    counter.textContent = (index + 1) + ' / ' + count;

    var image = slides[index].querySelector('img');
    if (image) {
      image.loading = 'eager';
      if (!image.complete) image.src = image.getAttribute('src');
      preload(index + 1);
      preload(index - 1);
    }
  }

  function step(delta) { show(index + delta); }

  function warmAll() {
    for (var i = 1; i < count; i++) preload(i);
  }

  window.addEventListener('load', function () {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(warmAll, { timeout: 2500 });
    } else {
      setTimeout(warmAll, 1200);
    }
  }, { once: true });

  if (prev) prev.addEventListener('click', function () { step(-1); });
  if (next) next.addEventListener('click', function () { step(1); });

  viewer.addEventListener('keydown', function (event) {
    if (event.key === 'ArrowLeft') {
      step(-1);
      event.preventDefault();
    } else if (event.key === 'ArrowRight') {
      step(1);
      event.preventDefault();
    } else if (event.key === 'Home') {
      show(0);
      event.preventDefault();
    } else if (event.key === 'End') {
      show(count - 1);
      event.preventDefault();
    }
  });

  if (stage) {
    stage.addEventListener('click', function (event) {
      if (event.target.closest('button')) return;
      viewer.focus({ preventScroll: true });
    });

    var startX = 0;
    var startY = 0;
    var tracking = false;

    stage.addEventListener('touchstart', function (event) {
      if (event.touches.length !== 1) {
        tracking = false;
        return;
      }
      tracking = true;
      startX = event.touches[0].clientX;
      startY = event.touches[0].clientY;
    }, { passive: true });

    stage.addEventListener('touchend', function (event) {
      if (!tracking) return;
      tracking = false;
      var touch = event.changedTouches[0];
      if (!touch) return;
      var dx = touch.clientX - startX;
      var dy = touch.clientY - startY;
      if (Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        step(dx < 0 ? 1 : -1);
      }
    }, { passive: true });
  }

  // Native fullscreen first; a quiet theater fallback when it is unavailable.
  var fallbackActive = false;

  function setFullscreenState(active) {
    if (!fsButton) return;
    fsButton.setAttribute('aria-label', active ? 'Exit fullscreen' : 'Enter fullscreen');
    fsButton.setAttribute('title', active ? 'Exit fullscreen' : 'Fullscreen');
    fsButton.setAttribute('aria-pressed', active ? 'true' : 'false');
  }

  function enterFallback() {
    if (fallbackActive) return;
    if (document.fullscreenElement || document.webkitFullscreenElement) return;
    fallbackActive = true;
    viewer.classList.add('theater-mode');
    document.body.classList.add('theater-open');
    setFullscreenState(true);
  }

  function exitFallback() {
    if (!fallbackActive) return;
    fallbackActive = false;
    viewer.classList.remove('theater-mode');
    document.body.classList.remove('theater-open');
    setFullscreenState(false);
  }

  function requestNative() {
    var request = viewer.requestFullscreen || viewer.webkitRequestFullscreen ||
      viewer.msRequestFullscreen;
    if (!request || document.fullscreenEnabled === false) {
      enterFallback();
      return;
    }
    try {
      var result = request.call(viewer);
      if (result && typeof result.then === 'function') result.catch(enterFallback);
    } catch (error) {
      enterFallback();
    }
  }

  function exitNative() {
    var exit = document.exitFullscreen || document.webkitExitFullscreen ||
      document.msExitFullscreen;
    if (!exit) {
      exitFallback();
      return;
    }
    try {
      var result = exit.call(document);
      if (result && typeof result.then === 'function') result.catch(function () {});
    } catch (error) {
      // Stay in the current state; the button remains usable.
    }
  }

  function onFullscreenChange() {
    var active = (document.fullscreenElement || document.webkitFullscreenElement) === viewer;
    if (active) exitFallback();
    setFullscreenState(active || fallbackActive);
  }

  if (fsButton) {
    fsButton.addEventListener('click', function () {
      if (document.fullscreenElement || document.webkitFullscreenElement) {
        exitNative();
        return;
      }
      if (fallbackActive) {
        exitFallback();
        return;
      }
      requestNative();
    });
  }

  document.addEventListener('fullscreenchange', onFullscreenChange);
  document.addEventListener('webkitfullscreenchange', onFullscreenChange);
  document.addEventListener('fullscreenerror', enterFallback);
  document.addEventListener('webkitfullscreenerror', enterFallback);
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && fallbackActive) exitFallback();
  });

  show(0);
})();
</script>
</body>
</html>
`;
}

function main() {
  if (!fs.existsSync(PREVIEW_DIR)) fail('Missing preview directory: ' + PREVIEW_DIR);
  const production = buildPage(data.PRODUCTION_ASSET_BASE);
  const preview = buildPage(data.PREVIEW_ASSET_BASE);
  fs.writeFileSync(PRODUCTION_FILE, production);
  fs.writeFileSync(PREVIEW_FILE, preview);
  console.log('Wrote ' + path.relative(ROOT, PRODUCTION_FILE) + ' (' + production.length + ' bytes)');
  console.log('Wrote ' + path.relative(ROOT, PREVIEW_FILE) + ' (' + preview.length + ' bytes)');
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.stack);
    process.exit(1);
  }
}

module.exports = { buildPage, escapeHtml };
