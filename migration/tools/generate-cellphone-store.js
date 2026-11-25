'use strict';

/**
 * Generates the standalone Cellphone Store project page.
 *
 * Source of truth: cellphone-data.js
 * Outputs:
 *   04_APPS_SCRIPT/CellphoneStore.html
 *   03_REBUILT_SLIDESHOWS/preview/cellphone-store.html
 */

const fs = require('fs');
const path = require('path');
const data = require('./cellphone-data');

const ROOT = path.resolve(__dirname, '..');
const APPS_DIR = path.join(ROOT, '04_APPS_SCRIPT');
const PREVIEW_DIR = path.join(ROOT, '03_REBUILT_SLIDESHOWS', 'preview');
const PRODUCTION_FILE = path.join(APPS_DIR, 'CellphoneStore.html');
const PREVIEW_FILE = path.join(PREVIEW_DIR, 'cellphone-store.html');

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

function shotMarkup(name, alt, assetBase, className) {
  const classes = 'shot' + (className ? ' ' + className : '');
  return [
    '<figure class="' + classes + '">',
    '  <picture>',
    '    <source media="(max-width: 700px)" srcset="' +
      data.assetUrl(assetBase, name, 768) + '">',
    '    <img src="' + data.assetUrl(assetBase, name, 1280) + '"',
    '         alt="' + escapeHtml(alt) + '" loading="lazy" decoding="async">',
    '  </picture>',
    '</figure>'
  ].join('\n');
}

function imageGrid(images, altPrefix, assetBase) {
  return [
    '<div class="image-grid">',
    images.map((name, index) =>
      shotMarkup(name, altPrefix + ' ' + (index + 1), assetBase)).join('\n'),
    '</div>'
  ].join('\n');
}

function videoMarkup(video) {
  return [
    '<figure class="video-frame">',
    '  <iframe src="' + escapeHtml(video.embed) + '"',
    '          title="' + escapeHtml(video.title) + '"',
    '          loading="lazy" allow="autoplay; fullscreen; picture-in-picture; encrypted-media"',
    '          allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>',
    '</figure>'
  ].join('\n');
}

function renderSlides(assetBase) {
  return data.RENDERS.map((id, index) => {
    const loading = index === 0 ? ' loading="eager"' : ' loading="lazy"';
    return [
      '          <figure class="slide" aria-roledescription="slide" aria-label="Render ' +
        (index + 1) + ' of ' + data.RENDERS.length + '">',
      '            <picture>',
      '              <source media="(max-width: 700px)" srcset="' +
        data.renderThumbUrl(id) + '">',
      '              <img src="' + data.renderUrl(id) + '" alt="Cellphone Store render ' +
        (index + 1) + '"' + loading + ' decoding="async">',
      '            </picture>',
      '          </figure>'
    ].join('\n');
  }).join('\n');
}

function slideshowMarkup(assetBase) {
  return [
    '<div class="slideshow" id="rendersSlideshow" tabindex="0" role="region"',
    '     aria-roledescription="carousel" aria-label="Cellphone Store renders">',
    '  <div class="slideshow-stage" id="slideshowStage">',
    '    <div class="slideshow-track" id="slideshowTrack">',
    renderSlides(assetBase),
    '    </div>',
    '    <span class="slide-counter" id="slideCounter" aria-live="polite">1 / ' +
      data.RENDERS.length + '</span>',
    '    <button class="slide-arrow prev" id="slidePrev" type="button" aria-label="Previous render">❮</button>',
    '    <button class="slide-arrow next" id="slideNext" type="button" aria-label="Next render">❯</button>',
    '  </div>',
    '  <div class="slide-dots" id="slideDots" role="group" aria-label="Choose a render"></div>',
    '</div>'
  ].join('\n');
}

function stageMedia(stage, assetBase) {
  if (stage.media === 'text') return '';

  if (stage.media === 'video-images') {
    return [
      '<div class="stage-media split video-images">',
      '  <div class="video-single">',
      stage.videos.map(videoMarkup).join('\n'),
      '  </div>',
      '  <div class="image-single-grid">',
      imageGrid(stage.images, 'Inspecting photo', assetBase),
      '  </div>',
      '</div>'
    ].join('\n');
  }

  if (stage.media === 'slideshow-drawing') {
    return [
      '<div class="stage-media split slideshow-drawing">',
      '  <div class="slideshow-column">',
      slideshowMarkup(assetBase),
      '  </div>',
      '  <div class="drawing-column">',
      shotMarkup(stage.drawing, 'Planning technical drawing', assetBase, 'drawing'),
      '  </div>',
      '</div>'
    ].join('\n');
  }

  if (stage.media === 'videos') {
    return [
      '<div class="stage-media video-row">',
      stage.videos.map(videoMarkup).join('\n'),
      '</div>'
    ].join('\n');
  }

  if (stage.media === 'groups') {
    return stage.groups.map((group, index) => [
      '<div class="stage-media split stage-group' + (index ? ' stage-group-spaced' : '') + '">',
      '  <div class="video-single">',
      videoMarkup(group.video),
      '  </div>',
      '  <div class="image-single-grid">',
      imageGrid(group.images, 'Flooring photo', assetBase),
      '  </div>',
      '</div>'
    ].join('\n')).join('\n');
  }

  return '';
}

function stageMarkup(stage, assetBase) {
  return [
    '<article class="stage" id="stage-' + stage.id + '">',
    '  <h3>' + escapeHtml(stage.title) + '</h3>',
    '  <p class="stage-text">' + escapeHtml(stage.text) + '</p>',
    stageMedia(stage, assetBase),
    '</article>'
  ].join('\n');
}

function realityMarkup(assetBase) {
  return data.REALITY.map(item => [
    '<div class="reality-row">',
    shotMarkup(item.render, item.alt + ' — render', assetBase),
    '  <span class="reality-arrow" aria-hidden="true">➜</span>',
    shotMarkup(item.photo, item.alt + ' — reality', assetBase),
    '</div>'
  ].join('\n')).join('\n');
}

function toolsMarkup() {
  return data.TOOLS.map(tool => [
    '  <img src="' + data.toolUrl(tool.id) + '" alt="' + escapeHtml(tool.name) +
      ' Logo" loading="lazy" decoding="async">'
  ].join('\n')).join('\n');
}

function buildPage(assetBase) {
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
    --stage-gap: 64px;
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

  .hero-content {
    position: relative;
    z-index: 2;
    width: 100%;
  }

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
  .section {
    width: 100%;
    padding: var(--section-y) 0;
  }

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

  .stages-section { padding-bottom: calc(var(--section-y) + 4px); }

  .stage + .stage {
    margin-top: var(--stage-gap);
    padding-top: var(--stage-gap);
    border-top: 1px solid rgba(249, 249, 249, 0.16);
  }

  .stage h3 {
    margin: 0 0 18px;
    font-size: clamp(25px, 2.6vw, 34px);
    font-weight: 900;
    line-height: 1.05;
    letter-spacing: -0.02em;
  }

  .stage-text {
    max-width: 1040px;
    margin: 0;
    color: var(--muted);
    font-size: clamp(15px, 1.2vw, 17px);
    line-height: 1.58;
  }

  .stage-media { margin-top: 30px; }

  .split {
    display: grid;
    grid-template-columns: minmax(0, 1.08fr) minmax(0, 1fr);
    gap: 24px;
    align-items: start;
  }

  .video-single { min-width: 0; }

  .image-single-grid { min-width: 0; }

  .image-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    align-items: start;
  }

  .video-frame {
    margin: 0;
    aspect-ratio: 9 / 16;
    overflow: hidden;
    border-radius: var(--radius);
    background: #080808;
  }

  .video-frame iframe {
    display: block;
    width: 100%;
    height: 100%;
    border: 0;
  }

  .video-row {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 24px;
  }

  .shot {
    margin: 0;
    overflow: hidden;
    border-radius: 16px;
    background: #0a0a0a;
  }

  .shot img {
    display: block;
    width: 100%;
    height: auto;
  }

  .drawing-column { min-width: 0; }

  .drawing { border-radius: var(--radius); }

  .stage-group-spaced { margin-top: 36px; }

  /* -------------------------------------------------------- slideshow */
  .slideshow-column { min-width: 0; }

  .slideshow {
    width: 100%;
    max-width: 659px;
    outline: none;
  }

  .slideshow:focus-visible {
    outline: 2px solid rgba(249, 249, 249, 0.8);
    outline-offset: 6px;
  }

  .slideshow-stage {
    position: relative;
    aspect-ratio: 659 / 927;
    overflow: hidden;
    border-radius: var(--radius);
    background: #080808;
    cursor: grab;
    touch-action: pan-y;
  }

  .slideshow-stage:active { cursor: grabbing; }

  .slideshow-track {
    display: flex;
    height: 100%;
    transition: transform 0.5s cubic-bezier(0.22, 0.61, 0.36, 1);
    will-change: transform;
  }

  .slide {
    flex: 0 0 calc(100% / ${data.RENDERS.length});
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
  .slide-arrow.prev { left: 12px; }
  .slide-arrow.next { right: 12px; }

  .slide-counter {
    position: absolute;
    top: 12px;
    right: 12px;
    z-index: 3;
    padding: 6px 10px;
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.5);
    color: #fff;
    font-size: 12px;
    font-weight: 200;
    -webkit-backdrop-filter: blur(6px);
    backdrop-filter: blur(6px);
  }

  .slide-dots {
    display: flex;
    justify-content: center;
    gap: 8px;
    padding-top: 16px;
  }

  .slide-dot {
    width: 7px;
    height: 7px;
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

  /* ---------------------------------------------------- render vs reality */
  .reality-list { display: grid; gap: 34px; }

  .reality-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    gap: 20px;
    align-items: center;
  }

  .reality-arrow {
    color: #fff;
    font-size: clamp(36px, 5vw, 72px);
    font-weight: 200;
    line-height: 1;
  }

  /* ------------------------------------------------------------ location */
  .map-frame {
    display: block;
    width: 100%;
    height: 335px;
    border: 0;
    border-radius: var(--radius);
    background: #0a0a0a;
  }

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
      --stage-gap: 44px;
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

    .stage h3 { font-size: 24px; margin-bottom: 14px; }
    .stage-text { font-size: 15px; line-height: 1.6; }
    .stage-media { margin-top: 22px; }

    .split { display: block; }
    .split > * + * { margin-top: 18px; }

    .video-row {
      display: flex;
      gap: 12px;
      overflow-x: auto;
      scroll-snap-type: x mandatory;
      padding-bottom: 6px;
      -webkit-overflow-scrolling: touch;
    }

    .video-row .video-frame {
      flex: 0 0 86%;
      scroll-snap-align: start;
    }

    .image-grid { gap: 10px; }

    .slideshow { max-width: none; }

    .slide-arrow { opacity: 1; }

    .reality-list { gap: 22px; }
    .reality-row { gap: 8px; }
    .reality-arrow { font-size: 24px; }

    .map-frame { height: 260px; }
    .tools-row { justify-content: center; gap: 18px 24px; }
    .tools-row img { height: 44px; }

    .copyright { font-size: 11px; }
  }

  @media (max-width: 380px) {
    :root { --pad: 20px; }
    .hero h1 { font-size: 50px; }
    .reality-row {
      grid-template-columns: minmax(0, 1fr) 14px minmax(0, 1fr);
      gap: 5px;
    }
    .reality-arrow { font-size: 18px; }
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

  <section class="section stages-section" aria-labelledby="stages-title">
    <div class="wrap">
      <h2 id="stages-title">WORK DEVELOPMENT STAGES</h2>
      ${data.STAGES.map(stage => stageMarkup(stage, assetBase)).join('\n')}
    </div>
  </section>

  <section class="section reality" aria-labelledby="reality-title">
    <div class="wrap">
      <h2 id="reality-title">Render VS Reality</h2>
      <div class="reality-list">
        ${realityMarkup(assetBase)}
      </div>
    </div>
  </section>

  <section class="section location" aria-labelledby="location-title">
    <div class="wrap">
      <h2 id="location-title">LOCATION</h2>
      <iframe class="map-frame" src="${escapeHtml(data.MAP_URL)}"
              title="Cellphone Store location map" loading="lazy"
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

  var slideshow = document.getElementById('rendersSlideshow');
  if (!slideshow) return;

  var stage = document.getElementById('slideshowStage');
  var track = document.getElementById('slideshowTrack');
  var slides = Array.prototype.slice.call(track.querySelectorAll('.slide'));
  var dotsBox = document.getElementById('slideDots');
  var counter = document.getElementById('slideCounter');
  var prev = document.getElementById('slidePrev');
  var next = document.getElementById('slideNext');
  var count = slides.length;
  var index = 0;

  var dots = slides.map(function (_, i) {
    var dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'slide-dot';
    dot.setAttribute('aria-label', 'Show render ' + (i + 1) + ' of ' + count);
    dot.addEventListener('click', function () { show(i); });
    dotsBox.appendChild(dot);
    return dot;
  });

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

  function preload(at) {
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
      preload(index + 1);
      preload(index - 1);
    }
  }

  function step(delta) { show(index + delta); }

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
