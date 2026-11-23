// Coordinates are in the host's 1920 by 1080 canvas.
export const C = {
  paper: '#f3f0e7',
  white: '#fffcf3',
  ink: '#122e37',
  muted: '#4e676a',
  line: '#a9b7ac',
  teal: '#0d6862',
  pale: '#c8e3d7',
  gold: '#f4be51',
  rust: '#a74929',
  rose: '#eed0bc',
  blue: '#345d83',
  sky: '#d5e2ed',
  dark: '#183a40',
};
export const mix = (a, b, t) => a + (b - a) * t;
export const smooth = (t) => t * t * (3 - 2 * t);
export const fmt = (x) => x.toLocaleString('en-US', { maximumFractionDigits: 2 });
export const vector = (vals) => '[' + vals.map(fmt).join(', ') + ']';
export function cue(clock, beat, phrase, seconds = 0) {
  const b = clock.beat.beatIndex;
  return b === beat ? clock.reveal(phrase, seconds) : Number(b > beat);
}
export function alpha(g, amount, paint) {
  if (amount <= 0) return;
  g.save();
  g.globalAlpha *= amount;
  paint();
  g.restore();
}
export function text(
  g,
  value,
  x,
  y,
  size = 40,
  color = C.ink,
  align = 'left',
  face = 'Sans',
  weight = 500,
) {
  g.font = weight + ' ' + size + 'px "Lesson ' + face + '"';
  g.fillStyle = color;
  g.textAlign = align;
  g.textBaseline = 'middle';
  g.fillText(String(value), x, y);
}
export function mono(g, value, x, y, size = 38, color = C.ink, align = 'center') {
  text(g, value, x, y, size, color, align, 'Mono', 500);
}
export function rect(g, x, y, w, h, fill, stroke, width = 2, radius = 0) {
  g.beginPath();
  if (radius) g.roundRect(x, y, w, h, radius);
  else g.rect(x, y, w, h);
  if (fill) {
    g.fillStyle = fill;
    g.fill();
  }
  if (stroke) {
    g.strokeStyle = stroke;
    g.lineWidth = width;
    g.stroke();
  }
}
export function path(g, points, color = C.ink, width = 3, dash = []) {
  g.save();
  g.beginPath();
  points.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.strokeStyle = color;
  g.lineWidth = width;
  g.lineJoin = 'round';
  g.lineCap = 'round';
  g.setLineDash(dash);
  g.stroke();
  g.restore();
}
export function dot(g, x, y, r, fill, stroke, width = 2) {
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fillStyle = fill;
  g.fill();
  if (stroke) {
    g.strokeStyle = stroke;
    g.lineWidth = width;
    g.stroke();
  }
}
export function hatch(g, x, y, w, h, color = C.line) {
  g.save();
  g.beginPath();
  g.rect(x, y, w, h);
  g.clip();
  for (let i = -h; i < w; i += 16)
    path(
      g,
      [
        [x + i, y + h],
        [x + i + h, y],
      ],
      color,
      2,
    );
  g.restore();
}
export function card(g, x, y, w, h, fill = C.white) {
  rect(g, x, y + 7, w, h, '#19363025', null, 2, 12);
  rect(g, x, y, w, h, fill, C.ink, 2.5, 12);
}
export function board(g, x, y, w, h, name) {
  card(g, x, y, w, h, C.dark);
  for (const dx of [20, w - 20])
    for (const dy of [20, h - 20]) {
      dot(g, x + dx, y + dy, 7, '#bad0bd');
      dot(g, x + dx, y + dy, 3, C.dark);
    }
  for (let i = 0; i < Math.min(18, Math.floor(w / 26)); i++) {
    rect(g, x + 45 + i * 23, y + h - 12, 14, 11, '#cfa55a');
  }
  text(g, name, x + 45, y + 49, 34, C.white, 'left', 'Sans', 700);
}
export function chip(g, x, y, w, h, label, fill = C.white, ink = C.ink) {
  for (let i = 15; i < w - 9; i += 22)
    for (const dy of [-9, h]) rect(g, x + i, y + dy, 7, 9, '#b49e6f');
  rect(g, x, y, w, h, fill, ink, 2, 7);
  mono(g, label, x + w / 2, y + h / 2, 36, ink);
}
export function row(g, x, y, label, fill = C.gold, w = 238) {
  rect(g, x - w / 2 + 2, y - 33, w, 72, '#102e3630', null, 2, 8);
  rect(g, x - w / 2, y - 38, w, 72, fill, C.ink, 3, 8);
  mono(g, label, x, y - 1, 35, C.ink);
}
export function linePoint(points, t) {
  const lengths = points
    .slice(1)
    .map(([x, y], i) => Math.hypot(x - points[i][0], y - points[i][1]));
  let d = lengths.reduce((a, b) => a + b, 0) * smooth(t);
  for (const [i, len] of lengths.entries()) {
    if (d <= len)
      return [
        mix(points[i][0], points[i + 1][0], d / len),
        mix(points[i][1], points[i + 1][1], d / len),
      ];
    d -= len;
  }
  return points.at(-1);
}
export function scene(g, chapter, title) {
  rect(g, 0, 0, 1920, 1080, C.paper);
  text(g, 'DeepEP', 90, 69, 35, C.ink, 'left', 'Serif', 700);
  path(
    g,
    [
      [231, 49],
      [231, 87],
    ],
    C.line,
    2,
  );
  text(g, chapter, 255, 69, 30, C.muted);
  path(
    g,
    [
      [90, 112],
      [1830, 112],
    ],
    C.ink,
    2,
  );
  text(g, title, 90, 190, 64, C.ink, 'left', 'Serif', 500);
}
export function note(g, message, color = C.ink) {
  path(
    g,
    [
      [90, 840],
      [1830, 840],
    ],
    C.line,
    2,
  );
  text(g, message, 96, 890, 39, color);
}
