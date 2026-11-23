import { sampleModel } from '../model.mjs';
import { drawNonlinear } from '../network-renderer.mjs';
export function paintNonlinearRequest(ctx, scene, state, api, s) {
  drawNonlinear(ctx, scene, state, api, s);
  return;
}
export function drawNonlinearRequestStage(ctx, scene, state, api) {
  const { C, components: c, teaching: t } = api,
    b = state.beat ?? 0,
    s = sampleModel(scene.id, state);
  return paintNonlinearRequest(ctx, scene, state, api, s);
}
export default {
  id: 'nonlinear-request',
  draw: drawNonlinearRequestStage,
  cues: [
    'network-forward',
    'network-z',
    'network-h',
    'network-y',
    'network-gradient-result',
    'network-backward',
    'network-update',
    'network-parameters',
    'network-recompute',
    'network-loss-result',
  ],
};
