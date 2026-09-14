const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 calculation for PNG chunks
function makeCrcTable() {
  let c;
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[n] = c;
  }
  return crcTable;
}
const crcTable = makeCrcTable();

function crc32(buf) {
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ (-1)) >>> 0;
}

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(4 + 4 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  chunk.writeUInt32BE(crc32(typeAndData), 8 + len);
  return chunk;
}

function decodePng(buffer) {
  let offset = 8; // skip signature
  let width, height, bitDepth, colorType;
  const idatChunks = [];

  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    const data = buffer.slice(offset + 8, offset + 8 + length);

    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
    } else if (type === 'IDAT') {
      idatChunks.push(data);
    } else if (type === 'IEND') {
      break;
    }
    offset += 12 + length;
  }

  const compressedData = Buffer.concat(idatChunks);
  const decompressed = zlib.inflateSync(compressedData);

  // Unfilter scanlines (RGBA 8-bit only)
  const bytesPerPixel = colorType === 6 ? 4 : (colorType === 2 ? 3 : 4);
  const stride = width * bytesPerPixel;
  const pixels = Buffer.alloc(width * height * 4, 255);

  let inOffset = 0;
  let prevRow = Buffer.alloc(stride, 0);

  for (let y = 0; y < height; y++) {
    const filterType = decompressed[inOffset++];
    const currentRow = Buffer.alloc(stride);

    for (let x = 0; x < stride; x++) {
      const byte = decompressed[inOffset++];
      const a = x >= bytesPerPixel ? currentRow[x - bytesPerPixel] : 0;
      const b = prevRow[x];
      const c = x >= bytesPerPixel ? prevRow[x - bytesPerPixel] : 0;

      let val = byte;
      if (filterType === 0) val = byte;
      else if (filterType === 1) val = (byte + a) & 0xff;
      else if (filterType === 2) val = (byte + b) & 0xff;
      else if (filterType === 3) val = (byte + Math.floor((a + b) / 2)) & 0xff;
      else if (filterType === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        let pr = c;
        if (pa <= pb && pa <= pc) pr = a;
        else if (pb <= pc) pr = b;
        val = (byte + pr) & 0xff;
      }
      currentRow[x] = val;
    }

    for (let x = 0; x < width; x++) {
      const outIdx = (y * width + x) * 4;
      if (bytesPerPixel === 4) {
        pixels[outIdx] = currentRow[x * 4];
        pixels[outIdx + 1] = currentRow[x * 4 + 1];
        pixels[outIdx + 2] = currentRow[x * 4 + 2];
        pixels[outIdx + 3] = currentRow[x * 4 + 3];
      } else {
        pixels[outIdx] = currentRow[x * 3];
        pixels[outIdx + 1] = currentRow[x * 3 + 1];
        pixels[outIdx + 2] = currentRow[x * 3 + 2];
        pixels[outIdx + 3] = 255;
      }
    }
    prevRow = currentRow;
  }

  return { width, height, pixels };
}

function encodePng(width, height, pixels) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // bit depth 8
  ihdr.writeUInt8(6, 9); // RGBA
  ihdr.writeUInt8(0, 10); // compression
  ihdr.writeUInt8(0, 11); // filter
  ihdr.writeUInt8(0, 12); // interlace

  const stride = width * 4;
  const rawData = Buffer.alloc(height * (stride + 1));
  for (let y = 0; y < height; y++) {
    rawData[y * (stride + 1)] = 0; // Filter 0 (None)
    pixels.copy(rawData, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  const idatData = zlib.deflateSync(rawData, { level: 9 });
  const iendData = Buffer.alloc(0);

  return Buffer.concat([
    signature,
    createChunk('IHDR', ihdr),
    createChunk('IDAT', idatData),
    createChunk('IEND', iendData)
  ]);
}

// Generate smaller logo on solid white background
function generatePwaIcon(srcPath, outSize, logoScaleRatio) {
  const srcBuf = fs.readFileSync(srcPath);
  const src = decodePng(srcBuf);

  const targetLogoSize = Math.round(outSize * logoScaleRatio);
  const offsetX = Math.round((outSize - targetLogoSize) / 2);
  const offsetY = Math.round((outSize - targetLogoSize) / 2);

  // Solid white canvas
  const canvas = Buffer.alloc(outSize * outSize * 4, 255);

  // Nearest-neighbor / bilinear downsample and composite
  for (let ty = 0; ty < targetLogoSize; ty++) {
    const sy = Math.floor((ty / targetLogoSize) * src.height);
    for (let tx = 0; tx < targetLogoSize; tx++) {
      const sx = Math.floor((tx / targetLogoSize) * src.width);
      const srcIdx = (sy * src.width + sx) * 4;

      const r = src.pixels[srcIdx];
      const g = src.pixels[srcIdx + 1];
      const b = src.pixels[srcIdx + 2];
      const a = src.pixels[srcIdx + 3] / 255;

      const destX = offsetX + tx;
      const destY = offsetY + ty;
      const destIdx = (destY * outSize + destX) * 4;

      // Alpha blend on white (255, 255, 255)
      canvas[destIdx] = Math.round(r * a + 255 * (1 - a));
      canvas[destIdx + 1] = Math.round(g * a + 255 * (1 - a));
      canvas[destIdx + 2] = Math.round(b * a + 255 * (1 - a));
      canvas[destIdx + 3] = 255; // Solid opaque
    }
  }

  return encodePng(outSize, outSize, canvas);
}

try {
  const publicDir = path.resolve(__dirname, '../public');
  let srcLogoPath = path.resolve(__dirname, '../../logo.png');
  if (!fs.existsSync(srcLogoPath)) {
    srcLogoPath = path.join(publicDir, 'logo.png');
  }

  if (fs.existsSync(srcLogoPath)) {
    console.log('[PWA Icon Generator] Reading logo from:', srcLogoPath);
    // 1. Generate 512x512 with 52% logo size on solid white background
    const pwa512 = generatePwaIcon(srcLogoPath, 512, 0.52);
    fs.writeFileSync(path.join(publicDir, 'pwa-512.png'), pwa512);
    fs.writeFileSync(path.join(publicDir, 'logo.png'), pwa512);

    // 2. Generate 192x192 with 52% logo size on solid white background
    const pwa192 = generatePwaIcon(srcLogoPath, 192, 0.52);
    fs.writeFileSync(path.join(publicDir, 'pwa-192.png'), pwa192);

    // 3. Generate SVG version with solid white background and centered small logo
    const base64Src = fs.readFileSync(srcLogoPath).toString('base64');
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" fill="#ffffff" />
  <image href="data:image/png;base64,${base64Src}" x="123" y="123" width="266" height="266" preserveAspectRatio="xMidYMid meet" />
</svg>`;
    fs.writeFileSync(path.join(publicDir, 'pwa-icon.svg'), svgContent);
    fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgContent);

    console.log('✅ [PWA Icon Generator] Successfully generated white-bg smaller PWA icons (pwa-512.png, pwa-192.png, logo.png, pwa-icon.svg)!');
  } else {
    console.warn('[PWA Icon Generator] Source logo not found at:', srcLogoPath);
  }
} catch (e) {
  console.error('[PWA Icon Generator] Error:', e.message);
}
