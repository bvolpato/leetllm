import { createCanvas } from '@napi-rs/canvas';

export const ink = '#30263c',
  dim = '#675969',
  warp = '#60488a',
  weft = '#b9442c';
export const teal = '#176a65',
  gold = '#a66a1f',
  paper = '#f8f1e5',
  grid = '#d7c9b8';
export const mix = (a, b, t) => a + (b - a) * t;
export const fixed = (n, places = 2) => Number(n.toFixed(places)).toString();
export function cue(clock, beat, phrase, duration = 0) {
  const i = clock.beat.beatIndex + 1;
  return i === beat ? clock.reveal(phrase, duration) : Number(i > beat);
}
export function label(c, text, x, y, size = 38, color = ink, align = 'left', face = 'Sans') {
  c.font = '400 ' + size + 'px "Lesson ' + face + '"';
  c.fillStyle = color;
  c.textAlign = align;
  c.textBaseline = 'alphabetic';
  const value = String(text);
  if (!value.includes('^')) {
    c.fillText(value, x, y);
    return;
  }
  const parts = value.split(/(\^[A-Za-zαβ0-9.]+)/u).filter(Boolean);
  const spans = parts.map((part) => {
    const power = part.startsWith('^'),
      font = '400 ' + (power ? size * 0.68 : size) + 'px "Lesson ' + face + '"';
    const content = power ? part.slice(1) : part;
    c.font = font;
    return { content, font, power, width: c.measureText(content).width };
  });
  const width = spans.reduce((sum, span) => sum + span.width, 0);
  let left = x - (align === 'center' ? width / 2 : align === 'right' ? width : 0);
  c.textAlign = 'left';
  for (const span of spans) {
    c.font = span.font;
    c.fillText(span.content, left, y - (span.power ? size * 0.37 : 0));
    left += span.width;
  }
}
export function title(c, text, sub = '') {
  label(c, text, 110, 131, 70, ink, 'left', 'Serif');
  if (sub) label(c, sub, 113, 197, 33, dim);
}
export function rect(c, x, y, w, h, color) {
  c.fillStyle = color;
  c.fillRect(x, y, w, h);
}
export function line(c, x, y, u, v, color = dim, w = 3) {
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(u, v);
  c.strokeStyle = color;
  c.lineWidth = w;
  c.stroke();
}
export function dot(c, x, y, r, color) {
  c.beginPath();
  c.arc(x, y, r, 0, 2 * Math.PI);
  c.fillStyle = color;
  c.fill();
}
let grain, yarnTile;
export function ground(c) {
  if (!grain) {
    grain = createCanvas(160, 160);
    const g = grain.getContext('2d');
    for (let i = 0; i < 1400; i++) {
      const x = (i * 83.323) % 160,
        y = (i * i * 1.731) % 160;
      line(g, x, y, x + 2 + (i % 6), y + 0.5, '#59352e0e', 1);
    }
  }
  rect(c, 0, 0, 1920, 1080, paper);
  c.fillStyle = c.createPattern(grain, 'repeat');
  c.fillRect(0, 0, 1920, 1080);
}
// A two-by-two repeat gives each weft its alternating overpass.
function wovenTile() {
  if (yarnTile) return yarnTile;
  yarnTile = createCanvas(80, 80);
  const g = yarnTile.getContext('2d');
  rect(g, 0, 0, 80, 80, '#62464d');
  function ribbon(x, y, vertical) {
    g.save();
    g.translate(x, y);
    if (vertical) {
      g.translate(40, 0);
      g.rotate(Math.PI / 2);
    }
    const a = g.createLinearGradient(0, 0, 0, 40);
    const colors = vertical
      ? ['#44315f', '#816c9d', '#6a5286', '#4b3968']
      : ['#9c3e2d', '#de8258', '#c55a3b', '#923927'];
    [0, 0.26, 0.75, 1].forEach((stop, i) => a.addColorStop(stop, colors[i]));
    rect(g, 0, 1, 40, 38, a);
    for (let i = 4; i < 38; i += 4) line(g, 0, i, 40, i + 0.25, '#fff4dc40', 1.4);
    g.restore();
  }
  for (let row = 0; row < 2; row++)
    for (let col = 0; col < 2; col++) ribbon(40 * col, 40 * row, (row + col) % 2 === 0);
  return yarnTile;
}
export function cloth(c, x, y, n, d, sx, sy = sx) {
  c.save();
  c.translate(x, y);
  c.scale(sx / 40, sy / 40);
  c.fillStyle = c.createPattern(wovenTile(), 'repeat');
  c.fillRect(0, 0, n * 40, d * 40);
  c.restore();
}
export function cord(c, x, y, length, color, height = 25) {
  if (length <= 0) return;
  c.save();
  c.beginPath();
  c.rect(x, y, length, height);
  c.clip();
  rect(c, x, y, length, height, color);
  for (let i = -height; i < length; i += 9)
    line(c, x + i, y + height, x + i + height * 0.68, y, '#fff2d660', 2.4);
  line(c, x, y + height - 2, x + length, y + height - 2, '#35273b55', 4);
  c.restore();
}
export function chart(
  c,
  { x = 200, y = 290, w = 1070, h = 510, xlim, ylim, xt = [], yt = [], xlabel, ylabel },
) {
  const X = (v) => x + ((v - xlim[0]) / (xlim[1] - xlim[0])) * w;
  const Y = (v) => y + h - ((v - ylim[0]) / (ylim[1] - ylim[0])) * h;
  for (const t of yt) {
    const [v, name] = Array.isArray(t) ? t : [t, t];
    line(c, x, Y(v), x + w, Y(v), grid, 2);
    label(c, name, x - 15, Y(v) + 9, 27, dim, 'right');
  }
  for (const t of xt) {
    const [v, name] = Array.isArray(t) ? t : [t, t];
    line(c, X(v), y + h, X(v), y + h + 10, dim, 2);
    label(c, name, X(v), y + h + 44, 27, dim, 'center');
  }
  line(c, x, y, x, y + h, dim);
  line(c, x, y + h, x + w, y + h, dim);
  if (ylabel) label(c, ylabel, x, y - 24, 31, dim);
  if (xlabel) label(c, xlabel, x + w / 2, y + h + 94, 32, dim, 'center');
  function curve(fn, lo = xlim[0], hi = xlim[1], color = warp, width = 6) {
    c.save();
    c.beginPath();
    c.rect(x - 1, y - 1, w + 2, h + 2);
    c.clip();
    c.beginPath();
    for (let i = 0; i <= 160; i++) {
      const v = mix(lo, hi, i / 160);
      if (i) c.lineTo(X(v), Y(fn(v)));
      else c.moveTo(X(v), Y(fn(v)));
    }
    c.strokeStyle = color;
    c.lineWidth = width;
    c.stroke();
    c.restore();
  }
  return { X, Y, curve, point: (a, b, color = weft, r = 10) => dot(c, X(a), Y(b), r, color) };
}
export function reading(c, name, value, x, y, color = ink, size = 64) {
  label(c, name, x, y, 32, dim);
  label(c, value, x, y + size + 14, size, color, 'left', 'Serif');
}
export function matrix(c, rows, x, y, unit, color = warp) {
  rows.forEach((row, i) =>
    row.forEach((v, j) => {
      rect(c, x + j * unit + 1, y + i * unit + 1, unit - 3, unit - 3, color + '19');
      label(
        c,
        v,
        x + (j + 0.5) * unit,
        y + (i + 0.66) * unit,
        unit * 0.44,
        color,
        'center',
        'Mono',
      );
    }),
  );
}
