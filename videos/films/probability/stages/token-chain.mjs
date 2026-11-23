import { cueProgress } from '../construction.mjs';
import { focus, rectangle, text } from '../defaults.mjs';

const tokens = ['rain', 'fell', 'here'];
const probs = [0.5, 0.2, 0.1];
const losses = probs.map(p => -Math.log(p));
const product = probs.reduce((a, b) => a * b);
const meanLoss = losses.reduce((a, b) => a + b) / tokens.length;

export function drawTokenChain(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  const q = (id, b) => cueProgress(state, id, b);
  focus(api, 'token-chain-result', () => {
    if (beat === 2) {
      const n = Math.floor(200 * q('underflow-chain', 2));
      const log = n * Math.log(0.01);
      const raw = 0.01 ** n;
      const plot = api.teaching.axes({
        x: 280, y: 365, width: 1300, height: 352,
        xDomain: [0, 200], yDomain: [-1000, 0],
        xTicks: [0, 100, 200], yTicks: [-1000, -500, 0],
        xLabel: 'Tokens scored', yLabel: 'Log probability', fontSize: 30,
      });
      api.teaching.curve({ plot, points: [{ x: 0, y: 0 }, { x: n, y: log }], color: C.cyan, width: 5 });
      const at = plot.point(n, log);
      api.circle(ctx, at.x, at.y, 10, C.cyan);
      text(ctx, api, 'Each observed token has probability 0.01', 960, 266, 42);
      text(ctx, api, 'Product in binary64    ' + (raw === 0 ? '0' : raw.toExponential(2)), 545, 881, 39, C.yellow);
      text(ctx, api, 'Sum of logs    ' + log.toFixed(2), 1400, 881, 39, C.cyan);
      if (n === 200) api.math(ctx, 'P=10^{-400}', 960, 987, 48, C.ink, 'center');
      return;
    }

    const ready = Math.floor(q('chain-factors', 0) * 3);
    const scored = beat >= 3;
    text(ctx, api, 'Observed line   “rain fell here”', 960, 273, 47);
    tokens.forEach((token, i) => {
      const x = 218 + i * 540;
      const color = i < ready ? C.cyan : C.muted;
      text(ctx, api, i ? 'After “' + tokens.slice(0, i).join(' ') + '”' : 'At the start', x + 200, 397, 39, C.muted);
      rectangle(ctx, api, x, 443, 400, 128, C.panel, color);
      text(ctx, api, token, x + 200, 530, 57, color);
      if (i < ready) text(ctx, api, 'p = ' + probs[i].toFixed(1), x + 200, 661, 45);
      if (scored) text(ctx, api, losses[i].toFixed(3) + ' nats', x + 200, 752, 42, C.cyan);
    });
    if (scored) {
      const scoredMean = q('token-loss', 3) === 1;
      text(ctx, api, scoredMean ? 'Mean loss    ' + meanLoss.toFixed(3) + ' nats per token' : 'Total loss    ' + (-Math.log(product)).toFixed(3) + ' nats',
        960, 882, 49, C.yellow);
      if (q('perplexity', 3) === 1) text(ctx, api, 'Perplexity    exp(mean loss) ≈ ' + Math.exp(meanLoss).toFixed(2), 960, 984, 43);
    } else {
      const answer = q('chain-answer', 1) === 1;
      text(ctx, api, answer ? '0.5 × 0.2 × 0.1 = ' + product.toFixed(2) : 'Probability of the full line?', 960, 873, 54, C.yellow);
      if (answer) text(ctx, api, 'Each factor uses all the words to its left', 960, 980, 39, C.muted);
    }
  });
}
export default { id: 'token-chain', draw: drawTokenChain, cues: ['chain-factors', 'chain-answer', 'underflow-chain', 'token-loss', 'perplexity'] };
