import {
  drawRecommendationClamp,
  drawRecommendationEase,
  drawRecommendationText,
  drawRecommendationVector,
  recommendationFocusTargets,
  withRecommendationFocus,
} from '../defaults.mjs';
export function paintAnchorClipping(
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
    if (currentBeat < 2) {
      const q = P('anchor-change', 1, 0.25, 0.9),
        anchor = 1 - 0.2 * drawRecommendationEase(ctx, api, q),
        ps = [anchor, anchor * 0.5];
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        'same observed click rates',
        430,
        290,
        31,
        themeColors.yellow,
      );
      drawRecommendationVector(ctx, api, themeColors, [0.4, 0.2], 340, 400, {
        co: themeColors.yellow,
      });
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        'relative ratio fixed at 1 : 0.5',
        1370,
        290,
        30,
        themeColors.cyan,
      );
      drawRecommendationVector(ctx, api, themeColors, ps, 1280, 400, {
        label: 'absolute examination p',
        co: themeColors.cyan,
      });
      const level = 0.4 / anchor;
      drawRecommendationVector(ctx, api, themeColors, [level, level], 1280, 700, {
        label: 'raw rate / absolute p',
        co: themeColors.green,
        unknown: currentBeat === 0,
      });
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        q === 1 ? 'anchor 0.8 → relevance 0.5' : 'anchor 1 → relevance 0.4',
        520,
        770,
        35,
        themeColors.green,
      );
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        'relative exposure alone leaves the absolute scale unidentified',
        960,
        990,
        31,
        themeColors.pink,
      );
    } else {
      const q = P('clip-result', 2, 0.25, 0.9);
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        'p = 0.02 · relevance = 0.5',
        960,
        300,
        34,
        themeColors.yellow,
      );
      drawRecommendationVector(ctx, api, themeColors, [50, 10], 260, 460, {
        size: 150,
        label: 'inverse p → clipped weight',
        co: themeColors.pink,
      });
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        'uncapped expectation',
        1350,
        400,
        31,
        themeColors.cyan,
      );
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        '50 × 0.02 × 0.5 = 0.5',
        1350,
        500,
        37,
        themeColors.cyan,
      );
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        'clipped expectation',
        1350,
        690,
        31,
        themeColors.pink,
      );
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        q === 1 ? '10 × 0.02 × 0.5 = 0.1' : '10 × 0.02 × 0.5 = ?',
        1350,
        790,
        37,
        themeColors.pink,
      );
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        'Capping the weight reduces the influence of a rare click',
        960,
        1000,
        31,
        themeColors.yellow,
      );
    }
  }
}
export function drawAnchorClipping(ctx, scene, state, api) {
  const { C } = api,
    b = state.beat ?? 0,
    p = api.clamp(state.beatP ?? 0),
    id = scene.id;
  const targets = recommendationFocusTargets(id);
  withRecommendationFocus(ctx, api, targets, () =>
    paintAnchorClipping(ctx, scene, state, api, C, b, p, id),
  );
}
export default {
  id: 'anchor-clipping',
  draw: drawAnchorClipping,
  cues: [
    'anchor-clipping-b1',
    'anchor-clipping-b2',
    'anchor-change',
    'anchor-clipping-b3',
    'clip-result',
  ],
};
