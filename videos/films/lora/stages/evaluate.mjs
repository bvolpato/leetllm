import { point } from '../geometry.mjs';
import { text, math, line, fade } from '../defaults.mjs';
export function drawEvaluate(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const beat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1);
  const stage = (index, start = 0.06, end = 0.88) =>
    beat < index ? 0 : beat > index ? 1 : api.phase(progress, start, end);
  ctx.save();
  {
    const plot = {
      x: 230,
      y: 365,
      w: 700,
      h: 460,
    };
    line(ctx, api, point(plot.x, plot.y), point(plot.x, plot.y + plot.h), themeColors.muted, 2);
    line(
      ctx,
      api,
      point(plot.x, plot.y + plot.h),
      point(plot.x + plot.w, plot.y + plot.h),
      themeColors.muted,
      2,
    );
    const train = [],
      heldout = [],
      regression = [];
    for (let i = 0; i <= 90; i++) {
      const u = i / 90;
      train.push(point(plot.x + u * plot.w, plot.y + 50 + 350 * (1 - Math.exp(-u * 4))));
      heldout.push(
        point(
          plot.x + u * plot.w,
          plot.y + 80 + 240 * (1 - Math.exp(-u * 4)) - 160 * Math.max(0, u - 0.5) ** 2 * 4,
        ),
      );
      regression.push(point(plot.x + u * plot.w, plot.y + 280 - 220 * u ** 3));
    }
    api.focus.target('training-curve', () => api.trace(ctx, train, stage(0), themeColors.blue, 5));
    fade(ctx, api, stage(1), () => {
      api.focus.target('heldout-curve', () =>
        api.trace(ctx, heldout, stage(1), themeColors.yellow, 5),
      );
      api.focus.target('regression-curve', () =>
        api.trace(ctx, regression, stage(1), themeColors.pink, 5),
      );
    });
    text(ctx, api, 'SCHEMATIC LOSS CURVES', 580, 285, 30, themeColors.muted, 'center');
    text(ctx, api, 'loss', 170, 335, 28, themeColors.muted);
    text(ctx, api, 'training steps →', 580, 890, 30, themeColors.muted, 'center');
    text(ctx, api, 'training', 1300, 365, 35, themeColors.blue);
    fade(ctx, api, stage(1), () => {
      text(ctx, api, 'held-out task', 1300, 450, 35, themeColors.yellow);
      text(ctx, api, 'regression set', 1300, 535, 35, themeColors.pink);
    });
    fade(ctx, api, stage(2), () => {
      math(ctx, api, '\\Delta W=\\frac{\\alpha}{r}BA', 1420, 715, 60, themeColors.ink, 'center');
      text(ctx, api, 'rank · scale · targets · data', 1420, 830, 32, themeColors.muted, 'center');
    });
  }
  ctx.restore();
}
export default {
  id: 'evaluate',
  draw: drawEvaluate,
  cues: ['evaluate-b1-1', 'evaluate-b2-1', 'evaluate-b2-2', 'evaluate-b2-3', 'evaluate-b3-1'],
};
