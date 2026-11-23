import { gradientFixture } from '../arithmetic.mjs';
import { sampleModel } from '../construction.mjs';
import { drawExtensionCell, drawExtensionFooter, drawExtensionText } from '../defaults.mjs';
export function drawMixedShapeCache(ctx, scene, state, api) {
  return api.focus.target('fa-' + scene.id + '-mechanism', () => {
    const { C: themeColors } = api,
      modelState = sampleModel('mixed-shape-cache', state),
      { b: currentBeat, p: progress } = modelState,
      teaching2 = gradientFixture();
    {
      drawExtensionText(
        ctx,
        api,
        'A: Q128 / KV2     B: Q64 / KV1     same ratio64',
        960,
        300,
        35,
        themeColors.yellow,
        'center',
      );
      const order = ['A', 'B', 'B', 'A'];
      order.forEach((name, i) => {
        const x = 200 + i * 420;
        drawExtensionCell(
          ctx,
          api,
          name,
          x,
          410,
          350,
          95,
          i < modelState.count ? themeColors.blue : themeColors.muted,
        );
        drawExtensionText(
          ctx,
          api,
          i < 2 ? 'A then B' : 'B then A',
          x + 175,
          610,
          27,
          themeColors.muted,
          'center',
        );
        const key = modelState.repaired
          ? name === 'A'
            ? 'ratio64 / KV2'
            : 'ratio64 / KV1'
          : 'ratio64';
        if (i < modelState.count)
          drawExtensionCell(
            ctx,
            api,
            key,
            x,
            720,
            350,
            95,
            modelState.repaired
              ? themeColors.green
              : i === 1 || i === 3
                ? themeColors.pink
                : themeColors.cyan,
          );
      });
      drawExtensionFooter(
        ctx,
        api,
        modelState.repaired
          ? 'Adding the KV head count gives A and B distinct cache entries'
          : 'With only the ratio in the cache key, A and B look identical',
      );
    }
  });
}
export default {
  id: 'mixed-shape-cache',
  draw: drawMixedShapeCache,
  cues: [
    'fa-mixed-shape-cache-0',
    'fa-mixed-shape-cache-1',
    'fa-cache-complete',
    'fa-mixed-shape-cache-2',
  ],
};
