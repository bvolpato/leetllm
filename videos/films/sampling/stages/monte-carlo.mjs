import { begun } from '../construction.mjs';
import { batchFrame, lateProbability } from '../model.mjs';
import {
  drawOriginalSamplingDot,
  drawOriginalSamplingEquation,
  drawOriginalSamplingFooter,
  drawOriginalSamplingPath,
  drawOriginalSamplingTarget,
  drawOriginalSamplingText,
} from '../defaults.mjs';
export function drawMonteCarlo(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat ?? 0;
  const percent = (value) => (100 * value).toFixed(1) + '%';
  {
    const f = batchFrame(state),
      q = api.teaching.axes({
        x: 230,
        y: 390,
        width: 1100,
        height: 420,
        xDomain: [0, 33],
        yDomain: [0.07, 0.3],
        xTicks: [1, 8, 16, 24, 32],
        yTicks: [0.1, 0.2, 0.3],
        xLabel: 'retained experiment identity',
        yLabel: 'late fraction',
      });
    drawOriginalSamplingPath(
      ctx,
      api,
      [q.point(0, lateProbability), q.point(33, lateProbability)],
      themeColors.yellow,
      3,
    );
    drawOriginalSamplingTarget(ctx, api, 'batch-points', () => {
      f.rows.slice(0, f.visible).forEach((row) => {
        const at = q.point(row.id, row.rate);
        drawOriginalSamplingDot(
          ctx,
          api,
          at,
          row.id === 1 ? themeColors.yellow : themeColors.cyan,
          row.id === 1 ? 13 : 9,
          true,
        );
      });
      if (f.visible) {
        drawOriginalSamplingText(
          ctx,
          api,
          `experiment 1: ${f.rows[0].late} / ${f.count}`,
          1525,
          490,
          31,
          themeColors.yellow,
          'center',
        );
        drawOriginalSamplingText(
          ctx,
          api,
          percent(f.rows[0].rate),
          1525,
          555,
          45,
          themeColors.yellow,
          'center',
        );
      } else
        drawOriginalSamplingText(
          ctx,
          api,
          'Experiment streams ready',
          1525,
          490,
          30,
          themeColors.muted,
          'center',
        );
    });
    drawOriginalSamplingTarget(ctx, api, 'batch-denominator', () =>
      drawOriginalSamplingText(
        ctx,
        api,
        `${f.count.toLocaleString('en-US')} requests per experiment`,
        960,
        305,
        37,
        themeColors.cyan,
        'center',
      ),
    );
    drawOriginalSamplingTarget(ctx, api, 'batch-error-scale', () => {
      if (beat === 2 && begun(state, 'batch-error', 0.3)) {
        drawOriginalSamplingEquation(
          ctx,
          api,
          '\\operatorname{SE}(\\bar Y)=\\sqrt{p(1-p)/N}',
          1500,
          685,
          32,
          themeColors.ink,
          'center',
        );
        drawOriginalSamplingText(
          ctx,
          api,
          '100× N → 10× smaller SE',
          1500,
          770,
          30,
          themeColors.yellow,
          'center',
        );
      } else
        drawOriginalSamplingText(
          ctx,
          api,
          `model p = ${percent(lateProbability)}`,
          1525,
          685,
          31,
          themeColors.muted,
          'center',
        );
    });
    drawOriginalSamplingTarget(ctx, api, 'batch-replay', () =>
      drawOriginalSamplingFooter(
        ctx,
        api,
        beat === 2 && begun(state, 'batch-replay', 0.7)
          ? 'Recorded: root seed 20261029 · replica ID · draw order · sampler version'
          : '32 distinct streams · each experiment retains its original prefix',
      ),
    );
  }
}
export default {
  id: 'monte-carlo',
  draw: drawMonteCarlo,
  cues: ['batch-hundred', 'batch-extend', 'batch-error', 'batch-replay'],
};
