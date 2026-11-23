export const C = {
  paper: '#f4efdf',
  white: '#fffbef',
  ink: '#25332e',
  dim: '#546559',
  rule: '#adae98',
  teal: '#006f60',
  sea: '#c0e1d0',
  red: '#a13342',
  rose: '#f4c9bd',
  gold: '#e6b954',
  dark: '#20342e',
  fade: '#e4e2d1',
  violet: '#635a88',
};

export function line(g, x, y, xx, yy, color = C.rule, width = 2) {
  g.strokeStyle = color;
  g.lineWidth = width;
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(xx, yy);
  g.stroke();
}
export function rect(g, x, y, w, h, fill, outline = null, width = 1) {
  if (fill) {
    g.fillStyle = fill;
    g.fillRect(x, y, w, h);
  }
  if (outline) {
    g.strokeStyle = outline;
    g.lineWidth = width;
    g.strokeRect(x, y, w, h);
  }
}
export function circle(g, x, y, r, fill, outline = null, width = 1) {
  g.beginPath();
  g.arc(x, y, r, 0, 2 * Math.PI);
  if (fill) {
    g.fillStyle = fill;
    g.fill();
  }
  if (outline) {
    g.strokeStyle = outline;
    g.lineWidth = width;
    g.stroke();
  }
}
export function txt(
  g,
  s,
  x,
  y,
  size = 24,
  color = C.ink,
  align = 'left',
  face = 'Sans',
  weight = 400,
  max = undefined,
) {
  g.font = weight + ' ' + size + 'px "Lesson ' + face + '"';
  g.textAlign = align;
  g.textBaseline = 'middle';
  g.fillStyle = color;
  if (max !== undefined) g.fillText(String(s), x, y, max);
  else g.fillText(String(s), x, y);
}
export function micro(g, s, x, y, color = C.dim) {
  txt(g, s, x, y, 16, color, 'left', 'Mono', 600);
}
export function arrow(g, x, y, xx, yy, color = C.teal, width = 3) {
  line(g, x, y, xx, yy, color, width);
  const a = Math.atan2(yy - y, xx - x);
  for (const sign of [-1, 1])
    line(
      g,
      xx,
      yy,
      xx - 12 * Math.cos(a + sign * 0.52),
      yy - 12 * Math.sin(a + sign * 0.52),
      color,
      width,
    );
}
export function cue(clock, index, phrase, duration = 0.55) {
  if (clock.beat.beatIndex !== index) return Number(clock.beat.beatIndex > index);
  return clock.reveal(phrase, duration);
}
export function top(g, clock, section, title) {
  g.scale(1.6, 1.6);
  rect(g, 0, 0, 1200, 675, C.paper);
  micro(g, section, 56, 39);
  txt(g, clock.beat.chapterId.slice(1) + ' / 27', 1144, 39, 15, C.dim, 'right', 'Mono');
  line(g, 55, 62, 1145, 62);
  txt(g, title, 55, 110, 44, C.ink, 'left', 'Serif', 500, 1080);
}
export function note(g, s, y = 580, color = C.ink) {
  txt(g, s, 58, y, 29, color, 'left', 'Serif', 500, 1084);
}
export function tag(g, s, x, y, w, color = C.teal) {
  rect(g, x, y, w, 36, color);
  txt(g, s, x + w / 2, y + 18, 19, C.white, 'center', 'Sans', 600, w - 12);
}
export function bracket(g, x, end, y, label, color = C.teal) {
  line(g, x, y, end, y, color, 3);
  line(g, x, y, x, y + 10, color, 3);
  line(g, end, y, end, y + 10, color, 3);
  txt(
    g,
    label,
    (x + end) / 2,
    y - 18,
    20,
    color,
    'center',
    'Sans',
    600,
    Math.max(80, end - x + 30),
  );
}
// A cell center also fixes its label, flag and predictor coordinates.
export function tape(g, words, y, options = {}) {
  const {
    x = 55,
    w = 1090,
    h = 92,
    start = 0,
    number = true,
    fill = () => C.white,
    ink = () => C.ink,
    indices = true,
    ids = null,
  } = options;
  const step = w / words.length;
  const at = (i) => x + (i + 0.5) * step;
  rect(g, x, y, w, h, C.dark);
  words.forEach((word, i) => {
    const left = x + i * step;
    rect(g, left + 1.5, y + 12, step - 3, h - 24, fill(i));
    for (const edge of [y + 3, y + h - 8]) rect(g, left + step / 2 - 5, edge, 10, 5, C.paper);
    txt(
      g,
      String(word).replace(/^▁/, '·'),
      at(i),
      y + (ids ? h * 0.4 : h * 0.5),
      Math.min(32, step * 0.45),
      ink(i),
      'center',
      'Sans',
      600,
      step - 7,
    );
    if (ids)
      txt(
        g,
        ids[i],
        at(i),
        y + h * 0.71,
        Math.min(20, step * 0.28),
        C.dim,
        'center',
        'Mono',
        400,
        step - 7,
      );
    if (indices && number) txt(g, i + start, at(i), y + h + 17, 16, C.dim, 'center', 'Mono');
  });
  return { at, step, x, end: x + w };
}
export function dataRow(g, label, values, rail, y, options = {}) {
  const { color = () => C.ink, size = 24 } = options;
  txt(g, label, 55, y, 18, C.dim, 'left', 'Sans', 600, rail.x - 65);
  values.forEach((value, i) =>
    txt(g, value, rail.at(i), y, size, color(i), 'center', 'Mono', 500, rail.step - 6),
  );
}
export function table(
  g,
  columns,
  rows,
  { x = 55, y = 190, w = 1090, rowH = 66, fractions = null, colors = null } = {},
) {
  const fractionsUsed = fractions ?? columns.map(() => 1 / columns.length);
  const starts = [x];
  fractionsUsed.forEach((f) => starts.push(starts.at(-1) + w * f));
  rect(g, x, y, w, 43, C.dark);
  columns.forEach((h, i) =>
    txt(
      g,
      h,
      starts[i] + 14,
      y + 22,
      18,
      C.white,
      'left',
      'Sans',
      600,
      starts[i + 1] - starts[i] - 25,
    ),
  );
  rows.forEach((row, r) => {
    const yy = y + 43 + rowH * r;
    rect(g, x, yy, w, rowH, r % 2 ? C.paper : C.white);
    row.forEach((v, i) =>
      txt(
        g,
        v,
        starts[i] + 14,
        yy + rowH / 2,
        25,
        colors?.(r, i) ?? C.ink,
        'left',
        i === 0 ? 'Sans' : 'Mono',
        i === 0 ? 600 : 400,
        starts[i + 1] - starts[i] - 26,
      ),
    );
    line(g, x, yy + rowH, x + w, yy + rowH, C.rule, 1);
  });
}
export function gauge(g, x, y, w, frac, color, height = 25) {
  rect(g, x, y, w, height, C.fade);
  if (frac > 0) rect(g, x, y, w * Math.min(frac, 1), height, color);
}
export const fmtLabel = (v) => (v === -100 ? '−100' : String(v));
export const activeColor = (v) => (v === -100 ? C.dim : C.teal);
