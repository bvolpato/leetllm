import { sampleModel } from '../construction.mjs';
import { drawCard, drawFooter, drawGrid, drawText } from '../defaults.mjs';
export function drawCompile(ctx, scene, state, api) {
  return api.focus.target('pt-compile-mechanism', () => {
    const { C: themeColors } = api,
      modelState = sampleModel('compile', state),
      { b: currentBeat, p: progress } = modelState;
    {
      drawText(
        ctx,
        api,
        'Actual declared guard: dtype + stride + Python scale',
        960,
        285,
        35,
        themeColors.yellow,
        'center',
      );
      modelState.events.forEach((e, i) => {
        const x = 140 + i * 580;
        api.focus.target('compile-call-scale', () =>
          drawCard(
            ctx,
            api,
            'Call ' + (i + 1) + ' · scale ' + e.scale,
            x,
            365,
            520,
            themeColors.blue,
            90,
          ),
        );
        drawGrid(
          ctx,
          api,
          [
            ['dtype', 'stride', 'scale'],
            ['float64', '1', e.scale],
            ['float64', '1', i === 2 ? 2 : e.scale],
          ],
          x,
          510,
          520,
          180,
          themeColors.cyan,
          24,
        );
        const good = i !== 2;
        drawText(
          ctx,
          api,
          good ? 'All predicates match' : 'Scale 3 ≠ saved 2',
          x + 260,
          755,
          29,
          good ? themeColors.green : themeColors.pink,
          'center',
        );
        drawText(
          ctx,
          api,
          'Graph ' + e.graph + ' · ' + (e.captured ? 'capture' : 'reuse'),
          x + 260,
          850,
          30,
          e.captured ? themeColors.pink : themeColors.green,
          'center',
        );
        drawText(
          ctx,
          api,
          'x² × ' + e.scale + ' = [' + e.output + ']',
          x + 260,
          940,
          29,
          themeColors.cyan,
          'center',
        );
      });
      drawFooter(ctx, api, 'Captured graphs   ' + modelState.graphs);
      return;
    }
  });
}
export default {
  id: 'compile',
  draw: drawCompile,
  cues: [
    'compile-beat-1-focus-1',
    'pt-compile-0',
    'compile-beat-2-focus-1',
    'pt-compile-1',
    'compile-beat-3-focus-1',
    'pt-compile-2',
  ],
};
