import { sceneClock } from '../desk.mjs';
import { backpropagationStep } from '../model.mjs';

const initial = backpropagationStep({ progress: 0 });
const vector = (row) => '[' + row.map((value) => Number(value.toFixed(3))).join(',  ') + ']';

export function drawEmbeddingBackward(ctx, scene, state, api) {
  const clock = sceneClock(scene, state);
  const { C } = api;
  const step = backpropagationStep({ progress: clock.progress('gradient-update') });
  const frozen = backpropagationStep({ trainEmbeddings: false });
  const branch = state.beat >= 3;
  api.focus.target('backward-work', () => {
    api.text(ctx, 'Token', 130, 292, 30, C.muted);
    api.text(ctx, 'Embedding', 380, 292, 30, C.muted);
    api.text(ctx, 'Gradient', 748, 292, 30, C.muted);
    ['Padding', 'key', 'disabled', 'Unused'].forEach((name, i) => {
      const y = 394 + i * 103;
      const live = i === 1 || i === 2;
      const color = live ? C.ink : C.muted;
      api.text(ctx, name, 130, y, 39, color);
      api.text(
        ctx,
        vector(step.embeddings[i]),
        380,
        y,
        41,
        live && state.beat >= 2 ? C.cyan : color,
      );
      if (clock.after('gradient-split'))
        api.text(ctx, vector(initial.de[i]), 748, y, 35, live ? C.yellow : C.muted);
      api.line(ctx, 130, y + 28, 1015, y + 28, C.muted, 1.5);
    });
    if (!branch) {
      api.text(ctx, 'Target  [0, 1]     /     logits  [2, 1]', 1110, 292, 33, C.muted);
      api.text(
        ctx,
        'Loss = −ln(p₁) ≈ ' + (-Math.log(initial.p[1])).toFixed(3),
        1110,
        397,
        40,
        C.ink,
      );
      if (clock.after('gradient-logits'))
        api.text(ctx, 'p − target ≈ ' + vector(initial.dz), 1110, 505, 37, C.cyan);
      if (clock.after('gradient-pool')) {
        api.text(ctx, 'Original W', 1110, 606, 29, C.muted);
        api.text(ctx, vector(initial.w[0]) + '     ' + vector(initial.w[1]), 1110, 660, 36, C.ink);
        api.text(ctx, 'Wᵀ (p − target) ≈ ' + vector(initial.dh), 1110, 755, 34, C.yellow);
      }
      const lesson = clock.after('gradient-split')
        ? 'Each live row receives ½ of the pooled gradient'
        : state.beat === 1
          ? 'Two live words share the mean. What reaches each word?'
          : 'The head passes the error back into the pooled vector.';
      api.text(ctx, lesson, 130, 868, 39, C.ink);
      if (clock.progress('gradient-update') > 0)
        api.text(ctx, 'New embedding = original embedding − 0.1 × gradient', 130, 970, 35, C.cyan);
    }
  });
  if (branch)
    api.focus.target('branch-scores', () => {
      api.text(ctx, 'Same updated head and bias', 1090, 292, 36, C.ink);
      api.text(ctx, 'W    ' + step.weights.map(vector).join('   '), 1090, 399, 32, C.muted);
      api.text(ctx, 'b     ' + vector(step.bias), 1090, 450, 32, C.muted);
      [
        [frozen, 'Frozen', 'gradient-frozen'],
        [step, 'Trainable', 'gradient-trained'],
      ].forEach(([g, label, cue], i) => {
        const y = 591 + i * 135;
        api.text(ctx, label + '    h = ' + vector(g.pooled), 1090, y, 35, C.ink);
        api.text(
          ctx,
          'Review score   ' + (clock.after(cue) ? g.probabilities[1].toFixed(3) : '?'),
          1090,
          y + 54,
          36,
          clock.after(cue) ? C.cyan : C.muted,
        );
      });
      api.text(ctx, 'One SGD step from the same two word vectors', 130, 965, 35, C.muted);
    });
}

export default {
  id: 'embedding-backward',
  draw: drawEmbeddingBackward,
  cues: [
    'gradient-logits',
    'gradient-pool',
    'gradient-ask',
    'gradient-split',
    'gradient-update',
    'gradient-frozen',
    'gradient-trained',
  ],
};
