import { cueProgress, number } from '../latency-ruler.mjs';
import { batchGradientState } from '../arithmetic.mjs';
import { drawProbeSpacing } from './gradient-check.mjs';

function drawCheckBackwardRule(ctx, scene, state, api) {
  if (state.beat === 0) {
    const actual = cueProgress(state, api, 'stored-spacing-slope', 0, 0.53, 0.83);
    return drawProbeSpacing(ctx, api, { rounded: 1, usual: 1, actual });
  }
  const { C, text, circle, line, focus } = api;
  const weights = [1.3, 1.1], epsilon = 1e-5;
  const { gradient } = batchGradientState(weights);
  const sampled = cueProgress(state, api, 'check-both-weights', 1, 0.2, 0.58);
  const repaired = cueProgress(state, api, 'restore-square-factor', 2, 0.2, 0.52);
  const x = slope => 440 + (slope + 10) * 112;
  text(ctx, 'Four requests     Weights [1.3, 1.1]     Float64', 160, 278, 40, C.ink);
  focus.target('batch-check', () => {
    ['Prompt weight', 'Queue weight'].forEach((label, i) => {
      const above = [...weights], below = [...weights];
      above[i] += epsilon;
      below[i] -= epsilon;
      const measured = (batchGradientState(above).loss - batchGradientState(below).loss) / (2 * epsilon);
      const y = 490 + i * 255;
      text(ctx, label, 160, y + 10, 31, C.ink);
      line(ctx, x(-10), y, x(0), y, C.muted + '66', 4);
      for (const tick of [-10, -8, -6, -4, -2, 0]) {
        line(ctx, x(tick), y - 6, x(tick), y + 6, C.muted, 2);
        text(ctx, number(tick), x(tick), y + 45, 25, C.muted, 'center');
      }
      const proposed = gradient[i] * (1 + repaired) / 2;
      circle(ctx, x(proposed), y, 9, C.yellow);
      text(ctx, 'backward  ' + number(proposed, 4), x(proposed), y - 37, 30, C.yellow, 'center');
      if (sampled === 1) {
        circle(ctx, x(measured), y, 16, null, C.cyan, 3);
        text(ctx, 'centered check  ' + number(measured, 4), x(measured), y + 96, 30, C.cyan, 'center');
      }
    });
    text(ctx, repaired === 0 ? 'Candidate gradient   mean of error × feature' : 'Square the error   →   multiply the backward signal by 2',
      960, 973, 37, repaired === 1 ? C.green : C.ink, 'center');
  });
}

export default {
  id: 'check-backward-rule',
  draw: drawCheckBackwardRule,
  cues: ['stored-spacing-slope', 'check-both-weights', 'restore-square-factor'],
};
