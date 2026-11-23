export const C = {
  paper: '#f7f3e9',
  ink: '#182d3b',
  mute: '#506570',
  rule: '#b5c2c1',
  pale: '#e5e9df',
  white: '#fffdf5',
  q: '#245b9c',
  k: '#a55c00',
  gold: '#ffd06b',
  qLight: '#c9e2f2',
  green: '#087059',
  mint: '#cae8d6',
  red: '#ab393a',
  rose: '#f5d4c8',
  violet: '#71558f',
};
export const inks = [C.q, C.k, C.green, C.violet];
export const TAU = 2 * Math.PI;
export const mix = (a, b, t) => a + (b - a) * t;
export const fmt = (v, d = 3) =>
  (Math.abs(v) < 0.5 * 10 ** -d ? 0 : v).toFixed(d).replace('-', '−');
export const vec = (a, d = 3) => '[' + a.map((v) => fmt(v, d)).join(', ') + ']';
export const beat = (t) => t.beat.beatIndex + 1;
export function cue(t, n, words, span = 0.85) {
  if (beat(t) !== n) return beat(t) > n ? 1 : 0;
  const u = t.reveal(words, span);
  return u * u * (3 - 2 * u);
}
export function box(c, x, y, w, h, fill, stroke, sw = 2) {
  c.fillStyle = fill;
  c.fillRect(x, y, w, h);
  if (stroke) {
    c.lineWidth = sw;
    c.strokeStyle = stroke;
    c.strokeRect(x, y, w, h);
  }
}
export function line(c, x, y, u, v, color = C.rule, sw = 3, dash = []) {
  c.save();
  c.beginPath();
  c.setLineDash(dash);
  c.moveTo(x, y);
  c.lineTo(u, v);
  c.strokeStyle = color;
  c.lineWidth = sw;
  c.stroke();
  c.restore();
}
export function path(c, pts, color, sw = 3, fill = false) {
  c.beginPath();
  pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  if (fill) {
    c.closePath();
    c.fillStyle = color;
    c.fill();
  } else {
    c.strokeStyle = color;
    c.lineWidth = sw;
    c.stroke();
  }
}
export function disk(c, x, y, r, color, stroke, sw = 2) {
  c.beginPath();
  c.arc(x, y, r, 0, TAU);
  c.fillStyle = color;
  c.fill();
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = sw;
    c.stroke();
  }
}
export function label(
  c,
  s,
  x,
  y,
  size = 38,
  color = C.ink,
  align = 'left',
  face = 'Sans',
  weight = 400,
) {
  c.fillStyle = color;
  c.font = weight + ' ' + size + 'px "Lesson ' + face + '"';
  c.textAlign = align;
  c.textBaseline = 'middle';
  c.fillText(String(s), x, y);
}
export const num = (c, s, x, y, size = 46, col = C.ink, align = 'left') =>
  label(c, s, x, y, size, col, align, 'Mono', 500);
export const title = (c, s, x = 94, y = 105, size = 76) =>
  label(c, s, x, y, size, C.ink, 'left', 'Serif', 500);
export function pairLabel(c, s, v, x, y, color = C.ink, size = 70) {
  label(c, s, x, y, 32, C.mute);
  num(c, v, x, y + 88, size, color);
}
export function arrow(c, x, y, angle, len, col, sw = 9) {
  const tip = [x + len * Math.cos(angle), y - len * Math.sin(angle)];
  const head = Math.min(Math.max(12, sw * 2.2), len * 0.27);
  c.save();
  c.translate(x, y);
  c.rotate(-angle);
  line(c, 0, 0, len - head * 0.8, 0, col, sw);
  path(
    c,
    [
      [len, 0],
      [len - head, head * 0.48],
      [len - head, -head * 0.48],
    ],
    col,
    1,
    true,
  );
  c.restore();
  return tip;
}
export function dial(c, x, y, r) {
  disk(c, x, y, r, C.white, C.rule, 3);
  for (let i = 0; i < 48; i++) {
    const a = (i * TAU) / 48,
      inner = r - (i % 4 === 0 ? 15 : 6);
    line(
      c,
      x + inner * Math.cos(a),
      y - inner * Math.sin(a),
      x + (r - 2) * Math.cos(a),
      y - (r - 2) * Math.sin(a),
      C.rule,
      i % 4 === 0 ? 3 : 1.5,
    );
  }
  line(c, x - r + 6, y, x + r - 6, y, C.rule, 2);
  line(c, x, y - r + 6, x, y + r - 6, C.rule, 2);
}
export function instrument(
  c,
  x,
  y,
  r,
  qAngle,
  kAngle,
  { qLength = 1, unit = r * 0.79, project = true } = {},
) {
  dial(c, x, y, r);
  const projection = Math.cos(kAngle - qAngle);
  const foot = [x + unit * projection * Math.cos(qAngle), y - unit * projection * Math.sin(qAngle)];
  const tip = [x + unit * Math.cos(kAngle), y - unit * Math.sin(kAngle)];
  if (project) {
    path(c, [[x, y], foot, tip], '#e2eddb', 2, true);
    line(c, ...tip, ...foot, C.green, 3, [8, 7]);
    line(
      c,
      x - unit * Math.cos(qAngle),
      y + unit * Math.sin(qAngle),
      x + unit * Math.cos(qAngle),
      y - unit * Math.sin(qAngle),
      C.q,
      2,
    );
  }
  arrow(c, x, y, qAngle, unit * qLength, C.q, Math.max(7, r * 0.052));
  arrow(c, x, y, kAngle, unit, '#b97708', Math.max(5, r * 0.034));
  if (project) {
    line(c, x, y, ...foot, C.green, Math.max(4, r * 0.02));
    disk(c, ...foot, Math.max(5, r * 0.033), C.green, C.white, 2);
  }
  disk(c, x, y, Math.max(5, r * 0.024), C.ink);
}
export function strip(c, x, y, w, h, shares, colors) {
  let left = x;
  shares.forEach((share, i) => {
    if (share > 0) box(c, left, y, w * share, h, colors[i]);
    left += w * share;
  });
}
export function axis(c, x1, x2, y, start, end, step) {
  line(c, x1, y, x2, y, C.mute, 4);
  for (let i = start; i <= end; i += step) {
    const x = mix(x1, x2, (i - start) / (end - start));
    line(c, x, y - 10, x, y + 13, C.mute, 3);
    num(c, i, x, y + 42, 28, C.mute, 'center');
  }
}
export function plate(c, x, y, w, h, fill, edge = C.ink) {
  const cut = 14;
  path(
    c,
    [
      [x + cut, y + 7],
      [x + w, y + 7],
      [x + w, y + h - cut + 7],
      [x + w - cut, y + h + 7],
      [x, y + h + 7],
      [x, y + cut + 7],
    ],
    edge,
    1,
    true,
  );
  path(
    c,
    [
      [x + cut, y],
      [x + w, y],
      [x + w, y + h - cut],
      [x + w - cut, y + h],
      [x, y + h],
      [x, y + cut],
    ],
    fill,
    1,
    true,
  );
}
export const blank = (c) => box(c, 0, 0, 1920, 1080, C.paper);
