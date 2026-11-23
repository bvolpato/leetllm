// The print colors distinguish source text, selected evidence, and a failed fit.
export const ink = '#182e3c',
  muted = '#51676c',
  teal = '#006c63',
  sea = '#bcdfcd',
  blue = '#315b88',
  pale = '#c7dae3',
  rust = '#a83f2c',
  blush = '#f6c6ac',
  gold = '#efb451',
  paper = '#fff8e4',
  grey = '#d6d2bd',
  night = '#172e3a',
  white = '#fff9e6';
export function rect(c, x, y, w, h, color, r = 0) {
  c.fillStyle = color;
  c.beginPath();
  if (r) c.roundRect(x, y, w, h, r);
  else c.rect(x, y, w, h);
  c.fill();
}
export function line(c, x, y, u, v, color, width = 3) {
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(u, v);
  c.strokeStyle = color;
  c.lineWidth = width;
  c.stroke();
}
export function disc(c, x, y, r, color) {
  c.fillStyle = color;
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fill();
}
export function poly(c, pts, color) {
  c.beginPath();
  pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  c.fillStyle = color;
  c.fill();
}
export function text(
  c,
  str,
  x,
  y,
  size = 40,
  color = ink,
  family = 'Sans',
  align = 'left',
  max = 0,
  weight = 500,
) {
  c.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  c.textAlign = align;
  c.textBaseline = 'alphabetic';
  c.fillStyle = color;
  if (max && c.measureText(String(str)).width > max)
    c.font =
      weight +
      ' ' +
      Math.floor((size * max) / c.measureText(String(str)).width) +
      'px "Lesson ' +
      family +
      '"';
  c.fillText(String(str), x, y);
}
export const serif = (c, str, x, y, size = 54, color = ink, max = 0) =>
  text(c, str, x, y, size, color, 'Serif', 'left', max);
export const mono = (c, str, x, y, size = 26, color = muted, max = 0) =>
  text(c, str, x, y, size, color, 'Mono', 'left', max);
export function gradient(c, y, h, first, last) {
  const g = c.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, first);
  g.addColorStop(1, last);
  return g;
}
export function desk(c, dark = false) {
  rect(
    c,
    0,
    0,
    1920,
    1080,
    gradient(c, 0, 1080, dark ? '#19343e' : '#f0e8cf', dark ? '#101f30' : '#d4c5a2'),
  );
}
export function slip(c, x, y, w, h, fill = paper) {
  rect(c, x + 9, y + 12, w, h, '#132c3827', 3);
  rect(c, x, y, w, h, fill, 3);
  line(c, x + 2, y + 1, x + w - 3, y + 1, '#ffffffab', 2);
}
export function heading(c, kicker, title, dark = false) {
  mono(c, kicker.toUpperCase(), 105, 107, 27, dark ? '#b8d5cf' : teal);
  serif(c, title, 100, 205, 76, dark ? white : ink, 1700);
}
export function stamp(c, x, y, label, success = true, max = 500) {
  const color = success ? teal : rust;
  c.save();
  c.translate(x, y);
  c.rotate(-0.026);
  c.font = '600 39px "Lesson Sans"';
  const width = Math.min(max, c.measureText(label).width + 52);
  c.strokeStyle = color;
  c.lineWidth = 4;
  c.strokeRect(0, -51, width, 65);
  text(c, label, 22, -4, 39, color, 'Sans', 'left', width - 42, 600);
  c.restore();
}
export function gauge(c, x, y, step, limit, used) {
  for (let i = 0; i < limit; i++) {
    const left = x + i * step;
    rect(c, left, y, step - 9, 49, i < used ? teal : muted, 4);
    if (i >= used) rect(c, left + 6, y + 6, step - 21, 37, paper, 2);
  }
  const stop = x + limit * step;
  line(c, stop, y - 10, stop, y + 59, ink, 8);
}
export function bracket(c, x1, x2, y, color, label, above = false) {
  const dir = above ? -1 : 1;
  line(c, x1, y, x2, y, color, 4);
  line(c, x1, y, x1, y - dir * 16, color, 4);
  line(c, x2, y, x2, y - dir * 16, color, 4);
  if (label)
    text(
      c,
      label,
      (x1 + x2) / 2,
      y + (above ? -18 : 43),
      30,
      color,
      'Sans',
      'center',
      Math.max(195, x2 - x1 + 30),
    );
}
export function arrow(c, x, y, ex, ey, col, width = 6) {
  const a = Math.atan2(ey - y, ex - x),
    h = width * 2.7;
  line(c, x, y, ex - h * 0.5 * Math.cos(a), ey - h * 0.5 * Math.sin(a), col, width);
  poly(
    c,
    [
      [ex, ey],
      [
        ex - h * Math.cos(a) + h * 0.55 * Math.sin(a),
        ey - h * Math.sin(a) - h * 0.55 * Math.cos(a),
      ],
      [
        ex - h * Math.cos(a) - h * 0.55 * Math.sin(a),
        ey - h * Math.sin(a) + h * 0.55 * Math.cos(a),
      ],
    ],
    col,
  );
}
export function wordCells(
  c,
  words,
  x,
  y,
  w,
  {
    start = 0,
    end = words.length,
    fill = sea,
    base = paper,
    color = ink,
    indices = false,
    height = 74,
    size = 35,
  } = {},
) {
  const step = w / words.length;
  words.forEach((v, i) => {
    rect(c, x + i * step, y, step - 3, height, i >= start && i < end ? fill : base, 2);
    text(
      c,
      v,
      x + (i + 0.5) * step - 1,
      y + height * 0.66,
      size,
      color,
      'Serif',
      'center',
      step - 9,
    );
    if (indices) text(c, i + 1, x + (i + 0.5) * step, y + height + 32, 22, muted, 'Mono', 'center');
  });
}
export function progress(clock, beat, phrase, duration = 0.8) {
  if (clock.beat.beatIndex !== beat) return Number(clock.beat.beatIndex > beat);
  return clock.reveal(phrase, duration);
}
export function after(clock, beat, phrase) {
  return progress(clock, beat, phrase, 0) === 1;
}
