export const C = {
  paper: '#f3f0df',
  light: '#fcf9eb',
  ink: '#203b3a',
  muted: '#506764',
  grid: '#c8cdbb',
  teal: '#126962',
  blue: '#236981',
  brass: '#985813',
  red: '#ae4937',
  pale: '#cadfd6',
  warm: '#f1dac0',
  rose: '#f4d6c7',
  white: '#fffdf2',
};
export const colors = [C.blue, C.brass, C.red];
export const fmt = (n) => (typeof n === 'number' ? String(+n.toFixed(3)).replace('-', '−') : n);
export const vec = (a) => '[' + a.map(fmt).join(', ') + ']';
export const mix = (a, b, t) => a + (b - a) * t;
export const unit = (t) => Math.max(0, Math.min(t, 1));
export const sm = (v) => {
  const t = unit(v);
  return t * t * (3 - 2 * t);
};

// A cue has a chapter-local beat and the words that initiate the operation.
export function cue(clock, beat, phrase, seconds = 0.65, captionStart = phrase) {
  const b = clock.beat.beatIndex;
  return b < beat ? 0 : b > beat ? 1 : sm(clock.reveal(phrase, seconds, { captionStart }));
}
export function text(
  g,
  s,
  x,
  y,
  size = 20,
  color = C.ink,
  align = 'left',
  face = 'Sans',
  weight = 500,
  max = Infinity,
) {
  g.font = weight + ' ' + size + 'px "Lesson ' + face + '"';
  g.textBaseline = 'middle';
  g.textAlign = align;
  const str = String(s),
    w = g.measureText(str).width;
  if (w > max) g.font = weight + ' ' + (size * max) / w + 'px "Lesson ' + face + '"';
  g.fillStyle = color;
  g.fillText(str, x, y);
}
export const mono = (g, s, x, y, size = 21, color = C.ink, align = 'left', max = Infinity) =>
  text(g, s, x, y, size, color, align, 'Mono', 500, max);
export function rect(g, x, y, w, h, fill, stroke, r = 0) {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
  if (fill) {
    g.fillStyle = fill;
    g.fill();
  }
  if (stroke) {
    g.lineWidth = 1.3;
    g.strokeStyle = stroke;
    g.stroke();
  }
}
export function line(g, x, y, xx, yy, c = C.ink, w = 1, dash = []) {
  g.beginPath();
  g.setLineDash(dash);
  g.moveTo(x, y);
  g.lineTo(xx, yy);
  g.strokeStyle = c;
  g.lineWidth = w;
  g.stroke();
  g.setLineDash([]);
}
export function dot(g, x, y, r, fill, stroke) {
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  if (fill) {
    g.fillStyle = fill;
    g.fill();
  }
  if (stroke) {
    g.strokeStyle = stroke;
    g.lineWidth = 1.5;
    g.stroke();
  }
}
export function arrow(g, x, y, xx, yy, c = C.ink, w = 3) {
  const angle = Math.atan2(yy - y, xx - x),
    len = Math.hypot(xx - x, yy - y);
  if (len < 0.5) return;
  const h = Math.min(len, 8 + w);
  line(g, x, y, xx - Math.cos(angle) * h * 0.65, yy - Math.sin(angle) * h * 0.65, c, w);
  g.save();
  g.translate(xx, yy);
  g.rotate(angle);
  g.beginPath();
  g.moveTo(0, 0);
  g.lineTo(-h, -h * 0.45);
  g.lineTo(-h, h * 0.45);
  g.closePath();
  g.fillStyle = c;
  g.fill();
  g.restore();
}
export function frame(g, section) {
  g.scale(2, 2);
  g.fillStyle = C.paper;
  g.fillRect(0, 0, 960, 540);
  rect(g, 0, 0, 960, 7, C.teal);
  text(g, section, 38, 33, 14, C.teal, 'left', 'Mono', 600);
  line(g, 36, 100, 924, 100, C.muted);
}
export function heading(g, title) {
  text(g, title, 36, 73, 35, C.ink, 'left', 'Serif', 600, 885);
}
export function foot(g, s) {
  line(g, 36, 449, 924, 449, C.grid);
  text(g, s, 480, 471, 20, C.ink, 'center', 'Sans', 500, 874);
}
export function label(g, s, x, y, max = 400) {
  text(g, s, x, y, 17, C.muted, 'left', 'Sans', 600, max);
}
export function badge(g, s, x, y, color = C.teal) {
  g.font = '500 17px "Lesson Mono"';
  const w = g.measureText(s).width + 28;
  rect(g, x, y, w, 33, color, null, 4);
  mono(g, s, x + 14, y + 17, 17, C.white);
}
export function plate(g, x, y, w, h) {
  rect(g, x, y + 3, w, h, '#d2d3bf', null, 7);
  rect(g, x, y, w, h, C.light, C.muted, 7);
  for (const cx of [x + 8, x + w - 8])
    for (const cy of [y + 8, y + h - 8]) {
      dot(g, cx, cy, 2.2, C.muted);
      line(g, cx - 1, cy + 1, cx + 1, cy - 1, C.light, 0.6);
    }
}
// A ruled strip retains physical row identity as the selector travels over it.
export function table(
  g,
  {
    x,
    y,
    w,
    rows,
    names = [],
    cols = [],
    heads = 98,
    rh = 45,
    active = () => false,
    tint = () => C.pale,
    hue = () => C.ink,
    unitGain,
    font = 21,
  },
) {
  const n = rows[0].length,
    cw = (w - heads) / n;
  cols.forEach((h, j) =>
    text(g, h, x + heads + cw * (j + 0.5), y - 15, 15, C.muted, 'center', 'Sans', 600, cw - 4),
  );
  rows.forEach((row, i) => {
    rect(g, x, y + i * rh, w, rh - 2, i % 2 ? C.paper : C.light, C.grid, 2);
    if (names[i] !== undefined)
      text(g, names[i], x + 8, y + (i + 0.5) * rh, 17, C.ink, 'left', 'Sans', 600, heads - 13);
    row.forEach((v, j) => {
      const left = x + heads + cw * j;
      if (active(i, j)) rect(g, left + 1, y + i * rh + 1, cw - 2, rh - 4, tint(i, j));
      line(g, left, y + i * rh + 2, left, y + (i + 1) * rh - 4, C.grid);
      mono(
        g,
        v === null ? '·' : fmt(v),
        left + cw / 2,
        y + (i + 0.5) * rh,
        font,
        v === null ? C.muted : hue(i, j),
        'center',
        cw - 8,
      );
      const gain = unitGain?.(i, j);
      if (gain > 0) {
        const bottom = y + (i + 1) * rh - 8;
        line(g, left + 7, bottom, left + 7 + gain * (cw - 14), bottom, C.muted, 3);
      }
    });
  });
}
export function ruler(g, x, y, w, max, { step = 0.25, labelEvery = 2 } = {}) {
  line(g, x, y, x + w, y, C.ink, 1.5);
  for (let i = 0; i <= Math.round(max / step); i++) {
    const xx = x + (w * i * step) / max,
      major = i % labelEvery === 0;
    line(g, xx, y, xx, y + (major ? 9 : 4), C.muted);
    if (major) mono(g, fmt(i * step), xx, y + 22, 14, C.muted, 'center');
  }
}
export function chart(
  g,
  {
    x = 40,
    y = 126,
    w = 425,
    h = 298,
    ox = 72,
    oy = 387,
    scale = 152,
    minX = 0,
    maxX = 2,
    minY = 0,
    maxY = 1.5,
    step = 0.5,
    xlabel = 'x',
    ylabel = 'y',
  } = {},
) {
  plate(g, x, y, w, h);
  const p = (a, b) => [ox + a * scale, oy - b * scale];
  for (let a = minX; a <= maxX + 0.0001; a += step) {
    const [px] = p(a, 0);
    line(g, px, p(0, minY)[1], px, p(0, maxY)[1], a === 0 ? C.muted : C.grid, a === 0 ? 1.5 : 1);
    mono(g, fmt(a), px, p(0, minY)[1] + 14, 12, C.muted, 'center');
  }
  for (let a = minY; a <= maxY + 0.0001; a += step) {
    const [, py] = p(0, a);
    line(g, p(minX, 0)[0], py, p(maxX, 0)[0], py, a === 0 ? C.muted : C.grid, a === 0 ? 1.5 : 1);
    if (a !== 0) mono(g, fmt(a), p(minX, 0)[0] - 7, py, 12, C.muted, 'right');
  }
  text(g, xlabel, x + w - 14, y + h - 13, 14, C.teal, 'right');
  text(g, ylabel, x + 14, y + 17, 14, C.teal);
  return {
    p,
    arrow: (a, b, c, width = 4) => arrow(g, ...p(...a), ...p(...b), c, width),
    line: (a, b, c, width = 2, d = []) => line(g, ...p(...a), ...p(...b), c, width, d),
  };
}
export function pen(g, px, py) {
  dot(g, px, py, 8, C.light, C.ink);
  dot(g, px, py, 3, C.red);
  line(g, px - 13, py, px - 6, py, C.ink, 1.5);
  line(g, px, py + 6, px, py + 13, C.ink, 1.5);
}
export function scaleBars(g, x, y, w, labels, values, max, old = [], units = []) {
  values.forEach((v, i) => {
    const yy = y + i * 71;
    text(g, labels[i], x, yy, 16, C.muted);
    rect(g, x, yy + 15, w, 13, '#d5dacb', null, 2);
    if (v !== null) {
      rect(g, x, yy + 15, Math.max(0, (w * v) / max), 13, colors[i % 3], null, 2);
      mono(g, fmt(v) + (units[i] || ''), x + w + 14, yy + 20, 20, colors[i % 3]);
    }
    if (old[i] !== undefined) {
      const px = x + (w * old[i]) / max;
      line(g, px, yy + 10, px, yy + 34, C.ink, 2);
    }
  });
}
