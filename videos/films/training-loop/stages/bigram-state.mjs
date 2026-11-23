import { loopBound } from '../arithmetic.mjs';
import { arrow, box, constructionText, footer, heading, matrix } from '../defaults.mjs';
export function drawBigramState(ctx, scene, state, api) {
  api.focus.target('bigram-state-mechanism', () => {
    const { C: themeColors, components: components } = api,
      currentBeat = state.beat ?? 0,
      progress = loopBound(state.beatP ?? 0);
    {
      heading(ctx, api, 'One current character selects one row of next-character logits');
      components.tokenRow({
        values: ['t', 'h', 'e'],
        centerX: 500,
        y: 380,
        width: 150,
        gap: 60,
        height: 95,
        fontSize: 40,
        fill: themeColors.panel,
        stroke: themeColors.blue,
        textColor: themeColors.ink,
      });
      arrow(ctx, api, 450, 560, 650, 560);
      constructionText(
        ctx,
        api,
        't predicts h · h predicts e',
        500,
        700,
        32,
        themeColors.blue,
        'center',
      );
      matrix(
        ctx,
        api,
        [
          [0, 0, 0],
          [0, 0, 0],
          [0, 0, 0],
        ],
        1120,
        370,
        themeColors.cyan,
        115,
      );
      constructionText(
        ctx,
        api,
        'one row per input character',
        1310,
        835,
        29,
        themeColors.cyan,
        'center',
      );
      if (currentBeat === 0)
        box(
          ctx,
          api,
          'zero logits → uniform probabilities',
          230,
          885,
          1460,
          80,
          themeColors.green,
          32,
        );
      else if (currentBeat === 1)
        box(
          ctx,
          api,
          'selected-row gradient = probability − one-hot target',
          230,
          885,
          1460,
          80,
          themeColors.yellow,
          32,
        );
      else {
        box(
          ctx,
          api,
          'V=21: ln21≈3.045 · V=16: ln16≈2.773',
          230,
          870,
          1460,
          80,
          themeColors.green,
          31,
        );
        footer(
          ctx,
          api,
          'Adam: first/second moments → bias correction → divide by sqrt(second)+epsilon; AdamW decay is separate',
        );
      }
    }
    return true;
  });
}
export default {
  id: 'bigram-state',
  draw: drawBigramState,
  cues: [
    'bigram-state-beat-0',
    'bigram-state-beat-1',
    'bigram-state-beat-2',
    'loop-adam-moments',
    'loop-adam-denominator',
  ],
};
