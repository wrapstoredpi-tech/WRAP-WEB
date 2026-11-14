const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const brainDir = 'C:/Users/Lenovo/.gemini/antigravity/brain/fcf2ea2a-7c9f-4a1e-890a-04de02f25ad2';
const outDir = path.join(__dirname, '../public/phones');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

async function processImage(inputFile, outputFile, options = {}) {
  const fullInput = path.isAbsolute(inputFile) ? inputFile : path.join(brainDir, inputFile);
  if (!fs.existsSync(fullInput)) {
    console.error('File does not exist:', fullInput);
    return;
  }

  const img = sharp(fullInput);
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  // Create visited map and BFS queue for background detection
  const visited = new Uint8Array(width * height);
  const queue = [];
  const getIdx = (x, y) => (y * width + x);

  const isBg = (x, y) => {
    const idx = (y * width + x) * channels;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    return r >= 238 && g >= 238 && b >= 238;
  };

  // Border seeds
  for (let x = 0; x < width; x++) {
    if (isBg(x, 0)) { queue.push([x, 0]); visited[getIdx(x, 0)] = 1; }
    if (isBg(x, height - 1)) { queue.push([x, height - 1]); visited[getIdx(x, height - 1)] = 1; }
  }
  for (let y = 0; y < height; y++) {
    if (isBg(0, y)) { queue.push([0, y]); visited[getIdx(0, y)] = 1; }
    if (isBg(width - 1, y)) { queue.push([width - 1, y]); visited[getIdx(width - 1, y)] = 1; }
  }

  let head = 0;
  while (head < queue.length) {
    const [cx, cy] = queue[head++];
    const neighbors = [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]];
    for (const [nx, ny] of neighbors) {
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const nIdx = getIdx(nx, ny);
        if (!visited[nIdx] && isBg(nx, ny)) {
          visited[nIdx] = 1;
          queue.push([nx, ny]);
        }
      }
    }
  }

  const rgba = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = getIdx(x, y);
      const srcIdx = idx * channels;
      const dstIdx = idx * 4;
      rgba[dstIdx] = data[srcIdx];
      rgba[dstIdx + 1] = data[srcIdx + 1];
      rgba[dstIdx + 2] = data[srcIdx + 2];
      rgba[dstIdx + 3] = visited[idx] ? 0 : 255;
    }
  }

  // Convert raw RGBA to PNG buffer first so sharp can trim & resize
  const pngBuffer = await sharp(rgba, { raw: { width, height, channels: 4 } })
    .png()
    .toBuffer();

  const targetW = options.targetWidth || 200;
  const targetH = options.targetHeight || 340;

  const finalPath = path.join(outDir, outputFile);
  await sharp(pngBuffer)
    .trim()
    .resize({
      width: targetW,
      height: targetH,
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .webp({ quality: 90, alphaQuality: 100 })
    .toFile(finalPath);

  console.log('Successfully saved:', finalPath);
}

async function run() {
  console.log('Starting phone image processing...');
  await processImage('iphone_18_pro_max_cosmic_titanium_rear_1794659696162.jpg', 'iphone-18-pro-max.webp');
  await processImage('iphone_18_pro_max_cosmic_titanium_rear_1794659696162.jpg', 'iphone-18-pro.webp', { targetHeight: 320 });
  await processImage('iphone_17_pro_max_desert_gold_rear_1794659687581.jpg', 'iphone-17-pro-max.webp');
  await processImage('iphone_17_pro_max_desert_gold_rear_1794659687581.jpg', 'iphone-17-pro.webp', { targetHeight: 320 });
  await processImage('iphone_16_teal_back_1794659663915.jpg', 'iphone-17.webp');
  await processImage('iphone_16_pro_max_natural_titanium_back_1794659545291.jpg', 'iphone-16-pro-max.webp');
  await processImage('iphone_16_pro_max_natural_titanium_back_1794659545291.jpg', 'iphone-16-pro.webp', { targetHeight: 320 });
  await processImage('iphone_16_plus_ultramarine_rear_1794659653328.jpg', 'iphone-16-plus.webp');
  await processImage('iphone_16_teal_back_1794659663915.jpg', 'iphone-16.webp');

  // Samsung
  await processImage('samsung_s24_ultra_titanium_black_rear_1794659667554.jpg', 'samsung-s-series.webp');
  await processImage('samsung_s24_ultra_titanium_black_rear_1794659667554.jpg', 'samsung-galaxy-s24-ultra.webp');
  await processImage('samsung_s24_ultra_titanium_black_rear_1794659667554.jpg', 'samsung-galaxy-s25-ultra.webp');
  await processImage('samsung_galaxy_a55_awesome_iceblue_back_1794659675361.jpg', 'samsung-a-series.webp');
  await processImage('samsung_galaxy_a55_awesome_iceblue_back_1794659675361.jpg', 'samsung-galaxy-a55.webp');
  await processImage('galaxy_z_fold6_silver_shadow_rear_v3_1794659741539.jpg', 'samsung-z-series.webp');
  await processImage('galaxy_z_fold6_silver_shadow_rear_v3_1794659741539.jpg', 'samsung-galaxy-z-fold-6.webp');

  console.log('All phone images processed successfully!');
}

run().catch(err => {
  console.error('Error processing phone images:', err);
  process.exit(1);
});
