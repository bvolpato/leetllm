import { operationProgress, resultAfter } from '../../../lib/lesson-definition.mjs';
import { drawLeftText, drawText } from '../defaults.mjs';

const calls = [
  { argument: '1.0', value: 1, weak: true, trace: 'A' },
  { argument: 'jnp.float32(1)', value: 1, weak: false, trace: 'B' },
  { argument: 'jnp.float32(2)', value: 2, weak: false, trace: 'B' },
];

export function drawWeakTyping(ctx, scene, state, api) {
  const { C } = api;
  const reuse = resultAfter(state, 'weak-reuse');
  api.text(ctx, 'jax.jit(lambda x: x + 1)', 130, 287, 53, C.ink, 'left', 'mono');
  api.focus.target('weak-calls', () => {
    const columns = [150, 778, 1145, 1450, 1710];
    ['Input', 'Shape / dtype', 'Weak type', 'Trace', 'Output'].forEach((label, i) =>
      drawText(ctx, api, label, i === 0 ? columns[0] + 58 : columns[i], 425, 34, C.muted),
    );
    api.line(ctx, 140, 455, 1800, 455, C.muted, 2);
    calls.forEach(({ argument, value, weak, trace }, i) => {
      if (i === 1 && !operationProgress(state, 'weak-second')) return;
      if (i === 2 && !operationProgress(state, 'weak-third')) return;
      const cy = 554 + 155 * i;
      const linked = i < 2 || reuse;
      const returned = resultAfter(state, i === 2 ? 'weak-output' : 'weak-results');
      const color = weak ? C.blue : C.cyan;
      drawLeftText(ctx, api, argument, columns[0], cy, 50, color);
      drawText(ctx, api, '()   float32', columns[1], cy, 42, C.ink);
      drawText(ctx, api, String(weak), columns[2], cy, 45, color);
      drawText(ctx, api, linked ? trace : '?', columns[3], cy, 56, linked ? color : C.muted);
      drawText(
        ctx,
        api,
        returned ? value + 1 : '?',
        columns[4],
        cy,
        60,
        returned ? C.green : C.muted,
      );
    });
    if (reuse) api.line(ctx, 1513, 700, 1513, 842, C.cyan, 4);
  });
}
export default {
  id: 'weak-typing',
  draw: drawWeakTyping,
  cues: ['weak-first', 'weak-second', 'weak-results', 'weak-third', 'weak-reuse', 'weak-output'],
};
