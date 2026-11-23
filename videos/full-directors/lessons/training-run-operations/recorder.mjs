// Drawing primitives shared by the strip recorder, tensor ruler and timing bench.
export const C = {
  paper: '#f5f0de',
  sheet: '#fffaf0',
  ink: '#152e38',
  dim: '#49616a',
  edge: '#a9b5ab',
  pale: '#d8e3d9',
  teal: '#006f69',
  mint: '#9cdcc0',
  blue: '#245882',
  sky: '#c4d9e8',
  red: '#ab402c',
  peach: '#f5c3a8',
  gold: '#80590b',
  straw: '#f1d68e',
  dark: '#18343e',
  white: '#fffcef',
};
export const fmt = (n) => n.toLocaleString('en-US');
export function text(
  g,
  s,
  x,
  y,
  size = 36,
  color = C.ink,
  align = 'left',
  face = 'Sans',
  weight = 400,
) {
  g.fillStyle = color;
  g.textAlign = align;
  g.textBaseline = 'alphabetic';
  g.font = weight + ' ' + size + 'px "Lesson ' + face + '"';
  g.fillText(String(s), x, y);
}
export const mono = (g, s, x, y, size = 36, color = C.ink, align = 'left') =>
  text(g, s, x, y, size, color, align, 'Mono');
export function fill(g, x, y, w, h, color) {
  g.fillStyle = color;
  g.fillRect(x, y, w, h);
}
export function line(g, x, y, ex, ey, color = C.edge, width = 3) {
  g.strokeStyle = color;
  g.lineWidth = width;
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(ex, ey);
  g.stroke();
}
export function dot(g, x, y, r, color) {
  g.fillStyle = color;
  g.beginPath();
  g.arc(x, y, r, 0, 2 * Math.PI);
  g.fill();
}
export function path(g, points, color, closed = false, width = 4) {
  g.beginPath();
  points.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  if (closed) {
    g.closePath();
    g.fillStyle = color;
    g.fill();
  } else {
    g.strokeStyle = color;
    g.lineWidth = width;
    g.stroke();
  }
}
export function background(g, dark = false) {
  fill(g, 0, 0, 1920, 1080, dark ? C.dark : C.paper);
}
export function heading(g, group, title, dark = false) {
  mono(g, group, 100, 100, 28, dark ? C.mint : C.teal);
  text(g, title, 96, 202, 73, dark ? C.white : C.ink, 'left', 'Serif');
}
export function strip(g, x, y, w, h, bg = C.sheet, hole = C.paper) {
  fill(g, x + 5, y + 9, w, h, '#162f3518');
  fill(g, x, y, w, h, bg);
  for (let xx = x + 21; xx < x + w - 10; xx += 45) {
    dot(g, xx, y + 13, 4.7, hole);
    dot(g, xx, y + h - 13, 4.7, hole);
  }
}
export function pointer(g, x, y, color = C.red) {
  path(
    g,
    [
      [x - 16, y - 23],
      [x + 16, y - 23],
      [x, y],
    ],
    color,
    true,
  );
}
export function ticks(g, x, y, w, div, h = 16, color = C.edge) {
  line(g, x, y, x + w, y, color, 2);
  for (let i = 0; i <= div; i++) line(g, x + (w * i) / div, y, x + (w * i) / div, y + h, color, 2);
}
export function bracket(g, x, y, w, label, color = C.teal, up = false, size = 28) {
  const s = up ? -1 : 1;
  path(
    g,
    [
      [x, y],
      [x, y + 14 * s],
      [x + w, y + 14 * s],
      [x + w, y],
    ],
    color,
    false,
    4,
  );
  if (label !== null) mono(g, label, x + w / 2, y + (up ? -26 : 52), size, color, 'center');
}
export function screw(g, x, y) {
  dot(g, x, y, 9, '#8da7a5');
  line(g, x - 5, y + 4, x + 5, y - 4, C.dark, 2);
}
export function words(g, lines, x, y, size = 34, color = C.dim, pitch = size * 1.38) {
  lines.forEach((s, i) => text(g, s, x, y + i * pitch, size, color));
}
// Earlier chapter beats retain their completed cue state when the clock advances.
export function cue(k, beat, phrase, duration = 0) {
  const b = k.beat.beatIndex;
  return b < beat ? 0 : b > beat ? 1 : k.reveal(phrase, duration);
}

export function afterCue(k, beat, phrase, duration = 0) {
  const b = k.beat.beatIndex;
  if (b !== beat) return Number(b > beat);
  // Start the caption on the spoken clause. The picture waits until that clause ends.
  k.reveal(phrase, 0, { captionStart: phrase });
  const elapsed = k.elapsed - k.wordCue(phrase).end + 1e-9;
  if (elapsed < 0) return 0;
  return duration ? Math.min(1, elapsed / duration) : 1;
}
