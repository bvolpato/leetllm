import { lessonFont } from '../../../lib/fonts.mjs';

// Coordinates use a 1280 by 720 design surface. The host paints at 1920 by 1080.
export const C = {
  paper: '#f5e9cc',
  ivory: '#fff6de',
  ink: '#172c2c',
  faint: '#9eb4a8',
  teal: '#88dec3',
  green: '#b8e597',
  amber: '#f5c27b',
  red: '#ffa28e',
  shell: '#627a70',
  metal: '#bfbd9e',
  dark: '#152827',
  line: '#688881',
};
export const mix = (a, b, t) => a + (b - a) * t;
export const beat = (k) => k.beat.beatIndex + 1;
export function cue(k, n, phrase, seconds = 0.6, captionStart) {
  if (beat(k) !== n) return beat(k) > n ? 1 : 0;
  const t = k.reveal(phrase, seconds, { captionStart });
  return t * t * (3 - 2 * t);
}
export function afterCue(k, n, phrase, seconds = 0, captionStart = phrase) {
  if (beat(k) !== n) return Number(beat(k) > n);
  const { start, end } = k.wordCue(phrase);
  const finished = k.reveal(phrase, end - start, { captionStart }) === 1;
  if (!finished || seconds === 0) return Number(finished);
  const t = Math.max(0, Math.min((k.elapsed - end) / seconds, 1));
  return t * t * (3 - 2 * t);
}
export function rect(c, x, y, w, h, color, r = 0) {
  c.fillStyle = color;
  if (!r) {
    c.fillRect(x, y, w, h);
    return;
  }
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  c.fill();
}
export function stroke(c, pts, color, width = 2, dash = []) {
  c.save();
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.strokeStyle = color;
  c.lineWidth = width;
  c.setLineDash(dash);
  c.beginPath();
  pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.stroke();
  c.restore();
}
export function poly(c, pts, color) {
  c.fillStyle = color;
  c.beginPath();
  pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  c.fill();
}
export function dot(c, x, y, r, color) {
  c.fillStyle = color;
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fill();
}
export function txt(c, str, x, y, size = 26, color = C.paper, opts = {}) {
  c.save();
  const { family = 'Sans', weight = 500, align = 'left', width = 1120 } = opts;
  str = String(str);
  c.font = lessonFont(size, family.toLowerCase(), weight);
  const measured = c.measureText(str).width;
  if (measured > width)
    c.font = lessonFont((size * width) / measured, family.toLowerCase(), weight);
  c.textAlign = align;
  c.fillStyle = color;
  c.fillText(str, x, y);
  c.restore();
}
export const mono = (c, s, x, y, z = 25, color = C.paper, width = 1120) =>
  txt(c, s, x, y, z, color, { family: 'Mono', width });
export const mid = (c, s, x, y, z = 25, color = C.paper, width = 1120) =>
  txt(c, s, x, y, z, color, { align: 'center', width });
export function bolt(c, x, y) {
  dot(c, x, y, 5, '#24342f');
  dot(c, x - 0.6, y - 1, 4, '#adaf96');
  stroke(
    c,
    [
      [x - 2, y + 1],
      [x + 2, y - 2],
    ],
    '#5c675c',
    1.6,
  );
}
export function board(c, k, hue = '#244842') {
  c.scale(1.5, 1.5);
  const g = c.createLinearGradient(0, 0, 1180, 720);
  g.addColorStop(0, hue);
  g.addColorStop(1, '#122425');
  rect(c, 0, 0, 1280, 720, g);
  for (let y = 0; y < 720; y += 8) rect(c, 0, y, 1280, 1, '#ffffff03');
  txt(c, k.beat.chapterTitle, 53, 84, 51, C.ivory, { family: 'Serif', weight: 500, width: 1170 });
  stroke(
    c,
    [
      [54, 111],
      [1226, 111],
    ],
    '#aab6a269',
    1.5,
  );
}
export function rail(c, command, note = '') {
  rect(c, 51, 600, 1178, 44, '#102323', 6);
  rect(c, 51, 600, 5, 44, C.teal);
  mono(c, command, 73, 631, 26, C.ivory, note ? 760 : 1120);
  if (note) txt(c, note, 1205, 631, 24, C.amber, { align: 'right', width: 342 });
}
export function commandRail(c, command, note = '') {
  rect(c, 51, 115, 1178, 28, '#102323', 6);
  rect(c, 51, 115, 5, 28, C.teal);
  mono(c, command, 73, 136, 26, C.ivory, note ? 760 : 1120);
  if (note) txt(c, note, 1205, 136, 24, C.amber, { align: 'right', width: 342 });
}
export function plate(c, x, y, w, h, shade = C.metal) {
  rect(c, x + 4, y + 7, w, h, '#0b191980', 11);
  rect(c, x, y, w, h, shade, 11);
  stroke(
    c,
    [
      [x + 10, y + 2],
      [x + w - 10, y + 2],
    ],
    '#fff8dc80',
  );
  for (const xx of [x + 12, x + w - 12]) for (const yy of [y + 12, y + h - 12]) bolt(c, xx, yy);
}
export function printout(c, x, y, w, h, title, lines, opts = {}) {
  const paper = opts.paper || C.paper;
  rect(c, x + 4, y + 6, w, h, '#09181470');
  rect(c, x, y, w, h, paper);
  for (let yy = y + 12; yy < y + h - 10; yy += 25) {
    dot(c, x + 8, yy, 2.4, '#627869');
    dot(c, x + w - 8, yy, 2.4, '#627869');
  }
  txt(c, title, x + 25, y + 44, 31, C.ink, { family: 'Serif', width: w - 50 });
  stroke(
    c,
    [
      [x + 25, y + 58],
      [x + w - 25, y + 58],
    ],
    '#819286',
    1.3,
  );
  lines.forEach((v, i) => {
    if (!v) return;
    const [s, color] = Array.isArray(v) ? v : [v, C.ink];
    mono(c, s, x + 25, y + 92 + i * (opts.step || 37), opts.size || 22, color, w - 50);
  });
}
export function terminal(c, x, y, w, h, title, lines, opts = {}) {
  const rim = opts.rim || '#96a797';
  rect(c, x + w * 0.32, y + h - 2, w * 0.36, 18, '#52685e', 3);
  rect(c, x + w * 0.22, y + h + 11, w * 0.56, 8, '#96a797', 3);
  plate(c, x, y, w, h, rim);
  rect(c, x + 13, y + 13, w - 26, h - 26, '#203632', 8);
  rect(c, x + 21, y + 20, w - 42, h - 45, '#0c2425', 10);
  for (let yy = y + 24; yy < y + h - 29; yy += 5) rect(c, x + 26, yy, w - 52, 1, '#ffffff04');
  txt(c, title, x + 35, y + 57, 27, C.teal, { width: w - 70 });
  stroke(
    c,
    [
      [x + 34, y + 72],
      [x + w - 34, y + 72],
    ],
    '#365650',
  );
  lines.forEach((item, i) => {
    if (item == null) return;
    const [s, col] = Array.isArray(item) ? item : [item, C.ivory];
    mono(c, s, x + 35, y + 113 + i * (opts.step || 42), opts.size || 25, col, w - 70);
  });
}
export function disk(c, x, y, w, title, lines, accent = '#89bfae', focus = -1) {
  const h = w * 0.83;
  poly(
    c,
    [
      [x + 3, y + 6],
      [x + w - 18, y + 6],
      [x + w + 4, y + 29],
      [x + w + 4, y + h + 6],
      [x + 3, y + h + 6],
    ],
    '#09171577',
  );
  poly(
    c,
    [
      [x, y],
      [x + w - 21, y],
      [x + w, y + 23],
      [x + w, y + h],
      [x, y + h],
    ],
    accent,
  );
  const shutter = c.createLinearGradient(x + w * 0.24, y, x + w * 0.79, y + h * 0.23);
  shutter.addColorStop(0, '#677670');
  shutter.addColorStop(0.43, '#adbaad');
  shutter.addColorStop(0.63, '#e0deca');
  shutter.addColorStop(1, '#71827b');
  rect(c, x + w * 0.24, y, w * 0.55, h * 0.23, shutter, 2);
  rect(c, x + w * 0.58, y + 4, w * 0.13, h * 0.16, C.dark);
  rect(c, x + 15, y + h * 0.27, w - 30, h * 0.62, C.paper, 3);
  txt(c, title, x + 28, y + h * 0.27 + 32, 28, C.ink, { family: 'Serif', width: w - 56 });
  stroke(
    c,
    [
      [x + 28, y + h * 0.27 + 43],
      [x + w - 28, y + h * 0.27 + 43],
    ],
    '#819286',
    1.2,
  );
  const step = Math.min(34, (h * 0.32) / Math.max(1, lines.length - 1));
  lines.forEach((v, i) => {
    const baseline = y + h * 0.27 + 70 + i * step;
    if (i === focus) {
      rect(c, x + 18, baseline - 23, w - 36, 29, '#e4c79c');
      rect(c, x + 18, baseline - 23, 4, 29, '#85592d');
    }
    mono(c, v, x + 28, baseline, 23, C.ink, w - 56);
  });
  rect(c, x + 12, y + h - 19, 10, 10, '#273e39');
  rect(c, x + w - 25, y + h - 19, 10, 10, '#273e39');
}
export function folder(c, x, y, w, h, name, active = false) {
  poly(
    c,
    [
      [x, y + 14],
      [x + 12, y],
      [x + w * 0.42, y],
      [x + w * 0.51, y + 13],
      [x + w - 6, y + 13],
      [x + w, y + 22],
      [x + w, y + h],
      [x, y + h],
    ],
    active ? '#efd398' : '#829b90',
  );
  rect(c, x + 3, y + 24, w - 6, h - 26, active ? '#f3deb1' : '#b7c8b5', 4);
  mono(c, name, x + 16, y + h * 0.68, 27, C.ink, w - 32);
}
export function wire(c, x1, y1, x2, y2, t = 0, color = C.teal) {
  const bend = (x1 + x2) / 2;
  c.save();
  c.beginPath();
  c.moveTo(x1, y1);
  c.bezierCurveTo(bend, y1, bend, y2, x2, y2);
  c.strokeStyle = '#102321';
  c.lineWidth = 12;
  c.stroke();
  c.strokeStyle = color;
  c.lineWidth = 5;
  c.stroke();
  c.restore();
  if (t > 0 && t < 1) {
    const u = 1 - t;
    dot(
      c,
      u ** 3 * x1 + 3 * u * u * t * bend + 3 * u * t * t * bend + t ** 3 * x2,
      u * u * (1 + 2 * t) * y1 + t * t * (3 - 2 * t) * y2,
      8,
      C.ivory,
    );
  }
}
export function stamp(c, x, y, s, good, width = 300) {
  const col = good ? C.green : C.red;
  rect(c, x, y, width, 49, '#102825', 4);
  rect(c, x, y, 7, 49, col);
  txt(c, s, x + 18, y + 34, 27, col, { weight: 600, width: width - 34 });
}
export function fade(c, t, fn) {
  if (t <= 0) return;
  c.save();
  c.globalAlpha *= t;
  fn();
  c.restore();
}
