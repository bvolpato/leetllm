import { done } from '../construction.mjs';
import { likelihoodFrame } from '../model.mjs';
import { caption, chart, equation, ledger, ring, target, text } from '../defaults.mjs';
import { sampleFunction } from 'vizmatic';
export function drawLikelihood(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  {
    const v = likelihoodFrame(state),
      q = chart(ctx, api, {
        y: 400,
        height: 430,
        max: 1.1,
        label: 'likelihood / current peak',
      }),
      fn = (x) => x ** v.passes * (1 - x) ** v.fails,
      mode = v.processed ? v.passes / v.processed : 0.5,
      peak = fn(mode);
    target(ctx, api, 'likelihood-outcomes', () =>
      ledger(ctx, api, (8 * v.passProgress + 2 * v.failureProgress) / 10),
    );
    target(ctx, api, 'likelihood-curve', () =>
      api.teaching.curve({
        plot: q,
        points: sampleFunction((x) => fn(x) / peak, 0, 1, 240),
        color: themeColors.yellow,
        width: 5,
      }),
    );
    target(ctx, api, 'likelihood-powers', () =>
      equation(
        ctx,
        api,
        `L_s(p)=p^{${v.passes}}(1-p)^{${v.fails}}`,
        1560,
        450,
        41,
        themeColors.yellow,
      ),
    );
    if (currentBeat < 2) {
      if (v.passes === 8 && v.fails === 0) {
        const edge = q.point(1, 1);
        text(ctx, api, 'p = 1', edge.x - 12, edge.y - 15, 27, themeColors.yellow, 'right');
      }
      for (const [i, candidate] of [0.5, 0.8].entries()) {
        const raw = fn(candidate);
        const at = q.point(candidate, raw / peak);
        ring(ctx, api, at, i ? themeColors.green : themeColors.blue, 10);
        text(
          ctx,
          api,
          'candidate p = ' + candidate.toFixed(1),
          1560,
          590 + i * 150,
          28,
          i ? themeColors.green : themeColors.blue,
          'center',
        );
        equation(
          ctx,
          api,
          `L_s(${candidate.toFixed(1)})\\approx${raw.toPrecision(3)}`,
          1560,
          650 + i * 150,
          34,
          i ? themeColors.green : themeColors.blue,
        );
      }
    } else {
      target(ctx, api, 'count-factor', () => {
        equation(
          ctx,
          api,
          done(v.cancel) || v.countFactor === 0
            ? '\\frac{f(p)L_s(p)}{Z_s}'
            : '\\frac{45\\,f(p)L_s(p)}{45\\,Z_s}',
          1555,
          680,
          48,
          themeColors.green,
        );
        text(
          ctx,
          api,
          done(v.cancel)
            ? 'same relative weights after normalization'
            : v.countFactor === 0
              ? 'ordered-sequence update'
              : '45 arrangements of the same count',
          1555,
          835,
          27,
          themeColors.muted,
          'center',
        );
        equation(ctx, api, 'Z_s=\\int_0^1 f(q)L_s(q)\\,dq', 1555, 945, 29, themeColors.muted);
      });
    }
    caption(
      ctx,
      api,
      currentBeat < 2
        ? 'The same identified outcomes weight every candidate rate · the plotted curve is divided by its current peak'
        : 'The shared binomial factor cancels in numerator and denominator',
    );
  }
}
export default {
  id: 'likelihood',
  draw: drawLikelihood,
  cues: [
    'likelihood-pass-arrivals',
    'likelihood-failure-arrivals',
    'count-arrangements',
    'cancel-common-factor',
  ],
};
