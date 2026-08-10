import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve('C:/Users/PC/.cursor/projects/c-Raghunandan-Akhada/assets');
const OUT = path.resolve(__dirname, '../src/assets/akhada');
const SEED = path.resolve(__dirname, '../../server/seed-media');
const UPLOADS = path.resolve(__dirname, '../../server/uploads');

const FINAL_JOBS = [
  { gen: 'gen-hero-banner.png', outs: ['hero-banner.png'], webp: 'hero-banner.webp', width: 1920, height: 1080 },
  { gen: 'gen-about-heritage.png', outs: ['about-heritage.png'], webp: 'about-heritage.webp', width: 1280, height: 960 },
  { gen: 'gen-programs-mud.png', outs: ['programs-mud-hd.png'], width: 1280, height: 960 },
  { gen: 'gen-programs-strength.png', outs: ['programs-strength-hd.png', 'programs-strength.png'], width: 1280, height: 960 },
  { gen: 'gen-programs-beginner.png', outs: ['programs-beginner.png'], width: 1280, height: 960 },
  { gen: 'gen-programs-advanced.png', outs: ['programs-advanced.png'], width: 1280, height: 960 },
  { gen: 'gen-facilities-mud.png', outs: ['facilities-mud.png'], width: 1280, height: 960 },
  { gen: 'gen-facilities-nutrition.png', outs: ['facilities-nutrition.png'], width: 1280, height: 960 },
  { gen: 'gen-facilities-recovery.png', outs: ['facilities-recovery.png'], width: 1280, height: 960 },
  { gen: 'gen-gallery-action-1.png', outs: ['gallery-action-1.png'], width: 1280, height: 960 },
  { gen: 'gen-gallery-action-2.png', outs: ['gallery-action-2.png'], width: 1280, height: 960 },
  { gen: 'gen-gallery-competition.png', outs: ['gallery-competition.png'], width: 1280, height: 960 },
  { gen: 'gen-gallery-mitti.png', outs: ['gallery-mitti.png'], width: 1280, height: 960 },
  { gen: 'gen-gallery-yoga.png', outs: ['gallery-yoga.png'], width: 1280, height: 960 },
  { gen: 'gen-gallery-recovery.png', outs: ['gallery-recovery.png'], width: 1280, height: 960 },
];

async function writeOptimized(inputPath, destPath, { width, height }, asWebp = false) {
  const pipeline = sharp(inputPath).rotate().resize({
    width,
    height,
    fit: 'cover',
    position: 'attention',
    withoutEnlargement: false,
  });

  if (asWebp) {
    await pipeline.webp({ quality: 82, effort: 4 }).toFile(destPath);
  } else {
    await pipeline.png({ compressionLevel: 8, adaptiveFiltering: true }).toFile(destPath);
  }
}

async function main() {
  for (const dir of [OUT, SEED, UPLOADS]) {
    fs.mkdirSync(dir, { recursive: true });
  }

  for (const job of FINAL_JOBS) {
    const input = path.join(SRC, job.gen);
    if (!fs.existsSync(input)) {
      console.warn('Missing', job.gen);
      continue;
    }

    const size = { width: job.width, height: job.height };

    for (const name of job.outs) {
      const dest = path.join(OUT, name);
      await writeOptimized(input, dest, size, false);
      const seedName = `seed-${name}`;
      fs.copyFileSync(dest, path.join(SEED, seedName));
      fs.copyFileSync(dest, path.join(UPLOADS, seedName));
      console.log('OK', name, `${Math.round(fs.statSync(dest).size / 1024)}KB`);
    }

    if (job.webp) {
      const dest = path.join(OUT, job.webp);
      await writeOptimized(input, dest, size, true);
      console.log('OK', job.webp, `${Math.round(fs.statSync(dest).size / 1024)}KB`);
    }
  }

  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
