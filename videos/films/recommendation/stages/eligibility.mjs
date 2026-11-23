import { SHORT } from '../fixtures.mjs';
import { eligibilityStateFor } from '../model.mjs';
import {
  drawRecommendationFocus,
  drawRecommendationRect,
  drawRecommendationText,
  recommendationFocusTargets,
  withRecommendationFocus,
} from '../defaults.mjs';
export function paintEligibility(
  ctx,
  scene,
  state,
  api,
  themeColors,
  currentBeat,
  beatProgress,
  stageId,
) {
  const model = eligibilityStateFor(currentBeat, beatProgress, state.cues),
    focusPrivate =
      currentBeat === 2 ||
      (currentBeat === 0 && state.cues?.['eligibility-beat-1-focus-1']?.active);
  drawRecommendationText(
    ctx,
    api,
    themeColors,
    model.complete ? 'Eligible set' : 'Document pool',
    140,
    285,
    36,
    model.complete ? themeColors.green : themeColors.ink,
    'left',
  );
  drawRecommendationText(
    ctx,
    api,
    themeColors,
    'retrieval score',
    1162,
    285,
    29,
    themeColors.muted,
    'right',
  );
  api.line(ctx, 1240, 320, 1240, 910, themeColors.muted + '60', 2);
  const paintActors = () =>
    model.actors.forEach((item) => {
      const affirming = item.allowed && state.cues?.['eligibility-beat-1-focus-2']?.active,
        co = !item.statusKnown
          ? themeColors.muted
          : item.allowed
            ? affirming
              ? themeColors.green
              : themeColors.ink
            : item.permitted
              ? themeColors.yellow
              : themeColors.red;
      const paint = () => {
        drawRecommendationRect(
          ctx,
          api,
          themeColors,
          item.x,
          item.y,
          item.width,
          item.height,
          item.allowed && !affirming ? themeColors.muted + '70' : co,
        );
        drawRecommendationText(
          ctx,
          api,
          themeColors,
          SHORT[item.id],
          item.x + 28,
          item.y + 44,
          40,
          co,
          'left',
        );
        drawRecommendationText(
          ctx,
          api,
          themeColors,
          item.retrieval.toFixed(2),
          item.x + item.width - 28,
          item.y + 44,
          40,
          co,
          'right',
        );
        if (item.allowed && item.statusKnown)
          drawRecommendationText(
            ctx,
            api,
            themeColors,
            'eligible',
            item.x + item.width - 215,
            item.y + 42,
            28,
            affirming ? themeColors.green : themeColors.muted,
            'right',
          );
        if (item.exited)
          drawRecommendationText(
            ctx,
            api,
            themeColors,
            item.permitted ? 'not current' : 'not permitted',
            item.x + item.width / 2,
            item.y + 98,
            27,
            co,
          );
      };
      drawRecommendationFocus(
        ctx,
        api,
        item.allowed
          ? 'eligibility-object-allowed-eligible-item-permitted-stale-private-8'
          : 'eligibility-simulation-6',
        paint,
      );
    });
  paintActors();
  drawRecommendationText(ctx, api, themeColors, model.remaining, 1540, 485, 170);
  drawRecommendationText(
    ctx,
    api,
    themeColors,
    model.complete ? 'eligible' : 'in the pool',
    1540,
    550,
    33,
    model.complete ? themeColors.green : themeColors.muted,
  );
  if (model.filtering > 0)
    drawRecommendationText(ctx, api, themeColors, 'Excluded', 1535, 610, 30, themeColors.muted);
  drawRecommendationText(
    ctx,
    api,
    themeColors,
    currentBeat > 0
      ? 'Recheck current permissions at display time'
      : model.actors[0].statusKnown
        ? 'Fixture rule: current + permitted'
        : '',
    960,
    960,
    31,
    themeColors.yellow,
  );
}
export function drawEligibility(ctx, scene, state, api) {
  const { C } = api,
    b = state.beat ?? 0,
    p = api.clamp(state.beatP ?? 0),
    id = scene.id;
  const targets = recommendationFocusTargets(id);
  withRecommendationFocus(ctx, api, targets, () =>
    paintEligibility(ctx, scene, state, api, C, b, p, id),
  );
}
export default {
  id: 'eligibility',
  draw: drawEligibility,
  cues: [
    'eligibility-beat-1-focus-1',
    'eligibility-beat-1-focus-2',
    'eligibility-filter-out',
    'eligibility-beat-2-focus-1',
    'eligibility-beat-3-focus-1',
  ],
};
