import { abClamp } from '../arithmetic.mjs';
import { AB_VISUAL_FIXTURES } from '../fixtures.mjs';
import { abCue, abStarted } from '../construction.mjs';
import { abExtendedScenes, cupedVariance } from '../model.mjs';
import {
  drawExpansionLine,
  drawExpansionNote,
  drawExpansionPath,
  drawExpansionPlot,
  withExpansionFocus,
  writeExpansionText,
} from '../defaults.mjs';
export function drawCupedAdjustment(ctx, scene, state, api) {
  const beat = state.beat ?? 0,
    progress = abClamp(state.beatP ?? 0),
    q = progress * progress * (3 - 2 * progress);
  if (!abExtendedScenes.has('cuped-adjustment')) return;
  const { C: themeColors } = api;
  withExpansionFocus(ctx, api, 'cuped-adjustment-mechanism', () => {
    if (beat === 0) {
      writeExpansionText(
        ctx,
        api,
        'Subtract predictable pre-treatment variation from the same rows',
        960,
        280,
        34,
        themeColors.blue,
        'center',
      );
      const data = AB_VISUAL_FIXTURES.cuped,
        chart = drawExpansionPlot(
          ctx,
          api,
          250,
          390,
          1390,
          400,
          [-0.25, 1.25],
          [-0.4, 1.4],
          [0, 1],
          [-0.25, 0, 0.5, 1, 1.25],
          'frozen binary covariate',
          'outcome / adjusted score',
        );
      data.sampleRows.forEach((r, i) => {
        const xx = r.x + ((i % 6) - 2.5) * 0.045,
          raw = chart.point(xx, r.y),
          adjusted = chart.point(xx, r.y + q * (r.adjusted - r.y));
        drawExpansionLine(ctx, api, raw, adjusted, r.arm ? themeColors.pink : themeColors.blue, 3);
        api.circle(ctx, adjusted.x, adjusted.y, 9, r.arm ? themeColors.pink : themeColors.blue);
      });
      writeExpansionText(
        ctx,
        api,
        'Y − theta × (X − one common center)',
        960,
        945,
        35,
        themeColors.yellow,
        'center',
      );
      drawExpansionNote(
        ctx,
        api,
        '24 actual synthetic article rows · horizontal display jitter separates repeated binary values. Adjusted scores are not binary labels.',
      );
    } else if (beat === 1) {
      writeExpansionText(
        ctx,
        api,
        'Supplied covariance model: Var(Y) = 9 · Var(X) = 4 · Cov(Y,X) = 3',
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
        390,
        1390,
        400,
        [0, 1.5],
        [6, 10],
        [0, 0.5, 0.75, 1, 1.5],
        [6, 6.75, 8, 9, 10],
        'coefficient theta',
        'adjusted variance',
      );
      drawExpansionPath(
        ctx,
        api,
        Array.from(
          {
            length: 101,
          },
          (_, i) => chart.point(i * 0.015, cupedVariance(9, 4, 3, i * 0.015)),
        ),
        themeColors.cyan,
        5,
        chart.bounds,
      );
      const theta = abStarted(state, 'cuped-theta', progress > 0.4)
          ? 0.75 * abCue(state, 'cuped-theta', q)
          : 0,
        point = chart.point(theta, cupedVariance(9, 4, 3, theta));
      api.circle(ctx, point.x, point.y, 13, themeColors.yellow);
      if (abCue(state, 'cuped-theta', q) >= 1)
        writeExpansionText(
          ctx,
          api,
          'theta = 3 / 4 = 0.75',
          570,
          925,
          34,
          themeColors.yellow,
          'center',
        );
      if (abStarted(state, 'cuped-variance', progress > 0.55))
        writeExpansionText(
          ctx,
          api,
          'Residual variance = 6.75 · reduction 25%',
          1350,
          925,
          32,
          themeColors.cyan,
          'center',
        );
      drawExpansionNote(
        ctx,
        api,
        'Reversing X reverses its optimal coefficient and preserves the reduction. Treatment-affected measurements are not this baseline.',
      );
    } else {
      const r = AB_VISUAL_FIXTURES.cuped,
        chart = drawExpansionPlot(
          ctx,
          api,
          300,
          390,
          1330,
          390,
          [0.02, 0.065],
          [0, 3],
          [0.02, 0.03, 0.04, 0.05, 0.06],
          [],
          'absolute lift',
          '',
        );
      writeExpansionText(
        ctx,
        api,
        'Executed 20,000-unit synthetic lab · same outcomes',
        960,
        280,
        35,
        themeColors.blue,
        'center',
      );
      [
        ['Raw', r.rawLift, r.rawSe, themeColors.blue, 2],
        ['Adjusted', r.adjustedLift, r.adjustedSe, themeColors.cyan, 1],
      ].forEach(([name, value, se, color, y]) => {
        drawExpansionPath(
          ctx,
          api,
          [chart.point(value - 1.96 * se, y), chart.point(value + 1.96 * se, y)],
          color,
          9,
          chart.bounds,
        );
        const dot = chart.point(value, y);
        api.circle(ctx, dot.x, dot.y, 13, color);
        writeExpansionText(ctx, api, name, 200, dot.y + 10, 29, color, 'right');
        writeExpansionText(
          ctx,
          api,
          (100 * value).toFixed(2) + ' pp',
          1720,
          dot.y + 10,
          29,
          color,
          'right',
        );
      });
      writeExpansionText(
        ctx,
        api,
        'Correlation ' +
          r.correlation.toFixed(3) +
          ' · pooled variance reduction ' +
          (100 * r.varianceReduction).toFixed(1) +
          '%',
        960,
        940,
        34,
        themeColors.yellow,
        'center',
      );
      drawExpansionNote(
        ctx,
        api,
        'Fitted-on-these-outcomes theta is distinct from the common fixed-coefficient expectation argument. Validate adjusted inference.',
      );
    }
  });
  return;
}
export default {
  id: 'cuped-adjustment',
  draw: drawCupedAdjustment,
  cues: [
    'cuped-adjustment-step-1',
    'cuped-adjustment-step-2',
    'cuped-theta',
    'cuped-variance',
    'cuped-adjustment-step-3',
  ],
};
