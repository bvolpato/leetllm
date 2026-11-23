import { loss } from '../arithmetic.mjs';
import { spoken } from '../cue.mjs';
import { curve, point, text } from '../defaults.mjs';

export function drawGrowth(ctx, scene, state, api) {
  const { C, teaching } = api;
  const p = api.ease(spoken(scene, state, 'growth-expand').progress);
  const side = 10 + 10 * p;
  const budget = side * side;
  const oldLoss = loss(10, 10),
    newLoss = loss(side, side);
  const ticks = [5, 10, 20, 40];
  api.focus.target('allocation-curve', () => {
    const axes = teaching.axes({
      x: 235,
      y: 375,
      width: 560,
      height: 400,
      xDomain: [0, 45],
      yDomain: [0, 45],
      xTicks: ticks,
      yTicks: ticks,
      xLabel: 'Parameter units',
      yLabel: 'Token units',
      color: C.muted,
    });
    curve(ctx, api, axes, (n) => 100 / n, 100 / 44, 44, C.muted);
    curve(ctx, api, axes, (n) => budget / n, budget / 44, 44, C.cyan);
    point(ctx, api, axes, 10, 10, C.muted, 9);
    point(ctx, api, axes, side, side, C.yellow, 12);
    text(ctx, api, 'N × D = ' + budget.toFixed(0), 510, 275, 44, C.cyan, 'center');
  });
  api.focus.target('loss-valley', () => {
    const axes = teaching.axes({
      x: 1060,
      y: 375,
      width: 600,
      height: 400,
      xDomain: [4, 40],
      yDomain: [1.8, 2.7],
      xTicks: ticks,
      yTicks: [1.9, 2.2, 2.5],
      xLabel: 'Parameter units',
      yLabel: 'Fitted loss',
      color: C.muted,
    });
    curve(ctx, api, axes, (n) => loss(n, 100 / n), 4, 40, C.muted);
    curve(ctx, api, axes, (n) => loss(n, budget / n), 4, 40, C.cyan);
    point(ctx, api, axes, 10, oldLoss, C.muted, 9);
    point(ctx, api, axes, side, newLoss, C.yellow, 12);
    text(ctx, api, 'Fitted loss  ' + newLoss.toFixed(3), 1360, 275, 44, C.yellow, 'center');
  });
  text(
    ctx,
    api,
    'Original budget 100  ·  floor 1  ·  both coefficients 2',
    960,
    972,
    36,
    C.muted,
    'center',
  );
}
export default {
  id: 'growth',
  draw: drawGrowth,
  cues: ['growth-expand', 'growth-old-new', 'growth-floor'],
};
