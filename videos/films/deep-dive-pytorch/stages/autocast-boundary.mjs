import { sampleModel } from '../construction.mjs';
import { drawArrow, drawCard, drawFooter, drawGrid, drawRows, drawText } from '../defaults.mjs';
export function drawAutocastBoundary(ctx, scene, state, api) {
  return api.focus.target('pt-autocast-boundary-mechanism', () => {
    const { C: themeColors } = api,
      modelState = sampleModel('autocast-boundary', state),
      { b: currentBeat, p: progress } = modelState;
    {
      if (currentBeat === 0) {
        drawText(
          ctx,
          api,
          'Compile at a stable useful boundary',
          960,
          285,
          35,
          themeColors.yellow,
          'center',
        );
        drawCard(ctx, api, 'Inner module / train step', 170, 420, 650, themeColors.blue, 110);
        drawCard(ctx, api, 'DDP wrapper', 1110, 420, 650, themeColors.cyan, 110);
        drawArrow(ctx, api, 845, 475, 1080, 475);
        drawCard(
          ctx,
          api,
          'FSDP2 blocks + hooks + collectives',
          450,
          790,
          1020,
          themeColors.pink,
          110,
        );
        drawFooter(ctx, api, 'FSDP2 gathers weights before the compiled block uses them');
      } else if (currentBeat === 1) {
        drawRows(
          ctx,
          api,
          [
            ['Forward + loss', 'BF16 autocast'],
            ['Actual backward', 'outside autocast'],
            ['Compiler assumption', progress < 0.55 ? 'same as forward' : 'off'],
          ],
          390,
          170,
        );
        drawText(
          ctx,
          api,
          progress < 0.55
            ? 'Assumption and actual backward disagree'
            : 'Documented off assumption matches this backward context',
          960,
          975,
          32,
          progress < 0.55 ? themeColors.pink : themeColors.green,
          'center',
        );
      } else {
        drawText(
          ctx,
          api,
          'Actual PyTorch 2.13 CPU staging comparison',
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
            ['Context', 'Eager', 'AOT eager'],
            ['BF16 forward', 'run', 'run'],
            ['Backward outside autocast', 'run', 'run'],
            ['Loss / gradients', 'reference', progress > 0.5 ? 'matches' : 'compare'],
          ],
          250,
          400,
          1420,
          350,
          themeColors.green,
          29,
        );
        drawFooter(
          ctx,
          api,
          'Compare the loss and parameter gradients on the target training setup',
        );
      }
    }
  });
}
export default {
  id: 'autocast-boundary',
  draw: drawAutocastBoundary,
  cues: ['pt-autocast-boundary-0', 'pt-autocast-boundary-1', 'pt-autocast-boundary-2'],
};
