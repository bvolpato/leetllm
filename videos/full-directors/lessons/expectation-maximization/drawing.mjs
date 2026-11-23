// Coordinates in this module use a 960 by 540 drawing surface.
export const C = {
  bg: '#101f2c',
  deep: '#0a1823',
  metal: '#253d4a',
  grid: '#38505b',
  ink: '#f4edda',
  soft: '#b5c6c9',
  fast: '#87c7ff',
  slow: '#f697af',
  gold: '#efc06b',
  sum: '#89ddb9',
  neutral: '#d6ddcf',
};
export const colors = [C.fast, C.slow];
export const mix = (a, b, t) => a + (b - a) * t;
export const fmt = (n, places = 2) => n.toFixed(places).replace('-', '−');
export const pct = (n, places = 0) => fmt(100 * n, places) + '%';
export const total = (values) => values.reduce((a, b) => a + b, 0);

// The host supplies word timings. A cue from a completed beat stays settled.
export function cue(clock, beat, words, span = 0) {
  const index = clock.beat.beatIndex + 1;
  if (index !== beat) return Number(index > beat);
  return clock.reveal(words, span);
}
export function afterCue(clock, beat, words, span = 0) {
  const index = clock.beat.beatIndex + 1;
  if (index !== beat) return Number(index > beat);
  if (!clock.reveal(words, 0, { captionStart: words })) return 0;
  const elapsed = clock.elapsed - clock.wordCue(words).end;
  if (elapsed < 0) return 0;
  return span ? Math.min(1, elapsed / span) : 1;
}
export function rect(ctx, x, y, w, h, fill, r = 0, edge = null, width = 1) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (edge) {
    ctx.strokeStyle = edge;
    ctx.lineWidth = width;
    ctx.stroke();
  }
}
export function line(ctx, x1, y1, x2, y2, color, width = 2, dash = []) {
  ctx.save();
  ctx.setLineDash(dash);
  ctx.lineWidth = width;
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}
export function path(ctx, points, color, width = 2, fill = null) {
  ctx.beginPath();
  points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  if (fill) {
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
  }
}
export function ellipse(ctx, x, y, rx, ry, fill, edge = null, width = 1) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (edge) {
    ctx.strokeStyle = edge;
    ctx.lineWidth = width;
    ctx.stroke();
  }
}
export function dot(ctx, x, y, r, color) {
  ellipse(ctx, x, y, r, r, color);
}
export function text(
  ctx,
  value,
  x,
  y,
  size = 20,
  color = C.ink,
  align = 'left',
  face = 'Sans',
  weight = 400,
) {
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.font = weight + ' ' + size + 'px "Lesson ' + face + '"';
  ctx.fillText(String(value), x, y);
}
export function head(ctx, label) {
  text(ctx, label, 51, 54, 35, C.ink, 'left', 'Serif');
}
export function readout(ctx, label, value, x, y, color = C.ink, size = 39) {
  text(ctx, label, x, y, 17, C.soft);
  text(ctx, value, x, y + 39, size, color, 'left', 'Mono');
}
export function base(ctx) {
  ctx.scale(2, 2);
  const g = ctx.createLinearGradient(0, 0, 830, 540);
  g.addColorStop(0, '#192f3b');
  g.addColorStop(1, C.deep);
  rect(ctx, 0, 0, 960, 540, g);
}
// Axes use data-space coordinates for curves, interval fills, and probe marks.
export function graph(ctx, box, xd, yd, xt, yt, xLabel, yLabel) {
  const [l, t, w, h] = box,
    b = t + h;
  const X = (x) => l + (w * (x - xd[0])) / (xd[1] - xd[0]);
  const Y = (y) => b - (h * (y - yd[0])) / (yd[1] - yd[0]);
  rect(ctx, l, t, w, h, '#112731', 6);
  for (const v of yt) {
    line(ctx, l, Y(v), l + w, Y(v), C.grid, 0.8, [3, 5]);
    text(ctx, String(v).replace('-', '−'), l - 9, Y(v), 14, C.soft, 'right', 'Mono');
  }
  for (const v of xt) {
    line(ctx, X(v), b, X(v), b + 6, C.soft, 1.5);
    text(ctx, v, X(v), b + 19, 15, C.soft, 'center', 'Mono');
  }
  line(ctx, l, b, l + w, b, C.soft, 1.3);
  text(ctx, xLabel, l + w / 2, b + 43, 16, C.soft, 'center');
  text(ctx, yLabel, l, t - 19, 16, C.soft);
  function trace(fn, color, width = 3, from = xd[0], to = xd[1], fill = null, baseline = yd[0]) {
    const steps = Math.max(100, Math.round((w * (to - from)) / (xd[1] - xd[0])));
    const pts = Array.from({ length: steps + 1 }, (_, i) => {
      const x = mix(from, to, i / steps);
      return [X(x), Y(fn(x))];
    });
    ctx.save();
    ctx.beginPath();
    ctx.rect(l, t - 1, w, h + 2);
    ctx.clip();
    if (fill) path(ctx, [[X(from), Y(baseline)], ...pts, [X(to), Y(baseline)]], null, 0, fill);
    if (color) path(ctx, pts, color, width);
    ctx.restore();
  }
  return { X, Y, trace, l, t, w, h, b };
}
export function band(ctx, g, low, high, color = '#eacb8420') {
  rect(ctx, g.X(low), g.t, g.X(high) - g.X(low), g.h, color);
}
export function pin(ctx, g, x, label, color = C.gold) {
  line(ctx, g.X(x), g.t + 1, g.X(x), g.b, color, 1.8, [5, 4]);
  path(
    ctx,
    [
      [g.X(x) - 5, g.t + 1],
      [g.X(x) + 5, g.t + 1],
      [g.X(x), g.t + 9],
    ],
    null,
    0,
    color,
  );
  if (label) {
    const px = g.X(x);
    const align = px < g.l + 85 ? 'left' : 'center';
    text(ctx, label, align === 'left' ? px + 6 : px, g.t - 42, 17, color, align, 'Mono');
  }
}
export function split(ctx, x, y, w, h, share, r = 3) {
  rect(ctx, x, y, w, h, C.slow, r);
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.clip();
  rect(ctx, x, y, w * share, h, C.fast);
  ctx.restore();
  if (share > 0.005 && share < 0.995) line(ctx, x + w * share, y, x + w * share, y + h, C.bg, 2);
}
export function specimen(ctx, x, y, w, label, value, color) {
  rect(ctx, x, y, w, 68, C.deep, 5, C.grid);
  text(ctx, label, x + 14, y + 17, 14, C.soft);
  text(ctx, value, x + 14, y + 45, 23, color, 'left', 'Mono');
}
