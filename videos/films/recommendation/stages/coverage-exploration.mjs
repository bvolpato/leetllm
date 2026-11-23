import {
  drawRecommendationClamp,
  drawRecommendationDocument,
  drawRecommendationText,
  drawRecommendationVector,
  recommendationFocusTargets,
  withRecommendationFocus,
} from '../defaults.mjs';
export function paintCoverageExploration(
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
    if (currentBeat === 0) {
      const q = P('support-zero', 0, 0.1, 0.7);
      drawRecommendationDocument(ctx, api, themeColors, 'api-guide', 190, 360, {
        w: 470,
      });
      drawRecommendationDocument(ctx, api, themeColors, 'retry-runbook', 190, 580, {
        w: 470,
      });
      drawRecommendationDocument(ctx, api, themeColors, 'private-draft', 190, 800, {
        w: 470,
      });
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        'observed selection indicator',
        1110,
        300,
        28,
        themeColors.yellow,
      );
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        'position examination',
        1610,
        300,
        29,
        themeColors.cyan,
      );
      drawRecommendationVector(ctx, api, themeColors, [1], 1050, 360, {
        size: 90,
        co: themeColors.cyan,
      });
      drawRecommendationVector(ctx, api, themeColors, [0], 1050, 580, {
        size: 90,
        co: themeColors.muted,
      });
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        'p exam = 1 · assumed',
        1590,
        415,
        27,
        themeColors.cyan,
      );
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        q === 1 ? 'no assigned position' : '?',
        1590,
        635,
        28,
        themeColors.red,
      );
      api.line(ctx, 860, 760, 860, 925, themeColors.red, 4);
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        'authorization blocks exploration',
        1320,
        860,
        31,
        themeColors.red,
      );
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        'target-action selection probability is a separate logging-policy quantity',
        960,
        1010,
        28,
        themeColors.yellow,
      );
    } else {
      const q = P('coverage-exploration-b2', 1, 0.1, 0.8),
        positions = api.swap(250, 430, 1220, 430, q, 100);
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        'safe randomized swap · same permitted population',
        960,
        290,
        31,
        themeColors.yellow,
      );
      drawRecommendationText(ctx, api, themeColors, 'position 1', 490, 700, 30, themeColors.cyan);
      drawRecommendationText(ctx, api, themeColors, 'position 2', 1460, 700, 30, themeColors.pink);
      drawRecommendationDocument(
        ctx,
        api,
        themeColors,
        'api-guide',
        positions[0].x,
        positions[0].y,
        {
          w: 470,
        },
      );
      drawRecommendationDocument(
        ctx,
        api,
        themeColors,
        'blog-post',
        positions[1].x,
        positions[1].y,
        {
          w: 470,
        },
      );
      drawRecommendationDocument(ctx, api, themeColors, 'private-draft', 250, 820, {
        w: 470,
      });
      api.line(ctx, 820, 765, 820, 920, themeColors.red, 4);
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        'remains outside exploration',
        1340,
        865,
        31,
        themeColors.red,
      );
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        'test presentation, trust and click noise · measure task completion',
        960,
        1010,
        28,
        themeColors.yellow,
      );
    }
  }
}
export function drawCoverageExploration(ctx, scene, state, api) {
  const { C } = api,
    b = state.beat ?? 0,
    p = api.clamp(state.beatP ?? 0),
    id = scene.id;
  const targets = recommendationFocusTargets(id);
  withRecommendationFocus(ctx, api, targets, () =>
    paintCoverageExploration(ctx, scene, state, api, C, b, p, id),
  );
}
export default {
  id: 'coverage-exploration',
  draw: drawCoverageExploration,
  cues: ['coverage-exploration-b1', 'support-zero', 'coverage-exploration-b2'],
};
