export const C = {
  paper: '#f4efdf',
  pale: '#fffbed',
  ink: '#183833',
  muted: '#516963',
  edge: '#a5aea0',
  board: '#21413b',
  deep: '#122f2b',
  trace: '#6b8980',
  cream: '#f8f2da',
  A: '#aa472a',
  aLight: '#f0ab86',
  B: '#245485',
  bLight: '#96c5ec',
  gold: '#edbf61',
  green: '#387557',
  red: '#ab3735',
  steel: '#b8c3b2',
};
export const mix = (from, to, t) => from + (to - from) * t;
export function reveal(k, beat, words, span = 0) {
  const i = k.beat.beatIndex;
  return i === beat ? k.reveal(words, span) : Number(i > beat);
}
export function rect(c, x, y, w, h, fill) {
  c.fillStyle = fill;
  c.fillRect(x, y, w, h);
}
export function label(c, str, x, y, size = 32, color = C.ink, opts = {}) {
  c.save();
  c.font = (opts.weight ?? 500) + ' ' + size + 'px "Lesson ' + (opts.face ?? 'Sans') + '"';
  c.fillStyle = color;
  c.textAlign = opts.align ?? 'left';
  c.textBaseline = 'alphabetic';
  c.fillText(String(str), x, y);
  c.restore();
}
export const serif = (c, t, x, y, n = 52, color = C.ink, align = 'left') =>
  label(c, t, x, y, n, color, { face: 'Serif', weight: 500, align });
export const mono = (c, t, x, y, n = 32, color = C.ink, align = 'left') =>
  label(c, t, x, y, n, color, { face: 'Mono', weight: 500, align });
export function line(c, pts, col = C.edge, w = 3) {
  c.beginPath();
  pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.strokeStyle = col;
  c.lineWidth = w;
  c.stroke();
}
export function polygon(c, pts, col) {
  c.beginPath();
  pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  c.fillStyle = col;
  c.fill();
}
export function dot(c, x, y, r, col) {
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fillStyle = col;
  c.fill();
}
export function plate(c, x, y, w, h, color = C.board, depth = 8) {
  const corners = [
    [x + 16, y],
    [x + w - 19, y],
    [x + w, y + 19],
    [x + w, y + h - 11],
    [x + w - 11, y + h],
    [x + 11, y + h],
    [x, y + h - 11],
    [x, y + 16],
  ];
  polygon(
    c,
    corners.map(([a, b]) => [a, b + depth]),
    '#94a291',
  );
  polygon(c, corners, color);
  line(
    c,
    [
      [x + 18, y + 3],
      [x + w - 21, y + 3],
      [x + w - 4, y + 20],
    ],
    '#ffffff46',
    2,
  );
}
export function pad(c, x, y, r = 9) {
  dot(c, x, y, r, C.trace);
  dot(c, x, y, r * 0.52, C.gold);
  dot(c, x, y, r * 0.22, C.board);
}
export function substrate(c, x, y, w, h) {
  plate(c, x, y, w, h);
  for (const a of [x + 21, x + w - 21]) for (const b of [y + 21, y + h - 21]) pad(c, a, b, 7);
  for (let j = 0; j < 7; j++) {
    const dy = y + h - 16 - j * 4;
    line(
      c,
      [
        [x + 45, dy],
        [x + 85, dy],
        [x + 98 + j * 4, dy - 13 - j * 4],
        [x + 160 + j * 4, dy - 13 - j * 4],
      ],
      '#71918755',
      1.5,
    );
  }
}
export function head(c, k, section, question) {
  const g = c.createLinearGradient(0, 0, 1920, 1080);
  g.addColorStop(0, '#fff9e9');
  g.addColorStop(0.7, C.paper);
  g.addColorStop(1, '#dedfcd');
  rect(c, 0, 0, 1920, 1080, g);
  mono(c, section.toUpperCase(), 86, 79, 27, C.muted);
  serif(c, question, 82, 185, 68);
  line(
    c,
    [
      [84, 219],
      [1836, 219],
    ],
    C.edge,
    2,
  );
}
export function foot(c, main, detail = '') {
  line(
    c,
    [
      [86, 831],
      [1834, 831],
    ],
    C.edge,
    2,
  );
  serif(c, main, 88, 900, 48);
  if (detail) label(c, detail, 89, 955, 31, C.muted);
}
export function document(c, x, y, w, h, title, scope, color = C.A) {
  rect(c, x + 9, y + 9, w, h, '#b3b6a3');
  polygon(
    c,
    [
      [x, y],
      [x + w - 28, y],
      [x + w, y + 28],
      [x + w, y + h],
      [x, y + h],
    ],
    C.pale,
  );
  rect(c, x, y, 12, h, color);
  polygon(
    c,
    [
      [x + w - 28, y],
      [x + w - 28, y + 28],
      [x + w, y + 28],
    ],
    C.steel,
  );
  label(c, title, x + 30, y + 58, 38, color, { weight: 600 });
  label(c, scope, x + 30, y + 105, 29, C.ink);
  if (h >= 150)
    for (let j = 0; j < 2; j++)
      rect(c, x + 31, y + 129 + j * 13, (w - 85) * (j ? 0.6 : 0.9), 3, C.edge);
}
export function die(c, x, y, w, h, color = C.board, variant = 0) {
  for (let j = 16; j < w - 5; j += 18) {
    rect(c, x + j, y - 9, 8, 11, C.trace);
    rect(c, x + j, y + h - 1, 8, 11, C.trace);
  }
  for (let j = 16; j < h - 5; j += 18) {
    rect(c, x - 9, y + j, 11, 8, C.trace);
    rect(c, x + w - 1, y + j, 11, 8, C.trace);
  }
  plate(c, x, y, w, h, color, 5);
  const dx = (w - 28) / 9,
    dy = (h - 25) / 5;
  for (let i = 0; i < 45; i++) {
    const a = i % 9,
      b = Math.floor(i / 9);
    rect(
      c,
      x + 13 + a * dx,
      y + 10 + b * dy,
      dx - 3,
      dy - 3,
      ['#92b59d', '#d5b56f', '#668a79', '#7d9984'][(a * 7 + b * 3 + variant) % 4],
    );
  }
}
export function wire(c, x1, y1, x2, y2, col, t = 1) {
  const a = x1 + (x2 - x1) * 0.45;
  const pts = [
    [x1, y1],
    [a, y1],
    [a + (x2 - x1) * 0.13, y2],
    [x2, y2],
  ];
  line(c, pts, C.edge, 6);
  if (t > 0) {
    const d = pts.slice(1).map(([x, y], i) => Math.hypot(x - pts[i][0], y - pts[i][1]));
    let left = d.reduce((a, b) => a + b, 0) * t;
    for (let j = 0; j < 3 && left > 0; j++) {
      const q = Math.min(1, left / (d[j] || 1)),
        [x, y] = pts[j],
        [u, v] = pts[j + 1];
      const end = [mix(x, u, q), mix(y, v, q)];
      line(c, [[x, y], end], col, 7);
      if (q < 1) dot(c, ...end, 9, col);
      left -= d[j];
    }
  }
}
export function socket(c, x, y, w, h, col, active = false) {
  rect(c, x, y, w, h, C.deep);
  rect(c, x + 2, y + 2, w - 4, h - 4, active ? col : '#496057');
  if (active) {
    rect(c, x + 3, y + 3, w - 6, 4, '#ffffff60');
    for (let j = 10; j < w - 4; j += 10) rect(c, x + j, y + 10, 2, Math.max(2, h - 19), '#ffffff38');
  } else
    line(
      c,
      [
        [x + 3, y + h - 3],
        [x + w - 3, y + h - 3],
        [x + w - 3, y + 3],
      ],
      '#92a698',
      2,
    );
}
export function strip(c, x, y, w, h, parts, total) {
  rect(c, x, y, w, h, C.deep);
  let left = x;
  for (const [count, col] of parts) {
    if (!count) continue;
    const width = (w * count) / total;
    rect(c, left, y, width, h, col);
    rect(c, left, y, width, 5, '#ffffff55');
    line(
      c,
      [
        [left, y],
        [left, y + h],
      ],
      C.paper,
      2,
    );
    left += width;
  }
}
