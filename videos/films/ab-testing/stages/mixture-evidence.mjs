import { abClamp } from '../arithmetic.mjs';
import { abCue, abStarted } from '../construction.mjs';
import { abExtendedScenes, mixtureEvidence } from '../model.mjs';
import {
  drawExpansionCell,
  drawExpansionNote,
  drawExpansionPath,
  drawExpansionPlot,
  withExpansionFocus,
  writeExpansionText,
} from '../defaults.mjs';
export function drawMixtureEvidence(ctx, scene, state, api) {
  const beat = state.beat ?? 0,
    progress2 = abClamp(state.beatP ?? 0),
    q = progress2 * progress2 * (3 - 2 * progress2);
  if (!abExtendedScenes.has('mixture-evidence')) return;
  const { C: themeColors } = api;
  withExpansionFocus(ctx, api, 'mixture-evidence-mechanism', () => {
    const rows = mixtureEvidence();
    if (beat === 0) {
      writeExpansionText(
        ctx,
        api,
        'Known null p0 = 0.40 · fixed alternatives 0.20 and 0.60',
        960,
        280,
        35,
        themeColors.blue,
        'center',
      );
      const alternatives = [0.2, 0.6],
        count = Math.max(0, Math.min(6, Math.floor(q * 7))),
        row = rows[count];
      alternatives.forEach((rate, i) => {
        const x = 220 + i * 850;
        drawExpansionCell(
          ctx,
          api,
          'Alternative q = ' + rate.toFixed(2),
          x,
          390,
          650,
          100,
          i ? themeColors.pink : themeColors.cyan,
          34,
        );
        drawExpansionCell(
          ctx,
          api,
          'Success multiplier: ' +
            (rate / 0.4).toFixed(1) +
            '\nFailure multiplier: ' +
            ((1 - rate) / 0.6).toFixed(3),
          x,
          550,
          650,
          135,
          i ? themeColors.pink : themeColors.cyan,
          31,
        );
        writeExpansionText(
          ctx,
          api,
          'Product after ' + count + ' successes: ' + row.ratios[i].toFixed(3),
          x + 325,
          800,
          31,
          i ? themeColors.pink : themeColors.cyan,
          'center',
        );
      });
      writeExpansionText(
        ctx,
        api,
        'Equal-weight mixture = ' + row.current.toFixed(3),
        960,
        930,
        38,
        themeColors.yellow,
        'center',
      );
      drawExpansionNote(
        ctx,
        api,
        'Each multiplier has null expectation one. This is one known-null stream, not the composite two-arm experiment.',
      );
    } else if (beat === 1) {
      const ten = abStarted(state, 'mixture-ten-value', progress2 > 0.25),
        twenty = abStarted(state, 'mixture-final-value', progress2 > 0.5),
        limit = twenty ? 20 : ten ? 10 : 0,
        chart = drawExpansionPlot(
          ctx,
          api,
          240,
          400,
          1430,
          380,
          [0, 20],
          [0, 32],
          [0, 5, 10, 15, 20],
          [0, 10, 20, 30],
          'observed outcomes',
          'likelihood ratio',
        );
      writeExpansionText(
        ctx,
        api,
        'Ten supplied successes, then ten supplied failures',
        960,
        280,
        35,
        themeColors.blue,
        'center',
      );
      drawExpansionPath(
        ctx,
        api,
        [chart.point(0, 20), chart.point(20, 20)],
        themeColors.pink,
        3,
        chart.bounds,
      );
      const progress = twenty
          ? abCue(state, 'mixture-final-value', q)
          : ten
            ? abCue(state, 'mixture-ten-value', q)
            : 0,
        shown = twenty ? 10 + Math.floor(progress * 10) : Math.floor(progress * 10);
      drawExpansionPath(
        ctx,
        api,
        rows.slice(0, shown + 1).map((r) => chart.point(r.n, r.current)),
        themeColors.cyan,
        5,
        chart.bounds,
      );
      if (ten && shown >= 10)
        writeExpansionText(
          ctx,
          api,
          'At 10: current = ' + rows[10].current.toFixed(3),
          570,
          915,
          32,
          themeColors.cyan,
          'center',
        );
      if (twenty && shown === 20)
        writeExpansionText(
          ctx,
          api,
          'At 20: current = ' + rows[20].current.toFixed(3),
          1370,
          915,
          32,
          themeColors.cyan,
          'center',
        );
      if (abStarted(state, 'mixture-max-value', progress2 > 0.6)) {
        drawExpansionPath(
          ctx,
          api,
          [chart.point(10, rows[10].maximum), chart.point(20, rows[10].maximum)],
          themeColors.yellow,
          4,
          chart.bounds,
        );
        writeExpansionText(
          ctx,
          api,
          'Running max ' + rows[20].maximum.toFixed(3),
          570,
          975,
          31,
          themeColors.yellow,
          'center',
        );
      }
      if (abStarted(state, 'mixture-p-value', progress2 > 0.75))
        writeExpansionText(
          ctx,
          api,
          'Anytime p = ' + rows[20].p.toFixed(4),
          1370,
          975,
          31,
          themeColors.yellow,
          'center',
        );
    } else {
      writeExpansionText(
        ctx,
        api,
        'The observation model supports the time-valid claim',
        960,
        280,
        35,
        themeColors.blue,
        'center',
      );
      drawExpansionCell(
        ctx,
        api,
        'Known null density\nindependent observations\nfixed normalized mixture',
        200,
        390,
        700,
        230,
        themeColors.cyan,
        32,
      );
      drawExpansionCell(
        ctx,
        api,
        'Two-arm equal unknown rates\nshared baseline is a nuisance\nplug-in control is not this proof',
        1020,
        390,
        700,
        230,
        themeColors.pink,
        31,
      );
      writeExpansionText(
        ctx,
        api,
        'P(ever LR ≥ 1 / alpha) ≤ alpha',
        960,
        770,
        40,
        themeColors.yellow,
        'center',
      );
      writeExpansionText(
        ctx,
        api,
        'Confidence sequences invert valid tests over time',
        960,
        885,
        33,
        themeColors.cyan,
        'center',
      );
      drawExpansionNote(
        ctx,
        api,
        'Time validity does not cover unrelated metrics, changed eligibility or unstable long-product arithmetic.',
      );
    }
  });
  return;
}
export default {
  id: 'mixture-evidence',
  draw: drawMixtureEvidence,
  cues: [
    'mixture-evidence-step-1',
    'mixture-evidence-step-2',
    'mixture-ten',
    'mixture-twenty',
    'mixture-ten-value',
    'mixture-final-value',
    'mixture-max-value',
    'mixture-p-value',
    'mixture-evidence-step-3',
  ],
};
