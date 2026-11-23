import { hiddenStep, hiddenUnit } from '../arithmetic.mjs';
import { cueProgress, drawTrial, number } from '../latency-ruler.mjs';

export function drawNonlinearUpdate(ctx, scene, state, api) {
  const { C, text, focus } = api;
  const full = hiddenStep(0.05), half = hiddenStep(0.025);
  const second = state.beat >= 3, step = second ? half : full;
  const set = second ? cueProgress(state, api, 'hidden-repair-knobs', 3, 0.28, 0.62)
    : cueProgress(state, api, 'hidden-update-knobs', 1, 0.03, 0.32);
  const firstRun = cueProgress(state, api, 'nonlinear-update-b2', 1, 0.36, 0.58);
  const secondRun = cueProgress(state, api, 'hidden-replay-half', 3, 0.65, 0.85);
  const firstLoss = cueProgress(state, api, 'hidden-overshoot-result', 2, 0.14, 0.53) === 1;
  const secondLoss = cueProgress(state, api, 'hidden-repair-result', 4, 0.33, 0.68) === 1;
  const along = (trial, t) => hiddenUnit(trial.before.weights.map((w, i) =>
    w + t * (trial.after.weights[i] - w)));
  const active = along(step, second ? secondRun : firstRun);
  focus.target('nonlinear-update-mechanism', () => {
    text(ctx, 'Input 2     Observed 5 s     Starting miss 0.5 s', 165, 270, 36, C.ink);
    const names = ['first weight', 'hidden bias', 'output weight', 'output bias'];
    text(ctx, 'Gradient', 165, 413, 30, C.pink);
    focus.target('hidden-weights', () => {
      text(ctx, 'Proposed weights', 165, 476, 30, C.yellow);
      names.forEach((name, i) => {
        const x = 570 + 355 * i;
        text(ctx, name, x, 348, 30, C.muted, 'center');
        text(ctx, number(step.before.gradient[i]), x, 413, 39, C.pink, 'center');
        const proposed = set >= (i + 1) / 4;
        const change = number(step.before.weights[i]) + (proposed ? ' → ' + number(step.after.weights[i]) : ' → ?');
        text(ctx, change, x, 476, 38, C.yellow, 'center');
      });
    });
  });
  focus.target('hidden-values', () => {
    text(ctx, 'Hidden output along the step   ' + number(active.z, 3), 165, 566, 34, C.blue);
    drawTrial(ctx, api, { y: 707, label: 'Rate 0.05', target: full.before.target,
      start: full.before.prediction, current: along(full, firstRun).prediction,
      color: C.cyan, showLoss: firstLoss });
    if (second) {
      drawTrial(ctx, api, { y: 910, label: 'Rate 0.025', target: half.before.target,
        start: half.before.prediction, current: active.prediction, color: C.blue, showLoss: secondLoss });
    } else {
      text(ctx, 'Starting loss   ' + number(full.before.loss) + ' s²', 165, 922, 34, C.muted);
    }
  });
}

export default {
  id: 'nonlinear-update',
  draw: drawNonlinearUpdate,
  cues: [
    'nonlinear-update-b1', 'hidden-update-knobs', 'nonlinear-update-b2', 'hidden-overshoot-result',
    'nonlinear-update-b3', 'hidden-repair-knobs', 'hidden-replay-half', 'hidden-repair-result',
  ],
};
