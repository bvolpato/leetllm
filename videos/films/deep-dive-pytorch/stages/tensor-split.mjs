import { tpProjectionFixture } from '../arithmetic.mjs';
import { sampleModel } from '../construction.mjs';
import { drawArrow, drawCard, drawFooter, drawGrid, drawLine, drawText } from '../defaults.mjs';
export function drawTensorSplit(ctx, scene, state, api) {
  return api.focus.target('pt-tensor-split-mechanism', () => {
    const { C: themeColors } = api,
      modelState = sampleModel('tensor-split', state),
      { b: currentBeat, p: progress } = modelState;
    {
      drawText(
        ctx,
        api,
        currentBeat === 2
          ? 'Same stored shard dimension, different computation ownership'
          : 'Linear stored weight is [output features, input features]',
        960,
        285,
        34,
        themeColors.yellow,
        'center',
      );
      if (currentBeat === 0) {
        const f = tpProjectionFixture(),
          n = Math.floor(progress * 4 + 1e-8);
        drawText(
          ctx,
          api,
          'Supplied composition · input X = [1,2]',
          960,
          350,
          29,
          themeColors.cyan,
          'center',
        );
        drawText(ctx, api, 'W1 [4,2]', 380, 405, 28, themeColors.blue, 'center');
        drawGrid(ctx, api, f.first, 160, 435, 450, 280, themeColors.blue, 27);
        drawText(ctx, api, 'Output-feature slices', 910, 405, 28, themeColors.cyan, 'center');
        drawGrid(
          ctx,
          api,
          [
            f.hidden.slice(0, 2).map((v, i) => (i < n ? v : '?')),
            f.hidden.slice(2).map((v, i) => (i + 2 < n ? v : '?')),
          ],
          710,
          435,
          400,
          220,
          themeColors.cyan,
          27,
        );
        drawText(ctx, api, 'W2 [2,4]', 1470, 405, 28, themeColors.pink, 'center');
        drawGrid(ctx, api, f.second, 1190, 435, 560, 220, themeColors.pink, 27);
        drawArrow(ctx, api, 635, 545, 685, 545, themeColors.yellow);
        drawText(ctx, api, 'Input-feature partials', 900, 755, 28, themeColors.cyan, 'center');
        drawGrid(
          ctx,
          api,
          f.partials.map((row) => row.map((v) => (progress > 0.7 ? v : '?'))),
          600,
          790,
          600,
          140,
          themeColors.cyan,
          27,
        );
        drawText(
          ctx,
          api,
          progress > 0.9 ? 'sum = [4,1]' : 'sum = ?',
          1490,
          880,
          37,
          progress > 0.9 ? themeColors.green : themeColors.yellow,
          'center',
        );
        drawFooter(
          ctx,
          api,
          'W1 splits output features; W2 reduces partial outputs over those same feature slices',
        );
      } else if (currentBeat === 1) {
        drawGrid(ctx, api, modelState.weight, 510, 365, 900, 480, themeColors.blue, 27);
        drawLine(ctx, api, 495, 605, 1425, 605, themeColors.yellow, 4);
        drawText(ctx, api, 'Rank 0 output rows', 270, 490, 29, themeColors.blue, 'center');
        drawText(ctx, api, 'Rank 1 output rows', 1650, 735, 29, themeColors.pink, 'center');
        drawText(
          ctx,
          api,
          modelState.showLocal
            ? '8×4 / TP2 → each stored shard 4×4'
            : 'Output feature slices preserve input width 4',
          960,
          965,
          34,
          modelState.showLocal ? themeColors.green : themeColors.cyan,
          'center',
        );
      } else {
        drawCard(ctx, api, 'TP axis: operator remains split', 180, 400, 670, themeColors.cyan, 115);
        drawCard(
          ctx,
          api,
          'DP axis: FSDP gathers compute weight',
          1040,
          400,
          700,
          themeColors.pink,
          115,
        );
        drawGrid(ctx, api, [['rows0–3'], ['rows4–7']], 280, 650, 440, 180, themeColors.cyan);
        drawGrid(ctx, api, [['rows0–7']], 1130, 650, 520, 180, themeColors.pink);
        drawFooter(
          ctx,
          api,
          'Combining strategies requires coherent named axes, layouts and collectives',
        );
      }
    }
  });
}
export default {
  id: 'tensor-split',
  draw: drawTensorSplit,
  cues: ['pt-tensor-split-0', 'pt-tensor-split-1', 'pt-stored-slice', 'pt-tensor-split-2'],
};
