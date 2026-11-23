import { eligible, retrievalOrder } from '../construction.mjs';
import {
  drawRecommendationClamp,
  drawRecommendationColor,
  drawRecommendationDocument,
  drawRecommendationFade,
  drawRecommendationOutline,
  drawRecommendationText,
  recommendationFocusTargets,
  withRecommendationFocus,
} from '../defaults.mjs';
export function paintRetrievalRecall(
  ctx,
  scene,
  state,
  api,
  themeColors,
  currentBeat,
  beatProgress,
  stageId,
) {
  const S = (beat, a = 0.08, z = 0.85) =>
    currentBeat < beat ? 0 : currentBeat > beat ? 1 : api.phase(beatProgress, a, z);
  const P = (cue, beat = 0, a = 0.08, z = 0.85) => {
    const c = state.cues?.[cue];
    return c
      ? c.phase === 'before'
        ? 0
        : c.phase === 'after'
          ? 1
          : drawRecommendationClamp(ctx, api, c.progress)
      : S(beat, a, z);
  };
  const R = (cue, beat = 0, a = 0.08, z = 0.85) => P(cue, beat, a, z) === 1;
  {
    const five = P('recall-five', 2, 0.08, 0.5),
      one = R('recall-one', 1, 0.55, 0.95),
      k = 3 + Math.floor(2 * five),
      checked = P('retrieval-recall-beat-2-focus-1', 1, 0.4, 0.65) > 0;
    drawRecommendationText(
      ctx,
      api,
      themeColors,
      'Retrieval order',
      400,
      285,
      31,
      themeColors.cyan,
    );
    drawRecommendationText(
      ctx,
      api,
      themeColors,
      'Fixed useful judgment set',
      1420,
      285,
      31,
      themeColors.yellow,
    );
    retrievalOrder.forEach((d, i) => {
      const selected = i < k;
      drawRecommendationDocument(ctx, api, themeColors, d, 170, 340 + i * 110, {
        w: 540,
        score: d.retrieval.toFixed(2),
        muted: !selected,
      });
      if (i === 3 || i === 4) {
        drawRecommendationFade(ctx, api, api.clamp(five * 2 - (i - 3)), () =>
          drawRecommendationOutline(
            ctx,
            api,
            themeColors,
            158,
            330 + i * 110,
            565,
            90,
            themeColors.green,
          ),
        );
      }
    });
    const useful = eligible.filter((d) => d.relevance > 0);
    useful.forEach((d, i) => {
      const found = checked && retrievalOrder.indexOf(d) < k;
      drawRecommendationDocument(ctx, api, themeColors, d, 1210, 370 + i * 150, {
        w: 460,
      });
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        !checked ? 'judged useful' : found ? 'retrieved' : 'missing',
        1440,
        478 + i * 150,
        29,
        !checked ? themeColors.muted : found ? themeColors.green : themeColors.red,
      );
      if (found) {
        const left = retrievalOrder.findIndex((x) => x.id === d.id);
        api.line(
          ctx,
          740,
          376 + left * 110,
          930,
          376 + left * 110,
          drawRecommendationColor(ctx, api, themeColors, d),
          2,
        );
        api.line(
          ctx,
          930,
          376 + left * 110,
          930,
          406 + i * 150,
          drawRecommendationColor(ctx, api, themeColors, d),
          2,
        );
        api.arrow(
          ctx,
          930,
          406 + i * 150,
          1185,
          406 + i * 150,
          drawRecommendationColor(ctx, api, themeColors, d),
          2,
        );
      }
    });
    drawRecommendationText(ctx, api, themeColors, `k = ${k}`, 450, 960, 36, themeColors.yellow);
    drawRecommendationText(
      ctx,
      api,
      themeColors,
      one
        ? useful.filter((d) => retrievalOrder.indexOf(d) < k).length + ' / ' + useful.length
        : '?',
      1440,
      960,
      44,
      one ? themeColors.green : themeColors.yellow,
    );
  }
}
export function drawRetrievalRecall(ctx, scene, state, api) {
  const { C } = api,
    b = state.beat ?? 0,
    p = api.clamp(state.beatP ?? 0),
    id = scene.id;
  const targets = recommendationFocusTargets(id);
  withRecommendationFocus(ctx, api, targets, () =>
    paintRetrievalRecall(ctx, scene, state, api, C, b, p, id),
  );
}
export default {
  id: 'retrieval-recall',
  draw: drawRetrievalRecall,
  cues: [
    'retrieval-recall-beat-1-focus-1',
    'retrieval-recall-beat-2-focus-1',
    'retrieval-recall-beat-2-focus-2',
    'recall-one',
    'retrieval-recall-beat-3-focus-1',
    'recall-five',
  ],
};
