import { chart, names, riseIndex, badge, boxCorners } from './model.mjs';

export const P = {
  paper: '#f4efe3',
  ink: '#1b303e',
  muted: '#475e62',
  rule: '#a9b4aa',
  panel: '#142d3b',
  panel2: '#213e4b',
  light: '#f6f2df',
  dim: '#baccca',
  grid: '#47606a',
  sky: '#81cded',
  green: '#a5e6a4',
  pink: '#f7a8a9',
  gold: '#f6ca76',
  teal: '#176c62',
  red: '#a03e36',
  lilac: '#b9b5ed',
};
export const traceColors = [P.sky, P.green, P.pink];
export const clamp = (x) => Math.max(0, Math.min(1, x));
export function fill(c, x, y, w, h, col) {
  c.fillStyle = col;
  c.fillRect(x, y, w, h);
}
export function box(c, x, y, w, h, col, stroke = null, r = 14) {
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  if (col) {
    c.fillStyle = col;
    c.fill();
  }
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = 2;
    c.stroke();
  }
}
export function line(c, x, y, X, Y, col, w = 3, dash = []) {
  c.save();
  c.strokeStyle = col;
  c.lineWidth = w;
  c.setLineDash(dash);
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(X, Y);
  c.stroke();
  c.restore();
}
export function label(c, v, x, y, sz = 36, col = P.ink, opt = {}) {
  c.font = (opt.weight ?? 400) + ' ' + sz + 'px "Lesson ' + (opt.font ?? 'Sans') + '"';
  c.textBaseline = 'middle';
  c.textAlign = opt.align ?? 'left';
  c.fillStyle = col;
  c.fillText(String(v), x, y);
}
export const mono = (c, v, x, y, sz = 30, col = P.muted, align = 'left') =>
  label(c, v, x, y, sz, col, { font: 'Mono', align });
export const serif = (c, v, x, y, sz = 62, col = P.ink, align = 'left') =>
  label(c, v, x, y, sz, col, { font: 'Serif', align });
export function mark(c, i, x, y, r = 8, col = traceColors[i]) {
  c.fillStyle = col;
  c.beginPath();
  if (i === 0) c.rect(x - r, y - r, 2 * r, 2 * r);
  else if (i === 1) {
    c.moveTo(x, y - r * 1.4);
    c.lineTo(x + r * 1.4, y);
    c.lineTo(x, y + r * 1.4);
    c.lineTo(x - r * 1.4, y);
    c.closePath();
  } else {
    c.arc(x, y, r, 0, 2 * Math.PI);
  }
  c.fill();
}
export function opacity(c, a, draw) {
  if (a <= 0) return;
  c.save();
  c.globalAlpha *= clamp(a);
  draw();
  c.restore();
}
export function clip(c, x, y, w, h, draw) {
  c.save();
  c.beginPath();
  c.rect(x, y, w, h);
  c.clip();
  draw();
  c.restore();
}
export function corner(c, x, y, w, h, col = P.gold, l = 16, width = 4) {
  for (const [cx, cy, dx, dy] of [
    [x, y, 1, 1],
    [x + w, y, -1, 1],
    [x + w, y + h, -1, -1],
    [x, y + h, 1, -1],
  ]) {
    line(c, cx, cy, cx + dx * l, cy, col, width);
    line(c, cx, cy, cx, cy + dy * l, col, width);
  }
}
export function page(c, title, kicker) {
  fill(c, 0, 0, 1920, 1080, P.paper);
  mono(c, kicker.toUpperCase(), 80, 59, 26, P.teal);
  line(c, 80, 94, 1840, 94, P.rule, 2);
  serif(c, title, 78, 165, 65);
}
export function footer(c, main, sub = '', { ruleY = 894, mainY = 940, subY = 998 } = {}) {
  line(c, 80, ruleY, 1840, ruleY, P.rule, 2);
  label(c, main, 80, mainY, 39, P.ink, { weight: 600 });
  if (sub) label(c, sub, 80, subY, 30, P.muted);
}
export function caption(c, a, b, x, y) {
  mono(c, a.toUpperCase(), x, y, 26, P.teal);
  label(c, b, x, y + 56, 42);
}
export const cue = (k, i, phrase, span = 0.65) =>
  k.beat.beatIndex < i ? 0 : k.beat.beatIndex > i ? 1 : k.reveal(phrase, span);
export const resolved = (k, i, phrase) => cue(k, i, phrase, 0) === 1;
export const lastWordDone = (k, i) =>
  k.beat.beatIndex > i || (k.beat.beatIndex === i && k.elapsed >= k.speechDuration);
export function viewport(c, x, y, s, draw) {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  draw();
  c.restore();
}

// All dashboard coordinates describe a 1000 by 480 source image, including its legend.
export const chartX = (i) => 84 + i * 170,
  chartY = (v) => 338 - 23 * v;
export function plot(
  c,
  {
    legend = names,
    legendSwap = 0,
    open = 1,
    highlight = 0,
    answer = false,
    region = false,
    showBadge = true,
    readout = false,
  } = {},
) {
  box(c, 0, 0, 1000, 480, P.panel, null, 15);
  label(c, 'Service response time (ms)', 35, 40, 28, P.light, { weight: 600 });
  if (showBadge) {
    box(c, badge.x, badge.y, badge.w, badge.h, '#63484a', null, 9);
    mark(c, 2, badge.x + 24, badge.y + 23, 6, P.pink);
    mono(c, 'PAGING', badge.x + 44, badge.y + 24, 23, P.light);
  }
  for (const n of [0, 5, 10]) {
    const y = chartY(n);
    line(c, 76, y, 950, y, P.grid, 1.7);
    mono(c, n, 58, y, 20, P.dim, 'right');
  }
  chart.hours.forEach((h, i) => {
    mono(c, h + ' pm', chartX(i), 368, 19, P.dim, 'center');
  });
  const threshold = chart.hours.indexOf(chart.afterHour);
  line(c, chartX(threshold), 83, chartX(threshold), 344, P.gold, 2, [5, 6]);
  chart.series.forEach(({ values }, i) => {
    for (let j = 1; j < values.length; j++)
      line(
        c,
        chartX(j - 1),
        chartY(values[j - 1]),
        chartX(j),
        chartY(values[j]),
        traceColors[i],
        i === riseIndex ? 4.4 : 3,
      );
    values.forEach((v, j) => mark(c, i, chartX(j), chartY(v), i === riseIndex ? 5.7 : 4.3));
  });
  const rv = chart.series[riseIndex].values;
  if (highlight > 0) {
    const t = highlight * (rv.length - 1 - threshold),
      j = Math.min(rv.length - 2, threshold + Math.floor(t)),
      f = threshold + t - j;
    mark(
      c,
      riseIndex,
      chartX(j) + f * (chartX(j + 1) - chartX(j)),
      chartY(rv[j] + f * (rv[j + 1] - rv[j])),
      10,
    );
  }
  if (readout) {
    mono(
      c,
      rv[threshold].toFixed(1),
      chartX(threshold) + 10,
      chartY(rv[threshold]) - 21,
      21,
      P.green,
    );
    mono(c, rv.at(-1).toFixed(1), chartX(5) - 10, chartY(rv.at(-1)) - 22, 21, P.green, 'right');
  }
  fill(c, 1, 403, 998, 75, P.panel2);
  legend.forEach((name, i) => {
    const x = 82 + i * 311;
    mark(c, i, x, 441, 9);
    const shift = i < 2 ? legendSwap * (i ? -311 : 311) : 0;
    const arc = i < 2 ? Math.sin(Math.PI * legendSwap) * (i ? 25 : -25) : 0;
    label(c, name, x + 28 + shift, 442 + arc, 27, P.light, { weight: 600 });
  });
  if (answer) corner(c, 358, 414, 230, 54, P.green, 11, 3);
  if (open < 1)
    clip(c, 0, 403, 1000, 76, () => {
      const top = 403 + 76 * open;
      fill(c, 0, top, 1000, 77, '#d8d9cc');
      for (let x = -70; x < 1010; x += 29) line(c, x, top + 73, x + 74, top, '#bec3b8', 2);
      fill(c, 425, top + 17, 150, 7, P.muted);
    });
  if (region) {
    const [x, y, X, Y] = boxCorners(badge);
    corner(c, x, y, X - x, Y - y, P.gold, 17, 5);
  }
}
export function tileGrid(c, x, y, cols, rows, cell, color, gap = 2) {
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++)
      fill(c, x + i * cell, y + j * cell, cell - gap, cell - gap, color);
}
export function arrow(c, x, y, X, Y, color = P.teal, width = 4) {
  line(c, x, y, X, Y, color, width);
  const angle = Math.atan2(Y - y, X - x);
  for (const delta of [-0.55, 0.55])
    line(c, X, Y, X - 15 * Math.cos(angle + delta), Y - 15 * Math.sin(angle + delta), color, width);
}
export function ruler(c, x, y, w, max, ticks) {
  line(c, x, y, x + w, y, P.muted, 2);
  for (const n of ticks) {
    const xx = x + (w * n) / max;
    line(c, xx, y, xx, y + 12, P.muted, 2);
    mono(c, n.toLocaleString('en-US'), xx, y + 42, 25, P.muted, 'center');
  }
}
