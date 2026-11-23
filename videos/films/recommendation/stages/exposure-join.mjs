import {
  drawRecommendationClamp,
  drawRecommendationDocument,
  drawRecommendationRect,
  drawRecommendationText,
  recommendationFocusTargets,
  withRecommendationFocus,
} from '../defaults.mjs';
export function paintExposureJoin(
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
    const q = P('event-orphan', 1, 0.25, 0.9);
    drawRecommendationText(
      ctx,
      api,
      themeColors,
      'Proposed results for request R1',
      960,
      285,
      30,
      themeColors.yellow,
    );
    ['api-guide', 'retry-runbook', 'sdk-example'].forEach((d, i) =>
      drawRecommendationDocument(ctx, api, themeColors, d, 190, 350 + i * 145, {
        w: 600,
        subtitle: 'request R1 · document version v1',
      }),
    );
    if (currentBeat === 0) {
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        'click E1 · R1 + guide',
        1380,
        430,
        31,
        themeColors.green,
      );
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        'resolved E2 · R1 + guide',
        1380,
        530,
        31,
        themeColors.green,
      );
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        'Displayed position comes from the browser',
        1320,
        800,
        29,
        themeColors.pink,
      );
    } else {
      const events = [
        ['E1', 'R1 + guide', 'joins'],
        ['E1', 'R1 + runbook', 'duplicate ID'],
        ['E3', 'R2 + SDK', 'orphan'],
      ];
      events.forEach(([e, owner, flag], i) => {
        drawRecommendationRect(
          ctx,
          api,
          themeColors,
          1090,
          350 + i * 145,
          630,
          100,
          i ? themeColors.red : themeColors.green,
        );
        drawRecommendationText(ctx, api, themeColors, `${e} · ${owner}`, 1405, 390 + i * 145, 28);
        drawRecommendationText(
          ctx,
          api,
          themeColors,
          q === 1 ? flag : 'checking',
          1405,
          430 + i * 145,
          27,
          q === 1 && i ? themeColors.red : themeColors.muted,
        );
      });
      if (q > 0) {
        api.line(ctx, 820, 386, 930, 386, themeColors.green, 2);
        api.line(ctx, 930, 386, 930, 400, themeColors.green, 2);
        api.arrow(ctx, 930, 400, 1065, 400, themeColors.green, 2);
      }
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        currentBeat === 2
          ? 'Keep displayed pages with zero clicks in the impression log'
          : 'join key: request + document · dedup key: event ID',
        960,
        1000,
        28,
        themeColors.yellow,
      );
    }
  }
}
export function drawExposureJoin(ctx, scene, state, api) {
  const { C } = api,
    b = state.beat ?? 0,
    p = api.clamp(state.beatP ?? 0),
    id = scene.id;
  const targets = recommendationFocusTargets(id);
  withRecommendationFocus(ctx, api, targets, () =>
    paintExposureJoin(ctx, scene, state, api, C, b, p, id),
  );
}
export default {
  id: 'exposure-join',
  draw: drawExposureJoin,
  cues: ['exposure-join-b1', 'exposure-join-b2', 'event-orphan', 'exposure-join-b3'],
};
