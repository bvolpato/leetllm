import { phraseProgress } from '../construction.mjs';
import { exactLearningRate } from '../model.mjs';

export function drawExactSchedule(ctx, scene, state, api) {
  const { C, teaching } = api;
  const wide = state.beat >= 2;
  const atNine = phraseProgress(state, 'schedule-nine', 1);
  const atPeak = phraseProgress(state, 'schedule-fifty', 1, 0.5, 0.85);
  const decay = phraseProgress(state, 'schedule-decay', 2);
  const step = wide ? Math.round(50 + 949 * decay) : Math.round(9 * atNine + 40 * atPeak);
  const rate = exactLearningRate(step) * 1e6;
  api.text(ctx, wide ? 'All 1,000 updates' : 'First 50 updates', 205, 289, 40, C.ink);
  api.focus.target('rate-curve', () => {
    const plot = teaching.axes({
      x: 260,
      y: 380,
      width: 1370,
      height: 350,
      xDomain: [0, wide ? 999 : 49],
      yDomain: [0, 32],
      xTicks: wide ? [0, 250, 500, 750, 999] : [0, 9, 24, 39, 49],
      yTicks: [3, 15, 30],
      xLabel: 'step (starting at zero)',
      yLabel: 'rate in millionths',
    });
    if (step > 0)
      teaching.curve({
        plot,
        points: Array.from({ length: step + 1 }, (_, x) => ({ x, y: exactLearningRate(x) * 1e6 })),
        color: C.cyan,
        width: 5,
        progress: 1,
      });
    teaching.scatter({ plot, points: [{ x: step, y: rate, radius: 11, color: C.yellow }] });
  });
  api.focus.target('rate-formula', () => {
    if (state.beat === 0) {
      api.text(ctx, 'Step 9:   3 + (30 − 3) × (9 + 1) / 50 = ?', 960, 911, 51, C.ink, 'center');
    } else if (!wide) {
      const answer = phraseProgress(state, 'schedule-nine-result', 1, 0.25, 0.48) >= 1;
      const rateAtNine = exactLearningRate(9) * 1e6;
      api.text(
        ctx,
        atPeak >= 1
          ? 'Step 49:   3 + 27 × 50 / 50 = 30'
          : 'Step 9:   3 + 27 × 10 / 50 = ' + (answer ? rateAtNine.toFixed(1) : '?'),
        960,
        911,
        51,
        C.yellow,
        'center',
      );
    } else {
      const label =
        state.beat === 2
          ? 'Step ' + step + '     rate ' + rate.toFixed(2) + ' × 10⁻⁶'
          : 'Peak sweep in the study:     ½×     1×     2×';
      api.text(ctx, label, 960, 886, 45, C.yellow, 'center');
      api.text(
        ctx,
        'Cosine decay in millionths:   3 + ½ × 27 × (1 + cos(π × (step − 50) / 949))',
        960,
        976,
        33,
        C.muted,
        'center',
      );
    }
  });
}

export default {
  id: 'exact-schedule',
  draw: drawExactSchedule,
  cues: [
    'schedule-numerator',
    'schedule-nine',
    'schedule-nine-result',
    'schedule-fifty',
    'schedule-decay',
    'schedule-sweep',
  ],
};
