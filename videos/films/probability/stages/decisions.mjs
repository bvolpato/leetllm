import { drawPolicy } from '../policy-queue.mjs';

export function drawDecisions(ctx, scene, state, api) {
  drawPolicy(ctx, state, api, false);
}
export default { id: 'decisions', draw: drawDecisions, cues: ['strict-removal', 'policy-prediction', 'policy-choice'] };
