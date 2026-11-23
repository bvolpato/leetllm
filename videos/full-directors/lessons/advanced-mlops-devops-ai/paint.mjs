export const P = {
  paper: '#f6f2e9',
  white: '#fffdf6',
  ink: '#192e36',
  muted: '#52686a',
  line: '#b5c0b9',
  grid: '#d4d9ce',
  blue: '#13617c',
  aqua: '#007567',
  amber: '#9e5321',
  red: '#af3d39',
  dark: '#15323a',
  ice: '#a9e2de',
  mint: '#c5ebe2',
  peach: '#f5ddc6',
  pink: '#f4d8d3',
};
export function box(c, x, y, w, h, color) {
  c.fillStyle = color;
  c.fillRect(x, y, w, h);
}
export function line(c, x, y, u, v, color = P.line, width = 2, dash = []) {
  c.save();
  c.lineWidth = width;
  c.strokeStyle = color;
  c.setLineDash(dash);
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(u, v);
  c.stroke();
  c.restore();
}
export function dot(c, x, y, r, color, stroke) {
  c.beginPath();
  c.arc(x, y, r, 0, 2 * Math.PI);
  c.fillStyle = color;
  c.fill();
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = 3;
    c.stroke();
  }
}
export function arrow(c, x, y, u, v, color, width = 6, head = 19) {
  const a = Math.atan2(v - y, u - x),
    d = Math.min(head, Math.hypot(v - y, u - x));
  line(c, x, y, u - d * 0.5 * Math.cos(a), v - d * 0.5 * Math.sin(a), color, width);
  c.beginPath();
  c.moveTo(u, v);
  for (const s of [-1, 1])
    c.lineTo(
      u - d * Math.cos(a) + s * d * 0.5 * Math.sin(a),
      v - d * Math.sin(a) - s * d * 0.5 * Math.cos(a),
    );
  c.closePath();
  c.fillStyle = color;
  c.fill();
}
export function txt(
  c,
  s,
  x,
  y,
  size = 36,
  color = P.ink,
  face = 'Sans',
  align = 'left',
  weight = 400,
) {
  c.fillStyle = color;
  c.font = weight + ' ' + size + 'px "Lesson ' + face + '"';
  c.textAlign = align;
  c.textBaseline = 'alphabetic';
  c.fillText(String(s), x, y);
}
export const mono = (c, s, x, y, z = 33, col = P.ink, align = 'left') =>
  txt(c, s, x, y, z, col, 'Mono', align);
export const cap = (c, s, x, y, col = P.muted) => txt(c, s, x, y, 27, col, 'Sans', 'left', 600);
export const serif = (c, s, x, y, size = 53, color = P.ink, align = 'left') =>
  txt(c, s, x, y, size, color, 'Serif', align);
export function stage(c, section, title, note) {
  box(c, 0, 0, 1920, 1080, P.paper);
  box(c, 0, 0, 1920, 14, P.dark);
  cap(c, section, 96, 90);
  mono(c, 'DeployBuddy   /   release engineering', 1824, 90, 25, P.muted, 'right');
  serif(c, title, 92, 198, 70);
  line(c, 96, 240, 1824, 240, P.ink, 2);
  if (note) txt(c, note, 100, 307, 34, P.muted);
}
export function caption(c, s, accent = P.aqua) {
  line(c, 96, 880, 1824, 880, P.line, 2);
  box(c, 96, 911, 9, 52, accent);
  txt(c, s, 131, 953, 43, P.ink, 'Serif');
}
export function fade(c, p, fn) {
  if (p <= 0) return;
  c.save();
  c.globalAlpha *= p;
  fn();
  c.restore();
}
export function cue(clock, beat, phrase, span = 0) {
  if (clock.beat.beatIndex !== beat) return clock.beat.beatIndex > beat ? 1 : 0;
  return clock.reveal(phrase, span);
}
export function travel(c, path, p, color = P.blue) {
  let length = 0;
  const edges = path.slice(1).map(([x, y], i) => {
    const dx = x - path[i][0],
      dy = y - path[i][1],
      n = Math.hypot(dx, dy);
    length += n;
    return { dx, dy, n };
  });
  let left = length * p;
  path.slice(1).forEach(([x, y], i) => line(c, ...path[i], x, y, P.line, 3));
  if (!p) return;
  for (const [i, { dx, dy, n }] of edges.entries()) {
    const [x, y] = path[i],
      t = Math.min(1, left / n);
    const u = x + t * dx,
      v = y + t * dy;
    line(c, x, y, u, v, color, 6);
    left -= n;
    if (left <= 0.001 || i === edges.length - 1) {
      dot(c, u, v, 10, color);
      break;
    }
  }
}
export function stamp(c, x, y, s, col = P.aqua) {
  dot(c, x, y, 33, col);
  txt(c, s, x, y + 13, 38, P.white, 'Mono', 'center', 600);
}
