// Packs skin/ into dist/VLCRedesign.vlt (a zip with theme.xml at its root).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import archiver from 'archiver';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(ROOT, 'dist/VLCRedesign.vlt');
fs.mkdirSync(path.dirname(out), { recursive: true });

const zip = archiver('zip', { zlib: { level: 9 } });
const stream = fs.createWriteStream(out);
zip.pipe(stream);
zip.directory(path.join(ROOT, 'skin'), false);
await zip.finalize();
await new Promise(r => stream.on('close', r));
console.log(`packed ${path.relative(ROOT, out)} (${(fs.statSync(out).size / 1024).toFixed(0)} KB)`);
