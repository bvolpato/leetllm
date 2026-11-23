import { regularizedObjective, sigmoid, softplus } from '../arithmetic.mjs';
import { regularizedMinimum } from '../fixtures.mjs';
import { mix, progress, smooth } from '../construction.mjs';
import { M, T, mark } from '../defaults.mjs';
import { sampleFunction } from 'vizmatic';
export function drawSeparation(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0;
  if (currentBeat === 0) {
    const p = progress(state, 'separable-growth', 0),
      again = progress(state, 'separable-again', 0),
      a = 1 + smooth(p) + 2 * smooth(again),
      q = api.teaching.axes({
        x: 240,
        y: 430,
        width: 1440,
        height: 150,
        xDomain: [-5, 5],
        yDomain: [0, 1],
        xTicks: [-4, -2, 0, 2, 4],
        yTicks: [],
        xLabel: 'linear score',
        yLabel: '',
      });
    T(
      ctx,
      api,
      'Controlled fitting-limit experiment · coefficient a = ' + a.toFixed(2),
      960,
      290,
      35,
    );
    mark(api, 'separable-scores', () =>
      [
        [-a, 'routine', api.C.blue],
        [a, 'review required', api.C.pink],
      ].forEach(([z, name, color]) => {
        const at = q.point(z, 0.5);
        api.circle(ctx, at.x, at.y, 17, color);
        T(ctx, api, name, at.x, at.y - 65, 32, color);
        T(ctx, api, 'p = ' + sigmoid(z).toFixed(3), at.x, at.y + 170, 33, color);
      }),
    );
    mark(api, 'separable-loss', () => {
      M(ctx, api, 'L(a)=\\log(1+e^{-a})', 960, 770, 52, api.C.cyan);
      T(ctx, api, 'mean log loss ' + softplus(-a).toFixed(4), 960, 885, 43, api.C.yellow);
    });
  } else {
    const p = progress(state, 'regularized-objective', 1),
      a = mix(4, regularizedMinimum, smooth(p));
    const q = api.teaching.axes({
      x: 250,
      y: 360,
      width: 1040,
      height: 480,
      xDomain: [0, 5],
      yDomain: [0, 3],
      xTicks: [0, 1, 2, 3, 4, 5],
      yTicks: [0, 1, 2, 3],
      xLabel: 'coefficient a',
      yLabel: 'objective',
    });
    api.teaching.curve({
      plot: q,
      points: sampleFunction((x) => softplus(-x), 0, 5, 150),
      color: api.C.cyan,
      width: 3,
    });
    api.teaching.curve({
      plot: q,
      points: sampleFunction((x) => 0.1 * x * x, 0, 5, 150),
      color: api.C.yellow,
      width: 3,
    });
    mark(api, 'regularized-objective', () => {
      api.teaching.curve({
        plot: q,
        points: sampleFunction(regularizedObjective, 0, 5, 150),
        color: api.C.pink,
        width: 5,
      });
      const at = q.point(a, regularizedObjective(a));
      api.circle(ctx, at.x, at.y, 13, api.C.pink);
    });
    T(ctx, api, 'log loss', 1540, 390, 34, api.C.cyan);
    T(ctx, api, '+ 0.1 a²', 1540, 475, 34, api.C.yellow);
    T(ctx, api, 'combined objective', 1540, 560, 32, api.C.pink);
    T(
      ctx,
      api,
      p === 1 ? 'preferred a ≈ ' + regularizedMinimum.toFixed(3) : 'minimum pending',
      1540,
      725,
      34,
      api.C.pink,
    );
    T(ctx, api, 'The penalty supplies a finite preferred scale', 960, 965, 35, api.C.muted);
  }
}
export default {
  id: 'separation',
  draw: drawSeparation,
  cues: ['separable-growth', 'separable-again', 'regularized-objective'],
};
