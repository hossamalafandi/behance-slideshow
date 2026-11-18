/**
 * Real published-Behance gate.
 *
 * Usage: node test-behance.js <published-behance-project-url> [--headful]
 *
 * Loads the real Behance page, locates the P001-S01 Apps Script iframe, verifies
 * its embedding attributes, and exercises navigation and fullscreen from inside
 * the iframe. Every image request on the page is aborted: Behance's own images
 * and the slideshow's imgur images are never downloaded or viewed.
 */
const { chromium } = require('playwright-core');

const url = process.argv[2];
const headful = process.argv.includes('--headful');

if (!url || !/^https:\/\/(www\.)?behance\.net\//.test(url)) {
  console.error('Usage: node test-behance.js <https://www.behance.net/gallery/...> [--headful]');
  process.exit(2);
}

const results = [];
let blockedImages = 0;

function record(name, passed, detail) {
  results.push({ name, passed, detail });
  console.log((passed ? 'PASS  ' : 'FAIL  ') + name + (detail ? ' — ' + detail : ''));
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function findEmbed(page, timeout) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const handle = await page.$('iframe[src*="script.google.com/macros/s/"]');
    if (handle) return handle;
    await page.mouse.wheel(0, 900);
    await wait(500);
  }
  return null;
}

async function findSlideshowFrame(page, timeout) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    for (const frame of page.frames()) {
      try {
        const count = await frame.evaluate(() => document.querySelectorAll('.slide').length);
        if (count > 0) return frame;
      } catch (error) {
        // Try again.
      }
    }
    await wait(250);
  }
  return null;
}

async function findWrapperFrame(page, timeout) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    for (const frame of page.frames()) {
      if (!frame.url().startsWith('https://script.google.com/macros/s/')) continue;
      try {
        const hasWrapper = await frame.evaluate(() => Boolean(document.getElementById('sandboxFrame')));
        if (hasWrapper) return frame;
      } catch (error) {
        // Try again.
      }
    }
    await wait(250);
  }
  return null;
}

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: !headful });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'en-US' });
  await context.route('**/*', route => {
    if (route.request().resourceType() === 'image') {
      blockedImages += 1;
      return route.abort();
    }
    return route.continue();
  });

  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await wait(2500);

  const embed = await findEmbed(page, 45000);
  record('Published Behance page contains the Apps Script iframe', Boolean(embed));
  if (!embed) {
    console.log(JSON.stringify({ results, blockedImages }, null, 2));
    await browser.close();
    process.exit(1);
  }

  await embed.scrollIntoViewIfNeeded();
  await wait(1500);

  const attributes = await embed.evaluate(element => {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return {
      src: element.src,
      width: element.getAttribute('width'),
      height: element.getAttribute('height'),
      allow: element.getAttribute('allow'),
      allowFullscreen: element.hasAttribute('allowfullscreen'),
      sandbox: element.getAttribute('sandbox'),
      loading: element.getAttribute('loading'),
      title: element.getAttribute('title'),
      rect: { width: rect.width, height: rect.height },
      border: style.border,
      borderRadius: style.borderRadius
    };
  });

  record('Iframe src requests exactly P001-S01',
    /\/exec\?slide=P001-S01$/.test(attributes.src), attributes.src.replace(/^.*\/s\//, '…/s/'));
  record('Iframe keeps allowfullscreen', attributes.allowFullscreen);
  record('Iframe keeps allow="fullscreen"', /\bfullscreen\b/.test(attributes.allow || ''), attributes.allow || '(none)');
  record('Behance did not add a restrictive sandbox', !attributes.sandbox, attributes.sandbox || 'none');
  record('Iframe has a non-zero rendered size',
    attributes.rect.width > 300 && attributes.rect.height > 400,
    Math.round(attributes.rect.width) + ' x ' + Math.round(attributes.rect.height));
  record('Iframe height is 805 or the Behance-scaled equivalent',
    attributes.rect.height >= 700,
    attributes.rect.height + ' px; declared ' + attributes.height);

  const wrapper = await findWrapperFrame(page, 30000);
  const wrapperState = wrapper ? await wrapper.evaluate(() => {
    const banner = document.getElementById('warning');
    const sandbox = document.getElementById('sandboxFrame');
    return {
      bannerHeight: banner ? banner.getBoundingClientRect().height : null,
      bannerText: banner ? (banner.innerText || '').trim() : '',
      sandboxHeight: sandbox ? sandbox.getBoundingClientRect().height : null
    };
  }) : null;
  record('No visible Google banner in the real Behance iframe',
    Boolean(wrapperState) && wrapperState.bannerHeight === 0,
    wrapperState ? wrapperState.bannerHeight + ' px' : 'wrapper not found');

  const frame = await findSlideshowFrame(page, 30000);
  record('Slideshow document loads inside Behance', Boolean(frame));
  if (!frame) {
    console.log(JSON.stringify({ results, blockedImages, attributes }, null, 2));
    await browser.close();
    process.exit(1);
  }

  await frame.waitForFunction(() => {
    return document.querySelectorAll('.slide').length === 17 &&
      document.querySelectorAll('.dot').length === 17;
  }, null, { timeout: 30000 });

  const initial = await frame.evaluate(() => {
    const images = Array.from(document.querySelectorAll('.slide img'));
    return {
      slides: images.length,
      dots: document.querySelectorAll('.dot').length,
      counter: document.getElementById('pageNumber').textContent,
      srcs: images.map(image => image.src),
      eager: images.every(image => image.getAttribute('loading') === 'eager'),
      fullscreenButton: Boolean(document.getElementById('fullscreenBtn')),
      innerWidth,
      innerHeight
    };
  });
  record('17 slides and 17 dots render in Behance', initial.slides === 17 && initial.dots === 17,
    initial.slides + ' slides, ' + initial.dots + ' dots');
  record('Counter starts at 1 / 17', initial.counter === '1 / 17', initial.counter);
  record('All images are eager remote imgur URLs',
    initial.eager && initial.srcs.every(src => src.startsWith('https://i.imgur.com/')),
    initial.srcs.length + ' remote URLs');
  record('Fullscreen button is present', initial.fullscreenButton);

  await frame.click('.next');
  await frame.waitForFunction(() => document.getElementById('pageNumber').textContent === '2 / 17');
  const afterNext = await frame.evaluate(() => ({
    counter: document.getElementById('pageNumber').textContent,
    active: Array.from(document.querySelectorAll('.dot')).findIndex(dot => dot.classList.contains('active'))
  }));
  record('Navigation works inside Behance', afterNext.counter === '2 / 17' && afterNext.active === 1,
    afterNext.counter + ', dot ' + (afterNext.active + 1));

  await frame.click('#fullscreenBtn');
  await wait(1500);
  const fullscreen = await frame.evaluate(() => {
    const element = document.fullscreenElement || document.webkitFullscreenElement;
    return {
      native: Boolean(element),
      targetIsContainer: element ? element.id === 'slideshow' : false,
      theater: document.getElementById('slideshow').classList.contains('theater-mode'),
      aria: document.getElementById('fullscreenBtn').getAttribute('aria-label')
    };
  });
  record('Fullscreen works from the real Behance parent',
    (fullscreen.native && fullscreen.targetIsContainer) || fullscreen.theater,
    JSON.stringify(fullscreen));

  if (fullscreen.native) {
    await frame.click('#fullscreenBtn');
    await wait(800);
    record('Fullscreen exits cleanly', await frame.evaluate(() => !document.fullscreenElement));
  } else {
    await frame.click('#fullscreenBtn');
    await wait(400);
    record('Theater mode exits cleanly',
      await frame.evaluate(() => !document.getElementById('slideshow').classList.contains('theater-mode')));
  }

  record('No uncaught page errors', pageErrors.length === 0, pageErrors.join(' | '));
  record('No image request was allowed', blockedImages > 0, blockedImages + ' image requests blocked');

  const failed = results.filter(result => !result.passed);
  console.log(JSON.stringify({
    url,
    checks: results.length,
    passed: results.length - failed.length,
    failed: failed.length,
    blockedImages,
    attributes,
    wrapper: wrapperState,
    results
  }, null, 2));

  await browser.close();
  process.exit(failed.length ? 1 : 0);
})().catch(async error => {
  console.error('ERROR: ' + error.stack);
  process.exit(1);
});
