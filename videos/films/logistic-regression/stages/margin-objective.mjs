import { softplus } from '../arithmetic.mjs';
import { marginFixture } from '../model.mjs';
import { axes, cueAmount, curve, labelPoint, text } from '../defaults.mjs';
export function drawMarginObjective(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    op = api.focus.progress('lr-margin-objective-step-' + currentBeat, 0);
  api.focus.target('lr-margin-objective-mechanism', () => {
    if (currentBeat === 0) {
      const score = 0.4 + cueAmount(ctx, api, 'lr-hinge-cleared'),
        m = marginFixture(score),
        q = axes(
          ctx,
          api,
          230,
          365,
          1000,
          440,
          [-1, 2],
          [0, 2.2],
          'signed functional margin',
          'loss',
        );
      curve(ctx, api, q, (x) => Math.max(0, 1 - x), -1, 2, themeColors.yellow);
      curve(ctx, api, q, (x) => softplus(-x), -1, 2, themeColors.cyan);
      labelPoint(ctx, api, q, m.margin, m.hinge, themeColors.yellow);
      labelPoint(ctx, api, q, m.margin, m.logistic, themeColors.cyan);
      text(ctx, api, 'positive label × score', 1500, 380, 32, themeColors.muted);
      text(ctx, api, 'margin ' + m.margin.toFixed(2), 1500, 510, 39, themeColors.pink);
      text(ctx, api, 'hinge ' + m.hinge.toFixed(3), 1500, 650, 37, themeColors.yellow);
      text(ctx, api, 'logistic ' + m.logistic.toFixed(3), 1500, 780, 37, themeColors.cyan);
      text(ctx, api, 'The two objectives act on the same point', 960, 990, 32, themeColors.muted);
    } else if (currentBeat === 1) {
      const q = axes(ctx, api, 230, 365, 1000, 450, [0, 3], [0, 5], 'scalar weight a', 'objective'),
        a = 3 * op;
      curve(ctx, api, q, (x) => Math.max(0, 1 - x), 0, 3, themeColors.cyan);
      if (cueAmount(ctx, api, 'lr-weight-penalty') > 0) {
        curve(ctx, api, q, (x) => 0.5 * x * x, 0, 3, themeColors.yellow);
        curve(ctx, api, q, (x) => Math.max(0, 1 - x) + 0.5 * x * x, 0, 3, themeColors.pink);
      }
      labelPoint(
        ctx,
        api,
        q,
        a,
        Math.max(0, 1 - a) + (cueAmount(ctx, api, 'lr-weight-penalty') > 0 ? 0.5 * a * a : 0),
        cueAmount(ctx, api, 'lr-weight-penalty') > 0 ? themeColors.pink : themeColors.cyan,
      );
      text(ctx, api, 'Supplied scalar C=1 fixture', 1500, 360, 30, themeColors.muted);
      text(ctx, api, 'Hinge violations', 1500, 500, 33, themeColors.cyan);
      text(ctx, api, '+ ½ feature-weight norm²', 1500, 615, 31, themeColors.yellow);
      text(ctx, api, 'Combined objective', 1500, 750, 33, themeColors.pink);
      text(
        ctx,
        api,
        'At / inside the margin: possible support vectors',
        960,
        990,
        32,
        themeColors.muted,
      );
    } else {
      const q = axes(
        ctx,
        api,
        230,
        365,
        1000,
        450,
        [-1, 2],
        [0, 4],
        'signed functional margin',
        'loss',
      );
      curve(ctx, api, q, (x) => Math.max(0, 1 - x), -1, 2, themeColors.yellow);
      curve(ctx, api, q, (x) => Math.max(0, 1 - x) ** 2, -1, 2, themeColors.pink);
      const x = -1 + 3 * op;
      labelPoint(ctx, api, q, x, Math.max(0, 1 - x), themeColors.yellow);
      labelPoint(ctx, api, q, x, Math.max(0, 1 - x) ** 2, themeColors.pink);
      text(ctx, api, 'Ordinary hinge', 1510, 450, 35, themeColors.yellow);
      text(ctx, api, 'LinearSVC default: squared hinge', 1490, 600, 30, themeColors.pink);
      text(
        ctx,
        api,
        'Penalty, intercept and scaling must match the implementation',
        960,
        990,
        31,
        themeColors.muted,
      );
    }
  });
}
export default {
  id: 'margin-objective',
  draw: drawMarginObjective,
  cues: [
    'lr-margin-objective-step-0',
    'lr-functional-margin',
    'lr-hinge-cleared',
    'lr-margin-objective-step-1',
    'lr-weight-penalty',
    'lr-margin-objective-step-2',
    'lr-implementation-hinge',
  ],
};
