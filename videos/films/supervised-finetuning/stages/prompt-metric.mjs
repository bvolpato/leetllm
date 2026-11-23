import { motion } from '../construction.mjs';
import { text } from '../defaults.mjs';

function draw(ctx, scene, state, api) {
  api.focus.target('prompt-metric-mechanism', () => {
    const { C } = api;
    const prefix = [0.03, 0.04, 0.02, 0.05, 0.03],
      reply = [2.2, 1.8];
    const added = Math.ceil(5 * motion(state, 'prompt-combined', 0, 0.25, 0.5));
    const values = [...prefix.slice(0, added), ...reply];
    const total = values.reduce((a, b) => a + b, 0);
    [...prefix, ...reply].forEach((v, i) => {
      const x = 260 + 227 * i;
      const color = i >= 5 ? C.green : i < added ? C.blue : C.muted;
      api.rect(ctx, x - 63, 710 - 130 * v, 126, 130 * v, color);
      text(ctx, api, v.toFixed(2), x, 672 - 130 * v, 33, color, 'center');
      text(ctx, api, i < 5 ? 'prompt' : 'answer', x, 770, 28, color, 'center');
    });
    text(ctx, api, 'Supplied token losses', 140, 301, 35, C.muted);
    const answerMean = reply.reduce((a, b) => a + b, 0) / reply.length;
    text(ctx, api, 'Answer mean  ' + answerMean.toFixed(3), 1450, 887, 40, C.green, 'center');
    if (added > 0)
      text(
        ctx,
        api,
        'Combined  ' +
          total.toFixed(2) +
          ' / ' +
          values.length +
          ' ≈ ' +
          (total / values.length).toFixed(3),
        650,
        887,
        40,
        C.blue,
        'center',
      );
    if (state.beat === 1)
      text(
        ctx,
        api,
        'At larger scale   800 / 830 ≈ ' +
          Math.round((100 * 800) / 830) +
          '% of scored positions are prompt tokens.',
        960,
        988,
        32,
        C.ink,
        'center',
      );
  });
}

export default {
  id: 'prompt-metric',
  draw: draw,
  cues: ['prompt-metric-b1', 'prompt-combined', 'prompt-metric-b2'],
};
