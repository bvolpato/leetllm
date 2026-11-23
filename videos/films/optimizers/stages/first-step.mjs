import { fmt, loss, pair } from '../arithmetic.mjs';
import { RUNS } from '../fixtures.mjs';
import { cueProgress, traceState } from '../construction.mjs';
import { coordinatePlot } from '../coordinate-plots.mjs';
import { drawOptimizerBowl, drawOptimizerReceipt, drawOptimizerTrace } from '../defaults.mjs';

export function drawFirstStep(ctx, scene, state, api) {
  const { C } = api;
  const run = RUNS.sgd;
  const step = run.records[0];
  const beat = state.beat ?? 0;
  if (beat < 2) {
    const move = cueProgress(state, 'take-first-step', 1, 0.02, 0.17);
    const assembledLoss = cueProgress(state, 'build-loss', 1, 0.27, 0.48);
    const differentiated = cueProgress(state, 'build-gradient', 1, 0.49, 0.63);
    api.focus.target('loss-rule', () => {
      const label = assembledLoss === 1 ? 'L = ½ (100a² + b²)' : 'Height = contribution to loss';
      api.text(ctx, label, 130, 224, 36, C.ink);
    });
    api.focus.target('local-gradient', () => {
      const label = (differentiated === 1 ? 'g = (100a, b)     ·     ' : '') + 'η = ' + step.eta;
      api.text(ctx, label, 1785, 224, 36, C.ink, 'right');
    });
    api.focus.target('sgd-transition', () => {
      for (let j = 0; j < 2; j++) {
        const scaled = j
          ? cueProgress(state, 'multiply-shallow', 0, 0.55, 0.92)
          : cueProgress(state, 'multiply-gradient', 0, 0.08, 0.5);
        const product = 'Δ = −' + step.eta + ' × ' + step.gradient[j];
        coordinatePlot(ctx, api, j, {
          before: step.before[j],
          after: step.next[j],
          move,
          slope: step.gradient[j],
          product: scaled > 0 ? product + (scaled === 1 ? ' = ' + fmt(step.update[j]) : '') : undefined,
          endpoint: move === 1 ? (j ? 'b = ' : 'a = ') + fmt(step.next[j]) : undefined,
        });
      }
    });
    const startLoss = fmt(loss(step.before));
    api.text(
      ctx,
      move === 1
        ? 'Update 1 · loss ' + startLoss + ' → ' + fmt(step.loss, 4)
        : 'Update 0 · loss ' + startLoss,
      960,
      1010,
      40,
      C.ink,
      'center',
    );
    return;
  }

  const second = run.records[1];
  const move = cueProgress(state, 'take-second-step', 2, 0.42, 0.73);
  const f = traceState(run, move, 1, 2);
  api.text(ctx, 'Both errors on one map', 150, 233, 36, C.muted);
  const plot = drawOptimizerBowl(ctx, api, C, api.teaching);
  api.focus.target('next-gradient', () => {
    drawOptimizerTrace(ctx, api, C, api.teaching, plot, run, f, C.cyan);
    api.text(ctx, 'Slope at update 1', 1310, 375, 32, C.muted);
    const ready = cueProgress(state, 'refresh-gradient', 2, 0.08, 0.32) === 1;
    api.text(ctx, ready ? pair(second.gradient) : '(?, ?)', 1310, 450, 48, C.cyan);
  });
  drawOptimizerReceipt(ctx, api, C, f, 1310, 645, C.ink);
}
export default {
  id: 'first-step',
  draw: drawFirstStep,
  cues: [
    'build-loss',
    'build-gradient',
    'multiply-gradient',
    'multiply-shallow',
    'take-first-step',
    'refresh-gradient',
    'take-second-step',
  ],
};
