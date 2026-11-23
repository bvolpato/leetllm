export const ink = '#152f3c',
  muted = '#52676c',
  paper = '#f4ecd8',
  white = '#fffaf0';
export const teal = '#126e66',
  blue = '#385e91',
  red = '#a64838',
  gold = '#dbac48',
  pale = '#d7dbca';
export const hues = [teal, blue, red];
export const clamp = (v) => Math.max(0, Math.min(1, v));
export const mix = (a, b, t) => a + (b - a) * clamp(t);
export const fixed = (x, n = 2) =>
  (Math.abs(x) < 0.5 * 10 ** -n ? 0 : x).toFixed(n).replace('-', '−');
export const signed = (x, n = 2) => (x > 0 ? '+' : '') + fixed(x, n);
export function cue(k, beat, words, seconds = 0) {
  if (k.beat.beatIndex !== beat) return Number(k.beat.beatIndex > beat);
  return k.reveal(words, seconds);
}
export function box(c, x, y, w, h, fill, r = 0) {
  c.fillStyle = fill;
  if (!r) {
    c.fillRect(x, y, w, h);
    return;
  }
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  c.fill();
}
export function dot(c, x, y, r, color) {
  c.fillStyle = color;
  c.beginPath();
  c.arc(x, y, r, 0, 2 * Math.PI);
  c.fill();
}
export function path(c, points, color, width = 2, fill = false) {
  c.beginPath();
  points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  if (fill) {
    c.fillStyle = color;
    c.closePath();
    c.fill();
  } else {
    c.strokeStyle = color;
    c.lineWidth = width;
    c.lineJoin = 'round';
    c.lineCap = 'round';
    c.stroke();
  }
}
export function line(c, x, y, X, Y, color = muted, w = 2) {
  path(
    c,
    [
      [x, y],
      [X, Y],
    ],
    color,
    w,
  );
}
export function arrow(c, x, y, X, Y, color = ink, w = 3) {
  const a = Math.atan2(Y - y, X - x),
    t = 9 + w;
  line(c, x, y, X, Y, color, w);
  path(
    c,
    [
      [X - t * Math.cos(a - 0.48), Y - t * Math.sin(a - 0.48)],
      [X, Y],
      [X - t * Math.cos(a + 0.48), Y - t * Math.sin(a + 0.48)],
    ],
    color,
    w,
  );
}
export function txt(c, s, x, y, size = 20, col = ink, align = 'left', font = 'Sans', weight = 500) {
  c.font = weight + ' ' + size + 'px "Lesson ' + font + '"';
  c.fillStyle = col;
  c.textAlign = align;
  c.textBaseline = 'alphabetic';
  c.fillText(String(s), x, y);
}
export const head = (c, s, sub) => {
  txt(c, s, 46, 64, 37, ink, 'left', 'Serif', 600);
  if (sub) txt(c, sub, 48, 99, 18, muted);
};
export const cap = (c, s, x, y, color = muted) => txt(c, s, x, y, 15, color, 'left', 'Mono', 600);
export function band(c, x, y, w, h, parts, colors = hues) {
  let left = x;
  parts.forEach((p, i) => {
    box(c, left, y, w * p, h, colors[i]);
    left += w * p;
  });
}
export function rule(c, x1, x2, y, min, max, ticks, fmt = (v) => String(v)) {
  const px = (v) => mix(x1, x2, (v - min) / (max - min));
  line(c, x1, y, x2, y, muted, 2);
  for (const t of ticks) {
    line(c, px(t), y - 6, px(t), y + 7, muted);
    txt(c, fmt(t), px(t), y + 29, 16, muted, 'center');
  }
  return px;
}
export function slip(c, x, y, w, h, letter, lines, color, stamp = '') {
  box(c, x + 3, y + 6, w, h, '#d4cbb8', 4);
  box(c, x, y, w, h, white, 4);
  box(c, x, y, 8, h, color);
  txt(c, letter, x + 20, y + 36, 23, color, 'left', 'Mono', 700);
  lines.forEach((s, i) => txt(c, s, x + 20, y + 69 + 26 * i, 20));
  if (stamp) {
    box(c, x + 17, y + h - 34, w - 34, 26, color);
    txt(c, stamp, x + w / 2, y + h - 14, 16, white, 'center', 'Sans', 700);
  }
}
export function trace(c, points, f, color, w = 6) {
  const lengths = points
    .slice(1)
    .map(([x, y], i) => Math.hypot(x - points[i][0], y - points[i][1]));
  let left = lengths.reduce((a, b) => a + b, 0) * clamp(f),
    end = points[0];
  const drawn = [end];
  for (const [i, len] of lengths.entries()) {
    const q = Math.min(1, left / len);
    end = [mix(points[i][0], points[i + 1][0], q), mix(points[i][1], points[i + 1][1], q)];
    drawn.push(end);
    left -= len;
    if (left <= 0) break;
  }
  path(c, drawn, color, w);
  return end;
}
export function base(c) {
  c.scale(2, 2);
  box(c, 0, 0, 960, 540, paper);
}
export function plot(
  c,
  { x = 95, y = 145, w = 560, h = 245, xmin, xmax, ymin, ymax, xticks, yticks, fn, color = teal },
) {
  const X = (v) => x + (w * (v - xmin)) / (xmax - xmin),
    Y = (v) => y + h - (h * (v - ymin)) / (ymax - ymin);
  for (const v of yticks) {
    line(c, x, Y(v), x + w, Y(v), '#c7c8b8', 1);
    txt(c, String(v), x - 12, Y(v) + 6, 16, muted, 'right');
  }
  rule(c, x, x + w, y + h, xmin, xmax, xticks);
  const pts = Array.from({ length: 161 }, (_, i) => {
    const v = mix(xmin, xmax, i / 160);
    return [X(v), Y(fn(v))];
  });
  path(c, pts, color, 4);
  return { X, Y };
}
export function marker(c, x, y, color = teal) {
  dot(c, x, y, 10, white);
  dot(c, x, y, 7, color);
}
export function readout(c, label, value, x, y, color = ink, size = 37) {
  cap(c, label, x, y);
  txt(c, value, x, y + 48, size, color, 'left', 'Mono', 600);
}
export function tag(c, label, x, y, w, color = teal) {
  box(c, x, y, w, 34, color, 3);
  txt(c, label, x + w / 2, y + 23, 17, white, 'center', 'Sans', 600);
}
export function stackText(c, lines, x, y, step = 31, size = 21, col = ink) {
  lines.forEach((s, i) => txt(c, s, x, y + i * step, size, col));
}
