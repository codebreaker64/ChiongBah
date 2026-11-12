/**
 * Renders the medal (assets/brand/medal.svg) into the app's PNG assets with headless Chromium.
 * Run: node scripts/render-brand.js   (needs the `playwright` package and a Chromium build)
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const BG = '#0B0D0A';
const medal = fs.readFileSync(path.join(ROOT, 'assets/brand/medal.svg'), 'utf8').replace(/<title>.*?<\/title>/, '');
// Monochrome icon: one colour. The runner is already cut out of the gold, so the shape still reads.
const mono = medal.replace(/fill="#[0-9A-Fa-f]{6}"/g, 'fill="white"');
const [VW, VH] = /viewBox="0 0 (\d+) (\d+)"/.exec(medal).slice(1).map(Number);

/** A square (or w × h) page with the medal `height` px tall, centred, on `bg`. */
const page = (svg, { w, h = w, height, bg = 'transparent' }) => `<!doctype html><html><body style="margin:0;width:${w}px;height:${h}px;background:${bg};display:flex;align-items:center;justify-content:center">
  <div style="height:${height}px;width:${(height * VW) / VH}px">${svg.replace('<svg ', '<svg style="width:100%;height:100%" ')}</div></body></html>`;

const OUT = [
  // App icon (legacy and Play Store listing): medal on the app background.
  { file: 'icon.png', html: page(medal, { w: 1024, height: 760, bg: BG }) },
  // Adaptive icon: the foreground keeps the medal inside the 66 % safe zone (676 px of 1024).
  { file: 'android-icon-foreground.png', html: page(medal, { w: 1024, height: 560 }) },
  { file: 'android-icon-background.png', html: page('<svg></svg>', { w: 1024, height: 0, bg: BG }) },
  { file: 'android-icon-monochrome.png', html: page(mono, { w: 1024, height: 560 }) },
  // System splash image: medal only, on transparent; app.json sets the background and width.
  { file: 'splash-icon.png', html: page(medal, { w: 960, h: 1120, height: 1120 }) },
  { file: 'favicon.png', html: page(medal, { w: 48, height: 44, bg: BG }) },
];

(async () => {
  const browser = await chromium.launch();
  for (const o of OUT) {
    const [w, h] = [Number(/width:(\d+)px/.exec(o.html)[1]), Number(/height:(\d+)px/.exec(o.html)[1])];
    const p = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    await p.setContent(o.html);
    await p.screenshot({ path: path.join(ROOT, 'assets/images', o.file), omitBackground: true });
    await p.close();
    console.log('wrote', o.file, `${w}×${h}`);
  }
  await browser.close();
})();
