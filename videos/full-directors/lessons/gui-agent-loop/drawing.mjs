import { evidence } from './example.mjs';

export const C = {
  ground: '#e5e4d7',
  paper: '#faf8ea',
  soft: '#eeeddf',
  line: '#b5baab',
  ink: '#192f32',
  dim: '#4e645e',
  night: '#1f383b',
  well: '#142c30',
  faint: '#9cb4a8',
  white: '#fffdef',
  green: '#23604f',
  mint: '#bedcc2',
  amber: '#f3bc66',
  red: '#923e38',
  blush: '#f1d4bc',
  blue: '#3f6476',
  sky: '#ccdee1',
};
export function box(c, x, y, w, h, fill, stroke = null, sw = 2, r = 0) {
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  if (fill) {
    c.fillStyle = fill;
    c.fill();
  }
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = sw;
    c.stroke();
  }
}
export function path(c, points, color, width = 3, fill = null) {
  c.beginPath();
  c.moveTo(...points[0]);
  for (const point of points.slice(1)) c.lineTo(...point);
  if (fill) {
    c.closePath();
    c.fillStyle = fill;
    c.fill();
  }
  if (color) {
    c.lineJoin = 'round';
    c.lineCap = 'round';
    c.strokeStyle = color;
    c.lineWidth = width;
    c.stroke();
  }
}
export function dot(c, x, y, r, fill, edge = null) {
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fillStyle = fill;
  c.fill();
  if (edge) {
    c.lineWidth = 3;
    c.strokeStyle = edge;
    c.stroke();
  }
}
// The width is the reserved space for this single line.
export function type(c, s, x, y, px = 32, opts = {}) {
  const { font = 'Sans', weight = 400, color = C.ink, width = 1800, align = 'left' } = opts;
  c.textAlign = align;
  c.textBaseline = 'alphabetic';
  let size = px;
  const set = () => {
    c.font = weight + ' ' + size + 'px "Lesson ' + font + '", "Lesson Symbols"';
  };
  set();
  while (size > 17 && c.measureText(String(s)).width > width) {
    size--;
    set();
  }
  c.fillStyle = color;
  c.fillText(String(s), x, y);
}
export function mono(c, s, x, y, px = 27, color = C.dim, width = 1600) {
  type(c, s, x, y, px, { color, width, font: 'Mono' });
}
export function serif(c, s, x, y, px = 51, color = C.ink, width = 1700) {
  type(c, s, x, y, px, { color, width, font: 'Serif' });
}
export function tag(c, s, x, y, w, fill = C.soft, ink = C.ink) {
  box(c, x, y, w, 48, fill, null, 0, 4);
  type(c, s, x + w / 2, y + 33, 25, { align: 'center', color: ink, weight: 600, width: w - 18 });
}
export function header(c, kicker, title) {
  box(c, 0, 0, 1920, 1080, C.ground);
  for (let x = 85; x < 1860; x += 28) {
    path(
      c,
      [
        [x, 32],
        [x, 37],
      ],
      C.line,
      1,
    );
  }
  mono(c, kicker, 83, 78, 24, C.dim);
  serif(c, title, 80, 148, 65, C.ink, 1780);
}
export function window(c, x, y, w, h, title, right = '') {
  box(c, x + 8, y + 9, w, h, '#b0b7aa', null, 0, 6);
  box(c, x, y, w, h, C.paper, C.ink, 3, 6);
  box(c, x + 1, y + 1, w - 2, 62, C.night, null, 0, 5);
  for (let i = 0; i < 3; i++) box(c, x + 22 + i * 14, y + 21, 8, 20, [C.mint, C.amber, C.blush][i]);
  mono(c, title, x + 84, y + 41, 26, C.white, w - (right ? 280 : 118));
  if (right)
    type(c, right, x + w - 25, y + 41, 24, {
      align: 'right',
      color: C.faint,
      font: 'Mono',
      width: w / 2,
    });
}
export function strip(c, title, result, accent = C.mint) {
  box(c, 82, 855, 1756, 64, C.night, null, 0, 4);
  mono(c, title, 105, 896, 24, C.faint, 590);
  type(c, result, 1810, 898, 32, { color: accent, align: 'right', weight: 600, width: 1120 });
}
export function pointer(c, x, y, scale = 1) {
  c.save();
  c.translate(x, y);
  c.scale(scale, scale);
  path(
    c,
    [
      [0, 0],
      [0, 51],
      [14, 39],
      [26, 63],
      [37, 57],
      [25, 34],
      [45, 34],
    ],
    C.ink,
    4,
    C.amber,
  );
  c.restore();
}
export function cross(c, x, y, r = 17) {
  dot(c, x, y, r, C.amber, C.well);
  path(
    c,
    [
      [x - r - 7, y],
      [x + r + 7, y],
    ],
    C.well,
    2,
  );
  path(
    c,
    [
      [x, y - r - 7],
      [x, y + r + 7],
    ],
    C.well,
    2,
  );
}
export function fileIcon(c, x, y, w, h, fill = C.white) {
  const fold = Math.min(50, w * 0.2);
  path(
    c,
    [
      [x, y],
      [x + w - fold, y],
      [x + w, y + fold],
      [x + w, y + h],
      [x, y + h],
    ],
    C.ink,
    3,
    fill,
  );
  path(
    c,
    [
      [x + w - fold, y],
      [x + w - fold, y + fold],
      [x + w, y + fold],
    ],
    C.ink,
    2,
  );
}
export function branch(c, x, y, w, labels = ['Build', 'Test', 'Deploy']) {
  const step = w / (labels.length - 1);
  path(
    c,
    [
      [x, y],
      [x + w, y],
    ],
    C.line,
    7,
  );
  path(
    c,
    [
      [x, y],
      [x + step, y],
    ],
    C.green,
    7,
  );
  labels.forEach((name, i) => {
    const px = x + i * step;
    dot(c, px, y, 16, [C.green, C.red, C.paper][i], C.ink);
    if (i === 0)
      path(
        c,
        [
          [px - 7, y],
          [px - 2, y + 5],
          [px + 7, y - 6],
        ],
        C.white,
        3,
      );
    if (i === 1) {
      path(
        c,
        [
          [px - 5, y - 5],
          [px + 5, y + 5],
        ],
        C.white,
        3,
      );
      path(
        c,
        [
          [px + 5, y - 5],
          [px - 5, y + 5],
        ],
        C.white,
        3,
      );
    }
    type(c, name, px, y + 55, 27, { align: 'center', weight: 600, width: 180 });
  });
}
export function traceback(c, x, y, w, h) {
  box(c, x, y, w, h, C.well, null, 0, 5);
  mono(c, 'TEST LOG   /   ' + evidence.file, x + 28, y + 47, 24, C.faint, w - 56);
  path(
    c,
    [
      [x + 28, y + 69],
      [x + w - 28, y + 69],
    ],
    C.dim,
    2,
  );
  mono(c, '17   result = parse(row)', x + 28, y + 115, 26, C.faint, w - 56);
  mono(c, evidence.line + '   result["status"]', x + 28, y + 162, 30, C.white, w - 56);
  path(
    c,
    [
      [x + 30, y + 190],
      [x + 30, y + 228],
      [x + 57, y + 228],
    ],
    C.amber,
    4,
  );
  mono(c, evidence.error, x + 72, y + 239, 35, C.amber, w - 96);
}
export const mix = (a, b, t) => a + (b - a) * t;
export const ease = (t) => t * t * (3 - 2 * t);
export function cue(clock, beat, words, span = 0) {
  const index = clock.beat.beatIndex;
  return index < beat ? 0 : index > beat ? 1 : clock.reveal(words, span);
}
