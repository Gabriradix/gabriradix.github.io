import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import sharp from "sharp";

const publicDir = path.join(process.cwd(), "public");
const projectsSource = await fs.readFile("src/data/projects.ts", "utf8");
const imageUrls = new Set(
  [...projectsSource.matchAll(/"(\/progetti\/[^"\r\n]+)"/g)].map(match => match[1]),
);
const previews = {};
const previousPreviews = JSON.parse(await fs.readFile("src/data/image-previews.json", "utf8").catch(error => {
  if (error.code === "ENOENT") return "{}";
  throw error;
}));
const preset = `homepage-preview-v1:webp-q80-effort4:static-1200x720:animated-640x640:rotate:sharp-${sharp.versions.sharp}`;
let originalBytes = 0;
let previewBytes = 0;
let generated = 0;
let cached = 0;

const exists = async filePath => fs.access(filePath).then(() => true, () => false);

for (const url of imageUrls) {
  const extension = path.extname(url).toLowerCase();
  if ([".mp4", ".mov", ".webm"].includes(extension)) {
    const poster = url.replace(/\.[^.]+$/, "-poster.jpg");
    const posterPath = path.join(publicDir, poster);
    const fingerprint = createHash("sha256").update(preset).update(await fs.readFile(posterPath)).digest("hex");
    if (previousPreviews[url]?.fingerprint === fingerprint) {
      previews[url] = previousPreviews[url];
      cached++;
      continue;
    }
    const { width, height } = await sharp(posterPath).metadata();
    previews[url] = { src: url, poster, width, height, fingerprint };
    continue;
  }
  if (![".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"].includes(extension)) continue;

  const originalPath = path.join(publicDir, url);
  const fingerprint = createHash("sha256").update(preset).update(await fs.readFile(originalPath)).digest("hex");
  const previewUrl = extension === ".svg" ? url : `${url}-preview.webp`;
  const previewPath = path.join(publicDir, previewUrl);
  const sourceBytes = (await fs.stat(originalPath)).size;
  if (previousPreviews[url]?.fingerprint === fingerprint && await exists(previewPath)) {
    previews[url] = previousPreviews[url];
    cached++;
    if (extension !== ".svg") {
      originalBytes += sourceBytes;
      previewBytes += (await fs.stat(previewPath)).size;
    }
    continue;
  }
  if (extension === ".svg") {
    const { width, height } = await sharp(originalPath).metadata();
    previews[url] = { src: url, width, height, fingerprint };
    continue;
  }

  const animated = extension === ".gif";
  const info = await sharp(originalPath, { animated })
    .rotate()
    .resize({ width: animated ? 640 : 1200, height: animated ? 640 : 720, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80, effort: 4 })
    .toFile(previewPath);
  previews[url] = {
    src: previewUrl,
    width: info.width,
    height: info.pageHeight || info.height,
    fingerprint,
  };
  generated++;
  originalBytes += sourceBytes;
  previewBytes += info.size;
}

await fs.writeFile("src/data/image-previews.json", `${JSON.stringify(previews, null, 2)}\n`);
console.log(JSON.stringify({
  assets: Object.keys(previews).length,
  generated,
  cached,
  originalMiB: +(originalBytes / 1024 ** 2).toFixed(2),
  previewMiB: +(previewBytes / 1024 ** 2).toFixed(2),
  reductionPercent: +((1 - previewBytes / originalBytes) * 100).toFixed(1),
}));
