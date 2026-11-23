export const col = {
  desk: '#143b39',
  edge: '#082321',
  felt: '#214c46',
  paper: '#fbf1d8',
  sheet: '#f4e6c7',
  rule: '#c5b694',
  ink: '#202f31',
  dull: '#596761',
  blue: '#165978',
  teal: '#17664e',
  rust: '#a33d27',
  gold: '#edc274',
  mist: '#c2ded2',
  light: '#fff4d9',
  pale: '#f3d9b5',
};
export function rect(g, x, y, w, h, fill) {
  g.fillStyle = fill;
  g.fillRect(x, y, w, h);
}
export function line(g, x, y, xx, yy, color = col.rule, width = 1) {
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(xx, yy);
  g.strokeStyle = color;
  g.lineWidth = width;
  g.stroke();
}
export function circle(g, x, y, r, fill, stroke) {
  g.beginPath();
  g.arc(x, y, r, 0, 2 * Math.PI);
  if (fill) {
    g.fillStyle = fill;
    g.fill();
  }
  if (stroke) {
    g.strokeStyle = stroke;
    g.lineWidth = 1.5;
    g.stroke();
  }
}
export function text(g, str, x, y, size = 18, options = {}) {
  const {
    color = col.ink,
    face = 'Sans',
    align = 'left',
    weight = 400,
    max,
    italic = false,
  } = options;
  g.font = (italic ? 'italic ' : '') + weight + ' ' + size + 'px "Lesson ' + face + '"';
  g.fillStyle = color;
  g.textAlign = align;
  g.textBaseline = 'alphabetic';
  if (max) g.fillText(String(str), x, y, max);
  else g.fillText(String(str), x, y);
}
export const mono = (g, s, x, y, n = 14, color = col.dull, align = 'left', max) =>
  text(g, s, x, y, n, { face: 'Mono', color, align, max });
export const title = (g, s, x, y, n = 36, color = col.ink, max) =>
  text(g, s, x, y, n, { face: 'Serif', color, max });
export function field(g, name, value, x, y, w = 300, c = col.ink) {
  mono(g, name, x, y, 12, col.dull);
  text(g, value, x, y + 27, 22, { color: c, max: w });
  line(g, x, y + 36, x + w, y + 36);
}
export function desk(g) {
  const grad = g.createLinearGradient(0, 0, 960, 540);
  grad.addColorStop(0, col.felt);
  grad.addColorStop(0.73, col.desk);
  grad.addColorStop(1, col.edge);
  rect(g, 0, 0, 960, 540, grad);
}
export function paper(g, x, y, w, h, fill = col.paper) {
  rect(g, x + 6, y + 8, w, h, 'rgba(0,0,0,.20)');
  rect(g, x + 2, y + 3, w, h, '#bba986');
  const shade = g.createLinearGradient(x, y, x + w, y + h);
  shade.addColorStop(0, fill);
  shade.addColorStop(0.74, fill);
  shade.addColorStop(1, col.sheet);
  rect(g, x, y, w, h, shade);
}
export function folder(g, x, y, w, h, tab) {
  rect(g, x - 6, y - 7, w + 12, h + 15, '#bd8951');
  rect(g, x + 10, y - 26, 185, 24, '#d9aa6c');
  mono(g, tab, x + 20, y - 10, 12, col.ink);
  paper(g, x, y, w, h);
}
export function header(g, kicker, name, x = 65, y = 61, color = col.light) {
  mono(g, kicker, x, y, 14, color === col.light ? col.gold : col.dull);
  title(g, name, x, y + 47, 35, color, 850);
}
export function stamp(g, s, x, y, color = col.rust, w) {
  g.save();
  g.translate(x, y);
  g.rotate(-0.02);
  g.font = '600 17px "Lesson Sans"';
  const width = w || g.measureText(s).width + 23;
  g.strokeStyle = color;
  g.lineWidth = 2;
  g.strokeRect(0, -22, width, 31);
  text(g, s, 11, 0, 17, { color, weight: 600, max: width - 18 });
  g.restore();
}
export function mark(g, x, y, ok, r = 9) {
  circle(g, x, y, r, ok ? col.teal : col.rust);
  const a = r * 0.46;
  if (ok) {
    line(g, x - a, y, x - a * 0.22, y + a, col.light, 1.8);
    line(g, x - a * 0.22, y + a, x + a, y - a, col.light, 1.8);
  } else {
    line(g, x - a, y - a, x + a, y + a, col.light, 1.8);
    line(g, x + a, y - a, x - a, y + a, col.light, 1.8);
  }
}
export function checkBox(g, x, y, v) {
  g.strokeStyle = col.dull;
  g.lineWidth = 1.5;
  g.strokeRect(x - 10, y - 10, 20, 20);
  if (v === true) {
    line(g, x - 7, y, x - 2, y + 6, col.teal, 3);
    line(g, x - 2, y + 6, x + 9, y - 8, col.teal, 3);
  }
  if (v === false) line(g, x - 6, y, x + 6, y, col.dull, 2);
  if (v === null) text(g, '?', x, y + 6, 20, { align: 'center', color: col.rust });
}
// Ink and nib share the end of the same polyline.
const signatures = [
  [
    [0, 1],
    [0.05, 0.2],
    [0.09, -0.65],
    [0.13, -0.84],
    [0.15, -0.41],
    [0.12, 0.4],
    [0.08, 0.68],
    [0.17, 0.29],
    [0.23, -0.25],
    [0.26, -0.16],
    [0.25, 0.33],
    [0.3, 0.09],
    [0.34, -0.09],
    [0.38, 0.25],
    [0.43, 0.05],
    [0.48, 0.23],
    [0.57, -0.02],
    [0.65, 0.15],
    [0.75, -0.02],
    [0.84, -0.1],
    [1, -0.31],
  ],
  [
    [0, 0.28],
    [0.06, -0.67],
    [0.12, -0.8],
    [0.16, -0.5],
    [0.07, 0.15],
    [0.13, 0.48],
    [0.22, 0.18],
    [0.28, -0.35],
    [0.31, 0.2],
    [0.37, -0.1],
    [0.4, 0.21],
    [0.45, 0.16],
    [0.53, -0.06],
    [0.57, 0.2],
    [0.67, 0.13],
    [0.76, -0.08],
    [1, -0.2],
  ],
];
export function signature(g, x, y, w, p = 1, variant = 0, pen = false) {
  const points = signatures[variant % 2],
    n = (points.length - 1) * Math.min(1, Math.max(0, p));
  const i = Math.floor(n),
    a = points[i],
    b = points[Math.min(i + 1, points.length - 1)];
  const end = [a[0] + (b[0] - a[0]) * (n - i), a[1] + (b[1] - a[1]) * (n - i)];
  g.beginPath();
  g.moveTo(x, y + points[0][1] * 16);
  for (let j = 1; j <= i; j++) g.lineTo(x + w * points[j][0], y + 16 * points[j][1]);
  const ex = x + w * end[0],
    ey = y + 16 * end[1];
  g.lineTo(ex, ey);
  g.strokeStyle = col.blue;
  g.lineWidth = 2.5;
  g.lineJoin = 'round';
  g.lineCap = 'round';
  g.stroke();
  if (pen && p < 1) {
    g.save();
    g.translate(ex, ey);
    g.rotate(-0.86);
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(17, -4);
    g.lineTo(17, 4);
    g.closePath();
    g.fillStyle = col.gold;
    g.fill();
    rect(g, 17, -5, 91, 10, col.ink);
    rect(g, 33, -4, 50, 1.6, '#718888');
    rect(g, 105, -5, 8, 10, col.gold);
    g.restore();
  }
}
export function binding(g, x, y, h) {
  for (let j = 18; j < h - 12; j += 34) {
    circle(g, x, y + j, 3.5, '#bdad8d');
    line(g, x - 9, y + j, x, y + j, col.ink, 2.3);
  }
}
export function screen(g, x, y, w, h) {
  rect(g, x + 4, y + 6, w, h, '#0a2526');
  rect(g, x, y, w, h, '#8faca0');
  rect(g, x + 4, y + 4, w - 8, h - 8, '#102f31');
}
export function graphPaper(g, x, y, w, h, step = 22, color = '#345552') {
  for (let i = 0; i <= w; i += step) line(g, x + i, y, x + i, y + h, color, 0.7);
  for (let i = 0; i <= h; i += step) line(g, x, y + i, x + w, y + i, color, 0.7);
}
export function at(clock, beat, phrase, span = 0) {
  const current = clock.beat.beatIndex;
  return current === beat ? clock.reveal(phrase, span) : Number(current > beat);
}
export function lines(g, values, x, y, gap = 29, size = 18, color = col.ink, max = 800) {
  values.forEach((v, i) => text(g, v, x, y + i * gap, size, { color, max }));
}
