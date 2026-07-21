import fs from 'fs';
import path from 'path';
import https from 'https';

const targetDir = path.resolve('public/progetti/codice-umano');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const images = [
  { url: 'https://www.cityopenmuseum.com/wp-content/uploads/2026/06/fura-dels1080-1080.jpg', name: 'cover.jpg' },
  { url: 'https://www.cityopenmuseum.com/wp-content/uploads/2026/06/La-Fura-Dels-Baus_01.jpg', name: '1.jpg' },
  { url: 'https://www.cityopenmuseum.com/wp-content/uploads/2026/06/La-Fura-Dels-Baus_02.jpg', name: '2.jpg' },
  { url: 'https://www.cityopenmuseum.com/wp-content/uploads/2026/06/La-Fura-Dels-Baus_03.jpg', name: '3.jpg' },
  { url: 'https://www.cityopenmuseum.com/wp-content/uploads/2026/06/La-Fura-Dels-Baus_04.jpg', name: '4.jpg' },
  { url: 'https://www.cityopenmuseum.com/wp-content/uploads/2026/06/La-Fura-Dels-Baus_05.jpg', name: '5.jpg' },
  { url: 'https://www.cityopenmuseum.com/wp-content/uploads/2026/06/La-Fura-Dels-Baus_06.jpg', name: '6.jpg' },
  { url: 'https://www.cityopenmuseum.com/wp-content/uploads/2026/06/La-Fura-Dels-Baus_07.jpg', name: '7.jpg' },
  { url: 'https://www.cityopenmuseum.com/wp-content/uploads/2026/06/La-Fura-Dels-Baus_08.jpg', name: '8.jpg' },
  { url: 'https://www.cityopenmuseum.com/wp-content/uploads/2026/06/La-Fura-Dels-Baus_09.jpg', name: '9.jpg' },
  { url: 'https://www.cityopenmuseum.com/wp-content/uploads/2026/06/La-Fura-Dels-Baus_10.jpg', name: '10.jpg' },
  { url: 'https://www.cityopenmuseum.com/wp-content/uploads/2026/06/La-Fura-Dels-Baus_11.jpg', name: '11.jpg' },
  { url: 'https://www.cityopenmuseum.com/wp-content/uploads/2026/06/La-Fura-Dels-Baus_12.jpg', name: '12.jpg' },
  { url: 'https://www.cityopenmuseum.com/wp-content/uploads/2026/06/La-Fura-Dels-Baus_13.jpg', name: '13.jpg' },
  { url: 'https://www.cityopenmuseum.com/wp-content/uploads/2026/06/La-Fura-Dels-Baus_14.jpg', name: '14.jpg' },
  { url: 'https://www.cityopenmuseum.com/wp-content/uploads/2026/06/La-Fura-Dels-Baus_15.jpg', name: '15.jpg' }
];

async function download(item) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(path.join(targetDir, item.name));
    https.get(item.url, (res) => {
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`Downloaded ${item.name}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(path.join(targetDir, item.name), () => {});
      reject(err);
    });
  });
}

async function run() {
  for (const item of images) {
    await download(item);
  }
}

run();
