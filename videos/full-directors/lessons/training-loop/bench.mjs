// Coordinates are in half-resolution units. The host owns the canvas and subtitles.
export const P = {
  ink: '#142e30',
  bed: '#193b3d',
  panel: '#24494b',
  edge: '#577676',
  paper: '#f3e8cf',
  white: '#fff5df',
  dim: '#bbcdbe',
  pencil: '#53695e',
  rule: '#c8bfa8',
  teal: '#8dddbe',
  moss: '#246853',
  red: '#a33e2f',
  copper: '#f69a68',
  gold: '#f6cc76',
  cyan: '#80dfe7',
  pink: '#ff9aa9',
};
export const mix = (a, b, t) => a + (b - a) * t;
export function cue(k, b, phrase, span = 0) {
  if (k.beat.beatIndex + 1 !== b) return Number(k.beat.beatIndex + 1 > b);
  return k.reveal(phrase, span);
}
export function spokenProgress(k, b, phrase) {
  if (k.beat.beatIndex + 1 !== b) return Number(k.beat.beatIndex + 1 > b);
  const { start, end } = k.wordCue(phrase);
  return k.reveal(phrase, end - start, { captionStart: false });
}
export function finish(k, b) {
  return k.beat.beatIndex + 1 > b || (k.beat.beatIndex + 1 === b && k.elapsed >= k.speechDuration);
}
export function txt(c, s, x, y, size = 19, color = P.ink, opt = {}) {
  c.save();
  c.font = (opt.bold ? '700 ' : '400 ') + size + 'px "Lesson ' + (opt.font || 'Sans') + '"';
  c.textAlign = opt.align || 'left';
  c.textBaseline = 'middle';
  c.fillStyle = color;
  c.fillText(String(s), x, y);
  c.restore();
}
export function mono(c, s, x, y, size = 19, col = P.ink, align = 'left') {
  txt(c, s, x, y, size, col, { font: 'Mono', align });
}
export function line(c, x, y, xx, yy, col = P.rule, w = 1) {
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(xx, yy);
  c.lineWidth = w;
  c.strokeStyle = col;
  c.stroke();
}
export function box(c, x, y, w, h, col, r = 0) {
  c.fillStyle = col;
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  c.fill();
}
export function dot(c, x, y, r, col) {
  c.beginPath();
  c.arc(x, y, r, 0, 2 * Math.PI);
  c.fillStyle = col;
  c.fill();
}
export function poly(c, points, col) {
  c.beginPath();
  points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  c.fillStyle = col;
  c.fill();
}
export function base(c, light = false) {
  c.scale(2, 2);
  const g = c.createLinearGradient(0, 0, 960, 540);
  g.addColorStop(0, light ? '#fcf4e1' : '#21494b');
  g.addColorStop(1, light ? '#ded0af' : '#102b2e');
  box(c, 0, 0, 960, 540, g);
}
export function head(c, eyebrow, title, light = false) {
  txt(c, eyebrow, 46, 42, 15, light ? P.moss : P.teal, { bold: true });
  txt(c, title, 45, 94, 39, light ? P.ink : P.white, { font: 'Serif' });
}
export function plaque(c, x, y, w, h) {
  box(c, x + 2, y + 4, w, h, '#0c27294d', 9);
  box(c, x, y, w, h, P.paper, 9);
  for (const sx of [x + 11, x + w - 11])
    for (const sy of [y + 11, y + h - 11]) {
      dot(c, sx, sy, 3, '#9b9b89');
      line(c, sx - 1.6, sy + 1.4, sx + 1.6, sy - 1.4, P.pencil, 0.9);
    }
}
export function strip(c, x, y, w, h, color = P.paper) {
  const teeth = [];
  for (let i = 0; i <= Math.floor(w / 10); i++) teeth.push([x + w - i * 10, y + h - (i % 2) * 3.2]);
  poly(c, [[x, y], [x + w, y], ...teeth, [x, y + h]], color);
}
export function ticket(c, x, y, w, title, features, label) {
  const h = 104;
  box(c, x + 2, y + 5, w, h, '#0c27294d', 3);
  poly(
    c,
    [
      [x, y],
      [x + w - 18, y],
      [x + w, y + 18],
      [x + w, y + h],
      [x, y + h],
    ],
    P.paper,
  );
  poly(
    c,
    [
      [x + w - 18, y],
      [x + w - 18, y + 18],
      [x + w, y + 18],
    ],
    '#cbbea1',
  );
  for (let i = 0; i < 4; i++) box(c, x + 6, y + 8 + i * 23, 4, 13, i % 2 ? P.moss : P.red);
  txt(c, label, x + 22, y + 20, 14, P.red, { bold: true });
  txt(c, title, x + 22, y + 49, 25, P.ink, { font: 'Serif' });
  line(c, x + 22, y + 68, x + w - 16, y + 68);
  mono(c, features, x + 22, y + 85, 14, P.pencil);
}
export function equation(c, s, y, light = false, size = 28) {
  mono(c, s, 480, y, size, light ? P.ink : P.white, 'center');
}
export function matrix(
  c,
  { x, y, w, label, rows, headers, colors = [], highlight = -1, rowH = 53 },
) {
  txt(c, label, x, y - 24, 21, P.white, { bold: true });
  const cols = rows[0].length,
    cw = w / cols;
  headers?.forEach((h, i) => txt(c, h, x + cw * (i + 0.5), y + 11, 15, P.dim, { align: 'center' }));
  const top = y + (headers ? 30 : 0);
  rows.forEach((row, i) =>
    row.forEach((v, j) => {
      const left = x + j * cw,
        yy = top + i * rowH;
      box(
        c,
        left + 1,
        yy + 1,
        cw - 2,
        rowH - 2,
        highlight === i ? '#f4d69c' : colors[i] || P.paper,
        3,
      );
      mono(c, v, left + cw / 2, yy + rowH / 2, 22, P.ink, 'center');
    }),
  );
}
export function paperRows(c, rows, x, y, w, dy = 52) {
  for (const [i, [a, b]] of rows.entries()) {
    line(c, x, y + (i + 0.52) * dy, x + w, y + (i + 0.52) * dy);
    txt(c, a, x, y + i * dy, 18, P.pencil);
    mono(c, b, x + w, y + i * dy, 19, P.ink, 'right');
  }
}
export function axis(
  c,
  { x = 75, y = 373, w = 810, range = 0.6, gap = null, old = null, dark = false } = {},
) {
  const ink = dark ? P.white : P.ink,
    mid = x + w / 2;
  const px = (v) => mid + (v * w) / (2 * range);
  line(c, x, y, x + w, y, ink, 3);
  for (let i = -6; i <= 6; i++) {
    const pos = mid + (i * w) / 12;
    line(c, pos, y - 3, pos, y + (i % 2 ? 7 : 12), ink, 1.2);
    if (i % 2 === 0)
      mono(c, i === 0 ? '0' : fmt((i * range) / 6, 1), pos, y + 26, 14, ink, 'center');
  }
  if (old !== null) {
    dot(c, px(old), y, 8, dark ? P.dim : P.pencil);
    dot(c, px(old), y, 5, dark ? P.bed : P.paper);
  }
  if (gap !== null) {
    const v = px(gap);
    poly(
      c,
      [
        [v - 10, y - 32],
        [v + 10, y - 32],
        [v, y - 5],
      ],
      dark ? P.gold : P.red,
    );
    dot(c, v, y, 5, dark ? P.gold : P.red);
    mono(c, fmt(gap, 2), v, y - 48, 20, dark ? P.gold : P.red, 'center');
  }
}
export function fmt(v, d = 2) {
  return (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(d);
}
export function trace(c, history, upto, key, { x, y, w, h, xMax, yMin, yMax }, col) {
  const point = (i) => [
    x + (history[i][key === 'loss' ? 'updates' : 'step'] / xMax) * w,
    y + h * (1 - (history[i][key] - yMin) / (yMax - yMin)),
  ];
  c.beginPath();
  for (let i = 0; i <= upto; i++) {
    const p = point(i);
    i ? c.lineTo(...p) : c.moveTo(...p);
  }
  c.strokeStyle = col;
  c.lineWidth = 3;
  c.stroke();
  dot(c, ...point(upto), 4, col);
  return point;
}
export function plotGrid(c, g, ticks) {
  for (const t of ticks) {
    const yy = g.y + g.h * (1 - (t - g.yMin) / (g.yMax - g.yMin));
    line(c, g.x, yy, g.x + g.w, yy, P.edge);
    mono(c, t, g.x - 10, yy, 13, P.dim, 'right');
  }
  line(c, g.x, g.y, g.x, g.y + g.h, P.edge);
  line(c, g.x, g.y + g.h, g.x + g.w, g.y + g.h, P.edge);
  for (const t of [0, g.xMax / 2, g.xMax])
    mono(c, t, g.x + (t / g.xMax) * g.w, g.y + g.h + 18, 13, P.dim, 'center');
}
