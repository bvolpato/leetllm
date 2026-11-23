import { begun } from '../construction.mjs';
import { tailFrame } from '../model.mjs';
import {
  drawOriginalSamplingAxes,
  drawOriginalSamplingDensity,
  drawOriginalSamplingDot,
  drawOriginalSamplingFillArea,
  drawOriginalSamplingFooter,
  drawOriginalSamplingPath,
  drawOriginalSamplingTarget,
  drawOriginalSamplingText,
} from '../defaults.mjs';
export function drawTail(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat ?? 0;
  const guide = (q, x, top, color) =>
    drawOriginalSamplingPath(ctx, api, [q.point(x, 0), q.point(x, top)], color, 3);
  const percent = (value) => (100 * value).toFixed(1) + '%';
  {
    const f = tailFrame(state),
      q = drawOriginalSamplingAxes(
        ctx,
        api,
        225,
        350,
        1100,
        460,
        [0, 24],
        [0, 0.3],
        'density per second',
      );
    const areaKnown = beat > 0 && begun(state, 'tail-area', 0.05);
    drawOriginalSamplingTarget(ctx, api, 'tail-density', () => {
      if (areaKnown) drawOriginalSamplingFillArea(ctx, api, q, 10, 24, f.sigma, themeColors.pink);
      drawOriginalSamplingDensity(ctx, api, q, f.sigma);
      guide(q, 6, 0.29, themeColors.cyan);
      drawOriginalSamplingText(ctx, api, 'median 6 s', 510, 300, 31, themeColors.cyan, 'center');
      guide(q, 10, 0.24, themeColors.muted);
    });
    drawOriginalSamplingTarget(ctx, api, 'tail-percentile', () => {
      const at = q.point(f.p95, 0);
      guide(q, f.p95, 0.18, themeColors.yellow);
      drawOriginalSamplingDot(ctx, api, at, themeColors.yellow, 12, true);
      drawOriginalSamplingText(
        ctx,
        api,
        `fixed rank u = 0.95`,
        1550,
        370,
        31,
        themeColors.yellow,
        'center',
      );
      drawOriginalSamplingText(
        ctx,
        api,
        `p95 ≈ ${f.p95.toFixed(2)} s`,
        1550,
        445,
        42,
        themeColors.yellow,
        'center',
      );
      drawOriginalSamplingText(
        ctx,
        api,
        `log-spread ${f.sigma.toFixed(2)}`,
        1550,
        565,
        35,
        themeColors.blue,
        'center',
      );
    });
    drawOriginalSamplingTarget(ctx, api, 'tail-result', () => {
      drawOriginalSamplingText(ctx, api, 'beyond 10 s', 1550, 690, 32, themeColors.pink, 'center');
      drawOriginalSamplingText(
        ctx,
        api,
        areaKnown ? percent(f.late) : 'your prediction?',
        1550,
        765,
        areaKnown ? 50 : 35,
        areaKnown ? themeColors.pink : themeColors.yellow,
        'center',
      );
    });
    api.arrow(ctx, 1280, 810, 1380, 810, themeColors.pink, 3);
    drawOriginalSamplingText(ctx, api, 'tail continues', 1450, 875, 29, themeColors.pink, 'center');
    drawOriginalSamplingFooter(
      ctx,
      api,
      'Same inspected rank and median; only the log-space spread changes',
    );
  }
}
export default {
  id: 'tail',
  draw: drawTail,
  cues: ['tail-spread', 'tail-area'],
};
