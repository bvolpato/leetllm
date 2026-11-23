export const P = {
  paper: '#faf5e9',
  card: '#fffcf4',
  ink: '#193b3a',
  muted: '#546e66',
  grid: '#c7cfc0',
  teal: '#197a72',
  sea: '#bde2d3',
  gold: '#f2bb64',
  rust: '#a74730',
  pink: '#f2cfba',
  plum: '#664e82',
  lilac: '#e0d7eb',
  white: '#fffdf4',
};
export function rect(g, x, y, w, h, fill, stroke, r = 0) {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
  if (fill) {
    g.fillStyle = fill;
    g.fill();
  }
  if (stroke) {
    g.strokeStyle = stroke;
    g.lineWidth = 3;
    g.stroke();
  }
}
export function path(g, pts, color, width = 4, fill = false) {
  g.beginPath();
  pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  if (fill) {
    g.closePath();
    g.fillStyle = color;
    g.fill();
  } else {
    g.strokeStyle = color;
    g.lineWidth = width;
    g.lineJoin = 'round';
    g.stroke();
  }
}
export function text(
  g,
  str,
  x,
  y,
  size = 43,
  color = P.ink,
  family = 'Sans',
  align = 'left',
  max = 1720,
) {
  g.font = '400 ' + size + 'px "Lesson ' + family + '"';
  g.textAlign = align;
  g.textBaseline = 'middle';
  g.fillStyle = color;
  const w = g.measureText(String(str)).width;
  if (w > max) g.font = '400 ' + Math.floor((size * max) / w) + 'px "Lesson ' + family + '"';
  g.fillText(String(str), x, y);
}
export function label(g, str, x, y, align = 'left', color = P.muted) {
  text(g, str, x, y, 32, color, 'Sans', align);
}
export function number(g, str, x, y, size = 58, color = P.ink, align = 'left', max = 1700) {
  text(g, str, x, y, size, color, 'Mono', align, max);
}
export function dot(g, x, y, r, c) {
  g.fillStyle = c;
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fill();
}
export function arrow(g, x, y, xx, yy, c = P.teal) {
  const a = Math.atan2(yy - y, xx - x);
  path(
    g,
    [
      [x, y],
      [xx, yy],
    ],
    c,
    4,
  );
  path(
    g,
    [
      [xx - 17 * Math.cos(a - 0.45), yy - 17 * Math.sin(a - 0.45)],
      [xx, yy],
      [xx - 17 * Math.cos(a + 0.45), yy - 17 * Math.sin(a + 0.45)],
    ],
    c,
    4,
  );
}
export function header(g, section, title) {
  rect(g, 0, 0, 1920, 1080, P.paper);
  label(g, section, 92, 69, 'left', P.teal);
  text(g, title, 88, 169, 77, P.ink, 'Serif');
  path(
    g,
    [
      [88, 247],
      [1832, 247],
    ],
    P.grid,
    2,
  );
}
export function foot(g, str) {
  rect(g, 90, 894, 1740, 8, P.grid);
  text(g, str, 90, 955, 40, P.ink, 'Sans', 'left', 1735);
}
export function plate(g, x, y, w, h, title, fill = P.card) {
  rect(g, x, y, w, h, fill, P.grid, 15);
  label(g, title, x + 30, y + 46);
}
export const fmt = (n, d = 4) => String(Number(n.toFixed(d)));
export const smooth = (v) => v * v * (3 - 2 * v);
export const mix = (a, b, t) => a + (b - a) * t;
export function cue(k, beat, words, span = 0) {
  return k.beat.beatIndex === beat ? k.reveal(words, span) : Number(k.beat.beatIndex > beat);
}
export function strip(g, values, x, y, w, active = -1, labels = null) {
  const step = w / values.length;
  values.forEach((v, i) => {
    rect(g, x + i * step, y, step - 8, 85, i === active ? P.ink : P.card, P.grid, 8);
    number(
      g,
      v,
      x + (i + 0.5) * step - 4,
      y + 43,
      47,
      i === active ? P.white : P.ink,
      'center',
      step - 28,
    );
    if (labels) label(g, labels[i], x + (i + 0.5) * step - 4, y + 116, 'center');
  });
}
export function bar(g, x, y, width, height, value, max, color) {
  rect(g, x, y, width, height, '#e1e4d8', null, 3);
  if (value > 0) rect(g, x, y, (width * value) / max, height, color, null, 3);
}
