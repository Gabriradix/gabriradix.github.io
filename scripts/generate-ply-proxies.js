import fs from "node:fs";
import path from "node:path";

const ASSETS_DIR = path.join(process.cwd(), "public", "progetti", "Web3D", "assets");
const DECIMATION_FACTOR = 10; // Keep 1 in 10 vertices (10% resolution)

function parseHeader(headerText) {
  const lines = headerText.split(/\r?\n/);
  let vertexCount = 0;
  let propertiesCount = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("element vertex")) {
      vertexCount = parseInt(trimmed.split(/\s+/)[2], 10);
    } else if (trimmed.startsWith("property")) {
      propertiesCount++;
    }
  }

  // Every property in Gaussian Splatting PLY is float (4 bytes)
  const vertexSize = propertiesCount * 4;

  return { vertexCount, vertexSize };
}

async function downsamplePlyFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext !== ".ply") return;

  const baseName = path.basename(filePath, ext);
  if (baseName.endsWith("-proxy")) return; // Skip already generated proxies

  const dirName = path.dirname(filePath);
  const destPath = path.join(dirName, `${baseName}-proxy.ply`);

  console.log(`Processing PLY: ${filePath}`);
  const fileBuffer = fs.readFileSync(filePath);

  // Find end of header
  const headerEndMark = "end_header";
  const headerEndIndex = fileBuffer.indexOf(headerEndMark);
  if (headerEndIndex === -1) {
    console.error(`✕ Invalid PLY file (no end_header): ${filePath}`);
    return;
  }

  // Find the exact end of the header line (usually \n or \r\n after end_header)
  let dataStartIndex = headerEndIndex + headerEndMark.length;
  while (fileBuffer[dataStartIndex] === 10 || fileBuffer[dataStartIndex] === 13) {
    dataStartIndex++;
  }

  const headerText = fileBuffer.toString("utf8", 0, dataStartIndex);
  const { vertexCount, vertexSize } = parseHeader(headerText);

  if (!vertexCount || !vertexSize) {
    console.error(`✕ Failed to parse vertices/properties from header in: ${filePath}`);
    return;
  }

  const expectedDataSize = vertexCount * vertexSize;
  const actualDataSize = fileBuffer.length - dataStartIndex;

  if (actualDataSize !== expectedDataSize) {
    console.warn(`⚠ Warning: Size mismatch in ${baseName}.ply. Header claims ${vertexCount} vertices (${expectedDataSize} bytes), actual data is ${actualDataSize} bytes.`);
  }

  const decimationCount = Math.floor(vertexCount / DECIMATION_FACTOR);
  console.log(`- Original count: ${vertexCount} vertices (record size: ${vertexSize} bytes)`);
  console.log(`- Decimated count: ${decimationCount} vertices`);

  // Write new header
  let newHeader = headerText.replace(
    `element vertex ${vertexCount}`,
    `element vertex ${decimationCount}`
  );
  const newHeaderBuffer = Buffer.from(newHeader, "utf8");

  // Allocate output buffer: header size + decimated data size
  const decimatedDataSize = decimationCount * vertexSize;
  const outBuffer = Buffer.alloc(newHeaderBuffer.length + decimatedDataSize);

  // Copy header
  newHeaderBuffer.copy(outBuffer, 0);

  // Copy every N-th vertex data
  let bytesWritten = newHeaderBuffer.length;
  for (let i = 0; i < decimationCount; i++) {
    const srcOffset = dataStartIndex + i * DECIMATION_FACTOR * vertexSize;
    if (srcOffset + vertexSize <= fileBuffer.length) {
      fileBuffer.copy(outBuffer, bytesWritten, srcOffset, srcOffset + vertexSize);
      bytesWritten += vertexSize;
    }
  }

  fs.writeFileSync(destPath, outBuffer);
  const originalSizeMB = (fileBuffer.length / (1024 * 1024)).toFixed(2);
  const newSizeMB = (outBuffer.length / (1024 * 1024)).toFixed(2);
  console.log(`✓ Downsampled PLY successfully: ${originalSizeMB} MB -> ${newSizeMB} MB`);
}

async function main() {
  console.log("Starting PLY proxy generator in:", ASSETS_DIR);
  if (!fs.existsSync(ASSETS_DIR)) {
    console.error("Assets directory not found!");
    process.exit(1);
  }

  const files = fs.readdirSync(ASSETS_DIR);
  for (const file of files) {
    const fullPath = path.join(ASSETS_DIR, file);
    if (fs.statSync(fullPath).isFile() && file.endsWith(".ply")) {
      await downsamplePlyFile(fullPath);
    }
  }
  console.log("PLY decimation complete!");
}

main().catch(err => {
  console.error("Error in PLY proxy generation:", err);
});
