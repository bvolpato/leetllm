import { A, B } from '../fixtures.mjs';
import { partialProduct } from '../model.mjs';
import { finished, label, operandPairs, runningSum } from '../workbench.mjs';

export function drawDot(ctx, scene, state, api) {
  const a = A[1], b = B.map((values) => values[0]);
  const count = [[0, 'minus-two'], [1, 'plus-three'], [2, 'plus-six']]
    .filter(([beat, cue]) => finished(state, beat, cue)).length;
  const products = a.slice(0, count).map((v, k) => v * b[k]);
  const sum = partialProduct(0, count)[1][0];
  api.focus.target('dot-pairs', () => {
    operandPairs(ctx, api, { a, b, row: 1, col: 0, products, active: [count - 1] });
    runningSum(ctx, api, 'C[1,0]', sum, count === a.length ? 'ready to store' : 'running sum');
  });
  if (state.beat >= 3) {
    label(ctx, api, '4 outputs × 3 multiply-adds × 2 FLOPs = 24 FLOPs', 960, 1013, 32, api.C.ink);
  }
}
export default { id: 'dot', draw: drawDot, cues: ['minus-two', 'plus-three', 'plus-six'] };
