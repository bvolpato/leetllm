import { mix, usefulLiftDecision } from './arithmetic.mjs';
import { text } from './defaults.mjs';

export const minimumLift = 0.02;
const x = (lift) => 270 + ((lift + 0.15) / 0.45) * 1410;
const points = (v) => `${v > 0 ? '+' : ''}${Number((100 * v).toFixed(2))}`.replace('-', '−');

export function drawLiftRuler(ctx, api, secondRange = false) {
  const C = api.C;
  // Break the two guides where the interval endpoints are printed.
  const guides = secondRange
    ? [
        [348, 487],
        [555, 687],
        [750, 798],
      ]
    : [
        [348, 506],
        [770, 798],
      ];
  for (const [from, to] of guides) {
    api.line(ctx, x(0), from, x(0), to, C.muted, 2);
    api.line(ctx, x(minimumLift), from, x(minimumLift), to, C.yellow, 4);
  }
  text(ctx, api, 'No change', x(0) - 20, 307, 29, C.muted, 'right');
  text(
    ctx,
    api,
    `Minimum useful lift  ${points(minimumLift)}`,
    x(minimumLift) + 12,
    307,
    31,
    C.yellow,
  );
  api.line(ctx, x(-0.15), 798, x(0.3), 798, C.muted, 2);
  for (const value of [-0.1, 0, 0.1, 0.2, 0.25]) {
    api.line(ctx, x(value), 790, x(value), 810, C.muted, 2);
    text(ctx, api, points(value), x(value), 848, 28, C.muted, 'center');
  }
  text(ctx, api, 'B minus A  (percentage points)', 960, 910, 32, C.ink, 'center');
}

export function drawLiftRange(
  ctx,
  api,
  { name, y, interval, estimate, progress = 1, color, highlightLower = false, clearance = 0 },
) {
  text(ctx, api, name, 200, y - 62, 34, color);
  if (estimate !== undefined) api.circle(ctx, x(estimate), y, 12, color);
  if (progress <= 0) return;
  const origin = estimate ?? (interval[0] + interval[1]) / 2;
  const [lo, hi] = interval.map((v) => x(mix(origin, v, progress)));
  api.line(ctx, lo, y, hi, y, color, 7);
  for (const edge of [lo, hi]) api.line(ctx, edge, y - 19, edge, y + 19, color, 5);
  if (progress === 1) {
    if (clearance > 0 && interval[0] > minimumLift) {
      const tip = mix(x(minimumLift), lo, clearance);
      api.line(ctx, x(minimumLift), y - 30, tip, y - 30, api.C.yellow, 4);
      api.line(ctx, tip, y - 38, tip, y - 22, api.C.yellow, 3);
    }
    text(
      ctx,
      api,
      points(interval[0]),
      lo,
      y + 62,
      36,
      highlightLower ? api.C.yellow : color,
      'center',
    );
    text(ctx, api, points(interval[1]), hi, y + 62, 36, color, 'center');
  }
}

export function liftVerdict(interval) {
  return {
    'clears-useful-lift': 'Switch under the one-attempt rule',
    'positive-size-unestablished': 'Positive lift. Hold the switch.',
    regression: 'Regression. Hold the switch.',
    inconclusive: 'Direction unresolved. Hold the switch.',
  }[usefulLiftDecision(interval, minimumLift)];
}
