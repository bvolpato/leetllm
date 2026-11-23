import { cueProgress } from '../arithmetic.mjs';
import { scoreBoard } from '../score-board.mjs';

export function drawThreshold(ctx, scene, state, api) {
  const mid = cueProgress(state, 1, 'raise-threshold', 0, 0.27);
  const high = cueProgress(state, 2, 'strict-threshold', 0, 0.28);
  const cutoff =
    high > 0 ? (high === 1 ? 0.999 : 0.995 + 0.004 * high) : mid === 1 ? 0.995 : 0.99 + 0.005 * mid;
  const prompt = [
    'At 0.995, which request would drop out?',
    mid === 1
      ? 'The FAQ sits exactly on the inclusive cutoff.'
      : 'At 0.995, which request would drop out?',
    'How many of the four acceptable pairs still qualify?',
  ][state.beat ?? 0];
  scoreBoard(ctx, api, { cutoff, prompt });
}
export default {
  id: 'threshold',
  draw: drawThreshold,
  cues: [
    'proposed-hits',
    'raise-threshold',
    'improve-precision',
    'strict-threshold',
    'reuse-tradeoff',
  ],
};
