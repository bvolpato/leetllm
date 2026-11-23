import { formatValue } from '../arithmetic.mjs';
import { drawNote, drawPill, drawRectangle, drawText } from '../defaults.mjs';
export function drawShortlistBudget(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  api.clamp(state.beatP ?? 0, 0, 1);
  const cue = (k) => state.cues?.['cl-shortlist-budget-' + k],
    cueProgress = (k) => {
      const v = cue(k);
      return !v || v.phase === 'before' ? 0 : v.phase === 'after' ? 1 : v.progress;
    },
    resultComplete = (k) => cue(k)?.phase === 'after',
    B = (k) => {
      const v = cue(k);
      return !!v && v.phase !== 'before';
    };
  api.focus.target('shortlist-budget-mechanism', () => {
    if (currentBeat === 0) {
      const missing = B('missing'),
        rows = missing
          ? [['KMS', 0.21, themeColors.pink]]
          : [
              ['API answer', 0.96, themeColors.green],
              ['replacement', 0.91, themeColors.green],
              ['KMS', 0.21, themeColors.pink],
            ];
      drawText(
        ctx,
        api,
        missing ? 'K=1 retains KMS · approved passage omitted' : 'K=3 supplied pair-score lookup',
        960,
        295,
        35,
        themeColors.yellow,
      );
      rows.forEach(([v, score, col], i) => {
        drawPill(ctx, api, v, 710, 445 + i * 155, 900, col);
        if (resultComplete('scores') || missing)
          drawText(ctx, api, formatValue(score, 2), 1460, 457 + i * 155, 38, col);
      });
      if (missing) {
        drawRectangle(ctx, api, 260, 660, 1390, 140, themeColors.panel, themeColors.muted);
        drawText(ctx, api, 'Approved passage: not retrieved', 960, 745, 37, themeColors.muted);
      }
      drawNote(
        ctx,
        api,
        'No neural reranker executed · changing ordering cannot add a missing candidate',
      );
    } else if (currentBeat === 1) {
      drawText(ctx, api, 'Sequential 200 ms request worksheet', 960, 300, 36, themeColors.yellow);
      const start = 260,
        scale = 7;
      drawRectangle(ctx, api, start, 525, 1400, 110, themeColors.panel);
      drawRectangle(ctx, api, start, 525, 10 * scale, 110, themeColors.blue);
      drawText(ctx, api, 'query 10 ms', 450, 445, 30, themeColors.blue);
      if (B('pairs'))
        for (let i = 0; i < 10; i++) {
          const shown = cueProgress('pairs') > i / 10;
          drawRectangle(
            ctx,
            api,
            start + 70 + i * 105,
            525,
            100,
            110,
            shown ? themeColors.cyan : themeColors.panel,
          );
        }
      if (resultComplete('pairs'))
        drawText(ctx, api, '10 × 15 = 150 ms', 960, 760, 37, themeColors.cyan);
      if (resultComplete('remain')) {
        drawRectangle(ctx, api, 1380, 525, 280, 110, themeColors.yellow);
        drawText(ctx, api, '40 ms for lookup + overhead', 960, 900, 35, themeColors.yellow);
      }
      if (resultComplete('large'))
        drawText(ctx, api, '2M sequential pairs: 8.33 hours', 960, 980, 30, themeColors.muted);
    } else {
      drawText(
        ctx,
        api,
        'A deadline is an explicit candidate-count constraint',
        960,
        330,
        35,
        themeColors.yellow,
      );
      drawText(
        ctx,
        api,
        'K = floor((deadline − query − ANN − overhead)/pair)',
        960,
        545,
        38,
        themeColors.cyan,
      );
      drawPill(
        ctx,
        api,
        'Insufficient Recall@K → improve retrieval / speed / budget',
        960,
        805,
        1600,
        themeColors.pink,
      );
      drawNote(
        ctx,
        api,
        'Benchmark the real concurrent path · supplied timings are not measured p95',
      );
    }
  });
}
export default {
  id: 'shortlist-budget',
  draw: drawShortlistBudget,
  cues: [
    'cl-shortlist-budget-scores',
    'cl-shortlist-budget-missing',
    'cl-shortlist-budget-large',
    'cl-shortlist-budget-pairs',
    'cl-shortlist-budget-remain',
    'cl-shortlist-budget-hold',
  ],
};
