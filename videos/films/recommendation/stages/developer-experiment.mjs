import {
  drawRecommendationClamp,
  drawRecommendationRect,
  drawRecommendationText,
  recommendationFocusTargets,
  withRecommendationFocus,
} from '../defaults.mjs';
export function paintDeveloperExperiment(
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
    drawRecommendationText(
      ctx,
      api,
      themeColors,
      'assign once per developer',
      960,
      285,
      31,
      themeColors.yellow,
    );
    const counts = [1, 9];
    counts.forEach((n, i) => {
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        `developer ${i ? 'B' : 'A'}`,
        260,
        395 + i * 260,
        32,
        i ? themeColors.blue : themeColors.cyan,
      );
      for (let j = 0; j < n; j++) {
        const x = 600 + j * 115,
          y = 350 + i * 260;
        drawRecommendationRect(
          ctx,
          api,
          themeColors,
          x,
          y,
          100,
          88,
          i ? themeColors.blue : themeColors.cyan,
        );
        drawRecommendationText(
          ctx,
          api,
          themeColors,
          j === 0 ? '✓' : '×',
          x + 50,
          y + 57,
          35,
          j === 0 ? themeColors.green : themeColors.muted,
        );
      }
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        `1 / ${n}`,
        1520,
        490 + i * 260,
        35,
        i ? themeColors.blue : themeColors.cyan,
      );
    });
    const q = R('developer-ratios', 1, 0.3, 0.9);
    if (currentBeat > 0) {
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        q ? 'equal-developer mean = 5/9' : 'equal-developer mean = ?',
        600,
        940,
        36,
        themeColors.green,
      );
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        q ? 'pooled sessions = 2/10' : 'pooled sessions = ?',
        1430,
        940,
        36,
        themeColors.pink,
      );
    }
    if (currentBeat === 2)
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        'Example plan: compare once after 14 days and 5,000 developers per group',
        960,
        1030,
        27,
        themeColors.yellow,
      );
  }
}
export function drawDeveloperExperiment(ctx, scene, state, api) {
  const { C } = api,
    b = state.beat ?? 0,
    p = api.clamp(state.beatP ?? 0),
    id = scene.id;
  const targets = recommendationFocusTargets(id);
  withRecommendationFocus(ctx, api, targets, () =>
    paintDeveloperExperiment(ctx, scene, state, api, C, b, p, id),
  );
}
export default {
  id: 'developer-experiment',
  draw: drawDeveloperExperiment,
  cues: [
    'developer-experiment-b1',
    'developer-experiment-b2',
    'developer-ratios',
    'developer-experiment-b3',
  ],
};
