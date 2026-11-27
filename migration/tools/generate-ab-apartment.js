'use strict';

/**
 * Generates the standalone AB-Apartment project page.
 *
 * Source of truth: ab-apartment-data.js and the archived P004 slide data.
 * Outputs:
 *   04_APPS_SCRIPT/ABApartment.html
 *   03_REBUILT_SLIDESHOWS/preview/ab-apartment.html
 */

const fs = require('fs');
const path = require('path');
const data = require('./ab-apartment-data');

const ROOT = path.resolve(__dirname, '..');
const APPS_DIR = path.join(ROOT, '04_APPS_SCRIPT');
const PREVIEW_DIR = path.join(ROOT, '03_REBUILT_SLIDESHOWS', 'preview');
const PRODUCTION_FILE = path.join(APPS_DIR, 'ABApartment.html');
const PREVIEW_FILE = path.join(PREVIEW_DIR, 'ab-apartment.html');

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
  return [
    '<picture class="hero-media">',
    '  <source media="(max-width: 700px)" srcset="' +
      data.assetUrl(assetBase, data.HERO.file, 768) + '">',
    '  <img src="' + data.assetUrl(assetBase, data.HERO.file, 1920) + '"',
    '       alt="' + escapeHtml(data.HERO.alt) + '"',
    '       loading="eager" fetchpriority="high" decoding="async">',
    '</picture>'
  ].join('\n      ');
}

function slidesMarkup(slideshow) {
  return slideshow.images.map((image, index) => {
    const loading = index === 0 ? ' loading="eager"' : ' loading="lazy"';
    return [
      '            <figure class="slide" aria-roledescription="slide" aria-label="' +
        escapeHtml(slideshow.title) + ' image ' + (index + 1) + ' of ' +
        slideshow.images.length + '">',
      '              <picture>',
      '                <source media="(max-width: 700px)" srcset="' +
        escapeHtml(image.thumb) + '">',
      '                <img src="' + escapeHtml(image.src) + '" alt="' +
        escapeHtml(slideshow.title) + ' image ' + (index + 1) + '"' + loading +
        ' decoding="async">',
      '              </picture>',
      '            </figure>'
    ].join('\n');
  }).join('\n');
}

function slideshowMarkup(slideshow) {
  const id = 'slideshow-' + slideshow.code.toLowerCase();
  return [
    '<div class="slideshow" id="' + id + '" tabindex="0" role="region"',
    '     data-count="' + slideshow.images.length + '"',
    '     aria-roledescription="carousel" aria-label="' + escapeHtml(slideshow.title) + '">',
    '  <div class="slideshow-stage" style="aspect-ratio: ' + slideshow.width + ' / ' +
      slideshow.height + '">',
    '    <div class="slideshow-track">',
    slidesMarkup(slideshow),
    '    </div>',
    '    <div class="slide-hud">',
    '      <span class="slide-counter" aria-live="polite">1 / ' +
      slideshow.images.length + '</span>',
    '      <button class="slide-fs-button" type="button"',
    '              aria-label="Fullscreen" title="Fullscreen">⛶</button>',
    '    </div>',
    '    <button class="slide-arrow prev" type="button" aria-label="Previous image">❮</button>',
    '    <button class="slide-arrow next" type="button" aria-label="Next image">❯</button>',
    '  </div>',
    '  <div class="slide-dots" role="group" aria-label="Choose an image"></div>',
    '</div>'
  ].join('\n');
}

function roomMarkup(room, assetBase) {
  return [
    '<article class="room" data-column="' + room.column + '">',
    '  <h3>' + escapeHtml(room.title) + '</h3>',
    slideshowMarkup(room),
    '</article>'
  ].join('\n');
}

function toolsMarkup() {
  return data.TOOLS.map(tool => [
    '  <img src="' + data.toolUrl(tool.id) + '" alt="' + escapeHtml(tool.name) +
      ' Logo" loading="lazy" decoding="async">'
  ].join('\n')).join('\n');
}

function buildPage(assetBase) {
  const leftRooms = data.SLIDESHOWS.filter(room => room.column === 'left');
  const rightRooms = data.SLIDESHOWS.filter(room => room.column === 'right');
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
    --muted: rgba(249, 249, 249, 0.66);
    --pad: 60px;
    --section-y: 52px;
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
    justify-content: flex-start;
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
    object-position: center 38%;
  }

  .hero-shade {
    position: absolute;
    inset: 0;
    z-index: 1;
    background:
      linear-gradient(180deg, rgba(0, 0, 0, 0.42) 0%, rgba(0, 0, 0, 0.66) 100%),
      radial-gradient(circle at 50% 40%, rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0.7) 78%);
  }

  .hero-content { position: relative; z-index: 2; width: 100%; }

  .hero h1 {
    margin: 0;
    font-size: clamp(54px, 7.4vw, 104px);
    font-weight: 900;
    line-height: 0.95;
    letter-spacing: -0.035em;
    text-transform: uppercase;
  }

  .hero-sub {
    margin: 16px 0 0;
    color: rgba(249, 249, 249, 0.78);
    font-size: clamp(15px, 1.5vw, 22px);
    font-weight: 200;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }

  .hero-sub + .hero-sub { margin-top: 4px; }

  /* ------------------------------------------------------------- sections */
  .section { width: 100%; padding: var(--section-y) 0; }

  .section h2 {
    margin: 0 0 26px;
    font-size: clamp(42px, 6vw, 76px);
    font-weight: 900;
    line-height: 0.98;
    letter-spacing: -0.03em;
    text-transform: uppercase;
  }

  .overview p {
    max-width: 1040px;
    margin: 0;
    color: var(--muted);
    font-size: clamp(16px, 1.35vw, 19px);
    line-height: 1.55;
  }

  /* --------------------------------------------------------------- rooms */
  .rooms-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 40px 28px;
    align-items: start;
  }

  .room-column { min-width: 0; }

  .room { min-width: 0; }
  .room + .room { margin-top: 36px; }

  .room h3 {
    margin: 0 0 14px;
    font-size: clamp(24px, 3vw, 40px);
    font-weight: 900;
    line-height: 1;
    letter-spacing: -0.02em;
    text-transform: uppercase;
  }

  /* ---------------------------------------------------------- slideshow */
  .slideshow {
    width: 100%;
    max-width: 546px;
    outline: none;
  }

  .slideshow:focus-visible {
    outline: 2px solid rgba(249, 249, 249, 0.8);
    outline-offset: 6px;
  }

  .slideshow-stage {
    position: relative;
    width: 100%;
    overflow: hidden;
    border-radius: var(--radius);
    background: #080808;
    cursor: grab;
    touch-action: pan-y;
  }

  .slideshow-stage:active { cursor: grabbing; }

  .slideshow-track {
    display: flex;
    width: calc(var(--count, 1) * 100%);
    height: 100%;
    transition: transform 0.5s cubic-bezier(0.22, 0.61, 0.36, 1);
    will-change: transform;
  }

  .slide {
    flex: 0 0 calc(100% / var(--count, 1));
    height: 100%;
    margin: 0;
    overflow: hidden;
  }

  .slide picture,
  .slide img {
    display: block;
    width: 100%;
    height: 100%;
  }

  .slide img {
    object-fit: cover;
    user-select: none;
    -webkit-user-drag: none;
    pointer-events: none;
  }

  .slide-arrow {
    position: absolute;
    top: 50%;
    z-index: 3;
    width: 38px;
    height: 38px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.5);
    color: #fff;
    font-family: inherit;
    font-size: 15px;
    -webkit-backdrop-filter: blur(6px);
    backdrop-filter: blur(6px);
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.2s ease;
    transform: translateY(-50%);
  }

  .slideshow-stage:hover .slide-arrow,
  .slideshow-stage:focus-within .slide-arrow { opacity: 1; }
  .slide-arrow.prev { left: 10px; }
  .slide-arrow.next { right: 10px; }

  .slide-hud {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 3;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .slide-counter,
  .slide-fs-button {
    padding: 5px 9px;
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.5);
    color: #fff;
    font-size: 11px;
    font-weight: 200;
    -webkit-backdrop-filter: blur(6px);
    backdrop-filter: blur(6px);
  }

  .slide-fs-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    border-color: rgba(255, 255, 255, 0.22);
    font-family: inherit;
    font-size: 16px;
    cursor: pointer;
  }

  .slide-dots {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 6px;
    padding-top: 14px;
  }

  .slide-dot {
    width: 6px;
    height: 6px;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: #4a4a4a;
    cursor: pointer;
    transition: background 0.2s ease, transform 0.2s ease;
  }

  .slide-dot:hover { background: #8a8a8a; }
  .slide-dot[aria-current="true"] {
    background: var(--ink);
    transform: scale(1.12);
  }

  /* --------------------------------------------------- fullscreen viewer */
  .slide-fs {
    position: absolute;
    left: 0;
    width: 100%;
    height: 100vh;
    z-index: 2147483647;
    display: none;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    background: #000;
  }

  .slide-fs.is-open { display: flex; }

  .slide-fs-backdrop {
    position: absolute;
    inset: -30px;
    background-position: center;
    background-size: cover;
    filter: blur(28px) brightness(0.32);
    transform: scale(1.12);
  }

  .slide-fs-image {
    position: relative;
    z-index: 1;
    display: block;
    width: auto;
    height: auto;
    max-width: calc(100% - 20px);
    max-height: calc(100% - 20px);
    object-fit: contain;
    user-select: none;
    -webkit-user-drag: none;
  }

  .slide-fs-close,
  .slide-fs-arrow {
    position: absolute;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: 1px solid rgba(255, 255, 255, 0.22);
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.55);
    color: #fff;
    font-family: inherit;
    cursor: pointer;
    -webkit-backdrop-filter: blur(8px);
    backdrop-filter: blur(8px);
  }

  .slide-fs-close {
    top: 10px;
    right: 10px;
    width: 38px;
    height: 38px;
    font-size: 22px;
    line-height: 1;
  }

  .slide-fs-arrow {
    top: 50%;
    width: 38px;
    height: 38px;
    font-size: 15px;
    transform: translateY(-50%);
  }

  .slide-fs-arrow.prev { left: 10px; }
  .slide-fs-arrow.next { right: 10px; }

  .slide-fs-footer {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 10px;
    z-index: 2;
    display: flex;
    justify-content: center;
    pointer-events: none;
  }

  .slide-fs-counter {
    padding: 5px 10px;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.55);
    color: #fff;
    font-size: 12px;
    font-weight: 200;
    -webkit-backdrop-filter: blur(8px);
    backdrop-filter: blur(8px);
  }

  body.slide-fs-open { overflow: hidden; }

  /* -------------------------------------------------------------- tools */
  .tools-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
    max-width: 860px;
    margin: 0 auto;
  }

  .tools h2 { text-align: center; }

  .tools-row img {
    display: block;
    width: auto;
    height: 60px;
    object-fit: contain;
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

  .copyright {
    padding: 20px 24px 26px;
    color: rgba(249, 249, 249, 0.55);
    font-size: 11px;
    font-weight: 200;
    text-align: center;
  }

  @media (max-width: 700px) {
    :root {
      --pad: 24px;
      --section-y: 38px;
    }

    .hero {
      min-height: 435px;
      padding: 44px 20px;
    }

    .hero h1 { font-size: 56px; }
    .hero-sub { font-size: 15px; margin-top: 14px; }

    .section h2 {
      margin-bottom: 22px;
      font-size: 42px;
    }

    .overview p { font-size: 16px; line-height: 1.6; }

    .rooms-grid { display: block; }
    .room-column { display: block; }
    .room {
      width: 100%;
      max-width: 230px;
      margin: 0 auto;
    }
    .room + .room { margin-top: 24px; }
    .room h3 {
      margin-bottom: 10px;
      font-size: 20px;
    }

    .slideshow { max-width: none; }
    .slide-arrow { opacity: 1; }
    .slide-arrow.prev { left: 6px; }
    .slide-arrow.next { right: 6px; }
    .slide-arrow {
      width: 30px;
      height: 30px;
      font-size: 12px;
    }
    .slide-counter { font-size: 10px; padding: 4px 7px; }
    .slide-dots { gap: 4px; padding-top: 10px; }
    .slide-dot { width: 5px; height: 5px; }

    .tools-row { justify-content: center; gap: 18px 24px; }
    .tools-row img { height: 44px; }

    .copyright { font-size: 11px; }
  }

  @media (max-width: 380px) {
    :root { --pad: 20px; }
    .hero h1 { font-size: 50px; }
    .room { max-width: 210px; }
  }

  @media (prefers-reduced-motion: reduce) {
    .slideshow-track,
    .slide-arrow,
    .slide-dot,
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
      <h1>${escapeHtml(data.HERO.title)}</h1>
      <p class="hero-sub">${escapeHtml(data.HERO.location)}</p>
      <p class="hero-sub">${escapeHtml(data.HERO.year)}</p>
    </div>
  </header>

  <section class="section overview" aria-labelledby="overview-title">
    <div class="wrap">
      <h2 id="overview-title">OVERVIEW</h2>
      <p>${escapeHtml(data.OVERVIEW_TEXT)}</p>
    </div>
  </section>

  <section class="section rooms" aria-label="Rooms">
    <div class="wrap">
      <div class="rooms-grid">
        <div class="room-column">
          ${leftRooms.map(room => roomMarkup(room, assetBase)).join('\n')}
        </div>
        <div class="room-column">
          ${rightRooms.map(room => roomMarkup(room, assetBase)).join('\n')}
        </div>
      </div>
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

<div class="slide-fs" id="abSlideFs" hidden role="dialog"
     aria-modal="true" aria-label="Slideshow fullscreen">
  <div class="slide-fs-backdrop" id="abSlideFsBackdrop"></div>
  <img class="slide-fs-image" id="abSlideFsImage" alt="" decoding="async">
  <button class="slide-fs-close" id="abSlideFsClose" type="button"
          aria-label="Close fullscreen">×</button>
  <button class="slide-fs-arrow prev" id="abSlideFsPrev" type="button"
          aria-label="Previous image">❮</button>
  <button class="slide-fs-arrow next" id="abSlideFsNext" type="button"
          aria-label="Next image">❯</button>
  <div class="slide-fs-footer">
    <span class="slide-fs-counter" id="abSlideFsCounter" aria-live="polite">1 / 1</span>
  </div>
</div>

<script>
(function () {
  'use strict';

  var fsViewer = document.getElementById('abSlideFs');
  var fsImage = document.getElementById('abSlideFsImage');
  var fsBackdrop = document.getElementById('abSlideFsBackdrop');
  var fsCounter = document.getElementById('abSlideFsCounter');
  var fsClose = document.getElementById('abSlideFsClose');
  var fsPrev = document.getElementById('abSlideFsPrev');
  var fsNext = document.getElementById('abSlideFsNext');
  var fsActive = false;
  var fsSlideshow = null;
  var fsReturnFocus = null;
  var fsSwiped = false;

  function imageSource(image) {
    if (!image) return '';
    var src = image.currentSrc || image.getAttribute('src');
    var picture = image.parentElement;
    var source = picture && picture.tagName === 'PICTURE'
      ? picture.querySelector('source[media]') : null;
    if (source && window.matchMedia &&
        window.matchMedia(source.getAttribute('media')).matches) {
      src = source.getAttribute('srcset');
    }
    return src;
  }

  function preload(slides, at) {
    var count = slides.length;
    if (!count) return;
    var target = slides[((at % count) + count) % count];
    if (!target) return;
    var image = target.querySelector('img');
    if (!image || image.complete) return;
    var src = imageSource(image);
    if (!src) return;
    var warm = new Image();
    warm.decoding = 'async';
    warm.src = src;
  }

  function fsHeight() {
    var screenHeight = 0;
    if (window.screen) {
      screenHeight = window.screen.availHeight || window.screen.height || 0;
    }
    var height = window.innerHeight || 0;
    if (screenHeight > 0) height = Math.min(height || screenHeight, screenHeight);
    if (!height || !isFinite(height)) height = Math.min(window.innerHeight || 900, 900);
    return Math.max(300, Math.min(height, 1200));
  }

  function updateFs() {
    if (!fsActive || !fsSlideshow) return;
    var slides = fsSlideshow.querySelectorAll('.slide');
    var current = fsSlideshow.__current();
    var image = slides[current] && slides[current].querySelector('img');
    var src = imageSource(image);
    if (src) {
      fsImage.src = src;
      fsBackdrop.style.backgroundImage = 'url("' + src.replace(/"/g, '%22') + '")';
    }
    fsImage.alt = 'AB-Apartment image ' + (current + 1);
    fsCounter.textContent = (current + 1) + ' / ' + slides.length;
  }

  function layoutFs() {
    if (!fsActive || !fsViewer) return;
    var panelHeight = fsHeight();
    fsViewer.style.height = Math.round(panelHeight) + 'px';
    var rect = fsSlideshow.getBoundingClientRect();
    var scrollTop = window.pageYOffset ||
      document.documentElement.scrollTop || document.body.scrollTop || 0;
    var pageHeight = document.documentElement.scrollHeight ||
      document.body.scrollHeight || 0;
    var top = rect.top + scrollTop - Math.round(panelHeight * 0.08);
    var maxTop = Math.max(0, pageHeight - panelHeight);
    top = Math.max(0, Math.min(top, maxTop));
    fsViewer.style.top = Math.round(top) + 'px';
  }

  function revealFs() {
    if (!fsActive || !fsViewer || !fsViewer.scrollIntoView) return;
    try {
      fsViewer.scrollIntoView({ block: 'center', inline: 'nearest' });
    } catch (error) {
      // Scrolling is a convenience; the viewer still works without it.
    }
  }

  function openFs(slideshow) {
    if (!fsViewer || fsActive) return;
    fsActive = true;
    fsSlideshow = slideshow;
    fsReturnFocus = document.activeElement;
    fsViewer.hidden = false;
    fsViewer.classList.add('is-open');
    document.body.classList.add('slide-fs-open');
    updateFs();
    layoutFs();
    revealFs();
    if (fsClose) fsClose.focus({ preventScroll: true });
    setTimeout(function () {
      if (!fsActive) return;
      layoutFs();
      revealFs();
    }, 60);
  }

  function closeFs() {
    if (!fsActive) return;
    fsActive = false;
    fsViewer.classList.remove('is-open');
    fsViewer.hidden = true;
    document.body.classList.remove('slide-fs-open');
    if (fsReturnFocus && fsReturnFocus.focus) {
      fsReturnFocus.focus({ preventScroll: true });
    }
    fsSlideshow = null;
  }

  function stepFs(delta) {
    if (fsSlideshow) fsSlideshow.__step(delta);
  }

  if (fsClose) fsClose.addEventListener('click', closeFs);
  if (fsPrev) fsPrev.addEventListener('click', function () { stepFs(-1); });
  if (fsNext) fsNext.addEventListener('click', function () { stepFs(1); });

  if (fsViewer) {
    fsViewer.addEventListener('click', function (event) {
      if (fsSwiped) {
        fsSwiped = false;
        return;
      }
      if (event.target === fsViewer) closeFs();
    });
    fsViewer.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        closeFs();
        event.preventDefault();
      } else if (event.key === 'ArrowLeft') {
        stepFs(-1);
        event.preventDefault();
      } else if (event.key === 'ArrowRight') {
        stepFs(1);
        event.preventDefault();
      } else if (event.key === 'Home') {
        if (fsSlideshow) fsSlideshow.__show(0);
        event.preventDefault();
      } else if (event.key === 'End') {
        if (fsSlideshow) {
          fsSlideshow.__show(fsSlideshow.querySelectorAll('.slide').length - 1);
        }
        event.preventDefault();
      }
    });

    var fsStartX = 0;
    var fsStartY = 0;
    var fsTracking = false;
    fsViewer.addEventListener('touchstart', function (event) {
      fsSwiped = false;
      if (event.touches.length !== 1) {
        fsTracking = false;
        return;
      }
      fsTracking = true;
      fsStartX = event.touches[0].clientX;
      fsStartY = event.touches[0].clientY;
    }, { passive: true });
    fsViewer.addEventListener('touchend', function (event) {
      if (!fsTracking) return;
      fsTracking = false;
      var touch = event.changedTouches[0];
      if (!touch) return;
      var dx = touch.clientX - fsStartX;
      var dy = touch.clientY - fsStartY;
      if (Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        fsSwiped = true;
        stepFs(dx < 0 ? 1 : -1);
      }
    }, { passive: true });
  }

  window.addEventListener('resize', function () {
    if (fsActive) layoutFs();
  });
  window.addEventListener('orientationchange', function () {
    if (!fsActive) return;
    layoutFs();
    revealFs();
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && fsActive) closeFs();
  });

  function initSlideshow(slideshow) {
    var track = slideshow.querySelector('.slideshow-track');
    var slides = Array.prototype.slice.call(track.querySelectorAll('.slide'));
    var dotsBox = slideshow.querySelector('.slide-dots');
    var counter = slideshow.querySelector('.slide-counter');
    var prev = slideshow.querySelector('.slide-arrow.prev');
    var next = slideshow.querySelector('.slide-arrow.next');
    var fsButton = slideshow.querySelector('.slide-fs-button');
    var count = slides.length;
    var index = 0;
    slideshow.style.setProperty('--count', String(count));

    var dots = slides.map(function (_, i) {
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'slide-dot';
      dot.setAttribute('aria-label', 'Show image ' + (i + 1) + ' of ' + count);
      dot.addEventListener('click', function () { show(i); });
      dotsBox.appendChild(dot);
      return dot;
    });

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
        preload(slides, index + 1);
        preload(slides, index - 1);
      }
      if (fsActive && fsSlideshow === slideshow) updateFs();
    }

    function step(delta) { show(index + delta); }

    slideshow.__show = show;
    slideshow.__step = step;
    slideshow.__current = function () { return index; };

    if (fsButton) {
      fsButton.addEventListener('click', function (event) {
        event.stopPropagation();
        openFs(slideshow);
      });
    }

    if (prev) prev.addEventListener('click', function () { step(-1); });
    if (next) next.addEventListener('click', function () { step(1); });

    slideshow.addEventListener('keydown', function (event) {
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

    var stage = slideshow.querySelector('.slideshow-stage');
    if (stage) {
      stage.addEventListener('click', function (event) {
        if (event.target.closest('button')) return;
        slideshow.focus({ preventScroll: true });
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

    show(0);
  }

  Array.prototype.slice.call(document.querySelectorAll('.slideshow')).forEach(initSlideshow);
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
  console.log('Wrote ' + path.relative(ROOT, PRODUCTION_FILE) + ' (' +
    Buffer.byteLength(production) + ' bytes)');
  console.log('Wrote ' + path.relative(ROOT, PREVIEW_FILE) + ' (' +
    Buffer.byteLength(preview) + ' bytes)');
}

main();
