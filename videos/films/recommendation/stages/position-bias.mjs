import { clickExamples } from '../fixtures.mjs';
import {
  drawRecommendationClamp,
  drawRecommendationRect,
  drawRecommendationText,
  recommendationFocusTargets,
  withRecommendationFocus,
} from '../defaults.mjs';
export function paintPositionBias(
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
      'Each square is one impression opportunity',
      960,
      285,
      30,
      themeColors.muted,
    );
    clickExamples.forEach((row, i) => {
      const top = 340 + i * 290,
        exposed = i ? 50 : 100,
        known = currentBeat > i;
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        `position ${i + 1}`,
        200,
        top + 100,
        30,
        i ? themeColors.pink : themeColors.cyan,
      );
      for (let n = 0; n < 100; n++) {
        const x = 420 + (n % 20) * 33,
          y = top + Math.floor(n / 20) * 33;
        const seen = known && n < exposed,
          clicked = known && n < row.clicks;
        drawRecommendationRect(
          ctx,
          api,
          themeColors,
          x,
          y,
          25,
          25,
          clicked ? themeColors.green : seen ? themeColors.cyan : themeColors.muted,
          clicked ? themeColors.green : seen ? themeColors.cyan + '40' : themeColors.panel,
        );
      }
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        known ? `${row.clicks} clicks / 100 impressions` : '100 opportunities · clicks unknown',
        1350,
        top + 50,
        29,
        known ? themeColors.ink : themeColors.muted,
      );
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        known ? `examined ${exposed} · assumed p = ${row.propensity}` : 'examination unknown',
        1350,
        top + 110,
        27,
        themeColors.muted,
      );
      const result = R(i ? 'position-second' : 'position-first', i + 1, 0.55, 0.95);
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        result
          ? `${(row.clicks / 100).toFixed(1)} / ${row.propensity} = 0.4`
          : 'corrected relevance ?',
        1350,
        top + 190,
        35,
        result ? themeColors.green : themeColors.yellow,
      );
    });
    drawRecommendationText(
      ctx,
      api,
      themeColors,
      'No accidental clicks · examination independent of relevance given context',
      960,
      1000,
      28,
      themeColors.yellow,
    );
  }
}
export function drawPositionBias(ctx, scene, state, api) {
  const { C } = api,
    b = state.beat ?? 0,
    p = api.clamp(state.beatP ?? 0),
    id = scene.id;
  const targets = recommendationFocusTargets(id);
  withRecommendationFocus(ctx, api, targets, () =>
    paintPositionBias(ctx, scene, state, api, C, b, p, id),
  );
}
export default {
  id: 'position-bias',
  draw: drawPositionBias,
  cues: [
    'position-bias-beat-1-focus-1',
    'position-bias-beat-2-focus-1',
    'position-bias-beat-2-focus-2',
    'position-first',
    'position-bias-beat-3-focus-1',
    'position-bias-beat-3-focus-2',
    'position-second',
  ],
};
