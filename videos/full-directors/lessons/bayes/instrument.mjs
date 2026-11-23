import { density, percent, rateCutoff, requiredMass } from './evidence.mjs';

export const C = {
  dark: '#102b2e',
  body: '#1c4042',
  deep: '#0b2124',
  edge: '#426362',
  cream: '#f8efda',
  paper: '#f2ead6',
  ink: '#132f32',
  muted: '#abc4bf',
  blue: '#a5d9f7',
  trace: '#195b80',
  tail: '#6eafcb',
  grid: '#c6c8b6',
  green: '#89d9b4',
  good: '#20674f',
  bad: '#a44638',
  red: '#f39883',
  brass: '#fac572',
  brassInk: '#86510d',
};
export const clamp = (x) => Math.max(0, Math.min(1, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export function cue(k, beat, phrase, seconds = 0.55) {
  if (k.beat.beatIndex !== beat) return Number(k.beat.beatIndex > beat);
  return k.reveal(phrase, seconds);
}
export function rect(c, x, y, w, h, fill, r = 0) {
  c.fillStyle = fill;
  if (!r) {
    c.fillRect(x, y, w, h);
    return;
  }
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  c.fill();
}
export function line(c, x, y, x2, y2, color, width = 2, dashed = false) {
  c.save();
  c.strokeStyle = color;
  c.lineWidth = width;
  if (dashed) c.setLineDash([9, 9]);
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(x2, y2);
  c.stroke();
  c.restore();
}
export function path(c, pts, fill, stroke, width = 3) {
  if (!pts.length) return;
  c.beginPath();
  c.moveTo(...pts[0]);
  for (const pt of pts.slice(1)) c.lineTo(...pt);
  if (fill) {
    c.closePath();
    c.fillStyle = fill;
    c.fill();
  }
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = width;
    c.stroke();
  }
}
export function dot(c, x, y, r, col) {
  c.beginPath();
  c.arc(x, y, r, 0, 2 * Math.PI);
  c.fillStyle = col;
  c.fill();
}
export function text(
  c,
  s,
  x,
  y,
  size = 34,
  color = C.cream,
  family = 'Sans',
  align = 'left',
  weight = 400,
) {
  c.font = weight + ' ' + size + 'px "Lesson ' + family + '"';
  c.fillStyle = color;
  c.textAlign = align;
  c.textBaseline = 'alphabetic';
  c.fillText(String(s), x, y);
}
export function number(c, s, x, y, size = 50, color = C.cream, align = 'left') {
  text(c, s, x, y, size, color, 'Mono', align);
}
function metal(c, x, y, w, h, vertical = false) {
  const g = c.createLinearGradient(x, y, x + (vertical ? w : 0), y + (vertical ? 0 : h));
  for (const [at, col] of [
    [0, '#54716c'],
    [0.22, '#98aaa0'],
    [0.47, '#637e77'],
    [0.8, '#304d49'],
    [1, '#1c3535'],
  ])
    g.addColorStop(at, col);
  rect(c, x, y, w, h, g, 5);
}
export function bench(c, title) {
  const g = c.createLinearGradient(0, 0, 1920, 1080);
  g.addColorStop(0, '#2a4c49');
  g.addColorStop(0.5, C.body);
  g.addColorStop(1, C.deep);
  rect(c, 0, 0, 1920, 1080, g);
  for (const x of [38, 1882])
    for (const y of [40, 1040]) {
      dot(c, x, y, 10, C.deep);
      dot(c, x, y - 1, 7, '#9aaea4');
      line(c, x - 4, y + 3, x + 4, y - 4, '#3d5651', 2);
    }
  text(c, title, 96, 134, 66, C.cream, 'Serif');
  line(c, 96, 169, 1824, 169, '#58736c');
}
export function card(c, x, y, w, h, state, label, dim = false) {
  const fill = state === true ? C.green : state === false ? C.red : '#47706e';
  rect(c, x + 2, y + 5, w, h, C.deep, 6);
  rect(c, x, y, w, h, dim ? '#52726a' : fill, 6);
  const cx = x + w / 2,
    cy = y + h / 2;
  if (state !== null && state !== undefined) {
    const size = Math.min(w, h) * 0.25;
    const ink = dim ? C.body : state ? C.good : C.bad;
    if (state) {
      line(c, cx - size, cy, cx - size * 0.22, cy + size * 0.7, ink, Math.max(3, size / 3));
      line(
        c,
        cx - size * 0.22,
        cy + size * 0.7,
        cx + size,
        cy - size * 0.72,
        ink,
        Math.max(3, size / 3),
      );
    } else {
      line(
        c,
        cx - size * 0.78,
        cy - size * 0.78,
        cx + size * 0.78,
        cy + size * 0.78,
        ink,
        Math.max(3, size / 3),
      );
      line(
        c,
        cx + size * 0.78,
        cy - size * 0.78,
        cx - size * 0.78,
        cy + size * 0.78,
        ink,
        Math.max(3, size / 3),
      );
    }
  } else if (!label) number(c, '·', cx, cy + h * 0.16, h * 0.6, C.muted, 'center');
  if (label) text(c, label, cx, y + h + 35, 26, C.muted, 'Mono', 'center');
}
export function strip(c, x, y, outcomes, n = outcomes.length, size = 58, dimCount = 0) {
  outcomes.forEach((v, i) =>
    card(c, x + i * (size + 10), y, size, size, i < n ? v : null, undefined, i < dimCount),
  );
}
export function paper(c, x, y, w, h) {
  rect(c, x - 7, y - 6, w + 14, h + 15, C.deep, 12);
  const g = c.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, '#e0d6bd');
  g.addColorStop(0.08, '#f8f1df');
  g.addColorStop(1, '#eae4d1');
  rect(c, x, y, w, h, g, 8);
}
// Coordinates in a chart are a unit rate horizontally and the stated quantity vertically.
export function plot(
  c,
  x,
  y,
  w,
  h,
  max,
  label,
  axis = 'Candidate pass rate',
  tickStep = 0.25,
  xMax = 1,
) {
  paper(c, x, y, w, h);
  const l = x + 85,
    r = x + w - 39,
    t = y + 90,
    b = y + h - 82;
  const X = (p) => lerp(l, r, p),
    Y = (v) => lerp(b, t, v / max);
  text(c, label, x + 32, y + 49, 32, C.ink, 'Sans', 'left', 600);
  for (let j = 0; j <= 4; j++) {
    const gy = lerp(b, t, j / 4);
    line(c, l, gy, r, gy, C.grid, 1);
    if (j === 0 || j === 4)
      number(
        c,
        Number(((j * max) / 4).toPrecision(3)).toString(),
        l - 14,
        gy + 9,
        23,
        C.ink,
        'right',
      );
  }
  for (let p = 0; p <= 1.001; p += tickStep) {
    line(c, X(p), t, X(p), b, C.grid, 1);
    number(c, Number((xMax * p).toFixed(2)).toString(), X(p), b + 31, 25, C.ink, 'center');
  }
  line(c, l, b, r, b, C.ink, 2);
  text(c, axis, (l + r) / 2, y + h - 14, 24, C.ink, 'Sans', 'center');
  return { x, y, w, h, l, r, t, b, X, Y, max };
}
export function trace(
  c,
  g,
  fn,
  { lo = 0, hi = 1, color = C.trace, fill, width = 5, dashed = false } = {},
) {
  if (hi <= lo) return;
  const n = Math.max(2, Math.ceil((hi - lo) * 200)),
    pts = [];
  for (let i = 0; i <= n; i++) {
    const p = lerp(lo, hi, i / n);
    pts.push([g.X(p), g.Y(fn(p))]);
  }
  c.save();
  c.beginPath();
  c.rect(g.l - 4, g.t - 4, g.r - g.l + 8, g.b - g.t + 8);
  c.clip();
  if (fill) path(c, [[g.X(lo), g.b], ...pts, [g.X(hi), g.b]], fill);
  if (dashed) c.setLineDash([11, 8]);
  if (color) path(c, pts, null, color, width);
  c.restore();
}
export function cutoff(c, g, showLabel = true) {
  const x = g.X(rateCutoff);
  line(c, x, g.t + 25, x, g.b, C.brassInk, 3, true);
  if (showLabel) text(c, '70% cutoff', x, g.t + 13, 24, C.brassInk, 'Sans', 'center', 600);
}
export function tailPlot(c, g, m, end = 1, reference) {
  const fn = (p) => density(m, p);
  trace(c, g, fn, { lo: rateCutoff, hi: end, fill: C.tail, color: null });
  if (reference)
    trace(c, g, (p) => density(reference, p), { color: '#657172', width: 4, dashed: true });
  trace(c, g, fn);
  cutoff(c, g);
}
export function gauge(
  c,
  {
    value,
    verdict,
    zoom = false,
    label = 'Chance above cutoff',
    showMark = true,
    showMarkLabel = true,
    keepVerdictAboveRail = false,
  },
) {
  const x = 1390,
    w = 90,
    top = 300,
    b = 745,
    low = zoom ? 0.85 : 0;
  const level = (p) => lerp(b, top, clamp((p - low) / (1 - low)));
  text(c, label, 1312, 242, 35, C.cream, 'Sans', 'left', 600);
  metal(c, x - 15, top - 15, w + 30, b - top + 30, true);
  rect(c, x, top, w, b - top, '#112c31', 7);
  if (value !== null) {
    const h = b - level(value);
    rect(c, x, level(value), w, h, '#5fa5c3');
    line(c, x, level(value), x + w, level(value), C.blue, 5);
  }
  rect(c, x + 9, top + 5, 7, b - top - 10, 'rgba(255,255,255,.15)');
  for (let i = 0; i <= 10; i++) {
    const y = lerp(b, top, i / 10);
    line(c, x + w + 15, y, x + w + (i % 5 === 0 ? 46 : 31), y, '#b9c8bc', 2);
  }
  number(c, '100%', x + w + 61, top + (zoom ? 11 : -10), 27, C.muted);
  number(c, percent(low, 0), x + w + 61, b + 8, 27, C.muted);
  if (showMark) {
    const mark = level(requiredMass);
    path(
      c,
      [
        [x - 17, mark],
        [x - 46, mark - 12],
        [x - 46, mark + 12],
      ],
      C.brass,
    );
    line(c, x - 16, mark, x + w + 36, mark, C.brass, 3);
    if (showMarkLabel) text(c, '95% required', x + w + 60, mark + 9, 28, C.brass);
  }
  if (value !== null) number(c, percent(value), 1570, zoom ? 590 : 574, 64, C.blue);
  valve(c, verdict, keepVerdictAboveRail);
}
export function valve(c, verdict, keepVerdictAboveRail = false) {
  const pipeY = 852;
  if (!keepVerdictAboveRail) text(c, 'Extra traffic', 1612, 818, 29, C.muted);
  metal(c, 1320, pipeY, 475, 50);
  rect(c, 1320, pipeY + 13, 475, 24, '#112e2d');
  const open = verdict === true;
  rect(c, 1320, pipeY + 18, open ? 475 : 192, 14, open ? C.green : '#548d78');
  for (const end of [1341, 1766]) metal(c, end, pipeY - 7, 14, 64, true);
  metal(c, 1493, pipeY - 12, 53, 16, true);
  metal(c, 1493, pipeY + 45, 53, 16, true);
  const lift = open ? 45 : 0;
  rect(c, 1499, pipeY - 8 - lift, 40, 53, C.brass, 3);
  line(c, 1519, pipeY - 42 - lift, 1519, pipeY - 8 - lift, C.brass, 7);
  line(c, 1494, pipeY - 42 - lift, 1544, pipeY - 42 - lift, C.brass, 8);
  text(
    c,
    verdict === undefined ? 'Await decision' : open ? 'Increase traffic' : 'Hold traffic',
    keepVerdictAboveRail ? 1668 : 1562,
    keepVerdictAboveRail ? 818 : pipeY + 99,
    38,
    open ? C.green : C.cream,
    'Serif',
    'center',
  );
}
