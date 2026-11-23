import { gammaDensity, mixtureDensity } from '../arithmetic.mjs';
import { observations } from '../fixtures.mjs';
import { axes, equation, text, visualFocus } from '../defaults.mjs';
export function drawMixture(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const currentBeat = state.beat ?? 0;
  const progress = api.clamp(state.beatP ?? 0);
  const phaseForBeat = (i, a = 0.08, z = 0.88) =>
    currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, a, z);
  const mixModel = {
    weights: [0.5, 0.5],
    means: [30, 90],
    variances: [400, 400],
  };
  {
    const plot = axes(
      ctx,
      api,
      215,
      360,
      1050,
      420,
      [0, 120],
      [0, 0.026],
      'request latency (ms)',
      'density per ms',
      [0, 30, 60, 90, 120],
      [0, 0.01, 0.02],
    );
    const points = Array.from(
      {
        length: 121,
      },
      (_, x) => ({
        x,
        y: mixtureDensity(x, mixModel),
      }),
    );
    const first = Array.from(
      {
        length: 121,
      },
      (_, x) => ({
        x,
        y: 0.5 * gammaDensity(x, 30, 400),
      }),
    );
    const second = Array.from(
      {
        length: 121,
      },
      (_, x) => ({
        x,
        y: 0.5 * gammaDensity(x, 90, 400),
      }),
    );
    const componentProgress = api.focus
      ? Math.max(0.025, api.focus.progress('mixture-beat-1-focus-1', phaseForBeat(0)))
      : phaseForBeat(0);
    visualFocus(ctx, api, 'mixture-components', () => {
      api.teaching.curve({
        plot,
        points: first,
        color: themeColors.blue,
        width: 4,
        progress: componentProgress,
      });
      api.teaching.curve({
        plot,
        points: second,
        color: themeColors.pink,
        width: 4,
        progress: componentProgress,
      });
    });
    const showSum = () =>
      visualFocus(ctx, api, 'mixture-summed-density', () =>
        api.teaching.curve({
          plot,
          points,
          color: themeColors.yellow,
          width: 6,
          progress: api.focus
            ? Math.max(0.025, api.focus.progress('mixture-sum-density', phaseForBeat(1)))
            : phaseForBeat(1),
        }),
      );
    if (api.focus) api.focus.reveal('mixture-sum-density', showSum);
    else if (currentBeat > 0) showSum();
    observations.forEach((x, i) => {
      const q = plot.point(x, 0);
      api.line(ctx, q.x, q.y, q.x, q.y - 16, i < 3 ? themeColors.blue : themeColors.pink, 4);
    });
    if (currentBeat > 0) {
      const at = plot.point(50, 0),
        top = plot.point(50, mixtureDensity(50, mixModel));
      api.line(ctx, at.x, at.y, top.x, top.y, themeColors.cyan, 3);
      [0, 1].forEach((k) => {
        const q = plot.point(50, 0.5 * gammaDensity(50, [30, 90][k], 400));
        api.circle(ctx, q.x, q.y, 8, [themeColors.blue, themeColors.pink][k]);
      });
      text(ctx, api, 'selected request: 50 ms', at.x, 970, 27, themeColors.cyan, 'center');
    }
    visualFocus(
      ctx,
      api,
      'mixture-equation-string-raw-p-x-sum-k-pi-k-mathcal-n-x-mid-mu-k-sig-3',
      () =>
        equation(
          ctx,
          api,
          String.raw`p(x)=\sum_k\pi_k\mathcal{N}(x\mid\mu_k,\sigma_k^2)`,
          1500,
          610,
          37,
          themeColors.ink,
          'center',
        ),
    );
    text(
      ctx,
      api,
      'The hidden component is a model variable.',
      1580,
      835,
      27,
      themeColors.cyan,
      'center',
    );
    {
    }
  }
}
export default {
  id: 'mixture',
  draw: drawMixture,
  cues: [
    'mixture-beat-1-focus-1',
    'mixture-beat-2-focus-1',
    'mixture-sum-density',
    'mixture-beat-3-focus-1',
  ],
};
