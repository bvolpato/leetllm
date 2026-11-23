import { WORDS } from '../fixtures.mjs';
import { BASE_OUTPUT, extendedFrame } from '../model.mjs';
import {
  coordinateAxes,
  drawExtendedEquation,
  drawExtendedTarget,
  drawExtendedText,
  drawFooter,
  drawMatrixBlock,
  formatVectorValue,
} from '../defaults.mjs';
export function drawPooling(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat ?? 0,
    f = extendedFrame('pooling', state);
  drawExtendedTarget(ctx, api, 'pooling' + '-mechanism', () => {
    if (beat === 2) {
      const sequence = WORDS[0].map((word, i) => ({
          word,
          values: BASE_OUTPUT[0][i],
        })),
        swapped = f.permute > 0 ? sequence.toReversed() : sequence;
      drawExtendedTarget(ctx, api, 'pool-owned-rows', () =>
        drawMatrixBlock(
          ctx,
          api,
          swapped.map((r) => r.values),
          330,
          405,
          {
            label: 'same vectors · changed token order',
            rowNames: swapped.map((r) => r.word),
            cell: 120,
            color: themeColors.blue,
          },
        ),
      );
      drawExtendedTarget(ctx, api, 'pool-fixed-result', () => {
        drawExtendedText(
          ctx,
          api,
          'sum each output coordinate',
          1310,
          400,
          33,
          themeColors.muted,
          'center',
        );
        drawExtendedEquation(ctx, api, '[1.5,1.5,1.5]/3', 1310, 570, 49, themeColors.yellow);
        drawExtendedEquation(ctx, api, '[0.5,0.5,0.5]', 1310, 745, 56, themeColors.green);
      });
      drawExtendedText(
        ctx,
        api,
        'a shared pointwise map followed by mean loses permutations',
        960,
        940,
        33,
        themeColors.ink,
        'center',
      );
    } else {
      const p = drawExtendedTarget(ctx, api, 'pool-vector-plane', () =>
        coordinateAxes(
          ctx,
          api,
          240,
          395,
          580,
          400,
          [-0.1, 1.8],
          [-0.1, 1.8],
          'output 1',
          'output 3',
          [0, 0.5, 1, 1.5],
        ),
      );
      drawExtendedTarget(ctx, api, 'pool-accumulation', () =>
        api.teaching.vectorAccumulation({
          plot: p,
          terms: f.terms.map((t, i) => ({
            ...t,
            color: [themeColors.blue, themeColors.pink, themeColors.cyan][i],
          })),
          progress: f.progress,
          projection: {
            label: 'outputs 1 and 3; all coordinates retained below',
            point: (v) => [v[0], v[2]],
          },
          ledger: {
            x: 1000,
            y: 425,
            width: 760,
            height: 410,
          },
          fontSize: 31,
          color: themeColors.green,
          restColor: themeColors.muted,
          revealTotal: f.divide > 0 ? f.reveal : f.raw,
          totalLabel: f.divide === 1 ? 'Mean vector' : f.divide > 0 ? 'Dividing by 3' : 'Token sum',
          totalTarget: 'pool-result',
          format: formatVectorValue,
          completedOpacity: 0.6,
          endpointRadius: 4,
        }),
      );
      drawExtendedText(
        ctx,
        api,
        f.divide === 1
          ? 'each valid token carries weight 1/3'
          : f.divide > 0
            ? 'scale the whole sum by 1/3'
            : 'sum the same three whole vectors',
        1260,
        345,
        32,
        themeColors.yellow,
        'center',
      );
      drawExtendedText(
        ctx,
        api,
        'three projected token vectors → one prompt summary',
        960,
        950,
        33,
        themeColors.ink,
        'center',
      );
    }
    drawFooter(
      ctx,
      api,
      'The mean removes the sequence axis · prompt and output-feature axes remain',
    );
  });
}
export default {
  id: 'pooling',
  draw: drawPooling,
  cues: ['pool-reset', 'pool-my', 'pool-password', 'pool-sum', 'pool-result', 'pool-permute'],
};
