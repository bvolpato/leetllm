import { sampleModel } from '../model.mjs';
import { drawNonlinear } from '../network-renderer.mjs';
export function paintNetworkTransfer(ctx, scene, state, api, s) {
  drawNonlinear(ctx, scene, state, api, s);
  return;
}
export function drawNetworkTransferStage(ctx, scene, state, api) {
  const { C, components: c, teaching: t } = api,
    b = state.beat ?? 0,
    s = sampleModel(scene.id, state);
  return paintNetworkTransfer(ctx, scene, state, api, s);
}
export default {
  id: 'network-transfer',
  draw: drawNetworkTransferStage,
  cues: [
    'transfer-prediction',
    'transfer-forward',
    'transfer-result',
    'transfer-gradients',
    'transfer-weights',
    'transfer-hidden',
    'transfer-loss',
  ],
};
