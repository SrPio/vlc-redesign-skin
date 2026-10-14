// Design tokens and geometry taken from the Figma file (frames 187:328, 247:445,
// 491:1781 and component 463:831). All values are in pixels at 1x.

export const COLORS = {
  accent: '#d37918',        // play button, seek knob, active icons
  accentDark: '#ab6314',    // two-tone icon accent
  seekFill: '#371f06',      // elapsed part of the seek bar
  well: '#090909',          // seek track, volume track, queue tab strip
  bar: '#1b1b1b',           // topbar, controls bar, video frame
  rail: '#191919',          // sidebar icon rail
  panel: '#0f0f0f',         // sidebar / queue panels (#0e0e0e @ 95% over bar)
  line: '#222222',          // separators
  video: '#000000',
  icon: '#8f8f8f',          // default icon / primary text
  iconMuted: '#6b6b6b',     // secondary text, queue toolbar icons
  item: '#969696',          // list item text
  pauseBg: '#6b6b6b',
  playIcon: '#161616',
  hover: 0.06,              // white overlay of the "Icon Wrapper / hover" component
  pressed: 0.10,
};

// Default window size. The Figma frames are 1920x1080; everything anchored to
// the right/bottom keeps the exact Figma offsets at any size.
export const W0 = 1280;
export const H0 = 720;
export const MIN_W = 860;
export const MIN_H = 420;

export const TOPBAR_H = 40;
export const CONTROLS_H = 54;
export const SIDEBAR_W = 427;    // 50 rail + 377 panel
export const RAIL_W = 50;
export const QUEUE_W = 400;
export const QUEUE_MARGIN = 20;
export const VIDEO_INSET = 10;   // half of the 20px #1b1b1b frame stroke
export const VIDEO_RADIUS = 9;

// Seek bar: starts at x=254 and ends 428px before the right edge.
export const SEEK_X = 254;
export const SEEK_RIGHT = 428;
export const SEEK_H = 28;
export const SEEK_W0 = W0 - SEEK_X - SEEK_RIGHT;
export const SEEK_FRAMES = 320;
export const KNOB_W = 8;

// Volume wedge (component 244:184). Fill width per volume percentage.
export const VOLUME_STOPS = [[0, 1], [10, 7], [20, 14], [30, 20], [40, 26], [50, 33], [60, 41], [70, 48],
  [80, 53], [90, 58], [100, 63], [150, 75], [200, 88]];
// skins2 maps its volume slider to 0..125% unless "qt-volume-complete" is set.
export const VOLUME_MAX_PCT = 125;
export const VOLUME_FRAMES = 51;

export const FONT = 'fonts/Inter-Regular.ttf';

// List rows (queue and sidebar tree): 32px item + 12px gap in the design.
export const LIST_ROW_H = 44;
export const LIST_FONT_SIZE = 14;
export const LIST_FONT = 'fonts/Inter-List.ttf';
