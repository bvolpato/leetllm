import { extendedIds } from './model.mjs';
export function drawUnrecognizedScene(ctx, scene, state, api) {
  extendedIds.has(scene.id);
  const { C, components: c, teaching: t } = api,
    b = state.beat ?? 0,
    p = state.beatP ?? 0;
  const unmatched = scene.id;
  throw new Error(`Unknown embeddings scene ${scene.id}`);
}
