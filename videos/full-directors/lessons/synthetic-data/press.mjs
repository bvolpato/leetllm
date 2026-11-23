export const ink = '#203733',
  muted = '#536a60',
  milk = '#f7efd9',
  paper = '#fffae8';
export const teal = '#176b60',
  mint = '#a8dbbd',
  rust = '#a03e26',
  orange = '#ffac65';
export const ruled = '#a9afa0',
  dark = '#203e39',
  white = '#fff9e4';
export const serif = 'Lesson Serif',
  mono = 'Lesson Mono',
  sans = 'Lesson Sans';
export const ease = (n) => n * n * (3 - 2 * n);
export function cue(k, beat, phrase, duration = 0) {
  const here = k.beat.beatIndex + 1;
  return here === beat ? k.reveal(phrase, duration) : Number(here > beat);
}
export function afterCue(k, beat, phrase) {
  const here = k.beat.beatIndex + 1;
  if (here !== beat) return here > beat;
  const { start, end } = k.wordCue(phrase);
  return k.reveal(phrase, end - start, { captionStart: phrase }) === 1;
}
export function rect(g, x, y, w, h, fill) {
  g.fillStyle = fill;
  g.fillRect(x, y, w, h);
}
export function round(g, x, y, w, h, r, fill) {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
  g.fillStyle = fill;
  g.fill();
}
export function path(g, points, color, width = 3, close = false) {
  g.beginPath();
  g.moveTo(...points[0]);
  for (const point of points.slice(1)) g.lineTo(...point);
  if (close) {
    g.closePath();
    g.fillStyle = color;
    g.fill();
  } else {
    g.strokeStyle = color;
    g.lineWidth = width;
    g.lineJoin = 'round';
    g.lineCap = 'round';
    g.stroke();
  }
}
export function line(g, x, y, X, Y, col = ruled, w = 3) {
  path(
    g,
    [
      [x, y],
      [X, Y],
    ],
    col,
    w,
  );
}
export function disc(g, x, y, r, color) {
  g.fillStyle = color;
  g.beginPath();
  g.arc(x, y, r, 0, 2 * Math.PI);
  g.fill();
}
export function type(
  g,
  value,
  x,
  y,
  px = 42,
  col = ink,
  face = sans,
  align = 'left',
  maxWidth = Infinity,
) {
  g.fillStyle = col;
  g.textAlign = align;
  g.textBaseline = 'alphabetic';
  g.font = '400 ' + px + 'px "' + face + '"';
  const str = String(value);
  if (g.measureText(str).width > maxWidth)
    g.font = '400 ' + Math.floor((px * maxWidth) / g.measureText(str).width) + 'px "' + face + '"';
  g.fillText(str, x, y);
}
export function lab(g, t, x, y, col = muted) {
  type(g, t, x, y, 29, col, mono);
}
export function headline(g, t, x = 104, y = 153, max = 1712) {
  type(g, t, x, y, 83, ink, serif, 'left', max);
}
export function backing(g, color = milk) {
  rect(g, 0, 0, 1920, 1080, color);
}
export function stock(g, x, y, w, h, fill = paper) {
  path(
    g,
    [
      [x, y + 18],
      [x + 18, y],
      [x + w, y],
      [x + w, y + h],
      [x, y + h],
    ],
    fill,
    0,
    true,
  );
  for (let i = 0; i < 3; i++) disc(g, x + w - 32 - i * 24, y + 27, 5, ruled);
}
export function pill(g, t, x, y, w, fill = teal, col = white, px = 32) {
  round(g, x, y, w, 61, 30, fill);
  type(g, t, x + w / 2, y + 41, px, col, mono, 'center', w - 27);
}
export function ruleText(g, t, x, y, w, col = ink) {
  line(g, x, y - 52, x + w, y - 52, ruled, 2);
  type(g, t, x, y, 39, col, sans, 'left', w);
}
export function arrow(g, x, y, X, Y, col = muted, width = 5) {
  const a = Math.atan2(Y - y, X - x);
  line(g, x, y, X, Y, col, width);
  path(
    g,
    [
      [X - 18 * Math.cos(a - 0.55), Y - 18 * Math.sin(a - 0.55)],
      [X, Y],
      [X - 18 * Math.cos(a + 0.55), Y - 18 * Math.sin(a + 0.55)],
    ],
    col,
    width,
  );
}
export function ribbon(g, t, x, y, col = orange, w = 232) {
  path(
    g,
    [
      [x, y - 34],
      [x + w - 24, y - 34],
      [x + w, y],
      [x + w - 24, y + 34],
      [x, y + 34],
    ],
    col,
    0,
    true,
  );
  disc(g, x + 19, y, 5, dark);
  type(g, t, x + 37, y + 13, 36, dark, mono, 'left', w - 70);
}
