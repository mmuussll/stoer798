import { writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";
import { Buffer } from "node:buffer";

function crc32(buf) {
  const table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeB = Buffer.from(type, "ascii");
  const crcVal = Buffer.alloc(4);
  crcVal.writeUInt32BE(crc32(Buffer.concat([typeB, data])), 0);
  return Buffer.concat([len, typeB, data, crcVal]);
}

function generateIcon(size) {
  const raw = Buffer.alloc(size * (1 + size * 4));
  for (let y = 0; y < size; y++) {
    raw[y * (1 + size * 4)] = 0;
    for (let x = 0; x < size; x++) {
      const off = y * (1 + size * 4) + 1 + x * 4;
      const t = y / size;
      raw[off] = Math.round(37 + t * 50);        // R: blue gradient
      raw[off + 1] = Math.round(99 + t * 60);
      raw[off + 2] = Math.round(190 + t * 34);
      raw[off + 3] = 255;
    }
  }
  const mid = Math.floor(size / 2);
  const sw = Math.floor(size * 0.15);
  const th = Math.floor(size * 0.35);
  for (let y = mid - th; y <= mid + th; y++) {
    for (let x = mid - sw; x <= mid + sw; x++) {
      if (x < 0 || x >= size || y < 0 || y >= size) continue;
      const off = y * (1 + size * 4) + 1 + x * 4;
      raw[off] = 255; raw[off + 1] = 255; raw[off + 2] = 255; raw[off + 3] = 255;
    }
  }
  // horizontal top bar
  for (let y = mid - th; y <= mid - th + Math.floor(sw * 0.7); y++) {
    for (let x = mid - sw; x <= mid + sw + Math.floor(sw * 0.5); x++) {
      if (x < 0 || x >= size || y < 0 || y >= size) continue;
      const off = y * (1 + size * 4) + 1 + x * 4;
      raw[off] = 255; raw[off + 1] = 255; raw[off + 2] = 255; raw[off + 3] = 255;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  const compressed = deflateSync(raw);
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([sig, pngChunk("IHDR", ihdr), pngChunk("IDAT", Buffer.from(compressed)), pngChunk("IEND", Buffer.alloc(0))]);
}

writeFileSync("public/pwa-192x192.png", generateIcon(192));
writeFileSync("public/pwa-512x512.png", generateIcon(512));
console.log("PWA icons generated: 192x192 + 512x512");
