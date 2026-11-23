import { systemExtensionFrame } from '../construction.mjs';
import { chapterCard, chapterText, footer, header } from '../defaults.mjs';
export function drawCacheCompatibility(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = systemExtensionFrame('cache-compatibility', state),
    currentBeat = modelState.beat,
    progress = modelState.op;
  return api.focus.target('sd-cache-compatibility-mechanism', () => {
    header(
      ctx,
      api,
      currentBeat === 0
        ? 'Changed-adapter case · one cached prefix'
        : currentBeat === 1
          ? 'Separate access case · matching model state'
          : 'Separate provider-route case',
    );
    const keys = ['token IDs', 'positions', 'model', 'adapter', 'cache config', 'tenant'],
      old = ['[7,12,9]', '[0,1,2]', 'M1', 'A1', 'C3', 'T4'],
      now = [...old];
    if (currentBeat === 0 && modelState.changed) now[3] = 'A2';
    keys.forEach((k, i) => {
      const y = 370 + i * 78;
      chapterText(ctx, api, k, 160, y + 35, 27, themeColors.muted);
      chapterCard(ctx, api, old[i], 450, y, 500, themeColors.blue, 62, 27);
      chapterCard(
        ctx,
        api,
        now[i],
        1070,
        y,
        500,
        old[i] === now[i] ? themeColors.cyan : themeColors.pink,
        62,
        27,
      );
    });
    if (currentBeat === 1)
      chapterCard(
        ctx,
        api,
        progress > 0.4 ? 'Current private grant: REVOKED' : 'Current grant lookup pending',
        550,
        880,
        1150,
        progress > 0.4 ? themeColors.pink : themeColors.yellow,
        70,
        31,
      );
    else if (currentBeat === 2)
      chapterCard(
        ctx,
        api,
        'Route B · previous provider hit does not transfer',
        420,
        880,
        1300,
        themeColors.yellow,
        70,
        31,
      );
    else if (modelState.done)
      chapterText(
        ctx,
        api,
        'Changed adapter → recompute',
        960,
        940,
        34,
        themeColors.pink,
        'center',
      );
    footer(ctx, api, 'Same text does not establish identical tensors or authorized disclosure');
  });
}
export default {
  id: 'cache-compatibility',
  draw: drawCacheCompatibility,
  cues: [
    'sd-cache-compatibility-0-operation',
    'sd-cache-compatibility-0-result',
    'sd-cache-compatibility-1-operation',
    'sd-cache-compatibility-1-result',
    'sd-cache-compatibility-2-operation',
    'sd-cache-compatibility-2-result',
  ],
};
