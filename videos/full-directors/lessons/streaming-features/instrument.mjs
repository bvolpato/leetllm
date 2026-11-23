export const C = {
  bench: '#172c31',
  deep: '#102226',
  metal: '#344b4d',
  lip: '#70867d',
  paper: '#f4e9ce',
  cream: '#fff0c9',
  ink: '#203436',
  muted: '#a7beb3',
  green: '#8ee4ba',
  amber: '#ffbd70',
  red: '#ff9b84',
  blue: '#a5d9ea',
  teal: '#226854',
  rust: '#8c422c',
  grey: '#526763',
};
export function box(g, x, y, w, h, fill, r = 0, stroke = null) {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
  g.fillStyle = fill;
  g.fill();
  if (stroke) {
    g.lineWidth = 1.4;
    g.strokeStyle = stroke;
    g.stroke();
  }
}
export function line(g, x, y, u, v, color = C.lip, width = 2) {
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(u, v);
  g.strokeStyle = color;
  g.lineWidth = width;
  g.stroke();
}
export function path(g, points, col, width = 2, fill = false) {
  g.beginPath();
  points.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  if (fill) {
    g.closePath();
    g.fillStyle = col;
    g.fill();
  } else {
    g.strokeStyle = col;
    g.lineWidth = width;
    g.lineJoin = 'round';
    g.stroke();
  }
}
export function dot(g, x, y, r, col) {
  g.beginPath();
  g.arc(x, y, r, 0, 2 * Math.PI);
  g.fillStyle = col;
  g.fill();
}
export function type(
  g,
  s,
  x,
  y,
  size = 20,
  color = C.cream,
  align = 'left',
  face = 'Sans',
  weight = 400,
) {
  g.font = weight + ' ' + size + 'px "Lesson ' + face + '"';
  g.textAlign = align;
  g.textBaseline = 'middle';
  g.fillStyle = color;
  g.fillText(String(s), x, y);
}
export function mono(g, s, x, y, z = 18, c = C.cream, align = 'left') {
  type(g, s, x, y, z, c, align, 'Mono');
}
export function board(g, k, title, group, paper = false) {
  g.scale(2, 2);
  const bg = g.createLinearGradient(0, 0, 960, 540);
  bg.addColorStop(0, paper ? '#f7edd7' : '#243f43');
  bg.addColorStop(1, paper ? '#e5d8b8' : '#12282d');
  g.fillStyle = bg;
  g.fillRect(0, 0, 960, 540);
  const faint = paper ? '#bcb79f' : '#426064';
  for (let x = 30; x < 940; x += 20) line(g, x, 75, x, 75 + (x % 100 === 30 ? 7 : 3), faint, 1);
  type(g, title, 38, 39, 32, paper ? C.ink : C.cream, 'left', 'Serif');
  mono(g, group, 923, 41, 14, paper ? C.grey : C.muted, 'right');
}
export function screws(g, x, y, w, h) {
  for (const [u, v] of [
    [x + 10, y + 10],
    [x + w - 10, y + 10],
    [x + 10, y + h - 10],
    [x + w - 10, y + h - 10],
  ]) {
    dot(g, u, v, 3.5, C.lip);
    line(g, u - 1.6, v + 1.6, u + 1.6, v - 1.6, C.deep, 1);
  }
}
export function chassis(g, x, y, w, h) {
  box(g, x + 2, y + 5, w, h, '#0b1b1e', 12);
  box(g, x, y, w, h, C.metal, 12, C.lip);
  screws(g, x, y, w, h);
}
export function screen(g, x, y, w, h) {
  box(g, x, y, w, h, C.deep, 7, C.lip);
  g.save();
  g.beginPath();
  g.roundRect(x + 1, y + 1, w - 2, h - 2, 6);
  g.clip();
  for (let i = x + 19; i < x + w; i += 21) line(g, i, y + 1, i, y + h - 1, '#294244', 0.8);
  for (let i = y + 19; i < y + h; i += 21) line(g, x + 1, i, x + w - 1, i, '#294244', 0.8);
  g.restore();
}
// A stable trace shape is an identity mark. Its height has no numeric meaning.
const marks = [
  [
    [0, 0],
    [0.23, 0],
    [0.32, -0.32],
    [0.42, 1],
    [0.5, -0.66],
    [0.6, 0.22],
    [0.7, 0],
    [1, 0],
  ],
  [
    [0, 0],
    [0.18, 0],
    [0.26, 0.68],
    [0.35, -0.45],
    [0.45, 0],
    [0.54, 0.98],
    [0.63, -0.62],
    [0.73, 0],
    [1, 0],
  ],
  [
    [0, 0],
    [0.18, 0],
    [0.31, -0.68],
    [0.43, 0.35],
    [0.53, 1],
    [0.63, -0.22],
    [0.76, 0],
    [1, 0],
  ],
];
export function wave(g, id, x, y, w, h, col = C.green) {
  const kind = { A: 0, B: 1, C: 2, H1: 0, H2: 1, H3: 2, H7: 0, H8: 1 }[id] ?? 0;
  path(
    g,
    marks[kind].map(([u, v]) => [x + w * u, y - h * v]),
    col,
    3,
  );
}
export function ticket(g, x, y, w, h, a, b, color = C.ink) {
  box(g, x, y, w, h, C.paper, 4);
  for (let i = x + 7; i < x + w - 4; i += 13) dot(g, i, y + 6, 1.5, '#b5aa8c');
  mono(g, a, x + 14, y + h * 0.39, 15, C.grey);
  type(g, b, x + 14, y + h * 0.72, Math.min(26, h * 0.32), color, 'left', 'Mono');
}
export function rule(g, x, y, w, lo, hi, ticks, ink = C.muted) {
  const at = (t) => x + ((t - lo) / (hi - lo)) * w;
  line(g, x, y, x + w, y, ink, 1.8);
  for (const [t, label] of ticks) {
    line(g, at(t), y - 5, at(t), y + 7, ink, 1.5);
    if (label) mono(g, label, at(t), y + 24, 14, ink, 'center');
  }
  return at;
}
export function bracket(g, x, u, y, label, col, below = false) {
  line(g, x, y, u, y, col, 2);
  line(g, x, y - 6, x, y + 6, col, 2);
  line(g, u, y - 6, u, y + 6, col, 2);
  if (label) mono(g, label, (x + u) / 2, y + (below ? 20 : -17), 17, col, 'center');
}
export function clockFace(g, x, y, r, minute, label) {
  dot(g, x + 2, y + 4, r + 7, C.deep);
  dot(g, x, y, r + 6, C.lip);
  dot(g, x, y, r + 3, C.metal);
  dot(g, x, y, r, C.paper);
  for (let i = 0; i < 60; i++) {
    const a = (i * Math.PI) / 30 - Math.PI / 2,
      major = i % 5 === 0;
    const d = r - (major ? 11 : 5);
    line(
      g,
      x + Math.cos(a) * d,
      y + Math.sin(a) * d,
      x + Math.cos(a) * (r - 2),
      y + Math.sin(a) * (r - 2),
      C.grey,
      major ? 2.8 : 1,
    );
  }
  function hand(turn, len, w, col) {
    const a = turn * Math.PI * 2 - Math.PI / 2;
    line(g, x, y, x + len * Math.cos(a), y + len * Math.sin(a), col, w);
  }
  hand(minute / 720, r * 0.48, 5, C.ink);
  hand(minute / 60, r * 0.77, 3, C.rust);
  dot(g, x, y, 5, C.ink);
  if (label) mono(g, label, x, y + r + 25, 18, C.cream, 'center');
}
export function answer(g, label, value, x = 48, y = 390, w = 864) {
  line(g, x, y, x + w, y, C.lip, 1.3);
  mono(g, label, x, y + 35, 16, C.muted);
  type(g, value, x + w, y + 36, 29, C.cream, 'right', 'Mono');
}
export function progress(k, n, phrase, span = 0) {
  const b = k.beat.beatIndex + 1;
  if (b !== n) return b > n ? 1 : 0;
  if (phrase === '$end') return +(k.elapsed >= k.speechDuration);
  return phrase ? k.reveal(phrase, span) : 1;
}
export const after = (k, n, phrase) => progress(k, n, phrase) === 1;
export const hh = (minute) =>
  String(Math.floor(minute / 60)).padStart(2, '0') +
  ':' +
  String(Math.floor(minute % 60)).padStart(2, '0');
export function heading(g, s, x, y, paper = false) {
  mono(g, s, x, y, 15, paper ? C.grey : C.muted);
}
