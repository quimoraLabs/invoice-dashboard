const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 table & function for PNG chunks
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const typeAndData = chunk.subarray(4, 8 + len);
  const crc = crc32(typeAndData);
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

function distToSegment(px, py, x1, y1, x2, y2) {
  const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
}

function generateInvomoraIcon(size) {
  const rowBytes = 1 + size * 4;
  const raw = Buffer.alloc(size * rowBytes);

  const cornerRadius = size * 0.22;
  const center = size / 2;

  // Invoice document geometry
  const docLeft = size * 0.28;
  const docRight = size * 0.72;
  const docTop = size * 0.22;
  const docBottom = size * 0.78;
  const docRadius = size * 0.045;

  // Top-right cut fold
  const foldSize = size * 0.12;
  const foldX = docRight - foldSize;
  const foldY = docTop + foldSize;

  // Badge geometry
  const badgeCx = size * 0.69;
  const badgeCy = size * 0.70;
  const badgeRadius = size * 0.095;
  const badgeRing = badgeRadius + size * 0.015;

  for (let y = 0; y < size; y++) {
    const rowOffset = y * rowBytes;
    raw[rowOffset] = 0; // Filter: None
    const tY = y / size;

    for (let x = 0; x < size; x++) {
      const pxOffset = rowOffset + 1 + x * 4;

      // 1. Outer squircle mask
      const dx = Math.max(0, Math.abs(x + 0.5 - center) - (center - cornerRadius));
      const dy = Math.max(0, Math.abs(y + 0.5 - center) - (center - cornerRadius));
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > cornerRadius) {
        raw[pxOffset] = 0;
        raw[pxOffset + 1] = 0;
        raw[pxOffset + 2] = 0;
        raw[pxOffset + 3] = 0;
        continue;
      }

      // Default: App Icon Background Gradient (Indigo -> Violet)
      let r = Math.round(67 + (124 - 67) * tY);
      let g = Math.round(56 + (58 - 56) * tY);
      let b = Math.round(202 + (237 - 202) * tY);

      // Subtle inner rim glow
      const innerRatio = Math.min(1, dist / (size * 0.48));
      const shade = 1 - innerRatio * 0.15;
      r = Math.round(r * shade);
      g = Math.round(g * shade);
      b = Math.round(b * shade);

      // 2. Secondary Offset Invoice Sheet behind
      const bDx = x - size * 0.55;
      const bDy = y - size * 0.43;
      const rxRot = bDx * 0.99 - bDy * 0.14;
      const ryRot = bDx * 0.14 + bDy * 0.99;
      if (Math.abs(rxRot) < size * 0.20 && Math.abs(ryRot) < size * 0.26) {
        r = Math.round(r * 0.75 + 199 * 0.25);
        g = Math.round(g * 0.75 + 210 * 0.25);
        b = Math.round(b * 0.75 + 254 * 0.25);
      }

      // 3. Primary Invoice Sheet
      const inDocBox =
        x >= docLeft && x <= docRight &&
        y >= docTop && y <= docBottom;

      if (inDocBox) {
        const cDx = Math.max(0, Math.abs(x - (docLeft + docRight) / 2) - ((docRight - docLeft) / 2 - docRadius));
        const cDy = Math.max(0, Math.abs(y - (docTop + docBottom) / 2) - ((docBottom - docTop) / 2 - docRadius));
        const cDist = Math.sqrt(cDx * cDx + cDy * cDy);

        if (cDist <= docRadius) {
          const isCutCorner = (x >= foldX) && (y <= foldY) && ((x - foldX) + (foldY - y) > foldSize);
          const isFoldFlap = (x >= foldX) && (y <= foldY) && ((x - foldX) + (foldY - y) <= foldSize) && (x > foldX + (y - docTop));

          if (isCutCorner) {
            // Cut corner: reveal background
          } else if (isFoldFlap) {
            // Folded origami flap (accent indigo)
            r = 199;
            g = 210;
            b = 254;
          } else {
            // White document body
            r = 255;
            g = 255;
            b = 255;

            // Header badge on document (indigo)
            if (y >= size * 0.30 && y <= size * 0.34 && x >= size * 0.35 && x <= size * 0.52) {
              r = 79;
              g = 70;
              b = 229;
            }
            // Divider line
            else if (y >= size * 0.38 && y <= size * 0.39 && x >= size * 0.35 && x <= size * 0.65) {
              r = 226;
              g = 232;
              b = 240;
            }
            // Line 1: text bar + price pill
            else if (y >= size * 0.43 && y <= size * 0.455) {
              if (x >= size * 0.35 && x <= size * 0.53) {
                r = 148; g = 163; b = 184;
              } else if (x >= size * 0.58 && x <= size * 0.65) {
                r = 100; g = 116; b = 139;
              }
            }
            // Line 2: text bar + price pill
            else if (y >= size * 0.485 && y <= size * 0.51) {
              if (x >= size * 0.35 && x <= size * 0.50) {
                r = 203; g = 213; b = 225;
              } else if (x >= size * 0.58 && x <= size * 0.65) {
                r = 100; g = 116; b = 139;
              }
            }
            // Line 3: text bar + price pill
            else if (y >= size * 0.54 && y <= size * 0.565) {
              if (x >= size * 0.35 && x <= size * 0.52) {
                r = 203; g = 213; b = 225;
              } else if (x >= size * 0.58 && x <= size * 0.65) {
                r = 100; g = 116; b = 139;
              }
            }
            // Total highlight pill row
            else if (y >= size * 0.61 && y <= size * 0.675 && x >= size * 0.34 && x <= size * 0.66) {
              if (x >= size * 0.37 && x <= size * 0.48 && y >= size * 0.63 && y <= size * 0.655) {
                r = 79; g = 70; b = 229;
              } else {
                r = 238; g = 242; b = 255;
              }
            }
          }
        }
      }

      // 4. Verification / Paid Badge (Emerald circle with white checkmark)
      const bDist = Math.hypot(x - badgeCx, y - badgeCy);
      if (bDist <= badgeRing) {
        if (bDist > badgeRadius) {
          // White border ring
          r = 255;
          g = 255;
          b = 255;
        } else {
          // Emerald Green Fill
          const bGrad = (y - (badgeCy - badgeRadius)) / (badgeRadius * 2);
          r = Math.round(16 + (5 - 16) * bGrad);
          g = Math.round(185 + (150 - 185) * bGrad);
          b = Math.round(129 + (105 - 129) * bGrad);

          // Checkmark inside badge
          const relX = (x - badgeCx) / size;
          const relY = (y - badgeCy) / size;
          const thick = 0.013;

          const dist1 = distToSegment(relX, relY, -0.032, 0.0, -0.01, 0.024);
          const dist2 = distToSegment(relX, relY, -0.01, 0.024, 0.035, -0.022);

          if (Math.min(dist1, dist2) <= thick) {
            r = 255;
            g = 255;
            b = 255;
          }
        }
      }

      raw[pxOffset] = r;
      raw[pxOffset + 1] = g;
      raw[pxOffset + 2] = b;
      raw[pxOffset + 3] = 255;
    }
  }

  // PNG Header
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk: width, height, bit depth 8, color type 6 (RGBA), compression 0, filter 0, interlace 0
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0);
  ihdrData.writeUInt32BE(size, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // IDAT chunk: compressed image data
  const compressed = zlib.deflateSync(raw, { level: 9 });
  const idatChunk = makeChunk('IDAT', compressed);

  // IEND chunk
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate 192x192
const png192 = generateInvomoraIcon(192);
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), png192);
console.log('✓ Generated public/pwa-192x192.png (192x192)');

// Generate 512x512
const png512 = generateInvomoraIcon(512);
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), png512);
console.log('✓ Generated public/pwa-512x512.png (512x512)');

// Generate Apple Touch Icon (180x180)
const appleIcon = generateInvomoraIcon(180);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleIcon);
console.log('✓ Generated public/apple-touch-icon.png (180x180)');

// Generate Favicon (64x64)
const favicon = generateInvomoraIcon(64);
fs.writeFileSync(path.join(publicDir, 'favicon.png'), favicon);
console.log('✓ Generated public/favicon.png (64x64)');
