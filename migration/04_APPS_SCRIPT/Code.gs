/**
 * Shared stateless embed renderer.
 *
 * One request = one slideshow, one TOOLS USED strip, or the standalone
 * Al-Rashed project page. This file intentionally has no index, gallery,
 * dashboard, or multi-item route. Missing, repeated, array, list, or unknown
 * IDs return a neutral error page with no links.
 *
 * The SLIDES lookup is generated in SlidesData.gs and the TOOLS lookup in
 * ToolsData.gs. Neither map is sent wholesale to the browser.
 */

function doGet(e) {
  // Require exactly one known key. Checking the raw query string catches
  // repeated parameters even if Apps Script collapses them to one value.
  var queryString = e && e.queryString;
  var slideCount = countQueryParameters_(queryString, 'slide');
  var toolsCount = countQueryParameters_(queryString, 'tools');
  var pageCount = countQueryParameters_(queryString, 'page');

  if (pageCount === 1 && slideCount === 0 && toolsCount === 0) {
    return alRashedResponse_(e);
  }
  if (slideCount === 1 && toolsCount === 0 && pageCount === 0) {
    return slideshowResponse_(e);
  }
  if (toolsCount === 1 && slideCount === 0 && pageCount === 0) {
    return toolsResponse_(e);
  }
  return notFoundResponse_();
}

/**
 * Standalone Al-Rashed project page. The page is a static HTML file so the
 * shared slideshow and tools routes are untouched.
 */
function alRashedResponse_(e) {
  var raw = e.parameter.page;

  if (typeof raw !== 'string' || raw.trim().toLowerCase() !== 'al-rashed') {
    return notFoundResponse_();
  }

  return HtmlService.createHtmlOutputFromFile('AlRashed')
    .setTitle('Al-Rashed Project — Hossam Alafandi')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function slideshowResponse_(e) {
  var raw = e.parameter.slide;

  // Require a single non-empty string. Arrays and other types are rejected
  // rather than rendered as a combined view.
  if (typeof raw !== 'string' || raw.trim() === '') {
    return notFoundResponse_();
  }

  var id = raw.trim().toUpperCase();
  var slide = Object.prototype.hasOwnProperty.call(SLIDES, id) ? SLIDES[id] : null;
  if (!slide) {
    return notFoundResponse_();
  }

  var pageTitle = slide.project_title + ' — ' + slide.section_label;
  var template = HtmlService.createTemplateFromFile('Slideshow');
  template.pageTitle = pageTitle;
  // Per-slideshow opt-in generated in SlidesData.gs. Classic slides get an
  // empty attribute and no style, so the fit CSS stays inert.
  template.layoutMode = slide.layout === 'fit' ? 'fit' : '';
  template.layoutStyle = layoutStyle_(slide);
  template.imagesHtml = renderImages_(slide.images);

  return template.evaluate()
    .setTitle(pageTitle)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function toolsResponse_(e) {
  var raw = e.parameter.tools;

  if (typeof raw !== 'string' || raw.trim() === '') {
    return notFoundResponse_();
  }

  var id = raw.trim().toUpperCase();
  var tool = Object.prototype.hasOwnProperty.call(TOOLS, id) ? TOOLS[id] : null;
  if (!tool) {
    return notFoundResponse_();
  }

  var html = [
    '<!DOCTYPE html>',
    '<html lang="en"><head>',
    '<meta charset="UTF-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<title>' + escapeHtml_(tool.title) + '</title>',
    '<style>' + tool.style + '</style>',
    '</head><body>',
    tool.row,
    '</body></html>'
  ].join('\n');

  return HtmlService.createHtmlOutput(html)
    .setTitle(tool.title)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Count exact query keys. Wildcards, lists, and repeated keys are rejected by
 * requiring the matching count to be exactly one.
 */
function countQueryParameters_(queryString, keyName) {
  if (!queryString) return 0;
  return queryString.split('&').reduce(function (count, pair) {
    var rawKey = pair.split('=')[0].replace(/\+/g, ' ');
    var key;
    try {
      key = decodeURIComponent(rawKey);
    } catch (error) {
      key = rawKey;
    }
    return key === keyName ? count + 1 : count;
  }, 0);
}

/**
 * Render only the requested slideshow's images, in audited order.
 * URLs are used verbatim; alt text is escaped.
 */
/**
 * Size the opt-in phone card to the first image's aspect ratio. The value is
 * written as a CSS custom property on the slideshow container; classic slides
 * return an empty string and keep the original full-frame layout.
 */
function layoutStyle_(slide) {
  if (slide.layout !== 'fit' || !slide.images || !slide.images.length) {
    return '';
  }
  var first = slide.images[0];
  var width = Number(first.w);
  var height = Number(first.h);
  if (!Number.isFinite(width) || !Number.isFinite(height) ||
      width <= 0 || height <= 0) {
    return '';
  }
  return ' style="--fit-aspect:' + (width / height).toFixed(6) + '"';
}

function renderImages_(images) {
  return images.map(function (image, index) {
    // Every archived original marks its images loading="eager". Preserve that
    // so navigation never reveals an unloaded slide.
    var loading = 'eager';
    var alt = escapeHtml_(image.alt || ('Slide ' + (index + 1)));
    return '    <div class="slide"><img src="' + image.src +
      '" alt="' + alt + '" loading="' + loading + '"></div>';
  }).join('\n');
}

function escapeHtml_(value) {
  return String(value).replace(/[&<>"']/g, function (character) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[character];
  });
}

/**
 * Neutral error page. Deliberately contains no gallery, catalog, previews, or
 * links to other slideshows.
 */
function notFoundResponse_() {
  var html = [
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

  return HtmlService.createHtmlOutput(html)
    .setTitle('Slideshow unavailable')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
