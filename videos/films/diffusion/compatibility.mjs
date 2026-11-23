import { opProgress } from './construction.mjs';
export function drawUnknownDiffusionScene(ctx, scene, state, api) {
  const { C, components: c, teaching: t } = api,
    id = scene.id,
    b = state.beat ?? 0,
    p = opProgress(state, id);
  throw Error('Unknown diffusion construction ' + id);
}
