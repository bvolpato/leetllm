export const ink = '#183039',
  paper = '#f5eedb',
  cream = '#fff4d7',
  navy = '#122f36';
export const teal = '#116e69',
  mint = '#94e0bf',
  copper = '#efb166',
  red = '#aa443c',
  pink = '#ffa99e';
export const plum = '#402f48',
  muted = '#526b6d',
  pale = '#adc8c4';
export const mix = (a, b, t) => a + (b - a) * t;
export const ease = (t) => t * t * (3 - 2 * t);
export function cue(clock, beat, phrase, span = 0) {
  const i = clock.beat.beatIndex + 1;
  return i < beat ? 0 : i > beat ? 1 : clock.reveal(phrase, span);
}
export function rect(g, x, y, w, h, fill, r = 0, stroke = null, lw = 1) {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
  if (fill) {
    g.fillStyle = fill;
    g.fill();
  }
  if (stroke) {
    g.strokeStyle = stroke;
    g.lineWidth = lw;
    g.stroke();
  }
}
export function line(g, x1, y1, x2, y2, color, width = 2) {
  g.beginPath();
  g.moveTo(x1, y1);
  g.lineTo(x2, y2);
  g.strokeStyle = color;
  g.lineWidth = width;
  g.stroke();
}
export function disk(g, x, y, r, color, stroke = null, lw = 1) {
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fillStyle = color;
  g.fill();
  if (stroke) {
    g.strokeStyle = stroke;
    g.lineWidth = lw;
    g.stroke();
  }
}
export function txt(
  g,
  str,
  x,
  y,
  size = 28,
  color = ink,
  align = 'left',
  family = 'Sans',
  weight = 400,
) {
  g.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  g.fillStyle = color;
  g.textAlign = align;
  g.textBaseline = 'middle';
  g.fillText(String(str), x, y);
}
export function label(g, str, x, y, color = muted, align = 'left', size = 18) {
  txt(g, str, x, y, size, color, align, 'Mono', 500);
}
export function arrow(g, x, y, xx, yy, color, w = 3) {
  line(g, x, y, xx, yy, color, w);
  const a = Math.atan2(yy - y, xx - x);
  for (const d of [-0.52, 0.52])
    line(g, xx, yy, xx - 13 * Math.cos(a + d), yy - 13 * Math.sin(a + d), color, w);
}
export function screw(g, x, y) {
  disk(g, x, y, 5, '#a7b6ad', '#182d31', 1.6);
  line(g, x - 2.5, y + 1.5, x + 2.5, y - 1.5, '#415658', 1.4);
}
export function field(g, kind) {
  const palette =
    kind === 'felt'
      ? ['#533d55', '#302638']
      : kind === 'panel'
        ? ['#24444b', '#102e34']
        : ['#f9f4e5', '#e6dfc9'];
  const grad = g.createLinearGradient(60, 0, 1200, 810);
  grad.addColorStop(0, palette[0]);
  grad.addColorStop(1, palette[1]);
  g.fillStyle = grad;
  g.fillRect(0, 0, 1280, 720);
  if (kind === 'felt') {
    g.beginPath();
    for (let x = -720; x < 1280; x += 8) {
      g.moveTo(x, 0);
      g.lineTo(x + 720, 720);
    }
    g.lineWidth = 0.8;
    g.strokeStyle = '#f2c3da0b';
    g.stroke();
    rect(g, 22, 23, 1236, 674, null, 35, '#ccb6ab48', 2);
  } else if (kind === 'panel') {
    for (const x of [23, 1257]) for (const y of [24, 696]) screw(g, x, y);
  } else {
    for (let y = 23; y < 718; y += 22)
      for (let x = 20; x < 1280; x += 22) ((g.fillStyle = '#647b701c'), g.fillRect(x, y, 1.5, 1.5));
  }
}
export function heading(g, title, sub, kind = 'paper') {
  const dark = kind !== 'paper';
  txt(g, title, 64, 74, 53, dark ? cream : ink, 'left', 'Serif');
  if (sub) label(g, sub, 66, 129, dark ? pale : muted);
}
export function plate(g, x, y, w, h, fill = paper) {
  rect(g, x + 3, y + 7, w, h, '#071f263c', 12);
  rect(g, x, y, w, h, fill, 12, '#263d3d', 2);
  for (const xx of [x + 13, x + w - 13]) for (const yy of [y + 13, y + h - 13]) screw(g, xx, yy);
}
export function badge(g, str, x, y, w, fill, color = ink) {
  rect(g, x, y, w, 44, fill, 7);
  txt(g, str, x + w / 2, y + 22, 23, color, 'center', 'Sans', 600);
}
export function token(g, x, y, text, sz = 66, fill = cream, col = ink) {
  rect(g, x - sz / 2, y - sz / 2 + 4, sz, sz, '#172c32', 9);
  rect(g, x - sz / 2, y - sz / 2, sz, sz, fill, 9);
  txt(g, text, x, y, sz * 0.54, col, 'center', 'Mono', 500);
}
export function poly(g, points, color, width = 3) {
  if (!points.length) return;
  g.beginPath();
  g.moveTo(...points[0]);
  for (const pt of points.slice(1)) g.lineTo(...pt);
  g.strokeStyle = color;
  g.lineWidth = width;
  g.stroke();
}
