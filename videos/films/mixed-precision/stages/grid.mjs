import { operation } from '../construction.mjs';
import { above, below, drawWeightLane } from '../weight-ruler.mjs';

export function drawGrid(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  api.text(ctx, 'FP16 neighbors of 1', 110, 264, 40, C.ink);
  api.focus.target('midpoints', () => {
    api.text(ctx, 'Halfway down  ≈  0.000244', 960, 264, 34, C.pink, 'center');
    api.text(ctx, 'Halfway up  ≈  0.000488', 1735, 264, 34, C.pink, 'right');
  });
  for (const [index, delta] of [-0.0003, 0.0003].entries()) {
    const subtract = index === 0;
    const y = 505 + index * 270;
    const requested = beat > 0 ? 1 : operation(state, 'both-directions');
    const landing =
      beat === 0 ? 0 : beat === 1 ? operation(state, subtract ? 'round-down' : 'round-up') : 1;
    api.focus.target(subtract ? 'subtract' : 'add', () => {
      const { destination, storedX } = drawWeightLane(ctx, api, {
        label: subtract ? 'Subtract' : 'Add',
        y,
        half: true,
        color: C.blue,
        delta,
        requested,
        landing,
        midpoints: true,
      });
      const claim =
        landing === 1
          ? 'Stored   ' + (destination === 1 ? '1' : destination.toFixed(8))
          : (subtract ? '1 − ' : '1 + ') + Math.abs(delta);
      api.text(
        ctx,
        claim,
        landing === 1 ? storedX : 830,
        y - 122,
        35,
        landing === 1 ? C.blue : C.yellow,
        'center',
      );
    });
  }
  const gaps =
    beat === 2
      ? 'FP16 gap below 1  =  ' +
        (1 - below).toFixed(8) +
        '       Gap above 1  =  ' +
        (above - 1).toFixed(8)
      : beat === 0
        ? 'Pink ticks mark the midpoints. Which sign changes the weight?'
        : 'Compare the distance to the midpoint in the direction of the step.';
  api.text(ctx, gaps, 960, 995, 35, C.ink, 'center');
}
export default { id: 'grid', draw: drawGrid, cues: ['both-directions', 'round-down', 'round-up'] };
