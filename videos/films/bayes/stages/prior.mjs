import { betaDensity } from '../arithmetic.mjs';
import { event } from '../construction.mjs';
import { priorIntervalSnapshot } from '../model.mjs';
import { areaFill, caption, chart, curve, equation, ring, target, text } from '../defaults.mjs';
import { sampleFunction } from 'vizmatic';
export function drawPrior(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  {
    const p =
        currentBeat === 1
          ? event(state, 1, 'prior-area-sweep')
          : currentBeat === 2
            ? event(state, 2, 'prior-area-contract')
            : 0,
      v = priorIntervalSnapshot(currentBeat, p),
      q = chart(ctx, api, {
        max: 2,
      });
    if (currentBeat === 2) {
      api.path(
        ctx,
        [
          q.point(0.45, 0),
          ...sampleFunction((x) => betaDensity(2, 2, x), 0.45, 0.75, 120).map((v) =>
            q.point(v.x, v.y),
          ),
          q.point(0.75, 0),
        ],
        {
          color: themeColors.muted + '77',
          width: 2,
          closed: true,
          clip: q.bounds,
        },
      );
    }
    target(ctx, api, 'prior-density', () => curve(ctx, api, q, 2, 2, themeColors.blue));
    target(ctx, api, 'prior-area', () => {
      areaFill(ctx, api, q, (x) => betaDensity(2, 2, x), v.low, v.high, themeColors.blue);
      if (currentBeat > 0)
        for (const rate of new Set([v.low, v.high])) {
          const base = q.point(rate, 0),
            top = q.point(rate, betaDensity(2, 2, rate));
          api.line(ctx, base.x, base.y, top.x, top.y, themeColors.blue + 'aa', 2);
        }
    });
    equation(ctx, api, 'p\\sim\\operatorname{Beta}(2,2)', 1560, 350, 39, themeColors.blue);
    equation(ctx, api, 'f(p)=6p(1-p)', 1560, 450, 37, themeColors.blue);
    text(
      ctx,
      api,
      'assumed weight · 0 outcomes included',
      1560,
      535,
      25,
      themeColors.muted,
      'center',
    );
    if (currentBeat > 0) {
      target(ctx, api, 'prior-probability', () => {
        text(
          ctx,
          api,
          'probability of highlighted range',
          1560,
          650,
          27,
          themeColors.blue,
          'center',
        );
        text(
          ctx,
          api,
          (v.probability * 100).toFixed(1) + '%',
          1560,
          730,
          60,
          themeColors.blue,
          'center',
        );
      });
    }
    if (currentBeat === 2) {
      const p = q.point(0.6, v.density);
      api.line(ctx, p.x, q.point(0.6, 0).y, p.x, p.y, themeColors.yellow, 3);
      ring(ctx, api, p, themeColors.yellow);
      target(ctx, api, 'prior-point-density', () =>
        equation(ctx, api, 'f(0.60)=1.44', 1560, 865, 38, themeColors.yellow),
      );
    }
    caption(
      ctx,
      api,
      currentBeat === 0
        ? 'A continuous prior gives each range a share of one total area'
        : currentBeat === 1
          ? 'Area is probability · density is height per unit rate'
          : v.width > 1e-9
            ? 'Gray outline: the range before the squeeze'
            : 'One exact rate has zero width and zero probability.',
    );
  }
}
export default {
  id: 'prior',
  draw: drawPrior,
  cues: ['prior-starting-shape', 'prior-area-sweep', 'prior-area-contract'],
};
