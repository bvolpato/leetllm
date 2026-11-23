import { complete, sampleModel } from '../construction.mjs';
import { drawArrow, drawFooter, drawGrid, drawText } from '../defaults.mjs';
export function drawDcpLoad(ctx, scene, state, api) {
  return api.focus.target('pt-dcp-load-mechanism', () => {
    const { C: themeColors } = api,
      modelState = sampleModel('dcp-load', state),
      { b: currentBeat, p: progress } = modelState;
    {
      if (currentBeat === 0) {
        drawText(
          ctx,
          api,
          'Construct destination storage before in-place load',
          960,
          285,
          35,
          themeColors.yellow,
          'center',
        );
        drawGrid(
          ctx,
          api,
          [
            ['Canonical name', 'Checkpoint', 'Destination'],
            ['model.weight', 'saved tensor', progress > 0.3 ? 'filled' : 'allocated'],
            ['optimizer.m', 'saved tensor', progress > 0.5 ? 'filled' : 'allocated'],
            ['optimizer.v', 'saved tensor', progress > 0.7 ? 'filled' : 'allocated'],
            ['optimizer.step', 'saved counter', progress > 0.9 ? 'filled' : 'allocated'],
          ],
          220,
          380,
          1480,
          430,
          themeColors.cyan,
          28,
        );
      } else if (currentBeat === 1) {
        drawText(
          ctx,
          api,
          'Logical tensor ownership is independent of physical file names',
          960,
          285,
          35,
          themeColors.yellow,
          'center',
        );
        drawGrid(
          ctx,
          api,
          [
            ['Old files', 'logical ranges'],
            ['part0', '0…3'],
            ['part1', '4…7'],
            ['part2', '8…11'],
          ],
          170,
          390,
          620,
          390,
          themeColors.blue,
        );
        drawGrid(
          ctx,
          api,
          [
            ['New target', 'logical ranges'],
            ['rank0', '0…5'],
            ['rank1', '6…11'],
          ],
          1090,
          460,
          660,
          290,
          themeColors.cyan,
        );
        drawArrow(ctx, api, 835, 620, 1045, 620, themeColors.yellow);
        drawFooter(ctx, api, 'part1 supplies elements 4–5 to rank 0 and 6–7 to rank 1');
      } else {
        drawText(
          ctx,
          api,
          'Single-process CPU checkpoint reload',
          960,
          285,
          35,
          themeColors.yellow,
          'center',
        );
        drawGrid(
          ctx,
          api,
          [
            ['Next-step comparison', 'Uninterrupted', 'Restored'],
            ['Loss', 'reference', complete(state, 'dcp-match') ? 'matches' : 'pending'],
            ['Parameters', 'reference', complete(state, 'dcp-match') ? 'matches' : 'pending'],
            ['m / v / counter', 'reference', complete(state, 'dcp-match') ? 'matches' : 'pending'],
          ],
          220,
          390,
          1480,
          350,
          themeColors.green,
          29,
        );
      }
    }
  });
}
export default {
  id: 'dcp-load',
  draw: drawDcpLoad,
  cues: ['pt-dcp-load-0', 'pt-dcp-load-1', 'pt-dcp-load-2', 'pt-dcp-match'],
};
