import { TRACKS } from './observations.mjs';
export function drawUnknownClipScene(ctx, scene, state, api) {
  {
    const { C, teaching: t } = api,
      b = state.beat ?? 0;
  }
  const { C, components, teaching } = api,
    beat = state.beat ?? 0,
    p = api.clamp(state.beatP ?? 0);
  const snapshot = TRACKS[scene.id].sample({
    beat,
    beatP: p,
  }).snapshot;
}
