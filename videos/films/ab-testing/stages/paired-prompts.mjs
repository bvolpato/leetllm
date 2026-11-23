import { abClamp } from '../arithmetic.mjs';
import { AB_VISUAL_FIXTURES } from '../fixtures.mjs';
import { abCue, abStarted } from '../construction.mjs';
import { abExtendedScenes } from '../model.mjs';
import {
  drawExpansionCell,
  drawExpansionNote,
  drawExpansionPath,
  drawExpansionPlot,
  withExpansionFocus,
  writeExpansionText,
} from '../defaults.mjs';
export function drawPairedPrompts(ctx, scene, state, api) {
  const beat = state.beat ?? 0,
    progress = abClamp(state.beatP ?? 0),
    q = progress * progress * (3 - 2 * progress);
  if (!abExtendedScenes.has('paired-prompts')) return;
  const { C: themeColors } = api;
  withExpansionFocus(ctx, api, 'paired-prompts-mechanism', () => {
    if (beat === 0) {
      const r = AB_VISUAL_FIXTURES.paired.sampleRows[0],
        cancel = abCue(state, 'paired-cancel', q),
        terms = [
          ['CONTROL', r.control, r.control - r.difficulty, themeColors.blue],
          ['TREATMENT', r.treatment, r.treatment - r.difficulty, themeColors.pink],
        ];
      writeExpansionText(
        ctx,
        api,
        'Same synthetic prompt difficulty enters both scores',
        960,
        280,
        35,
        themeColors.blue,
        'center',
      );
      terms.forEach(([name, total, residual, color], i) => {
        const y = 400 + i * 245;
        writeExpansionText(ctx, api, name, 200, y + 55, 31, color);
        drawExpansionCell(
          ctx,
          api,
          'Shared difficulty\n' + r.difficulty.toFixed(3),
          520,
          y,
          490,
          140,
          cancel > 0 ? themeColors.muted : themeColors.yellow,
          31,
        );
        drawExpansionCell(
          ctx,
          api,
          'Residual\n' + residual.toFixed(3),
          1130,
          y,
          490,
          140,
          color,
          31,
        );
        writeExpansionText(
          ctx,
          api,
          'Total ' + total.toFixed(3),
          1765,
          y + 85,
          27,
          color,
          'center',
        );
      });
      if (cancel > 0) {
        drawExpansionPath(
          ctx,
          api,
          [
            {
              x: 515,
              y: 470,
            },
            {
              x: 485,
              y: 470,
            },
            {
              x: 485,
              y: 715,
            },
            {
              x: 515,
              y: 715,
            },
          ],
          themeColors.yellow,
          3,
        );
        writeExpansionText(
          ctx,
          api,
          'Shared D − shared D = 0',
          770,
          850,
          31,
          themeColors.yellow,
          'center',
        );
      }
      if (cancel >= 1)
        writeExpansionText(
          ctx,
          api,
          'Difference = residualT − residualC = ' + r.delta.toFixed(3),
          960,
          935,
          34,
          themeColors.cyan,
          'center',
        );
      drawExpansionNote(
        ctx,
        api,
        'The additive shared term cancels exactly in this numerical model. General gains depend on covariance.',
      );
    } else if (beat === 1) {
      const r = AB_VISUAL_FIXTURES.paired,
        chart = drawExpansionPlot(
          ctx,
          api,
          300,
          390,
          1330,
          390,
          [0.2, 0.8],
          [0, 3],
          [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8],
          [],
          'synthetic score difference',
          '',
        );
      writeExpansionText(
        ctx,
        api,
        'Equal 2,000-answer budgets · different prompt pairing',
        960,
        280,
        35,
        themeColors.blue,
        'center',
      );
      [
        ['Independent', r.independentLift, r.independentSe, themeColors.blue, 2],
        ['Paired', r.pairedLift, r.pairedSe, themeColors.cyan, 1],
      ].forEach(([name, value, se, color, y]) => {
        drawExpansionPath(
          ctx,
          api,
          [chart.point(value - 1.96 * se, y), chart.point(value + 1.96 * se, y)],
          color,
          8,
          chart.bounds,
        );
        const dot = chart.point(value, y);
        api.circle(ctx, dot.x, dot.y, 12, color);
        writeExpansionText(ctx, api, name, 230, dot.y + 10, 29, color, 'right');
        if (name === 'Independent' || abStarted(state, 'paired-se', progress > 0.5))
          writeExpansionText(ctx, api, 'SE ' + se.toFixed(3), 1740, dot.y + 10, 29, color, 'right');
      });
      if (abStarted(state, 'paired-se', progress > 0.5))
        writeExpansionText(
          ctx,
          api,
          'Variance reduction ' +
            (100 * r.varianceReduction).toFixed(1) +
            '% in this Gaussian fixture',
          960,
          945,
          33,
          themeColors.yellow,
          'center',
        );
      drawExpansionNote(
        ctx,
        api,
        'Unbounded synthetic scores, not a 1–10 rating scale or a measured model improvement.',
      );
    } else {
      writeExpansionText(
        ctx,
        api,
        'List interleaving and paired whole answers expose different objects',
        960,
        280,
        34,
        themeColors.blue,
        'center',
      );
      const labels = ['A1', 'B1', 'A2', 'B2', 'A3', 'B3'];
      labels.forEach((label, i) =>
        drawExpansionCell(
          ctx,
          api,
          label,
          235 + i * 245,
          420,
          195,
          95,
          label[0] === 'A' ? themeColors.blue : themeColors.pink,
          32,
        ),
      );
      writeExpansionText(
        ctx,
        api,
        'Ranked list · credit clicks under its declared rule',
        960,
        635,
        32,
        themeColors.ink,
        'center',
      );
      drawExpansionCell(ctx, api, 'Whole answer A', 230, 755, 680, 125, themeColors.blue, 35);
      drawExpansionCell(ctx, api, 'Whole answer B', 1010, 755, 680, 125, themeColors.pink, 35);
      drawExpansionNote(
        ctx,
        api,
        'Randomize display order, declare ties and calibrate the judge. Seeing both answers changes the later incident exposure.',
      );
    }
  });
  return;
}
export default {
  id: 'paired-prompts',
  draw: drawPairedPrompts,
  cues: [
    'paired-prompts-step-1',
    'paired-cancel',
    'paired-prompts-step-2',
    'paired-se',
    'paired-prompts-step-3',
  ],
};
