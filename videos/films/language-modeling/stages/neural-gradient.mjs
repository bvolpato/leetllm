import { cueAmount } from '../construction.mjs';
import { localGradientCredit } from '../model.mjs';
import { card, target, text } from '../defaults.mjs';

const tokens = ['A', 'B', 'C'];
const signed = (value) => Number(value.toFixed(2)).toString().replace('-', '−');

export function drawNeuralGradient(ctx, scene, state, api) {
  const { C } = api,
    beat = state.beat ?? 0;
  const m = localGradientCredit();
  const back = cueAmount(state, 1, 'gradient-subtract', 0.12, 0.43);
  if (beat < 2) {
    const marked = cueAmount(state, 0, 'gradient-target', 0.28, 0.49);
    const zero = 1050,
      unit = 535;
    text(ctx, api, 'Three possible next tokens', 170, 252, 39, C.ink);
    for (const [i, p] of m.probabilities.entries()) {
      const y = 413 + 185 * i,
        observed = i === m.target;
      const g = p - (observed ? back : 0);
      target(ctx, api, 'gradient-token-' + i, () => {
        card(
          ctx,
          api,
          tokens[i],
          170,
          y - 39,
          112,
          77,
          observed && marked > 0 ? C.yellow : C.blue,
          40,
        );
        if (observed && marked > 0) text(ctx, api, 'observed', 307, y + 11, 32, C.yellow);
        api.line(ctx, zero - unit, y, zero + unit, y, C.muted, 2);
        api.line(ctx, zero, y - 14, zero, y + 14, C.muted, 4);
        api.circle(ctx, zero + unit * p, y, 12, C.blue);
        text(ctx, api, 'p = ' + p.toFixed(1), zero + unit * p, y + 59, 34, C.blue, 'center');
        if (back > 0) {
          if (observed) api.line(ctx, zero + unit * g, y, zero + unit * p - 15, y, C.yellow, 4);
          api.circle(ctx, zero + unit * g, y, 7, C.yellow);
          if (back === 1)
            text(ctx, api, 'g = ' + signed(g), zero + unit * g, y - 32, 36, C.yellow, 'center');
        }
      });
    }
    for (const n of [-1, 0, 1])
      text(ctx, api, signed(n), zero + n * unit, 906, 31, C.muted, 'center');
    if (back === 1)
      text(
        ctx,
        api,
        'Logit gradient = probability − target indicator',
        960,
        1002,
        40,
        C.ink,
        'center',
      );
    return;
  }

  const column = cueAmount(state, 2, 'gradient-column', 0.28, 0.56);
  const all = cueAmount(state, 2, 'gradient-all', 0.68, 0.83);
  const dx = cueAmount(state, 3, 'gradient-input', 0.11, 0.4);
  const left = 550,
    stride = 390;
  text(ctx, api, 'Two input features, three output scores', 160, 245, 37, C.ink);
  for (const [j, g] of m.residual.entries()) {
    const x = left + j * stride;
    target(ctx, api, 'gradient-column-' + j, () => {
      text(
        ctx,
        api,
        tokens[j] + '     g = ' + signed(g),
        x + 150,
        333,
        39,
        j === m.target ? C.yellow : C.blue,
        'center',
      );
      m.input.forEach((_, i) => {
        const y = 411 + i * 202;
        card(ctx, api, 'W = ' + signed(m.weights[i][j]), x, y, 300, 75, C.blue, 34);
        const show = j === m.target ? column > i / 2 : all > (i * 2 + j) / 4;
        if (show)
          text(
            ctx,
            api,
            'dW = ' + signed(m.weightGradients[i][j]),
            x + 150,
            y + 132,
            36,
            C.green,
            'center',
          );
      });
    });
  }
  for (const [i, v] of m.input.entries()) {
    const y = 411 + i * 202;
    text(ctx, api, 'Feature ' + (i + 1) + ' = ' + signed(v), 160, y + 50, 39, C.cyan);
  }
  target(ctx, api, 'gradient-back', () => {
    if (beat === 2) {
      text(
        ctx,
        api,
        'Each weight gradient = its input feature × its output gradient',
        160,
        902,
        40,
        C.ink,
      );
      if (column === 1)
        text(
          ctx,
          api,
          'Bias of C receives ' + signed(m.residual[m.target]),
          160,
          982,
          34,
          C.yellow,
        );
    } else {
      text(ctx, api, 'Back to feature 1', 160, 853, 35, C.muted);
      const terms = m.weights[0].map(
        (w, j) => '(' + signed(w) + ' × ' + signed(m.residual[j]) + ')',
      );
      text(
        ctx,
        api,
        terms.join(' + ') + (dx === 1 ? ' = ' + signed(m.inputGradient[0]) : ''),
        160,
        925,
        42,
        C.cyan,
      );
      if (dx === 1)
        text(ctx, api, 'Feature 2 receives ' + signed(m.inputGradient[1]), 160, 998, 34, C.cyan);
    }
  });
}

export default {
  id: 'neural-gradient',
  draw: drawNeuralGradient,
  cues: [
    'gradient-target',
    'gradient-subtract',
    'gradient-column',
    'gradient-all',
    'gradient-input',
  ],
};
