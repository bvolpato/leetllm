import { CORPUS } from '../../../films/production-retrieval/fixtures.mjs';
// All positions are in the 1200 × 675 drawing space.
export const C = {
  night: '#182c36',
  deep: '#10212b',
  sky: '#adc8cb',
  cream: '#fff3d7',
  paper: '#f6e8c7',
  ink: '#23353a',
  dim: '#4b6467',
  teal: '#166860',
  mint: '#88d7b9',
  gold: '#ffd178',
  red: '#98423c',
  coral: '#ffa499',
  rule: '#c5b99a',
  blue: '#345f7a',
  white: '#fffaf0',
};
export function box(c, x, y, w, h, color, r = 0) {
  c.fillStyle = color;
  if (!r) {
    c.fillRect(x, y, w, h);
    return;
  }
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  c.fill();
}
export function line(c, x, y, u, v, color, width = 2) {
  c.strokeStyle = color;
  c.lineWidth = width;
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(u, v);
  c.stroke();
}
export function circle(c, x, y, r, color) {
  c.beginPath();
  c.arc(x, y, r, 0, 2 * Math.PI);
  c.fillStyle = color;
  c.fill();
}
export function poly(c, pts, color) {
  c.fillStyle = color;
  c.beginPath();
  pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  c.fill();
}
export function txt(
  c,
  s,
  x,
  y,
  n = 24,
  color = C.ink,
  face = 'Sans',
  weight = 500,
  align = 'left',
) {
  c.font = weight + ' ' + n + 'px "Lesson ' + face + '"';
  c.textAlign = align;
  c.textBaseline = 'alphabetic';
  c.fillStyle = color;
  c.fillText(String(s), x, y);
}
export function para(c, s, x, y, w, n = 26, color = C.ink, face = 'Serif', step = 1.32) {
  c.font = '500 ' + n + 'px "Lesson ' + face + '"';
  let row = '';
  for (const word of s.split(' ')) {
    const next = row ? row + ' ' + word : word;
    if (row && c.measureText(next).width > w) {
      txt(c, row, x, y, n, color, face);
      y += n * step;
      row = word;
    } else row = next;
  }
  if (row) txt(c, row, x, y, n, color, face);
  return y;
}
export function small(c, s, x, y, color = C.dim, n = 16) {
  txt(c, s, x, y, n, color, 'Mono', 600);
}
export function title(c, s, x = 56, y = 76, n = 41) {
  txt(c, s, x, y, n, C.cream, 'Serif', 500);
}
export function desk(c) {
  const g = c.createLinearGradient(0, 0, 1150, 680);
  g.addColorStop(0, '#24424a');
  g.addColorStop(0.6, C.night);
  g.addColorStop(1, '#10232f');
  box(c, 0, 0, 1200, 675, g);
  for (let i = 0; i < 17; i++) line(c, i * 120 - 540, 675, i * 120 + 50, 0, '#ffffff05', 2);
}
export function paper(c, x, y, w, h, shade = C.paper) {
  box(c, x + 6, y + 8, w, h, '#0b1a244f', 4);
  box(c, x, y, w, h, shade, 3);
  line(c, x + 3, y + 2, x + w - 3, y + 2, '#ffffff81', 2);
  line(c, x + 1, y + h - 3, x + w - 1, y + h - 3, '#9b8c7142', 2);
}
export function key(c, x, y, s = 1, color = C.red) {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  c.strokeStyle = color;
  c.lineWidth = 4;
  c.beginPath();
  c.arc(-11, 0, 7, 0, Math.PI * 2);
  c.stroke();
  line(c, -4, 0, 19, 0, color, 4);
  line(c, 17, 0, 17, 9, color, 4);
  line(c, 10, 1, 10, 6, color, 4);
  c.restore();
}
export function browser(c, x, y, s = 1, color = C.blue) {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  c.strokeStyle = color;
  c.lineWidth = 3;
  c.strokeRect(-18, -12, 36, 24);
  line(c, -18, -5, 18, -5, color, 2);
  circle(c, -12, -9, 1.5, color);
  c.restore();
}
export function tab(c, s, x, y, bg = C.teal, fg = C.white) {
  const w = Math.max(49, String(s).length * 11 + 23);
  box(c, x, y - 22, w, 34, bg, 4);
  txt(c, s, x + w / 2, y + 1, 18, fg, 'Mono', 600, 'center');
  return w;
}
export function cursor(c, x, y) {
  const pts = [
    [0, 0],
    [5, 34],
    [13, 24],
    [21, 36],
    [27, 32],
    [19, 20],
    [32, 17],
  ];
  poly(
    c,
    pts.map(([a, b]) => [a + x, b + y]),
    C.deep,
  );
  c.save();
  c.translate(x + 3, y + 4);
  c.scale(0.74, 0.74);
  poly(c, pts, C.white);
  c.restore();
}
export function thread(c, x, y, u, v, color = C.gold) {
  const m = (x + u) / 2;
  c.strokeStyle = color;
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(x, y);
  c.bezierCurveTo(m, y, m, v, u, v);
  c.stroke();
  for (const [a, b] of [
    [x, y],
    [u, v],
  ]) {
    circle(c, a, b, 6, color);
    circle(c, a, b, 2, C.deep);
  }
}
export function seal(c, s, x, y, color = C.teal) {
  c.font = '700 21px "Lesson Mono"';
  const w = c.measureText(s).width + 26;
  c.save();
  c.translate(x, y);
  c.rotate(-0.035);
  c.strokeStyle = color;
  c.lineWidth = 2.5;
  c.strokeRect(0, -26, w, 37);
  txt(c, s, 13, 0, 21, color, 'Mono', 700);
  c.restore();
}
export function source(c, x, y, w, h, kind = 'key', label = '', opts = {}) {
  const isKey = kind === 'key',
    color = isKey ? C.red : C.blue;
  paper(c, x, y, w, h);
  box(c, x, y, 9, h, color);
  (isKey ? key : browser)(c, x + 44, y + 44, 0.85, color);
  small(c, isKey ? 'EU ACCESS POLICY' : 'EU SESSION POLICY', x + 77, y + 50, color);
  if (label) tab(c, label, x + w - 82, y + 48, color);
  line(c, x + 27, y + 76, x + w - 26, y + 76, C.rule);
  txt(c, isKey ? 'Key rotation' : 'Idle timeout', x + 28, y + 122, 35, C.ink, 'Serif');
  const body = CORPUS[isKey ? 0 : 3].text;
  para(c, body, x + 28, y + 169, w - 56, opts.size ?? 23);
  if (opts.meta) small(c, opts.meta, x + 28, y + h - 22, C.dim, 14);
}
export const mix = (a, b, t) => a + (b - a) * t;
export const ease = (t) => t * t * (3 - 2 * t);
export function cues(clock) {
  const beat = clock.beat.beatIndex + 1;
  const at = (n, phrase, duration = 0) =>
    beat === n ? clock.reveal(phrase, duration) : Number(beat > n);
  return { beat, at };
}
export function row(c, x, y, w, label, value, accent = C.teal) {
  line(c, x, y + 12, x + w, y + 12, C.rule, 1);
  txt(c, label, x, y, 21, C.ink);
  txt(c, value, x + w, y, 21, accent, 'Mono', 600, 'right');
}
