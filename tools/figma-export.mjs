// Exports icons (SVG) and reference renders (PNG) from the Figma file.
// Needs FIGMA_TOKEN (a Figma personal access token) and FIGMA_FILE_KEY (the key
// of your copy of the community file, from its URL: figma.com/design/<key>/...).
// Node ids are preserved when the community file is duplicated.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const FILE_KEY = process.env.FIGMA_FILE_KEY;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function getToken() {
  if (!process.env.FIGMA_TOKEN || !FILE_KEY) throw new Error('Set FIGMA_TOKEN and FIGMA_FILE_KEY');
  return process.env.FIGMA_TOKEN;
}

export const ICONS = {
  play: '44:419', pause: '44:427', previous: '45:18', next: '45:12', stop: '187:322',
  'volume-high': '182:179', 'volume-medium': '182:187', 'volume-low': '182:193', 'volume-mute': '182:198',
  audio: '44:407', subtitles: '42:398', 'playback-settings': '2230:9222', settings: '42:355',
  lists: '217:191', 'lists-active': '467:492',
  vlc: '48:57', more: '247:418', sidebar: '69:814', 'sidebar-active': '87:1041', folder: '51:808',
  'folder-active': '87:1031', divider: '71:863',
  minimize: '48:46', maximize: '48:51', fullscreen: '48:54', 'fullscreen-active': '6031:13553', close: '45:40',
  home: '70:828', 'home-active': '87:1026', videos: '71:857', 'videos-active': '87:1015',
  songs: '71:851', 'songs-active': '87:1009', streaming: '70:833', 'streaming-active': '477:1202',
  playlist: '42:357', 'playlist-active': '858:5098', recent: '2154:9699', add: '463:550', remove: '463:560',
  sort: '463:564', repeat: '187:470', 'repeat-active': '2460:9614', shuffle: '187:474', 'shuffle-active': '2461:9618',
  queue: '2127:7523', 'queue-active': '2461:9714', bookmarks: '2127:7548', chapters: '2127:7531', move: '463:417',
  search: '856:2147', list: '2107:6531', open: '330:267', 'arrow-left': '71:890', 'arrow-right': '71:887',
  quit: '6073:14046', 'chevron-down': '71:868', 'chevron-right': '71:875',
};

export const RENDERS = {
  'player-sidebar': '187:328', 'player-default': '247:445', 'player-hide-ui': '3328:11554',
  'controls-queue': '491:1781', 'controls-default': '491:1779', queue: '463:831',
  'play-btn': '848:1711', 'pause-btn': '848:1713',
  ...Object.fromEntries(['244:185', '244:190', '244:195', '244:200', '244:205', '244:210', '244:215', '244:220',
    '244:225', '244:230', '244:235', '244:240', '244:183'].map((id, i) => [`volume-${String(i).padStart(2, '0')}`, id])),
};

async function api(url, token) {
  const r = await fetch('https://api.figma.com' + url, { headers: { 'X-Figma-Token': token } });
  if (!r.ok) throw new Error(`Figma API ${r.status}: ${await r.text()}`);
  return r.json();
}

async function exportSet(map, format, scale, outDir, token) {
  fs.mkdirSync(outDir, { recursive: true });
  const ids = Object.values(map).join(',');
  const extra = format === 'svg' ? '&svg_outline_text=true&svg_include_id=false&svg_simplify_stroke=true' : `&scale=${scale}`;
  const res = await api(`/v1/images/${FILE_KEY}?ids=${encodeURIComponent(ids)}&format=${format}${extra}`, token);
  for (const [name, id] of Object.entries(map)) {
    const url = res.images[id];
    if (!url) { console.warn('missing', name, id); continue; }
    const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
    fs.writeFileSync(path.join(outDir, `${name}.${format}`), buf);
  }
  console.log(`exported ${Object.keys(map).length} ${format} -> ${path.relative(ROOT, outDir)}`);
}

const token = getToken();
const what = process.argv[2] || 'all';
if (what === 'all' || what === 'icons') await exportSet(ICONS, 'svg', 1, path.join(ROOT, 'design/icons'), token);
if (what === 'all' || what === 'renders') await exportSet(RENDERS, 'png', 1, path.join(ROOT, 'design/reference'), token);
