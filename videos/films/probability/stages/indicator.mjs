import { cueProgress } from '../construction.mjs';
import { focus, line, rectangle, text } from '../defaults.mjs';

const prior = 0.01;
const labels = [1, 0];
const shares = [prior, 1 - prior];

export function drawIndicatorStage(ctx, scene, state, api) {
  const { C } = api;
  const variance = state.beat > 0;
  const square = cueProgress(state, 'variance-squares', 1);
  const weight = cueProgress(state, 'variance-weights', 1);
  focus(api, 'indicator-arithmetic', () => {
    labels.forEach((value, i) => {
      const center = 535 + 850 * i;
      const color = value ? C.red : C.blue;
      const distance = Math.abs(value - prior);
      const side = distance * 227 * square;
      const squareValue = distance ** 2;
      text(ctx, api, value ? 'Abusive signup' : 'Clean signup', center, 288, 47, color);
      text(ctx, api, 'Y = ' + value, center, 392, 62);
      if (variance) {
        if (side > 0) rectangle(ctx, api, center - side / 2, 686 - side, side, side, color);
        line(ctx, api, center - 154, 689, center + 154, 689, C.muted, 2);
        text(ctx, api, 'Distance from 0.01   ' + distance.toFixed(2), center, 761, 39);
        if (weight === 1)
          text(ctx, api, shares[i] + ' × ' + squareValue.toFixed(4) + ' = ' +
            (shares[i] * squareValue).toFixed(6), center, 852, 36, color);
      } else {
        const tileWidth = 584, x = center - tileWidth / 2;
        rectangle(ctx, api, x, 520, tileWidth, 76, C.panel);
        rectangle(ctx, api, x, 520, tileWidth * shares[i], 76, color);
        text(ctx, api, (100 * shares[i]).toFixed(0) + '% of all signups', center, 687, 41, color);
      }
    });
    if (variance) {
      if (cueProgress(state, 'indicator-variance', 1) === 1)
        text(ctx, api, 'Variance   ' + (prior * (1 - prior)).toFixed(4) + '   =   p(1 − p)', 960, 987, 50, C.yellow);
    } else {
      const mean = cueProgress(state, 'indicator-mean', 0) === 1;
      text(ctx, api, mean ? '1 × 0.01  +  0 × 0.99  =  0.01' : 'Average label across all signups', 960, 916, 52, C.yellow);
    }
  });
}
export default { id: 'indicator', draw: drawIndicatorStage, cues: ['indicator-mean', 'indicator-variance', 'variance-squares', 'variance-weights'] };
