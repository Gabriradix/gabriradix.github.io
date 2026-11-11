import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import sharp from 'sharp';

const publicDir = path.resolve('public');
const manifestPath = 'src/data/image-delivery.json';
const previous = JSON.parse(await fs.readFile(manifestPath, 'utf8').catch(error => {
  if (error.code === 'ENOENT') return '{}';
  throw error;
}));
const encoder = process.env.CJXL_PATH || (process.platform === 'win32'
  ? path.resolve('work/media-tools/libjxl-v0.12.0/x64-windows-static/bin/cjxl.exe')
  : 'cjxl');
const preset = `jxl-progressive-v1:d1:e5:jpeg90-444:rotate:sharp-${sharp.versions.sharp}`;
const exists = file => fs.access(file).then(() => true, () => false);
const manifest = {};
const files = [];

async function collect(directory) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) await collect(file);
    else if (/\.(png|jpe?g|webp)$/i.test(entry.name)
      && !/-proxy|\.progressive\.jpg$|\.(?:fallback|animated|poster)\.webp$/i.test(entry.name)) files.push(file);
  }
}

function encode(input, output) {
  return new Promise((resolve, reject) => {
    const child = spawn(encoder, [input, output, '--distance=1', '--effort=5',
      '--progressive', '--lossless_jpeg=0', '--num_threads=4'], { windowsHide: true });
    let errors = '';
    child.stderr.on('data', chunk => { errors += chunk; });
    child.on('error', error => reject(new Error(`Install libjxl/cjxl or set CJXL_PATH. ${error.message}`)));
    child.on('exit', code => code === 0 ? resolve() : reject(new Error(errors)));
  });
}

for (const directory of ['progetti', 'assets']) {
  const fullPath = path.join(publicDir, directory);
  if (await exists(fullPath)) await collect(fullPath);
}
files.sort();
const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'portfolio-jxl-'));
let generated = 0;
let cached = 0;
let originalBytes = 0;
let jxlBytes = 0;
try {
  // Keep conversion bounded on laptops; cjxl also uses four threads per image.
  let next = 0;
  const workers = await Promise.allSettled(Array.from({ length: 2 }, async () => {
    while (next < files.length) {
      const fileIndex = next++;
      const file = files[fileIndex];
      const source = await fs.readFile(file);
      const url = '/' + path.relative(publicDir, file).split(path.sep).join('/');
      const fingerprint = createHash('sha256').update(preset).update(source).digest('hex');
      const old = previous[url];
      if (old?.fingerprint === fingerprint && await exists(path.join(publicDir, old.jxl))
        && await exists(path.join(publicDir, old.fallback))) {
        manifest[url] = old;
        cached++;
      } else {
        const metadata = await sharp(source, { animated: true }).metadata();
        // Retain animated WebP/GIF delivery; Safari does not support animated JXL.
        if ((metadata.pages || 1) > 1) continue;
        const normalized = path.join(temp, `${fileIndex}-${fingerprint}.png`);
        const info = await sharp(source).rotate().png().toFile(normalized);
        const jxl = `${url}.jxl`;
        const fallback = `${url}${metadata.hasAlpha ? '.fallback.webp' : '.progressive.jpg'}`;
        await encode(normalized, path.join(publicDir, jxl));
        const fallbackImage = sharp(normalized);
        if (metadata.hasAlpha) await fallbackImage.webp({ quality: 90, alphaQuality: 100 }).toFile(path.join(publicDir, fallback));
        else await fallbackImage.jpeg({ quality: 90, progressive: true, mozjpeg: true, chromaSubsampling: '4:4:4' }).toFile(path.join(publicDir, fallback));
        manifest[url] = { jxl, fallback, width: info.width, height: info.height, fingerprint };
        await fs.unlink(normalized);
        generated++;
        if (generated % 20 === 0) console.log(`Progressive images: ${generated} generated, ${cached} cached`);
      }
      originalBytes += source.length;
      const encodedSize = (await fs.stat(path.join(publicDir, manifest[url].jxl))).size;
      jxlBytes += encodedSize;
    }
  }));
  const failure = workers.find(result => result.status === 'rejected');
  if (failure) throw failure.reason;
  const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
  await fs.writeFile(manifestPath, `${JSON.stringify(sorted, null, 2)}\n`);
  console.log(JSON.stringify({ images: Object.keys(manifest).length, generated, cached,
    originalMiB: +(originalBytes / 1024 ** 2).toFixed(2), jxlMiB: +(jxlBytes / 1024 ** 2).toFixed(2) }));
} finally {
  if (path.dirname(temp) !== path.resolve(os.tmpdir()) || !path.basename(temp).startsWith('portfolio-jxl-')) {
    throw new Error('Refusing to remove an unexpected temporary directory.');
  }
  await fs.rm(temp, { recursive: true, force: true });
}
