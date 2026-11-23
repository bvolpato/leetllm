import { LOGITS, UPDATED } from '../fixtures.mjs';
import { phase } from '../arithmetic.mjs';
import { temperatureCueState } from '../model.mjs';
import {
  bars,
  drawText,
  equation,
  header,
  target,
  withSoftmaxOriginalFrame,
} from '../defaults.mjs';
import { stableSoftmax, lerpArray } from 'vizmatic';
export function paintSoftmaxOriginalTemperature(
  ctx,
  scene,
  state,
  api,
  C,
  b,
  p,
  cues,
  colors,
  xs,
  amount,
  starts,
) {
  const v = temperatureCueState(
    b,
    amount('temperature-distribution-b1-1'),
    amount('temperature-higher-b1-2'),
    amount('temperature-distribution-b2-1'),
  );
  const temperature = b === 2 ? 0.35 + 0.65 * amount('temperature-restore') : v.temperature;
  const logits =
    b === 2
      ? lerpArray(LOGITS, UPDATED, amount('temperature-learned', phase(p, 0.4, 0.7)))
      : LOGITS;
  const probabilities = stableSoftmax(logits, temperature);
  header(ctx, api, C, 'Temperature ' + temperature.toFixed(2) + ' · observed target: slept');
  drawText(
    ctx,
    api,
    C,
    b === 2 && amount('temperature-learned', phase(p, 0.4, 0.7)) > 0
      ? 'Learning changes the scores'
      : 'Original scores · ran leads',
    960,
    365,
    33,
    C.yellow,
    'center',
  );
  target(ctx, api, 'temperature-distribution', () => bars(ctx, api, colors, probabilities));
  equation(
    ctx,
    api,
    C,
    'p_i(T)=\\frac{e^{z_i/T}}{\\sum_j e^{z_j/T}}\\quad T>0',
    960,
    1010,
    45,
    C.cyan,
  );
}
export function drawTemperatureStage(ctx, scene, state, api) {
  withSoftmaxOriginalFrame(ctx, scene, state, api, paintSoftmaxOriginalTemperature);
}
export default {
  id: 'temperature',
  draw: drawTemperatureStage,
  cues: [
    'temperature-distribution-b1-1',
    'temperature-higher-b1-2',
    'temperature-distribution-b2-1',
    'temperature-restore',
    'temperature-learned',
  ],
};
