// Generates skin/theme.xml (VLC Skins2) from the layout spec and the bitmap
// manifest written by build-assets.mjs.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  COLORS as C, W0, H0, MIN_W, MIN_H, TOPBAR_H, CONTROLS_H, SIDEBAR_W, RAIL_W, QUEUE_W, QUEUE_MARGIN,
  VIDEO_INSET, VIDEO_RADIUS, SEEK_X, SEEK_RIGHT, SEEK_W0, SEEK_H, SEEK_FRAMES, KNOB_W, VOLUME_FRAMES, FONT,
  LIST_FONT, LIST_FONT_SIZE,
} from './spec.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const assets = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/.assets.json'), 'utf8'));

const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const attrs = o => Object.entries(o).filter(([, v]) => v !== undefined).map(([k, v]) => `${k}="${esc(v)}"`).join(' ');
const tag = (name, o, children) => children
  ? `<${name} ${attrs(o)}>\n${children.join('\n')}\n</${name}>`
  : `<${name} ${attrs(o)}/>`;

// Anchor presets: where the control sticks when the window is resized.
const A = {
  tl: { lefttop: 'lefttop', rightbottom: 'lefttop' },
  tr: { lefttop: 'righttop', rightbottom: 'righttop' },
  bl: { lefttop: 'leftbottom', rightbottom: 'leftbottom' },
  br: { lefttop: 'rightbottom', rightbottom: 'rightbottom' },
  top: { lefttop: 'lefttop', rightbottom: 'righttop' },        // stretches horizontally
  bottom: { lefttop: 'leftbottom', rightbottom: 'rightbottom' },
  left: { lefttop: 'lefttop', rightbottom: 'leftbottom' },     // stretches vertically
  right: { lefttop: 'righttop', rightbottom: 'rightbottom' },
  all: { lefttop: 'lefttop', rightbottom: 'rightbottom' },
};

let uid = 0;
const id = p => `${p}.${++uid}`;

const img = (image, x, y, anchor = A.tl, extra = {}) => tag('Image', { id: id('img'), x, y, image, ...anchor, ...extra });
const fill = (image, x, y, width, height, anchor, extra = {}) =>
  // Tiled, not scaled: skins2 hit-tests scaled images against the original
  // bitmap size, so a scaled 8x8 image only reacts to clicks in its corner.
  img(image, x, y, anchor, { width, height, resize: 'mosaic', ...extra });
const button = (base, x, y, action, tip, anchor = A.tl, extra = {}) => tag('Button', {
  id: id('btn'), x, y, up: base, over: `${base}-over`, down: `${base}-down`, action, tooltiptext: tip, ...anchor, ...extra,
});
const checkbox = (state, off, on, a1, a2, tip1, tip2, x, y, anchor = A.tl) => tag('Checkbox', {
  id: id('chk'), x, y, state,
  up1: off, over1: `${off}-over`, down1: `${off}-down`,
  up2: on, over2: `${on}-over`, down2: `${on}-down`,
  action1: a1, action2: a2, tooltiptext1: tip1, tooltiptext2: tip2, ...anchor,
});
const text = (t, x, y, width, font, color, anchor, extra = {}) =>
  tag('Text', { id: id('txt'), x, y, width, text: t, font, color, ...anchor, ...extra });

// ------------------------------------------------------------------ pieces
function titlebar(W, { sidebar, queue }) {
  const target = (s, q) => `main.setLayout(${layoutId(s, q)})`;
  return [
    fill('solid-bar', 0, 0, W, TOPBAR_H, A.top, { action: 'move', action2: 'main.maximize()' }),
    img('tb-vlc', 13, 8, A.tl, { action: 'move' }),
    button('tb-more', 51, 6, 'dialogs.popup()', 'Menú'),
    sidebar
      ? button('tb-sidebar-on', 89, 6, target(false, queue), 'Ocultar barra lateral')
      : button('tb-sidebar', 89, 6, target(true, queue), 'Mostrar barra lateral'),
    img('tb-divider', 117, 6, A.tl, { action: 'move' }),
    button('tb-folder', 141, 6, 'dialogs.directory()', 'Abrir carpeta'),
    text('VLC Media Player', 330, 12, W - 660, 'inter14', C.icon, A.top,
      { alignment: 'center', scrolling: 'none', focus: 'false', visible: 'vlc.isStopped' }),
    text('$N', 330, 12, W - 660, 'inter14', C.icon, A.top,
      { alignment: 'center', scrolling: 'none', focus: 'false', visible: 'not vlc.isStopped' }),
    button('tb-minimize', W - 150, 8, 'vlc.minimize()', 'Minimizar', A.tr),
    checkbox('main.isMaximized', 'tb-maximize', 'tb-maximize', 'main.maximize()', 'main.unmaximize()',
      'Maximizar', 'Restaurar', W - 114, 8, A.tr),
    button('tb-fullscreen', W - 78, 8, 'vlc.fullscreen()', 'Pantalla completa', A.tr),
    button('tb-close', W - 42, 8, 'vlc.quit()', 'Cerrar', A.tr),
  ];
}

function videoArea(W, H, { sidebar, queue }) {
  const x0 = sidebar ? SIDEBAR_W : VIDEO_INSET;
  const x1 = queue ? W - QUEUE_MARGIN - QUEUE_W - VIDEO_INSET : W - VIDEO_INSET;
  const y0 = TOPBAR_H, y1 = H - CONTROLS_H;
  const w = x1 - x0, h = y1 - y0, r = VIDEO_RADIUS;
  return [
    fill('solid-video', x0, y0, w, h, A.all),
    img('video-tl', x0, y0),
    img('video-tr', x1 - r, y0, A.tr),
    img('video-bl', x0, y1 - r, A.bl),
    img('video-br', x1 - r, y1 - r, A.br),
    // Centered idle logo: an inner panel keeps its relative position.
    tag('Panel', { id: id('pnl'), x: x0, y: y0, width: w, height: h, ...A.all }, [
      tag('Panel', {
        id: id('pnl'), x: Math.round(w / 2 - 48), y: Math.round(h / 2 - 48), width: 96, height: 96,
        xkeepratio: 'true', ykeepratio: 'true',
      }, [img('idle-cone', 0, 0, A.tl, { visible: 'not vlc.hasVout' })]),
    ]),
    tag('Video', { id: id('video'), x: x0, y: y0, width: w, height: h, autoresize: 'false', visible: 'vlc.hasVout', ...A.all }),
  ];
}

function listColors(bg) {
  return { font: 'interList', fgcolor: C.item, playcolor: C.accent, selcolor: '#1d1d1d', bgcolor1: bg, bgcolor2: bg };
}

function scrollbar(x, y, height, anchor) {
  return tag('Slider', {
    id: id('scroll'), x, y, up: 'thumb', over: 'thumb-over', down: 'thumb-down',
    points: `(2,${height - 24}),(2,24)`, thickness: 4, tooltiptext: '', ...anchor,
  });
}

function sidebarPanel(W, H) {
  const bottom = H - CONTROLS_H;
  const rail = [
    ['sb-home', 'dialogs.file()', 'Abrir archivo'],
    ['sb-videos', 'dialogs.directory()', 'Abrir carpeta'],
    ['sb-songs', 'dialogs.disc()', 'Abrir disco'],
    ['sb-streaming', 'dialogs.net()', 'Abrir ubicación de red'],
    ['sb-playlist', 'dialogs.playlist()', 'Lista de reproducción'],
    ['sb-recent', 'dialogs.popup()', 'Recientes y más opciones'],
    ['sb-add', 'playlist.add()', 'Añadir a la lista'],
  ];
  const treeY = 207, treeH = bottom - 20 - treeY;
  return [
    fill('solid-rail', 0, TOPBAR_H, RAIL_W, bottom - TOPBAR_H, A.left),
    fill('solid-panel', RAIL_W, TOPBAR_H, SIDEBAR_W - RAIL_W, bottom - TOPBAR_H, A.left),
    ...rail.map(([b, a, t], i) => button(b, 10, 48 + 46 * i, a, t)),
    img('sb-back', 70, 60),
    img('sb-fwd', 106, 60),
    img('sb-title', 140, 60),
    button('sb-more', 347, 60, 'dialogs.popup()', 'Más opciones'),
    button('sb-open', 383, 60, 'dialogs.playlist()', 'Abrir lista en ventana'),
    button('sb-sort', 311, 104, 'playlist.sort()', 'Ordenar'),
    button('sb-list', 347, 104, 'playlist.save()', 'Guardar lista'),
    button('sb-search', 383, 104, 'dialogs.playlist()', 'Buscar'),
    fill('solid-line', 70, 145, 337, 1, A.tl),
    button('sb-addrow', 70, 165, 'playlist.add()', 'Añadir archivos'),
    tag('Playtree', {
      id: id('sidebar.tree'), x: 70, y: treeY, width: 337, height: treeH, flat: 'false',
      itemimage: 'tree-item', openimage: 'tree-open', closedimage: 'tree-closed', ...listColors(C.panel), ...A.left,
    }, [scrollbar(411, treeY, treeH, A.left)]),
  ];
}

function queuePanel(W, H) {
  const x = W - QUEUE_MARGIN - QUEUE_W;
  const y0 = TOPBAR_H + QUEUE_MARGIN;
  const y1 = H - CONTROLS_H - QUEUE_MARGIN;
  const listY = y0 + 120, listH = y1 - 20 - listY;
  return [
    img('q-header', x, y0, A.tr),
    fill('solid-panel', x, y0 + 50, QUEUE_W, y1 - 10 - (y0 + 50), A.right),
    img('q-bottom', x, y1 - 10, A.br),
    button('q-sort', x + 200, y0 + 73, 'playlist.sort()', 'Ordenar', A.tr),
    checkbox('playlist.isLoop', 'q-repeat', 'q-repeat-on', 'playlist.setLoop(true)', 'playlist.setLoop(false)',
      'Repetir todo', 'Desactivar repetición', x + 236, y0 + 71, A.tr),
    checkbox('playlist.isRandom', 'q-shuffle', 'q-shuffle-on', 'playlist.setRandom(true)', 'playlist.setRandom(false)',
      'Aleatorio', 'Desactivar aleatorio', x + 278, y0 + 71, A.tr),
    button('q-remove', x + 320, y0 + 73, 'playlist.del()', 'Quitar seleccionados', A.tr),
    button('q-add', x + 356, y0 + 73, 'playlist.add()', 'Añadir archivos', A.tr),
    tag('Playtree', {
      id: id('queue.tree'), x: x + 20, y: listY, width: QUEUE_W - 40, height: listH, flat: 'true',
      itemimage: 'q-item', ...listColors(C.panel), ...A.right,
    }, [scrollbar(x + 386, listY, listH, A.right)]),
  ];
}

// Bottom bar. `p` selects the bitmap set ("ct" window bar, "fs" fullscreen).
function controls(W, H, p, { queue, sidebar, fullscreen = false } = {}) {
  const y = H - CONTROLS_H;
  const seekW = W - SEEK_X - SEEK_RIGHT;
  const out = [
    fill(fullscreen ? 'solid-fsc' : 'solid-bar', 0, y, W, CONTROLS_H, A.bottom, fullscreen ? {} : { action: 'move' }),
  ];
  if (fullscreen) out.push(fill('solid-line', 0, y, W, 1, A.bottom));
  out.push(
    button(`${p}-prev`, 20, y + 13, 'playlist.previous()', 'Anterior', A.bl),
    checkbox('vlc.isPlaying', `${p}-play`, `${p}-pause`, 'vlc.play()', 'vlc.pause()', 'Reproducir', 'Pausa', 58, y + 13, A.bl),
    button(`${p}-next`, 120, y + 13, 'playlist.next()', 'Siguiente', A.bl),
    text('$T', 177, y + 19, 70, 'inter15', C.icon, A.bl, { scrolling: 'none' }),
    img(`${p}-seek-l`, SEEK_X, y + 13, A.bl),
    fill(`${p}-seek-m`, SEEK_X + 6, y + 13, seekW - 12, SEEK_H, A.bottom),
    img(`${p}-seek-r`, SEEK_X + seekW - 6, y + 13, A.br),
    tag('Slider', {
      // No width/height: the control takes the size of its curve, so the
      // resize factors are 1 and the knob/frames are not stretched.
      id: id('seek'), x: SEEK_X, y: y + 13,
      up: 'seek-knob', over: 'seek-knob-over', down: 'seek-knob-over',
      points: `(${KNOB_W / 2 + 2},${SEEK_H / 2}),(${seekW - KNOB_W / 2 - 2},${SEEK_H / 2})`, thickness: SEEK_H / 2,
      value: 'time', tooltiptext: '$T / $D', ...A.bottom,
    }, [tag('SliderBackground', { id: id('seekbg'), image: 'seek-fill', nbvert: SEEK_FRAMES })]),
    text('$D', W - 414, y + 18, 70, 'inter15', C.icon, A.br, { scrolling: 'none' }),
    checkbox('vlc.isMute', `${p}-mute-off`, `${p}-mute-on`, 'vlc.mute()', 'vlc.mute()', 'Silenciar', 'Activar sonido',
      W - 324, y + 15, A.br),
    tag('Slider', {
      id: id('vol'), x: W - 292, y: y + 13, up: 'tp',
      points: '(0,14),(88,14)', thickness: 14, value: 'volume', tooltiptext: 'Volumen: $V%', ...A.br,
    }, [tag('SliderBackground', { id: id('volbg'), image: `${p}-volume`, nbvert: VOLUME_FRAMES })]),
    button(`${p}-audio`, W - 184, y + 11, 'dialogs.audioPopup()', 'Audio', A.br),
    button(`${p}-subs`, W - 142, y + 11, 'dialogs.videoPopup()', 'Video y subtítulos', A.br),
    button(`${p}-psettings`, W - 100, y + 11, 'dialogs.miscPopup()', 'Reproducción', A.br),
  );
  if (fullscreen) {
    out.push(button(`${p}-fsexit`, W - 50, y + 11, 'vlc.fullscreen()', 'Salir de pantalla completa', A.br));
  } else {
    out.push(queue
      ? button(`${p}-lists-on`, W - 50, y + 11, `main.setLayout(${layoutId(sidebar, false)})`, 'Ocultar cola', A.br)
      : button(`${p}-lists`, W - 50, y + 11, `main.setLayout(${layoutId(sidebar, true)})`, 'Mostrar cola', A.br));
  }
  return out;
}

function resizeHandles(W, H) {
  return [
    fill('solid-bar', W - 6, 0, 6, H, A.right, { action: 'resizeE' }),
    fill('solid-bar', 0, H - 6, W, 6, A.bottom, { action: 'resizeS' }),
    fill('solid-bar', W - 16, H - 16, 16, 16, A.br, { action: 'resizeSE' }),
  ];
}

const layoutId = (sidebar, queue) => sidebar ? (queue ? 'both' : 'sidebar') : (queue ? 'queue' : 'plain');

function layout(sidebar, queue) {
  const W = W0, H = H0, opts = { sidebar, queue };
  const children = [
    fill('solid-bar', 0, 0, W, H, A.all),
    ...titlebar(W, opts),
    ...videoArea(W, H, opts),
    ...(sidebar ? sidebarPanel(W, H) : []),
    ...(queue ? queuePanel(W, H) : []),
    ...controls(W, H, 'ct', opts),
    ...resizeHandles(W, H),
  ];
  return tag('Layout', {
    id: layoutId(sidebar, queue), width: W, height: H,
    minwidth: MIN_W + (sidebar ? 220 : 0) + (queue ? 220 : 0), maxwidth: 99999, minheight: MIN_H, maxheight: 99999,
  }, children);
}

// ------------------------------------------------------------------ theme
const FS_W = 1920;
const bitmaps = Object.entries(assets).map(([key, a]) => tag('Bitmap', { id: key, file: a.file, alphacolor: '#FF00FF' }));
const fonts = [12, 14, 15, 16].map(s => tag('Font', { id: `inter${s}`, file: FONT, size: s }))
  .concat(tag('Font', { id: 'interList', file: LIST_FONT, size: LIST_FONT_SIZE }));

const theme = tag('Theme', { version: '2.0', magnet: 15, alpha: 255, movealpha: 255 }, [
  tag('ThemeInfo', {
    name: 'VLC Redesign', author: 'Design by Juxtopposed (CC BY 4.0), skin by SrPio',
    webpage: 'https://github.com/SrPio/vlc-redesign-skin',
  }),
  ...bitmaps,
  ...fonts,
  tag('Window', { id: 'main', position: 'Center', dragdrop: 'true', playondrop: 'true' }, [
    // The last layout is the one shown on first start.
    layout(true, true),
    layout(false, true),
    layout(true, false),
    layout(false, false),
  ]),
  tag('Window', { id: 'fullscreenController', position: 'South', visible: 'false' }, [
    tag('Layout', { id: 'fsc', width: FS_W, height: CONTROLS_H, minwidth: FS_W, maxwidth: FS_W, minheight: CONTROLS_H, maxheight: CONTROLS_H },
      controls(FS_W, CONTROLS_H, 'fs', { fullscreen: true })),
  ]),
]);

const xml = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE Theme PUBLIC "-//VideoLAN//DTD VLC Skins V2.0//EN" "skin.dtd">
<!-- Generated by tools/build-theme.mjs. Do not edit by hand. -->
${theme}
`;
fs.writeFileSync(path.join(ROOT, 'skin/theme.xml'), xml);
console.log(`theme.xml written (${bitmaps.length} bitmaps, ${uid} controls)`);
