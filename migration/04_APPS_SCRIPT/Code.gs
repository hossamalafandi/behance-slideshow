/**
 * Shared stateless slideshow renderer.
 *
 * One request = one slideshow. This file intentionally has no index, gallery,
 * dashboard, or multi-slideshow route. Missing, repeated, array, list, or
 * unknown IDs return a neutral error page with no links.
 *
 * The SLIDES lookup is generated in SlidesData.gs and is never sent wholesale
 * to the browser.
 */

function doGet(e) {
  // Require exactly one `slide` key in the query string. Checking the raw
  // query string catches repeated parameters even if Apps Script collapses
  // them to a single value in e.parameter.
  if (countSlideParameters_(e && e.queryString) !== 1) {
    return notFoundResponse_();
  }

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
  template.imagesHtml = renderImages_(slide.images);

  return template.evaluate()
    .setTitle(pageTitle)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Count exact `slide` query keys. Wildcards, lists, and repeated keys are
 * rejected by requiring the count to be exactly one.
 */
function countSlideParameters_(queryString) {
  if (!queryString) return 0;
  return queryString.split('&').reduce(function (count, pair) {
    var rawKey = pair.split('=')[0].replace(/\+/g, ' ');
    var key;
    try {
      key = decodeURIComponent(rawKey);
    } catch (error) {
      key = rawKey;
    }
    return key === 'slide' ? count + 1 : count;
  }, 0);
}

/**
 * Render only the requested slideshow's images, in audited order.
 * URLs are used verbatim; alt text is escaped.
 */
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
