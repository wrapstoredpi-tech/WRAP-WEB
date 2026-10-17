const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function run() {
  const logoPath = path.resolve('public/intro/logo.png');
  const meta = await sharp(logoPath).metadata();
  console.log('Original metadata:', meta);

  const { data, info } = await sharp(logoPath).raw().toBuffer({ resolveWithObject: true });

  // Let's inspect background color:
  const bgPixel = {
    r: data[0],
    g: data[1],
    b: data[2],
    a: info.channels === 4 ? data[3] : 255
  };
  console.log('Top-left background pixel:', bgPixel);

  // Find exact bounding box of the logo outer border
  // Note: The logo has a rectangular black outer border.
  // The background outside it is either pure white (255,255,255) or slightly off-white JPEG/PNG compression artifacts.
  let minX = info.width, minY = info.height, maxX = -1, maxY = -1;

  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const idx = (y * info.width + x) * info.channels;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = info.channels === 4 ? data[idx + 3] : 255;

      // Dark border is black (r,g,b close to 0) and not transparent.
      // Background around the logo is white (r,g,b > 240) or transparent (a < 10).
      const isContent = (a > 100) && (r < 180 || g < 180 || b < 180);
      if (isContent) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  console.log('Exact logo border bounding box:', {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX + 1,
    height: maxY - minY + 1
  });

  const width = maxX - minX + 1;
  const height = maxY - minY + 1;
  const aspectRatio = width / height;
  console.log('Exact Aspect Ratio (width / height):', aspectRatio);

  // Extract exact bounding box so image edge touches the logo's outer border exactly
  const trimmedPath = path.resolve('public/intro/logo-trimmed.png');
  await sharp(logoPath)
    .extract({ left: minX, top: minY, width, height })
    .png()
    .toFile(trimmedPath);

  const trimmedRaw = await sharp(trimmedPath).raw().toBuffer({ resolveWithObject: true });
  console.log('Trimmed metadata:', trimmedRaw.info);
  console.log('Inspecting trimmed borders:');
  
  // Check left border (x=0) and right border (x=width-1)
  let leftDark = 0, rightDark = 0;
  for (let y = 0; y < trimmedRaw.info.height; y++) {
    const leftIdx = (y * trimmedRaw.info.width + 0) * trimmedRaw.info.channels;
    const rightIdx = (y * trimmedRaw.info.width + trimmedRaw.info.width - 1) * trimmedRaw.info.channels;
    if (trimmedRaw.data[leftIdx] < 128) leftDark++;
    if (trimmedRaw.data[rightIdx] < 128) rightDark++;
  }
  let topDark = 0, bottomDark = 0;
  for (let x = 0; x < trimmedRaw.info.width; x++) {
    const topIdx = (0 * trimmedRaw.info.width + x) * trimmedRaw.info.channels;
    const botIdx = ((trimmedRaw.info.height - 1) * trimmedRaw.info.width + x) * trimmedRaw.info.channels;
    if (trimmedRaw.data[topIdx] < 128) topDark++;
    if (trimmedRaw.data[botIdx] < 128) bottomDark++;
  }
  const midY = Math.floor(trimmedRaw.info.height / 2);
  console.log('midY =', midY);
  for (let x = 0; x < 10; x++) {
    const idx = (midY * trimmedRaw.info.width + x) * trimmedRaw.info.channels;
    console.log('x=' + x + ' : [' + [trimmedRaw.data[idx], trimmedRaw.data[idx+1], trimmedRaw.data[idx+2], trimmedRaw.data[idx+3]].join(',') + ']');
  }
}

run().catch(console.error);
