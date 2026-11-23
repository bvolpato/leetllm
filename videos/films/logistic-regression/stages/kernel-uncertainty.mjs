import { gpFixture } from '../model.mjs';
import { axes, cueAmount, curve, equation, labelPoint, text } from '../defaults.mjs';
export function drawKernelUncertainty(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    op = api.focus.progress('lr-kernel-uncertainty-step-' + currentBeat, 0),
    resultComplete = (id) => cueAmount(ctx, api, id) === 1;
  api.focus.target('lr-kernel-uncertainty-mechanism', () => {
    if (currentBeat === 0) {
      const q = axes(
        ctx,
        api,
        230,
        365,
        1000,
        450,
        [0, 4],
        [0, 1],
        'distance / length scale',
        'RBF similarity',
      );
      curve(ctx, api, q, (d) => gpFixture(d).similarity, 0, 4, themeColors.cyan);
      const distance = 3 * cueAmount(ctx, api, 'lr-kernel-distances'),
        g = gpFixture(distance);
      labelPoint(ctx, api, q, distance, g.similarity, themeColors.yellow);
      equation(ctx, api, 'k=\\exp(-d^2/(2\\ell^2))', 1500, 440, 44, themeColors.cyan);
      if (resultComplete('lr-kernel-distances')) {
        text(
          ctx,
          api,
          'd1 → ' + gpFixture(1).similarity.toFixed(3),
          1500,
          640,
          35,
          themeColors.yellow,
        );
        text(
          ctx,
          api,
          'd3 → ' + gpFixture(3).similarity.toFixed(3),
          1500,
          760,
          35,
          themeColors.yellow,
        );
      }
      text(
        ctx,
        api,
        'Feature units and length scale determine the similarity',
        960,
        995,
        32,
        themeColors.muted,
      );
    } else {
      const q = axes(
          ctx,
          api,
          230,
          365,
          1100,
          450,
          [-4, 4],
          [-1.5, 3],
          'input distance from observation',
          'continuous regression value',
        ),
        showMean = cueAmount(ctx, api, 'lr-gp-posterior-mean'),
        showVariance = cueAmount(ctx, api, 'lr-gp-posterior-variance'),
        noise = currentBeat === 2 ? cueAmount(ctx, api, 'lr-gp-observation-noise') : 0;
      const xs = Array.from(
          {
            length: 100,
          },
          (_, i) => -4 + (8 * i) / 99,
        ),
        upper = xs.map((x) => {
          const g = gpFixture(x);
          return q.point(x, g.mean + Math.sqrt(g.latentVariance + 0.04 * noise));
        }),
        lower = xs
          .map((x) => {
            const g = gpFixture(x);
            return q.point(x, g.mean - Math.sqrt(g.latentVariance + 0.04 * noise));
          })
          .reverse();
      if (showVariance > 0) {
        ctx.save();
        ctx.globalAlpha *= 0.14;
        api.path(ctx, [...upper, ...lower], {
          fill: themeColors.cyan,
          closed: true,
          clip: q.bounds,
        });
        ctx.restore();
      }
      if (showMean > 0) curve(ctx, api, q, (d) => gpFixture(d).mean, -4, 4, themeColors.cyan);
      labelPoint(ctx, api, q, 0, 2, themeColors.pink, 'observed y=2');
      text(ctx, api, 'Separate GP REGRESSION', 1550, 340, 30, themeColors.yellow);
      if (showMean > 0)
        equation(ctx, api, '\\mu=\\frac{2k}{1.04}', 1550, 490, 46, themeColors.cyan);
      if (showVariance > 0)
        equation(ctx, api, '\\sigma_f^2=1-\\frac{k^2}{1.04}', 1540, 650, 40, themeColors.cyan);
      text(
        ctx,
        api,
        noise === 0
          ? 'Latent ±1σ band'
          : noise === 1
            ? 'Observation ±1σ band'
            : 'Expanding for noise',
        1510,
        755,
        28,
        themeColors.cyan,
      );
      if (currentBeat === 2) {
        text(
          ctx,
          api,
          'latent σ at x0: ' + gpFixture(0).latentStd.toFixed(3),
          1520,
          825,
          30,
          themeColors.cyan,
        );
        if (resultComplete('lr-gp-observation-noise'))
          text(ctx, api, 'new observation: variance +0.04', 960, 990, 34, themeColors.yellow);
        else
          text(
            ctx,
            api,
            'The band is a stated model assumption, not a generalization guarantee',
            960,
            990,
            29,
            themeColors.muted,
          );
      } else
        text(
          ctx,
          api,
          'Zero prior mean · unit prior variance · Gaussian noise variance0.04',
          960,
          990,
          31,
          themeColors.muted,
        );
    }
  });
}
export default {
  id: 'kernel-uncertainty',
  draw: drawKernelUncertainty,
  cues: [
    'lr-kernel-uncertainty-step-0',
    'lr-kernel-distances',
    'lr-kernel-uncertainty-step-1',
    'lr-gp-posterior-mean',
    'lr-gp-posterior-variance',
    'lr-kernel-uncertainty-step-2',
    'lr-gp-observation-noise',
  ],
};
