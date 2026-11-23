import { PARAMETERS } from '../fixtures.mjs';
import { neuralFrame } from '../construction.mjs';
import { equation, focusTarget, head, network } from '../defaults.mjs';
export function drawParameters(ctx, scene, state, api) {
  const { C: themeColors } = api,
    f = neuralFrame(state),
    cueProgress = f.progress,
    resultComplete = f.completed;
  focusTarget(ctx, api, 'parameters-mechanism', () => {
    head(ctx, api, 'Each connection has a weight');
    network(ctx, api, 'parameters', PARAMETERS, {
      x: [2, 5],
      hidden: [0.1, 3.2],
      output: -0.14,
      connectionProgress: cueProgress('count-connections', 0),
      biasProgress: cueProgress('count-biases', 1),
    });
    focusTarget(ctx, api, 'parameter-total', () => {
      equation(
        ctx,
        api,
        resultComplete('nine-parameters', 1)
          ? String.raw`6\ \text{weights}+3\ \text{biases}=9\ \text{parameters}`
          : resultComplete('six-weights', 0)
            ? String.raw`2\cdot2+1\cdot2=6\ \text{connection weights}`
            : String.raw`\text{How many weights?}`,
        960,
        1000,
        40,
        themeColors.yellow,
      );
    });
    return;
  });
}
export default {
  id: 'parameters',
  draw: drawParameters,
  cues: ['count-connections', 'six-weights', 'count-biases', 'nine-parameters'],
};
