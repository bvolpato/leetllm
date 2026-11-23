import { attentionScores, sentenceWords } from '../fixtures.mjs';
import { complete, count, event } from '../construction.mjs';
import { attentionSlicePrediction } from '../model.mjs';
import {
  caption,
  drawScoreMatrix,
  equation,
  numberGrid,
  target,
  text,
  vertical,
} from '../defaults.mjs';
export function drawTakeaway(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  {
    const prediction = attentionSlicePrediction(),
      all = attentionScores[0].flatMap((row, r) =>
        row.map((value, c) => ({
          row: r,
          column: c,
          value,
        })),
      ),
      reveal = event(state, 1, 'reveal-score-slice');
    const slide = event(state, 0, 'carry-score-grid');
    text(ctx, api, 'Sentence 0', 525, 280, 34, themeColors.blue, 'center');
    drawScoreMatrix(
      ctx,
      api,
      270,
      450,
      170,
      100,
      all,
      'takeaway-matrix',
    );
    if (reveal > 0) {
      const rightEdge = 270 + 3 * 170 - 8;
      api.line(ctx, 270, 545, 270 + (rightEdge - 270) * reveal, 545, themeColors.cyan, 4);
      if (complete(reveal)) api.arrow(ctx, rightEdge + 12, 598, 1060, 598, themeColors.cyan, 3);
    }
    target(ctx, api, 'takeaway-prompt', () => {
      if (!complete(slide)) return;
      equation(
        ctx,
        api,
        String.raw`\mathrm{scores}[0,1\!:\!2,:]`,
        1370,
        390,
        42,
        themeColors.yellow,
      );
      if (currentBeat === 0) {
        text(ctx, api, 'Which axes reach the caller?', 1370, 530, 31, themeColors.yellow, 'center');
        text(
          ctx,
          api,
          'query = migrate     key = south',
          1370,
          630,
          28,
          themeColors.yellow,
          'center',
        );
      }
    });
    target(ctx, api, 'takeaway-row', () => {
      if (currentBeat === 1) {
        sentenceWords[0].forEach((word, c) =>
          text(ctx, api, word, 1130 + (c + 0.5) * 170, 535, 25, themeColors.pink, 'center'),
        );
        numberGrid(
          ctx,
          api,
          [prediction.row.map((value, c) => (c < count(3, reveal) ? value : ''))],
          1130,
          575,
          510,
          110,
          themeColors.cyan,
          'retained-query-row',
        );
        vertical(ctx, api, 1070, 575, 110, '1 query', themeColors.cyan);
        equation(
          ctx,
          api,
          complete(reveal)
            ? String.raw`\operatorname{shape}=(1,3)`
            : String.raw`\operatorname{shape}=?`,
          1370,
          820,
          44,
          themeColors.cyan,
        );
        text(
          ctx,
          api,
          complete(reveal) ? 'migrate → south = 214' : 'Read across the named key columns',
          1370,
          925,
          28,
          themeColors.yellow,
          'center',
        );
      }
    });
    caption(
      ctx,
      api,
      complete(reveal)
        ? 'One sentence, one query row, three key columns'
        : 'scores[batch, query, key]',
    );
  }
}
export default {
  id: 'takeaway',
  draw: drawTakeaway,
  cues: ['carry-score-grid', 'predict-score-slice', 'reveal-score-slice'],
};
