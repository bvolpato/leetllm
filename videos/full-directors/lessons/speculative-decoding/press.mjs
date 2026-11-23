export const C = {
  paper: '#f7f1e4',
  white: '#fffaf0',
  ink: '#202f36',
  quiet: '#596668',
  rule: '#afa99b',
  bed: '#e3dccd',
  draft: '#76578f',
  pencil: '#967c9f',
  violet: '#e4d9e8',
  keep: '#196960',
  green: '#c8e0ce',
  repair: '#a75222',
  gold: '#edbc75',
  red: '#9c413b',
};
export const fmt = (value, digits = 2) => value.toFixed(digits);
export const pct = (value, digits = 0) => fmt(100 * value, digits) + '%';
export function text(
  g,
  value,
  x,
  y,
  size = 44,
  color = C.ink,
  family = 'Sans',
  align = 'left',
  weight = 400,
) {
  g.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  g.fillStyle = color;
  g.textAlign = align;
  g.textBaseline = 'alphabetic';
  g.fillText(String(value), x, y);
}
export function line(g, x, y, x2, y2, color = C.rule, width = 3, dash = []) {
  g.save();
  g.strokeStyle = color;
  g.lineWidth = width;
  g.setLineDash(dash);
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(x2, y2);
  g.stroke();
  g.restore();
}
export function rect(g, x, y, w, h, color, edge) {
  if (color) {
    g.fillStyle = color;
    g.fillRect(x, y, w, h);
  }
  if (edge) {
    g.strokeStyle = edge;
    g.lineWidth = 3;
    g.strokeRect(x, y, w, h);
  }
}
export function shape(g, points, fill) {
  g.fillStyle = fill;
  g.beginPath();
  points.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.closePath();
  g.fill();
}
export function fade(g, opacity, painter) {
  if (opacity <= 0) return;
  g.save();
  g.globalAlpha *= opacity;
  painter();
  g.restore();
}
// Each cue belongs to one chapter-local beat. A zero span switches a discrete fact on its spoken word.
export function cue(c, beat, phrase, span = 0) {
  const i = c.beat.beatIndex;
  return i === beat ? c.reveal(phrase, span) : Number(i > beat);
}
export function page(g, kicker, title) {
  rect(g, 0, 0, 1920, 1080, C.paper);
  line(g, 100, 97, 1820, 97, C.rule, 2);
  text(g, kicker, 103, 77, 30, C.quiet, 'Mono');
  text(g, title, 97, 209, 83, C.ink, 'Serif');
}
export function note(g, value, color = C.ink) {
  line(g, 100, 840, 1820, 840, C.rule, 2);
  text(g, value, 104, 905, 43, color);
}
export function bracket(g, start, end, y, caption, color = C.quiet) {
  line(g, start, y, end, y, color);
  line(g, start, y - 10, start, y, color);
  line(g, end, y - 10, end, y, color);
  text(g, caption, (start + end) / 2, y + 46, 34, color, 'Sans', 'center', 500);
}
export function slug(g, x, y, w, h, face, side = C.rule) {
  shape(
    g,
    [
      [x, y + h],
      [x + w, y + h],
      [x + w + 10, y + h - 11],
      [x + w + 10, y - 11],
      [x + 10, y - 11],
      [x, y],
    ],
    side,
  );
  rect(g, x, y, w, h, face);
}
export function arrow(g, x, y, ex, ey, color = C.quiet) {
  line(g, x, y, ex, ey, color, 4);
  const a = Math.atan2(ey - y, ex - x);
  shape(
    g,
    [
      [ex, ey],
      [ex - 20 * Math.cos(a - 0.43), ey - 20 * Math.sin(a - 0.43)],
      [ex - 20 * Math.cos(a + 0.43), ey - 20 * Math.sin(a + 0.43)],
    ],
    color,
  );
}
export function hatches(g, x, y, w, h, color) {
  g.save();
  g.beginPath();
  g.rect(x, y, w, h);
  g.clip();
  for (let offset = -h; offset < w; offset += 22)
    line(g, x + offset, y + h, x + offset + h, y, color, 3);
  g.restore();
}
