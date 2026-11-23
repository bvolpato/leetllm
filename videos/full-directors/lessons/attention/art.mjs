import { lessonFont } from '../../../lib/fonts.mjs';

// Coordinates are in a 1200 by 675 drawing area. The host supplies the typefaces.
export const ink = '#252e37',
  muted = '#555c5d',
  blue = '#234c91',
  red = '#aa3936',
  teal = '#177063',
  gold = '#9a6617',
  paper = '#f8f3e7',
  edge = '#c6c0af';
export const names = ['Birds', 'sing'],
  colors = [blue, red];
export const sentence = ['Birds', 'in', 'the', 'garden', 'sing', 'softly', 'at', 'dawn'];
export const lerp = (a, b, t) => a + (b - a) * t;
export const fmt = (n, d = 2) => n.toFixed(d).replace('-', '−');
export const pct = (n) => Math.round(100 * n) + '%';
export const vec = (v, d) =>
  '[' + v.map((n) => (d === undefined ? String(n).replace('-', '−') : fmt(n, d))).join(', ') + ']';

export function text(c, s, x, y, size = 26, color = ink, face = 'Sans', align = 'left', width) {
  c.fillStyle = color;
  c.font = lessonFont(size, face.toLowerCase(), 400);
  c.textAlign = align;
  c.textBaseline = 'middle';
  if (width && c.measureText(String(s)).width > width)
    c.font = lessonFont(
      Math.floor((size * width) / c.measureText(String(s)).width),
      face.toLowerCase(),
      400,
    );
  c.fillText(String(s), x, y);
}
export function line(c, x, y, X, Y, color = edge, width = 2, dash = []) {
  c.save();
  c.beginPath();
  c.setLineDash(dash);
  c.moveTo(x, y);
  c.lineTo(X, Y);
  c.strokeStyle = color;
  c.lineWidth = width;
  c.stroke();
  c.restore();
}
export function dot(c, x, y, r, color) {
  c.fillStyle = color;
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fill();
}
export function box(c, x, y, w, h, fill, stroke, weight = 2) {
  if (fill) {
    c.fillStyle = fill;
    c.fillRect(x, y, w, h);
  }
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = weight;
    c.strokeRect(x, y, w, h);
  }
}
export function arrow(c, x, y, X, Y, color = ink, width = 4) {
  const a = Math.atan2(Y - y, X - x),
    d = 9 + width;
  line(c, x, y, X, Y, color, width);
  c.beginPath();
  c.moveTo(X, Y);
  for (const sign of [1, -1])
    c.lineTo(X - d * Math.cos(a + sign * 0.53), Y - d * Math.sin(a + sign * 0.53));
  c.closePath();
  c.fillStyle = color;
  c.fill();
}
export function ring(c, x, y, r, color, width = 3) {
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.strokeStyle = color;
  c.lineWidth = width;
  c.stroke();
}
export function heading(c, label) {
  text(c, label, 62, 67, 47, ink, 'Serif', 'left', 1080);
}
export function mono(c, s, x, y, size = 30, color = ink, align = 'left', width) {
  text(c, s, x, y, size, color, 'Mono', align, width);
}
export function label(c, s, x, y, align = 'left', color = muted) {
  text(c, s, x, y, 22, color, 'Sans', align);
}
export function bg(c, tint = paper) {
  box(c, 0, 0, 1200, 675, tint);
  for (let y = 1; y < 675; y += 7) line(c, 0, y, 1200, y + 1, '#69583c08', 0.7);
}
export function rules(c, x, y, unit, n) {
  line(c, x, y, x + unit * n, y, muted);
  for (let i = 0; i <= n * 10; i++) {
    const xx = x + (i * unit) / 10,
      major = i % 10 === 0;
    line(c, xx, y, xx, y + (major ? 12 : 5), muted, major ? 2 : 1);
    if (major) mono(c, i / 10, xx, y + 31, 21, muted, 'center');
  }
}
export function plane(c, x, y, step, minX, maxX, minY, maxY) {
  for (let i = minX; i <= maxX; i++) {
    line(
      c,
      x + i * step,
      y - minY * step,
      x + i * step,
      y - maxY * step,
      i === 0 ? ink : edge,
      i === 0 ? 2.5 : 1,
    );
    mono(c, i, x + i * step, y - minY * step + 24, 17, muted, 'center');
  }
  for (let j = minY; j <= maxY; j++) {
    line(
      c,
      x + minX * step,
      y - j * step,
      x + maxX * step,
      y - j * step,
      j === 0 ? ink : edge,
      j === 0 ? 2.5 : 1,
    );
    if (j !== 0) mono(c, j, x + minX * step - 17, y - j * step, 17, muted, 'right');
  }
  return ([a, b]) => [x + a * step, y - b * step];
}
export function ribbon(c, row, x, y, w, h = 61, word = false) {
  if (w <= 0) return;
  const base = colors[row],
    light = row ? '#d46753' : '#577ab0';
  c.save();
  c.beginPath();
  c.rect(x, y, w, h);
  c.clip();
  const dye = c.createLinearGradient(x, y, x, y + h);
  dye.addColorStop(0, light);
  dye.addColorStop(0.22, base);
  dye.addColorStop(0.8, base);
  dye.addColorStop(1, light);
  box(c, x, y, w, h, dye);
  for (let i = -20; i < w; i += 6) line(c, x + i, y, x + i + 12, y + h, '#fff4c219', 1);
  for (const yy of [y + 5, y + h - 5]) {
    line(c, x, yy, x + w, yy, '#fff1c8', 1.5);
    line(
      c,
      x,
      yy + (yy < y + h / 2 ? 4 : -4),
      x + w,
      yy + (yy < y + h / 2 ? 4 : -4),
      '#fff1c8',
      1,
      [5, 3],
    );
  }
  const start = word ? 124 : 23;
  for (let xx = x + start; xx < x + w + 20; xx += 52) {
    c.save();
    c.translate(xx, y + h * 0.5);
    c.scale(h / 65, h / 65);
    if (row === 0) bird(c, 0, 0, 0.52, '#f4d999');
    else {
      c.fillStyle = '#ffe5c2';
      c.beginPath();
      c.ellipse(-8, 7, 6, 4, -0.4, 0, Math.PI * 2);
      c.fill();
      c.beginPath();
      c.ellipse(8, 4, 6, 4, -0.4, 0, Math.PI * 2);
      c.fill();
      line(c, -3, 7, -3, -11, '#ffe5c2', 2.5);
      line(c, 13, 4, 13, -14, '#ffe5c2', 2.5);
      line(c, -3, -10, 13, -13, '#ffe5c2', 4);
    }
    c.restore();
  }
  if (word) text(c, names[row], x + 12, y + h / 2, Math.min(31, h * 0.6), '#fff3dc', 'Serif');
  c.restore();
}
export function bird(c, x, y, scale, color) {
  c.save();
  c.translate(x, y);
  c.scale(scale, scale);
  c.beginPath();
  c.moveTo(-38, 9);
  c.quadraticCurveTo(-21, 6, -15, -2);
  c.quadraticCurveTo(-29, -12, -34, -31);
  c.quadraticCurveTo(-10, -13, 4, -7);
  c.quadraticCurveTo(13, -18, 21, -12);
  c.lineTo(31, -12);
  c.lineTo(21, -6);
  c.quadraticCurveTo(10, 8, -2, 8);
  c.quadraticCurveTo(-14, 20, -27, 25);
  c.lineTo(-18, 9);
  c.lineTo(-36, 18);
  c.lineTo(-26, 9);
  c.closePath();
  c.fillStyle = color;
  c.fill();
  dot(c, 16, -11, 1.3, ink);
  c.restore();
}
export function segment(c, x, y, w, h, shares, swatches = colors) {
  let pos = x;
  shares.forEach((a, i) => {
    box(c, pos, y, w * a, h, swatches[i]);
    pos += w * a;
  });
  box(c, x, y, w, h, null, ink, 1.5);
}
export function matrix(c, data, x, y, cw, ch, opts = {}) {
  const { rows = [], cols = [], color = ink, fill = '#fffdf5', size = 28 } = opts;
  cols.forEach((v, j) =>
    text(c, v, x + (j + 0.5) * cw, y - 23, 22, muted, 'Sans', 'center', cw - 3),
  );
  data.forEach((row, i) => {
    if (rows[i] !== undefined)
      text(c, rows[i], x - 16, y + (i + 0.5) * ch, 23, ink, 'Sans', 'right');
    row.forEach((v, j) => {
      const tone = typeof fill === 'function' ? fill(i, j) : fill;
      box(c, x + j * cw + 1, y + i * ch + 1, cw - 2, ch - 2, tone, edge, 1.2);
      mono(
        c,
        v,
        x + (j + 0.5) * cw,
        y + (i + 0.5) * ch,
        size,
        typeof color === 'function' ? color(i, j) : color,
        'center',
        cw - 8,
      );
    });
  });
}
export function sharePair(c, shares, x, y, w, caption = 'shares for sing') {
  label(c, caption, x, y - 28);
  segment(c, x, y, w, 42, shares);
  text(c, names[0] + '  ' + pct(shares[0]), x, y + 73, 25, blue);
  text(c, names[1] + '  ' + pct(shares[1]), x + w, y + 73, 25, red, 'Sans', 'right');
}
export function seams(
  c,
  weights,
  values,
  { x, y, unit, gap, totals, showSecondBlue = true },
) {
  [0, 1].forEach((k) => {
    const yy = y + k * gap,
      a = weights[0] * values[0][k],
      b = weights[1] * values[1][k];
    label(c, 'Coordinate ' + (k + 1), x, yy - 30);
    ribbon(c, 0, x, yy, unit * a);
    ribbon(c, 1, x + unit * a, yy, unit * b);
    line(c, x + unit * a, yy - 5, x + unit * a, yy + 66, ink, 2);
    if (k === 0 || showSecondBlue)
      mono(c, fmt(a), x + unit * a * 0.5, yy + 86, 23, blue, 'center');
    mono(c, fmt(b), x + unit * (a + 0.5 * b), yy + 86, 23, red, 'center');
    if (totals[k]) mono(c, fmt(a + b), x + unit * (a + b) + 25, yy + 30, 37);
  });
}
export function grid(c, n, m, x, y, cell, fill) {
  for (let i = 0; i < n; i++)
    for (let j = 0; j < m; j++) box(c, x + j * cell, y + i * cell, cell - 2, cell - 2, fill(i, j));
}
export function cueClock(clock) {
  const b = clock.beat.beatIndex + 1;
  const at = (n, phrase, span = 0) => (b < n ? 0 : b > n ? 1 : clock.reveal(phrase, span));
  const after = (n, phrase, captionStart) => {
    if (b !== n) return b > n;
    if (captionStart) clock.reveal(phrase, 0, { captionStart });
    return clock.elapsed >= clock.wordCue(phrase).end - 1e-9;
  };
  return { b, at, after, elapsed: clock.elapsed, progress: clock.progress };
}
