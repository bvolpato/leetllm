export const C = {
  paper: '#f0eee4',
  ink: '#172e33',
  muted: '#47636a',
  faint: '#b9c6bd',
  scope: '#142e34',
  grid: '#355158',
  light: '#ecf4e9',
  pale: '#afc8c4',
  ref: '#93dddd',
  decoded: '#ffad68',
  oxide: '#97431d',
  teal: '#126b70',
  sky: '#c9e6df',
};
export const mono = 'Lesson Mono',
  sans = 'Lesson Sans',
  serif = 'Lesson Serif';
export function text(g, value, x, y, size = 36, color = C.ink, options = {}) {
  g.fillStyle = color;
  g.font = (options.weight ?? 400) + ' ' + size + 'px "' + (options.face ?? sans) + '"';
  g.textAlign = options.align ?? 'left';
  g.textBaseline = 'alphabetic';
  if (options.width) g.fillText(String(value), x, y, options.width);
  else g.fillText(String(value), x, y);
}
export function num(g, v, x, y, size = 48, color = C.ink, align = 'left') {
  text(g, v, x, y, size, color, { face: mono, align });
}
export function rect(g, x, y, w, h, color) {
  g.fillStyle = color;
  g.fillRect(x, y, w, h);
}
export function line(g, x, y, xx, yy, color, w = 3, dash = []) {
  g.beginPath();
  g.setLineDash(dash);
  g.moveTo(x, y);
  g.lineTo(xx, yy);
  g.lineWidth = w;
  g.strokeStyle = color;
  g.stroke();
  g.setLineDash([]);
}
export function dot(g, x, y, r, color) {
  g.beginPath();
  g.arc(x, y, r, 0, 2 * Math.PI);
  g.fillStyle = color;
  g.fill();
}
export function arrow(g, x1, y1, x2, y2, color, width = 5) {
  line(g, x1, y1, x2, y2, color, width);
  const a = Math.atan2(y2 - y1, x2 - x1);
  for (const sign of [-1, 1]) {
    const b = a + sign * 0.57;
    line(g, x2 - 21 * Math.cos(b), y2 - 21 * Math.sin(b), x2, y2, color, width);
  }
}
export function opacity(g, amount, paint) {
  if (amount <= 0) return;
  g.save();
  g.globalAlpha *= amount;
  paint();
  g.restore();
}
// A cue belongs to one beat. Its result stays visible on later beats.
export function cue(clock, beat, phrase, seconds = 0.42) {
  const index = clock.beat.beatIndex;
  if (index < beat) return 0;
  if (index > beat) return 1;
  return clock.reveal(phrase, seconds);
}
export function base(g, title, category) {
  rect(g, 0, 0, 1920, 1080, C.paper);
  text(g, category.toUpperCase(), 86, 79, 28, C.teal, { face: mono });
  text(g, title, 82, 171, 78, C.ink, { face: serif, width: 1750 });
  line(g, 84, 202, 1836, 202, C.ink, 3);
}
export function scope(g, x, y, w, h) {
  rect(g, x, y, w, h, C.scope);
  for (const [xx, yy] of [
    [x + 13, y + 13],
    [x + w - 13, y + 13],
    [x + 13, y + h - 13],
    [x + w - 13, y + h - 13],
  ]) {
    dot(g, xx, yy, 4, C.grid);
  }
}
export function note(g, main, supporting = '') {
  line(g, 84, 812, 1836, 812, C.faint, 2);
  text(g, main, 87, 868, 44, C.ink, { face: serif, width: 1740 });
  if (supporting) text(g, supporting, 88, 918, 31, C.muted, { width: 1740 });
}
export function bits(g, code, x, y, w = 550, h = 67) {
  const step = w / 8;
  Array.from(code.toString(2).padStart(8, '0')).forEach((v, i) => {
    rect(g, x + i * step, y, step - 4, h, i === 0 ? C.grid : i < 5 ? C.teal : C.oxide);
    num(g, v, x + (i + 0.5) * step - 2, y + h * 0.74, h * 0.61, C.light, 'center');
  });
}
export function ruler(g, ticks, pos, y, label, color = C.ink) {
  line(g, pos(ticks[0]), y, pos(ticks.at(-1)), y, color, 4);
  ticks.forEach((t, i) => {
    line(g, pos(t), y - 18, pos(t), y + 20, color, 4);
    const v = label(t, i);
    if (v !== '') num(g, v, pos(t), y + 66, 31, color, 'center');
  });
}
export function probe(g, x, y, value, color = C.oxide) {
  num(g, value, x, y - 121, 43, color, 'center');
  arrow(g, x, y - 99, x, y - 15, color, 5);
}
export const short = (value) => Number(value.toFixed(8)).toString().replace('-', '−');
