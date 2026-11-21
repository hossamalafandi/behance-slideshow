const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');

const URL = 'https://sites.google.com/view/hossam-alafandi/freelance/av_sf_master_bedroom';
const OUT = path.resolve(__dirname, '..', '01_AUDIT', 'raw', 'P024.json');
const SUMMARY = path.resolve(__dirname, '..', '01_AUDIT', 'raw', 'P024-scan-summary.json');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    locale: 'en-US'
  });
  await context.route('**/*', route => {
    const type = route.request().resourceType();
    if (type === 'image' || type === 'font' || type === 'media') {
      return route.abort();
    }
    return route.continue();
  });

  const page = await context.newPage();
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(3000);
  for (let i = 0; i < 20; i++) {
    await page.mouse.wheel(0, 1200);
    await page.waitForTimeout(300);
  }
  await page.waitForTimeout(2500);

  const pageTitle = await page.title();
  const labels = await page.evaluate(() => Array.from(
    document.querySelectorAll('span, h1, h2, h3')).map(element => ({
    text: (element.textContent || '').trim(),
    tag: element.tagName
  })).filter(item => item.text && item.text.length < 120));

  const frames = [];
  for (const frame of page.frames()) {
    let frameInfo = null;
    try {
      const element = await frame.frameElement();
      frameInfo = await element.evaluate(node => {
        const rect = node.getBoundingClientRect();
        return {
          name: node.getAttribute('name') || '',
          title: node.getAttribute('title') || '',
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          x: Math.round(rect.x),
          y: Math.round(rect.y)
        };
      });
    } catch (error) {
      frameInfo = null;
    }

    let doc = null;
    try {
      doc = await frame.evaluate(() => {
        const row = document.querySelector('.logo-row');
        const slides = Array.from(document.querySelectorAll('.slide img'));
        const slideshow = document.querySelector('.slideshow-container');
        const dots = document.querySelectorAll('.dot-container .dot, .dot-container > *');
        const styles = Array.from(document.querySelectorAll('style'))
          .map(style => style.textContent)
          .filter(text => /\.logo-row/.test(text));
        return {
          title: document.title,
          bodyText: (document.body ? document.body.innerText : '').slice(0, 500),
          isSlideshow: Boolean(slideshow),
          slides: slides.map((image, index) => ({
            n: index + 1,
            src: image.getAttribute('src') || '',
            currentSrc: image.currentSrc || '',
            alt: image.alt || '',
            loading: image.loading || '',
            objectFit: getComputedStyle(image).objectFit,
            borderRadius: getComputedStyle(image).borderRadius
          })),
          dotCount: dots.length,
          hasPrev: Boolean(document.querySelector('.prev')),
          hasNext: Boolean(document.querySelector('.next')),
          hasCounter: Boolean(document.querySelector('.page-number, #pageNumber, .counter')),
          hasFullscreen: Boolean(document.querySelector('.fullscreen-btn, #fullscreenBtn')),
          logoRow: row ? row.outerHTML : null,
          logoStyle: styles.join('\n'),
          logos: row ? Array.from(row.querySelectorAll('img')).map(image => ({
            src: image.src,
            alt: image.alt
          })) : []
        };
      });
    } catch (error) {
      doc = null;
    }

    if (doc) frames.push({ frame: frameInfo, doc });
  }
  await browser.close();

  const slideshowFrames = frames.filter(item =>
    item.doc.isSlideshow || /Slideshow/i.test(item.doc.title));
  const toolsFrames = frames.filter(item =>
    item.doc.logoRow || /Software Logos/i.test(item.doc.title));

  const slideshows = slideshowFrames.map((item, index) => ({
    slideshowID: 'P024-S0' + (index + 1),
    frame: item.frame ? item.frame.name : '',
    frameSize: item.frame ? {
      w: item.frame.width,
      h: item.frame.height,
      aspect: Number((item.frame.width / item.frame.height).toFixed(3))
    } : null,
    isSlideshow: true,
    docTitle: item.doc.title,
    imgCount: item.doc.slides.length,
    images: item.doc.slides,
    dotCount: item.doc.dotCount,
    arrows: item.doc.hasPrev && item.doc.hasNext,
    pageCounter: item.doc.hasCounter,
    fullscreen: item.doc.hasFullscreen,
    bodyText: item.doc.bodyText
  }));

  const tools = toolsFrames.map(item => ({
    docTitle: item.doc.title,
    frameSize: item.frame ? {
      w: item.frame.width,
      h: item.frame.height,
      aspect: Number((item.frame.width / item.frame.height).toFixed(3))
    } : null,
    imgCount: item.doc.logos.length,
    logos: item.doc.logos,
    style: item.doc.logoStyle,
    row: item.doc.logoRow,
    bodyText: item.doc.bodyText
  }));

  const result = {
    projectID: 'P024',
    order: 24,
    url: URL,
    status: slideshows.length ? 'SCANNED' : 'NO_SLIDESHOW',
    pageTitle,
    slug: 'av_sf_master_bedroom',
    labels,
    frames: frames.map(item => ({
      frame: item.frame,
      title: item.doc.title,
      isSlideshow: item.doc.isSlideshow,
      imgCount: item.doc.slides.length,
      logoCount: item.doc.logos.length
    })),
    slideshows,
    tools
  };

  fs.writeFileSync(OUT, JSON.stringify(result, null, 2) + '\n', 'utf8');
  fs.writeFileSync(SUMMARY, JSON.stringify({
    pageTitle,
    status: result.status,
    slideshows: slideshows.map(slide => ({
      id: slide.slideshowID,
      frame: slide.frameSize,
      title: slide.docTitle,
      images: slide.imgCount,
      dots: slide.dotCount,
      arrows: slide.arrows,
      fullscreen: slide.fullscreen,
      first: slide.images[0] && slide.images[0].src,
      last: slide.images[slide.images.length - 1] && slide.images[slide.images.length - 1].src
    })),
    tools: tools.map(tool => ({
      frame: tool.frameSize,
      logos: tool.imgCount,
      title: tool.docTitle,
      row: tool.row
    })),
    labels: labels.slice(0, 40)
  }, null, 2) + '\n', 'utf8');
  console.log(fs.readFileSync(SUMMARY, 'utf8'));
})().catch(error => {
  console.error(error.stack);
  process.exit(1);
});
