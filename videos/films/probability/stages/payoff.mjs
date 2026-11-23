import { drawPolicy } from '../policy-queue.mjs';

export function drawPayoff(ctx, scene, state, api) {
  drawPolicy(ctx, state, api, true);
}
export default { id: 'payoff', draw: drawPayoff, cues: ['improved-prediction', 'improved-recovery', 'improved-result'] };
