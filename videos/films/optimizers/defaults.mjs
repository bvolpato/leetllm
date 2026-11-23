import { PRESCRIBED_GRADIENTS } from './fixtures.mjs';
import { fmt, pair } from './arithmetic.mjs';
export function drawOptimizerText(ctx, api, C, s, x, y, size = 32, color = C.ink, align = 'left') {
  return api.text(ctx, s, x, y, size, color, align);
}
export function drawOptimizerMath(ctx, api, C, s, x, y, size = 40, color = C.ink, align = 'left') {
  return api.math(ctx, s, x, y, size, color, align);
}
export function drawOptimizerLine(ctx, api, C, x1, y1, x2, y2, color = C.muted, width = 2) {
  return api.line(ctx, x1, y1, x2, y2, color, width);
}
export function drawOptimizerArrow(ctx, api, a, z, color, width = 5) {
  return api.arrow(ctx, a.x, a.y, z.x, z.y, color, width);
}
export function drawOptimizerFocus(ctx, api, id, fn) {
  return api.focus.target(id, fn);
}
export function drawOptimizerHeader(
  ctx,
  api,
  C,
  subtitle,
  right = 'Same loss · same starting errors',
) {
  drawOptimizerText(ctx, api, C, subtitle, 150, 230, 32, C.muted);
  drawOptimizerText(ctx, api, C, right, 1770, 230, 27, C.muted, 'right');
}
export function drawOptimizerBowl(
  ctx,
  api,
  C,
  t,
  { x = 235, y = 330, width = 990, height = 540, xd = [-1.3, 1.3], yd = [-0.35, 1.2] } = {},
) {
  const plot = t.axes({
    color: C.muted,
    x,
    y,
    width,
    height,
    xDomain: xd,
    yDomain: yd,
    equalUnits: true,
    xTicks: xd[1] > 2 ? [-2, 0, 2] : [-1, 0, 1].filter((v) => v >= xd[0] && v <= xd[1]),
    yTicks: [0, 1].filter((v) => v >= yd[0] && v <= yd[1]),
    xLabel: 'a · steep error',
    yLabel: 'b · shallow error',
    fontSize: 26,
  });
  for (const L of [0.5, 2, 8, 32, 50.5, 128, 230]) {
    const points = Array.from(
      {
        length: 181,
      },
      (_, i) => ({
        x: Math.sqrt(L / 50) * Math.cos((i / 180) * 2 * Math.PI),
        y: Math.sqrt(2 * L) * Math.sin((i / 180) * 2 * Math.PI),
      }),
    );
    t.curve({
      plot,
      points,
      color: '#293c59',
      width: 2,
    });
  }
  const zero = plot.point(0, 0);
  api.circle(ctx, zero.x, zero.y, 5, C.ink);
  return plot;
}
export function drawOptimizerMark(ctx, api, C, plot, w, color = C.ink, label) {
  const p = plot.point(...w);
  api.circle(ctx, p.x, p.y, 7, C.bg, color, 3);
  if (label) drawOptimizerText(ctx, api, C, label, p.x + 12, p.y - 14, 26, color);
}
export function drawOptimizerTrace(ctx, api, C, t, plot, run, f, color, showStart = true) {
  const visible = run.points.slice(0, f.completed + 1);
  t.curve({
    plot,
    points: visible,
    color,
    width: 4,
  });
  if (showStart) drawOptimizerMark(ctx, api, C, plot, run.start, C.ink, 'start');
  if (f.completed) drawOptimizerMark(ctx, api, C, plot, f.current, color);
  if (f.pending && f.fraction > 0.001)
    drawOptimizerSegment(ctx, api, plot, f.pending.before, f.pending.next, f.fraction, color);
}
export function drawOptimizerReceipt(ctx, api, C, f, x = 1330, y = 370, color = C.ink) {
  drawOptimizerText(ctx, api, C, 'Completed updates  ' + f.completed, x, y, 31, color);
  drawOptimizerText(ctx, api, C, '(a, b) = ' + pair(f.current), x, y + 62, 31, color);
  drawOptimizerText(ctx, api, C, 'Endpoint loss ≈ ' + fmt(f.currentLoss, 4), x, y + 121, 31, color);
}
export function drawOptimizerLane(
  ctx,
  api,
  C,
  { x = 250, y = 760, width = 1400, domain = [-0.2, 1.1], before, after, amount, color, caption },
) {
  const map = (a) => x + ((a - domain[0]) / (domain[1] - domain[0])) * width;
  drawOptimizerLine(ctx, api, C, x, y, x + width, y, C.muted);
  for (const v of [domain[0], 0, domain[1]]) {
    drawOptimizerLine(ctx, api, C, map(v), y - 8, map(v), y + 8);
    drawOptimizerText(ctx, api, C, fmt(v, 2), map(v), y + 43, 25, C.muted, 'center');
  }
  const start = map(before),
    end = map(after);
  const zero = map(0);
  if (Math.abs(start - zero) > 0.1)
    api.rect(ctx, Math.min(start, zero), y - 37, Math.abs(start - zero), 18, color, undefined, 2);
  drawOptimizerLine(ctx, api, C, start, y - 16, start, y + 16, color, 3);
  if (amount > 0)
    drawOptimizerArrow(
      ctx,
      api,
      {
        x: start,
        y,
      },
      {
        x: start + (end - start) * amount,
        y,
      },
      color,
      6,
    );
  drawOptimizerText(ctx, api, C, caption, x, y - 47, 29, color);
}
export function drawOptimizerSegment(ctx, api, plot, before, after, amount, color, width = 5) {
  if (amount <= 0) return;
  const a = plot.point(...before),
    z = plot.point(...after);
  drawOptimizerArrow(
    ctx,
    api,
    a,
    {
      x: a.x + (z.x - a.x) * amount,
      y: a.y + (z.y - a.y) * amount,
    },
    color,
    width,
  );
}
export function drawHistoryMechanismsText(
  ctx,
  api,
  C,
  s,
  x,
  y,
  size = 31,
  color = C.ink,
  align = 'left',
) {
  return api.text(ctx, s, x, y, size, color, align);
}
export function drawHistoryMechanismsMath(
  ctx,
  api,
  C,
  s,
  x,
  y,
  size = 37,
  color = C.ink,
  align = 'left',
) {
  return api.math(ctx, s, x, y, size, color, align);
}
export function drawHistoryMechanismsTarget(ctx, api, id, fn) {
  return api.focus.target(id, fn);
}
export function drawHistoryMechanismsRail(
  ctx,
  api,
  C,
  x,
  y,
  width,
  domain,
  from,
  to,
  progress,
  color,
  label,
) {
  const map = (v) => x + ((v - domain[0]) / (domain[1] - domain[0])) * width;
  api.line(ctx, x, y, x + width, y, C.muted, 2);
  if (domain[0] <= 0 && domain[1] >= 0) {
    const zero = map(0);
    api.line(ctx, zero, y - 8, zero, y + 8, C.muted, 2);
    drawHistoryMechanismsText(ctx, api, C, '0', zero, y + 37, 23, C.muted, 'center');
  }
  const end = from + (to - from) * progress;
  if (progress > 0 && end !== from) api.arrow(ctx, map(from), y, map(end), y, color, 6);
  drawHistoryMechanismsText(ctx, api, C, label, x, y - 35, 28, color);
  return end;
}
export function drawHistoryMechanismsHistory(ctx, api, C, count, selected = -1) {
  drawHistoryMechanismsText(
    ctx,
    api,
    C,
    'Gradient',
    170,
    240,
    29,
    C.muted,
  );
  drawHistoryMechanismsText(ctx, api, C, 'a', 200, 328, 35, C.cyan);
  drawHistoryMechanismsText(ctx, api, C, 'b', 200, 398, 35, C.green);
  for (let i = 0; i < PRESCRIBED_GRADIENTS.length; i++) {
    const x = 450 + i * 380,
      color = i === selected ? C.cyan : i < count ? C.ink : C.muted;
    drawHistoryMechanismsText(ctx, api, C, 'input ' + (i + 1), x, 255, 26, C.muted, 'center');
    const [a, b] = PRESCRIBED_GRADIENTS[i];
    drawHistoryMechanismsText(ctx, api, C, fmt(a), x, 328, 42, color, 'center');
    drawHistoryMechanismsText(ctx, api, C, fmt(b), x, 398, 36, color, 'center');
  }
}
export function drawScaleAndDecayText(
  ctx,
  api,
  C,
  s,
  x,
  y,
  size = 31,
  color = C.ink,
  align = 'left',
) {
  return api.text(ctx, s, x, y, size, color, align);
}
export function drawScaleAndDecayMath(
  ctx,
  api,
  C,
  s,
  x,
  y,
  size = 42,
  color = C.ink,
  align = 'left',
) {
  return api.math(ctx, s, x, y, size, color, align);
}
export function drawScaleAndDecayTarget(ctx, api, id, fn) {
  return api.focus.target(id, fn);
}
export function drawAccumulationAndClippingText(
  ctx,
  api,
  C,
  s,
  x,
  y,
  size = 31,
  color = C.ink,
  align = 'left',
) {
  return api.text(ctx, s, x, y, size, color, align);
}
export function drawAccumulationAndClippingMath(
  ctx,
  api,
  C,
  s,
  x,
  y,
  size = 43,
  color = C.ink,
  align = 'left',
) {
  return api.math(ctx, s, x, y, size, color, align);
}
export function drawAccumulationAndClippingTarget(ctx, api, id, fn) {
  return api.focus.target(id, fn);
}
export function drawTrainingAndMemoryText(
  ctx,
  api,
  C,
  s,
  x,
  y,
  size = 31,
  color = C.ink,
  align = 'left',
) {
  return api.text(ctx, s, x, y, size, color, align);
}
export function drawTrainingAndMemoryMath(
  ctx,
  api,
  C,
  s,
  x,
  y,
  size = 41,
  color = C.ink,
  align = 'left',
) {
  return api.math(ctx, s, x, y, size, color, align);
}
export function drawTrainingAndMemoryTarget(ctx, api, id, fn) {
  return api.focus.target(id, fn);
}
export function drawBudgetDiagnosisAndTransferText(
  ctx,
  api,
  C,
  s,
  x,
  y,
  size = 31,
  color = C.ink,
  align = 'left',
) {
  return api.text(ctx, s, x, y, size, color, align);
}
export function drawBudgetDiagnosisAndTransferMath(
  ctx,
  api,
  C,
  s,
  x,
  y,
  size = 41,
  color = C.ink,
  align = 'left',
) {
  return api.math(ctx, s, x, y, size, color, align);
}
export function drawBudgetDiagnosisAndTransferTarget(ctx, api, id, fn) {
  return api.focus.target(id, fn);
}
