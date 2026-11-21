const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');

const URL = 'https://sites.google.com/view/hossam-alafandi/freelance/av_sf_master_bedroom';
const DIR = path.resolve(__dirname, '..', '02_SOURCE_BACKUP', 'P024');

(async () => {
  fs.mkdirSync(DIR, { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'en-US' });
  await context.route('**/*', route => {
    const type = route.request().resourceType();
    if (type === 'image' || type === 'font' || type === 'media') return route.abort();
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

  const order = await page.evaluate(() => {
    const headings = Array.from(document.querySelectorAll('h1,h2,h3'))
      .map(h => ({ text: (h.textContent || '').trim(), top: h.getBoundingClientRect().top + window.scrollY }))
      .filter(h => h.text);
    const frames = Array.from(document.querySelectorAll('iframe'))
      .map(f => ({
        name: f.getAttribute('name') || '',
        top: f.getBoundingClientRect().top + window.scrollY,
        width: Math.round(f.getBoundingClientRect().width),
        height: Math.round(f.getBoundingClientRect().height)
      }))
      .filter(f => f.name && /_\d+$/.test(f.name));
    return { headings, frames };
  });
  console.log(JSON.stringify(order, null, 2));

  const saved = [];
  for (const frame of page.frames()) {
    let info = null;
    try {
      const element = await frame.frameElement();
      info = await element.evaluate(node => ({
        name: node.getAttribute('name') || '',
        width: Math.round(node.getBoundingClientRect().width),
        height: Math.round(node.getBoundingClientRect().height)
      }));
    } catch (error) {
      info = null;
    }
    if (!info) continue;
    let html = null;
    try {
      html = await frame.evaluate(() => '<!DOCTYPE html>\n' + document.documentElement.outerHTML);
    } catch (error) {
      html = null;
    }
    if (!html) continue;
    const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
    let kind = null;
    if (/Image Slideshow with Side Shadows on Hover/.test(title)) kind = 'S01-renders';
    else if (/Software Logos with Equal Spacing/.test(title)) kind = 'TOOLS';
    if (!kind) continue;
    const file = kind === 'TOOLS'
      ? 'P024-av-sf-master-bedroom-TOOLS.original.html'
      : 'P024-av-sf-master-bedroom-S01-renders.original.html';
    fs.writeFileSync(path.join(DIR, file), html.replace(/\r?\n/g, '\n'), 'utf8');
    saved.push({ file, frame: info, title });
  }
  await browser.close();
  console.log(JSON.stringify(saved, null, 2));
})().catch(error => {
  console.error(error.stack);
  process.exit(1);
});
