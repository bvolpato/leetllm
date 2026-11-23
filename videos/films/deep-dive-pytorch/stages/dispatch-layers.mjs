import { sampleModel } from '../construction.mjs';
import { drawArrow, drawCard, drawGrid, drawRows, drawText } from '../defaults.mjs';
export function drawDispatchLayers(ctx, scene, state, api) {
  return api.focus.target('pt-dispatch-layers-mechanism', () => {
    const { C: themeColors } = api,
      modelState = sampleModel('dispatch-layers', state),
      { b: currentBeat, p: progress } = modelState;
    {
      if (currentBeat === 0) {
        drawText(
          ctx,
          api,
          'One operator schema carries more than its numbers',
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
            ['Argument', 'Type', 'Alias', 'Mutation'],
            ['input', 'Tensor', 'A', 'yes'],
            ['output', 'Tensor', 'A', 'same storage'],
          ],
          170,
          380,
          1580,
          230,
          themeColors.cyan,
          29,
        );
        const k = Math.min(3, Math.floor(progress * 3));
        drawRows(
          ctx,
          api,
          [
            ['Immediate values', 'correct numbers'],
            [
              'Declared strides / aliases',
              k > 0 ? 'must match actual storage' : 'pending downstream use',
            ],
            [
              'Next view',
              k > 1 ? 'false stride contract → invalid traversal' : 'uses the declared index map',
            ],
          ],
          675,
          100,
        );
      } else if (currentBeat === 1) {
        const names = [
          'active transform mode',
          'autograd layer',
          'CPU / CUDA backend',
          'physical implementation',
        ];
        names.forEach((v, i) => {
          drawCard(
            ctx,
            api,
            v,
            130 + i * 440,
            480,
            380,
            i === Math.floor(progress * 4) ? themeColors.yellow : themeColors.blue,
            110,
          );
          if (i < 3) drawArrow(ctx, api, 525 + i * 440, 535, 555 + i * 440, 535, themeColors.cyan);
        });
        drawText(
          ctx,
          api,
          'Select highest applicable key → redispatch to the next layer',
          960,
          760,
          33,
          themeColors.cyan,
          'center',
        );
        drawText(
          ctx,
          api,
          'A profiler trace names the kernel that ran',
          960,
          890,
          29,
          themeColors.muted,
          'center',
        );
      } else {
        drawText(
          ctx,
          api,
          'Transformation modes preserve the operator contract',
          960,
          285,
          35,
          themeColors.yellow,
          'center',
        );
        drawCard(ctx, api, 'Original: x.add_(1)', 160, 400, 620, themeColors.pink, 100);
        drawGrid(ctx, api, [['S1: 2', 'S1: 3']], 160, 620, 620, 100, themeColors.pink);
        drawCard(ctx, api, 'Functional: y = x + 1', 1110, 400, 650, themeColors.green, 100);
        drawGrid(
          ctx,
          api,
          [['S1: 2', 'S2: ' + (progress > 0.4 ? '3' : '?')]],
          1110,
          620,
          650,
          100,
          themeColors.green,
        );
        drawCard(
          ctx,
          api,
          'Fake tensor: shape / dtype / device',
          440,
          850,
          1040,
          themeColors.cyan,
          95,
        );
        drawText(
          ctx,
          api,
          'Tracing can calculate the output shape from metadata',
          960,
          1000,
          29,
          themeColors.muted,
          'center',
        );
      }
    }
  });
}
export default {
  id: 'dispatch-layers',
  draw: drawDispatchLayers,
  cues: ['pt-dispatch-layers-0', 'pt-dispatch-layers-1', 'pt-dispatch-layers-2'],
};
