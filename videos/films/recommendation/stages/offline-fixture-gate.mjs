import { documents } from '../fixtures.mjs';
import { ranked } from '../construction.mjs';
import { sourceSlate } from '../model.mjs';
import {
  drawRecommendationClamp,
  drawRecommendationDocument,
  drawRecommendationRect,
  drawRecommendationStatus,
  drawRecommendationText,
  recommendationFocusTargets,
  withRecommendationFocus,
} from '../defaults.mjs';
export function paintOfflineFixtureGate(
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
    const fail = R('offline-fail', 1, 0.3, 0.8),
      times = R('offline-times', 0, 0.6, 0.98),
      scope = R('offline-scope', 2, 0.1, 0.4);
    const rows =
      currentBeat === 0
        ? ranked.slice(0, 3)
        : sourceSlate().selected.map((d) => documents.find((v) => v.id === d));
    rows.forEach((d, i) =>
      drawRecommendationDocument(ctx, api, themeColors, d, 180, 350 + i * 145, {
        w: 530,
      }),
    );
    drawRecommendationText(
      ctx,
      api,
      themeColors,
      currentBeat === 0 ? 'unconstrained fixture' : 'changed source-constrained slate',
      450,
      290,
      29,
      themeColors.cyan,
    );
    drawRecommendationStatus(
      ctx,
      api,
      themeColors,
      'candidate recall @5',
      '1.000',
      1000,
      370,
      themeColors.green,
    );
    drawRecommendationStatus(
      ctx,
      api,
      themeColors,
      'system NDCG @3',
      currentBeat === 0 ? '1.000' : fail ? '0.856 < 0.950' : '?',
      1000,
      470,
      currentBeat === 0 ? themeColors.green : themeColors.red,
    );
    drawRecommendationStatus(
      ctx,
      api,
      themeColors,
      'authored sample p95',
      times ? '18 ms ≤ 20 ms' : '?',
      1000,
      570,
      themeColors.yellow,
    );
    drawRecommendationStatus(
      ctx,
      api,
      themeColors,
      'blocked / join / unique IDs',
      'fixture checks',
      1000,
      670,
      themeColors.muted,
    );
    if (currentBeat > 0)
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        fail ? 'source-capped list falls below 0.950' : 'quality threshold held fixed',
        1280,
        820,
        31,
        themeColors.red,
      );
    if (currentBeat === 2) {
      drawRecommendationRect(ctx, api, themeColors, 900, 900, 830, 110, themeColors.yellow);
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        scope ? 'Original list: fixture checks passed' : 'Original list receipt',
        1315,
        945,
        29,
        themeColors.yellow,
      );
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        scope ? 'operational status: not evaluated' : '',
        1315,
        990,
        27,
        themeColors.muted,
      );
    } else
      drawRecommendationText(
        ctx,
        api,
        themeColors,
        'Example timings for ten requests',
        960,
        1010,
        29,
        themeColors.muted,
      );
  }
}
export function drawOfflineFixtureGate(ctx, scene, state, api) {
  const { C } = api,
    b = state.beat ?? 0,
    p = api.clamp(state.beatP ?? 0),
    id = scene.id;
  const targets = recommendationFocusTargets(id);
  withRecommendationFocus(ctx, api, targets, () =>
    paintOfflineFixtureGate(ctx, scene, state, api, C, b, p, id),
  );
}
export default {
  id: 'offline-fixture-gate',
  draw: drawOfflineFixtureGate,
  cues: [
    'offline-fixture-gate-b1',
    'offline-times',
    'offline-fixture-gate-b2',
    'offline-fail',
    'offline-fixture-gate-b3',
    'offline-scope',
  ],
};
