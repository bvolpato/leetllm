// All coordinates here are in a 1600 by 900 composing area.
export const P = {
  paper: '#faf1d9',
  ink: '#252c32',
  dim: '#5f615a',
  rule: '#b8b29c',
  ghost: '#ded9c6',
  red: '#9e412c',
  blue: '#30597a',
  teal: '#176956',
  gold: '#89631f',
  plum: '#79546b',
  white: '#fffaf0',
  night: '#22373a',
  mint: '#b7dfc5',
  amber: '#ffd28a',
};
export const colors = [P.red, P.blue, P.teal, P.plum, P.gold];
export const mix = (a, b, t) => a + (b - a) * t;
export const pct = (v, n = 1) => {
  const rounded = Number((v * 100).toFixed(n));
  return v > 0 && rounded === 0 ? '<' + 10 ** -n + '%' : rounded + '%';
};
export const num = (v, n = 3) => String(Number(v.toFixed(n))).replace('-', '−');
export function cue(k, beat, words, dur = 0) {
  const which = k.beat.beatIndex;
  return which < beat ? 0 : which > beat ? 1 : k.reveal(words, dur);
}
export function text(c, words, x, y, size = 36, color = P.ink, face = 'Sans', align = 'left', max) {
  c.fillStyle = color;
  c.font = '400 ' + size + 'px "Lesson ' + face + '"';
  c.textAlign = align;
  c.textBaseline = 'alphabetic';
  if (max) c.fillText(String(words), x, y, max);
  else c.fillText(String(words), x, y);
}
export function box(c, x, y, w, h, color) {
  c.fillStyle = color;
  c.fillRect(x, y, w, h);
}
export function line(c, x, y, x2, y2, color = P.rule, width = 2) {
  c.strokeStyle = color;
  c.lineWidth = width;
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(x2, y2);
  c.stroke();
}
export function dot(c, x, y, r, color) {
  c.fillStyle = color;
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fill();
}
export function heading(c, title, condition = '') {
  text(c, title, 85, 131, 66, P.ink, 'Serif', 'left', 1430);
  if (condition) text(c, condition, 88, 190, 31, P.dim, 'Sans', 'left', 1420);
}
export function mark(c, x, y, word, color = P.ink, above = true) {
  const sign = above ? -1 : 1;
  line(c, x, y, x, y + sign * 43, color, 4);
  dot(c, x, y, 6, color);
  text(c, word, x, y + (above ? -54 : 80), 29, color, 'Mono', 'center');
}
// Each segment occupies its actual probability width. Thin segments keep their seam even without a label.
export function strip(
  c,
  vals,
  names,
  {
    x = 92,
    y = 350,
    w = 1416,
    h = 105,
    active,
    palette = colors,
    label = true,
    colorBy,
    numbers = true,
  } = {},
) {
  let cumulative = 0;
  const edges = [x];
  vals.forEach((v, i) => {
    const left = x + w * cumulative;
    cumulative += v;
    const width = w * v;
    edges.push(x + w * cumulative);
    if (width < 0.1) return;
    const included = !active || active.includes(i);
    const fill = included ? palette[(colorBy?.[i] ?? i) % palette.length] : P.ghost;
    box(c, left, y, width, h, fill);
    line(c, left, y, left, y + h, P.paper, 2);
    const color = included ? P.white : P.dim;
    if (label && width > 45) {
      const center = left + width / 2;
      text(
        c,
        names[i],
        center,
        y + (numbers ? h * 0.48 : h * 0.62),
        Math.min(38, h * 0.45),
        color,
        'Serif',
        'center',
        Math.max(22, width - 12),
      );
      if (numbers && h >= 62)
        text(
          c,
          pct(v),
          center,
          y + h * 0.83,
          Math.min(26, h * 0.31),
          color,
          'Mono',
          'center',
          width - 8,
        );
    }
  });
  return edges;
}
export function rule(c, x, y, w) {
  line(c, x, y, x + w, y, P.rule);
  for (let i = 0; i <= 10; i++) {
    const xx = x + (w * i) / 10;
    line(c, xx, y, xx, y + (i % 5 === 0 ? 17 : 8), P.dim);
    if (i % 5 === 0) text(c, i * 10 + '%', xx, y + 48, 25, P.dim, 'Mono', 'center');
  }
}
export function columnHead(c, title, x, y) {
  text(c, title, x, y, 27, P.dim);
}
export function reading(c, s, x, y, size = 48, color = P.ink, max = 1390) {
  text(c, s, x, y, size, color, 'Serif', 'left', max);
}
export function tag(c, s, x, y, color = P.teal) {
  line(c, x, y - 8, x + 30, y - 8, color, 5);
  text(c, s, x + 47, y, 29, color);
}
export function ledger(
  c,
  heads,
  rows,
  { x = [95, 550, 970, 1270], y = 305, dy = 102, sizes = [], tones = [] } = {},
) {
  heads.forEach((v, i) => columnHead(c, v, x[i], y - 47));
  rows.forEach((row, j) => {
    const yy = y + dy * j;
    line(c, 85, yy + 29, 1515, yy + 29, P.rule, 1);
    row.forEach((v, i) =>
      text(
        c,
        v,
        x[i],
        yy + 3,
        sizes[i] ?? 40,
        tones[j] ?? P.ink,
        i === 0 ? 'Serif' : 'Mono',
        'left',
        (x[i + 1] ?? 1520) - x[i] - 18,
      ),
    );
  });
}
export function terminal(c, x, y, w, h, title) {
  box(c, x + 7, y + 9, w, h, '#c4bea6');
  box(c, x, y, w, h, P.night);
  text(c, title, x + 32, y + 52, 24, P.mint, 'Mono', 'left', w - 56);
  line(c, x + 30, y + 75, x + w - 30, y + 75, '#627373', 1.5);
}
export function start(c) {
  c.scale(1.2, 1.2);
  box(c, 0, 0, 1600, 900, P.paper);
}
