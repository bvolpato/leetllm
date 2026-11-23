import { orderAudit } from './arithmetic.mjs';
export function drawUnrecognizedScene(ctx, scene, state, api) {
  const { C, components: c, teaching: t } = api;
  const b = state.beat ?? 0,
    p = api.clamp(state.beatP ?? 0, 0, 1);
  const s = (i) => (b < i ? 0 : b > i ? 1 : api.phase(p, 0.05, 0.93));
  const audit = orderAudit(0.8, 0.7);
  throw new Error('Unknown synthetic-data scene ' + scene.id);
}
