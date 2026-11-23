import { trainingStarted } from '../construction.mjs';
import { drawBox, drawText } from '../defaults.mjs';

const gradients = [[10], [-2, -2, -2]];
const sums = gradients.map((row) => row.reduce((a, b) => a + b, 0));
const D = gradients.length;
const N = gradients.flat().length;
const localMeans = sums.map((sum, i) => sum / gradients[i].length);
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const signed = (n) => (n > 0 ? '+' + n : String(n).replace('-', '−'));

export function drawTokens(ctx, scene, state, api) {
  const { C } = api;
  const { beat, beatP } = state;
  const local = beat === 0 && trainingStarted(state, 'tokens-local', beatP > 0.45);
  const summed = beat > 1 || (beat === 1 && trainingStarted(state, 'tokens-sums', beatP > 0.15));
  const pooled = beat > 1 || (beat === 1 && trainingStarted(state, 'tokens-b2-1', beatP > 0.55));
  const scale = beat >= 2 && trainingStarted(state, 'tokens-scale', beatP > 0.25);
  const average = beat >= 2 && trainingStarted(state, 'tokens-average', beatP > 0.55);
  drawText(ctx, api, 'Gradient per supervised token', 455, 274, 35, C.muted);
  api.focus.target('token-rows', () => {
    gradients.forEach((row, r) => {
      const y = 392 + 209 * r,
        color = r ? C.cyan : C.blue;
      drawText(ctx, api, 'Replica ' + r, 155, y + 60, 39, color);
      row.forEach((g, j) => {
        const x = 460 + j * 190;
        drawBox(ctx, api, x, y, 151, 103, color);
        drawText(ctx, api, signed(g), x + 75, y + 71, 52, color, 'center', 'mono');
      });
      const operation = local
        ? 'local mean   ' + signed(localMeans[r])
        : scale
          ? signed(sums[r]) + ' × ½  =  ' + signed((sums[r] * D) / N)
          : summed
            ? 'local sum   ' + signed(sums[r])
            : row.length + (row.length === 1 ? ' target' : ' targets');
      drawText(ctx, api, operation, 1150, y + 67, 42, color);
    });
  });
  api.focus.target('reduction', () => {
    let result = 'Each token contributes one scalar gradient.';
    if (local) result = 'Equal replica weights     (10 − 2) / 2 = ' + mean(localMeans);
    if (beat === 1)
      result = pooled
        ? 'Equal token weights     (10 − 6) / 4 = ' + mean(gradients.flat())
        : 'Equal token weights     (10 − 6) / 4 = ?';
    if (beat >= 2)
      result = average
        ? 'DDP averages     (5 − 3) / 2 = ' + mean(sums.map((v) => (v * D) / N))
        : 'Scale each local loss sum by D / N = 2 / 4';
    drawText(ctx, api, result, 960, 840, 43, C.ink, 'center');
    const question = trainingStarted(state, 'tokens-predict', beatP > 0.75);
    const footer =
      beat === 0 && question
        ? 'What gradient gives each of these four tokens equal weight?'
        : beat >= 2
          ? 'N counts all shifted, unmasked targets in the whole window.'
          : 'Two replicas  ·  four supervised tokens across the whole window';
    drawText(ctx, api, footer, 960, 965, 35, C.yellow, 'center');
  });
}
export default {
  id: 'tokens',
  draw: drawTokens,
  cues: [
    'tokens-local',
    'tokens-predict',
    'tokens-sums',
    'tokens-b2-1',
    'tokens-scale',
    'tokens-average',
  ],
};
