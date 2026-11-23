import { clamp } from '../arithmetic.mjs';
import { A } from '../fixtures.mjs';
import { event } from '../construction.mjs';
import { strengthFrame } from '../model.mjs';
import { caption, equation, ring, target, text } from '../defaults.mjs';

export function drawContrastOutput(ctx, scene, state, api) {
  const { C } = api;
  const colors = [C.blue, C.pink, C.green];
  const { scores, squaredTerms } = strengthFrame(state);
  const singles = event(state, 0, 'contrast-scores');
  const joint = state.cues?.['contrast-joint']?.progress ?? event(state, 1, 'contrast-joint');
  const energy = state.cues?.['contrast-length']?.progress ?? event(state, 1, 'contrast-length');
  const fractions = state.cues?.['rollback-score']
    ? [singles, event(state, 0, 'rollback-score'), joint === 1 ? 1 : 0]
    : [clamp(2 * singles), clamp(2 * singles - 1), joint === 1 ? 1 : 0];
  text(ctx, api, 'Slow / rollback flags', 345, 290, 30, C.muted, 'center');
  api.components.matrix({
    values: A,
    x: 250,
    y: 345,
    cellSize: 88,
    gap: 8,
    style: { fill: C.panel, stroke: C.blue, textColor: C.blue, fontSize: 34, padding: 8 },
  });
  const q = api.teaching.axes({
    x: 700,
    y: 350,
    width: 1050,
    height: 400,
    xDomain: [-0.5, 2.5],
    yDomain: [-1.1, 1.7],
    xTicks: [],
    yTicks: [-1, 0, 1],
    xLabel: '',
    yLabel: 'signed score',
    fontSize: 28,
  });
  target(ctx, api, 'contrast-scores', () =>
    scores[1].forEach((score, i) => {
      const p = fractions[i];
      const a = q.point(i, 0);
      const z = q.point(i, score * p);
      if (p > 0) {
        api.line(ctx, a.x, a.y, z.x, z.y, colors[i], 15);
        ring(ctx, api, z, colors[i], 8);
      }
      text(
        ctx,
        api,
        p === 1 ? score.toFixed(3) : '?',
        a.x,
        Math.min(a.y, z.y) - 26,
        35,
        colors[i],
        'center',
      );
    }),
  );
  const active = fractions[0] < 1 ? 0 : fractions[1] < 1 ? 1 : 2;
  ['Slow only', 'Rollback only', 'Both'].forEach((name, i) =>
    text(ctx, api, name, q.point(i, 0).x, 779, 28, colors[i], 'center'),
  );
  if (energy === 0) {
    equation(
      ctx,
      api,
      't_' +
        active +
        ':\\quad ' +
        A[active][0] +
        '\\times(-1/\\sqrt 2)+' +
        A[active][1] +
        '\\times(1/\\sqrt 2)=' +
        (fractions[active] === 1 ? scores[1][active].toFixed(3) : '?'),
      960,
      852,
      43,
      C.pink,
    );
  }
  target(ctx, api, 'contrast-strength', () => {
    if (energy > 0) {
      api.line(ctx, 440, 887, 1430, 887, C.muted, 3);
      api.line(ctx, 440, 812, 440, 897, C.muted, 3);
      let x = 440;
      squaredTerms[1].forEach((value, i) => {
        const width = value * 330;
        const p = clamp(2 * energy - i);
        if (width * p > 0) api.rect(ctx, x, 820, width * p, 65, colors[i], colors[i], 1);
        if (p === 1 && width > 0) text(ctx, api, '½', x + width / 2, 865, 31, C.panel, 'center');
        x += width;
      });
    }
    if (energy === 1)
      equation(ctx, api, '\\lVert Av_2\\rVert^2=1,\\quad \\sigma_2=1', 960, 945, 44, C.pink);
    else text(ctx, api, 'one unit input → three ticket scores', 960, 945, 32, C.muted, 'center');
  });
  caption(
    ctx,
    api,
    joint === 1
      ? 'The joint row cancels · opposite scores contribute equal squares'
      : 'Use the two single-issue scores to predict the joint row',
  );
}

export default {
  id: 'contrast-output',
  draw: drawContrastOutput,
  cues: ['contrast-scores', 'rollback-score', 'contrast-length', 'contrast-joint'],
};
