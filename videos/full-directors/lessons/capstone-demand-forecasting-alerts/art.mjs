export const P = {
  ink: '#193c3e',
  dim: '#526b68',
  paper: '#f8f2df',
  white: '#fffbed',
  edge: '#adbcab',
  teal: '#216d64',
  mint: '#cfdfc8',
  blue: '#225e87',
  sky: '#c7dfe6',
  gold: '#e6b65c',
  ochre: '#84551b',
  rust: '#a4432a',
  salmon: '#f0c2a3',
  night: '#143e40',
  light: '#dfeddb',
  pale: '#8faaa2',
};
export function box(g, x, y, w, h, fill, stroke, sw = 1) {
  if (fill) {
    g.fillStyle = fill;
    g.fillRect(x, y, w, h);
  }
  if (stroke) {
    g.strokeStyle = stroke;
    g.lineWidth = sw;
    g.strokeRect(x, y, w, h);
  }
}
export function path(g, points, fill, stroke, sw = 1) {
  g.beginPath();
  points.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  if (fill) {
    g.closePath();
    g.fillStyle = fill;
    g.fill();
  }
  if (stroke) {
    g.lineWidth = sw;
    g.strokeStyle = stroke;
    g.stroke();
  }
}
export const line = (g, x, y, X, Y, color = P.edge, sw = 1) =>
  path(
    g,
    [
      [x, y],
      [X, Y],
    ],
    null,
    color,
    sw,
  );
export function dot(g, x, y, r, color) {
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fillStyle = color;
  g.fill();
}
export function text(
  g,
  value,
  x,
  y,
  size = 19,
  color = P.ink,
  family = 'Sans',
  weight = 500,
  align = 'left',
) {
  g.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  g.textAlign = align;
  g.textBaseline = 'alphabetic';
  g.fillStyle = color;
  g.fillText(String(value), x, y);
}
export const num = (g, v, x, y, size = 28, col = P.ink, align = 'left') =>
  text(g, v, x, y, size, col, 'Mono', 500, align);
export const label = (g, v, x, y, col = P.dim, size = 13, align = 'left') =>
  text(g, v, x, y, size, col, 'Sans', 700, align);
export const title = (g, v, x = 48, y = 95, size = 39, col = P.ink) =>
  text(g, v, x, y, size, col, 'Serif', 500);
export function sheet(g, x, y, w, h, fill = P.white) {
  box(g, x + 4, y + 5, w, h, '#28474325');
  box(g, x, y, w, h, fill, P.edge);
}
export function paper(g, night = false) {
  box(g, 0, 0, 960, 540, night ? P.night : P.paper);
  for (let i = 0; i < 220; i++) {
    const x = (i * 7919) % 960,
      y = (i * 6977) % 540;
    box(g, x, y, 1 + (i % 3), 0.65, night ? '#e4eed20d' : '#304d3621');
  }
}
export function head(g, small, big, night = false) {
  paper(g, night);
  label(g, small, 48, 41, night ? '#b7d4bb' : P.teal, 13);
  title(g, big, 46, 96, 38, night ? P.white : P.ink);
}
export function alpha(g, a, fn) {
  if (a <= 0) return;
  g.save();
  g.globalAlpha *= a;
  fn();
  g.restore();
}
export function stamp(g, str, x, y, color = P.rust, size = 21) {
  g.save();
  g.translate(x, y);
  g.rotate(-0.035);
  g.font = '700 ' + size + 'px "Lesson Sans"';
  const width = g.measureText(str).width;
  box(g, -9, -size - 3, width + 18, size + 13, null, color, 2);
  text(g, str, 0, 0, size, color, 'Sans', 700);
  g.restore();
}
export function arrow(g, x, y, X, Y, color = P.ink, w = 2) {
  line(g, x, y, X, Y, color, w);
  const a = Math.atan2(Y - y, X - x);
  path(
    g,
    [
      [X, Y],
      [X - 10 * Math.cos(a - 0.45), Y - 10 * Math.sin(a - 0.45)],
      [X - 10 * Math.cos(a + 0.45), Y - 10 * Math.sin(a + 0.45)],
    ],
    color,
  );
}
export function carton(g, x, y, w, h, tint = 0) {
  const base = ['#cd8e53', '#c69964', '#dcad78'][tint % 3];
  box(g, x, y, w, h, base, '#765d43', 0.9);
  const d = Math.min(6, w * 0.18);
  path(
    g,
    [
      [x, y],
      [x + d, y - d],
      [x + w + d, y - d],
      [x + w, y],
    ],
    '#f1cd96',
    '#866b49',
    0.7,
  );
  path(
    g,
    [
      [x + w, y],
      [x + w + d, y - d],
      [x + w + d, y + h - d],
      [x + w, y + h],
    ],
    '#ab7e55',
    '#866b49',
    0.7,
  );
  box(g, x + w * 0.41, y, w * 0.14, h, '#eac28f');
  box(g, x + w * 0.1, y + h * 0.35, w * 0.21, h * 0.23, '#fdf0cc');
}
export function clockFace(g, x, y, r, hour, col = P.ink, face = P.white) {
  dot(g, x, y, r + 2, col);
  dot(g, x, y, r, face);
  for (let i = 0; i < 12; i++) {
    const a = ((i - 3) * Math.PI) / 6;
    line(
      g,
      x + (r - 4) * Math.cos(a),
      y + (r - 4) * Math.sin(a),
      x + (r - 1) * Math.cos(a),
      y + (r - 1) * Math.sin(a),
      col,
      1.5,
    );
  }
  line(
    g,
    x,
    y,
    x + r * 0.57 * Math.sin((hour * Math.PI) / 6),
    y - r * 0.57 * Math.cos((hour * Math.PI) / 6),
    col,
    2.8,
  );
  line(g, x, y, x, y - r * 0.78, col, 1.6);
  dot(g, x, y, 2.5, col);
}
export function calendar(g, x, y, w, h, month, date, sub, accent = P.teal) {
  sheet(g, x, y, w, h);
  box(g, x, y, w, 30, accent);
  for (const pin of [0.2, 0.8]) {
    box(g, x + w * pin - 2, y - 5, 4, 12, P.ink);
    dot(g, x + w * pin, y + 9, 2, P.paper);
  }
  label(g, month, x + w / 2, y + 22, P.white, 14, 'center');
  text(g, date, x + w / 2, y + h * 0.66, Math.min(50, h * 0.37), P.ink, 'Serif', 600, 'center');
  label(g, sub, x + w / 2, y + h - 12, P.dim, 13, 'center');
}
export function scale(g, x1, x2, y, min, max, step, opts = {}) {
  const pos = (n) => x1 + ((n - min) * (x2 - x1)) / (max - min);
  const col = opts.dark ? P.pale : P.dim;
  line(g, x1, y, x2, y, col, 1.8);
  for (let n = min; n <= max + 0.0001; n += step) {
    const x = pos(n);
    line(g, x, y, x, y + 6, col);
    if (opts.labels !== false) num(g, n, x, y + 24, 12, col, 'center');
  }
  return pos;
}
export function lensBand(g, pos, y, forecast, h = 16) {
  box(g, pos(forecast - 6), y - h / 2, pos(forecast + 6) - pos(forecast - 6), h, P.sky);
}
export function tick(g, x, y, h, color) {
  line(g, x, y - h, x, y + h, color, 2);
  dot(g, x, y, 4, color);
}
// Cue numbers follow the printed one-based beat numbers in the narration.
export function cue(clock, beat, phrase, seconds = 0) {
  const now = clock.beat.beatIndex + 1;
  return now < beat ? 0 : now > beat ? 1 : clock.reveal(phrase, seconds);
}
export const beat = (clock) => clock.beat.beatIndex + 1;
export const f = (n, d = 2) => n.toFixed(d);
