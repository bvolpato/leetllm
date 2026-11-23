import { GiB } from '../arithmetic.mjs';
import { longContextModel } from '../construction.mjs';
import { contextText, equation, footer, modelTarget } from '../defaults.mjs';
export function drawMixedLayers(ctx, scene, state, api) {
  const { C: themeColors } = api,
    m = longContextModel('mixed-layers', state),
    currentBeat = m.beat,
    progress = m.p;
  {
    contextText(
      ctx,
      api,
      'Local and full layers keep different amounts of history',
      960,
      270,
      36,
      themeColors.cyan,
    );
    modelTarget(ctx, api, 'mixed-layers', () => {
      for (let i = 0; i < 40; i++)
        api.rect(
          ctx,
          210 + (i % 10) * 61,
          360 + Math.floor(i / 10) * 70,
          54,
          58,
          themeColors.blue,
          themeColors.blue,
          1,
        );
      for (let i = 0; i < 8; i++)
        api.rect(ctx, 1110 + i * 70, 390, 60, 250, themeColors.pink, themeColors.pink, 1);
    });
    contextText(ctx, api, '40 local layers', 485, 740, 35, themeColors.blue);
    contextText(ctx, api, '1,024 retained positions', 485, 805, 31, themeColors.blue);
    contextText(ctx, api, '8 full layers', 1395, 740, 35, themeColors.pink);
    contextText(ctx, api, '131,072 retained positions', 1395, 805, 31, themeColors.pink);
    const show = currentBeat > 0 ? progress : 0;
    if (show > 0)
      equation(
        ctx,
        api,
        String.raw`${m.local / GiB}+${m.global / GiB}=${m.total / GiB}\ \mathrm{GiB}`,
        960,
        930,
        49,
        themeColors.yellow,
      );
    footer(
      ctx,
      api,
      currentBeat === 2
        ? 'Add recurrent or latent state separately · verify actual buffers and eviction'
        : 'Supplied fixture · separate two-byte K and V arrays · wrong uniform estimate: 48 GiB',
    );
  }
}
export default {
  id: 'mixed-layers',
  draw: drawMixedLayers,
  cues: ['mixed-layers-0', 'mixed-layers-1', 'mixed-layers-2'],
};
