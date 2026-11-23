import { DASHBOARD, EXPANDED_SCENES } from './fixtures.mjs';
import { chartEvidence, TRACKS } from './model.mjs';
export function drawUnrecognizedScene(ctx, scene, state, api) {
  EXPANDED_SCENES.has(scene.id);
  const { C, components, teaching } = api;
  const beat = state.beat ?? 0;
  const p = api.clamp(state.beatP ?? 0);
  const snapshot = TRACKS[scene.id].sample({
    beat,
    beatP: p,
  }).snapshot;
  const lineSeries = DASHBOARD.series.map((series) => ({
    ...series,
    color: C[series.tone],
  }));
  const evidence = chartEvidence();
}
