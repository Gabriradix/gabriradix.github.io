import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

async function generateShots() {
  // 1. Dream Catalogue
  const dreamCoverPath = path.resolve('public/progetti/dream-catalogue/cover.png');
  const dreamDir = path.resolve('public/progetti/dream-catalogue');

  if (fs.existsSync(dreamCoverPath)) {
    const meta = await sharp(dreamCoverPath).metadata();
    const w = meta.width || 1920;
    const h = meta.height || 1080;

    // Shot 1: Full / Top left region
    await sharp(dreamCoverPath)
      .extract({ left: 0, top: 0, width: Math.floor(w * 0.75), height: Math.floor(h * 0.75) })
      .toFile(path.join(dreamDir, '1.png'));

    // Shot 2: Center region (data graph)
    await sharp(dreamCoverPath)
      .extract({ left: Math.floor(w * 0.15), top: Math.floor(h * 0.15), width: Math.floor(w * 0.7), height: Math.floor(h * 0.7) })
      .toFile(path.join(dreamDir, '2.png'));

    // Shot 3: Bottom right region (detail panel)
    await sharp(dreamCoverPath)
      .extract({ left: Math.floor(w * 0.25), top: Math.floor(h * 0.25), width: Math.floor(w * 0.75), height: Math.floor(h * 0.75) })
      .toFile(path.join(dreamDir, '3.png'));

    // Shot 4: Focused node region
    await sharp(dreamCoverPath)
      .extract({ left: Math.floor(w * 0.1), top: Math.floor(h * 0.2), width: Math.floor(w * 0.8), height: Math.floor(h * 0.7) })
      .toFile(path.join(dreamDir, '4.png'));

    console.log('Generated 4 shots for Dream Catalogue');
  }

  // 2. The Cheese Prophecy
  const cheeseCoverPath = path.resolve('public/progetti/the-cheese-prophecy/cover.png');
  const cheeseDir = path.resolve('public/progetti/the-cheese-prophecy');

  if (fs.existsSync(cheeseCoverPath)) {
    const meta = await sharp(cheeseCoverPath).metadata();
    const w = meta.width || 1920;
    const h = meta.height || 1080;

    await sharp(cheeseCoverPath)
      .extract({ left: 0, top: 0, width: Math.floor(w * 0.8), height: Math.floor(h * 0.8) })
      .toFile(path.join(cheeseDir, '1.png'));

    await sharp(cheeseCoverPath)
      .extract({ left: Math.floor(w * 0.1), top: Math.floor(h * 0.1), width: Math.floor(w * 0.8), height: Math.floor(h * 0.8) })
      .toFile(path.join(cheeseDir, '2.png'));

    await sharp(cheeseCoverPath)
      .extract({ left: Math.floor(w * 0.2), top: Math.floor(h * 0.15), width: Math.floor(w * 0.75), height: Math.floor(h * 0.75) })
      .toFile(path.join(cheeseDir, '3.png'));

    await sharp(cheeseCoverPath)
      .extract({ left: Math.floor(w * 0.05), top: Math.floor(h * 0.2), width: Math.floor(w * 0.85), height: Math.floor(h * 0.75) })
      .toFile(path.join(cheeseDir, '4.png'));

    console.log('Generated 4 shots for The Cheese Prophecy');
  }
}

generateShots().catch(console.error);
