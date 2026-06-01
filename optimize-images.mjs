import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const imagesDir = path.join(__dirname, 'images');

// Photos to convert — logos/webp already handled
const PHOTO_EXTENSIONS = ['.jpg', '.jpeg'];

// Logo PNGs — keep as PNG (transparency), just skip conversion
const LOGO_PATTERNS = ['Logo', 'logo', 'DMK', 'FR_Logo', 'GREEN PEEL', 'AnteAGE', 'Bio-Therapeutic', 'Sorella'];

// Max dimensions by use type
const CONFIGS = {
  gallery:   { width: 900,  height: 900,  quality: 82 }, // 1:1 gallery slides
  portrait:  { width: 1000, height: 1400, quality: 82 }, // 3:4 portrait shots
  content:   { width: 1200, height: 900,  quality: 80 }, // 4:3 content images
  treatment: { width: 800,  height: 1000, quality: 82 }, // treatment cards
};

function getConfig(filename) {
  const name = filename.toLowerCase();
  if (name.startsWith('image')) return CONFIGS.gallery;
  if (name.includes('lucid-3') || name.includes('santana')) return CONFIGS.portrait;
  if (name.includes('lucidskin') || name.includes('lucidq3')) return CONFIGS.treatment;
  if (name.includes('img_')) return CONFIGS.content;
  return CONFIGS.content;
}

function isLogo(filename) {
  return LOGO_PATTERNS.some(p => filename.includes(p));
}

const files = fs.readdirSync(imagesDir);
let totalSaved = 0;

for (const file of files) {
  const ext = path.extname(file).toLowerCase();
  if (!PHOTO_EXTENSIONS.includes(ext)) continue;
  if (isLogo(file)) {
    console.log(`  skip (logo): ${file}`);
    continue;
  }

  const inputPath = path.join(imagesDir, file);
  const baseName = path.basename(file, ext);
  const outputPath = path.join(imagesDir, `${baseName}.webp`);
  const originalKB = Math.round(fs.statSync(inputPath).size / 1024);

  const cfg = getConfig(file);

  try {
    await sharp(inputPath)
      .resize({ width: cfg.width, height: cfg.height, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: cfg.quality, effort: 5 })
      .toFile(outputPath);

    const newKB = Math.round(fs.statSync(outputPath).size / 1024);
    const savings = Math.round((1 - newKB / originalKB) * 100);
    totalSaved += (originalKB - newKB);
    console.log(`  ✓ ${file}: ${originalKB}KB → ${newKB}KB (${savings}% savings)`);
  } catch (err) {
    console.error(`  ✗ ${file}: ${err.message}`);
  }
}

console.log(`\nTotal saved: ~${Math.round(totalSaved / 1024)} MB`);
