import { clamped, cueAmount } from './arithmetic.mjs';
export function drawUnmatchedOriginal(ctx, scene, state, api) {
  const { C, components: c, teaching: g } = api,
    b = state.beat ?? 0,
    p = api.clamp(state.beatP ?? 0),
    F = c.fade;
}
export function drawUnmatchedConstruction(ctx, scene, state, api) {
  const { C, teaching: g } = api,
    b = state.beat ?? 0,
    p = clamped(state.beatP ?? 0),
    q = cueAmount(state, 'vae-' + scene.id + '-' + b + '-build', p);
}
