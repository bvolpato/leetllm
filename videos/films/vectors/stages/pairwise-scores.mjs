import { WORDS } from '../fixtures.mjs';
import { SCORE_H, extendedFrame, transpose } from '../model.mjs';
import {
  drawExtendedEquation,
  drawExtendedTarget,
  drawExtendedText,
  drawFooter,
  drawMatrixBlock,
} from '../defaults.mjs';
export function drawPairwiseScores(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat ?? 0,
    f = extendedFrame('pairwise-scores', state);
  drawExtendedTarget(ctx, api, 'pairwise-scores' + '-mechanism', () => {
    drawExtendedTarget(ctx, api, 'score-source', () =>
      drawMatrixBlock(ctx, api, SCORE_H, 280, 385, {
        label: 'same owned token rows',
        rowNames: WORDS[0],
        cell: 105,
        color: themeColors.blue,
      }),
    );
    drawExtendedText(ctx, api, '×', 650, 570, 58, themeColors.muted);
    drawExtendedTarget(ctx, api, 'score-transposed', () =>
      drawMatrixBlock(ctx, api, transpose(SCORE_H), 805, 440, {
        label: f.transpose === 1 ? 'owned token columns' : 'copy each token row into its column',
        columnNames: WORDS[0],
        cell: 95,
        color: themeColors.yellow,
        visible: (_r, c) => c < Math.floor(f.transpose * 3 + 1e-9),
        select: (_r, c) => c === Math.min(2, Math.floor(f.transpose * 3)),
      }),
    );
    drawExtendedText(ctx, api, '=', 1185, 570, 58, themeColors.muted);
    drawExtendedTarget(ctx, api, 'score-result', () =>
      drawMatrixBlock(ctx, api, f.values, 1360, 385, {
        label: 'one scalar per token pair',
        cell: 100,
        color: themeColors.green,
        visible: (r, c) => r * 3 + c < f.cells,
        select: (r, c) => f.diagonal && r === c,
      }),
    );
    if (beat === 2) {
      drawExtendedEquation(
        ctx,
        api,
        '\\operatorname{diag}(HH^T)=[1,1,0.5]',
        960,
        895,
        43,
        themeColors.green,
      );
      drawExtendedText(
        ctx,
        api,
        'self-score = squared vector length',
        960,
        965,
        31,
        themeColors.ink,
        'center',
      );
    } else
      drawExtendedEquation(
        ctx,
        api,
        '[3,2]@[2,3]\\longrightarrow[3,3]',
        960,
        915,
        46,
        themeColors.ink,
      );
    drawFooter(
      ctx,
      api,
      'Rows and columns retain token positions · dot products contract features',
    );
  });
}
export default {
  id: 'pairwise-scores',
  draw: drawPairwiseScores,
  cues: ['score-transpose', 'score-grid', 'score-diagonal'],
};
