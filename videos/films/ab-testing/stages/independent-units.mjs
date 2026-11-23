import { abClamp } from '../arithmetic.mjs';
import { abStarted } from '../construction.mjs';
import { abExtendedScenes } from '../model.mjs';
import {
  drawExpansionCell,
  drawExpansionLine,
  drawExpansionNote,
  withExpansionFocus,
  writeExpansionText,
} from '../defaults.mjs';
export function drawIndependentUnits(ctx, scene, state, api) {
  const beat = state.beat ?? 0,
    progress = abClamp(state.beatP ?? 0),
    q = progress * progress * (3 - 2 * progress);
  if (!abExtendedScenes.has('independent-units')) return;
  const { C: themeColors } = api;
  withExpansionFocus(ctx, api, 'independent-units-mechanism', () => {
    if (beat === 0) {
      writeExpansionText(
        ctx,
        api,
        'Copying each outcome does not add randomized incidents',
        960,
        280,
        35,
        themeColors.blue,
        'center',
      );
      const rows = [
          ['C1', true],
          ['C2', false],
          ['T1', true],
          ['T2', true],
        ],
        copies = abStarted(state, 'dup-four', progress > 0.2) ? 4 : 1;
      rows.forEach(([name, pass], i) => {
        const y = 400 + i * 125;
        drawExpansionCell(
          ctx,
          api,
          name + ' · ' + (pass ? '1' : '0'),
          180,
          y,
          300,
          80,
          name[0] === 'C' ? themeColors.blue : themeColors.pink,
          31,
        );
        for (let j = 0; j < copies; j++)
          drawExpansionCell(
            ctx,
            api,
            name + ':m' + (j + 1),
            650 + j * 280,
            y,
            230,
            80,
            name[0] === 'C' ? themeColors.blue : themeColors.pink,
            28,
          );
      });
      if (abStarted(state, 'dup-false-se', progress > 0.45))
        writeExpansionText(
          ctx,
          api,
          'Same rates · naive independence formula claims half the SE',
          960,
          960,
          33,
          themeColors.pink,
          'center',
        );
      drawExpansionNote(
        ctx,
        api,
        'Illustrative identified rows · the main experiment remains760/2000 versus 840/2000.',
      );
    } else {
      writeExpansionText(
        ctx,
        api,
        'Build the independent-arm variance from the actual counts',
        960,
        280,
        35,
        themeColors.blue,
        'center',
      );
      const vC = (0.38 * 0.62) / 2000,
        vT = (0.42 * 0.58) / 2000;
      drawExpansionCell(
        ctx,
        api,
        'CONTROL\n0.38 × 0.62 / 2000',
        200,
        390,
        650,
        155,
        themeColors.blue,
        34,
      );
      drawExpansionCell(
        ctx,
        api,
        'TREATMENT\n0.42 × 0.58 / 2000',
        1050,
        390,
        650,
        155,
        themeColors.pink,
        34,
      );
      drawExpansionLine(
        ctx,
        api,
        {
          x: 525,
          y: 565,
        },
        {
          x: 960,
          y: 680,
        },
        themeColors.blue,
        4,
      );
      drawExpansionLine(
        ctx,
        api,
        {
          x: 1375,
          y: 565,
        },
        {
          x: 960,
          y: 680,
        },
        themeColors.pink,
        4,
      );
      writeExpansionText(
        ctx,
        api,
        'sqrt(' + (vC + vT).toFixed(7) + ') = ' + Math.sqrt(vC + vT).toFixed(5),
        960,
        745,
        39,
        themeColors.yellow,
        'center',
      );
      writeExpansionText(
        ctx,
        api,
        '1.96 × SE gives the normal-approximation margin',
        960,
        875,
        33,
        themeColors.cyan,
        'center',
      );
      drawExpansionNote(
        ctx,
        api,
        'Coverage describes repeated suitable sampling; clustering, rare outcomes and multiple claims need their own analysis.',
      );
    }
  });
  return;
}
export default {
  id: 'independent-units',
  draw: drawIndependentUnits,
  cues: ['independent-units-step-1', 'dup-four', 'dup-false-se', 'independent-units-step-2'],
};
