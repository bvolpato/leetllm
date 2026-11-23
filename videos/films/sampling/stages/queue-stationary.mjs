import { mm1Means } from '../arithmetic.mjs';
import { samplingExtensionModel } from '../construction.mjs';
import {
  drawSamplingExtensionCurve,
  drawSamplingExtensionD,
  drawSamplingExtensionEquation,
  drawSamplingExtensionFooter,
  drawSamplingExtensionL,
  drawSamplingExtensionNum,
  drawSamplingExtensionPlot,
  drawSamplingExtensionText,
} from '../defaults.mjs';
export function drawQueueStationary(ctx, scene, state, api) {
  const { C: themeColors } = api,
    f = samplingExtensionModel(state, 'queue-stationary'),
    currentBeat = f.beat,
    progress = f.progress,
    pct = (x) => (100 * x).toFixed(1) + '%';
  api.focus.target('sp-queue-stationary-visual', () => {
    const q = drawSamplingExtensionPlot(
      ctx,
      api,
      [0, 20],
      [0, 1.05],
      240,
      365,
      1070,
      455,
      'arrival rate λ / second',
      'mean time (seconds)',
    );
    drawSamplingExtensionCurve(
      ctx,
      api,
      q,
      (x) => Math.min(1.05, 1 / (20 - x)),
      0,
      19.04,
      themeColors.blue,
    );
    drawSamplingExtensionCurve(
      ctx,
      api,
      q,
      (x) => Math.min(1.05, 1 / (20 - x) - 0.05),
      0,
      19.04,
      themeColors.pink,
    );
    const lambda =
        currentBeat === 0
          ? 15
          : currentBeat === 1
            ? 15
            : currentBeat === 2
              ? 15 + 4 * progress
              : 15,
      m = mm1Means(lambda, 20);
    drawSamplingExtensionL(
      ctx,
      api,
      [q.point(lambda, 0), q.point(lambda, m.total)],
      themeColors.yellow,
      3,
    );
    drawSamplingExtensionD(
      ctx,
      api,
      q.point(lambda, m.total).x,
      q.point(lambda, m.total).y,
      themeColors.yellow,
      13,
    );
    drawSamplingExtensionNum(ctx, api, 'λ / μ', lambda.toFixed(1) + ' / 20', 375);
    drawSamplingExtensionNum(
      ctx,
      api,
      'Total / queue mean',
      m.total.toFixed(2) + ' / ' + m.queue.toFixed(2) + ' s',
      570,
      themeColors.yellow,
    );
    drawSamplingExtensionNum(ctx, api, 'Utilization', pct(m.utilization), 770, themeColors.cyan);
    if (currentBeat === 2 && f.active('sp-queue-unstable', state.beatP > 0.75))
      drawSamplingExtensionText(
        ctx,
        api,
        'λ ≥ 20: no finite stationary mean',
        960,
        285,
        36,
        themeColors.pink,
        'center',
      );
    else
      drawSamplingExtensionEquation(
        ctx,
        api,
        'W=1/(\\mu-\\lambda),\\quad L=\\lambda W',
        960,
        285,
        40,
        themeColors.ink,
        'center',
      );
    drawSamplingExtensionFooter(
      ctx,
      api,
      'M/M/1 assumptions: Poisson arrivals, exponential service, one FCFS server, no abandonment',
    );
  });
}
export default {
  id: 'queue-stationary',
  draw: drawQueueStationary,
  cues: [
    'sp-queue-stationary-0',
    'sp-queue-stationary-1',
    'sp-queue-stationary-2',
    'sp-queue-unstable',
  ],
};
