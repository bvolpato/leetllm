import {
  drawRecommendationClamp,
  drawRecommendationDocument,
  drawRecommendationEase,
  drawRecommendationText,
  recommendationFocusTargets,
  withRecommendationFocus,
} from '../defaults.mjs';
export function paintGeneratedOrder(
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
    const reject = R('permutation-reject', 1, 0.1, 0.4),
      quality = R('permutation-quality', 1, 0.55, 0.95);
    drawRecommendationText(
      ctx,
      api,
      themeColors,
      'fixed eligible candidate IDs',
      450,
      285,
      30,
      themeColors.cyan,
    );
    ['api-guide', 'retry-runbook', 'sdk-example'].forEach((d, i) =>
      drawRecommendationDocument(ctx, api, themeColors, d, 190, 350 + i * 145, {
        w: 480,
      }),
    );
    drawRecommendationText(
      ctx,
      api,
      themeColors,
      'proposed permutation',
      1430,
      285,
      30,
      themeColors.yellow,
    );
    ['retry-runbook', 'api-guide'].forEach((d, i) =>
      drawRecommendationDocument(ctx, api, themeColors, d, 1170, 350 + i * 145, {
        w: 480,
      }),
    );
    if (currentBeat === 0 || currentBeat === 2)
      drawRecommendationDocument(ctx, api, themeColors, 'sdk-example', 1170, 640, {
        w: 480,
      });
    else {
      const q = P('permutation-reject', 1, 0.1, 0.4);
      if (q < 1)
        drawRecommendationDocument(
          ctx,
          api,
          themeColors,
          'private-draft',
          1170,
          640 + 200 * drawRecommendationEase(ctx, api, drawRecommendationClamp(ctx, api, q / 0.5)),
          {
            w: 480,
            subtitle: 'outside candidate ID set',
          },
        );
      if (q > 0.5)
        drawRecommendationDocument(
          ctx,
          api,
          themeColors,
          'sdk-example',
          1390 -
            220 *
              drawRecommendationEase(ctx, api, drawRecommendationClamp(ctx, api, (q - 0.5) / 0.5)),
          640,
          {
            w: 480,
          },
        );
      if (q === 1)
        drawRecommendationText(
          ctx,
          api,
          themeColors,
          'private / repeated ID → rejected',
          430,
          825,
          29,
          themeColors.red,
        );
    }
    if (currentBeat === 0) {
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        'untrusted snippet text',
        960,
        940,
        33,
        themeColors.pink,
      );
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        'access check remains outside the model',
        960,
        1000,
        29,
        themeColors.red,
      );
    }
    if (currentBeat > 0) {
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        reject ? 'unique candidate IDs: pass' : 'unique candidate IDs: ?',
        960,
        850,
        32,
        themeColors.green,
      );
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        quality ? 'structural pass · NDCG 0.858' : 'ranking quality: ?',
        960,
        930,
        37,
        quality ? themeColors.pink : themeColors.muted,
      );
      if (currentBeat === 2)
        drawRecommendationText(
          ctx,
          api,
          themeColors,
          'timeout / invalid / underfilled → declared fallback',
          960,
          1000,
          28,
          themeColors.yellow,
        );
    }
  }
}
export function drawGeneratedOrder(ctx, scene, state, api) {
  const { C } = api,
    b = state.beat ?? 0,
    p = api.clamp(state.beatP ?? 0),
    id = scene.id;
  const targets = recommendationFocusTargets(id);
  withRecommendationFocus(ctx, api, targets, () =>
    paintGeneratedOrder(ctx, scene, state, api, C, b, p, id),
  );
}
export default {
  id: 'generated-order',
  draw: drawGeneratedOrder,
  cues: [
    'generated-order-b1',
    'generated-order-b2',
    'permutation-reject',
    'permutation-quality',
    'generated-order-b3',
  ],
};
