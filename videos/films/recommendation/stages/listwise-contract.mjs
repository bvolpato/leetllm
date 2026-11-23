import { listDistributionStep } from '../arithmetic.mjs';
import {
  drawRecommendationClamp,
  drawRecommendationDocument,
  drawRecommendationEase,
  drawRecommendationFade,
  drawRecommendationMath,
  drawRecommendationRect,
  drawRecommendationStraight,
  drawRecommendationText,
  drawRecommendationVector,
  recommendationFocusTargets,
  withRecommendationFocus,
} from '../defaults.mjs';
export function paintListwiseContract(
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
  {
    const m = listDistributionStep(),
      mass = P('list-masses', 1, 0.08, 0.35),
      g = P('list-gradient', 1, 0.35, 0.6),
      step = P('list-step', 1, 0.6, 0.98);
    drawRecommendationText(
      ctx,
      api,
      themeColors,
      'one declared training list',
      960,
      285,
      32,
      themeColors.yellow,
    );
    ['api-guide', 'blog-post'].forEach((d, i) =>
      drawRecommendationDocument(ctx, api, themeColors, d, 240 + i * 900, 340, {
        w: 500,
      }),
    );
    if (currentBeat === 0) {
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        'declared target distribution',
        500,
        520,
        29,
        themeColors.yellow,
      );
      drawRecommendationVector(ctx, api, themeColors, m.target, 380, 580, {
        co: themeColors.yellow,
      });
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        'model scores on the same list',
        1400,
        520,
        29,
        themeColors.cyan,
      );
      drawRecommendationVector(ctx, api, themeColors, [0, 0], 1280, 580, {
        co: themeColors.cyan,
      });
      drawRecommendationMath(
        ctx,
        api,
        themeColors,
        String.raw`p_i=\frac{e^{s_i}}{\sum_j e^{s_j}}`,
        960,
        860,
        44,
        themeColors.cyan,
      );
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        'the shared denominator couples every candidate',
        960,
        1010,
        31,
        themeColors.muted,
      );
    } else if (currentBeat === 1) {
      const width = 550,
        xs = [220, 1140],
        y = 530;
      [
        [0.7, 0.3],
        [0.5, 0.5],
      ].forEach((values, j) => {
        drawRecommendationText(
          ctx,
          api,
          themeColors,
          j ? 'predicted masses · exp weights [1, 1]' : 'supplied target masses',
          xs[j] + width / 2,
          475,
          28,
          j ? themeColors.cyan : themeColors.yellow,
        );
        let x = xs[j];
        values.forEach((v, i) => {
          const w = width * v;
          drawRecommendationRect(
            ctx,
            api,
            themeColors,
            x,
            y,
            w,
            100,
            i ? themeColors.pink : themeColors.cyan,
            i ? themeColors.pink + '35' : themeColors.cyan + '35',
          );
          drawRecommendationText(
            ctx,
            api,
            themeColors,
            j && mass !== 1 ? '?' : String(v),
            x + w / 2,
            y + 64,
            34,
            i ? themeColors.pink : themeColors.cyan,
          );
          x += w;
        });
      });
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        mass === 1 ? 'normalizer 2 · loss log 2' : 'normalizer and loss ?',
        960,
        735,
        32,
        themeColors.yellow,
      );
      drawRecommendationVector(ctx, api, themeColors, m.gradient, 300, 865, {
        label: 'predicted − target',
        co: themeColors.pink,
        unknown: g !== 1,
      });
      drawRecommendationVector(ctx, api, themeColors, m.next, 1240, 865, {
        label: 'scores − 0.5 × gradient',
        co: themeColors.green,
        unknown: step !== 1,
      });
      drawRecommendationStraight(
        ctx,
        api,
        themeColors,
        680,
        910,
        1130,
        910,
        step,
        themeColors.green,
      );
    } else {
      const q = P('list-universe', 2, 0.08, 0.75);
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        'sampled list changes the compared universe',
        960,
        510,
        31,
        themeColors.yellow,
      );
      drawRecommendationDocument(
        ctx,
        api,
        themeColors,
        'retry-runbook',
        720 + 420 * drawRecommendationEase(ctx, api, q),
        620,
        {
          w: 500,
          subtitle: 'new sampled candidate',
        },
      );
      drawRecommendationMath(
        ctx,
        api,
        themeColors,
        String.raw`\frac{e^{s_{guide}}}{e^{s_{guide}}+e^{s_{blog}}}`,
        530,
        845,
        36,
        themeColors.cyan,
      );
      drawRecommendationFade(ctx, api, q, () =>
        drawRecommendationMath(
          ctx,
          api,
          themeColors,
          String.raw`\frac{e^{s_{guide}}}{e^{s_{guide}}+e^{s_{blog}}+e^{s_{runbook}}}`,
          1420,
          845,
          30,
          themeColors.green,
        ),
      );
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        'top-one ListNet and permutation-likelihood ListMLE are distinct losses',
        960,
        1010,
        28,
        themeColors.muted,
      );
    }
  }
}
export function drawListwiseContract(ctx, scene, state, api) {
  const { C } = api,
    b = state.beat ?? 0,
    p = api.clamp(state.beatP ?? 0),
    id = scene.id;
  const targets = recommendationFocusTargets(id);
  withRecommendationFocus(ctx, api, targets, () =>
    paintListwiseContract(ctx, scene, state, api, C, b, p, id),
  );
}
export default {
  id: 'listwise-contract',
  draw: drawListwiseContract,
  cues: [
    'listwise-contract-b1',
    'listwise-contract-b2',
    'list-masses',
    'list-gradient',
    'list-step',
    'listwise-contract-b3',
    'list-universe',
  ],
};
