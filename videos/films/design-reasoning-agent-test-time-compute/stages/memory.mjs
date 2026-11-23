import { memory } from '../arithmetic.mjs';
import { sentence } from '../construction.mjs';
import { sampleModel } from '../model.mjs';
import { drawOriginalText } from '../defaults.mjs';
export function drawMemory(ctx, scene, state, api) {
  const { C: themeColors, components: components } = api,
    modelState = sampleModel(state);
  {
    const m = memory(),
      rowWidth = 1060,
      removed = modelState.b
        ? Math.min(7, Math.floor(sentence(state, 'memory', 1, 1) * 7 + 1e-8))
        : 0,
      copies = 8 - removed;
    for (let i = 0; i < 8; i++) {
      const y = 350 + i * 65,
        x = 530;
      if (i < copies) {
        api.focus.target('memory-panel-memory', () =>
          components.panel({
            x,
            y,
            width: rowWidth * 0.75,
            height: 35,
            fill: themeColors.blue,
            stroke: themeColors.blue,
          }),
        );
        components.panel({
          x: x + rowWidth * 0.75,
          y,
          width: rowWidth * 0.25,
          height: 35,
          fill: themeColors.yellow,
          stroke: themeColors.yellow,
        });
      } else {
        components.panel({
          x: x + rowWidth * 0.75,
          y,
          width: rowWidth * 0.25,
          height: 35,
          fill: themeColors.yellow,
          stroke: themeColors.yellow,
        });
      }
      drawOriginalText(ctx, api, 'Branch ' + (i + 1), 320, y + 27, 27, themeColors.muted);
    }
    if (removed > 0) {
      api.focus.target('memory-panel-memory-4', () =>
        components.panel({
          x: 530,
          y: 350,
          width: rowWidth * 0.75,
          height: 35,
          fill: themeColors.blue,
          stroke: themeColors.blue,
        }),
      );
      api.line(ctx, 1295, 385, 1295, 822.5, themeColors.blue, 3);
      for (let i = copies; i < 8; i++)
        api.line(ctx, 1295, 367.5 + i * 65, 1325, 367.5 + i * 65, themeColors.blue, 3);
      drawOriginalText(
        ctx,
        api,
        'Blue: shared prefix · yellow: branch continuation',
        960,
        315,
        25,
        themeColors.muted,
        'center',
      );
    }
    drawOriginalText(
      ctx,
      api,
      removed === 7
        ? 'One shared stem + eight divergent tails'
        : removed
          ? copies + ' retained prefix copies · sharing construction'
          : 'Eight independent retained histories',
      960,
      270,
      35,
      themeColors.ink,
      'center',
    );
    drawOriginalText(
      ctx,
      api,
      (copies * m.stem + 8 * m.tail).toFixed(2) + ' GiB · before allocator overhead',
      960,
      965,
      38,
      themeColors.yellow,
      'center',
    );
    api.math(
      ctx,
      String.raw`2\cdot80\cdot8\cdot128\cdot2=327{,}680\ \mathrm{bytes/token}`,
      960,
      1040,
      34,
      themeColors.muted,
      'center',
    );
  }
}
export default {
  id: 'memory',
  draw: drawMemory,
  cues: [
    'memory-beat-1-focus-1',
    'ra-memory-0-0',
    'ra-memory-0-1',
    'ra-memory-0-2',
    'memory-beat-2-focus-1',
    'ra-memory-1-0',
    'ra-memory-1-1',
    'ra-memory-1-2',
    'ra-memory-1-3',
  ],
};
