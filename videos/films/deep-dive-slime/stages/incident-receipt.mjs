import { mask } from '../fixtures.mjs';
import { progress } from '../phrase-clock.mjs';
import { receipt, receiptTarget, responseTape, tokenX } from '../response-tape.mjs';

export function drawIncidentReceipt(ctx, scene, state, api) {
  const { C } = api;
  const p = (id) => progress(scene, state, id);
  return api.focus.target(receiptTarget, () => {
    receipt(ctx, api, 'Clean grader  /  reward 1.0');
    responseTape(ctx, api, { masks: mask });
    if (state.beat === 0) {
      // Position 13 is predicted from the six IDs to its left, including both tool IDs.
      const x0 = tokenX(0) - 76,
        x1 = tokenX(5) + 76;
      const length = (x1 - x0) * p('read-prefix');
      api.line(ctx, x0, 794, x0 + length, 794, C.cyan, 5);
      api.line(ctx, x0, 776, x0, 794, C.cyan, 5);
      if (p('read-prefix') === 1) {
        api.line(ctx, x1, 776, x1, 794, C.cyan, 5);
        api.text(ctx, 'Input when predicting ID 13', (x0 + x1) / 2, 869, 36, C.cyan, 'center');
        api.arrow(ctx, x1 + 20, 794, tokenX(6), 744, C.cyan, 4);
      }
      return;
    }
    api.text(ctx, 'Sample in the Data Buffer', 190, 831, 31, C.muted);
    api.text(ctx, 'Rollout 7  /  sampled v11', 190, 911, 45, C.blue);
    api.arrow(ctx, 799, 880, 1090, 880, C.muted, 4);
    api.text(ctx, 'Megatron actor', 1175, 831, 31, C.muted);
    api.text(
      ctx,
      p('actor-version') === 1 ? 'Training on v12' : 'Current policy ?',
      1175,
      911,
      45,
      C.ink,
    );
  });
}
export default {
  id: 'incident-receipt',
  draw: drawIncidentReceipt,
  cues: ['read-prefix', 'actor-version'],
};
