export const C = {
  ink: '#182e2b',
  dark: '#142d2d',
  deep: '#0d2325',
  enamel: '#2b504c',
  ridge: '#51726a',
  paper: '#f3e9d1',
  pale: '#fff6e2',
  rule: '#cbbf9e',
  dim: '#51645a',
  green: '#246659',
  mint: '#9dd7b9',
  amber: '#efbd66',
  red: '#aa462d',
  peach: '#ffa785',
  brass: '#b09759',
};
export const clamp = (x) => Math.max(0, Math.min(1, x));
export const blend = (a, b, p) => a + (b - a) * clamp(p);
export const at = (clock, phrase, duration = 0) => clock.reveal(phrase, duration);
export function after(clock, phrase, duration = 0) {
  clock.reveal(phrase, 0, { captionStart: phrase });
  const elapsed = clock.elapsed - clock.wordCue(phrase).end + 1e-9;
  return duration ? clamp(elapsed / duration) : Number(elapsed >= 0);
}
export function box(c, x, y, w, h, fill, r = 0) {
  c.fillStyle = fill;
  if (!r) {
    c.fillRect(x, y, w, h);
    return;
  }
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  c.fill();
}
export function dot(c, x, y, r, fill) {
  c.fillStyle = fill;
  c.beginPath();
  c.arc(x, y, r, 0, 2 * Math.PI);
  c.fill();
}
export function path(c, points, color, width = 3, dash = []) {
  c.save();
  c.beginPath();
  c.setLineDash(dash);
  c.lineWidth = width;
  c.strokeStyle = color;
  c.lineJoin = 'round';
  c.lineCap = 'round';
  points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.stroke();
  c.restore();
}
export function txt(c, str, x, y, size = 34, color = C.ink, opts = {}) {
  c.save();
  c.font = (opts.bold ? '700 ' : '400 ') + size + 'px "Lesson ' + (opts.face || 'Sans') + '"';
  c.textBaseline = 'middle';
  c.textAlign = opts.align || 'left';
  c.fillStyle = color;
  c.fillText(String(str), x, y);
  c.restore();
}
export function mono(c, str, x, y, size = 31, color = C.ink, align = 'left') {
  txt(c, str, x, y, size, color, { face: 'Mono', align });
}
export function headline(c, k, title, material = 'paper') {
  const dark = material === 'dark',
    bg = dark ? C.dark : C.paper,
    ink = dark ? C.pale : C.ink;
  box(c, 0, 0, 1920, 1080, bg);
  box(c, 0, 0, 1920, 11, dark ? C.amber : C.green);
  txt(c, 'MODEL SERVICE  /  MEASUREMENT LAB', 78, 63, 24, dark ? C.mint : C.green, { bold: true });
  mono(
    c,
    'STUDY  ' + String(k + 1).padStart(2, '0') + ' / 09',
    1840,
    63,
    24,
    dark ? C.mint : C.green,
    'right',
  );
  txt(c, title, 76, 145, 69, ink, { face: 'Serif' });
  path(
    c,
    [
      [80, 208],
      [1840, 208],
    ],
    dark ? C.ridge : C.rule,
    2,
  );
}
export function screw(c, x, y, dark = false) {
  dot(c, x, y, 10, dark ? C.ridge : C.rule);
  path(
    c,
    [
      [x - 4, y + 3],
      [x + 4, y - 3],
    ],
    dark ? C.deep : C.dim,
    2,
  );
}
export function panel(c, x, y, w, h) {
  box(c, x + 6, y + 12, w, h, C.deep, 28);
  box(c, x, y, w, h, C.enamel, 28);
  for (const xx of [x + 25, x + w - 25])
    for (const yy of [y + 24, y + h - 24]) screw(c, xx, yy, true);
}
export function foot(c, str, dark = false) {
  path(
    c,
    [
      [80, 892],
      [1840, 892],
    ],
    dark ? C.ridge : C.rule,
    2,
  );
  txt(c, str, 82, 943, 37, dark ? C.pale : C.ink);
}
export function bracket(c, x1, x2, y, label, color = C.green, size = 30) {
  path(
    c,
    [
      [x1, y - 9],
      [x1, y + 9],
      [x1, y],
      [x2, y],
      [x2, y - 9],
      [x2, y + 9],
    ],
    color,
    3,
  );
  if (label) mono(c, label, (x1 + x2) / 2, y + 38, size, color, 'center');
}
export function light(c, x, y, on, color = C.mint, r = 15) {
  dot(c, x, y, r + 5, C.deep);
  dot(c, x, y, r, on ? color : C.ridge);
  if (on) dot(c, x - r / 4, y - r / 4, r / 4, C.pale);
}
