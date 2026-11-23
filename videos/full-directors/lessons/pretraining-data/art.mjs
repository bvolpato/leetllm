export const paper = '#f2ead6',
  white = '#fff9e9',
  ink = '#1c3038',
  teal = '#006b62',
  red = '#ab4432',
  gold = '#ac741e',
  muted = '#58686a',
  line = '#b5b2a4',
  mint = '#addaca',
  peach = '#f3bc9f',
  blue = '#b9d3e4',
  ochre = '#ead393',
  pale = '#dedccf';

export function rect(g, x, y, w, h, c) {
  g.fillStyle = c;
  g.fillRect(x, y, w, h);
}
export function rule(g, x, y, X, Y, c = ink, width = 2) {
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(X, Y);
  g.strokeStyle = c;
  g.lineWidth = width;
  g.stroke();
}
export function dot(g, x, y, r, c) {
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fillStyle = c;
  g.fill();
}
export function label(
  g,
  t,
  x,
  y,
  size = 26,
  c = ink,
  family = 'Sans',
  weight = 400,
  align = 'left',
  max = Infinity,
) {
  g.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  g.textAlign = align;
  g.textBaseline = 'alphabetic';
  g.fillStyle = c;
  const width = g.measureText(String(t)).width;
  if (width > max) g.font = weight + ' ' + (size * max) / width + 'px "Lesson ' + family + '"';
  g.fillText(String(t), x, y);
}
export const mono = (g, t, x, y, size = 26, c = ink, align = 'left', max = Infinity) =>
  label(g, t, x, y, size, c, 'Mono', 400, align, max);
export const big = (g, t, x, y, size = 46, c = ink, max = 1090) =>
  label(g, t, x, y, size, c, 'Serif', 400, 'left', max);
export function heading(g, section, title) {
  label(g, section.toUpperCase(), 55, 57, 18, teal, 'Mono', 600);
  big(g, title, 51, 134, 53);
}
export function tape(g, x, y, w, h, face = white, holes = paper) {
  rect(g, x + 3, y + 6, w, h, '#162c3617');
  rect(g, x, y, w, h, face);
  for (let dx = 13; dx < w - 7; dx += 25) {
    dot(g, x + dx, y + 9, 3, holes);
    dot(g, x + dx, y + h - 9, 3, holes);
  }
}
export function arrow(g, x, y, X, Y, c = teal) {
  rule(g, x, y, X, Y, c, 3);
  const a = Math.atan2(Y - y, X - x);
  for (const s of [-1, 1])
    rule(g, X, Y, X - 14 * Math.cos(a + s * 0.49), Y - 14 * Math.sin(a + s * 0.49), c, 3);
}
export function cells(g, items, x, y, w, h, opts = {}) {
  const dx = w / items.length;
  items.forEach((item, i) => {
    rect(g, x + i * dx, y, dx - 3, h, opts.colors?.[i] ?? white);
    mono(g, item, x + (i + 0.5) * dx - 1, y + h / 2 + 8, opts.size ?? 26, ink, 'center', dx - 12);
  });
}
export function textRows(g, rows, x, y, gap = 47, size = 25, col = ink) {
  rows.forEach((v, i) => mono(g, v, x, y + i * gap, size, col));
}
export function tag(g, t, x, y, c = teal) {
  label(g, t, x, y, 20, c, 'Sans', 600);
}
export function meter(g, x, y, w, n, max, color = teal) {
  rect(g, x, y, w, 21, pale);
  rect(g, x, y, (w * n) / max, 21, color);
}
export const percent = (a, b) => Math.round((100 * a) / b) + '%';
export const total = (a) => a.reduce((acc, r) => acc + r.tokens, 0);
export function state(clock) {
  const beat = clock.beat.beatIndex + 1;
  return {
    beat,
    progress: clock.progress,
    elapsed: clock.elapsed,
    at(n, phrase, duration = 0, options) {
      if (beat !== n) return Number(beat > n);
      return clock.reveal(phrase, duration, options);
    },
    after(n, phrase) {
      if (beat !== n) return beat > n;
      const { start, end } = clock.wordCue(phrase);
      return clock.reveal(phrase, end - start, { captionStart: phrase }) === 1;
    },
  };
}
export function filmFrame(g) {
  g.scale(1.6, 1.6);
  rect(g, 0, 0, 1200, 675, paper);
}
