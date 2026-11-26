'use strict';

/**
 * Generates the standalone DK-Apartment project page.
 *
 * Source of truth: dk-apartment-data.js
 * Outputs:
 *   04_APPS_SCRIPT/DKApartment.html
 *   03_REBUILT_SLIDESHOWS/preview/dk-apartment.html
 */

const fs = require('fs');
const path = require('path');
const data = require('./dk-apartment-data');

const ROOT = path.resolve(__dirname, '..');
const APPS_DIR = path.join(ROOT, '04_APPS_SCRIPT');
const PREVIEW_DIR = path.join(ROOT, '03_REBUILT_SLIDESHOWS', 'preview');
const PRODUCTION_FILE = path.join(APPS_DIR, 'DKApartment.html');
const PREVIEW_FILE = path.join(PREVIEW_DIR, 'dk-apartment.html');

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

function renderSlides() {
  return data.RENDERS.map((id, index) => {
    const loading = index === 0 ? ' loading="eager"' : ' loading="lazy"';
    return [
      '          <figure class="slide" aria-roledescription="slide" aria-label="Slide ' +
        (index + 1) + ' of ' + data.RENDERS.length + '">',
      '            <picture>',
      '              <source media="(max-width: 700px)" srcset="' +
        data.renderThumbUrl(id) + '">',
      '              <img src="' + data.renderUrl(id) + '" alt="DK-Apartment slide ' +
        (index + 1) + '"' + loading + ' decoding="async">',
      '            </picture>',
      '          </figure>'
    ].join('\n');
  }).join('\n');
}

function slideshowMarkup() {
  return [
    '<div class="slideshow" id="rendersSlideshow" tabindex="0" role="region"',
    '     aria-roledescription="carousel" aria-label="DK-Apartment presentation images">',
    '  <div class="slideshow-stage" id="slideshowStage">',
    '    <div class="slideshow-track" id="slideshowTrack">',
    renderSlides(),
    '    </div>',
    '    <span class="slide-counter" id="slideCounter" aria-live="polite">1 / ' +
      data.RENDERS.length + '</span>',
    '    <button class="slide-arrow prev" id="slidePrev" type="button" aria-label="Previous image">❮</button>',
    '    <button class="slide-arrow next" id="slideNext" type="button" aria-label="Next image">❯</button>',
    '  </div>',
    '  <div class="slide-dots" id="slideDots" role="group" aria-label="Choose an image"></div>',
    '</div>'
  ].join('\n');
}

function videoMarkup(video) {
  return [
    '<figure class="video-frame">',
    '  <iframe src="' + escapeHtml(data.vimeoEmbed(video)) + '"',
    '          title="' + escapeHtml(video.title) + '"',
    '          loading="lazy" allow="autoplay; fullscreen; picture-in-picture; encrypted-media"',
    '          allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>',
    '</figure>'
  ].join('\n');
}

function imageMarkup(image, assetBase) {
  return [
    '<figure class="shot">',
    '  <picture>',
    '    <source media="(max-width: 700px)" srcset="' +
      data.assetUrl(assetBase, image.name, 768) + '">',
    '    <img src="' + data.assetUrl(assetBase, image.name, 1280) + '"',
    '         alt="' + escapeHtml(image.alt) + '" loading="lazy" decoding="async">',
    '  </picture>',
    '</figure>'
  ].join('\n');
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

  /* -------------------------------------------------------- slideshow */
  .slideshow {
    width: 100%;
    max-width: 1100px;
    outline: none;
  }

  .slideshow:focus-visible {
    outline: 2px solid rgba(249, 249, 249, 0.8);
    outline-offset: 6px;
  }

  .slideshow-stage {
    position: relative;
    aspect-ratio: 1335 / 993;
    overflow: hidden;
    border-radius: var(--radius);
    background: #080808;
    cursor: grab;
    touch-action: pan-y;
  }

  .slideshow-stage:active { cursor: grabbing; }

  .slideshow-track {
    display: flex;
    width: ${data.RENDERS.length * 100}%;
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
    flex-wrap: wrap;
    gap: 6px;
    padding-top: 16px;
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

  /* ------------------------------------------------------------- images */
  .images-grid {
    display: flex;
    gap: 12px;
    align-items: stretch;
  }

  .image-column {
    display: flex;
    flex-direction: column;
    gap: 12px;
    flex: 1 1 0;
    min-width: 0;
  }

  .image-column-wide { flex: 2 1 0; }

  .shot {
    margin: 0;
    flex: 1 1 0;
    min-height: 0;
    overflow: hidden;
    border-radius: 16px;
    background: #0a0a0a;
  }

  .shot picture,
  .shot img {
    display: block;
    width: 100%;
    height: 100%;
  }

  .shot img { object-fit: cover; }

  .video-frame {
    margin: 0;
    flex: 1 1 0;
    min-height: 0;
    overflow: hidden;
    border-radius: var(--radius);
    background: #080808;
  }

  .image-column-wide .video-frame {
    flex: 0 0 auto;
    aspect-ratio: 9 / 16;
  }

  .video-frame iframe {
    display: block;
    width: 100%;
    height: 100%;
    border: 0;
  }

  .caption {
    margin: 22px 0 0;
    color: #ff3b30;
    font-size: clamp(15px, 1.3vw, 18px);
    font-weight: 200;
    text-align: center;
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

    .slideshow { max-width: none; }
    .slide-arrow { opacity: 1; }
    .slide-dots { gap: 5px; padding-top: 12px; }
    .slide-dot { width: 5px; height: 5px; }

    .images-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
    }
    .image-column { display: contents; }
    .image-column > * + * { margin-top: 0; }
    .shot {
      width: 100%;
      height: 100%;
    }
    .shot picture, .shot img { height: 100%; }
    .shot img { object-fit: cover; }
    .video-frame,
    .image-column-wide .video-frame {
      width: 100%;
      aspect-ratio: 9 / 16;
      flex: none;
    }
    .image-column-wide .video-frame { grid-column: 1 / -1; }

    .caption { margin-top: 16px; }

    .tools-row { justify-content: center; gap: 18px 24px; }
    .tools-row img { height: 44px; }

    .copyright { font-size: 11px; }
  }

  @media (max-width: 380px) {
    :root { --pad: 20px; }
    .hero h1 { font-size: 50px; }
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

  <section class="section presentation" aria-labelledby="presentation-title">
    <div class="wrap">
      <h2 id="presentation-title">PRESENTATION</h2>
      ${slideshowMarkup()}
    </div>
  </section>

  <section class="section images" aria-labelledby="images-title">
    <div class="wrap">
      <h2 id="images-title">IMAGES</h2>
      <div class="images-grid">
        <div class="image-column">
          ${imageMarkup(data.IMAGES[0], assetBase)}
          ${imageMarkup(data.IMAGES[1], assetBase)}
        </div>
        <div class="image-column">
          ${imageMarkup(data.IMAGES[2], assetBase)}
          ${videoMarkup(data.VIDEOS[0])}
        </div>
        <div class="image-column image-column-wide">
          ${videoMarkup(data.VIDEOS[1])}
        </div>
      </div>
      <p class="caption">${escapeHtml(data.CAPTION)}</p>
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
    dot.setAttribute('aria-label', 'Show image ' + (i + 1) + ' of ' + count);
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
