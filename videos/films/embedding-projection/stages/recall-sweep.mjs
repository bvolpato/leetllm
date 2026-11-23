import { chapterCueVisible, chapterRectangle, chapterText } from '../defaults.mjs';
export function drawRecallSweep(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  {
    if (currentBeat === 0 && !chapterCueVisible(ctx, api, 'sweep-dimensions')) {
      chapterText(
        ctx,
        api,
        'Executed worksheet: 60 rows × 6 coordinates → 2 PCs',
        960,
        285,
        35,
        themeColors.ink,
      );
      for (let i = 0; i < 60; i++)
        chapterRectangle(
          ctx,
          api,
          250 + (i % 10) * 145,
          395 + Math.floor(i / 10) * 70,
          110,
          45,
          themeColors.panel,
          themeColors.cyan,
        );
      chapterText(
        ctx,
        api,
        'Each mark retains one source row identity',
        960,
        890,
        29,
        themeColors.muted,
      );
      if (chapterCueVisible(ctx, api, 'sweep-energy'))
        chapterText(
          ctx,
          api,
          '2 components retain 99.2% variance in this separate fixture',
          960,
          965,
          35,
          themeColors.green,
        );
      return;
    }
    const dims = [2, 4, 8, 12],
      energy = [0.294, 0.495, 0.727, 0.871],
      recall = [0.383, 0.867, 1, 1];
    chapterText(
      ctx,
      api,
      'Separate seeded retrieval worksheet · 20 intents',
      960,
      280,
      35,
      themeColors.ink,
    );
    dims.forEach((d, i) => {
      const x = 340 + i * 420;
      chapterText(ctx, api, d + ' dimensions', x, 365, 31, themeColors.ink);
      chapterRectangle(
        ctx,
        api,
        x - 105,
        870 - 400 * energy[i],
        85,
        400 * energy[i],
        themeColors.blue,
        themeColors.blue,
      );
      if (chapterCueVisible(ctx, api, 'sweep-recall') || currentBeat > 0)
        chapterRectangle(
          ctx,
          api,
          x + 20,
          870 - 400 * recall[i],
          85,
          400 * recall[i],
          themeColors.green,
          themeColors.green,
        );
      chapterText(ctx, api, energy[i].toFixed(3), x - 62, 930, 29, themeColors.blue);
      if (chapterCueVisible(ctx, api, 'sweep-recall') || currentBeat > 0)
        chapterText(ctx, api, recall[i].toFixed(3), x + 62, 930, 29, themeColors.green);
    });
    chapterText(
      ctx,
      api,
      'Blue: retained variance · green: judged Recall@3',
      960,
      1010,
      30,
      themeColors.muted,
    );
  }
  return;
}
export default {
  id: 'recall-sweep',
  draw: drawRecallSweep,
  cues: ['sweep-energy', 'sweep-dimensions', 'sweep-recall', 'sweep-gates', 'sweep-freeze'],
};
