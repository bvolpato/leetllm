import { sampleModel } from '../construction.mjs';
import { drawArrow, drawCard, drawFooter, drawGrid, drawText } from '../defaults.mjs';
export function drawCompilerRegions(ctx, scene, state, api) {
  return api.focus.target('pt-compiler-regions-mechanism', () => {
    const { C: themeColors } = api,
      modelState = sampleModel('compiler-regions', state),
      { b: currentBeat, p: progress } = modelState;
    {
      if (currentBeat === 0) {
        drawText(
          ctx,
          api,
          'Capture → functionalize/decompose → stage autograd → lower',
          960,
          285,
          32,
          themeColors.yellow,
          'center',
        );
        ['Dynamo graph', 'Pure transform', 'AOT forward/backward', 'Inductor codegen'].forEach(
          (v, i) => {
            drawCard(
              ctx,
              api,
              v,
              150 + i * 440,
              430,
              380,
              i <= Math.floor(progress * 4) ? themeColors.cyan : themeColors.muted,
              130,
            );
            if (i < 3)
              drawArrow(ctx, api, 545 + i * 440, 495, 575 + i * 440, 495, themeColors.blue);
          },
        );
        drawText(
          ctx,
          api,
          'Inductor can fuse adjacent operations into one kernel',
          960,
          850,
          29,
          themeColors.muted,
          'center',
        );
      } else if (currentBeat === 1) {
        drawText(
          ctx,
          api,
          'A graph break and a guard failure have different causes',
          960,
          285,
          34,
          themeColors.yellow,
          'center',
        );
        drawCard(ctx, api, 'Captured graph 1', 160, 400, 470, themeColors.blue, 110);
        drawCard(ctx, api, 'Unsupported Python', 735, 400, 450, themeColors.pink, 110);
        drawCard(ctx, api, 'Captured graph 2', 1290, 400, 470, themeColors.cyan, 110);
        drawArrow(ctx, api, 650, 455, 710, 455);
        drawArrow(ctx, api, 1200, 455, 1260, 455);
        drawGrid(
          ctx,
          api,
          [
            ['Call', 'dtype', 'stride', 'scale'],
            ['cached', 'float64', '1', '2'],
            ['new', 'float64', '1', progress > 0.5 ? '3' : '2'],
          ],
          330,
          650,
          1260,
          230,
          themeColors.yellow,
          29,
        );
        drawText(
          ctx,
          api,
          progress > 0.5
            ? 'Changed scale → cached guard fails'
            : 'Changed tensor values can keep this metadata key',
          960,
          1005,
          30,
          progress > 0.5 ? themeColors.pink : themeColors.green,
          'center',
        );
      } else {
        drawText(
          ctx,
          api,
          'Actual counting backend: two captured graphs',
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
            ['Scale', '2', '2', '3'],
            ['Graph', '1', '1', '2'],
            ['Action', 'capture', 'reuse', 'capture'],
          ],
          200,
          395,
          1520,
          260,
          themeColors.cyan,
        );
        drawCard(ctx, api, 'CPU AOT eager', 200, 800, 600, themeColors.blue, 100);
        drawCard(ctx, api, 'Eager loss + gradients agree', 1030, 800, 680, themeColors.green, 100);
        drawFooter(ctx, api, 'Time compilation and warm execution separately');
      }
    }
  });
}
export default {
  id: 'compiler-regions',
  draw: drawCompilerRegions,
  cues: ['pt-compiler-regions-0', 'pt-compiler-regions-1', 'pt-compiler-regions-2'],
};
