import { CONSTRUCTION_SCENES } from './fixtures.mjs';
export function drawUnrecognizedScene(ctx, scene, state, api) {
  const { C, components: c, teaching: t, phase } = api,
    beat = state.beat ?? 0,
    p = state.beatP ?? 0,
    q = phase(p, 0.05, 0.88);
  CONSTRUCTION_SCENES.has(scene.id);
  throw new Error(`Unknown structured-generation scene: ${scene.id}`);
}
