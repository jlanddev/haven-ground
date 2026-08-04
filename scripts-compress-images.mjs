import sharp from 'sharp';
import { readdir, stat, readFile, writeFile, rename, unlink } from 'fs/promises';
import { join, extname } from 'path';

const ROOT = 'public/images';
const MAX_W = 2400;          // downscale anything wider than this
const JPEG_Q = 80;
const WEBP_Q = 82;
const PNG_RESIZE_ONLY = true; // graphics: resize + re-encode png, keep extension

// Photo PNGs that should become webp (references live only in propertiesData.js)
const WEBP_CONVERT = new Set([
  'public/images/mallards-bend/aerial-river-north.png',
  'public/images/mallards-bend/aerial-river-pasture.png',
  'public/images/mallards-bend/aerial-river-south.png',
  'public/images/mallards-bend/mallards-bend-aerial-river.png',
  'public/images/mallards-bend/aerial-highway-house.png',
  'public/images/mallards-bend/sunset-highway.png',
  'public/images/mallards-bend/sunset-aerial.png',
  'public/images/big-spring/Big Spring 5.png',
  'public/images/big-spring/Big Spring 6.png',
  'public/images/big-spring/Big Spring 7.png',
]);

async function walk(dir) {
  const out = [];
  for (const name of await readdir(dir)) {
    const p = join(dir, name);
    const s = await stat(p);
    if (s.isDirectory()) out.push(...await walk(p));
    else out.push(p);
  }
  return out;
}

const renameMap = []; // {from, to}
let before = 0, after = 0, changed = 0, skipped = 0;

function resizeOpts(meta) {
  return meta.width && meta.width > MAX_W ? { width: MAX_W, withoutEnlargement: true } : null;
}

const files = await walk(ROOT);
for (const f of files) {
  const ext = extname(f).toLowerCase();
  const isJpeg = ext === '.jpg' || ext === '.jpeg';
  const isPng = ext === '.png';
  if (!isJpeg && !isPng) { skipped++; continue; }

  const orig = (await stat(f)).size;
  let img = sharp(f, { failOn: 'none' }).rotate(); // auto-orient from EXIF, then strip metadata
  const meta = await img.metadata();
  const rz = resizeOpts(meta);
  if (rz) img = img.resize(rz);

  try {
    if (WEBP_CONVERT.has(f)) {
      const to = f.replace(/\.png$/i, '.webp');
      const buf = await img.webp({ quality: WEBP_Q }).toBuffer();
      await writeFile(to, buf);
      await unlink(f);
      renameMap.push({ from: f, to });
      before += orig; after += buf.length; changed++;
    } else if (isJpeg) {
      const buf = await img.jpeg({ quality: JPEG_Q, mozjpeg: true }).toBuffer();
      // only rewrite if we actually saved bytes
      if (buf.length < orig) { const tmp = f + '.tmp'; await writeFile(tmp, buf); await rename(tmp, f); after += buf.length; }
      else { after += orig; }
      before += orig; changed++;
    } else { // png graphic: resize + optimize, keep extension
      const buf = await img.png({ compressionLevel: 9, effort: 8, palette: true }).toBuffer();
      if (buf.length < orig) { const tmp = f + '.tmp'; await writeFile(tmp, buf); await rename(tmp, f); after += buf.length; }
      else { after += orig; }
      before += orig; changed++;
    }
  } catch (e) {
    console.error('FAIL', f, e.message);
    after += orig;
  }
}

const mb = b => (b / 1048576).toFixed(1);
console.log(`\nprocessed ${changed} files, skipped ${skipped}`);
console.log(`BEFORE: ${mb(before)} MB   AFTER: ${mb(after)} MB   SAVED: ${mb(before - after)} MB (${(100*(before-after)/before).toFixed(1)}%)`);
console.log(`\nPNG->WEBP conversions (update refs): ${renameMap.length}`);
for (const r of renameMap) console.log('  ', r.from, '->', r.to);
