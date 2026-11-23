// The dark field and its pale ruled paper share one set of colors for ready, running and lost work.
export const C = {
  sky: '#112831',
  lower: '#183640',
  ink: '#102a33',
  paper: '#f7efdc',
  pale: '#dce7df',
  white: '#f9f4df',
  muted: '#a6c2bf',
  seam: '#547579',
  aqua: '#87ddc9',
  orange: '#ffb68a',
  lost: '#ff9888',
  blue: '#97bbeb',
  faint: '#294751',
};
export const serif = 'Lesson Serif',
  sans = 'Lesson Sans',
  mono = 'Lesson Mono';
export function rect(g, x, y, w, h, color) {
  g.fillStyle = color;
  g.fillRect(x, y, w, h);
}
export function line(g, x, y, x2, y2, color = C.seam, width = 3, dashes = []) {
  g.save();
  g.strokeStyle = color;
  g.lineWidth = width;
  g.setLineDash(dashes);
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(x2, y2);
  g.stroke();
  g.restore();
}
export function outline(g, x, y, w, h, color = C.seam, width = 3) {
  g.strokeStyle = color;
  g.lineWidth = width;
  g.strokeRect(x, y, w, h);
}
export function circ(g, x, y, r, color) {
  g.fillStyle = color;
  g.beginPath();
  g.arc(x, y, r, 0, 2 * Math.PI);
  g.fill();
}
export function poly(g, points, color) {
  g.fillStyle = color;
  g.beginPath();
  points.forEach(([x, y], i) => (i === 0 ? g.moveTo(x, y) : g.lineTo(x, y)));
  g.closePath();
  g.fill();
}
export function label(
  g,
  s,
  x,
  y,
  size = 42,
  color = C.white,
  font = sans,
  align = 'left',
  weight = 500,
) {
  g.font = weight + ' ' + size + 'px "' + font + '"';
  g.textAlign = align;
  g.textBaseline = 'alphabetic';
  g.fillStyle = color;
  g.fillText(String(s), x, y);
}
export function center(g, s, x, y, size, color, font) {
  label(g, s, x, y, size, color, font, 'center');
}
export function header(g, topic, question) {
  rect(g, 0, 0, 1920, 1080, C.sky);
  label(g, topic, 86, 97, 34, C.aqua, mono);
  label(g, question, 80, 204, 76, C.white, serif);
  line(g, 82, 247, 1838, 247);
}
export function foot(g, s, color = C.muted) {
  line(g, 82, 900, 1838, 900);
  label(g, s, 85, 977, 44, color);
}
export function paper(g, x, y, w, h) {
  rect(g, x + 9, y + 10, w, h, '#0a2028');
  rect(g, x, y, w, h, C.paper);
}
export function arrow(g, x, y, x2, color = C.aqua) {
  line(g, x, y, x2 - 12, y, color, 4);
  poly(
    g,
    [
      [x2, y],
      [x2 - 22, y - 12],
      [x2 - 22, y + 12],
    ],
    color,
  );
}
export const mix = (a, b, t) => a + (b - a) * t;
// Each cue belongs to one beat. Its settled value is available on later beats, including random seeks.
export function cue(c, b, phrase, seconds = 0) {
  if (c.beat.beatIndex !== b) return c.beat.beatIndex > b ? 1 : 0;
  return c.reveal(phrase, seconds);
}
