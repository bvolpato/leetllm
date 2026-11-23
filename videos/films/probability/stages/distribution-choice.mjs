import { cueProgress } from '../construction.mjs';
import { mix, smooth } from '../arithmetic.mjs';
import { focus, line, rectangle, text } from '../defaults.mjs';

const outcomes = [0, 0, 0, 0, 0, 0, 1, 0, 0, 0];
const p = 0.01;
const alertRate = 2;

export function drawDistributionChoice(ctx, scene, state, api) {
  const { C } = api;
  const q = (id, b) => cueProgress(state, id, b);
  focus(api, 'distribution-support', () => {
    if ((state.beat ?? 0) < 2) {
      const n = outcomes.length;
      const observed = Math.floor(n * q('binomial-observation', 0));
      const pieces = Math.ceil(n * q('binomial-pieces', 1));
      const join = smooth(q('binomial-expectation', 1));
      const axisX = 275, axisWidth = 1325;
      const unitWidth = p * axisWidth;
      text(ctx, api, '10 independent signups   ·   1% chance of abuse each', 960, 270, 46);
      for (let i = 0; i < n; i++) {
        const x = 222 + i * 150;
        const color = outcomes[i] ? C.red : C.blue;
        rectangle(ctx, api, x, 335, 124, 105, i < observed ? color : C.panel, C.muted);
        if (i < observed) text(ctx, api, outcomes[i], x + 62, 408, 55, C.bg);
        if (i < pieces) {
          const px = mix(x + 62 - unitWidth / 2, axisX + i * unitWidth, join);
          rectangle(ctx, api, px, mix(578, 687, join), unitWidth - 1, 28, C.yellow);
        }
      }
      if (observed === n) {
        const count = outcomes.reduce((a, b) => a + b, 0);
        text(ctx, api, 'Abusive signups in this batch', axisX, 508, 39, C.ink, 'left');
        line(ctx, api, axisX, 537, axisX + axisWidth * count, 537, C.red, 11);
        text(ctx, api, count + ' signup', axisX + axisWidth, 508, 40, C.red, 'right');
      }
      if (pieces) {
        line(ctx, api, axisX, 720, axisX + axisWidth, 720, C.muted, 3);
        text(ctx, api, '0', axisX, 773, 34, C.muted);
        text(ctx, api, '1 signup', axisX + axisWidth, 773, 34, C.muted, 'right');
        text(ctx, api, join === 1 ? 'Expected per batch     10 × 0.01 = ' + n * p : 'Each yellow piece = 0.01 signup', 960, 867, 48, C.yellow);
      }
      if (q('binomial-variance', 1) > 0)
        text(ctx, api, 'Count variance    np(1 − p) = ' + (n * p * (1 - p)).toFixed(3), 960, 963, 38, C.muted);
      return;
    }

    const plot = api.teaching.axes({
      x: 230, y: 375, width: 815, height: 425, xDomain: [0, 7], yDomain: [0, 0.35],
      xTicks: [0, 1, 2, 3, 4, 5, 6], yTicks: [0, 0.1, 0.2, 0.3],
      xLabel: 'Alerts in one minute', yLabel: 'Probability', fontSize: 30,
    });
    let probability = Math.exp(-alertRate);
    for (let k = 0; k <= 7; k++) {
      if (k) probability *= alertRate / k;
      const a = plot.point(k, 0), b = plot.point(k, probability);
      line(ctx, api, a.x, a.y, b.x, b.y, k === 0 && q('poisson-model', 2) === 1 ? C.yellow : C.cyan, 15);
    }
    text(ctx, api, 'Poisson count', 1420, 411, 46);
    text(ctx, api, 'Mean = variance = 2', 1420, 504, 38, C.cyan);
    if (q('poisson-model', 2) === 1)
      text(ctx, api, 'P(0 alerts) ≈ ' + Math.exp(-alertRate).toFixed(3), 1420, 612, 42, C.yellow);
    if (q('continuous-error', 2) > 0) {
      text(ctx, api, 'Timing error (ms)', 1420, 761, 38);
      line(ctx, api, 1150, 823, 1690, 823, C.muted, 3);
      [-1, 0, 1].forEach((v, i) => {
        const x = 1210 + i * 210;
        line(ctx, api, x, 811, x, 835, C.muted, 3);
        text(ctx, api, v, x, 883, 31, C.muted);
      });
      api.circle(ctx, 1420 + 0.37 * 210, 823, 9, C.blue);
      text(ctx, api, '+0.37', 1420 + 0.37 * 210, 935, 35, C.blue);
    }
  });
}
export default { id: 'distribution-choice', draw: drawDistributionChoice,
  cues: ['binomial-observation', 'binomial-pieces', 'binomial-expectation', 'binomial-variance', 'poisson-model', 'continuous-error'] };
