/**
 * Replace site wrestling images with user-provided photos.
 * Skips clearly unrelated sports (rugby, basketball, lacrosse, kickboxing).
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.resolve(__dirname, '../package.json'));
// run from client: node scripts/applyUserWrestlingPhotos.mjs
const sharpLib = require('sharp');

const ASSETS = path.resolve('C:/Users/PC/.cursor/projects/c-Raghunandan-Akhada/assets');
const OUT = path.resolve(__dirname, '../src/assets/akhada');
const SEED = path.resolve(__dirname, '../../server/seed-media');
const UPLOADS = path.resolve(__dirname, '../../server/uploads');

function findImg(num) {
  const files = fs.readdirSync(ASSETS);
  const hit = files.find((f) => f.includes(`images_img${num}-`) || f.includes(`_img${num}-`));
  if (!hit) throw new Error(`img${num} not found`);
  return path.join(ASSETS, hit);
}

/** Wrestling / grappling only — user asked to set these; unrelated sports skipped */
const MAP = [
  { img: 5, outs: ['hero-banner.png'], webp: 'hero-banner.webp', w: 1920, h: 1080 },
  { img: 1, outs: ['about-heritage.png'], webp: 'about-heritage.webp', w: 1280, h: 960 },
  { img: 1, outs: ['programs-beginner.png'], w: 1280, h: 960 },
  { img: 4, outs: ['programs-strength-hd.png', 'programs-strength.png'], w: 1280, h: 960 },
  { img: 11, outs: ['programs-mud-hd.png', 'gallery-mitti.png'], w: 1280, h: 960 },
  { img: 5, outs: ['programs-advanced.png', 'gallery-action-1.png'], w: 1280, h: 960 },
  { img: 7, outs: ['programs-yoga.png', 'gallery-yoga.png'], w: 1280, h: 960 },
  { img: 6, outs: ['gallery-action-2.png', 'gallery-jori.png'], w: 1280, h: 960 },
  { img: 15, outs: ['gallery-competition.png', 'gallery-medal.png', 'achievements-trophy.png'], webpExtra: 'achievements-trophy.webp', w: 1280, h: 960 },
  { img: 4, outs: ['gallery-rope.png', 'gallery-team.png'], w: 1280, h: 960 },
  { img: 11, outs: ['gallery-running.png'], w: 1280, h: 960 },
  { img: 1, outs: ['gallery-recovery.png', 'facilities-mats.png'], w: 1280, h: 960 },
  { img: 5, outs: ['facilities-mud.png', 'facilities-gym.png', 'facilities-outdoor.png'], w: 1280, h: 960 },
  { img: 15, outs: ['achievements-medals.png'], webp: 'achievements-medals.webp', w: 1280, h: 960 },
];

async function write(input, dest, w, h, asWebp = false) {
  const p = sharpLib(input).rotate().resize({ width: w, height: h, fit: 'cover', position: 'attention' });
  if (asWebp) await p.webp({ quality: 82, effort: 4 }).toFile(dest);
  else await p.png({ compressionLevel: 8 }).toFile(dest);
}

async function jpegFromPng(png, jpg) {
  await sharpLib(png).jpeg({ quality: 78, mozjpeg: true, progressive: true }).toFile(jpg);
}

async function main() {
  for (const d of [OUT, SEED, UPLOADS]) fs.mkdirSync(d, { recursive: true });

  for (const job of MAP) {
    const input = findImg(job.img);
    for (const name of job.outs) {
      const dest = path.join(OUT, name);
      await write(input, dest, job.w, job.h, false);
      const seedPng = `seed-${name}`;
      fs.copyFileSync(dest, path.join(SEED, seedPng));
      fs.copyFileSync(dest, path.join(UPLOADS, seedPng));
      const jpg = seedPng.replace(/\.png$/i, '.jpg');
      await jpegFromPng(dest, path.join(UPLOADS, jpg));
      fs.copyFileSync(path.join(UPLOADS, jpg), path.join(SEED, jpg));
      console.log('SET', name, '← img' + job.img);
    }
    if (job.webp) {
      const dest = path.join(OUT, job.webp);
      await write(input, dest, job.w, job.h, true);
      console.log('SET', job.webp);
    }
    if (job.webpExtra) {
      const srcPng = path.join(OUT, job.outs.find((o) => o.includes('achievements-trophy')) || job.outs[0]);
      const dest = path.join(OUT, job.webpExtra);
      await write(srcPng, dest, job.w, job.h, true);
      console.log('SET', job.webpExtra);
    }
  }

  console.log('Done. Skipped non-wrestling: img2 basketball, img3 kickboxing, img8/9/10/16 rugby, img13 lacrosse, img14 basketball.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
