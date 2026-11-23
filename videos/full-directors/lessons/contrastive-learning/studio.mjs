import { runner, sleeping } from './poses.mjs';

export const C = {
  paper: '#f6eedc',
  white: '#fff9eb',
  ink: '#162e36',
  soft: '#506167',
  line: '#c3b9a3',
  sea: '#146c72',
  rust: '#a44330',
  gold: '#a06a16',
  blue: '#36618a',
  pale: '#d4e7df',
  pink: '#efcfc1',
  brass: '#edc370',
  dark: '#163541',
  night: '#102b35',
  light: '#f4ead2',
  mint: '#86d7bc',
  coral: '#ffab88',
  cyan: '#82d9ea',
};
export const colors = [C.sea, C.rust, C.blue];
export const fixed = (n, d = 2) =>
  Math.abs(n) < 0.5 * 10 ** -d ? (0).toFixed(d) : n.toFixed(d).replace('-', '−');
export const pct = (n, d = 1) => fixed(100 * n, d) + '%';
export function cue(k, b, phrase, span = 0) {
  return k.beat.beatIndex > b ? 1 : k.beat.beatIndex < b ? 0 : k.reveal(phrase, span);
}
export function fill(g, x, y, w, h, col) {
  g.fillStyle = col;
  g.fillRect(x, y, w, h);
}
export function stroke(g, pts, col, w = 3, dash = []) {
  g.save();
  g.strokeStyle = col;
  g.lineWidth = w;
  g.lineJoin = 'round';
  g.lineCap = 'round';
  g.setLineDash(dash);
  g.beginPath();
  pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.stroke();
  g.restore();
}
export function circle(g, x, y, r, col, edge = null, w = 3) {
  g.beginPath();
  g.arc(x, y, r, 0, 2 * Math.PI);
  if (col) {
    g.fillStyle = col;
    g.fill();
  }
  if (edge) {
    g.strokeStyle = edge;
    g.lineWidth = w;
    g.stroke();
  }
}
export function ellipse(g, x, y, a, b, col) {
  g.beginPath();
  g.ellipse(x, y, a, b, 0, 0, Math.PI * 2);
  g.fillStyle = col;
  g.fill();
}
export function poly(g, pts, col) {
  g.beginPath();
  pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.closePath();
  g.fillStyle = col;
  g.fill();
}
export function arrow(g, x, y, u, v, col, w = 6, head = 20) {
  const a = Math.atan2(v - y, u - x);
  stroke(
    g,
    [
      [x, y],
      [u - Math.cos(a) * head * 0.6, v - Math.sin(a) * head * 0.6],
    ],
    col,
    w,
  );
  poly(
    g,
    [
      [u, v],
      [
        u - head * Math.cos(a) + head * 0.44 * Math.sin(a),
        v - head * Math.sin(a) - head * 0.44 * Math.cos(a),
      ],
      [
        u - head * Math.cos(a) - head * 0.44 * Math.sin(a),
        v - head * Math.sin(a) + head * 0.44 * Math.cos(a),
      ],
    ],
    col,
  );
}
export function text(g, str, x, y, size = 40, col = C.ink, opts = {}) {
  const { align = 'left', face = 'Sans', weight = 400, max } = opts;
  g.save();
  g.textAlign = align;
  g.textBaseline = 'alphabetic';
  g.font = weight + ' ' + size + 'px "Lesson ' + face + '"';
  g.fillStyle = col;
  g.fillText(String(str), x, y, max ?? 1850);
  g.restore();
}
export const mono = (g, t, x, y, size = 36, c = C.ink, opts = {}) =>
  text(g, t, x, y, size, c, { ...opts, face: 'Mono' });
export const serif = (g, t, x, y, size = 55, c = C.ink, opts = {}) =>
  text(g, t, x, y, size, c, { ...opts, face: 'Serif' });
export function bg(g, dark = false) {
  fill(g, 0, 0, 1920, 1080, dark ? C.night : C.paper);
}
export function title(g, t, sub = '', dark = false) {
  serif(g, t, 84, 130, 75, dark ? C.light : C.ink, { max: 1752 });
  if (sub) text(g, sub, 88, 202, 38, dark ? '#b1c9c6' : C.soft);
}
export function rule(g, x, y, w, col = C.line) {
  stroke(
    g,
    [
      [x, y],
      [x + w, y],
    ],
    col,
    2,
  );
}
export function bar(g, x, y, w, h, v, col, bgCol = C.line) {
  fill(g, x, y, w, h, bgCol);
  fill(g, x, y, w * v, h, col);
}
export function cell(g, x, y, w, h, v, col = C.white, ink = C.ink, size = 39) {
  fill(g, x, y, w, h, col);
  mono(g, v, x + w / 2, y + h / 2 + size * 0.32, size, ink, { align: 'center', max: w - 14 });
}
export function shareStrip(g, x, y, w, h, probs, cols = colors) {
  let u = x;
  probs.forEach((v, i) => {
    fill(g, u, y, w * v, h, cols[i]);
    u += w * v;
  });
}
export function disk(g, x, y, r) {
  circle(g, x, y, r + 19, '#233f48', '#42606a', 3);
  circle(g, x, y, r, '#19343d', '#93b1af', 3);
  for (let i = 0; i < 72; i++) {
    const a = (i * Math.PI) / 36,
      wide = i % 6 === 0,
      len = wide ? 18 : 8;
    stroke(
      g,
      [
        [x + (r - len) * Math.cos(a), y - (r - len) * Math.sin(a)],
        [x + r * Math.cos(a), y - r * Math.sin(a)],
      ],
      wide ? '#789a9c' : '#4e7077',
      wide ? 3 : 2,
    );
  }
  stroke(
    g,
    [
      [x - r, y],
      [x + r, y],
    ],
    '#496a73',
    2,
  );
  stroke(
    g,
    [
      [x, y - r],
      [x, y + r],
    ],
    '#496a73',
    2,
  );
}
export const end = (x, y, r, a) => [x + r * Math.cos(a), y - r * Math.sin(a)];
export function filmWindow(g, subject, x, y, w, h, time = 0, freeze = true) {
  const floor = y + h * 0.78;
  g.save();
  g.beginPath();
  g.rect(x, y, w, h);
  g.clip();
  const sky = g.createLinearGradient(x, y, x + w, y + h);
  sky.addColorStop(0, '#1a4758');
  sky.addColorStop(1, '#477f85');
  fill(g, x, y, w, h, sky);
  if (subject === 'sky') {
    circle(g, x + w * 0.73, y + h * 0.32, h * 0.16, '#e9be6d');
    [
      [0.27, 0.52, 0.19, 0.09],
      [0.36, 0.46, 0.11, 0.14],
      [0.46, 0.53, 0.15, 0.09],
    ].forEach(([a, b, c, d]) => ellipse(g, x + w * a, y + h * b, w * c, h * d, '#f0ead7'));
  } else {
    for (let n = 0; n <= 12; n++)
      stroke(
        g,
        [
          [x + (w * n) / 12, y],
          [x + (w * n) / 12, floor],
        ],
        '#87b1ab55',
        1.6,
      );
    for (let n = 1; n < 5; n++) rule(g, x, y + ((floor - y) * n) / 5, w, '#8cbcb44e');
    fill(g, x, floor, w, y + h - floor, '#284953');
    rule(g, x, floor, w, '#ced7bc');
    const sleeper = subject === 'sleeper';
    const scale = Math.min((w * 0.74) / 231, (h * 0.59) / 124),
      phase = freeze ? 0 : (time * 1.25) % 1;
    ellipse(g, x + w * 0.51, floor + 4, w * (sleeper ? 0.32 : 0.24), h * 0.022, '#112e38');
    g.translate(x + w * 0.5, floor - (sleeper ? 0 : scale * (freeze ? 64 : 57)));
    g.scale(scale, scale);
    if (sleeper) sleeping(g, 0);
    else runner(g, phase, subject === 'puppy');
  }
  g.restore();
  fill(g, x, y, w, 15, C.ink);
  fill(g, x, y + h - 15, w, 15, C.ink);
  for (let u = x + 12; u < x + w - 15; u += 34) {
    fill(g, u, y + 4, 16, 7, C.paper);
    fill(g, u, y + h - 11, 16, 7, C.paper);
  }
}
export function book(g, x, y, w, h, name, kind, accent = C.sea) {
  fill(g, x + 8, y + 10, w, h, '#b9ad96');
  fill(g, x + 4, y + 5, w, h, '#f9f3e1');
  fill(g, x, y, w, h, C.white);
  fill(g, x, y, 15, h, accent);
  stroke(
    g,
    [
      [x + 22, y + 6],
      [x + 22, y + h - 6],
    ],
    C.line,
    2,
  );
  const cx = x + w / 2,
    cy = y + h * 0.4,
    r = Math.min(w * 0.16, h * 0.23);
  if (kind === 'wheel' || kind === 'tire') {
    circle(g, cx, cy, r, C.ink);
    circle(g, cx, cy, r * 0.69, C.paper);
    circle(g, cx, cy, r * 0.49, accent);
    for (let i = 0; i < 5; i++) {
      const [xx, yy] = end(cx, cy, r * 0.29, (i * 2 * Math.PI) / 5);
      circle(g, xx, yy, r * 0.086, C.paper);
    }
    circle(g, cx, cy, r * 0.12, C.ink);
  } else if (kind === 'diagram') {
    // A plan view makes the third manual page identifiable from its silhouette.
    g.save();
    g.translate(cx, cy);
    g.scale(r / 46, r / 46);
    const shell = [
      [-97, -14],
      [-86, -31],
      [-65, -37],
      [56, -37],
      [85, -30],
      [96, -16],
      [96, 17],
      [84, 31],
      [56, 37],
      [-65, 37],
      [-88, 29],
      [-97, 16],
      [-97, -14],
    ];
    poly(g, shell, '#d7e4df');
    stroke(g, shell, C.ink, 3.5);
    stroke(
      g,
      [
        [-61, -24],
        [-45, -30],
        [37, -30],
        [59, -18],
        [59, 18],
        [37, 30],
        [-45, 30],
        [-61, 24],
        [-61, -24],
      ],
      accent,
      3,
    );
    stroke(
      g,
      [
        [-32, -26],
        [-40, 26],
      ],
      accent,
      3,
    );
    stroke(
      g,
      [
        [36, -25],
        [43, 25],
      ],
      accent,
      3,
    );
    for (const a of [-1, 1])
      for (const b of [-1, 1]) {
        fill(g, a * 61 - 13, b * 36 - 4, 26, 8, C.ink);
        circle(g, a * 43, b * 32, 5, C.gold);
      }
    g.restore();
  } else if (kind === 'lock') {
    circle(g, cx, cy - r * 0.14, r * 0.42, null, accent, 7);
    fill(g, cx - r * 0.63, cy - r * 0.12, r * 1.26, r * 0.85, accent);
    circle(g, cx, cy + r * 0.17, r * 0.1, C.white);
    fill(g, cx - r * 0.04, cy + r * 0.17, r * 0.08, r * 0.21, C.white);
  } else if (kind === 'replace') {
    for (const side of [-1, 1]) {
      circle(g, cx + side * r * 0.6, cy - r * 0.26, r * 0.19, null, accent, 5);
      stroke(
        g,
        [
          [cx + side * r * 0.6, cy - r * 0.07],
          [cx + side * r * 0.6, cy + r * 0.49],
          [cx + side * r * 0.4, cy + r * 0.49],
        ],
        accent,
        6,
      );
    }
    arrow(g, cx - r * 0.22, cy + r * 0.08, cx + r * 0.22, cy + r * 0.08, C.gold, 3, 10);
  } else if (kind === 'jack') {
    stroke(
      g,
      [
        [cx - r, cy + r * 0.55],
        [cx + r, cy + r * 0.55],
      ],
      C.ink,
      6,
    );
    stroke(
      g,
      [
        [cx, cy + r * 0.55],
        [cx - r * 0.7, cy],
        [cx, cy - r * 0.62],
        [cx + r * 0.7, cy],
        [cx, cy + r * 0.55],
      ],
      accent,
      6,
    );
    stroke(
      g,
      [
        [cx - r * 0.82, cy],
        [cx + r * 0.92, cy],
      ],
      C.ink,
      4,
    );
    stroke(
      g,
      [
        [cx - r * 0.35, cy - r * 0.68],
        [cx + r * 0.35, cy - r * 0.68],
      ],
      C.ink,
      7,
    );
  } else if (kind === 'route') {
    stroke(
      g,
      [
        [cx - r, cy + r * 0.65],
        [cx - r * 0.55, cy - r * 0.37],
        [cx + r * 0.14, cy + r * 0.1],
        [cx + r, cy - r * 0.67],
      ],
      accent,
      7,
    );
    circle(g, cx - r, cy + r * 0.65, 9, C.ink);
    circle(g, cx + r, cy - r * 0.67, 9, C.ink);
  } else {
    circle(g, cx - r * 0.49, cy - r * 0.14, r * 0.44, null, accent, 8);
    stroke(
      g,
      [
        [cx - r * 0.12, cy + r * 0.12],
        [cx + r * 0.62, cy + r * 0.59],
        [cx + r * 0.78, cy + r * 0.32],
      ],
      accent,
      8,
    );
  }
  serif(g, name, cx, y + h * 0.86, Math.min(43, w * 0.145), C.ink, {
    align: 'center',
    max: w - 40,
  });
}
export const sum = (xs) => xs.reduce((a, b) => a + b, 0);
export const dot = (a, b) => sum(a.map((v, i) => v * b[i]));
