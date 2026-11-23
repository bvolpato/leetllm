export const C = {
  ink: '#172f38',
  muted: '#455e61',
  paper: '#f8eed7',
  cream: '#fff8e6',
  blue: '#245e70',
  teal: '#18776c',
  rust: '#a84430',
  amber: '#f3b95c',
  gold: '#b87b22',
  pale: '#cfe1d3',
  line: '#b4bdad',
  dark: '#17313d',
  light: '#d9eae3',
  coral: '#fcad89',
  mint: '#8dd5bf',
};

export function rect(g, x, y, w, h, color) {
  g.fillStyle = color;
  g.fillRect(x, y, w, h);
}
export function round(g, x, y, w, h, r, color) {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
  g.fillStyle = color;
  g.fill();
}
export function poly(g, pts, color) {
  g.beginPath();
  pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.closePath();
  g.fillStyle = color;
  g.fill();
}
export function line(g, x1, y1, x2, y2, color = C.line, width = 1) {
  g.beginPath();
  g.moveTo(x1, y1);
  g.lineTo(x2, y2);
  g.strokeStyle = color;
  g.lineWidth = width;
  g.stroke();
}
export function dot(g, x, y, r, color) {
  g.beginPath();
  g.arc(x, y, r, 0, 2 * Math.PI);
  g.fillStyle = color;
  g.fill();
}
export function ring(g, x, y, r, color, width = 2) {
  g.beginPath();
  g.arc(x, y, r, 0, 2 * Math.PI);
  g.strokeStyle = color;
  g.lineWidth = width;
  g.stroke();
}
export function txt(
  g,
  words,
  x,
  y,
  size = 21,
  color = C.ink,
  align = 'left',
  face = 'Sans',
  weight = 500,
) {
  g.font = weight + ' ' + size + 'px "Lesson ' + face + '"';
  g.textAlign = align;
  g.textBaseline = 'alphabetic';
  g.fillStyle = color;
  g.fillText(String(words), x, y);
}
export function head(g, kicker, title, dark = false) {
  txt(g, kicker, 45, 44, 16, dark ? C.mint : C.teal, 'left', 'Mono');
  txt(g, title, 44, 100, 42, dark ? C.cream : C.ink, 'left', 'Serif');
}
export function ground(g, dark = false) {
  rect(g, 0, 0, 960, 540, dark ? C.dark : C.paper);
}
export function tag(g, words, x, y, fg = C.cream, bg = C.teal, size = 18) {
  g.font = '600 ' + size + 'px "Lesson Sans"';
  const w = g.measureText(words).width + 26;
  round(g, x, y, w, size + 16, 4, bg);
  txt(g, words, x + 13, y + size + 4, size, fg, 'left', 'Sans', 600);
}
export function bar(g, x, y, w, color, h = 10) {
  rect(g, Math.min(x, x + w), y - h / 2, Math.abs(w), h, color);
}
export function van(g, x, y, scale = 1, color = C.amber) {
  g.save();
  g.translate(x, y);
  g.scale(scale, scale);
  round(g, -51, -40, 68, 34, 4, color);
  poly(
    g,
    [
      [17, -34],
      [32, -34],
      [45, -19],
      [51, -17],
      [51, -5],
      [11, -5],
      [11, -25],
    ],
    color,
  );
  poly(
    g,
    [
      [20, -31],
      [30, -31],
      [40, -20],
      [20, -20],
    ],
    C.blue,
  );
  rect(g, -49, -17, 58, 3, C.cream);
  rect(g, 44, -15, 6, 4, C.cream);
  for (const z of [-30, 31]) {
    dot(g, z, -6, 10, C.ink);
    dot(g, z, -6, 4, C.pale);
  }
  g.restore();
}
export function box(g, x, y, w = 70, label = '') {
  const h = w * 0.65,
    s = w * 0.22;
  poly(
    g,
    [
      [x, y],
      [x + w, y],
      [x + w, y + h],
      [x, y + h],
    ],
    '#b97843',
  );
  poly(
    g,
    [
      [x, y],
      [x + s, y - s],
      [x + w + s, y - s],
      [x + w, y],
    ],
    '#e8bc7e',
  );
  poly(
    g,
    [
      [x + w, y],
      [x + w + s, y - s],
      [x + w + s, y + h - s],
      [x + w, y + h],
    ],
    '#92583a',
  );
  rect(g, x + w * 0.4, y, w * 0.19, h * 0.37, '#edd5a4');
  poly(
    g,
    [
      [x + w * 0.4, y],
      [x + w * 0.4 + s, y - s],
      [x + w * 0.59 + s, y - s],
      [x + w * 0.59, y],
    ],
    '#fff0ce',
  );
  if (label) txt(g, label, x + 6, y + h - 5, Math.min(17, w * 0.22), C.cream, 'left', 'Mono', 600);
}
export function house(g, x, y, s = 1) {
  g.save();
  g.translate(x, y);
  g.scale(s, s);
  rect(g, -43, -62, 86, 62, '#a8624a');
  poly(
    g,
    [
      [-55, -59],
      [0, -101],
      [55, -59],
    ],
    C.ink,
  );
  rect(g, 16, -91, 13, 29, C.ink);
  rect(g, -11, -37, 22, 37, C.teal);
  for (const wx of [-34, 17]) {
    rect(g, wx, -45, 17, 20, C.amber);
    line(g, wx + 8, -45, wx + 8, -25, C.ink, 2);
  }
  g.restore();
}
export const lerp = (a, b, t) => a + (b - a) * t;
export const ease = (t) => t * t * (3 - 2 * t);
export function cue(k, b, phrase, duration = 0) {
  return k.beat.beatIndex > b ? 1 : k.beat.beatIndex < b ? 0 : k.reveal(phrase, duration);
}
export function afterCue(k, b, phrase) {
  if (k.beat.beatIndex !== b) return k.beat.beatIndex > b;
  const { start, end } = k.wordCue(phrase);
  return k.reveal(phrase, end - start, { captionStart: phrase }) === 1;
}
export const pct = (v) => Math.round(v * 100) + '%';
