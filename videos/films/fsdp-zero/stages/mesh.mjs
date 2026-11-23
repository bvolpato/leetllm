import { bounded } from '../arithmetic.mjs';
import { drawExpandedText, drawExpandedTitle } from '../defaults.mjs';
export function drawMesh(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = bounded(state.beatP ?? 0),
    F = api.components.fade;
  const cueProgress = (a = 0.1, z = 0.85) => api.phase(progress, a, z);
  {
    drawExpandedTitle(
      ctx,
      api,
      'A regular Cartesian mesh · each sequence identity stays with its replica',
    );
    const q = cueProgress();
    const replicas = currentBeat === 0 ? 1 : Math.min(8, 1 + Math.floor(q * 8));
    for (let dp = 0; dp < replicas; dp++) {
      const x = 210 + (dp % 4) * 410,
        y = 390 + Math.floor(dp / 4) * 270;
      api.rect(ctx, x, y, 350, 225, themeColors.panel, themeColors.muted, 5);
      for (let pp = 0; pp < 2; pp++) {
        for (let cp = 0; cp < 2; cp++) {
          for (let tp = 0; tp < 4; tp++) {
            const xx = x + 20 + tp * 78,
              yy = y + 30 + cp * 55 + pp * 105;
            api.rect(
              ctx,
              xx,
              yy,
              61,
              35,
              cp === 0 ? themeColors.blue : themeColors.cyan,
              undefined,
              2,
            );
          }
        }
      }
      drawExpandedText(
        ctx,
        api,
        'DP replica ' + dp,
        x + 175,
        y - 15,
        26,
        themeColors.yellow,
        'center',
      );
    }
    if (currentBeat === 0) {
      drawExpandedText(
        ctx,
        api,
        'One replica: TP4 × CP2 × PP2 = 16 ranks',
        960,
        790,
        40,
        themeColors.yellow,
        'center',
      );
      drawExpandedText(
        ctx,
        api,
        'TP splits layer work · CP splits tokens · PP splits depth',
        960,
        940,
        31,
        themeColors.muted,
        'center',
      );
    } else {
      drawExpandedText(
        ctx,
        api,
        replicas + ' replicas × 16 cooperating ranks = ' + replicas * 16 + ' ranks',
        960,
        980,
        36,
        themeColors.ink,
        'center',
      );
      if (replicas === 8)
        drawExpandedText(
          ctx,
          api,
          '1 sequence × 4 microbatches × DP8 = 32 independent sequences',
          960,
          1040,
          30,
          themeColors.green,
          'center',
        );
    }
    return;
  }
  return;
}
export default {
  id: 'mesh',
  draw: drawMesh,
  cues: [],
};
