import { motion } from '../construction.mjs';
import { text } from '../defaults.mjs';

function draw(ctx, scene, state, api) {
  api.focus.target('smallest-runtime-mechanism', () => {
    const { C } = api;
    if (state.beat === 2) {
      ['Trainer evaluation', 'Serving evaluation'].forEach((name, i) => {
        const cx = 540 + i * 850;
        text(ctx, api, name, cx, 422, 40, C.ink, 'center');
        text(
          ctx,
          api,
          i ? 'Request alone' : 'Request + approved prefix',
          cx,
          566,
          39,
          C.blue,
          'center',
        );
        api.arrow(ctx, cx, 601, cx, 704, C.muted, 4);
        text(
          ctx,
          api,
          i ? 'Grade generated reply' : 'Score reference token',
          cx,
          800,
          40,
          C.green,
          'center',
        );
      });
      return;
    }
    const steps = ['zero-three', 'zero-two', 'smallest-runtime-b2'];
    ['Weights', 'Gradients', 'Optimizer state', 'Activations', 'Temporaries'].forEach((v, i) => {
      const m =
        state.beat === 1 && i < 3
          ? motion(state, steps[i], 1, (2 - i) * 0.22, (2 - i) * 0.22 + 0.18)
          : 0;
      const height = 300 * (1 - 0.75 * m);
      const x = 150 + 334 * i;
      api.rect(ctx, x, 748 - height, 263, height, i < 3 ? C.blue : C.cyan);
      text(ctx, api, v, x + 131, 821, 33, C.ink, 'center');
    });
    text(
      ctx,
      api,
      state.beat
        ? 'ZeRO sharding   /   illustrative per-device share on four workers'
        : 'Training-state categories   /   schematic sizes',
      960,
      326,
      39,
      C.ink,
      'center',
    );
    text(
      ctx,
      api,
      state.beat
        ? 'Measure activation memory separately.'
        : 'Measure the peak at the chosen precision and context length.',
      960,
      960,
      38,
      C.muted,
      'center',
    );
  });
}

export default {
  id: 'smallest-runtime',
  draw: draw,
  cues: [
    'smallest-runtime-b1',
    'smallest-runtime-b2',
    'zero-two',
    'zero-three',
    'smallest-runtime-b3',
  ],
};
