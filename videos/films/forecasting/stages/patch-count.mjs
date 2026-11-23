import { FORECAST_CUE_AT } from '../fixtures.mjs';
import { forecastCueProgress } from '../construction.mjs';
import { patchContract } from '../model.mjs';
import { caption, extensionText, line, rectangle } from '../defaults.mjs';
export function drawPatchCount(ctx, scene, state, api) {
  if (!Object.keys(FORECAST_CUE_AT).some((id) => id.startsWith('fc-patch-count-'))) return;
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const cueProgress = (suffix) => forecastCueProgress(state, `fc-${'patch-count'}-${suffix}`);
  const done = (suffix) => cueProgress(suffix) >= 1;
  api.focus.target('fc-patch-count-mechanism', () => {
    const pc = patchContract(),
      formed = cueProgress('forty-one'),
      padded = cueProgress('forty-two');
    const x = 200,
      w = 1512;
    for (let i = 0; i < 336; i++)
      rectangle(
        ctx,
        api,
        x + (i * w) / 336,
        375,
        w / 336,
        48,
        themeColors.muted,
        i < 16 ? themeColors.cyan : themeColors.panel,
      );
    if (done('formula'))
      extensionText(ctx, api, 'floor((336 − 16) / 8) + 1', 960, 325, 38, themeColors.cyan);
    const count = Math.floor(formed * 41);
    for (let i = 0; i < count; i++) {
      rectangle(ctx, api, 220 + i * 35, 485, 28, 60, themeColors.blue, themeColors.blue);
    }
    if (padded > 0)
      rectangle(ctx, api, 220 + 41 * 35, 485, 28, 60, themeColors.yellow, themeColors.yellow);
    extensionText(
      ctx,
      api,
      `Length 16 · stride 8${done('forty-one') ? ' · 41 complete patches' : ''}${done('forty-two') ? ' + 1 end-padded patch' : ''}`,
      960,
      605,
      30,
      themeColors.blue,
    );
    if (!done('forty-two')) return;
    const tile = 34;
    const side = (pc.lookback / pc.tokens) * tile;
    const mapX = 420;
    const mapY = 662;
    rectangle(ctx, api, mapX, mapY, side, side, themeColors.blue);
    if (currentBeat >= 2) {
      rectangle(ctx, api, mapX, mapY, tile, tile, themeColors.yellow, themeColors.yellow);
      for (let offset = tile; offset < side; offset += tile) {
        line(ctx, api, mapX + offset, mapY, mapX + offset, mapY + side, themeColors.muted, 2);
        line(ctx, api, mapX, mapY + offset, mapX + side, mapY + offset, themeColors.muted, 2);
      }
    }
    rectangle(ctx, api, 978, mapY, tile, tile, themeColors.yellow, themeColors.yellow);
    extensionText(ctx, api, '336 × 336', mapX - 110, mapY + side / 2, 30, themeColors.blue);
    extensionText(ctx, api, '42 × 42', 1135, mapY + 30, 30, themeColors.yellow);
    if (done('ratio'))
      extensionText(
        ctx,
        api,
        `${pc.originalEntries} / ${pc.patchedEntries} = 64`,
        1260,
        850,
        34,
        themeColors.yellow,
      );
    caption(ctx, api, 'Attention entries for one channel, drawn at the same scale');
  });
  return;
}
export default {
  id: 'patch-count',
  draw: drawPatchCount,
  cues: [
    'fc-patch-count-formula',
    'fc-patch-count-forty-one',
    'fc-patch-count-forty-two',
    'fc-patch-count-ratio',
  ],
};
