// Stock colors stay with replies as the operator exchanges their positions.
export const C = {
  bench: '#192937',
  deep: '#0e1e2c',
  metal: '#324b59',
  line: '#546b76',
  milk: '#f6f0dc',
  white: '#f0f6f1',
  ink: '#142c38',
  dim: '#b8cdcc',
  mint: '#98dfc0',
  gold: '#f3c464',
  coral: '#ff9b88',
  blue: '#9fcfe6',
  pulp: '#d8e7df',
  gray: '#87a5ae',
};
export const clamp = (n) => Math.max(0, Math.min(1, n));
export const smooth = (x) => clamp(x) ** 2 * (3 - 2 * clamp(x));
export function box(g, x, y, w, h, color, r = 0) {
  g.fillStyle = color;
  g.beginPath();
  g.roundRect(x, y, w, h, r);
  g.fill();
}
export function line(g, x, y, x2, y2, color = C.line, w = 2) {
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(x2, y2);
  g.strokeStyle = color;
  g.lineWidth = w;
  g.stroke();
}
export function dot(g, x, y, r, color) {
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fillStyle = color;
  g.fill();
}
export function txt(
  g,
  str,
  x,
  y,
  size = 36,
  color = C.white,
  font = 'Sans',
  align = 'left',
  weight = 400,
) {
  g.fillStyle = color;
  g.font = weight + ' ' + size + 'px "Lesson ' + font + '"';
  g.textAlign = align;
  g.textBaseline = 'alphabetic';
  g.fillText(String(str), x, y);
}
export function cap(g, str, x, y, color = C.dim, size = 26) {
  txt(g, str, x, y, size, color, 'Mono');
}
export function wrap(
  g,
  str,
  x,
  y,
  w,
  size = 40,
  color = C.ink,
  leading = size * 1.25,
  font = 'Serif',
) {
  const lines = [];
  let current = '';
  g.font = '400 ' + size + 'px "Lesson ' + font + '"';
  for (const word of str.split(/\s+/)) {
    const next = current ? current + ' ' + word : word;
    if (current && g.measureText(next).width > w) {
      lines.push(current);
      current = word;
    } else current = next;
  }
  lines.push(current);
  lines.forEach((s, i) => txt(g, s, x, y + i * leading, size, color, font));
  return y + leading * lines.length;
}
export function sheet(g, x, y, w, h, color = C.milk) {
  box(g, x + 4, y + 9, w, h, '#0e1e2d', 8);
  box(g, x, y, w, h, color, 8);
  for (let yy = y + 27; yy < y + h - 12; yy += 46) dot(g, x + 17, yy, 5, C.bench);
  line(g, x + 35, y + 5, x + 35, y + h - 5, '#00000022', 2);
}
export function rule(g, title, x, y, w, color = C.milk) {
  cap(g, title, x, y, color);
  line(g, x, y + 20, x + w, y + 20, C.line);
}
export function heading(g, kicker, title) {
  cap(g, kicker.toUpperCase(), 102, 105, C.mint, 27);
  txt(g, title, 98, 210, 72, C.white, 'Serif');
}
export function ground(g) {
  const grad = g.createLinearGradient(0, 0, 1920, 1080);
  grad.addColorStop(0, '#243c49');
  grad.addColorStop(0.73, C.bench);
  grad.addColorStop(1, C.deep);
  g.fillStyle = grad;
  g.fillRect(0, 0, 1920, 1080);
}
export function cue(k, beat, phrase, duration = 0) {
  const b = k.beat.beatIndex + 1;
  return b > beat ? 1 : b < beat ? 0 : k.reveal(phrase, duration);
}
export const beat = (k) => k.beat.beatIndex + 1;
export function clip(g, x, y, w, h, paint) {
  g.save();
  g.beginPath();
  g.rect(x, y, w, h);
  g.clip();
  paint();
  g.restore();
}
export function arrow(g, x, y, x2, y2, color = C.gold, width = 5) {
  line(g, x, y, x2, y2, color, width);
  const a = Math.atan2(y2 - y, x2 - x);
  for (const offset of [-0.55, 0.55])
    line(g, x2, y2, x2 - 19 * Math.cos(a + offset), y2 - 19 * Math.sin(a + offset), color, width);
}
export function label(g, str, x, y, color = C.mint, width = 0) {
  g.font = '600 30px "Lesson Sans"';
  const w = width || g.measureText(str).width + 52;
  box(g, x, y, w, 55, color, 5);
  txt(g, str, x + 26, y + 38, 30, C.ink, 'Sans', 'left', 600);
}
export function checkMark(g, x, y, color = C.ink, sz = 20) {
  line(g, x - sz, y, x - sz * 0.22, y + sz * 0.68, color, 5);
  line(g, x - sz * 0.22, y + sz * 0.68, x + sz, y - sz * 0.8, color, 5);
}
