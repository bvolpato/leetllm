import { IMAGE } from '../fixtures.mjs';
import { cueProgress, imageGrid, text } from '../defaults.mjs';
export function drawPixels(ctx, scene, state, api) {
  const { C: themeColors, components: components } = api,
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  const stage = (beat, start = 0.08, end = 0.88) =>
    currentBeat < beat ? 0 : currentBeat > beat ? 1 : api.phase(progress, start, end);
  const fade = components.fade;
  ctx.save();
  {
    if (currentBeat === 0) {
      const n = Math.floor(cueProgress(ctx, api, 'pixel-arrivals', stage(0)) * 25);
      api.focus.target('pixel-grid', () =>
        imageGrid(ctx, api, IMAGE, 400, 310, 115, {
          visible: n,
          reveal: cueProgress(ctx, api, 'pixel-arrivals', stage(0)),
        }),
      );
      text(ctx, api, '0  dark', 1320, 465, 44, themeColors.muted, 'center');
      text(ctx, api, '1  bright', 1320, 620, 44, themeColors.ink, 'center');
    } else
      api.focus.target('brightness-pair', () => {
        const patches = [
          Array.from(
            {
              length: 3,
            },
            () => [2 / 3, 2 / 3, 2 / 3],
          ),
          IMAGE.slice(0, 3).map((row) => row.slice(1, 4)),
        ];
        patches.forEach((values, i) => {
          const x = 320 + i * 870;
          imageGrid(ctx, api, values, x, 360, 115);
          text(
            ctx,
            api,
            i ? 'boundary' : 'uniform',
            x + 180,
            305,
            39,
            i ? themeColors.cyan : themeColors.blue,
            'center',
          );
          text(
            ctx,
            api,
            'total brightness  ' +
              values
                .flat()
                .reduce((a, v) => a + v, 0)
                .toFixed(0),
            x + 180,
            870,
            37,
            themeColors.ink,
            'center',
          );
        });
        text(
          ctx,
          api,
          'Same total. Different arrangement.',
          960,
          1005,
          37,
          themeColors.yellow,
          'center',
        );
      });
  }
  ctx.restore();
}
export default {
  id: 'pixels',
  draw: drawPixels,
  cues: ['pixel-arrivals', 'equal-brightness'],
};
