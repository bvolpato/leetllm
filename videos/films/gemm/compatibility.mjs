import { multiplyMatrices } from 'vizmatic';
import { A, B } from './fixtures.mjs';
import { partialProduct } from './model.mjs';
export function drawUnrecognizedScene(ctx, scene, state, api) {
  const { C, components: c, teaching: t } = api,
    b = state.beat ?? 0,
    p = api.clamp(state.beatP ?? 0, 0, 1),
    s = (i) => (b < i ? 0 : b > i ? 1 : api.phase(p, 0.04, 0.92)),
    whole = (b + s(b)) / 3;
  const full = multiplyMatrices(A, B),
    first = partialProduct(0, 2),
    last = partialProduct(2, 3);
  throw new Error(`Unknown gemm scene ${scene.id}`);
}
