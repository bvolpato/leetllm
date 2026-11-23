import { tiedOutput } from '../arithmetic.mjs';
import { ended, spoken } from '../construction.mjs';
import {
  drawChapterCard,
  drawChapterEquation,
  drawChapterText,
  drawFooter,
  drawTable,
} from '../defaults.mjs';
export function drawCompactDenominator(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    cueProgress = (cue, beat = currentBeat) => spoken(state, cue, beat),
    E = (cue, beat = currentBeat) => ended(state, cue, beat);
  api.focus.target('compact-denominator-mechanism', () => {
    const remove = currentBeat > 1 ? cueProgress('drop-competitor', 2) : 0,
      s = tiedOutput(1 - remove);
    if (currentBeat === 0) {
      const shrink = cueProgress('compact-weights', 0),
        rows = 50257 - (50257 - 17485) * shrink;
      drawChapterText(
        ctx,
        api,
        'One tied input/output matrix · width 96',
        960,
        280,
        36,
        themeColors.ink,
        'center',
      );
      api.rect(ctx, 270, 375, 330, 470, themeColors.panel, themeColors.muted, 2);
      api.rect(
        ctx,
        270,
        375 + 470 * (1 - rows / 50257),
        330,
        (470 * rows) / 50257,
        themeColors.blue,
        undefined,
        0,
      );
      drawChapterText(ctx, api, '50,257 rows', 435, 345, 30, themeColors.blue, 'center');
      drawChapterText(
        ctx,
        api,
        'Retain ' + Math.round(rows).toLocaleString() + ' rows',
        1080,
        445,
        37,
        themeColors.cyan,
        'center',
      );
      drawChapterEquation(ctx, api, String.raw`${Math.round(rows)}\times96`, 1080, 560, 47);
      if (E('compact-weights', 0)) {
        drawChapterText(
          ctx,
          api,
          '4,824,672 → 1,678,560 weights',
          1080,
          670,
          38,
          themeColors.yellow,
          'center',
        );
      }
      if (E('removed-matrix', 0))
        drawChapterText(
          ctx,
          api,
          '65.2% of this matrix removed',
          1080,
          750,
          32,
          themeColors.yellow,
          'center',
        );
      if (cueProgress('whole-model', 0) > 0)
        drawChapterCard(
          ctx,
          api,
          'Whole model: 1,907,040 compact / 5,053,152 full · 62.3% removed',
          210,
          880,
          1500,
          themeColors.green,
          92,
          29,
        );
    } else {
      drawChapterText(
        ctx,
        api,
        'Three-row tied fixture · hidden h = input row 0 = [1, 0]',
        960,
        280,
        34,
        themeColors.ink,
        'center',
      );
      drawTable(
        ctx,
        api,
        [
          ['Row', 'Embedding', 'h · row', 'p(row)'],
          ['0', '[1, 0]', '1', s.probabilities[0].toFixed(4)],
          ['1 · target', '[0, 1]', '0', s.probabilities[1].toFixed(4)],
          [
            '2 · unused',
            '[1, 1]',
            remove === 1 ? 'removed' : '1',
            remove === 1 ? '—' : s.probabilities[2].toFixed(4),
          ],
        ],
        170,
        370,
        1580,
        360,
        30,
      );
      if (currentBeat === 1) {
        if (E('unused-gradient', 1))
          drawChapterEquation(
            ctx,
            api,
            String.raw`\nabla_{W_2}L=p_2h=[${s.gradientUnused[0].toFixed(4)},0]`,
            960,
            855,
            46,
          );
        drawChapterText(
          ctx,
          api,
          'Row 2 was neither selected input nor target',
          960,
          945,
          31,
          themeColors.muted,
          'center',
        );
      } else {
        drawChapterEquation(ctx, api, String.raw`L=-\ln p_1=${s.loss.toFixed(3)}`, 960, 825, 51);
        if (cueProgress('validation-support', 2) > 0)
          drawChapterCard(
            ctx,
            api,
            'The output table includes 335 pieces seen only in validation.',
            200,
            915,
            1520,
            themeColors.pink,
            76,
            28,
          );
      }
    }
    drawFooter(
      ctx,
      api,
      currentBeat === 2
        ? 'Deleting a competitor changes normalization; a reversible ID relabeling preserves piece identity'
        : 'The same rows supply input lookup and output scores',
    );
  });
}
export default {
  id: 'compact-denominator',
  draw: drawCompactDenominator,
  cues: [
    'compact-denominator-1',
    'compact-weights',
    'removed-matrix',
    'whole-model',
    'compact-denominator-2',
    'unused-gradient',
    'compact-denominator-3',
    'drop-competitor',
    'validation-support',
  ],
};
