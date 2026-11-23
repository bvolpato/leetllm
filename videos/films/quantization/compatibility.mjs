import { detailProgress } from './construction.mjs';
export function rejectUnknownOriginalScene(ctx, scene, state, api) {
  api.clamp(state.beatP ?? 0, 0, 1);
  // The original switch throws after save; retain that observable exception path.
  ctx.save();
  throw new Error('Unknown quantization scene ' + scene.id);
}
export function rejectUnknownDetail(ctx, scene, state, api) {
  const id = scene.id;
  detailProgress(state, id, state.beat ?? 0);
  const body = () => {
    throw new Error('Unimplemented quantization detail ' + id);
  };
  let focused = body;
  for (let i = scene.beats.length - 1; i >= 0; i--) {
    const inner = focused;
    focused = () => api.focus.target(id + '-state-' + i, inner);
  }
  focused();
}
