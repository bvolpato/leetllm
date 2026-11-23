export const P = {
  sea: '#102935',
  deep: '#091c27',
  metal: '#31505b',
  seam: '#526b71',
  paper: '#f7edd4',
  cream: '#fff6df',
  dim: '#b8cacf',
  ink: '#152f3b',
  blue: '#81c4e3',
  teal: '#17708a',
  pink: '#ff9198',
  red: '#a92f48',
  gold: '#f8cf73',
  brass: '#9a742e',
  good: '#94ddca',
  green: '#17665c',
  grid: '#d8d4c3',
  plum: '#322435',
  violet: '#504052',
};
export const clamp = (t) => Math.max(0, Math.min(1, t));
export const lerp = (a, b, t) => a + (b - a) * t;
export const beat = (k) => k.beat.beatIndex + 1;
export function cue(k, n, phrase, seconds = 0.7) {
  const b = beat(k);
  return b === n ? k.reveal(phrase, seconds) : Number(b > n);
}
export const end = (k, n) => beat(k) > n || (beat(k) === n && k.elapsed >= k.speechDuration);
export function rect(c, x, y, w, h, fill, r = 0) {
  c.fillStyle = fill;
  if (!r) {
    c.fillRect(x, y, w, h);
    return;
  }
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  c.fill();
}
export function line(c, x, y, u, v, color, w = 3) {
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(u, v);
  c.strokeStyle = color;
  c.lineWidth = w;
  c.stroke();
}
export function dot(c, x, y, r, color) {
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fillStyle = color;
  c.fill();
}
export function polygon(c, points, color) {
  c.beginPath();
  points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  c.fillStyle = color;
  c.fill();
}
export function label(
  c,
  value,
  x,
  y,
  size = 40,
  color = P.cream,
  align = 'left',
  face = 'Sans',
  weight = 500,
) {
  c.font = weight + ' ' + size + 'px "Lesson ' + face + '"';
  c.textAlign = align;
  c.textBaseline = 'middle';
  c.fillStyle = color;
  c.fillText(String(value), x, y);
}
export function heading(c, title, sub = '', light = false) {
  label(c, title, 96, 91, 65, light ? P.ink : P.cream, 'left', 'Serif', 500);
  if (sub) label(c, sub, 100, 169, 33, light ? P.teal : P.dim);
}
export function background(c, mode = 'sea') {
  const paper = mode === 'paper';
  const gr = c.createLinearGradient(0, 0, 1920, 1080);
  gr.addColorStop(0, paper ? '#fff5df' : mode === 'plum' ? '#423041' : '#183b49');
  gr.addColorStop(1, paper ? '#e8e2ce' : mode === 'plum' ? '#271e2b' : P.deep);
  rect(c, 0, 0, 1920, 1080, gr);
  if (paper) {
    for (let x = 80; x < 1900; x += 60) line(c, x, 226, x, 928, '#ddd7c5', 1);
    for (let y = 226; y <= 928; y += 60) line(c, 75, y, 1845, y, '#ddd7c5', 1);
  }
}
export function screw(c, x, y, r = 7) {
  dot(c, x, y + 2, r + 1, P.deep);
  dot(c, x, y, r, P.seam);
  line(c, x - r * 0.58, y + r * 0.3, x + r * 0.58, y - r * 0.3, P.ink, 2);
}
export function plate(c, x, y, w, h, fill = P.metal) {
  rect(c, x + 3, y + 9, w, h, '#081923', 18);
  rect(c, x, y, w, h, fill, 18);
  for (const xx of [x + 18, x + w - 18]) for (const yy of [y + 18, y + h - 18]) screw(c, xx, yy);
}
export function mark(c, x, y, miss, size = 12, light = false) {
  if (miss) {
    const color = light ? P.red : P.pink;
    line(
      c,
      x - size * 0.72,
      y - size * 0.72,
      x + size * 0.72,
      y + size * 0.72,
      color,
      Math.max(3, size * 0.38),
    );
    line(
      c,
      x + size * 0.72,
      y - size * 0.72,
      x - size * 0.72,
      y + size * 0.72,
      color,
      Math.max(3, size * 0.38),
    );
  } else dot(c, x, y, size * 0.5, light ? P.teal : P.blue);
}
export function ticket(c, x, y, w, h, title, sub = '', serial = '') {
  c.save();
  rect(c, x + 4, y + 6, w, h, '#13212a55', 8);
  rect(c, x, y, w, h, P.paper, 8);
  const stub = w * 0.14;
  for (let yy = y + 8; yy < y + h - 7; yy += 17)
    line(c, x + stub, yy, x + stub, yy + 7, '#b3ac94', 2);
  if (serial) {
    c.save();
    c.translate(x + stub / 2, y + h / 2);
    c.rotate(-Math.PI / 2);
    label(c, serial, 0, 0, Math.min(26, w * 0.09), P.teal, 'center', 'Mono');
    c.restore();
  }
  label(
    c,
    title,
    x + stub + (w - stub) / 2,
    y + h * (sub ? 0.44 : 0.51),
    Math.min(48, w * 0.112),
    P.ink,
    'center',
    'Serif',
    600,
  );
  if (sub)
    label(
      c,
      sub,
      x + stub + (w - stub) / 2,
      y + h * 0.72,
      Math.min(31, w * 0.075),
      P.teal,
      'center',
    );
  c.restore();
}
export function axis(c, x1, x2, y, min, max, ticks, format = (t) => String(t), light = false) {
  const pos = (v) => lerp(x1, x2, (v - min) / (max - min));
  line(c, x1, y, x2, y, light ? P.ink : P.dim, 3);
  for (const t of ticks) {
    const x = pos(t);
    line(c, x, y - 4, x, y + 12, light ? P.ink : P.dim, 3);
    label(c, format(t), x, y + 42, 28, light ? P.ink : P.dim, 'center', 'Mono');
  }
  return pos;
}
export function pin(c, x, y, color, r = 12) {
  dot(c, x, y, r + 3, P.deep);
  dot(c, x, y, r, color);
  dot(c, x - 2, y - 3, r * 0.25, '#ffffffaa');
}
export const percent = (v, d = 0) => (v * 100).toFixed(d) + '%';
export const points = (v, d = 2) => (100 * v).toFixed(d) + ' pp';
export const sum = (xs) => xs.reduce((a, b) => a + b, 0);
