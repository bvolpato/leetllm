// Coordinates use a 960 by 540 drawing surface. The host paints it at twice this size.
export const cream = '#f3efdf',
  ink = '#182c31',
  dim = '#52666a',
  faint = '#c3c5b7';
export const blue = '#185a99',
  red = '#b13c27',
  green = '#136855',
  brass = '#925b15';
export const night = '#132e34',
  glow = '#a9e5d1',
  amber = '#ffc577',
  pale = '#c1d8d4';
export const clip = (n) => Math.max(0, Math.min(1, n));
export const mix = (a, b, p) => a + (b - a) * p;
export function box(g, x, y, w, h, fill, stroke, weight = 1) {
  if (fill) {
    g.fillStyle = fill;
    g.fillRect(x, y, w, h);
  }
  if (stroke) {
    g.lineWidth = weight;
    g.strokeStyle = stroke;
    g.strokeRect(x, y, w, h);
  }
}
export function path(g, points, color, width = 2, fill = false) {
  g.beginPath();
  points.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  if (fill) {
    g.closePath();
    g.fillStyle = color;
    g.fill();
  } else {
    g.lineJoin = 'round';
    g.lineCap = 'round';
    g.strokeStyle = color;
    g.lineWidth = width;
    g.stroke();
  }
}
export const line = (g, x, y, X, Y, c, w = 2) =>
  path(
    g,
    [
      [x, y],
      [X, Y],
    ],
    c,
    w,
  );
export function disk(g, x, y, r, fill, stroke, width = 2) {
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  if (fill) {
    g.fillStyle = fill;
    g.fill();
  }
  if (stroke) {
    g.lineWidth = width;
    g.strokeStyle = stroke;
    g.stroke();
  }
}
export function t(
  g,
  s,
  x,
  y,
  size = 21,
  color = ink,
  face = 'sans',
  align = 'left',
  max = Infinity,
) {
  const family =
    face === 'mono' ? 'Lesson Mono' : face === 'serif' ? 'Lesson Serif' : 'Lesson Sans';
  g.font = (face === 'bold' ? '700' : '400') + ' ' + size + 'px "' + family + '"';
  g.fillStyle = color;
  g.textBaseline = 'alphabetic';
  g.textAlign = align;
  const scale = Math.min(1, max / Math.max(1, g.measureText(String(s)).width));
  g.save();
  g.translate(x, y);
  g.scale(scale, 1);
  g.fillText(String(s), 0, 0);
  g.restore();
}
export function field(g, label, value, x, y, width, color = ink, sz = 28) {
  t(g, label, x, y, 15, dim, 'mono', 'left', width);
  t(g, value, x, y + Math.max(39, sz + 6), sz, color, 'bold', 'left', width);
}
export function heading(g, section, title, dark = false) {
  const bg = dark ? night : cream,
    fg = dark ? cream : ink,
    accent = dark ? amber : red;
  box(g, 0, 0, 960, 540, bg);
  line(g, 40, 37, 62, 37, accent, 5);
  t(g, section, 73, 42, 14, dark ? pale : dim, 'mono');
  t(g, title, 38, 100, 44, fg, 'serif', 'left', 885);
}
export function label(g, s, x, y, c = ink, width = 820) {
  t(g, s, x, y, 23, c, 'bold', 'left', width);
}
export function tickAxis(g, left, right, y, max, step, color = dim, unit = ' s') {
  line(g, left, y, right, y, color, 1.3);
  for (let n = 0; n <= max + 1e-6; n += step) {
    const x = mix(left, right, n / max);
    line(g, x, y, x, y + 7, color, 1.5);
    t(g, n + (n === max ? unit : ''), x, y + 26, 15, color, 'mono', 'center');
  }
}
export function moving(g, points, p, c, name, r = 14) {
  const lengths = points
    .slice(1)
    .map(([x, y], i) => Math.hypot(x - points[i][0], y - points[i][1]));
  let distance = clip(p) * lengths.reduce((a, b) => a + b, 0);
  for (let i = 0; i < lengths.length; i++) {
    if (distance <= lengths[i] || i === lengths.length - 1) {
      const u = clip(distance / lengths[i]),
        [x, y] = points[i],
        [X, Y] = points[i + 1];
      disk(g, mix(x, X, u), mix(y, Y, u), r, c);
      if (name) t(g, name, mix(x, X, u), mix(y, Y, u) + 6, 17, cream, 'bold', 'center');
      return;
    }
    distance -= lengths[i];
  }
}
export function arrow(g, x, y, X, Y, color, w = 2) {
  const a = Math.atan2(Y - y, X - x);
  line(g, x, y, X, Y, color, w);
  path(
    g,
    [
      [X, Y],
      [X - 12 * Math.cos(a - 0.45), Y - 12 * Math.sin(a - 0.45)],
      [X - 12 * Math.cos(a + 0.45), Y - 12 * Math.sin(a + 0.45)],
    ],
    color,
    1,
    true,
  );
}
export function tag(g, s, x, y, w, h, color = blue) {
  const pts = [
    [x + 9, y],
    [x + w, y],
    [x + w, y + h],
    [x + 9, y + h],
    [x, y + h / 2],
  ];
  path(g, pts, color, 1, true);
  disk(g, x + 10, y + h / 2, 2.5, cream);
  t(g, s, x + (w + 7) / 2, y + h / 2 + 7, 19, cream, 'mono', 'center', w - 24);
}
export function paper(g, x, y, w, h, color = '#fffbee') {
  box(g, x + 4, y + 5, w, h, '#00000019');
  box(g, x, y, w, h, color, faint);
  for (let i = x + 12; i < x + w - 8; i += 17) disk(g, i, y + 9, 2.2, '#cac7b6');
}
// Each cue is evaluated only in the beat that contains its spoken words.
export function timing(clock) {
  const b = clock.beat.beatIndex;
  return {
    b,
    q: (beat, words, seconds = 0.7) =>
      b === beat ? clock.reveal(words, seconds) : Number(b > beat),
  };
}
