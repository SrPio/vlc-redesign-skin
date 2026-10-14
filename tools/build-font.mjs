// Builds skin/fonts/Inter-List.ttf: Inter Regular with taller vertical metrics.
// VLC's Playtree draws each item's text bottom-aligned in its row, and the text
// box height is ascender - descender. Making that box exactly one row tall
// (with the cap height centered in it) centers the text in the selection band.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIST_ROW_H, LIST_FONT_SIZE } from './spec.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = fs.readFileSync(path.join(ROOT, 'skin/fonts/Inter-Regular.ttf'));

function tables(buf) {
  const n = buf.readUInt16BE(4), out = {};
  for (let i = 0; i < n; i++) {
    const rec = 12 + i * 16;
    out[buf.toString('latin1', rec, rec + 4)] = { rec, offset: buf.readUInt32BE(rec + 8), length: buf.readUInt32BE(rec + 12) };
  }
  return out;
}

const buf = Buffer.from(src);
const t = tables(buf);
const upm = buf.readUInt16BE(t.head.offset + 18);
const capHeight = buf.readInt16BE(t['OS/2'].offset + 88);

// Pixel targets at LIST_FONT_SIZE, then back to font units. FreeType rounds the
// ascender up and the descender down, so stay a hair inside the integers.
const px = upm / LIST_FONT_SIZE;
const capPx = capHeight / px;
const ascPx = Math.round(LIST_ROW_H / 2 + capPx / 2);
const descPx = LIST_ROW_H - ascPx;
const asc = Math.floor(ascPx * px) - 1;
const desc = Math.floor(descPx * px) - 1;

const hhea = t.hhea.offset, os2 = t['OS/2'].offset;
buf.writeInt16BE(asc, hhea + 4);
buf.writeInt16BE(-desc, hhea + 6);
buf.writeInt16BE(0, hhea + 8);
buf.writeInt16BE(asc, os2 + 68);
buf.writeInt16BE(-desc, os2 + 70);
buf.writeInt16BE(0, os2 + 72);
buf.writeUInt16BE(asc, os2 + 74);
buf.writeUInt16BE(desc, os2 + 76);

function checksum(b, off, len) {
  let sum = 0;
  for (let i = 0; i < len; i += 4) {
    const word = (b[off + i] << 24 | (b[off + i + 1] || 0) << 16 | (b[off + i + 2] || 0) << 8 | (b[off + i + 3] || 0)) >>> 0;
    sum = (sum + word) >>> 0;
  }
  return sum;
}
for (const name of ['hhea', 'OS/2']) {
  const { rec, offset, length } = t[name];
  buf.writeUInt32BE(checksum(buf, offset, length), rec + 4);
}
buf.writeUInt32BE(0, t.head.offset + 8);
buf.writeUInt32BE((0xB1B0AFBA - checksum(buf, 0, buf.length)) >>> 0, t.head.offset + 8);

fs.writeFileSync(path.join(ROOT, 'skin/fonts/Inter-List.ttf'), buf);
console.log(`Inter-List.ttf: ascender ${ascPx}px, descender ${descPx}px (row ${LIST_ROW_H}px)`);
