export const C = {
  paper: '#f4f0e5',
  shade: '#e2ddd0',
  ink: '#152d3a',
  muted: '#52666a',
  grid: '#c5cbc0',
  navy: '#142e3c',
  rail: '#627e86',
  light: '#f5f3df',
  dim: '#b2c7c4',
  teal: '#096e69',
  mint: '#79dfc4',
  gold: '#f2c367',
  rust: '#a74c2b',
  peach: '#ffbc91',
  lilac: '#abb9ed',
  blue: '#455d98',
};
export const lerp = (a, b, p) => a + (b - a) * p;
export function cue(k, beat, phrase, duration = 0) {
  if (k.beat.beatIndex < beat) return 0;
  if (k.beat.beatIndex > beat) return 1;
  return k.reveal(phrase, duration);
}
export function rect(c, x, y, w, h, fill, edge, thick = 2) {
  if (fill) {
    c.fillStyle = fill;
    c.fillRect(x, y, w, h);
  }
  if (edge) {
    c.strokeStyle = edge;
    c.lineWidth = thick;
    c.strokeRect(x, y, w, h);
  }
}
export function line(c, x, y, X, Y, col = C.grid, w = 3) {
  c.strokeStyle = col;
  c.lineWidth = w;
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(X, Y);
  c.stroke();
}
export function dot(c, x, y, r, color) {
  c.fillStyle = color;
  c.beginPath();
  c.arc(x, y, r, 0, 2 * Math.PI);
  c.fill();
}
export function txt(
  c,
  s,
  x,
  y,
  size = 36,
  color = C.ink,
  face = 'Sans',
  align = 'left',
  weight = 400,
) {
  c.font = weight + ' ' + size + 'px "Lesson ' + face + '"';
  c.fillStyle = color;
  c.textAlign = align;
  c.textBaseline = 'middle';
  c.fillText(String(s), x, y);
  return c.measureText(String(s)).width;
}
export function mono(c, s, x, y, size = 32, col = C.muted, align = 'left') {
  return txt(c, s, x, y, size, col, 'Mono', align);
}
export function bracket(c, x, X, y, t, color = C.teal, down = 1) {
  line(c, x, y, X, y, color, 3);
  line(c, x, y - 8, x, y + 8, color);
  line(c, X, y - 8, X, y + 8, color);
  if (t) mono(c, t, (x + X) / 2, y + down * 33, 31, color, 'center');
}
export function panel(c, x, y, w, h) {
  rect(c, x, y, w, h, C.navy);
  for (const xx of [x + 17, x + w - 17])
    for (const yy of [y + 17, y + h - 17]) {
      dot(c, xx, yy, 5, C.rail);
      line(c, xx - 2.5, yy, xx + 2.5, yy, C.navy, 1);
    }
}
export function frame(c, k, tag, title = k.beat.chapterTitle) {
  rect(c, 0, 0, 1920, 1080, C.paper);
  line(c, 80, 74, 1840, 74, C.muted, 2);
  rect(c, 80, 49, 36, 9, C.teal);
  mono(c, tag.toUpperCase(), 135, 52, 24, C.muted);
  mono(
    c,
    'INFERENCE   /   ' + String(k.beat.chapterIndex + 1).padStart(2, '0'),
    1840,
    52,
    24,
    C.muted,
    'right',
  );
  txt(c, title, 80, 154, 70, C.ink, 'Serif');
}
export function note(c, s, color = C.teal) {
  line(c, 83, 871, 1837, 871, C.grid, 2);
  rect(c, 83, 898, 9, 44, color);
  txt(c, s, 115, 921, 38, color, 'Sans');
}
export function cursor(c, str, x, y, color, size = 62) {
  const w = txt(c, str, x, y, size, color, 'Mono');
  rect(c, x + w + 6, y - size * 0.52, 6, size * 1.04, color);
}
export function axis(c, x, X, y, min, max, step, col = C.rail) {
  line(c, x, y, X, y, col, 2);
  for (let t = Math.ceil(min / step) * step; t <= max; t += step) {
    const xx = x + ((X - x) * (t - min)) / (max - min);
    line(c, xx, y - 5, xx, y + 5, col, 2);
  }
}
export function spot(c, x, y, t, lab, color = C.teal, above = 37, below = 42) {
  line(c, x, y - 14, x, y + 14, color, 4);
  dot(c, x, y, 7, color);
  mono(c, lab, x, y - above, 32, color, 'center');
  mono(c, t, x, y + below, 29, color, 'center');
}
