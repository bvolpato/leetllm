// These dimensions describe a 960 by 540 composing surface. The host paints it at twice that size.
export const ink = '#202c2b',
  milk = '#f4eddb',
  dim = '#bdbdab',
  brass = '#efbb69';
export const teal = '#a4d7c7',
  red = '#faac9c',
  well = '#142322';
export const stock = ['#a0c3ce', '#e6bd73', '#b2c8a0', '#d6afa2', '#afbddb', '#c7b4ce'];
export const clamp = (v) => Math.max(0, Math.min(1, v));
export const mix = (a, b, t) => a + (b - a) * t;
export const beat = (k) => k.beat.beatIndex + 1;
export const smooth = (p) => p * p * (3 - 2 * p);
export function cue(k, b, phrase, span = 0.6, captionStart) {
  if (beat(k) !== b) return beat(k) > b ? 1 : 0;
  return smooth(k.reveal(phrase, span, { captionStart }));
}
export function spokenClause(k, phrase) {
  const { start, end } = k.wordCue(phrase);
  return k.reveal(phrase, end - start, { captionStart: phrase });
}
export function rect(c, x, y, w, h, color) {
  c.fillStyle = color;
  c.fillRect(x, y, w, h);
}
export function line(c, x1, y1, x2, y2, color = dim, width = 1) {
  c.strokeStyle = color;
  c.lineWidth = width;
  c.beginPath();
  c.moveTo(x1, y1);
  c.lineTo(x2, y2);
  c.stroke();
}
export function poly(c, points, color) {
  c.fillStyle = color;
  c.beginPath();
  points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  c.fill();
}
export function text(
  c,
  value,
  x,
  y,
  size = 20,
  color = milk,
  align = 'left',
  family = 'Sans',
  max = Infinity,
) {
  c.fillStyle = color;
  c.font = size + 'px "Lesson ' + family + '"';
  c.textBaseline = 'middle';
  c.textAlign = align;
  if (Number.isFinite(max)) c.fillText(String(value), x, y, max);
  else c.fillText(String(value), x, y);
}
export function mono(c, v, x, y, s = 18, color = milk, align = 'left', max = Infinity) {
  text(c, v, x, y, s, color, align, 'Mono', max);
}
export function name(c, v, x, y, s = 26, color = milk, align = 'left', max = Infinity) {
  text(c, v, x, y, s, color, align, 'Serif', max);
}
export function background(c, title) {
  const g = c.createLinearGradient(0, 0, 920, 540);
  g.addColorStop(0, '#30413b');
  g.addColorStop(0.6, '#253431');
  g.addColorStop(1, '#1d2c2b');
  rect(c, 0, 0, 960, 540, g);
  name(c, title, 40, 43, 35, milk, 'left', 878);
  line(c, 40, 75, 920, 75, '#7e8877');
}
export function foot(c, code, { x = 480, y = 429, max = 871 } = {}) {
  line(c, 40, 443, 920, 443, '#7e8877');
  mono(c, code, x, y, 20, milk, 'center', max);
}
export function tray(c, x, y, w, h) {
  rect(c, x - 3, y + 5, w + 6, h, '#14201e');
  const rim = c.createLinearGradient(x, y, x + w, y + h);
  rim.addColorStop(0, '#c1b59e');
  rim.addColorStop(0.36, '#728078');
  rim.addColorStop(1, '#494f45');
  rect(c, x - 3, y - 3, w + 6, h + 3, rim);
  rect(c, x, y, w, h, well);
}
export function paper(c, x, y, w, h) {
  rect(c, x + 3, y + 5, w, h, '#182521');
  const sheet = c.createLinearGradient(x, y, x + w, y + h);
  sheet.addColorStop(0, '#f8eed4');
  sheet.addColorStop(0.74, '#f0e5c8');
  sheet.addColorStop(1, '#e1d4b5');
  rect(c, x, y, w, h, sheet);
  rect(c, x, y, 5, h, '#bb8d59');
  line(c, x + 11, y + 8, x + w - 8, y + 8, '#d3c3a1');
}
export function sort(c, x, y, w, h, value, color, active = false) {
  const face = color ?? '#dfdaca';
  rect(c, x + 1, y + 4, w - 2, h - 3, '#101b1b');
  rect(c, x + 1, y + 1, w - 3, h - 6, face);
  const metal = c.createLinearGradient(x, y, x + w * 0.82, y + h);
  metal.addColorStop(0, '#ffffff45');
  metal.addColorStop(0.34, '#ffffff08');
  metal.addColorStop(0.7, '#222b2212');
  metal.addColorStop(1, '#15211e33');
  rect(c, x + 1, y + 1, w - 3, h - 6, metal);
  rect(c, x + 2, y + 2, w - 5, 2, '#ffffff66');
  rect(c, x + 2, y + h - 10, w - 5, 5, '#00000020');
  // A nick on each metal sort shows the orientation of the face.
  rect(c, x + w * 0.24, y + h - 9, w * 0.12, 3, '#4c54494d');
  if (value !== null && value !== undefined)
    mono(c, value, x + w / 2, y + h * 0.45, Math.min(38, h * 0.56, w * 0.65), ink, 'center', w - 8);
  if (active) frame(c, x - 1, y - 2, w + 1, h + 1);
}
export function frame(c, x, y, w, h, color = brass) {
  const a = Math.min(11, h / 3, w / 3);
  for (const [xx, sx] of [
    [x, 1],
    [x + w, -1],
  ])
    for (const [yy, sy] of [
      [y, 1],
      [y + h, -1],
    ]) {
      line(c, xx, yy, xx + sx * a, yy, color, 2.5);
      line(c, xx, yy, xx, yy + sy * a, color, 2.5);
    }
}
export function row(c, values, x, y, w, h, color, focus = -1) {
  values.forEach((v, i) =>
    sort(c, x + i * w, y, w, h, v, Array.isArray(color) ? color[i] : color, i === focus),
  );
}
export function galley(c, rows, words, x, y, w = 57, h = 50, batchID = 0, focus = () => false) {
  tray(c, x - 5, y - 5, rows[0].length * w + 10, rows.length * h + 11);
  rows.forEach((r, t) => {
    name(c, words[t], x - 17, y + (t + 0.47) * h, 22, stock[batchID * 3 + t], 'right', 107);
    r.forEach((v, d) =>
      sort(c, x + d * w, y + t * h, w, h, v, stock[batchID * 3 + t], focus(t, d)),
    );
  });
}
// A composing stick locks a line of type between a fixed end and a sliding metal jaw.
export function composingStick(c, x, y, w, h) {
  const steel = c.createLinearGradient(0, y, 0, y + h);
  steel.addColorStop(0, '#949f94');
  steel.addColorStop(0.18, '#56645c');
  steel.addColorStop(1, '#323e37');
  rect(c, x - 2, y - 7, 5, h + 18, steel);
  rect(c, x - 13, y + h + 4, w + 53, 11, steel);
  rect(c, x + w + 3, y - 6, 14, h + 12, steel);
  rect(c, x + w + 15, y + h - 18, 21, 23, '#47534a');
  disk(c, x + w + 27, y + h - 6, 11, '#26322c');
  disk(c, x + w + 26, y + h - 9, 10, '#b29a73');
  line(c, x + w + 20, y + h - 5, x + w + 31, y + h - 13, '#574a36', 2);
  for (let i = 0; i <= 12; i++)
    line(c, x + (i * w) / 12, y + h + 5, x + (i * w) / 12, y + h + (i % 4 ? 8 : 12), '#aeb5a4', 1);
}
export function roller(c, x, y, h) {
  const metal = c.createLinearGradient(x - 12, 0, x + 12, 0);
  metal.addColorStop(0, '#29322d');
  metal.addColorStop(0.35, '#768076');
  metal.addColorStop(0.62, '#535e54');
  metal.addColorStop(1, '#252e29');
  rect(c, x - 11, y, 22, h, metal);
  for (const yy of [y - 3, y + h - 3]) {
    rect(c, x - 12, yy, 24, 6, '#b09b74');
    rect(c, x - 3, yy - 5, 6, 15, '#847458');
  }
}
export function brace(c, x, y, w, label, color = brass) {
  line(c, x, y, x + w, y, color, 1.6);
  line(c, x, y - 7, x, y, color, 1.6);
  line(c, x + w, y - 7, x + w, y, color, 1.6);
  text(c, label, x + w / 2, y + 16, 16, color, 'center');
}
export function arrow(c, x, y, length, color = brass) {
  line(c, x, y, x + length - 8, y, color, 2);
  poly(
    c,
    [
      [x + length - 10, y - 5],
      [x + length, y],
      [x + length - 10, y + 5],
    ],
    color,
  );
}
export function disk(c, x, y, r, col) {
  c.fillStyle = col;
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fill();
}
export function span(c, x1, y1, x2, y2, p, col = brass) {
  line(c, x1, y1, mix(x1, x2, p), mix(y1, y2, p), col, 2);
  if (p > 0) disk(c, mix(x1, x2, p), mix(y1, y2, p), 3.5, col);
}
