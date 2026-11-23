import { accEvent } from '../construction.mjs';
import { drawCenteredText, drawFooter, drawPanel, drawText } from '../defaults.mjs';
export function drawTileDensity(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    ev = (name, beat) => accEvent(scene, state, name, beat),
    resultComplete = (name, beat) => ev(name, beat) === 1,
    B = (name, beat) => ev(name, beat) > 0;
  api.focus.target('tile-density-mechanism', () => {
    drawCenteredText(
      ctx,
      api,
      'One authored 128-row tile · 8 actual rows',
      960,
      285,
      35,
      themeColors.yellow,
    );
    const h = 590,
      y = 350,
      w = 750,
      x = 130;
    for (let i = 0; i < 128; i++) {
      const yy = y + (i * h) / 128;
      api.rect(
        ctx,
        x,
        yy,
        w,
        h / 128 - 0.3,
        i < 8 ? themeColors.cyan : themeColors.panel,
        i < 8 ? undefined : themeColors.muted,
        0,
      );
    }
    drawText(ctx, api, '8 real rows', 950, 390, 32, themeColors.cyan);
    drawText(ctx, api, '120 padded rows', 950, 550, 32, themeColors.muted);
    if (resultComplete('ratio', 0) || currentBeat > 0)
      drawText(ctx, api, '8 / 128 = 6.25%', 950, 720, 39, themeColors.yellow);
    if (currentBeat > 0 && B('other', 1)) {
      drawPanel(ctx, api, 1350, 380, 420, 430, themeColors.blue);
      drawCenteredText(ctx, api, 'Separate engine', 1560, 450, 29, themeColors.blue);
      const amount = ev('other', 1);
      for (let i = 0; i < 4; i++)
        api.rect(ctx, 1400, 510 + i * 60, 300 * amount, 32, themeColors.blue, undefined, 0);
      drawCenteredText(ctx, api, 'Concurrent work', 1560, 885, 28, themeColors.blue);
    }
    drawFooter(
      ctx,
      api,
      currentBeat === 2
        ? 'Try a small-row kernel, a larger batch or fewer weight bytes at the same arrival rate'
        : 'Local useful-row density is distinct from achieved chip throughput or other-engine activity',
    );
  });
}
export default {
  id: 'tile-density',
  draw: drawTileDensity,
  cues: [
    'ag-tile-density-real',
    'ag-tile-density-ratio',
    'ag-tile-density-mask',
    'ag-tile-density-other',
    'ag-tile-density-decode',
  ],
};
