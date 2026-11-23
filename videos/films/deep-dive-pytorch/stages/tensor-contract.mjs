import { sampleModel } from '../construction.mjs';
import {
  drawCard,
  drawFooter,
  drawGrid,
  drawPathParticle,
  drawRows,
  drawText,
} from '../defaults.mjs';
export function drawTensorContract(ctx, scene, state, api) {
  return api.focus.target('pt-tensor-contract-mechanism', () => {
    const { C: themeColors } = api,
      modelState = sampleModel('tensor-contract', state),
      { b: currentBeat, p: progress } = modelState;
    {
      if (currentBeat === 0) {
        drawText(
          ctx,
          api,
          'Dense strided tensor · one allocation S1',
          960,
          285,
          36,
          themeColors.yellow,
          'center',
        );
        drawGrid(ctx, api, [[0, 1, 2, 3, 4, 5]], 250, 400, 1440, 95, themeColors.cyan);
        drawRows(
          ctx,
          api,
          [
            ['sizes / strides', '[2,3] / [3,1]'],
            ['index [1,0] + offset 0', '1×3 + 0×1 = ' + modelState.cell],
            ['int64: multiply by 8 bytes', 'byte offset ' + modelState.byte],
          ],
          565,
          130,
        );
      } else if (currentBeat === 1) {
        drawText(
          ctx,
          api,
          'Transpose keeps S1 · consumer constructs S2',
          960,
          285,
          35,
          themeColors.yellow,
          'center',
        );
        drawGrid(ctx, api, [[0, 1, 2, 3, 4, 5]], 250, 400, 1420, 95, themeColors.blue);
        drawGrid(
          ctx,
          api,
          [modelState.copy.map((v, i) => (i < modelState.copyCount ? v : ''))],
          250,
          740,
          1420,
          95,
          themeColors.green,
        );
        for (let i = 0; i < modelState.copyCount; i++) {
          const source = modelState.copy[i];
          drawPathParticle(
            ctx,
            api,
            [
              {
                x: 370 + source * 237,
                y: 515,
              },
              {
                x: 370 + source * 237,
                y: 560 + i * 17,
              },
              {
                x: 370 + i * 237,
                y: 560 + i * 17,
              },
              {
                x: 370 + i * 237,
                y: 720,
              },
            ],
            1,
            themeColors.cyan,
          );
        }
        drawText(
          ctx,
          api,
          'New order [' + modelState.copy.slice(0, modelState.copyCount).join(', ') + ']',
          960,
          930,
          33,
          themeColors.green,
          'center',
        );
      } else {
        drawText(
          ctx,
          api,
          'Representation determines what storage means',
          960,
          285,
          35,
          themeColors.yellow,
          'center',
        );
        drawCard(ctx, api, 'Dense strided', 160, 390, 440, themeColors.blue, 90);
        drawGrid(
          ctx,
          api,
          [
            [0, 1, 2],
            [3, 4, 5],
          ],
          160,
          550,
          440,
          180,
          themeColors.blue,
        );
        drawCard(ctx, api, 'Meta: shapes / dtype', 740, 390, 440, themeColors.cyan, 90);
        drawGrid(
          ctx,
          api,
          [
            ['·', '·', '·'],
            ['·', '·', '·'],
          ],
          740,
          550,
          440,
          180,
          themeColors.muted,
        );
        drawCard(ctx, api, 'Sparse: indices + values', 1320, 390, 440, themeColors.pink, 90);
        drawGrid(
          ctx,
          api,
          [
            ['(0,1)', '(1,2)'],
            ['7', '9'],
          ],
          1320,
          550,
          440,
          180,
          themeColors.pink,
          26,
        );
        drawText(ctx, api, 'No tensor-data allocation', 960, 850, 30, themeColors.cyan, 'center');
        drawText(ctx, api, 'Different representation', 1540, 850, 30, themeColors.pink, 'center');
      }
      drawFooter(
        ctx,
        api,
        'Sizes, element strides, offset and dtype describe the actual address contract',
      );
    }
  });
}
export default {
  id: 'tensor-contract',
  draw: drawTensorContract,
  cues: ['pt-tensor-contract-0', 'pt-tensor-contract-1', 'pt-tensor-contract-2'],
};
