import { TRACKS } from '../model.mjs';
import { drawOriginalText, drawVisualFocus } from '../defaults.mjs';
export function drawRanking(ctx, scene, state, api) {
  const { C: themeColors, teaching } = api;
  const beat = state.beat ?? 0;
  const progress = api.clamp(state.beatP ?? 0);
  const revealProgress = (from = 0.08, to = 0.84) => api.phase(progress, from, to);
  const snapshot = TRACKS['ranking'].sample({
    beat,
    beatP: progress,
  }).snapshot;
  const documentColor = (id) =>
    snapshot.relevant?.includes(id) ? themeColors.green : themeColors.pink;
  drawOriginalText(ctx, api, 'Same query · make + soup', 150, 225, 25, themeColors.cyan);
  {
    drawVisualFocus(ctx, api, 'ranking-object-bm25-score-by-document-30', () =>
      drawOriginalText(ctx, api, 'BM25 score by document', 960, 285, 36, themeColors.ink, 'center'),
    );
    drawVisualFocus(ctx, api, 'ranking-object-distribution-ranking-31', () => {
      ctx.save();
      try {
        ctx.globalAlpha *= beat === 0 ? revealProgress(0.06, 0.88) : 1;
        return teaching.bars({
          x: 260,
          y: 385,
          width: 1390,
          height: 390,
          values: snapshot.ranking.map((row) => row.score),
          labels: snapshot.ranking.map((row) => row.docId),
          colors: snapshot.ranking.map((row) => documentColor(row.docId)),
          max: 1.8,
          progress: 1,
          showValues: true,
          format: (value) => value.toFixed(3),
          fontSize: 30,
          gap: 85,
        });
      } finally {
        ctx.restore();
      }
    });
    snapshot.ranking.forEach((row, index) => {
      const y = 820 + index * 35;
      if (index < 3)
        drawOriginalText(
          ctx,
          api,
          `${row.docId} · ${row.docId === 'd1' ? 'soup recipe' : row.docId === 'd4' ? 'soup menu' : 'no matching terms'}`,
          960,
          y,
          26,
          documentColor(row.docId),
          'center',
        );
    });
    drawOriginalText(
      ctx,
      api,
      'Passages marked useful: d1 and d2',
      960,
      965,
      29,
      themeColors.yellow,
      'center',
    );
  }
}
export default {
  id: 'ranking',
  draw: drawRanking,
  cues: [
    'ranking-beat-1-focus-1',
    'ranking-beat-1-focus-2',
    'ranking-beat-2-focus-1',
    'ranking-beat-2-focus-2',
    'ranking-beat-3-focus-1',
  ],
};
