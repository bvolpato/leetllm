// All text positions use a middle baseline on the 1920 × 1080 lesson canvas.
export const ink = '#23373b',
  mute = '#516465',
  teal = '#086f72',
  rust = '#a54632';
export const gold = '#eab641',
  paper = '#fffaed',
  gray = '#a6ada2',
  plum = '#604481';
export const clamp = (u) => Math.max(0, Math.min(1, u));
export const ease = (u) => ((u = clamp(u)), u * u * (3 - 2 * u));
export const mix = (a, b, t) => a + (b - a) * t;
export const signed = (n, d = 0) => (n > 0 ? '+' : n < 0 ? '−' : '') + Math.abs(n).toFixed(d);
export function label(
  c,
  words,
  x,
  y,
  size = 40,
  color = ink,
  family = 'Sans',
  weight = 500,
  align = 'left',
  max = Infinity,
) {
  c.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  c.fillStyle = color;
  c.textAlign = align;
  c.textBaseline = 'middle';
  if (c.measureText(String(words)).width > max)
    c.font =
      weight +
      ' ' +
      Math.floor((size * max) / c.measureText(String(words)).width) +
      'px "Lesson ' +
      family +
      '"';
  c.fillText(String(words), x, y);
}
export function num(c, t, x, y, size = 46, col = ink, align = 'left', max = Infinity) {
  label(c, t, x, y, size, col, 'Mono', 500, align, max);
}
export function title(c, t, x = 110, y = 126, size = 78, max = 1670) {
  label(c, t, x, y, size, ink, 'Serif', 500, 'left', max);
}
export function mid(c, t, x, y, size = 42, col = ink, max = Infinity) {
  label(c, t, x, y, size, col, 'Sans', 500, 'center', max);
}
export function line(c, x1, y1, x2, y2, col = ink, w = 3) {
  c.beginPath();
  c.moveTo(x1, y1);
  c.lineTo(x2, y2);
  c.strokeStyle = col;
  c.lineWidth = w;
  c.stroke();
}
export function rect(c, x, y, w, h, fill, stroke = null, sw = 2) {
  if (fill) {
    c.fillStyle = fill;
    c.fillRect(x, y, w, h);
  }
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = sw;
    c.strokeRect(x, y, w, h);
  }
}
export function polygon(c, points, fill) {
  c.beginPath();
  points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  c.fillStyle = fill;
  c.fill();
}
export function oval(c, x, y, rx, ry, fill, angle = 0) {
  c.beginPath();
  c.ellipse(x, y, rx, ry, angle, 0, Math.PI * 2);
  c.fillStyle = fill;
  c.fill();
}
export function arrow(c, x, y, u, v, col = teal, w = 6) {
  const a = Math.atan2(v - y, u - x),
    head = w * 3.6;
  line(c, x, y, u - Math.cos(a) * head * 0.5, v - Math.sin(a) * head * 0.5, col, w);
  polygon(
    c,
    [
      [u, v],
      [u - head * Math.cos(a - 0.45), v - head * Math.sin(a - 0.45)],
      [u - head * Math.cos(a + 0.45), v - head * Math.sin(a + 0.45)],
    ],
    col,
  );
}
export function ground(c, kind = 'work') {
  const palette = {
    work: ['#f7edd9', '#e1d4bb'],
    desk: ['#e8e8d8', '#b1c0b4'],
    plot: ['#fbf5e4', '#ecdfc4'],
    blue: ['#e2eded', '#b2c7c6'],
  };
  const [a, b] = palette[kind];
  const grad = c.createLinearGradient(220, 0, 1700, 1050);
  grad.addColorStop(0, a);
  grad.addColorStop(1, b);
  rect(c, 0, 0, 1920, 1080, grad);
  if (kind === 'plot') {
    for (let i = 0; i < 1920; i += 55) line(c, i, 0, i, 1080, '#3656610a', 1);
    for (let i = 0; i < 1080; i += 55) line(c, 0, i, 1920, i, '#3656610a', 1);
  }
}
export function sheet(c, x, y, w, h, stock = paper) {
  rect(c, x + 12, y + 16, w, h, '#27353621');
  rect(c, x + 4, y + 6, w, h, '#d7cbb8', '#a99d87', 1);
  rect(c, x, y, w, h, stock, '#ada38e', 2);
}
export function rows(c, x, y, w, items, active = -1, spacing = 90) {
  items.forEach(([key, v], i) => {
    const yy = y + i * spacing;
    if (i === active) rect(c, x - 14, yy - spacing * 0.42, w + 28, spacing * 0.84, '#f6df9f');
    line(c, x, yy + spacing * 0.48, x + w, yy + spacing * 0.48, '#b3b4a6', 1.5);
    label(c, key, x, yy, 34, mute, 'Sans', 500, 'left', w * 0.4);
    label(c, v, x + w * 0.43, yy, 40, ink, 'Sans', 600, 'left', w * 0.56);
  });
}
export const beat = (k) => k.beat.beatIndex;
export function cue(k, b, phrase, seconds = 0) {
  return beat(k) > b ? 1 : beat(k) < b ? 0 : k.reveal(phrase, seconds);
}
export function tally(c, x, y, w, v, total, col) {
  const pitch = w / total;
  for (let i = 0; i < total; i++) rect(c, x + i * pitch, y, pitch - 3, 54, i < v ? col : '#e1dac8');
}
export function ruler(
  c,
  {
    x = 200,
    y,
    w = 1450,
    min,
    max,
    ticks,
    low,
    high,
    mean,
    band,
    guide,
    unit = 'percentage points',
  },
) {
  const at = (n) => x + ((n - min) * w) / (max - min);
  if (band) {
    rect(c, at(band[0]), y - 55, at(band[1]) - at(band[0]), 101, '#d5e4d7');
    for (const n of band) line(c, at(n), y - 59, at(n), y + 45, teal, 3);
  }
  if (guide !== undefined) {
    line(c, at(guide), y - 82, at(guide), y + 39, rust, 3);
  }
  line(c, x, y + 28, x + w, y + 28, ink, 3);
  for (const n of ticks) {
    line(c, at(n), y + 28, at(n), y + 46, ink, 3);
    num(c, signed(n), at(n), y + 71, 30, mute, 'center');
  }
  if (low !== undefined) {
    line(c, at(low), y, at(high), y, teal, 12);
    for (const n of new Set([low, high])) {
      line(c, at(n), y - 19, at(n), y + 16, teal, 5);
      num(c, signed(n, Number.isInteger(n) ? 0 : 1), at(n), y - 53, 38, teal, 'center');
    }
  }
  if (mean !== undefined) {
    oval(c, at(mean), y, 16, 16, ink);
    oval(c, at(mean), y, 12, 12, gold);
  }
  if (unit) label(c, unit, x + w, y + 113, 30, mute, 'Sans', 500, 'right');
}
