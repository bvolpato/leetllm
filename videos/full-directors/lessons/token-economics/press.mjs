// Dimensions are in the full course canvas, with a clear band below the working surface.
export const C = {
  cloth: '#173d36',
  night: '#193449',
  wine: '#54333c',
  dark: '#222f34',
  paper: '#faf1d8',
  sheet: '#e6dcc2',
  ink: '#19352f',
  soft: '#4c6156',
  dim: '#b9c9ba',
  white: '#fff7df',
  teal: '#147d77',
  blue: '#325e86',
  sky: '#88bcdb',
  red: '#aa4036',
  coral: '#ef9a83',
  gold: '#e6b550',
  amber: '#895a14',
  mint: '#9fcfb1',
};
export const group = (c, fn) => {
  c.save();
  try {
    fn();
  } finally {
    c.restore();
  }
};
export function box(c, x, y, w, h, fill, edge, weight = 2, r = 0) {
  c.beginPath();
  if (r) c.roundRect(x, y, w, h, r);
  else c.rect(x, y, w, h);
  if (fill) {
    c.fillStyle = fill;
    c.fill();
  }
  if (edge) {
    c.lineWidth = weight;
    c.strokeStyle = edge;
    c.stroke();
  }
}
export function line(c, x, y, u, v, color = C.ink, w = 3) {
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(u, v);
  c.strokeStyle = color;
  c.lineWidth = w;
  c.stroke();
}
export function dot(c, x, y, r, fill, edge) {
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fillStyle = fill;
  c.fill();
  if (edge) {
    c.strokeStyle = edge;
    c.lineWidth = 2;
    c.stroke();
  }
}
export function type(
  c,
  value,
  x,
  y,
  size = 44,
  color = C.ink,
  kind = 'sans',
  align = 'left',
  max = 1740,
) {
  const face = kind === 'serif' ? 'Lesson Serif' : kind === 'mono' ? 'Lesson Mono' : 'Lesson Sans';
  c.font = (kind === 'bold' ? 700 : 400) + ' ' + size + 'px "' + face + '"';
  c.textAlign = align;
  c.textBaseline = 'middle';
  c.fillStyle = color;
  c.fillText(String(value), x, y, max);
}
export function label(c, value, x, y, color = C.soft, align = 'left', max = 1600) {
  type(c, value, x, y, 28, color, 'mono', align, max);
}
export function ground(c, color = C.cloth) {
  const g = c.createRadialGradient(860, 390, 180, 920, 540, 1250);
  g.addColorStop(0, color);
  g.addColorStop(1, '#101e22');
  box(c, 0, 0, 1920, 1080, g);
  group(c, () => {
    c.globalAlpha = 0.045;
    for (let y = 16; y < 1080; y += 12) line(c, 0, y, 1920, y, '#f8f3dd', 1);
  });
}
export function paper(c, x, y, w, h, fill = C.paper, torn = false) {
  box(c, x + 9, y + 14, w, h, '#0e212344', null, 0, 5);
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(x + w, y);
  c.lineTo(x + w, y + h);
  if (torn) {
    const n = Math.max(8, Math.round(w / 24)),
      step = w / n;
    for (let i = n; i > 0; i--) {
      c.lineTo(x + step * (i - 0.5), y + h - 8);
      c.lineTo(x + step * (i - 1), y + h);
    }
  } else c.lineTo(x, y + h);
  c.closePath();
  c.fillStyle = fill;
  c.fill();
}
export function head(c, kicker, title) {
  label(c, kicker, 108, 85, C.dim);
  type(c, title, 104, 173, 72, C.white, 'serif', 'left', 1710);
}
export function rule(c, x, y, w, color = '#9aa89a') {
  line(c, x, y, x + w, y, color, 2);
}
export function seal(c, txt, x, y, ink = C.teal, w = 220) {
  group(c, () => {
    c.translate(x, y);
    c.rotate(-0.027);
    box(c, -w / 2, -30, w, 60, null, ink, 4, 4);
    box(c, -w / 2 + 6, -24, w - 12, 48, null, ink, 1, 3);
    type(c, txt, 0, 1, 29, ink, 'bold', 'center', w - 22);
  });
}
export function segments(c, x, y, w, h, parts) {
  const sum = parts.reduce((s, p) => s + p[0], 0);
  if (!sum) return;
  let left = x;
  for (const [n, color] of parts) {
    if (n > 0) box(c, left, y, (w * n) / sum, h, color);
    left += (w * n) / sum;
  }
}
export function scaleBar(c, x, y, w, h, amount, limit, color, track = '#cad2c7') {
  box(c, x, y, w, h, track);
  if (amount > 0) box(c, x, y, (w * amount) / limit, h, color);
}
export function key(c, x, y, word, detail, color = C.blue, w = 420) {
  box(c, x + 3, y + 7, w, 108, '#101d1e77', null, 0, 11);
  box(c, x, y, w, 108, C.paper, color, 4, 11);
  type(c, word, x + 23, y + 37, 32, color, 'bold', 'left', w - 46);
  type(c, detail, x + 23, y + 78, 29, C.ink, 'mono', 'left', w - 46);
}
export function clip(c, x, y) {
  box(c, x - 46, y - 13, 92, 27, '#929983', '#34443b', 3, 5);
  line(c, x - 34, y, x + 34, y, '#d7d9be', 3);
}
export const nfmt = (n) => n.toLocaleString('en-US');
export const usd = (micro, places = 6) => '$' + (micro / 1e6).toFixed(places);
export const cents = (micro) => Number((micro / 10000).toFixed(5)) + '¢';
export const bno = (k) => k.beat.beatIndex + 1;
// These switches fall on spoken words, or at speech end when the clause ends a beat.
export function cue(k, n, phrase, span = 0) {
  if (bno(k) !== n) return bno(k) > n ? 1 : 0;
  return k.reveal(phrase, span);
}
export function ended(k, n) {
  return bno(k) > n || (bno(k) === n && k.elapsed >= k.speechDuration);
}
export function slipRow(c, x, y, w, name, value, color = C.ink) {
  type(c, name, x, y, 35, C.soft, 'sans', 'left', w * 0.52);
  type(c, value, x + w, y, 38, color, 'mono', 'right', w * 0.47);
  rule(c, x, y + 42, w, '#bdc1ad');
}
export const footer = (c, txt) => type(c, txt, 109, 904, 40, C.white, 'serif', 'left', 1710);
