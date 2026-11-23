export const C = {
  paper: '#f7f2e6',
  white: '#fffdf3',
  ink: '#172f35',
  dim: '#536b6b',
  line: '#afc0b6',
  grid: '#e4e3d6',
  brass: '#ad5721',
  gold: '#efac60',
  paleGold: '#f9dfae',
  blue: '#1e6283',
  paleBlue: '#b7d9e4',
  teal: '#267264',
  mint: '#afd3b8',
  fault: '#ae3944',
  rose: '#f9c9bc',
};
export const clamp = (x) => Math.max(0, Math.min(1, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const num = (n) => n.toLocaleString('en-US');
export function txt(
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
  g.font = weight + ' ' + size + 'px "Lesson ' + face + '"';
  g.textBaseline = 'middle';
  g.textAlign = align;
  g.fillStyle = color;
  g.fillText(String(s), x, y);
}
export function box(g, x, y, w, h, fill, edge = null, sw = 2) {
  if (fill) {
    g.fillStyle = fill;
    g.fillRect(x, y, w, h);
  }
  if (edge) {
    g.strokeStyle = edge;
    g.lineWidth = sw;
    g.strokeRect(x, y, w, h);
  }
}
export function path(g, points, color = C.line, width = 3, dashed = false) {
  g.save();
  g.beginPath();
  g.setLineDash(dashed ? [9, 8] : []);
  points.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.strokeStyle = color;
  g.lineWidth = width;
  g.stroke();
  g.restore();
}
export function arrow(g, x1, y1, x2, y2, color = C.dim, width = 4) {
  path(
    g,
    [
      [x1, y1],
      [x2, y2],
    ],
    color,
    width,
  );
  const a = Math.atan2(y2 - y1, x2 - x1),
    l = 14 + width;
  path(
    g,
    [
      [x2 - l * Math.cos(a - 0.5), y2 - l * Math.sin(a - 0.5)],
      [x2, y2],
      [x2 - l * Math.cos(a + 0.5), y2 - l * Math.sin(a + 0.5)],
    ],
    color,
    width,
  );
}
export function dot(g, x, y, r, color, diamond = false) {
  g.beginPath();
  if (diamond) {
    g.moveTo(x, y - r);
    g.lineTo(x + r, y);
    g.lineTo(x, y + r);
    g.lineTo(x - r, y);
    g.closePath();
  } else g.arc(x, y, r, 0, Math.PI * 2);
  g.fillStyle = color;
  g.fill();
}
export function base(g, area, title, sub = '') {
  box(g, 0, 0, 1920, 1080, C.paper);
  for (let x = 35; x < 1920; x += 48)
    for (let y = 220; y < 905; y += 48) box(g, x, y, 2, 2, C.grid);
  txt(g, area.toUpperCase(), 80, 55, 29, C.teal, 'left', 'Mono', 600);
  txt(g, title, 76, 131, 68, C.ink, 'left', 'Serif');
  path(
    g,
    [
      [80, 193],
      [1840, 193],
    ],
    C.line,
    2,
  );
  if (sub) txt(g, sub, 82, 235, 33, C.dim);
}
export function foot(g, s, sub = '') {
  path(
    g,
    [
      [80, 828],
      [1840, 828],
    ],
    C.line,
    2,
  );
  txt(g, s, 80, 880, 42, C.ink, 'left', 'Serif');
  if (sub) txt(g, sub, 82, 942, 29, C.dim);
}
export function chip(g, x, y, w, h, fill, edge, tag = '') {
  for (let i = 15; i < w - 7; i += 18) {
    box(g, x + i, y - 9, 6, 10, edge);
    box(g, x + i, y + h - 1, 6, 10, edge);
  }
  box(g, x, y, w, h, fill, edge, 3);
  box(g, x + 7, y + 7, w - 14, h - 14, null, edge, 1);
  if (tag) txt(g, tag, x + w / 2, y + h / 2, Math.min(40, h * 0.49), C.ink, 'center', 'Mono', 600);
}
export function cue(clock, beatId, words, secs = 0) {
  return clock.beat.id === beatId ? clock.reveal(words, secs) : 0;
}
