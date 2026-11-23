// Screen coordinates leave the lower strip clear for course captions.
export const C = {
  paper: '#f6f1e5',
  ink: '#172e32',
  muted: '#526665',
  grid: '#c8c9bb',
  scope: '#102f35',
  gridDark: '#2a494c',
  light: '#f3eee0',
  faint: '#adc9c3',
  a: '#34619a',
  b: '#ac422c',
  teal: '#147567',
  amber: '#f8c063',
  mint: '#8fdfc4',
  blue: '#9ac5ff',
  salmon: '#ffa98a',
  white: '#fffdf4',
};
export function text(
  g,
  str,
  x,
  y,
  size = 36,
  color = C.ink,
  align = 'left',
  face = 'Sans',
  weight = 400,
) {
  g.font = weight + ' ' + size + 'px "Lesson ' + face + '"';
  g.textAlign = align;
  g.textBaseline = 'middle';
  g.fillStyle = color;
  g.fillText(String(str), x, y);
}
export function mono(g, str, x, y, size = 32, color = C.ink, align = 'left') {
  text(g, str, x, y, size, color, align, 'Mono');
}
export function box(g, x, y, w, h, fill, stroke = null, r = 0) {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
  if (fill) {
    g.fillStyle = fill;
    g.fill();
  }
  if (stroke) {
    g.lineWidth = 2;
    g.strokeStyle = stroke;
    g.stroke();
  }
}
export function path(g, pts, ink, width = 3, dash = []) {
  g.save();
  g.strokeStyle = ink;
  g.lineWidth = width;
  g.lineJoin = 'round';
  g.setLineDash(dash);
  g.beginPath();
  pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.stroke();
  g.restore();
}
export function line(g, x, y, x2, y2, ink = C.grid, w = 2, dash = []) {
  path(
    g,
    [
      [x, y],
      [x2, y2],
    ],
    ink,
    w,
    dash,
  );
}
export function dot(g, x, y, r, fill, edge = null) {
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fillStyle = fill;
  g.fill();
  if (edge) {
    g.strokeStyle = edge;
    g.lineWidth = 3;
    g.stroke();
  }
}
export function hatch(g, x, y, w, h, color, step = 18) {
  g.save();
  g.beginPath();
  g.rect(x, y, w, h);
  g.clip();
  for (let z = x - h; z < x + w; z += step) line(g, z, y + h, z + h, y, color, 2);
  g.restore();
}
export function bracket(g, x0, x1, y, label, color, up = false) {
  const dy = up ? -18 : 18;
  path(
    g,
    [
      [x0, y + dy],
      [x0, y],
      [x1, y],
      [x1, y + dy],
    ],
    color,
    3,
  );
  mono(g, label, (x0 + x1) / 2, y - dy * 1.7, 30, color, 'center');
}
export function page(g, heading, material, scope = false) {
  const bg = scope ? C.scope : C.paper,
    ink = scope ? C.light : C.ink;
  g.fillStyle = bg;
  g.fillRect(0, 0, 1920, 1080);
  text(g, material, 84, 62, 28, scope ? C.mint : C.teal, 'left', 'Mono', 600);
  text(g, heading, 80, 144, 68, ink, 'left', 'Serif');
  line(g, 82, 207, 1838, 207, scope ? C.gridDark : C.grid, 3);
}
export function note(g, words, scope = false, y = 940) {
  const color = scope ? C.faint : C.muted;
  line(g, 84, y - 45, 1836, y - 45, scope ? C.gridDark : C.grid);
  text(g, words, 86, y, 34, color);
}
export function cue(c, idx, phrase, span = 0) {
  const beat = c.beat.beatIndex;
  return beat === idx ? c.reveal(phrase, span) : Number(beat > idx);
}
export function phraseProgress(c, idx, phrase, captionStart = false) {
  const beat = c.beat.beatIndex;
  if (beat !== idx) return Number(beat > idx);
  const { start, end } = c.wordCue(phrase);
  return c.reveal(phrase, end - start, { captionStart });
}
export function after(c, idx, phrase, captionStart) {
  return phraseProgress(c, idx, phrase, captionStart) === 1;
}
export function lerp(a, b, t) {
  return a + (b - a) * t;
}
export function f(v, d = 2) {
  return Number(v.toFixed(d)).toString();
}
