import { storageTransition } from '../construction.mjs';
import { coreRectangle, coreText } from '../defaults.mjs';
export function drawBudget(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  {
    const s = storageTransition({
      beat: currentBeat,
      beatP: progress,
    });
    coreText(ctx, api, '1,536 coordinates = six groups of 256', 960, 290, 36, themeColors.ink);
    for (let i = 0; i < 6; i++) {
      const x = 240 + i * 245,
        kept = Math.max(0, Math.min(256, s.dimensions - i * 256));
      coreRectangle(ctx, api, x, 400, 215, 130, themeColors.panel, themeColors.muted);
      if (kept)
        coreRectangle(
          ctx,
          api,
          x,
          400,
          (215 * kept) / 256,
          130,
          themeColors.cyan,
          themeColors.cyan,
        );
      coreText(ctx, api, 'group ' + (i + 1), x + 107, 585, 26, themeColors.muted);
    }
    coreText(
      ctx,
      api,
      s.dimensions + ' × 4 bytes = ' + s.bytesPerVector.toLocaleString() + ' bytes / vector',
      960,
      710,
      37,
      themeColors.ink,
    );
    coreText(
      ctx,
      api,
      '10 million records: ' + (s.currentBytes / 1e9).toFixed(2) + ' GB raw',
      960,
      825,
      42,
      themeColors.green,
    );
    coreText(
      ctx,
      api,
      '61.44 GB → 10.24 GB · 6× raw coordinate saving',
      960,
      925,
      32,
      themeColors.yellow,
    );
    coreText(
      ctx,
      api,
      'Graph / IDs / metadata / replicas are separate ledger entries',
      960,
      1010,
      28,
      themeColors.muted,
    );
  }
  return;
}
export default {
  id: 'budget',
  draw: drawBudget,
  cues: ['budget-beat-1-focus-1', 'budget-beat-2-focus-1', 'budget-beat-3-focus-1'],
};
