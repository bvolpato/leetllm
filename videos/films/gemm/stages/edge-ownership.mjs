import { rightEdge } from '../fixtures.mjs';
import { cooperativeCell } from '../model.mjs';
import { finished, label, operandPairs, outputOwners, runningSum } from '../workbench.mjs';

export function drawEdgeOwnership(ctx, scene, state, api) {
  const { a, b, row, col } = rightEdge;
  const skipped = finished(state, 1, 'skip-thread');
  const repaired = finished(state, 2, 'keep-copy');
  const missing = skipped && !repaired;
  const trace = cooperativeCell(rightEdge, missing);
  const showSum = missing ? finished(state, 1, 'bad-sum') : repaired && finished(state, 2, 'fixed-sum');
  api.focus.target('edge-pairs', () => {
    label(ctx, api, 'Right edge · C has two rows and one column', 960, 229, 35, api.C.ink);
    outputOwners(ctx, api, a.length, b[0].length);
    operandPairs(ctx, api, {
      a: a[row], b: b.map((r) => r[col]), row, col, active: [1],
      skipped: missing ? [1] : [], operand: 'A',
      products: skipped ? trace.steps.map((s) => s.product) : [],
    });
    runningSum(ctx, api, 'C[1,0]', showSum ? trace.sum : '?',
      missing ? 'early return' : repaired ? 'shared copy restored' : 'Can T11 leave before loading?',
      missing ? api.C.red : api.C.cyan);
    if (repaired) {
      label(ctx, api, `Skipped copy → ${cooperativeCell(rightEdge, true).sum}`, 1370, 954, 30, api.C.muted);
    }
  });
  label(ctx, api, state.beat === 0 ? 'Panel start s · T11 loads A[1,s+1] and B[s+1,1] when in bounds' : 'Each shared slot starts at zero in this trace', 960, 1009, 28, api.C.muted);
}
export default { id: 'edge-ownership', draw: drawEdgeOwnership, cues: ['edge-question', 'skip-thread', 'bad-sum', 'keep-copy', 'fixed-sum'] };
