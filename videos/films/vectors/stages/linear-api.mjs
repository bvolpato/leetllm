import { P } from '../fixtures.mjs';
import { BASE_OUTPUT, extendedFrame } from '../model.mjs';
import {
  drawExtendedEquation,
  drawExtendedTarget,
  drawExtendedText,
  drawFooter,
  drawMatrixBlock,
} from '../defaults.mjs';
export function drawLinearApi(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat ?? 0,
    f = extendedFrame('linear-api', state);
  drawExtendedTarget(ctx, api, 'linear-api' + '-mechanism', () => {
    if (beat === 1) {
      drawExtendedTarget(ctx, api, 'linear-row-map', () =>
        drawMatrixBlock(ctx, api, BASE_OUTPUT[0], 260, 420, {
          label: 'one prompt · input @ weight.T',
          cell: 105,
          color: themeColors.blue,
        }),
      );
      drawExtendedTarget(ctx, api, 'linear-bias', () =>
        drawMatrixBlock(ctx, api, [[0.1 * f.biased, -0.2 * f.biased, 0.3 * f.biased]], 810, 525, {
          label: 'bias applied at every token',
          cell: 115,
          fontSize: 30,
          color: themeColors.pink,
        }),
      );
      drawExtendedText(ctx, api, '+', 700, 610, 55, themeColors.muted);
      drawExtendedText(ctx, api, '=', 1240, 610, 55, themeColors.muted);
      drawExtendedTarget(ctx, api, 'linear-stored', () =>
        drawMatrixBlock(ctx, api, f.values, 1360, 420, {
          label: 'three owned affine outputs',
          cell: 115,
          fontSize: 30,
          color: themeColors.green,
        }),
      );
      drawExtendedTarget(ctx, api, 'linear-transpose', () =>
        drawExtendedEquation(
          ctx,
          api,
          '[B,T,2]\\longrightarrow[B,T,3]',
          960,
          940,
          45,
          themeColors.ink,
        ),
      );
    } else {
      drawExtendedTarget(ctx, api, 'linear-row-map', () =>
        drawMatrixBlock(ctx, api, P, 280, 420, {
          label: 'our P · [input, output]',
          cell: 115,
          color: themeColors.yellow,
        }),
      );
      drawExtendedTarget(ctx, api, 'linear-stored', () =>
        drawMatrixBlock(ctx, api, f.stored, 1130, 365, {
          label: 'Linear.weight · [output, input]',
          cell: 115,
          color: themeColors.cyan,
          visible: (r, c) => r * 2 + c < Math.floor(f.transposed * 6 + 1e-9),
        }),
      );
      drawExtendedTarget(ctx, api, 'linear-transpose', () =>
        drawExtendedEquation(ctx, api, 'W_{\\mathrm{stored}}=P^T', 960, 850, 48, themeColors.ink),
      );
      drawExtendedText(
        ctx,
        api,
        'the multiply uses weight.T, restoring the original map',
        960,
        960,
        32,
        themeColors.green,
        'center',
      );
    }
    drawFooter(
      ctx,
      api,
      beat > 0
        ? 'input @ weight.T + bias · preserve every leading prompt/token axis'
        : 'Changing the storage orientation leaves the same input-to-output coefficients',
    );
  });
}
export default {
  id: 'linear-api',
  draw: drawLinearApi,
  cues: ['linear-store', 'linear-bias'],
};
