export const C = {
  bg: '#122629',
  panel: '#1c3537',
  edge: '#496064',
  text: '#f3efd9',
  dim: '#b4c4bb',
  gold: '#ffca70',
  teal: '#8addcb',
  red: '#f99a88',
  blue: '#97c6ea',
  dark: '#102629',
  paper: '#f1ebd6',
  ink: '#263d3d',
  grid: '#365052',
};
export const classColors = ['#8bbcd6', '#a2d5b9', '#c9a2ca', '#dfbb83'];
export const fmt = (n) => Number(n.toFixed(3)).toString();
export const pct = (n) => fmt(n * 100) + '%';
export const clamp = (n) => Math.max(0, Math.min(1, n));
export const mix = (a, b, p) => a + (b - a) * p;
export const ease = (p) => p * p * (3 - 2 * p);
export function timing(clock) {
  const b = clock.beat.beatIndex + 1;
  function amount(n, phrase = '', duration = 0) {
    if (b !== n) return b > n ? 1 : 0;
    if (phrase === 'end') return Number(clock.elapsed >= clock.speechDuration);
    if (!phrase) return duration ? clamp(clock.elapsed / duration) : 1;
    return clock.reveal(phrase, duration);
  }
  function after(n, phrase, captionStart = phrase) {
    if (b !== n) return b > n;
    const { start, end } = clock.wordCue(phrase);
    return clock.reveal(phrase, end - start, { captionStart }) === 1;
  }
  return { b, amount, after, on: (n, s) => amount(n, s) === 1 };
}
export function text(
  c,
  s,
  x,
  y,
  size = 18,
  color = C.text,
  align = 'left',
  face = 'Sans',
  weight = 400,
) {
  c.font = weight + ' ' + size + 'px "Lesson ' + face + '"';
  c.textAlign = align;
  c.textBaseline = 'middle';
  c.fillStyle = color;
  c.fillText(String(s), x, y);
}
export function line(c, x, y, X, Y, color = C.edge, w = 1) {
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(X, Y);
  c.strokeStyle = color;
  c.lineWidth = w;
  c.stroke();
}
export function rect(c, x, y, w, h, col, r = 0) {
  c.fillStyle = col;
  if (r) {
    c.beginPath();
    c.roundRect(x, y, w, h, r);
    c.fill();
  } else c.fillRect(x, y, w, h);
}
export function ring(c, x, y, r, col, width = 2) {
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.lineWidth = width;
  c.strokeStyle = col;
  c.stroke();
}
export function dot(c, x, y, r, col) {
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fillStyle = col;
  c.fill();
}
export function poly(c, points, col) {
  c.beginPath();
  c.moveTo(...points[0]);
  for (const p of points.slice(1)) c.lineTo(...p);
  c.closePath();
  c.fillStyle = col;
  c.fill();
}
export function diamond(c, x, y, r, col) {
  poly(
    c,
    [
      [x, y - r],
      [x + r, y],
      [x, y + r],
      [x - r, y],
    ],
    col,
  );
}
export function dash(c, x, y, X, Y, col, w = 1) {
  c.save();
  c.setLineDash([4, 5]);
  line(c, x, y, X, Y, col, w);
  c.restore();
}
export function backdrop(c) {
  const g = c.createLinearGradient(0, 0, 960, 540);
  g.addColorStop(0, '#203b3e');
  g.addColorStop(0.62, C.bg);
  g.addColorStop(1, '#102327');
  rect(c, 0, 0, 960, 540, g);
}
export function head(c, kicker, title) {
  text(c, kicker, 42, 36, 14, C.teal, 'left', 'Mono');
  text(c, title, 40, 86, 35, C.text, 'left', 'Serif');
}
export function plate(c, x, y, w, h) {
  rect(c, x, y + 4, w, h, '#0b2021', 9);
  rect(c, x, y, w, h, C.edge, 8);
  rect(c, x + 2, y + 2, w - 4, h - 4, C.panel, 7);
  for (const dx of [10, w - 10])
    for (const dy of [10, h - 10]) {
      dot(c, x + dx, y + dy, 2, '#859690');
      line(c, x + dx - 1.4, y + dy + 1, x + dx + 1.4, y + dy - 1, C.dark, 0.85);
    }
}
export function ticks(c, map, values, y, unit = 'ms') {
  line(c, map(values[0]), y, map(values.at(-1)), y, C.edge, 1.5);
  for (const v of values) {
    const x = map(v);
    line(c, x, y - 5, x, y + 5, C.dim, 1);
    text(c, v, x, y + 20, 14, C.dim, 'center', 'Mono');
  }
  if (unit) text(c, unit, map(values.at(-1)) + 26, y + 20, 14, C.dim, 'left', 'Mono');
}
export function bracket(c, x, X, y, col, w = 8) {
  line(c, x, y, X, y, col, w);
  line(c, x, y - 9, x, y + 9, col, 3);
  line(c, X, y - 9, X, y + 9, col, 3);
}
export function slot(c, x, y, v, label, active = false, w = 66) {
  rect(c, x - w / 2, y - 21, w, 43, active ? C.gold : '#31494a', 4);
  text(c, v, x, y + 1, 24, active ? C.ink : C.text, 'center', 'Mono', 600);
  if (label) text(c, label, x, y + 42, 14, C.dim, 'center', 'Mono');
}
export function measure(
  c,
  s,
  {
    deadline = 50,
    x = 120,
    X = 850,
    y = 284,
    min = 20,
    max = 68,
    showBand = true,
    showResult = true,
    showLate = false,
  } = {},
) {
  const xx = (n) => x + ((n - min) / (max - min)) * (X - x);
  line(c, x, y, X, y, C.edge, 2);
  if (showBand) {
    if (Number.isFinite(s.q)) {
      bracket(c, xx(s.lo), xx(s.hi), y, C.gold, 12);
      text(c, s.lo, xx(s.lo), y - 34, 23, C.gold, 'center', 'Mono');
      text(c, s.hi, xx(s.hi), y - 34, 23, C.gold, 'center', 'Mono');
    } else {
      bracket(c, x, X, y, C.gold, 9);
      text(c, '←   −∞', x, y - 28, 20, C.gold);
      text(c, '+∞   →', X, y - 28, 20, C.gold, 'right');
    }
  }
  diamond(c, xx(s.center), y, 8, C.blue);
  text(c, 'forecast ' + s.center, xx(s.center), y + 31, 16, C.blue, 'center');
  if (s.arrival != null) {
    const ax = xx(s.arrival);
    const atEndpoint = s.arrival === s.hi || s.arrival === s.lo;
    line(c, ax, y - 93, ax, atEndpoint ? y - 51 : y - 9, C.text, 1.5);
    if (atEndpoint) line(c, ax, y - 19, ax, y - 9, C.text, 1.5);
    dot(c, ax, y, 5, C.text);
    text(c, 'arrival ' + s.arrival, ax, y - 106, 18, C.text, 'center');
    if (showResult)
      text(
        c,
        s.hit ? 'covered' : 'outside',
        ax,
        y - 136,
        20,
        s.hit ? C.teal : C.red,
        'center',
        'Serif',
      );
  }
  if (deadline != null) {
    const dy = y + 94;
    line(c, x, dy, X, dy, C.edge, 2);
    line(c, x, dy, xx(deadline), dy, C.blue, 5);
    line(c, xx(deadline), dy - 12, xx(deadline), dy + 12, C.red, 3);
    text(c, 'deadline ' + deadline, xx(deadline), dy + 33, 17, C.red, 'center');
    if (s.arrival != null) {
      dash(c, xx(s.arrival), y + 10, xx(s.arrival), dy - 6, C.dim);
      diamond(c, xx(s.arrival), dy, 7, C.text);
      if (showLate)
        text(
          c,
          s.arrival > deadline ? s.arrival - deadline + ' ms late' : 'on time',
          X,
          dy - 22,
          18,
          s.arrival > deadline ? C.red : C.teal,
          'right',
        );
    }
  }
}
