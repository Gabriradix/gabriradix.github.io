import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function generate() {
  const sharp = (await import('sharp')).default;

  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="#000000"/>
  <g transform="translate(35, 19) scale(1.1)">
    <path d="M12.13 39.45L22.56 10.84L27.17 10.84L13.94 46.39L10.50 46.39L4.52 31.05L0 31.05L0 27.29L7.69 27.29L12.13 39.45Z" fill="#ffffff"/>
  </g>
</svg>
`;

  const publicDir = resolve(__dirname, '../public');

  // 1. Write SVG
  writeFileSync(resolve(publicDir, 'favicon.svg'), svgContent, 'utf-8');
  console.log('Created favicon.svg');

  // 2. Generate PNGs
  const svgBuffer = Buffer.from(svgContent);

  const sizes = [
    { name: 'favicon-16x16.png', size: 16 },
    { name: 'favicon-32x32.png', size: 32 },
    { name: 'favicon-48x48.png', size: 48 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'icon-192.png', size: 192 },
    { name: 'icon-512.png', size: 512 }
  ];

  const pngBuffers = {};
  for (const { name, size } of sizes) {
    const buf = await sharp(svgBuffer).resize(size, size).png().toBuffer();
    pngBuffers[size] = buf;
    writeFileSync(resolve(publicDir, name), buf);
    console.log(`Created ${name} (${size}x${size})`);
  }

  // 3. Build ICO (16, 32, 48)
  const icoSizes = [16, 32, 48];
  const count = icoSizes.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  let offset = headerSize + dirEntrySize * count;

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type 1 = ICO
  header.writeUInt16LE(count, 4); // Count

  const dirEntries = [];
  const imageBuffers = [];

  for (const s of icoSizes) {
    const imgBuf = pngBuffers[s];
    imageBuffers.push(imgBuf);

    const entry = Buffer.alloc(dirEntrySize);
    entry.writeUInt8(s === 256 ? 0 : s, 0); // width
    entry.writeUInt8(s === 256 ? 0 : s, 1); // height
    entry.writeUInt8(0, 2); // color count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(imgBuf.length, 8); // size of image data
    entry.writeUInt32LE(offset, 12); // offset of image data
    dirEntries.push(entry);

    offset += imgBuf.length;
  }

  const icoBuffer = Buffer.concat([header, ...dirEntries, ...imageBuffers]);
  writeFileSync(resolve(publicDir, 'favicon.ico'), icoBuffer);
  console.log('Created favicon.ico with sizes 16, 32, 48');

  // 4. Webmanifest
  const manifest = {
    name: "Gabriele Radicello",
    short_name: "gabriradix",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png"
      }
    ],
    theme_color: "#000000",
    background_color: "#000000",
    display: "standalone"
  };
  writeFileSync(resolve(publicDir, 'site.webmanifest'), JSON.stringify(manifest, null, 2), 'utf-8');
  console.log('Created site.webmanifest');
}

generate().catch(err => {
  console.error(err);
  process.exit(1);
});
