import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const PROGETTI_DIR = path.join(process.cwd(), "public", "progetti");

async function generateProxiesForDir(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      await generateProxiesForDir(fullPath);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      
      // Target only images, skip already generated proxies and other file types
      if (
        [".png", ".jpg", ".jpeg", ".webp"].includes(ext) &&
        !entry.name.includes("-proxy")
      ) {
        const dirName = path.dirname(fullPath);
        const baseName = path.basename(entry.name, ext);
        const proxyName = `${baseName}-proxy${ext}`;
        const proxyPath = path.join(dirName, proxyName);

        if (fs.existsSync(proxyPath)) {
          console.log(`Proxy already exists for: ${entry.name}`);
          continue;
        }

        console.log(`Generating proxy for: ${fullPath} -> ${proxyName}`);
        
        try {
          // Create highly-compressed, 80px wide proxy image (with blur effect in CSS, 80px is perfect!)
          await sharp(fullPath)
            .resize({ width: 80, withoutEnlargement: true })
            .jpeg({ quality: 20, mozjpeg: true })
            .toFile(proxyPath);
            
          console.log(`✓ Created proxy successfully: ${proxyName}`);
        } catch (err) {
          try {
            // Fallback if jpeg conversion fails (e.g. for some PNG transparency, we preserve PNG format)
            await sharp(fullPath)
              .resize({ width: 80, withoutEnlargement: true })
              .png({ compressionLevel: 9, quality: 20 })
              .toFile(proxyPath);
            console.log(`✓ Created proxy (PNG fallback): ${proxyName}`);
          } catch (pngErr) {
            console.error(`✕ Failed to generate proxy for ${entry.name}:`, pngErr.message);
          }
        }
      }
    }
  }
}

async function main() {
  console.log("Starting proxy image generation in:", PROGETTI_DIR);
  if (!fs.existsSync(PROGETTI_DIR)) {
    console.error("Directory public/progetti not found!");
    process.exit(1);
  }
  await generateProxiesForDir(PROGETTI_DIR);
  console.log("Proxy generation complete!");
}

main().catch(err => {
  console.error("Error in generator script:", err);
});
