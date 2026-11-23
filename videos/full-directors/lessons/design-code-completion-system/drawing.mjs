export const C = {
  paper: '#f7f2e6',
  sheet: '#fffdf5',
  ink: '#24283c',
  muted: '#565f6f',
  rule: '#c9c5b8',
  blue: '#365db1',
  sky: '#dde8fb',
  green: '#15665e',
  mint: '#c7e9d9',
  red: '#a64038',
  blush: '#f5dcd1',
  gold: '#ffd283',
  orange: '#d37b37',
  night: '#252b41',
  light: '#f7f3e8',
};
export function box(g, x, y, w, h, color, r = 0) {
  g.fillStyle = color;
  if (!r) {
    g.fillRect(x, y, w, h);
    return;
  }
  g.beginPath();
  g.roundRect(x, y, w, h, r);
  g.fill();
}
export function line(g, x, y, endX, endY, color = C.rule, width = 3) {
  g.strokeStyle = color;
  g.lineWidth = width;
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(endX, endY);
  g.stroke();
}
export function txt(g, value, x, y, size = 36, color = C.ink, options = {}) {
  const { font = 'Sans', weight = 400, align = 'left', max = 1800 } = options;
  const str = String(value);
  g.font = weight + ' ' + size + 'px "Lesson ' + font + '"';
  const width = g.measureText(str).width;
  if (width > max)
    g.font = weight + ' ' + Math.floor((size * max) / width) + 'px "Lesson ' + font + '"';
  g.fillStyle = color;
  g.textAlign = align;
  g.fillText(str, x, y);
  g.textAlign = 'left';
}
export function mono(g, s, x, y, n = 38, color = C.ink, max = 1700) {
  txt(g, s, x, y, n, color, { font: 'Mono', max });
}
export function cap(g, s, x, y, color = C.muted) {
  txt(g, s, x, y, 26, color, { weight: 700 });
}
export function headline(g, c, section, dark = false, title = c.beat.chapterTitle) {
  const bg = dark ? C.night : C.paper,
    color = dark ? C.light : C.ink,
    faint = dark ? '#485069' : C.rule;
  box(g, 0, 0, 1920, 1080, bg);
  cap(g, section, 94, 78, dark ? '#a9d6db' : C.green);
  line(g, 94, 106, 1826, 106, faint, 2);
  txt(g, title, 90, 207, 80, color, { font: 'Serif', max: 1730 });
}
export function strip(g, s, color = C.ink, fill = C.sheet) {
  box(g, 94, 850, 1732, 100, fill, 12);
  box(g, 94, 870, 7, 60, color);
  txt(g, s, 134, 915, 41, color, { max: 1650, weight: 500 });
}
export function pane(g, x, y, w, h, title, fill = C.sheet) {
  box(g, x, y, w, h, fill, 18);
  cap(g, title, x + 36, y + 55);
  line(g, x + 36, y + 80, x + w - 36, y + 80);
}
export function cue(c, beat, phrase, span = 0) {
  if (c.beat.beatIndex !== beat) return c.beat.beatIndex > beat ? 1 : 0;
  return c.reveal(phrase, span);
}
export function ease(t) {
  return t * t * (3 - 2 * t);
}
export function num(n) {
  return n.toLocaleString('en-US');
}
export function mid(g, s, x, y, size, color = C.ink, max = 1600) {
  txt(g, s, x, y, size, color, { align: 'center', max });
}
export function bar(g, x, y, w, h, fill) {
  if (w > 0) box(g, x, y, w, h, fill);
}
export function badge(g, s, x, y, w, fill = C.sky, color = C.blue) {
  box(g, x, y, w, 60, fill, 10);
  mid(g, s, x + w / 2, y + 41, 31, color, w - 22);
}
