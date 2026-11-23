import { abClamp } from '../arithmetic.mjs';
import { abStarted } from '../construction.mjs';
import { abExtendedScenes, alphaSpend } from '../model.mjs';
import {
  drawExpansionLine,
  drawExpansionNote,
  drawExpansionPath,
  drawExpansionPlot,
  withExpansionFocus,
  writeExpansionText,
} from '../defaults.mjs';
export function drawAlphaSpending(ctx, scene, state, api) {
  const beat = state.beat ?? 0,
    progress = abClamp(state.beatP ?? 0),
    q = progress * progress * (3 - 2 * progress);
  if (!abExtendedScenes.has('alpha-spending')) return;
  const { C: themeColors } = api;
  withExpansionFocus(ctx, api, 'alpha-spending-mechanism', () => {
    if (beat === 0) {
      writeExpansionText(
        ctx,
        api,
        'Cumulative error budget over statistical information time',
        960,
        280,
        35,
        themeColors.blue,
        'center',
      );
      const chart = drawExpansionPlot(
        ctx,
        api,
        250,
        400,
        1390,
        380,
        [0, 1],
        [0, 0.055],
        [0, 0.25, 0.5, 0.75, 1],
        [0, 0.01, 0.03, 0.05],
        'information fraction',
        'cumulative alpha',
      );
      const points = Array.from(
        {
          length: 101,
        },
        (_, i) => chart.point(i / 100, alphaSpend(i / 100)),
      );
      drawExpansionPath(ctx, api, points, themeColors.cyan, 5, chart.bounds);
      const current = q,
        x = chart.point(current, alphaSpend(current));
      api.circle(ctx, x.x, x.y, 12, themeColors.yellow);
      writeExpansionText(
        ctx,
        api,
        'A(0) = 0 · A(1) = 0.05',
        960,
        930,
        34,
        themeColors.cyan,
        'center',
      );
      drawExpansionNote(
        ctx,
        api,
        'Information fraction resembles enrollment fraction only when information accumulates proportionally.',
      );
    } else {
      writeExpansionText(
        ctx,
        api,
        'A cumulative budget does not specify each look’s cutoff',
        960,
        280,
        35,
        themeColors.blue,
        'center',
      );
      const chart = drawExpansionPlot(
        ctx,
        api,
        250,
        400,
        1390,
        380,
        [0, 6],
        [1.8, 4],
        [1, 2, 3, 4, 5, 6],
        [1.96, 3, 4],
        'scheduled look',
        'critical z',
      );
      drawExpansionPath(
        ctx,
        api,
        [chart.point(0, 1.96), chart.point(6, 1.96)],
        themeColors.muted,
        3,
        chart.bounds,
      );
      for (let i = 1; i <= 5; i++) {
        const x = chart.point(i, 2).x;
        drawExpansionLine(
          ctx,
          api,
          {
            x,
            y: chart.bounds.y,
          },
          {
            x,
            y: chart.bounds.y + chart.bounds.height,
          },
          themeColors.muted,
          1,
        );
      }
      if (abStarted(state, 'spend-critical', progress > 0.4)) {
        const pt = chart.point(6, 2.04479);
        api.circle(ctx, pt.x, pt.y, 14, themeColors.yellow);
        writeExpansionText(
          ctx,
          api,
          'gsDesign six-look final z ≈ 2.045',
          960,
          930,
          34,
          themeColors.yellow,
          'center',
        );
      }
      drawExpansionNote(
        ctx,
        api,
        'The earlier critical values are not supplied here. Joint boundary calibration must account for previous crossings.',
      );
    }
  });
  return;
}
export default {
  id: 'alpha-spending',
  draw: drawAlphaSpending,
  cues: ['alpha-spending-step-1', 'alpha-spending-step-2', 'spend-not-cutoff', 'spend-critical'],
};
