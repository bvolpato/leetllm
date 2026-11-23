import { conditioningResult, conditioningState } from '../model.mjs';
import { caption, curve, equation, target, text } from '../defaults.mjs';
export function drawConditioningNoise(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const f = (v, n = 2) => (Math.abs(v) < 0.5 * 10 ** -n ? 0 : v).toFixed(n);
  {
    const c = conditioningState({
      ...state,
      beat: 1,
    });
    const ruler = (y, end, title) => {
      const p = api.teaching.axes({
        x: 260,
        y,
        width: 1400,
        height: 60,
        xDomain: [0, end],
        yDomain: [-1, 1],
        xTicks: [],
        yTicks: [],
        xLabel: '',
        fontSize: 28,
      });
      curve(
        ctx,
        api,
        p,
        [
          [0, 0],
          [end, 0],
        ],
        themeColors.muted,
        3,
      );
      text(ctx, api, title, 960, y - 50, 34, themeColors.muted, 'center');
      return p;
    };
    const out = ruler(350, 0.004, 'output measurement · ruler magnified ×100'),
      input = ruler(700, 0.4, 'recovered input · original units');
    for (const v of [0.001, 0.002, 0.003]) {
      const p = out.point(v, 0);
      api.line(ctx, p.x, p.y + 15, p.x, p.y + 30, themeColors.muted, 3);
      text(ctx, api, f(v, 3), p.x, p.y + 72, 32, themeColors.muted, 'center');
    }
    for (const v of [0.1, 0.2, 0.3]) {
      const p = input.point(v, 0);
      api.line(ctx, p.x, p.y + 15, p.x, p.y + 30, themeColors.muted, 3);
      text(ctx, api, f(v), p.x, p.y + 72, 32, themeColors.muted, 'center');
    }
    target(ctx, api, 'conditioning-noise', () => {
      const from = out.point(c.cleanOutput[1], 0),
        to = out.point(c.measuredOutput[1], 0);
      if (c.noiseProgress > 0) api.arrow(ctx, from.x, from.y, to.x, to.y, themeColors.yellow, 7);
      equation(ctx, api, f(c.measuredOutput[1], 3), 960, 535, 54, themeColors.yellow);
    });
    target(ctx, api, 'conditioning-recovered', () => {
      const from = input.point(c.input[1], 0),
        to = input.point(c.recovered[1], 0);
      api.path(
        ctx,
        [
          {
            x: from.x - 12,
            y: from.y + 12,
          },
          {
            x: from.x - 40,
            y: from.y + 40,
          },
        ],
        {
          id: 'true-input-reference',
          color: themeColors.cyan,
          width: 2,
        },
      );
      if (c.inverseProgress > 0) api.arrow(ctx, from.x, from.y, to.x, to.y, themeColors.red, 7);
      equation(ctx, api, f(c.recovered[1]), 960, 870, 54, themeColors.red);
    });
    const result = conditioningResult({
      ...state,
      beat: 1,
    });
    if (result)
      target(ctx, api, 'conditioning-final-result', () =>
        equation(
          ctx,
          api,
          String.raw`0.001\;\text{output error}\quad\longrightarrow\quad0.10\;\text{input error}`,
          960,
          950,
          37,
          themeColors.red,
        ),
      );
    caption(
      ctx,
      api,
      'The rulers use different units · inversion amplifies the actual disturbance by 100',
    );
  }
}
export default {
  id: 'conditioning-noise',
  draw: drawConditioningNoise,
  cues: ['conditioning-noise-b2-1', 'conditioning-inverse-b2-2'],
};
