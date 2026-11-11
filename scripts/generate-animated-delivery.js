import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

const publicDir = path.resolve('public');
const manifestPath = 'src/data/animated-delivery.json';
const previous = JSON.parse(await fs.readFile(manifestPath, 'utf8').catch(error => {
  if (error.code === 'ENOENT') return '{}';
  throw error;
}));
const encoder = process.env.CJXL_PATH || (process.platform === 'win32'
  ? path.resolve('work/media-tools/libjxl-v0.12.0/x64-windows-static/bin/cjxl.exe') : 'cjxl');
const ffmpeg = process.env.FFMPEG_PATH || 'ffmpeg';
const manifest = {};
const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'portfolio-animation-'));
const exists = file => fs.access(file).then(() => true, () => false);
const preset = `animated-jxl-v1:d1:e5:webp85:gif-timing:sharp-${sharp.versions.sharp}`;
const sources = [];

async function collect(directory) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) await collect(file);
    else if (entry.name.endsWith('.gif')) sources.push(file);
  }
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { windowsHide: true });
    let errors = '';
    child.stderr.on('data', data => { errors += data; });
    child.on('error', reject);
    child.on('exit', code => code === 0 ? resolve() : reject(new Error(errors)));
  });
}

try {
  await collect(path.join(publicDir, 'progetti'));
  for (const file of sources.sort()) {
    const original = await fs.readFile(file);
    const metadata = await sharp(original, { animated: true }).metadata();
    const originalUrl = '/' + path.relative(publicDir, file).split(path.sep).join('/');
    // GIF delays below 20 ms are clamped to 100 ms by browsers.
    const delays = (metadata.delay || []).map(delay => delay < 20 ? 100 : delay);
    for (const preview of [false, true]) {
      const url = preview ? `${originalUrl}-preview.webp` : originalUrl;
      const fingerprint = createHash('sha256').update(preset).update(String(preview)).update(original).digest('hex');
      const old = previous[url];
      if (old?.fingerprint === fingerprint && (await Promise.all([old.jxl, old.fallback, old.poster]
        .map(asset => exists(path.join(publicDir, asset))))).every(Boolean)) {
        manifest[url] = old;
        continue;
      }
      const normalized = path.join(temporary, `${fingerprint}.png`);
      const filter = preview ? ['-vf', 'scale=640:640:force_original_aspect_ratio=decrease'] : [];
      // APNG coalesces GIF disposal modes that cjxl cannot read directly.
      await run(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-i', file, ...filter,
        '-fps_mode', 'passthrough', '-enc_time_base', 'demux', '-plays', '0',
        '-final_delay', `${delays.at(-1) || 100}/1000`, '-f', 'apng', '-y', normalized]);
      const jxl = `${url}.jxl`;
      const fallback = `${url}.animated.webp`;
      const poster = `${url}.poster.webp`;
      await run(encoder, [normalized, path.join(publicDir, jxl), '--distance=1', '--effort=5', '--progressive', '--num_threads=4']);
      let animation = sharp(original, { animated: true });
      if (preview) animation = animation.resize({ width: 640, height: 640, fit: 'inside', withoutEnlargement: true });
      const info = await animation.webp({ quality: 85, effort: 4, loop: 0, delay: delays }).toFile(path.join(publicDir, fallback));
      await sharp(original).resize({ width: 640, height: 640, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 }).toFile(path.join(publicDir, poster));
      manifest[url] = { jxl, fallback, poster, width: info.width, height: info.pageHeight || info.height,
        frames: metadata.pages, durationMs: delays.reduce((sum, delay) => sum + delay, 0), fingerprint };
      await fs.unlink(normalized);
      console.log(`Animated JXL: ${url}`);
    }
  }
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Animated representations: ${Object.keys(manifest).length}`);
} finally {
  if (path.dirname(temporary) !== path.resolve(os.tmpdir()) || !path.basename(temporary).startsWith('portfolio-animation-')) {
    throw new Error('Unexpected animation temporary directory.');
  }
  await fs.rm(temporary, { recursive: true, force: true });
}
