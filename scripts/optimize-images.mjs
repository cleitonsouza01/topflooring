/**
 * One-off / repeatable image optimizer for the landing page.
 * Reads source photos from SRC and writes resized WebP into public/images,
 * plus a 1200x630 og-image.jpg derived from the hero.
 *
 * Usage:  SRC=/path/to/assets/img node scripts/optimize-images.mjs
 */
import { mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const SRC =
  process.env.SRC ||
  '/Users/cleiton/projects/topflooring-old/landingpage/assets/img';
const OUT = path.resolve('public/images');

// name -> source filename. Output is always <name>.webp.
const IMAGES = {
  'hero-marble': 'hero-marble.jpg',
  'svc-hardwood': 'svc-hardwood.jpg',
  'svc-vinyl': 'svc-vinyl.jpg',
  'svc-tile': 'svc-tile.jpg',
  'svc-demolition': 'svc-demolition.png',
  'g-wood-01': 'g-wood-01.jpg',
  'g-wood-03': 'g-wood-03.jpg',
  'g-wood-04': 'g-wood-04.jpg',
  'g-tile-01': 'g-tile-01.jpg',
  'g-tile-02': 'g-tile-02.jpg',
  'g-tile-03': 'g-tile-03.jpg',
  'g-backsplash-01': 'g-backsplash-01.jpg',
  'g-backsplash-02': 'g-backsplash-02.jpg',
  'g-stair-01': 'g-stair-01.jpg',
  'g-stair-02': 'g-stair-02.jpg',
  'feature-chevron': 'feature-chevron.jpg',
  'feature-star-marble': 'feature-star-marble.jpg',
};

const MAX_WIDTH = 1600;

async function run() {
  if (!existsSync(SRC)) {
    console.error(`Source dir not found: ${SRC}\nSet SRC=/path/to/assets/img`);
    process.exit(1);
  }
  await mkdir(OUT, { recursive: true });

  for (const [name, file] of Object.entries(IMAGES)) {
    const from = path.join(SRC, file);
    if (!existsSync(from)) {
      console.warn(`  skip (missing): ${file}`);
      continue;
    }
    const to = path.join(OUT, `${name}.webp`);
    await sharp(from)
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: 78 })
      .toFile(to);
    console.log(`  ✓ ${name}.webp`);
  }

  // OG image: 1200x630 cover crop from the hero.
  const heroSrc = path.join(SRC, IMAGES['hero-marble']);
  if (existsSync(heroSrc)) {
    await sharp(heroSrc)
      .resize({ width: 1200, height: 630, fit: 'cover' })
      .jpeg({ quality: 82 })
      .toFile(path.resolve('public/og-image.jpg'));
    console.log('  ✓ og-image.jpg');
  }

  console.log('Done.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
