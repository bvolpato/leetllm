// Colors stay attached to semantic options even when the caller moves their letters.
export const ink = '#182f32',
  night = '#132b2d',
  dark = '#0c2022',
  white = '#f9f1d9';
export const paper = '#f1ead5',
  edge = '#bfbcaa',
  muted = '#536964',
  soft = '#afc5b8';
export const gold = '#efc75c',
  amber = '#835211',
  signal = '#b4f097',
  red = '#aa493b';
export const pigments = ['#395e94', '#197365', '#965170', '#735646'];
export const lights = ['#a8bff4', '#91e2bf', '#efaaca', '#ecc799'];
export function text(
  g,
  s,
  x,
  y,
  size = 18,
  color = ink,
  kind = 'Sans',
  weight = 500,
  align = 'left',
) {
  g.fillStyle = color;
  g.font = weight + ' ' + size + 'px "Lesson ' + kind + '"';
  g.textAlign = align;
  g.textBaseline = 'alphabetic';
  g.fillText(String(s), x, y);
}
export const mono = (g, s, x, y, size = 18, color = ink, align = 'left') =>
  text(g, s, x, y, size, color, 'Mono', 500, align);
export const serif = (g, s, x, y, size = 35, color = ink) =>
  text(g, s, x, y, size, color, 'Serif', 500);
export function rect(g, x, y, w, h, color, r = 0) {
  g.fillStyle = color;
  g.beginPath();
  g.roundRect(x, y, w, h, r);
  g.fill();
}
export function line(g, x, y, xx, yy, color, width = 1, dash = []) {
  g.strokeStyle = color;
  g.lineWidth = width;
  g.setLineDash(dash);
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(xx, yy);
  g.stroke();
  g.setLineDash([]);
}
export function path(g, points, fill) {
  g.fillStyle = fill;
  g.beginPath();
  points.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.closePath();
  g.fill();
}
export function dot(g, x, y, r, fill) {
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fillStyle = fill;
  g.fill();
}
export function arrow(g, x, y, xx, yy, color, width = 3, head = 11) {
  const a = Math.atan2(yy - y, xx - x);
  line(g, x, y, xx - Math.cos(a) * head * 0.6, yy - Math.sin(a) * head * 0.6, color, width);
  path(
    g,
    [
      [xx, yy],
      [xx - Math.cos(a - 0.49) * head, yy - Math.sin(a - 0.49) * head],
      [xx - Math.cos(a + 0.49) * head, yy - Math.sin(a + 0.49) * head],
    ],
    color,
  );
}
export function opacity(g, amount, painter) {
  if (amount <= 0) return;
  g.save();
  g.globalAlpha *= amount;
  painter();
  g.restore();
}
export function stock(g, dim = false) {
  rect(g, 0, 0, 960, 540, dim ? night : paper);
  for (let y = 3; y < 540; y += 8) line(g, 0, y, 960, y, dim ? '#183032' : '#eae4d0', 0.35);
}
export function heading(g, context, title, dim = false) {
  mono(g, context, 38, 43, 15, dim ? soft : muted);
  serif(g, title, 36, 96, 38, dim ? white : ink);
}
export const letters = ['A', 'B', 'C', 'D'];
export const names = [
  'Test regression',
  'Registry authentication',
  'Insufficient evidence',
  'Compile failure',
];
export function key(g, id, x, y, darkMode = false) {
  rect(g, x, y - 22, 30, 31, darkMode ? lights[id] : pigments[id], 4);
  mono(g, letters[id], x + 15, y + 1, 20, darkMode ? dark : white, 'center');
}
export function cue(clock, beat, phrase, duration = 0) {
  const i = clock.beat.beatIndex;
  if (i !== beat) return Number(i > beat);
  return clock.reveal(phrase, duration);
}
export function afterCue(clock, beat, phrase, duration = 0) {
  const i = clock.beat.beatIndex;
  if (i !== beat) return Number(i > beat);
  const { start, end } = clock.wordCue(phrase);
  if (clock.reveal(phrase, end - start, { captionStart: phrase }) < 1) return 0;
  return duration ? Math.min(1, Math.max(0, (clock.elapsed - end) / duration)) : 1;
}
export const mix = (a, b, t) => a + (b - a) * t;
export const fmt = (v, n = 3) => v.toFixed(n).replace('-', '−');
export const pct = (v) => (v * 100).toFixed(1) + '%';
