import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const screenshotsDir = join(__dirname, 'temporary screenshots');

// Find puppeteer
const puppeteerPaths = [
  join(process.env.APPDATA || '', '../Local/Temp/puppeteer-test/node_modules/puppeteer'),
  join(process.env.APPDATA || '', '../Local/Temp/puppeteer-test/node_modules/puppeteer-core'),
];

let puppeteerPath = puppeteerPaths.find(p => existsSync(p));

if (!puppeteerPath) {
  // Try to install puppeteer locally
  console.log('Puppeteer not found, installing locally...');
  execSync('npm install puppeteer --prefix . --save-false', { cwd: __dirname, stdio: 'inherit' });
  puppeteerPath = join(__dirname, 'node_modules/puppeteer');
}

const puppeteer = (await import(puppeteerPath)).default;

const url = process.argv[2] || 'http://localhost:4200';
const label = process.argv[3] || '';

// Auto-increment screenshot number
import { readdirSync, mkdirSync } from 'fs';
mkdirSync(screenshotsDir, { recursive: true });
const existing = readdirSync(screenshotsDir).filter(f => f.endsWith('.png'));
const nums = existing.map(f => parseInt(f.match(/screenshot-(\d+)/)?.[1] || '0')).filter(n => !isNaN(n));
const nextNum = nums.length > 0 ? Math.max(...nums) + 1 : 1;
const filename = label ? `screenshot-${nextNum}-${label}.png` : `screenshot-${nextNum}.png`;
const outputPath = join(screenshotsDir, filename);

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto(url, { waitUntil: 'networkidle0', timeout: 15000 });
await page.screenshot({ path: outputPath, fullPage: true });
await browser.close();

console.log(`Saved: ${outputPath}`);
