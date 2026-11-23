import {
  drawRecommendationClamp,
  drawRecommendationDocument,
  drawRecommendationRect,
  drawRecommendationText,
  recommendationFocusTargets,
  withRecommendationFocus,
} from '../defaults.mjs';
export function paintFeedColdstart(
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
    const newItem = P('cold-new-item', 1, 0.15, 0.7),
      future = P('cold-future', 2, 0.15, 0.7);
    drawRecommendationText(
      ctx,
      api,
      themeColors,
      'developer history',
      370,
      290,
      31,
      themeColors.yellow,
    );
    ['api-guide', 'retry-runbook'].forEach((d, i) =>
      drawRecommendationDocument(ctx, api, themeColors, d, 160, 350 + i * 110, {
        w: 420,
      }),
    );
    drawRecommendationText(
      ctx,
      api,
      themeColors,
      'topics: retry · API',
      370,
      645,
      30,
      themeColors.cyan,
    );
    drawRecommendationText(
      ctx,
      api,
      themeColors,
      'overlapping interactions',
      1460,
      290,
      31,
      themeColors.blue,
    );
    for (let r = 0; r < 3; r++) {
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        ['dev A', 'dev B', 'new dev'][r],
        1110,
        385 + r * 110,
        27,
        themeColors.muted,
        'right',
      );
      for (let c = 0; c < 3; c++) {
        drawRecommendationRect(
          ctx,
          api,
          themeColors,
          1160 + c * 150,
          340 + r * 110,
          138,
          85,
          themeColors.blue,
        );
        drawRecommendationText(
          ctx,
          api,
          themeColors,
          r === 2
            ? '?'
            : [
                [1, 1, 0],
                [0, 1, 1],
              ][r][c],
          1229 + c * 150,
          394 + r * 110,
          30,
          themeColors.blue,
        );
      }
    }
    drawRecommendationText(
      ctx,
      api,
      themeColors,
      'guide    runbook    SDK',
      1380,
      725,
      27,
      themeColors.muted,
    );
    if (currentBeat === 1) {
      drawRecommendationDocument(ctx, api, themeColors, 'new-item', 250, 770, {
        w: 500,
        label: 'new document',
        subtitle: newItem === 1 ? 'text + metadata vector' : 'no interaction history',
      });
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        newItem === 1 ? 'represent before first click' : 'ID-only row has no learned history',
        1380,
        870,
        31,
        newItem === 1 ? themeColors.green : themeColors.pink,
      );
    }
    if (currentBeat === 2) {
      api.line(ctx, 180, 850, 1740, 850, themeColors.muted, 3);
      api.line(ctx, 960, 780, 960, 910, themeColors.yellow, 3);
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        'training decision',
        960,
        970,
        28,
        themeColors.yellow,
      );
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        'past interactions',
        430,
        810,
        29,
        themeColors.cyan,
      );
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        'future click',
        1450,
        810,
        29,
        themeColors.pink,
      );
      if (future > 0) {
        api.line(ctx, 1080, 785, 1140, 845, themeColors.red, 4);
        api.line(ctx, 1140, 785, 1080, 845, themeColors.red, 4);
      }
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        'tower + item vectors + index must share compatible lineage',
        960,
        1030,
        27,
        themeColors.muted,
      );
    }
  }
}
export function drawFeedColdstart(ctx, scene, state, api) {
  const { C } = api,
    b = state.beat ?? 0,
    p = api.clamp(state.beatP ?? 0),
    id = scene.id;
  const targets = recommendationFocusTargets(id);
  withRecommendationFocus(ctx, api, targets, () =>
    paintFeedColdstart(ctx, scene, state, api, C, b, p, id),
  );
}
export default {
  id: 'feed-coldstart',
  draw: drawFeedColdstart,
  cues: [
    'feed-coldstart-b1',
    'feed-coldstart-b2',
    'cold-new-item',
    'feed-coldstart-b3',
    'cold-future',
  ],
};
