import { reciprocalPrecision } from '../arithmetic.mjs';
import { ranked, retrievalOrder } from '../construction.mjs';
import {
  drawRecommendationClamp,
  drawRecommendationDocument,
  drawRecommendationFade,
  drawRecommendationMath,
  drawRecommendationText,
  recommendationFocusTargets,
  withRecommendationFocus,
} from '../defaults.mjs';
export function paintReciprocalPrecision(
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
    const a = reciprocalPrecision(retrievalOrder.map((d) => d.relevance)),
      rr = R('rr-result', 0, 0.55, 0.95),
      terms = P('ap-terms', 1, 0.1, 0.6),
      result = R('ap-result', 1, 0.6, 0.95),
      cut = R('ap-denominator', 2, 0.3, 0.8);
    const orders = [retrievalOrder, ranked];
    orders.forEach((rows, j) => {
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        j ? 'ideal order' : 'retrieval order',
        175,
        300 + j * 260,
        29,
        j ? themeColors.green : themeColors.cyan,
        'left',
      );
      rows.forEach((d, i) =>
        drawRecommendationDocument(ctx, api, themeColors, d, 170 + i * 325, 335 + j * 260, {
          w: 290,
          grade: d.relevance,
        }),
      );
    });
    if (currentBeat === 0) {
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        rr ? 'RR = 1 in both lists' : 'first grade-3 target → ?',
        960,
        930,
        44,
        themeColors.yellow,
      );
    }
    if (currentBeat === 1) {
      a.terms.forEach((t, i) => {
        const q = drawRecommendationClamp(ctx, api, terms * 3 - i);
        drawRecommendationFade(ctx, api, q, () =>
          drawRecommendationMath(
            ctx,
            api,
            themeColors,
            String.raw`\frac{${t.relevantSeen}}{${t.rank}}`,
            340 + (t.rank - 1) * 325,
            470,
            37,
            themeColors.cyan,
          ),
        );
      });
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        result
          ? `AP = (1 + 2/4 + 3/5) / 3 = ${a.ap.toFixed(3)}`
          : 'Add precision at each relevant prefix',
        960,
        925,
        36,
        themeColors.cyan,
      );
    }
    if (currentBeat === 2) {
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        'R = 2 · k = 1 · first result relevant',
        960,
        850,
        32,
        themeColors.yellow,
      );
      drawRecommendationMath(
        ctx,
        api,
        themeColors,
        cut
          ? String.raw`AP_{capped}=1\qquad AP_{fullR}=\frac12`
          : String.raw`\frac{1}{\min(R,k)}\qquad\frac{1}{R}`,
        960,
        970,
        43,
        themeColors.cyan,
      );
    }
  }
}
export function drawReciprocalPrecision(ctx, scene, state, api) {
  const { C } = api,
    b = state.beat ?? 0,
    p = api.clamp(state.beatP ?? 0),
    id = scene.id;
  const targets = recommendationFocusTargets(id);
  withRecommendationFocus(ctx, api, targets, () =>
    paintReciprocalPrecision(ctx, scene, state, api, C, b, p, id),
  );
}
export default {
  id: 'reciprocal-precision',
  draw: drawReciprocalPrecision,
  cues: [
    'reciprocal-precision-b1',
    'rr-result',
    'reciprocal-precision-b2',
    'ap-terms',
    'ap-result',
    'reciprocal-precision-b3',
    'ap-denominator',
  ],
};
