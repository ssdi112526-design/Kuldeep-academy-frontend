import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve('C:/Users/PC/.cursor/projects/c-Raghunandan-Akhada/assets');
const OUT = path.resolve(__dirname, '../src/assets/akhada');
const COACHES = path.join(OUT, 'coaches');
const SEED = path.resolve(__dirname, '../../server/seed-media');
const UPLOADS = path.resolve(__dirname, '../../server/uploads');

const JOBS = [
  { gen: 'v2-hero-banner.png', outs: ['hero-banner.png'], webp: 'hero-banner.webp', w: 1920, h: 1080 },
  { gen: 'v2-about-heritage.png', outs: ['about-heritage.png'], webp: 'about-heritage.webp', w: 1280, h: 960 },
  { gen: 'v2-programs-strength.png', outs: ['programs-strength-hd.png', 'programs-strength.png'], w: 1280, h: 960 },
  { gen: 'v2-programs-mud.png', outs: ['programs-mud-hd.png'], w: 1280, h: 960 },
  { gen: 'v2-programs-beginner.png', outs: ['programs-beginner.png'], w: 1280, h: 960 },
  { gen: 'v2-programs-advanced.png', outs: ['programs-advanced.png', 'gallery-action-1.png'], w: 1280, h: 960 },
  { gen: 'v2-programs-yoga.png', outs: ['programs-yoga.png', 'gallery-yoga.png'], w: 1280, h: 960 },
  { gen: 'v2-facilities-mud.png', outs: ['facilities-mud.png'], w: 1280, h: 960 },
  { gen: 'v2-facilities-gym.png', outs: ['facilities-gym.png'], w: 1280, h: 960 },
  { gen: 'v2-facilities-mats.png', outs: ['facilities-mats.png'], w: 1280, h: 960 },
  { gen: 'v2-facilities-locker.png', outs: ['facilities-locker.png'], w: 1280, h: 960 },
  { gen: 'v2-facilities-outdoor.png', outs: ['facilities-outdoor.png'], w: 1280, h: 960 },
  { gen: 'v2-facilities-water.png', outs: ['facilities-water.png'], w: 1280, h: 960 },
  { gen: 'v2-facilities-nutrition.png', outs: ['facilities-nutrition.png'], w: 1280, h: 960 },
  { gen: 'v2-facilities-recovery.png', outs: ['facilities-recovery.png', 'gallery-recovery.png'], w: 1280, h: 960 },
  { gen: 'v2-gallery-running.png', outs: ['gallery-running.png'], w: 1280, h: 960 },
  { gen: 'v2-gallery-rope.png', outs: ['gallery-rope.png'], w: 1280, h: 960 },
  { gen: 'v2-gallery-jori.png', outs: ['gallery-jori.png', 'gallery-action-2.png'], w: 1280, h: 960 },
  { gen: 'v2-gallery-team.png', outs: ['gallery-team.png'], w: 1280, h: 960 },
  { gen: 'v2-gallery-competition.png', outs: ['gallery-competition.png'], w: 1280, h: 960 },
  { gen: 'v2-gallery-medal-ceremony.png', outs: ['gallery-medal.png'], w: 1280, h: 960 },
  { gen: 'v2-programs-mud.png', outs: ['gallery-mitti.png'], w: 1280, h: 960 },
  { gen: 'v2-achievements-trophy.png', outs: ['achievements-trophy.png'], w: 1280, h: 960, webp: 'achievements-trophy.webp' },
  { gen: 'v2-achievements-medals.png', outs: ['achievements-medals.png'], w: 1280, h: 960, webp: 'achievements-medals.webp' },
  { gen: 'v2-coach-guru.png', outs: [], coach: 'guru-raghunandan', w: 720, h: 720 },
  { gen: 'v2-coach-mahavir.png', outs: [], coach: 'mahavir-singh', w: 720, h: 720 },
  { gen: 'v2-coach-vikram.png', outs: [], coach: 'vikram-pehlwan', w: 720, h: 720 },
  { gen: 'v2-coach-anita.png', outs: [], coach: 'anita-kakar', w: 720, h: 720 },
];

async function writeRaster(input, dest, { w, h }, asWebp = false, quality = 82) {
  const pipeline = sharp(input).rotate().resize({
    width: w,
    height: h,
    fit: 'cover',
    position: 'attention',
  });
  if (asWebp) {
    await pipeline.webp({ quality, effort: 4 }).toFile(dest);
  } else {
    await pipeline.png({ compressionLevel: 8 }).toFile(dest);
  }
}

async function writeJpegSeed(pngPath, jpgPath) {
  await sharp(pngPath)
    .jpeg({ quality: 78, mozjpeg: true, progressive: true })
    .toFile(jpgPath);
}

async function main() {
  for (const dir of [OUT, COACHES, SEED, UPLOADS]) fs.mkdirSync(dir, { recursive: true });

  for (const job of JOBS) {
    const input = path.join(SRC, job.gen);
    if (!fs.existsSync(input)) {
      console.warn('Missing', job.gen);
      continue;
    }
    const size = { w: job.w, h: job.h };

    for (const name of job.outs) {
      const dest = path.join(OUT, name);
      await writeRaster(input, dest, size, false);
      const seedPng = `seed-${name}`;
      fs.copyFileSync(dest, path.join(SEED, seedPng));
      fs.copyFileSync(dest, path.join(UPLOADS, seedPng));
      const jpgName = seedPng.replace(/\.png$/i, '.jpg');
      await writeJpegSeed(dest, path.join(UPLOADS, jpgName));
      fs.copyFileSync(path.join(UPLOADS, jpgName), path.join(SEED, jpgName));
      console.log('OK', name, `${Math.round(fs.statSync(path.join(UPLOADS, jpgName)).size / 1024)}KB jpg`);
    }

    if (job.webp) {
      const dest = path.join(OUT, job.webp);
      await writeRaster(input, dest, size, true, job.webp.includes('coach') ? 86 : 82);
      console.log('OK', job.webp, `${Math.round(fs.statSync(dest).size / 1024)}KB`);
    }

    if (job.coach) {
      const png = path.join(COACHES, `${job.coach}.png`);
      const webp = path.join(COACHES, `${job.coach}.webp`);
      await writeRaster(input, png, size, false);
      await writeRaster(input, webp, size, true, 88);
      console.log('OK coach', job.coach, `${Math.round(fs.statSync(webp).size / 1024)}KB webp`);
    }
  }

  console.log('Distribute done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
