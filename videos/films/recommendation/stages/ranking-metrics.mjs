import { dcg } from '../arithmetic.mjs';
import {
  idealGrades,
  localTopThreeNdcg,
  ndcg,
  retrievalOrder,
  systemTopThreeNdcg,
} from '../construction.mjs';
import {
  drawRecommendationClamp,
  drawRecommendationColor,
  drawRecommendationDocument,
  drawRecommendationEase,
  drawRecommendationMath,
  drawRecommendationRect,
  drawRecommendationText,
  recommendationFocusTargets,
  withRecommendationFocus,
} from '../defaults.mjs';
export function paintRankingMetrics(
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
    const grades = retrievalOrder.map((d) => d.relevance),
      terms = grades.map((g, i) => (2 ** g - 1) / Math.log2(i + 2)),
      q = P('metric-dcg', 1, 0.08, 0.75),
      idcg = R('metric-idcg', 1, 0.75, 0.98),
      ratio = R('metric-ratio', 2, 0.02, 0.25),
      tight = P('metric-cut-three', 2, 0.28, 0.41) > 0,
      perfect = P('metric-perfect', 2, 0.51, 0.65) > 0,
      local = R('metric-local', 2, 0.35, 0.95);
    retrievalOrder.forEach((d, i) => {
      const x = 170 + i * 322;
      drawRecommendationDocument(ctx, api, themeColors, d, x, 330, {
        w: 290,
        grade: d.relevance,
        muted: tight && i >= 3,
      });
      if (tight) return;
      if (currentBeat > 0) {
        drawRecommendationMath(
          ctx,
          api,
          themeColors,
          String.raw`\frac{${2 ** d.relevance - 1}}{\log_2(${i + 2})}`,
          x + 145,
          495,
          36,
          drawRecommendationColor(ctx, api, themeColors, d),
        );
        const r = drawRecommendationClamp(ctx, api, q * 5 - i);
        if (r > 0 && r < 1) {
          const endX = 960,
            endY = 640,
            fromX = x + 145,
            fromY = 555;
          const move = drawRecommendationEase(ctx, api, r);
          drawRecommendationText(
            ctx,
            api,
            themeColors,
            terms[i].toFixed(3),
            api.lerp(fromX, endX, move),
            api.lerp(fromY, endY, move),
            28,
            drawRecommendationColor(ctx, api, themeColors, d),
          );
        }
      }
    });
    if (currentBeat === 0)
      drawRecommendationMath(
        ctx,
        api,
        themeColors,
        String.raw`DCG@k=\sum_i\frac{2^{rel_i}-1}{\log_2(i+1)}`,
        960,
        750,
        43,
      );
    if (tight) {
      api.line(ctx, 170, 450, 1104, 450, themeColors.cyan, 4);
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        'Three retrieved',
        635,
        520,
        38,
        themeColors.cyan,
      );
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        'Outside the shortlist',
        1445,
        520,
        36,
        themeColors.muted,
      );
    } else if (currentBeat > 0) {
      const arrived = Math.floor(q * 5 + 1e-8),
        sum = terms.slice(0, arrived).reduce((a, v) => a + v, 0);
      drawRecommendationRect(ctx, api, themeColors, 675, 680, 570, 112, themeColors.blue);
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        q === 1 ? `DCG = ${sum.toFixed(3)}` : `arrived subtotal ${sum.toFixed(3)}`,
        960,
        753,
        39,
        themeColors.blue,
      );
    }
    if (idcg && !tight) {
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        `ideal ${dcg(idealGrades).toFixed(3)}`,
        520,
        870,
        36,
        themeColors.yellow,
      );
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        ratio ? `NDCG ${ndcg(grades).toFixed(3)}` : 'DCG / ideal',
        1380,
        870,
        36,
        themeColors.green,
      );
    }
    if (perfect) {
      drawRecommendationRect(ctx, api, themeColors, 270, 700, 620, 100, themeColors.cyan);
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        `Reranker NDCG@3   ${localTopThreeNdcg.toFixed(3)}`,
        580,
        762,
        31,
        themeColors.cyan,
      );
    }
    if (local) {
      drawRecommendationRect(ctx, api, themeColors, 1010, 700, 690, 100, themeColors.pink);
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        `System NDCG@3   ${systemTopThreeNdcg.toFixed(3)}`,
        1355,
        762,
        31,
        themeColors.pink,
      );
    }
  }
}
export function drawRankingMetrics(ctx, scene, state, api) {
  const { C } = api,
    b = state.beat ?? 0,
    p = api.clamp(state.beatP ?? 0),
    id = scene.id;
  const targets = recommendationFocusTargets(id);
  withRecommendationFocus(ctx, api, targets, () =>
    paintRankingMetrics(ctx, scene, state, api, C, b, p, id),
  );
}
export default {
  id: 'ranking-metrics',
  draw: drawRankingMetrics,
  cues: [
    'ranking-metrics-beat-1-focus-1',
    'ranking-metrics-beat-2-focus-1',
    'ranking-metrics-beat-2-focus-2',
    'metric-dcg',
    'metric-idcg',
    'ranking-metrics-beat-3-focus-1',
    'ranking-metrics-beat-3-focus-2',
    'metric-ratio',
    'metric-cut-three',
    'metric-perfect',
    'metric-local',
  ],
};
