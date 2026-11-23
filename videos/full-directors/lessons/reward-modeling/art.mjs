// Draw in a 960 × 540 coordinate space; the host paints at twice this resolution.
export const C = {
  cream: '#ffedcb',
  page: '#fbf3dc',
  ink: '#242744',
  muted: '#575a6d',
  lilac: '#d0c8ff',
  aqua: '#85e3ce',
  accent: '#ffcc66',
  coral: '#ffafa3',
  gray: '#bbc3d3',
  light: '#fff7e9',
  teal: '#13695d',
  red: '#a13d42',
  edge: '#a49eae',
  faint: '#e5dec8',
};
export function stage(g, paper = false) {
  const bg = g.createLinearGradient(0, 0, 960, 540);
  bg.addColorStop(0, paper ? '#fff8e4' : '#36396d');
  bg.addColorStop(1, paper ? '#efe1c6' : '#202346');
  g.fillStyle = bg;
  g.fillRect(0, 0, 960, 540);
}
export function text(g, value, x, y, size = 23, color = C.ink, options = {}) {
  const { face = 'Sans', weight = 400, align = 'left', width = 930 } = options;
  g.font = weight + ' ' + size + 'px "Lesson ' + face + '"';
  g.fillStyle = color;
  g.textAlign = align;
  g.textBaseline = 'alphabetic';
  g.fillText(String(value), x, y, width);
}
export const mono = (g, v, x, y, s = 19, col = C.ink, opts = {}) =>
  text(g, v, x, y, s, col, { ...opts, face: 'Mono' });
export const serif = (g, v, x, y, s = 36, col = C.ink, opts = {}) =>
  text(g, v, x, y, s, col, { ...opts, face: 'Serif' });
export function line(g, x, y, X, Y, color = C.edge, width = 2) {
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(X, Y);
  g.strokeStyle = color;
  g.lineWidth = width;
  g.stroke();
}
export function rect(g, x, y, w, h, c, r = 0) {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
  g.fillStyle = c;
  g.fill();
}
export function dot(g, x, y, r, color) {
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fillStyle = color;
  g.fill();
}
export function poly(g, pts, fill) {
  g.beginPath();
  g.moveTo(...pts[0]);
  for (const p of pts.slice(1)) g.lineTo(...p);
  g.closePath();
  g.fillStyle = fill;
  g.fill();
}
export function paper(g, x, y, w, h, fill = C.page) {
  poly(
    g,
    [
      [x + 4, y + 8],
      [x + w + 4, y + 5],
      [x + w + 4, y + h + 6],
      [x + 4, y + h + 9],
    ],
    '#1416313b',
  );
  poly(
    g,
    [
      [x, y + 2],
      [x + w - 6, y],
      [x + w, y + 5],
      [x + w, y + h - 3],
      [x + 3, y + h],
      [x, y + h - 4],
    ],
    fill,
  );
}
export function tag(g, v, x, y, { color = C.accent, ink = C.ink, width = 140 } = {}) {
  rect(g, x, y, width, 30, color, 3);
  mono(g, v, x + width / 2, y + 21, 16, ink, { align: 'center', width: width - 12 });
}
export function header(g, eyebrow, title, dark = false) {
  mono(g, eyebrow, 48, 49, 17, dark ? C.aqua : C.teal);
  serif(g, title, 46, 108, 41, dark ? C.light : C.ink, { width: 864 });
}
export function table(
  g,
  {
    x = 50,
    y = 155,
    width = 860,
    columns,
    rows,
    lineHeight = 67,
    headingColor = C.muted,
    ink = C.ink,
    colors = [],
  },
) {
  const base = columns.map((col) => x + col[1] * width);
  columns.forEach(([name], i) =>
    mono(g, name, base[i], y, 16, headingColor, {
      width: (base[i + 1] ?? x + width) - base[i] - 6,
    }),
  );
  line(g, x, y + 12, x + width, y + 12, headingColor, 1.5);
  rows.forEach((row, k) => {
    const yy = y + lineHeight * (k + 1);
    row.forEach((cell, i) =>
      text(g, cell, base[i], yy, 26, colors[k] ?? ink, {
        width: (base[i + 1] ?? x + width) - base[i] - 10,
      }),
    );
    line(g, x, yy + 16, x + width, yy + 16, headingColor, 0.7);
  });
}
export function stamp(g, v, x, y, w = 170, col = C.teal) {
  g.save();
  g.translate(x, y);
  g.rotate(-0.033);
  g.strokeStyle = col;
  g.lineWidth = 2.5;
  g.strokeRect(0, 0, w, 40);
  mono(g, v, w / 2, 28, 20, col, { align: 'center', width: w - 12 });
  g.restore();
}
export function withAlpha(g, a, paint) {
  if (a <= 0) return;
  g.save();
  g.globalAlpha *= a;
  paint();
  g.restore();
}
export function state(clock) {
  const beat = clock.beat.beatIndex + 1;
  const cue = (n, p, span = 0) => (beat > n ? 1 : beat < n ? 0 : clock.reveal(p, span));
  return { beat, cue, clock };
}
export const fixed = (n, d = 2) =>
  Number(n)
    .toFixed(d)
    .replace(/^-0\.00$/, '0.00');
export const lerp = (a, b, p) => a + (b - a) * p;
export const share = (n) => Math.round(100 * n) + '%';
export function screw(g, x, y) {
  dot(g, x, y, 5, '#878898');
  line(g, x - 2, y + 2, x + 2, y - 2, C.ink, 1.3);
}
