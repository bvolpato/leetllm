export const ink = '#192f39',
  muted = '#52656a',
  paper = '#f6f0df',
  edge = '#a9afa1';
export const cpu = '#97501e',
  gold = '#efbb74',
  gpu = '#146763',
  mint = '#9ed5be';
export const red = '#aa3741',
  rose = '#f4b4a1',
  pale = '#fffae9',
  violet = '#635281';
export const clamp = (x) => Math.max(0, Math.min(1, x));
export const mix = (a, b, p) => a + (b - a) * p;
export const print = (x, places = 0) => Number(x).toFixed(places).replace('-', '−');
export function cue(clock, beat, phrase, duration = 0.65, captionStart) {
  if (clock.beat.beatIndex < beat) return 0;
  if (clock.beat.beatIndex > beat) return 1;
  const p = clock.reveal(phrase, duration, { captionStart });
  return p * p * (3 - 2 * p);
}
export function box(c, x, y, w, h, fill, r = 6, stroke) {
  if (w <= 0 || h <= 0) return;
  c.beginPath();
  c.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2));
  c.fillStyle = fill;
  c.fill();
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = 2;
    c.stroke();
  }
}
export function line(c, x, y, xx, yy, color = ink, width = 2, dash = []) {
  c.save();
  c.beginPath();
  c.setLineDash(dash);
  c.moveTo(x, y);
  c.lineTo(xx, yy);
  c.strokeStyle = color;
  c.lineWidth = width;
  c.stroke();
  c.restore();
}
export function dot(c, x, y, r, color) {
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fillStyle = color;
  c.fill();
}
export function text(c, s, x, y, size = 25, color = ink, face = 'Sans', align = 'left', weight = 500) {
  c.font = weight + ' ' + size + 'px "Lesson ' + face + '"';
  c.fillStyle = color;
  c.textAlign = align;
  c.textBaseline = 'middle';
  c.fillText(String(s), x, y);
}
export function mono(c, s, x, y, size = 23, color = ink, align = 'left') {
  text(c, s, x, y, size, color, 'Mono', align);
}
export function serif(c, s, x, y, size = 37, color = ink, align = 'left') {
  text(c, s, x, y, size, color, 'Serif', align);
}
export function arrow(c, x, y, xx, yy, color = ink) {
  const a = Math.atan2(yy - y, xx - x);
  line(c, x, y, xx, yy, color, 4);
  for (const turn of [-0.55, 0.55])
    line(c, xx, yy, xx - 15 * Math.cos(a + turn), yy - 15 * Math.sin(a + turn), color, 4);
}
export function chip(c, x, y, w, h, label, color = gpu) {
  for (let i = 15; i < w - 8; i += 18) {
    line(c, x + i, y - 7, x + i, y + h + 7, edge, 5);
  }
  for (let i = 15; i < h - 8; i += 18) line(c, x - 7, y + i, x + w + 7, y + i, edge, 5);
  box(c, x, y, w, h, color, 9);
  box(c, x + 6, y + 6, w - 12, h - 12, color, 5, '#ffffff55');
  if (label) mono(c, label, x + w / 2, y + h / 2, 25, pale, 'center');
}
export function grid(c, x, y, cols, rows, w, h, color, highlight = () => null) {
  const dx = w / cols,
    dy = h / rows;
  for (let i = 0; i < rows; i++)
    for (let j = 0; j < cols; j++)
      box(c, x + j * dx, y + i * dy, dx - 2, dy - 2, highlight(i, j) || color, Math.min(3, dx / 8));
}
export function ticket(
  c,
  x,
  y,
  w,
  h,
  { name = 'Refund', tag = 'mps:0', color = mint, gridShape, emphasis } = {},
) {
  box(c, x + 2, y + 5, w, h, '#2c3b392a', 7);
  box(c, x, y, w, h, color, 7);
  for (const side of [x, x + w]) {
    for (let i = 1; i <= 4; i++) dot(c, side, y + (h * i) / 5, 3.2, paper);
  }
  if (name) serif(c, name, x + 17, y + 25, Math.min(29, h * 0.32), ink);
  if (tag) mono(c, tag, x + w - 14, y + 25, Math.min(19, w * 0.095), ink, 'right');
  if (gridShape) grid(c, x + 17, y + 46, gridShape[0], gridShape[1], w - 34, h - 58, emphasis || gpu);
}
export function board(c, title, sub, scope = false) {
  c.scale(1.6, 1.6);
  const grad = c.createLinearGradient(0, 0, 1200, 675);
  grad.addColorStop(0, '#172e34');
  grad.addColorStop(0.6, '#35514e');
  grad.addColorStop(1, '#193735');
  box(c, 0, 0, 1200, 675, grad, 0);
  // Leave room for two lines of captions beneath the teaching notes.
  const inset = 0.89;
  c.translate((1200 * (1 - inset)) / 2, 0);
  c.scale(inset, inset);
  box(c, 19, 18, 1162, 636, '#142c2c', 20);
  box(c, 19, 13, 1162, 634, scope ? '#19353b' : paper, 18, '#77938a');
  for (const [x, y] of [
    [36, 31],
    [1164, 31],
    [36, 628],
    [1164, 628],
  ]) {
    dot(c, x, y, 5, '#8b9b90');
    line(c, x - 2.6, y + 1.7, x + 2.6, y - 1.7, '#324a46', 1.4);
  }
  const a = scope ? pale : ink;
  text(c, sub, 61, 54, 18, scope ? mint : gpu, 'Mono');
  serif(c, title, 58, 103, 46, a);
  line(c, 60, 145, 1140, 145, scope ? '#627b79' : edge, 1.8);
}
export function note(c, s, color = ink, bg = '#e7e4d5') {
  box(c, 59, 555, 1082, 58, bg, 7);
  text(c, s, 600, 584, 25, color, 'Sans', 'center');
}
export function axis(c, x, y, w, max, step, color = muted, unit = '') {
  line(c, x, y, x + w, y, color, 2);
  for (let i = 0; i <= max; i += step) {
    const pos = x + (i * w) / max;
    line(c, pos, y, pos, y + 8, color, 2);
    mono(c, String(i) + (i === max ? unit : ''), pos, y + 25, 16, color, 'center');
  }
}
