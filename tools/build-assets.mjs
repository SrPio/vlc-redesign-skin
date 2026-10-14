// Renders every bitmap used by the skin into skin/images/.
// Icons come from the SVGs exported from Figma (design/icons), static pieces
// that contain text are cropped from the Figma renders (design/reference).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import {
  COLORS as C, SEEK_W0, SEEK_H, SEEK_FRAMES, KNOB_W, VOLUME_STOPS, VOLUME_MAX_PCT, VOLUME_FRAMES,
  VIDEO_RADIUS, FONT, LIST_ROW_H,
} from './spec.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ICONS = path.join(ROOT, 'design/icons');
const REF = path.join(ROOT, 'design/reference');
const OUT = path.join(ROOT, 'skin/images');

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const manifest = {};
const jobs = [];

function save(id, input, meta = {}) {
  jobs.push((async () => {
    const buf = await sharp(input).png({ compressionLevel: 9 }).toBuffer();
    const { width, height } = await sharp(buf).metadata();
    fs.writeFileSync(path.join(OUT, `${id}.png`), buf);
    manifest[id] = { file: `images/${id}.png`, width, height, ...meta };
  })());
}

const svg = (w, h, body) => Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`);

const rect = (x, y, w, h, fill, r = 0, opacity = 1) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" ry="${r}" fill="${fill}" fill-opacity="${opacity}"/>`;

// Returns the inner markup of an exported icon, recolored.
function icon(name, color = C.icon, { accent, opacity = 1, scale = 1 } = {}) {
  let src = fs.readFileSync(path.join(ICONS, `${name}.svg`), 'utf8');
  src = src.replace(/<svg[^>]*>/, '').replace('</svg>', '');
  src = src.replace(/#8F8F8F/gi, color);
  if (accent) src = src.replace(/#AB6314|#D37918/gi, accent);
  // fill="none" comes from the stripped <svg> root of the exported icon.
  return `<g fill="none" opacity="${opacity}" transform="scale(${scale})">${src}</g>`;
}

const at = (x, y, inner) => `<g transform="translate(${x},${y})">${inner}</g>`;

// Button with up/over/down states. The hover state is the "Icon Wrapper / hover"
// component of the design: a 6% white rounded rectangle behind the icon.
function iconButton(id, { w, h, bg, iconName, color, ix, iy, r = 4, accent, opacity }) {
  const states = { '': 0, '-over': C.hover, '-down': C.pressed };
  for (const [suffix, alpha] of Object.entries(states)) {
    save(id + suffix, svg(w, h,
      rect(0, 0, w, h, bg) + (alpha ? rect(0, 0, w, h, '#ffffff', r, alpha) : '') +
      at(ix, iy, icon(iconName, color, { accent, opacity }))));
  }
}

function staticIcon(id, { w, h, bg, iconName, color, ix = 0, iy = 0, accent, opacity }) {
  save(id, svg(w, h, (bg ? rect(0, 0, w, h, bg) : '') + at(ix, iy, icon(iconName, color, { accent, opacity }))));
}

async function crop(file, left, top, width, height, bg) {
  let img = sharp(path.join(REF, file)).extract({ left, top, width, height });
  if (bg) img = img.flatten({ background: bg });
  return img.png().toBuffer();
}

function cropButton(id, file, box, bg, r) {
  const states = { '': 0, '-over': C.hover, '-down': C.pressed };
  for (const [suffix, alpha] of Object.entries(states)) {
    jobs.push((async () => {
      const base = await crop(file, ...box, bg);
      const overlay = svg(box[2], box[3], rect(0, 0, box[2], box[3], '#ffffff', r, alpha));
      save(id + suffix, await sharp(base).composite([{ input: overlay }]).png().toBuffer());
    })());
  }
}

async function text(str, color, size) {
  return sharp({
    text: {
      text: `<span foreground="${color}">${str}</span>`, font: `Inter ${size}`,
      fontfile: path.join(ROOT, 'skin', FONT), rgba: true, dpi: 72,
    },
  }).png().toBuffer();
}

const lighten = (hex, amt) => mix(hex, '#ffffff', amt);
const darken = (hex, amt) => mix(hex, '#000000', amt);
function mix(a, b, t) {
  const pa = a.match(/\w\w/g).map(x => parseInt(x, 16));
  const pb = b.match(/\w\w/g).map(x => parseInt(x, 16));
  return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, '0')).join('');
}

// ---------------------------------------------------------------- solids
for (const [id, color] of Object.entries({
  bar: C.bar, rail: C.rail, panel: C.panel, line: C.line, video: C.video, well: C.well, fsc: '#181818',
})) save(`solid-${id}`, svg(8, 8, rect(0, 0, 8, 8, color)));
save('tp', svg(1, 1, ''));

// Rounded inner corners of the video frame (stroke 20, radius 19 => inner radius 9).
{
  const r = VIDEO_RADIUS;
  const corner = (rot) => svg(r, r, rect(0, 0, r, r, C.bar) +
    `<g transform="rotate(${rot} ${r / 2} ${r / 2})"><path d="M${r} ${r}V0A${r} ${r} 0 0 0 0 ${r}Z" fill="${C.video}"/></g>`);
  save('video-tl', corner(0));
  save('video-tr', corner(90));
  save('video-br', corner(180));
  save('video-bl', corner(270));
}
// Idle logo shown in the video area when nothing is playing.
save('idle-cone', svg(96, 96, rect(0, 0, 96, 96, C.video) + icon('vlc', C.icon, { opacity: 0.35, scale: 4 })));

// ---------------------------------------------------------------- topbar
staticIcon('tb-vlc', { w: 24, h: 24, bg: C.bar, iconName: 'vlc' });
iconButton('tb-more', { w: 28, h: 28, bg: C.bar, iconName: 'more', ix: 2, iy: 2 });
iconButton('tb-sidebar', { w: 28, h: 28, bg: C.bar, iconName: 'sidebar', ix: 2, iy: 2 });
iconButton('tb-sidebar-on', { w: 28, h: 28, bg: C.bar, iconName: 'sidebar-active', ix: 2, iy: 2 });
staticIcon('tb-divider', { w: 24, h: 28, bg: C.bar, iconName: 'divider', iy: 2 });
cropButton('tb-folder', 'player-sidebar.png', [141, 6, 82, 28], C.bar, 6);
for (const n of ['minimize', 'maximize', 'fullscreen', 'close']) {
  iconButton(`tb-${n}`, { w: 36, h: 24, bg: C.bar, iconName: n, ix: 6, iy: 0 });
}

// ---------------------------------------------------------------- controls
// Generated twice: on the window controls bar and on the fullscreen controller.
for (const [p, bg] of [['ct', C.bar], ['fs', '#181818']]) {
  iconButton(`${p}-prev`, { w: 30, h: 28, bg, iconName: 'previous', ix: 3, iy: 2 });
  iconButton(`${p}-next`, { w: 30, h: 28, bg, iconName: 'next', ix: 3, iy: 2 });
  for (const [id, fill, name, ix] of [[`${p}-play`, C.accent, 'play', 17], [`${p}-pause`, C.pauseBg, 'pause', 15]]) {
    for (const [suffix, f] of [['', fill], ['-over', lighten(fill, 0.12)], ['-down', darken(fill, 0.15)]]) {
      save(id + suffix, svg(54, 28, rect(0, 0, 54, 28, bg) + rect(0, 0, 54, 28, f, 6) +
        at(ix, 2, icon(name, C.playIcon, { accent: C.playIcon }).replace(/#0E0E0E/gi, C.playIcon))));
    }
  }
  iconButton(`${p}-mute-off`, { w: 24, h: 24, bg, iconName: 'volume-high', ix: 0, iy: 0 });
  iconButton(`${p}-mute-on`, { w: 24, h: 24, bg, iconName: 'volume-mute', ix: 0, iy: 0 });
  for (const [id, name] of [['audio', 'audio'], ['subs', 'subtitles'], ['psettings', 'playback-settings'],
    ['lists', 'lists'], ['lists-on', 'lists-active'], ['fsexit', 'fullscreen-active'], ['fsenter', 'fullscreen']]) {
    iconButton(`${p}-${id}`, { w: 30, h: 32, bg, iconName: name, ix: 3, iy: 4 });
  }

  // Seek track: rounded caps + stretchable middle.
  save(`${p}-seek-l`, svg(6, SEEK_H, rect(0, 0, 6, SEEK_H, bg) + rect(0, 0, 12, SEEK_H, C.well, 6)));
  save(`${p}-seek-m`, svg(4, SEEK_H, rect(0, 0, 4, SEEK_H, C.well)));
  save(`${p}-seek-r`, svg(6, SEEK_H, rect(0, 0, 6, SEEK_H, bg) + rect(-6, 0, 12, SEEK_H, C.well, 6)));

  // Volume wedge frames.
  const outer = 'M3.59756 19.3638C1.55468 19.1572 0 17.4374 0 15.3841L0 12.6159C0 10.5626 1.55467 8.84279 3.59756 8.6362L85.6982 0.333893C87.4654 0.155189 89 1.54247 89 3.31867L89 24.6813C89 26.4575 87.4654 27.8448 85.6982 27.6661L3.59756 19.3638Z';
  const inner = 'M1.79183 16.1875C0.773415 16.0809 0 15.2223 0 14.1984L0 10.8016C0 9.77762 0.773416 8.91904 1.79183 8.81246L83.7918 0.231086C84.9723 0.107549 86 1.03331 86 2.22022L86 22.7798C86 23.9667 84.9723 24.8924 83.7918 24.7689L1.79183 16.1875Z';
  // Gradient handles from the Figma node (-0.029..1.017 of the 86px inner wedge).
  const grad = `<linearGradient id="g" x1="-2.5" y1="0" x2="87.5" y2="0" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#95d318"/><stop offset="0.5788" stop-color="#b1a918"/>
    <stop offset="0.7924" stop-color="#d37918"/><stop offset="1" stop-color="#ff3737"/></linearGradient>`;
  const frames = [];
  for (let k = 0; k < VOLUME_FRAMES; k++) {
    const pct = (k / (VOLUME_FRAMES - 1)) * VOLUME_MAX_PCT;
    let w = 0;
    for (let i = 1; i < VOLUME_STOPS.length; i++) {
      const [p0, w0] = VOLUME_STOPS[i - 1], [p1, w1] = VOLUME_STOPS[i];
      if (pct <= p1) { w = w0 + (w1 - w0) * (pct - p0) / (p1 - p0); break; }
    }
    if (k === 0) w = 0;
    frames.push(`<g transform="translate(0,${k * 28})">${rect(0, 0, 89, 28, bg)}<path d="${outer}" fill="${C.well}"/>
      <clipPath id="c${k}"><rect x="0" y="0" width="${w.toFixed(2)}" height="28"/></clipPath>
      <g clip-path="url(#c${k})"><g transform="translate(2,2)"><path d="${inner}" fill="url(#g)"/>
      <path d="${inner}" fill="#000" fill-opacity="0.2"/></g></g></g>`);
  }
  save(`${p}-volume`, svg(89, 28 * VOLUME_FRAMES, `<defs>${grad}</defs>` + frames.join('')), { frames: VOLUME_FRAMES });
}

// Seek fill frames (transparent outside the fill, scaled horizontally by VLC).
{
  const parts = [];
  for (let k = 0; k < SEEK_FRAMES; k++) {
    const v = k / (SEEK_FRAMES - 1);
    const c = 6 + v * (SEEK_W0 - 12);
    const w = Math.max(c - 2, 0);
    parts.push(rect(2, k * SEEK_H + 2, w.toFixed(2), SEEK_H - 4, C.seekFill, 4));
  }
  save('seek-fill', svg(SEEK_W0, SEEK_H * SEEK_FRAMES, parts.join('')), { frames: SEEK_FRAMES });
  // Knob: left half sits on the elapsed fill, right half on the track.
  for (const [suffix, f] of [['', C.accent], ['-over', lighten(C.accent, 0.12)]]) {
    save(`seek-knob${suffix}`, svg(KNOB_W, 24, rect(0, 0, KNOB_W / 2, 24, C.seekFill) +
      rect(KNOB_W / 2, 0, KNOB_W / 2, 24, C.well) + rect(0, 0, KNOB_W, 24, f, 4)));
  }
}

// ---------------------------------------------------------------- sidebar
for (const [id, name] of [['home', 'home'], ['videos', 'videos'], ['songs', 'songs'], ['streaming', 'streaming'],
  ['playlist', 'playlist-active'], ['recent', 'recent'], ['add', 'add']]) {
  iconButton(`sb-${id}`, { w: 30, h: 32, bg: C.rail, iconName: name, ix: 3, iy: 4 });
}
staticIcon('sb-back', { w: 24, h: 24, bg: C.panel, iconName: 'arrow-left' });
staticIcon('sb-fwd', { w: 24, h: 24, bg: C.panel, iconName: 'arrow-right', opacity: 0.3 });
jobs.push((async () => save('sb-title', await crop('player-sidebar.png', 140, 60, 197, 24)))());
for (const n of ['more', 'open', 'sort', 'list', 'search']) {
  iconButton(`sb-${n}`, { w: 24, h: 24, bg: C.panel, iconName: n, ix: 0, iy: 0 });
}
// "Add media" row (replaces "Create playlist": VLC 3 has no empty playlists).
jobs.push((async () => {
  const label = await text('Add media', C.iconMuted, 14);
  const states = { '': 0, '-over': C.hover, '-down': C.pressed };
  for (const [suffix, alpha] of Object.entries(states)) {
    const base = svg(337, 32, rect(0, 0, 337, 32, C.panel) + (alpha ? rect(0, 0, 337, 32, '#ffffff', 6, alpha) : '') +
      at(4, 4, icon('add')));
    save(`sb-addrow${suffix}`, await sharp(base).composite([{ input: label, left: 42, top: 11 }]).png().toBuffer());
  }
})());
// Tree images (transparent so the selection colour shows through). One pixel
// shorter than the row (VLC adds 1px between rows) with the icon centered on
// the text line of the Inter-List font.
const ROW_IMG = LIST_ROW_H - 1, ROW_IY = LIST_ROW_H / 2 - 12 - 1;
staticIcon('tree-open', { w: 34, h: ROW_IMG, iconName: 'chevron-down', ix: 4, iy: ROW_IY });
staticIcon('tree-closed', { w: 34, h: ROW_IMG, iconName: 'chevron-right', ix: 4, iy: ROW_IY });
staticIcon('tree-item', { w: 34, h: ROW_IMG, iconName: 'videos', ix: 4, iy: ROW_IY });

// ---------------------------------------------------------------- queue panel
jobs.push((async () => save('q-header', await crop('queue.png', 0, 0, 400, 50, C.bar)))());
save('q-bottom', svg(400, 10, rect(0, 0, 400, 10, C.bar) + rect(0, -10, 400, 20, C.panel, 10)));
iconButton('q-sort', { w: 24, h: 24, bg: C.panel, iconName: 'sort', color: C.iconMuted, ix: 0, iy: 0 });
iconButton('q-repeat', { w: 30, h: 28, bg: C.panel, iconName: 'repeat', color: C.iconMuted, ix: 3, iy: 2 });
iconButton('q-repeat-on', { w: 30, h: 28, bg: C.panel, iconName: 'repeat', color: C.accent, ix: 3, iy: 2 });
iconButton('q-shuffle', { w: 30, h: 28, bg: C.panel, iconName: 'shuffle', color: C.iconMuted, ix: 3, iy: 2 });
iconButton('q-shuffle-on', { w: 30, h: 28, bg: C.panel, iconName: 'shuffle', color: C.accent, ix: 3, iy: 2 });
iconButton('q-remove', { w: 24, h: 24, bg: C.panel, iconName: 'remove', color: C.iconMuted, ix: 0, iy: 0 });
iconButton('q-add', { w: 24, h: 24, bg: C.panel, iconName: 'add', color: C.iconMuted, ix: 0, iy: 0 });
staticIcon('q-item', { w: 42, h: ROW_IMG, iconName: 'move', ix: 4, iy: ROW_IY });
// Scrollbar thumb for the lists.
for (const [suffix, f] of [['', '#262626'], ['-over', '#333333'], ['-down', '#3d3d3d']]) {
  save(`thumb${suffix}`, svg(4, 48, rect(0, 0, 4, 48, C.panel) + rect(0, 0, 4, 48, f, 2)));
}

await Promise.all(jobs);
fs.writeFileSync(path.join(ROOT, 'tools/.assets.json'), JSON.stringify(manifest, null, 2));
console.log(`built ${Object.keys(manifest).length} images -> skin/images`);
