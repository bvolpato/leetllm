import { AXIS_TRAP } from '../fixtures.mjs';
import { extendedFrame } from '../model.mjs';
import {
  drawExtendedEquation,
  drawExtendedTarget,
  drawExtendedText,
  drawFooter,
  drawMatrixBlock,
} from '../defaults.mjs';
export function drawBatchedTranspose(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat ?? 0,
    f = extendedFrame('batched-transpose', state);
  drawExtendedTarget(ctx, api, 'batched-transpose' + '-mechanism', () => {
    [0, 1].forEach((b) => {
      const x = 300 + b * 850;
      drawExtendedText(
        ctx,
        api,
        'prompt ' + b + ' retains its own tokens',
        x + 210,
        270,
        31,
        [themeColors.blue, themeColors.pink][b],
        'center',
      );
      drawExtendedTarget(ctx, api, 'batch-source-' + b, () =>
        drawMatrixBlock(ctx, api, AXIS_TRAP[b], x, 350, {
          label: 'owned input · [token, feature]',
          cell: 100,
          color: [themeColors.blue, themeColors.pink][b],
        }),
      );
      drawExtendedTarget(ctx, api, 'batch-score-' + b, () =>
        drawMatrixBlock(ctx, api, f.selected[b], x + 345, 700, {
          label: f.showingWrong ? 'all-axis reversal' : 'last-two-axis swap',
          cell: 100,
          color: f.showingWrong ? themeColors.pink : themeColors.green,
          visible: () => beat !== 1 || f.wrongRevealed,
          select: (r, c) => f.checked && r === c,
        }),
      );
    });
    drawExtendedTarget(ctx, api, 'batch-operation', () =>
      drawExtendedEquation(
        ctx,
        api,
        f.showingWrong ? 'H@H^T\\quad[2,2,2]' : 'H@\\operatorname{swapaxes}(H,-1,-2)\\quad[2,2,2]',
        960,
        600,
        43,
        f.showingWrong ? themeColors.pink : themeColors.green,
      ),
    );
    if (beat === 2)
      drawExtendedTarget(ctx, api, 'batch-diagonal-result', () =>
        drawExtendedText(
          ctx,
          api,
          f.repaired
            ? 'repaired first diagonal: [1, 0.5]'
            : f.checked
              ? 'expected [1, 0.5] · wrong [1, 0.25]'
              : 'check every token’s squared length',
          960,
          970,
          34,
          f.repaired ? themeColors.green : themeColors.pink,
          'center',
        ),
      );
    drawFooter(
      ctx,
      api,
      'Same shape is insufficient · compare each self-score with its owned squared length',
    );
  });
}
export default {
  id: 'batched-transpose',
  draw: drawBatchedTranspose,
  cues: ['batch-reverse', 'batch-diagonal', 'batch-repair'],
};
