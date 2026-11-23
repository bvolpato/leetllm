export const P = {
  ink: '#203435',
  deep: '#193f41',
  slate: '#486060',
  mute: '#536660',
  line: '#9cada3',
  ivory: '#faf3df',
  paper: '#f4ead1',
  pale: '#e8e0c8',
  cream: '#fff9eb',
  teal: '#117765',
  mint: '#b1d6b9',
  gold: '#e8b74e',
  orange: '#c95432',
  rust: '#a73928',
  blush: '#f4b492',
  ocean: '#345e7a',
  sky: '#accbd0',
  black: '#16292d',
};
export function box(c, x, y, w, h, fill, r = 0) {
  c.fillStyle = fill;
  if (r) {
    c.beginPath();
    c.roundRect(x, y, w, h, r);
    c.fill();
  } else c.fillRect(x, y, w, h);
}
export function poly(c, pts, fill) {
  c.beginPath();
  pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  c.fillStyle = fill;
  c.fill();
}
export function line(c, x1, y1, x2, y2, color = P.line, w = 2, dash = []) {
  c.save();
  c.setLineDash(dash);
  c.beginPath();
  c.moveTo(x1, y1);
  c.lineTo(x2, y2);
  c.strokeStyle = color;
  c.lineWidth = w;
  c.stroke();
  c.restore();
}
export function dot(c, x, y, r, color) {
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fillStyle = color;
  c.fill();
}
export function txt(c, str, x, y, size = 23, color = P.ink, opt = {}) {
  c.fillStyle = color;
  c.textBaseline = 'alphabetic';
  c.textAlign = opt.align ?? 'left';
  c.font = (opt.bold ? 700 : 400) + ' ' + size + 'px "Lesson ' + (opt.family ?? 'Sans') + '"';
  c.fillText(String(str), x, y);
}
export function mono(c, s, x, y, size = 20, color = P.ink, align = 'left') {
  txt(c, s, x, y, size, color, { family: 'Mono', align });
}
export function title(c, s, x = 64, y = 92, size = 46, col = P.ink) {
  txt(c, s, x, y, size, col, { family: 'Serif' });
}
export function small(c, s, x, y, col = P.mute) {
  txt(c, s, x, y, 17, col, { bold: true });
}
export function page(c, fill = P.paper) {
  box(c, 0, 0, 1200, 675, fill);
}
export function sheet(c, x, y, w, h, color = P.cream) {
  poly(
    c,
    [
      [x + 5, y + 8],
      [x + w + 6, y + 8],
      [x + w + 6, y + h + 8],
      [x + 5, y + h + 8],
    ],
    '#43594b30',
  );
  box(c, x, y, w, h, color);
}
export function at(k, beat, phrase, duration = 0) {
  const b = k.beat.beatIndex + 1;
  if (b < beat) return 0;
  if (b > beat) return 1;
  return k.reveal(phrase, duration);
}
export function arrow(c, x, y, x2, y2, color = P.teal, w = 4) {
  line(c, x, y, x2, y2, color, w);
  const a = Math.atan2(y2 - y, x2 - x);
  poly(
    c,
    [
      [x2, y2],
      [x2 - 14 * Math.cos(a - 0.45), y2 - 14 * Math.sin(a - 0.45)],
      [x2 - 14 * Math.cos(a + 0.45), y2 - 14 * Math.sin(a + 0.45)],
    ],
    color,
  );
}
// Isometric shipping carton. Tape wraps over both visible faces and the lid.
export function parcel(c, x, y, w, id, accent = P.gold) {
  const h = 0.58 * w,
    d = 0.22 * w;
  poly(
    c,
    [
      [x, y],
      [x + w * 0.7, y + d],
      [x + w * 0.7, y + d + h],
      [x, y + h],
    ],
    '#bc8050',
  );
  poly(
    c,
    [
      [x + w * 0.7, y + d],
      [x + w, y],
      [x + w, y + h],
      [x + w * 0.7, y + d + h],
    ],
    '#8e593d',
  );
  poly(
    c,
    [
      [x, y],
      [x + w * 0.3, y - d],
      [x + w, y],
      [x + w * 0.7, y + d],
    ],
    '#e8b67c',
  );
  poly(
    c,
    [
      [x + w * 0.29, y + d * 0.43],
      [x + w * 0.4, y + d * 0.59],
      [x + w * 0.71, y - d * 0.41],
      [x + w * 0.6, y - d * 0.56],
    ],
    accent,
  );
  poly(
    c,
    [
      [x + w * 0.29, y + d * 0.43],
      [x + w * 0.4, y + d * 0.59],
      [x + w * 0.4, y + h * 0.65],
      [x + w * 0.29, y + h * 0.6],
    ],
    accent,
  );
  if (id) {
    c.save();
    c.translate(x + w * 0.45, y + h * 0.59);
    c.transform(1, 0.3, 0, 1, 0, 0);
    box(c, 0, 0, w * 0.21, w * 0.14, P.cream);
    mono(c, id, w * 0.025, w * 0.11, w * 0.107, P.ink);
    c.restore();
  }
}
export function handset(
  c,
  x,
  y,
  w,
  {
    lit = false,
    line1 = 'Parcel post',
    line2 = 'Delay alert',
    line3 = '',
    screen = '#273f46',
  } = {},
) {
  const h = 1.62 * w;
  box(c, x + w * 0.025, y + w * 0.045, w, h, '#15282b35', w * 0.13);
  box(c, x, y, w, h, P.black, w * 0.13);
  box(c, x + 4, y + 4, w - 8, h - 8, lit ? '#f5e7ca' : '#47545a', w * 0.11);
  box(c, x + 8, y + 8, w - 16, h - 16, lit ? P.cream : screen, w * 0.095);
  box(c, x + w * 0.33, y + w * 0.1, w * 0.34, w * 0.046, P.black, w * 0.03);
  if (lit) {
    box(c, x + 8, y + 0.33 * w, w - 16, 0.32 * w, P.teal);
    txt(c, line1, x + w * 0.12, y + w * 0.55, w * 0.142, P.cream, { bold: true });
    dot(c, x + w * 0.18, y + w * 0.84, w * 0.046, P.orange);
    txt(c, line2, x + w * 0.12, y + w * 1.13, w * 0.145, P.ink, { bold: true });
    if (line3) txt(c, line3, x + w * 0.12, y + w * 1.34, w * 0.12, P.mute);
  } else {
    line(c, x + w * 0.18, y + w * 0.62, x + w * 0.67, y + w * 0.26, '#476269', w * 0.022);
    line(c, x + w * 0.22, y + w * 0.69, x + w * 0.77, y + w * 0.29, '#476269', w * 0.01);
  }
  box(c, x + w * 0.35, y + h - w * 0.115, w * 0.3, w * 0.033, lit ? P.mute : '#627170', w * 0.024);
}
export function doorstep(c, x, y, w, h, n) {
  const warm = n === 1;
  box(c, x, y, w, h, warm ? '#c78668' : '#91ada5');
  const wall = warm ? '#b8775e' : '#829f98';
  for (let j = 0; j < h / 25; j++) {
    line(c, x, y + j * 25, x + w, y + j * 25, wall, 1);
    for (let a = 0; a < w / 79; a++) {
      const xx = x + a * 79 + (j % 2) * 40;
      if (xx < x + w) line(c, xx, y + j * 25, xx, y + Math.min(h, (j + 1) * 25), wall, 1);
    }
  }
  const dw = w * 0.39,
    dx = x + 0.088 * w,
    dy = y + 0.14 * h,
    dh = 0.68 * h;
  box(c, dx - 9, dy - 12, dw + 18, dh + 20, '#e9cd9f');
  box(c, dx, dy, dw, dh, warm ? '#425f63' : '#365759');
  box(c, dx + dw * 0.12, dy + dh * 0.11, dw * 0.75, dh * 0.29, warm ? '#88aaad' : '#87a9a2');
  line(c, dx + dw * 0.48, dy + dh * 0.11, dx + dw * 0.48, dy + dh * 0.4, P.slate, 4);
  box(c, dx + dw * 0.12, dy + dh * 0.51, dw * 0.75, dh * 0.39, warm ? '#344e56' : '#2d494d');
  dot(c, dx + dw * 0.86, dy + dh * 0.5, 5, P.gold);
  box(c, x, y + h * 0.84, w, h * 0.16, warm ? '#a76f54' : '#708984');
  poly(
    c,
    [
      [dx - 16, y + h * 0.82],
      [dx + dw + 17, y + h * 0.82],
      [dx + dw + 31, y + h * 0.91],
      [dx - 30, y + h * 0.91],
    ],
    '#cab69a',
  );
  box(c, dx - 30, y + h * 0.91, dw + 61, h * 0.052, '#928579');
  box(c, x + 0.57 * w, y + 0.17 * h, 0.23 * w, 0.38 * h, '#edd8af');
  box(c, x + 0.585 * w, y + 0.19 * h, 0.2 * w, 0.34 * h, '#58797a');
  line(c, x + 0.685 * w, y + 0.19 * h, x + 0.685 * w, y + 0.53 * h, '#d9c298', 4);
  line(c, x + 0.585 * w, y + 0.36 * h, x + 0.785 * w, y + 0.36 * h, '#d9c298', 4);
  box(c, x + 0.56 * w, y + 0.545 * h, 0.25 * w, 7, '#e3c89c');
  box(c, x + 0.009 * w, y + 0.24 * h, 0.062 * w, 0.13 * h, P.ink, 3);
  mono(c, '0' + n, x + 0.04 * w, y + 0.325 * h, Math.max(12, w * 0.037), P.cream, 'center');
}
export function tag(c, x, y, w, txtValue, bg = P.deep, fg = P.cream) {
  box(c, x, y, w, 35, bg, 3);
  mono(c, txtValue, x + w / 2, y + 25, 18, fg, 'center');
}
export function strip(c, y, label, value, col = P.teal) {
  line(c, 64, y - 28, 1136, y - 28, P.line);
  txt(c, label, 64, y + 4, 22, P.mute);
  txt(c, value, 1136, y + 4, 28, col, { bold: true, align: 'right' });
}
