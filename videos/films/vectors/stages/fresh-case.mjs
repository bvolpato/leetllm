import { P } from '../fixtures.mjs';
import { extendedFrame } from '../model.mjs';
import {
  coordinateAxes,
  drawExtendedEquation,
  drawExtendedTarget,
  drawExtendedText,
  drawFooter,
  drawMatrixBlock,
  formatVectorValue,
} from '../defaults.mjs';
export function drawFreshCase(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat ?? 0,
    f = extendedFrame('fresh-case', state);
  drawExtendedTarget(ctx, api, 'fresh-case' + '-mechanism', () => {
    if (beat < 2) {
      const input = f.hidden;
      drawExtendedTarget(ctx, api, 'fresh-input', () =>
        drawMatrixBlock(ctx, api, input, 340, 390, {
          label: 'new prompt · T2 changes to [2, 1]',
          rowNames: ['T0', 'T1', 'T2', 'PAD'],
          cell: 105,
          color: themeColors.blue,
          select: (r) => r === 2,
        }),
      );
      drawExtendedTarget(ctx, api, 'fresh-map', () =>
        drawMatrixBlock(ctx, api, P, 855, 450, {
          label: 'same P · bias 0',
          cell: 95,
          color: themeColors.yellow,
        }),
      );
      drawExtendedText(ctx, api, '×', 700, 590, 58, themeColors.muted);
      drawExtendedText(ctx, api, '=', 1220, 590, 58, themeColors.muted);
      drawExtendedTarget(ctx, api, 'fresh-output', () =>
        drawMatrixBlock(ctx, api, f.output, 1390, 390, {
          label: f.reveal ? 'one changed token row' : 'predict the owned output rows',
          cell: 95,
          color: themeColors.green,
          visible: () => f.reveal,
          select: (r) => f.reveal && r === 2,
        }),
      );
      drawExtendedTarget(ctx, api, 'fresh-shape', () =>
        drawExtendedEquation(
          ctx,
          api,
          f.reveal
            ? '[1,4,2]@[2,3]\\longrightarrow[1,4,3]'
            : '[1,4,2]@[2,3]\\longrightarrow[\\,?,\\,?,\\,?\\,]',
          960,
          955,
          45,
          f.reveal ? themeColors.green : themeColors.yellow,
        ),
      );
    } else if (beat === 2) {
      const p = coordinateAxes(
        ctx,
        api,
        240,
        390,
        580,
        470,
        [-0.1, 3.5],
        [-0.1, 3.5],
        'output 1',
        'output 3',
        [0, 1, 2, 3],
      );
      drawExtendedTarget(ctx, api, 'fresh-summary-accumulation', () =>
        api.teaching.vectorAccumulation({
          plot: p,
          terms: f.terms.map((t, i) => ({
            ...t,
            color: [themeColors.blue, themeColors.pink, themeColors.cyan][i],
          })),
          progress: f.progress,
          projection: {
            label: 'outputs 1 and 3; full vectors retained',
            point: (v) => [v[0], v[2]],
          },
          ledger: {
            x: 1000,
            y: 420,
            width: 770,
            height: 390,
          },
          fontSize: 31,
          color: themeColors.green,
          restColor: themeColors.muted,
          revealTotal: f.divide > 0 ? f.result : f.progress === 1,
          totalLabel:
            f.divide === 1 ? 'Masked mean' : f.divide > 0 ? 'Dividing by 3' : 'Real-token sum',
          totalTarget: 'fresh-summary-result',
          format: formatVectorValue,
          completedOpacity: 0.6,
          endpointRadius: 4,
        }),
      );
      drawExtendedTarget(ctx, api, 'fresh-padding-comparison', () =>
        drawExtendedText(
          ctx,
          api,
          f.wrong
            ? 'wrong divisor4 → [0.75, 0.5, 0.625]'
            : 'three valid positions · four stored positions',
          960,
          950,
          35,
          f.wrong ? themeColors.pink : themeColors.muted,
          'center',
        ),
      );
    } else {
      drawExtendedTarget(ctx, api, 'fresh-final-inputs', () =>
        drawMatrixBlock(ctx, api, f.output.slice(0, 3), 340, 420, {
          label: 'three real projected vectors',
          rowNames: ['T0', 'T1', 'T2'],
          cell: 115,
          color: themeColors.blue,
        }),
      );
      drawExtendedTarget(ctx, api, 'fresh-final-result', () => {
        drawExtendedText(
          ctx,
          api,
          'sum = [3, 2, 2.5]',
          1330,
          440,
          39,
          themeColors.yellow,
          'center',
        );
        drawExtendedText(ctx, api, 'valid count = 3', 1330, 550, 35, themeColors.muted, 'center');
        drawExtendedText(ctx, api, '[1, 2/3, 5/6]', 1330, 730, 56, themeColors.green, 'center');
      });
      drawExtendedText(
        ctx,
        api,
        'next: independent directions inside the matrix',
        960,
        950,
        34,
        themeColors.ink,
        'center',
      );
    }
    drawFooter(
      ctx,
      api,
      'Change one input token · preserve other rows · aggregate only the valid positions',
    );
  });
}
export default {
  id: 'fresh-case',
  draw: drawFreshCase,
  cues: [
    'fresh-input-change',
    'fresh-token-answer',
    'fresh-summary',
    'fresh-summary-answer',
    'fresh-padding-answer',
  ],
};
