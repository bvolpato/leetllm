import { rankScore } from '../arithmetic.mjs';
import { ranked, retrievalOrder } from '../construction.mjs';
import { rerankActors } from '../model.mjs';
import {
  drawRecommendationClamp,
  drawRecommendationColor,
  drawRecommendationDocument,
  drawRecommendationEase,
  drawRecommendationMath,
  drawRecommendationRect,
  drawRecommendationStraight,
  drawRecommendationText,
  recommendationFocusTargets,
  withRecommendationFocus,
} from '../defaults.mjs';
export function paintReranking(
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
    if (currentBeat === 2) {
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        'retrieval order',
        330,
        285,
        31,
        themeColors.cyan,
      );
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        'score order',
        1500,
        285,
        31,
        themeColors.green,
      );
      rerankActors(1, beatProgress).forEach((d) =>
        drawRecommendationDocument(ctx, api, themeColors, d, d.cx - 180, d.cy - 43, {
          w: 360,
          h: 86,
          subtitle: 'score ' + rankScore(d).toFixed(3),
        }),
      );
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        'same five identities · fixed computed scores',
        960,
        990,
        31,
        themeColors.yellow,
      );
      return;
    }
    const assembled = P('rank-guide', 1, 0.25, 0.75),
      blog = R('rank-blog', 1, 0.75, 0.98),
      sorted = currentBeat >= 2 ? drawRecommendationEase(ctx, api, S(2, 0.03, 0.65)) : 0;
    drawRecommendationText(
      ctx,
      api,
      themeColors,
      'twice query fit',
      680,
      280,
      29,
      themeColors.cyan,
    );
    drawRecommendationText(
      ctx,
      api,
      themeColors,
      '+ 0.6 × reliability',
      1130,
      280,
      29,
      themeColors.yellow,
    );
    drawRecommendationText(ctx, api, themeColors, 'score', 1580, 280, 29, themeColors.green);
    retrievalOrder.forEach((d, i) => {
      const rank = ranked.findIndex((x) => x.id === d.id),
        move = sorted;
      const y = 330 + (i + (rank - i) * move) * 114;
      drawRecommendationDocument(ctx, api, themeColors, d, 150, y, {
        w: 370,
      });
      const q = drawRecommendationClamp(ctx, api, assembled * 5 - i * 0.5);
      const first = 2 * d.queryFit,
        second = 0.6 * d.reliability;
      drawRecommendationRect(ctx, api, themeColors, 600, y + 5, 240, 64, themeColors.cyan);
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        first.toFixed(3),
        720,
        y + 47,
        28,
        themeColors.cyan,
      );
      drawRecommendationRect(ctx, api, themeColors, 1010, y + 5, 240, 64, themeColors.yellow);
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        second.toFixed(3),
        1130,
        y + 47,
        28,
        themeColors.yellow,
      );
      if (q > 0) {
        drawRecommendationStraight(
          ctx,
          api,
          themeColors,
          865,
          y + 37,
          940,
          y + 37,
          q,
          themeColors.cyan,
        );
        drawRecommendationStraight(
          ctx,
          api,
          themeColors,
          1275,
          y + 37,
          1395,
          y + 37,
          q,
          themeColors.yellow,
        );
      }
      drawRecommendationRect(
        ctx,
        api,
        themeColors,
        1445,
        y + 5,
        285,
        64,
        drawRecommendationColor(ctx, api, themeColors, d),
      );
      const known = (d.id === 'blog-post' ? blog : assembled === 1) || currentBeat >= 2;
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        known ? rankScore(d).toFixed(3) : '?',
        1585,
        y + 47,
        31,
        drawRecommendationColor(ctx, api, themeColors, d),
      );
    });
    drawRecommendationMath(
      ctx,
      api,
      themeColors,
      String.raw`s(d)=2q(d)+0.6r(d)`,
      960,
      990,
      39,
      themeColors.yellow,
    );
  }
}
export function drawReranking(ctx, scene, state, api) {
  const { C } = api,
    b = state.beat ?? 0,
    p = api.clamp(state.beatP ?? 0),
    id = scene.id;
  const targets = recommendationFocusTargets(id);
  withRecommendationFocus(ctx, api, targets, () =>
    paintReranking(ctx, scene, state, api, C, b, p, id),
  );
}
export default {
  id: 'reranking',
  draw: drawReranking,
  cues: [
    'reranking-beat-1-focus-1',
    'reranking-beat-2-focus-1',
    'rank-weights',
    'rank-guide',
    'rank-blog',
    'reranking-beat-3-focus-1',
    'reranking-beat-3-focus-2',
  ],
};
