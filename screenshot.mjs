import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const OUT_DIR = path.join(__dirname, 'temporary screenshots');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const url   = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] || '';

// Auto-increment filename
const existing = fs.readdirSync(OUT_DIR).filter(f => f.endsWith('.png'));
const nums = existing.map(f => parseInt(f.match(/^screenshot-(\d+)/)?.[1] || 0)).filter(n => !isNaN(n));
const next = (nums.length ? Math.max(...nums) : 0) + 1;
const filename = label ? `screenshot-${next}-${label}.png` : `screenshot-${next}.png`;
const outPath = path.join(OUT_DIR, filename);

const browser = await puppeteer.launch({
  executablePath: CHROME,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
// Scroll through the page to trigger IntersectionObserver reveals
const pageHeight = await page.evaluate(() => document.body.scrollHeight);
for (let y = 0; y < pageHeight; y += 600) {
  await page.evaluate(pos => window.scrollTo(0, pos), y);
  await new Promise(r => setTimeout(r, 120));
}
await page.evaluate(() => window.scrollTo(0, 0));
// Allow fonts, animations and counters to settle
await new Promise(r => setTimeout(r, 1800));
await page.screenshot({ path: outPath, fullPage: true });
await browser.close();

console.log(`Saved: ${outPath}`);
