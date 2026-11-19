/**
 * Real published-Behance gate.
 *
 * Usage: node test-behance.js <published-behance-project-url> [--slide P001-S01]
 *        [--count 17] [--height 805] [--width 987] [--headful]
 *
 * Loads the real Behance page, locates the Apps Script iframe for the requested
 * slideshow, verifies its embedding attributes, and exercises navigation and
 * fullscreen from inside the iframe. The generated data file supplies the
 * expected image count, height, and exact URL order when available. Every image
 * request on the page is aborted: Behance's own images and the slideshow's
 * imgur images are never downloaded or viewed.
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');

function option(name, fallback) {
  const index = process.argv.indexOf('--' + name);
  return index !== -1 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

const ROOT = path.resolve(__dirname, '..');
const url = process.argv[2];
const headful = process.argv.includes('--headful');
const slideId = option('slide', 'P001-S01').toUpperCase();
const deploymentId = process.env.SLIDESHOW_DEPLOYMENT_ID ||
  'AKfycbzV7OufIj8Q6yLZaKxccF_ETSNJ3l76gMV_s0cvIzkPnxND7ofDwOMn35gdPO_JxlZfHA';
const dataFile = path.join(ROOT, '03_REBUILT_SLIDESHOWS', 'data', slideId + '.json');
const slideData = fs.existsSync(dataFile)
  ? JSON.parse(fs.readFileSync(dataFile, 'utf8'))
  : null;
const expectedCount = Number(option('count', slideData ? slideData.images.length : 0));
const expectedHeight = Number(option('height', slideData ? slideData.embed_height : 0));
const expectedWidth = option('width', '') === '' ? null : Number(option('width', ''));
const expectedUrls = slideData ? slideData.images.map(image => image.src) : [];

if (!url || !/^https:\/\/(www\.)?behance\.net\//.test(url)) {
  console.error('Usage: node test-behance.js <https://www.behance.net/gallery/...> ' +
    '[--slide P001-S01] [--count 17] [--height 805] [--width 987] [--headful]');
  process.exit(2);
}
if (!/^P\d{3}-S\d{2}$/.test(slideId)) {
  console.error('Invalid slide ID: ' + slideId);
  process.exit(2);
}
if (!Number.isInteger(expectedCount) || expectedCount <= 0 ||
    !Number.isInteger(expectedHeight) || expectedHeight <= 0 ||
    (expectedWidth !== null && (!Number.isInteger(expectedWidth) || expectedWidth <= 0))) {
  console.error('The slideshow data file was not found; pass --count, --height, and optionally --width.');
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

/**
 * Behance answers a cold request with HTTP 403 and a tiny page that sets a
 * js_challenge_value cookie before reloading. Fetch the challenge once, keep
 * the cookie, and preload it into the browser context so the real page loads.
 */
async function fetchChallengeCookies(targetUrl, userAgent) {
  const baseHeaders = {
    'User-Agent': userAgent,
    'Accept-Language': 'en-US,en;q=0.9'
  };
  const first = await fetch(targetUrl, { headers: baseHeaders, redirect: 'manual' });
  if (first.status !== 403) return [];
  const challengeBody = await first.text();
  const match = challengeBody.match(/js_challenge_value=([^;"]+)/);
  if (!match) return [];

  const second = await fetch(targetUrl, {
    headers: {
      ...baseHeaders,
      Cookie: 'js_challenge_value=' + match[1],
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    },
    redirect: 'manual'
  });
  if (second.status >= 400) return [];

  const cookies = [];
  const setCookies = typeof second.headers.getSetCookie === 'function' ? second.headers.getSetCookie() : [];
  for (const raw of setCookies) {
    const pair = raw.split(';')[0];
    const index = pair.indexOf('=');
    if (index <= 0) continue;
    cookies.push({
      name: pair.slice(0, index).trim(),
      value: pair.slice(index + 1).trim(),
      domain: '.behance.net',
      path: '/'
    });
  }
  if (!cookies.some(cookie => cookie.name === 'js_challenge_value')) {
    cookies.push({ name: 'js_challenge_value', value: match[1], domain: '.behance.net', path: '/' });
  }
  return cookies;
}

function descendantFrames(frame) {
  const found = [];
  for (const child of frame.childFrames()) {
    found.push(child, ...descendantFrames(child));
  }
  return found;
}

const embedSelector = 'iframe[src*="' + deploymentId + '"][src*="slide=' + slideId + '"]';

async function findEmbed(page, timeout) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const handle = await page.$(embedSelector);
    if (handle) return handle;
    await page.mouse.wheel(0, 900);
    await wait(500);
  }
  return null;
}

async function findWrapperFrame(embed, timeout) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const frame = await embed.contentFrame();
    if (frame) {
      try {
        const hasWrapper = await frame.evaluate(() => Boolean(document.getElementById('sandboxFrame')));
        if (hasWrapper) return frame;
      } catch (error) {
        // The frame is still navigating.
      }
    }
    await wait(250);
  }
  return null;
}

async function findSlideshowFrame(wrapper, timeout) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    for (const frame of [wrapper, ...descendantFrames(wrapper)]) {
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

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: !headful });
  const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/' + browser.version() + ' Safari/537.36';
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'en-US', userAgent });

  const challengeCookies = await fetchChallengeCookies(url, userAgent).catch(() => []);
  if (challengeCookies.length) {
    await context.addCookies(challengeCookies);
  }

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
  record('Published Behance page contains the ' + slideId + ' Apps Script iframe',
    Boolean(embed), embed ? embedSelector : 'not found');
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

  const expectedSrc = 'https://script.google.com/macros/s/' + deploymentId + '/exec?slide=' + slideId;
  record('Iframe src requests exactly ' + slideId,
    attributes.src === expectedSrc,
    attributes.src.replace(/^.*\/s\//, '…/s/'));
  record('Iframe can enter fullscreen (allowfullscreen or allow=fullscreen)',
    attributes.allowFullscreen || /\bfullscreen\b/.test(attributes.allow || ''),
    'allowfullscreen=' + attributes.allowFullscreen + ', allow=' + (attributes.allow || '(none)'));
  const sandboxTokens = (attributes.sandbox || '').split(/\s+/).filter(Boolean);
  record('Behance sandbox still permits the slideshow scripts and fullscreen',
    !attributes.sandbox || (sandboxTokens.includes('allow-scripts') && sandboxTokens.includes('allow-same-origin')),
    attributes.sandbox || 'none');
  const slideEmbedCount = await page.$$eval(embedSelector, elements => elements.length);
  record('Exactly one iframe requests ' + slideId, slideEmbedCount === 1, slideEmbedCount + ' iframe(s)');
  record('Iframe has a non-zero rendered size',
    attributes.rect.width > 300 && attributes.rect.height > 400,
    Math.round(attributes.rect.width) + ' x ' + Math.round(attributes.rect.height));
  record('Iframe height is ' + expectedHeight + ' px in the published page',
    Math.abs(attributes.rect.height - expectedHeight) <= 10,
    attributes.rect.height + ' px; declared ' + attributes.height);
  if (expectedWidth !== null) {
    record('Iframe width is ' + expectedWidth + ' px in the published page',
      Math.abs(attributes.rect.width - expectedWidth) <= 10,
      attributes.rect.width + ' px; declared ' + attributes.width);
  }

  const wrapper = await findWrapperFrame(embed, 30000);
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

  const frame = await findSlideshowFrame(wrapper, 30000);
  record('Slideshow document loads inside Behance', Boolean(frame));
  if (!frame) {
    console.log(JSON.stringify({ results, blockedImages, attributes }, null, 2));
    await browser.close();
    process.exit(1);
  }

  await frame.waitForFunction(expected => {
    return document.querySelectorAll('.slide').length === expected &&
      document.querySelectorAll('.dot').length === expected;
  }, expectedCount, { timeout: 30000 });

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
  const urlsMatch = expectedUrls.length === initial.srcs.length &&
    initial.srcs.every((src, index) => src === expectedUrls[index]);
  record(expectedCount + ' slides and ' + expectedCount + ' dots render in Behance',
    initial.slides === expectedCount && initial.dots === expectedCount,
    initial.slides + ' slides, ' + initial.dots + ' dots');
  record('Counter starts at 1 / ' + expectedCount, initial.counter === '1 / ' + expectedCount,
    initial.counter);
  record('All ' + expectedCount + ' images are eager and match the audited URLs in order',
    initial.eager && urlsMatch && initial.srcs.every(src => src.startsWith('https://i.imgur.com/')),
    initial.srcs.length + ' remote URLs' + (urlsMatch ? ', exact order' : ', URL MISMATCH'));
  record('Fullscreen button is present', initial.fullscreenButton);

  await frame.click('.next');
  await frame.waitForFunction(expected => {
    return document.getElementById('pageNumber').textContent === '2 / ' + expected;
  }, expectedCount, { timeout: 30000 });
  const afterNext = await frame.evaluate(() => ({
    counter: document.getElementById('pageNumber').textContent,
    active: Array.from(document.querySelectorAll('.dot')).findIndex(dot => dot.classList.contains('active'))
  }));
  record('Navigation works inside Behance',
    afterNext.counter === '2 / ' + expectedCount && afterNext.active === 1,
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

  const externalNoise = /adobe\.com|behance\.net|adobedtm|demdex|omtrdc/i;
  const slideshowErrors = pageErrors.filter(message => !externalNoise.test(message));
  record('No uncaught errors from the slideshow', slideshowErrors.length === 0,
    slideshowErrors.join(' | ') || (pageErrors.length ? pageErrors.length + ' unrelated Behance/Adobe error(s) ignored' : 'none'));
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
