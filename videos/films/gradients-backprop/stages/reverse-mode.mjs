import { connectionEndpoints, drawTransmission } from '../defaults.mjs';
import { cueProgress } from '../latency-ruler.mjs';

export function drawReverseMode(ctx, scene, state, api) {
  const { C, circle, line, text, math, focus } = api;
  const one = { x: 310, r: 37 };
  const weights = Array.from({ length: 6 }, (_, i) => ({ ...one, y: 335 + 97 * i, value: 1 }));
  const sums = [0, 1].map(i => ({
    x: 600, y: 432 + i * 291, r: 48,
    value: weights.slice(3 * i, 3 * i + 3).reduce((total, w) => total + w.value, 0),
  }));
  const total = { x: 875, y: 575, r: 55, value: sums[0].value + sums[1].value };
  const loss = { x: 1140, y: 575, r: 62, value: total.value ** 2 };
  const derivative = 2 * total.value;

  const add = cueProgress(state, api, 'reverse-sums', 0, 0.15, 0.4);
  const save = cueProgress(state, api, 'reverse-total', 0, 0.4, 0.64);
  const squared = cueProgress(state, api, 'scalar-loss-b1-1', 0, 0.65, 0.78);
  const squareBack = cueProgress(state, api, 'reverse-square', 1, 0.18, 0.32);
  const split = cueProgress(state, api, 'reverse-leaves', 1, 0.61, 0.84);

  function edge(from, to, forward, backward) {
    const segment = connectionEndpoints(ctx, api, from, to);
    line(ctx, ...segment.slice(0, 4), C.muted, 2);
    if (state.beat === 0) drawTransmission(ctx, api, segment, forward, false, C.cyan);
    else drawTransmission(ctx, api, segment, backward, true, C.pink);
  }
  function node(id, at, ready, color) {
    focus.target(id, () => {
      circle(ctx, at.x, at.y, at.r, C.panel, color, 3);
      text(ctx, ready ? at.value : '?', at.x, at.y + 12, 36, ready ? color : C.muted, 'center');
    });
  }

  const firstSplit = api.phase(split, 0, 0.45);
  const secondSplit = api.phase(split, 0.45, 1);
  weights.forEach((w, i) => {
    const group = Math.floor(i / 3);
    const collected = api.phase(add, group * 0.5, (group + 1) * 0.5);
    edge(w, sums[group], collected, secondSplit);
    node('reverse-parameter-' + i, w, true, C.blue);
    text(ctx, 'w' + (i + 1), 237, w.y + 10, 29, C.muted, 'right');
    if (secondSplit === 1) text(ctx, derivative, 157, w.y + 10, 33, C.pink, 'center');
  });
  sums.forEach((sum, i) => {
    edge(sum, total, save, firstSplit);
    node('retained-value-' + i, sum, add >= (i + 1) / 2, C.cyan);
    if (firstSplit === 1) text(ctx, derivative, sum.x, sum.y - 75, 34, C.pink, 'center');
  });
  edge(total, loss, squared, squareBack);
  node('stored-total', total, save === 1, C.yellow);
  text(ctx, 'Saved total', total.x, total.y + 116, 32, C.yellow, 'center');
  node('scalar-loss', loss, squared === 1, C.green);
  text(ctx, 'Squared loss', loss.x, loss.y + 116, 32, C.green, 'center');
  focus.target('reverse-factor', () => {
    if (state.beat > 0) text(ctx, '2 × ' + total.value + ' = ' + (squareBack === 1 ? derivative : '?'),
      1005, 429, 43, C.pink, 'center');
  });
  if (secondSplit === 1) text(ctx, '∂L/∂w', 157, 263, 29, C.pink, 'center');

  if (state.beat === 2) {
    const run = cueProgress(state, api, 'finite-forward-runs-b1-2', 2, 0.18, 0.62);
    const runs = weights.map((_, i) => api.phase(run, i / weights.length, (i + 1) / weights.length));
    const completed = runs.filter(progress => progress === 1).length;
    text(ctx, 'One-sided nudges', 1550, 266, 34, C.ink, 'center');
    focus.target('finite-forward-runs', () => {
      weights.forEach((w, i) => {
        const q = runs[i];
        text(ctx, 'w' + (i + 1), 1375, w.y + 10, 29, C.muted, 'right');
        line(ctx, 1410, w.y, 1715, w.y, C.muted, 2);
        if (q > 0) line(ctx, 1410, w.y, 1410 + 305 * q, w.y, C.yellow, 6);
        if (q === 1) {
          line(ctx, 1730, w.y, 1736, w.y + 6, C.yellow, 3);
          line(ctx, 1736, w.y + 6, 1748, w.y - 8, C.yellow, 3);
        }
      });
    });
    math(ctx, String.raw`${completed}/${weights.length}\;\text{extra forward runs}`, 1545, 930, 34, C.yellow, 'center');
    text(ctx, '1 backward pass', 735, 930, 32, C.pink, 'center');
  }
}

export default {
  id: 'reverse-mode',
  draw: drawReverseMode,
  cues: ['reverse-sums', 'reverse-total', 'scalar-loss-b1-1', 'retained-value-0-b2-1',
    'reverse-square', 'reverse-leaves', 'retained-value-0-b3-1', 'finite-forward-runs-b1-2'],
};
