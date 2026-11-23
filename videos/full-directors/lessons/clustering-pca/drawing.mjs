export const night = {
  bg: '#112c38',
  edge: '#0c222c',
  ink: '#fff2ce',
  sub: '#b8d0cb',
  faint: '#365460',
  line: '#749193',
  brass: '#ffd280',
  teal: '#79d7c3',
  red: '#ff9f88',
  blue: '#9cbff1',
  violet: '#dcaddd',
};
export const paper = {
  bg: '#f3ead2',
  edge: '#e6d8b8',
  ink: '#203b43',
  sub: '#466060',
  faint: '#d8cbb0',
  line: '#84918a',
  brass: '#945618',
  teal: '#117768',
  red: '#a64235',
  blue: '#345f9a',
  violet: '#7e4e83',
};
export const ids = 'ABCDEF'.split('');
export const names = [
  'Charged twice',
  'Duplicate payment',
  'Missing reset link',
  'Two-factor code',
  'Release runbook',
  'Release approval',
];
export const mix = (a, b, t) => a + (b - a) * t;
export const between = (a, b, t) => a.map((v, i) => mix(v, b[i], t));
export const sum = (a) => a.reduce((n, v) => n + v, 0);
export const dot = (a, b) => sum(a.map((v, i) => v * b[i]));
export const minus = (a, b) => a.map((v, i) => v - b[i]);
export const plus = (a, b) => a.map((v, i) => v + b[i]);
export const times = (a, k) => a.map((v) => v * k);
export const f = (v, n = 2) => Number(v.toFixed(n)).toFixed(n).replace('-', '−');
export const pair = (a, n = 1) => '(' + a.map((v) => f(v, n)).join(', ') + ')';
export const nearIndex = (values) => values.indexOf(Math.min(...values));
export function cue(clock, beat, phrase, seconds = 0) {
  const i = clock.beat.beatIndex;
  if (i !== beat) return Number(i > beat);
  const v = clock.reveal(phrase, seconds);
  return v * v * (3 - 2 * v);
}
export function surface(ctx, p) {
  const grad = ctx.createLinearGradient(0, 0, 1900, 1100);
  grad.addColorStop(0, p.bg);
  grad.addColorStop(0.68, p.bg);
  grad.addColorStop(1, p.edge);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1920, 1080);
  // The faint registration ticks belong to the measuring surface.
  ctx.fillStyle = p.faint;
  for (let x = 65; x < 1870; x += 19) ctx.fillRect(x, 30, 2, (x - 65) % 95 === 0 ? 13 : 5);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  const text = (v, x, y, size = 38, color = p.ink, face = 'Sans', align = 'left', weight = 400) => {
    ctx.font = weight + ' ' + size + 'px "Lesson ' + face + '"';
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillText(String(v), x, y);
  };
  const line = (a, b, color = p.line, w = 3, dash = []) => {
    ctx.beginPath();
    ctx.moveTo(...a);
    ctx.lineTo(...b);
    ctx.strokeStyle = color;
    ctx.lineWidth = w;
    ctx.setLineDash(dash);
    ctx.stroke();
    ctx.setLineDash([]);
  };
  const poly = (pts, fill, stroke = null, w = 2) => {
    ctx.beginPath();
    ctx.moveTo(...pts[0]);
    pts.slice(1).forEach((pt) => ctx.lineTo(...pt));
    ctx.closePath();
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = w;
      ctx.stroke();
    }
  };
  const circle = (pt, r, fill, stroke = null, w = 3) => {
    if (r <= 0) return;
    ctx.beginPath();
    ctx.arc(...pt, r, 0, 2 * Math.PI);
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = w;
      ctx.stroke();
    }
  };
  const pin = (pt, c = p.ink, r = 11) => {
    circle(pt, r + 2, p.bg);
    circle(pt, r, c);
    circle([pt[0] - r * 0.18, pt[1] - r * 0.23], r * 0.26, p.bg);
  };
  const target = (pt, r = 19, c = p.brass) => {
    circle(pt, r, null, c, 3);
    for (const [x, y] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ])
      line(
        [pt[0] + x * (r - 6), pt[1] + y * (r - 6)],
        [pt[0] + x * (r + 8), pt[1] + y * (r + 8)],
        c,
        3,
      );
    circle(pt, 3, c);
  };
  const arrow = (a, b, c = p.ink, w = 5) => {
    const d = minus(b, a),
      len = Math.hypot(...d);
    if (len < 1) return;
    const u = times(d, 1 / len),
      n = [-u[1], u[0]],
      size = Math.min(len * 0.4, 10 + w);
    const base = minus(b, times(u, size));
    line(a, base, c, w);
    poly([b, plus(base, times(n, size * 0.52)), minus(base, times(n, size * 0.52))], c);
  };
  const rect = (x, y, w, h, fill, stroke = null, width = 2) => {
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fillRect(x, y, w, h);
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = width;
      ctx.strokeRect(x, y, w, h);
    }
  };
  const title = (v, tag) => {
    if (tag) text(tag, 80, 85, 26, p.sub, 'Mono');
    text(v, 78, tag ? 156 : 115, 66, p.ink, 'Serif');
  };
  const note = (v, x, y, c = p.sub) => text(v, x, y, 29, c);
  const value = (label, v, x, y, c = p.ink, size = 69) => {
    note(label, x, y);
    text(v, x, y + 70, size, c, 'Serif');
  };
  const tag = (v, x, y, color = p.ink, size = 34, align = 'left') => {
    ctx.font = '500 ' + size + 'px "Lesson Sans"';
    const w = ctx.measureText(v).width,
      dx = align === 'right' ? w : align === 'center' ? w / 2 : 0;
    rect(x - dx - 6, y - size * 0.56, w + 12, size * 1.12, p.bg);
    text(v, x, y, size, color, 'Sans', align, 500);
  };
  const group = (i) => [p.teal, p.blue, p.red, p.violet, p.brass, p.ink][i];
  return {
    ctx,
    p,
    text,
    line,
    poly,
    circle,
    pin,
    target,
    arrow,
    rect,
    title,
    note,
    value,
    tag,
    group,
  };
}
export function grid(a, origin, scale, extent) {
  const [x0, x1, y0, y1] = extent,
    pt = ([x, y]) => [origin[0] + scale * x, origin[1] - scale * y];
  for (let x = x0; x <= x1; x++)
    a.line(pt([x, y0]), pt([x, y1]), x === 0 ? a.p.line : a.p.faint, x === 0 ? 2.5 : 1);
  for (let y = y0; y <= y1; y++)
    a.line(pt([x0, y]), pt([x1, y]), y === 0 ? a.p.line : a.p.faint, y === 0 ? 2.5 : 1);
  return pt;
}
export function constellation(a, pt, points, colors = [], offsets = []) {
  points.forEach((v, i) => {
    const s = pt(v),
      [dx, dy] = offsets[i] || [0, i % 2 === 0 ? 34 : -31];
    a.pin(s, colors[i] ?? a.p.ink);
    a.tag(ids[i], s[0] + dx, s[1] + dy, colors[i] ?? a.p.ink, 27, 'center');
  });
}
export function center(a, pt, c) {
  const [x, y] = pt,
    s = 15;
  a.poly(
    [
      [x - s, y],
      [x, y - s],
      [x + s, y],
      [x, y + s],
    ],
    a.p.bg,
    c,
    4,
  );
  a.circle(pt, 3, c);
}
export function filingTab(a, x, y, w, id, label, color, active = false) {
  const h = 72,
    fold = 15;
  a.poly(
    [
      [x, y],
      [x + w - fold, y],
      [x + w, y + fold],
      [x + w, y + h],
      [x, y + h],
    ],
    active ? color : a.p.bg,
    color,
    2,
  );
  a.line([x + w - fold, y], [x + w - fold, y + fold], active ? a.p.bg : color, 2);
  a.line([x + w - fold, y + fold], [x + w, y + fold], active ? a.p.bg : color, 2);
  a.text(id, x + 19, y + h / 2, 37, active ? a.p.bg : color, 'Mono', 'left', 600);
  a.text(label, x + 65, y + h / 2, 32, active ? a.p.bg : a.p.ink);
}
