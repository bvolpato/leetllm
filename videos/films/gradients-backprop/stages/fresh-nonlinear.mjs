import { hiddenStep, hiddenUnit } from '../arithmetic.mjs';
import { nonlinearPredictionState } from '../construction.mjs';
import { drawHiddenUnitGraph } from '../defaults.mjs';
import { cueProgress, drawTrial, number } from '../latency-ruler.mjs';

export function drawFreshNonlinear(ctx, scene, state, api) {
  const { C, text, math, focus } = api;
  const first = hiddenStep(0.05);
  const fresh = nonlinearPredictionState(state.beat, state.beatP ?? 0, state.cues);
  if (state.beat === 3) {
    const movement = cueProgress(state, api, 'fresh-copied-step', 3, 0.28, 0.47);
    const scored = cueProgress(state, api, 'fresh-copied-loss', 3, 0.62, 0.73) === 1;
    const start = fresh.before;
    const copied = hiddenUnit(start.weights.map((w, i) => w - movement * first.rate * first.before.gradient[i]),
      start.input, start.target);
    text(ctx, 'One-block request     ·     Target 2 s     ·     Rate 0.05', 160, 266, 42, C.ink);
    const columns = [645, 965, 1290, 1635];
    ['First weight', 'Hidden bias', 'Output weight', 'Output bias'].forEach((name, i) =>
      text(ctx, name, columns[i], 370, 31, C.muted, 'center'));
    for (const [origin, label, y, color] of [
      [first.before, 'From two blocks', 468, C.yellow],
      [start, 'From one block', 575, C.cyan],
    ]) {
      text(ctx, label, 160, y, 35, color);
      const hiddenSignal = origin.signal * origin.weights[2] * origin.gate;
      const factors = [number(hiddenSignal) + ' × ' + number(origin.input), '', number(origin.signal) + ' × ' + number(origin.z), ''];
      origin.gradient.forEach((value, i) =>
        text(ctx, (factors[i] ? factors[i] + ' = ' : '') + number(value), columns[i], y, 36, color, 'center'));
    }
    focus.target('copied-landing', () =>
      drawTrial(ctx, api, { y: 756, label: 'Copied gradient', target: start.target,
        start: start.prediction, current: copied.prediction, color: C.yellow, showLoss: scored }));
    drawTrial(ctx, api, { y: 910, label: 'Fresh gradient', target: start.target,
      start: start.prediction, current: fresh.after.prediction, color: C.cyan, showLoss: true });
    if (scored) {
      const miss = value => number(Math.abs(value - start.target));
      text(ctx, 'Distance from target', 330, 1030, 32, C.ink);
      text(ctx, 'Copied   ' + miss(copied.prediction) + ' s', 1010, 1030, 32, C.yellow, 'center');
      text(ctx, 'Fresh   ' + miss(fresh.after.prediction) + ' s', 1440, 1030, 32, C.cyan, 'center');
    }
    return;
  }
  const moving = state.beat === 2;
  const switched = cueProgress(state, api, 'fresh-switch-request', 0, 0.32, 0.38) > 0;
  let current = first.before;
  let forward = 3;
  if (moving) {
    current = hiddenUnit(fresh.weights, fresh.before.input, fresh.before.target);
    forward = fresh.showAfter ? 3 : 0;
  } else if (switched) {
    current = fresh.before;
    if (!fresh.showForward) {
      const hidden = cueProgress(state, api, 'fresh-trace-hidden', 0, 0.45, 0.53);
      const activation = cueProgress(state, api, 'fresh-trace-activation', 0, 0.53, 0.57);
      forward = Number(hidden === 1) + Number(activation === 1);
    }
  }

  focus.target('fresh-nonlinear-mechanism', () => {
    drawHiddenUnitGraph(ctx, api, current, {
      forward, result: forward === 3,
      weightTarget: 'fresh-hidden-weights', forwardTarget: 'fresh-hidden-values',
    });
  });
  if (!moving) {
    const rows = [
      { model: first.before, y: 845, color: C.muted },
      { model: fresh.before, y: 948, color: C.pink },
    ];
    const bias = cueProgress(state, api, 'fresh-compare-bias', 1, 0.4, 0.53);
    const factors = cueProgress(state, api, 'fresh-compare-weights', 1, 0.55, 0.75);
    const names = ['first weight', 'hidden bias', 'output weight', 'output bias'];
    focus.target('fresh-hidden-gradients', () => {
      text(ctx, 'Gradient', 165, 766, 33, C.ink);
      for (let i = 0; i < names.length; i++) {
        const x = 620 + 340 * i;
        text(ctx, names[i], x, 766, 30, C.muted, 'center');
      }
      for (const [index, row] of rows.entries()) {
        if (index === 1 && !switched) continue;
        const { model } = row;
        const activation = index === 0 || forward >= 2 ? number(model.z) : '?';
        text(ctx, 'x = ' + model.input + '     z = ' + activation, 165, row.y, 31, row.color);
        model.gradient.forEach((value, i) => {
          const isBias = i === 1 || i === 3;
          let expression = '?';
          if (isBias && (index === 0 || bias === 1)) expression = number(value);
          if (!isBias && (index === 0 || factors > 0)) {
            const input = i === 0 ? model.input : model.z;
            const signal = i === 0 ? model.signal * model.weights[2] * model.gate : model.signal;
            const product = index === 0 || fresh.showGradient ? number(value) : '?';
            expression = number(signal) + ' × ' + number(input) + ' = ' + product;
          }
          text(ctx, expression, 620 + 340 * i, row.y,
            32, isBias ? C.muted : row.color, 'center');
        });
      }
    });
    return;
  }

  const replay = cueProgress(state, api, 'fresh-landing', 2, 0.42, 0.68);
  const along = hiddenUnit(fresh.before.weights.map((w, i) => w + replay * (fresh.after.weights[i] - w)), 1, 2);
  drawTrial(ctx, api, { y: 756, label: 'Input 2  ·  rate 0.05', target: first.before.target,
    start: first.before.prediction, current: first.after.prediction, color: C.muted, showLoss: true });
  focus.target('fresh-hidden-values', () =>
    drawTrial(ctx, api, { y: 910, label: 'Input 1  ·  rate 0.05', target: fresh.before.target,
      start: fresh.before.prediction, current: along.prediction, color: C.cyan, showLoss: fresh.showAfter }));
  focus.target('fresh-hidden-gradients', () =>
    math(ctx, String.raw`\nabla L_{\rm original}=(-2,-2,-0.5,-1)`, 550, 1020, 32, C.pink, 'center'));
  text(ctx, 'original h = 0.5   ·   starting loss 0.25', 1380, 1020, 27, C.muted, 'center');
}

export default {
  id: 'fresh-nonlinear',
  draw: drawFreshNonlinear,
  cues: [
    'fresh-nonlinear-b1', 'fresh-switch-request', 'fresh-trace-hidden', 'fresh-trace-activation',
    'fresh-hidden-forward', 'fresh-nonlinear-b2',
    'fresh-compare-bias', 'fresh-compare-weights', 'fresh-hidden-gradient',
    'fresh-nonlinear-b3', 'fresh-hidden-update', 'fresh-landing', 'fresh-hidden-result', 'fresh-copied-step', 'fresh-copied-loss',
  ],
};
