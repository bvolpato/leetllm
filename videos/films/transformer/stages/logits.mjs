import { VOCAB, WOUT } from '../fixtures.mjs';
import { lerpRow, sum } from '../arithmetic.mjs';
import { MODEL, choiceFrame } from '../model.mjs';
import { caption, row, target, text, weights, withTransformerLegacyFrame } from '../defaults.mjs';
export function paintLogits(ctx, scene, state, api, C, b, P, f) {
  const current = choiceFrame(state);
  target(ctx, api, 'final-state', () => {
    text(ctx, api, C, 'the · final normalized state', 960, 290, 31, C.yellow, 'center');
    row(
      ctx,
      api,
      C,
      f,
      lerpRow(MODEL.Z[2], MODEL.final[2], current.normalized),
      480,
      330,
      960,
      C.yellow,
      78,
      3,
    );
  });
  if (b === 0) {
    const active = current.scoreCount ? Math.min(5, current.scoreCount - 1) : 3;
    text(ctx, api, C, VOCAB[active] + ' output weights', 350, 535, 29, C.cyan, 'center');
    row(ctx, api, C, f, WOUT[active], 640, 480, 1000, C.cyan, 78);
    target(ctx, api, 'result-products', () => {
      const products = MODEL.final[2].map((v, i) => v * WOUT[active][i]);
      row(
        ctx,
        api,
        C,
        f,
        products.map((v, i) => (i < current.productCount ? v : null)),
        640,
        610,
        1000,
        C.green,
        66,
        3,
      );
      text(
        ctx,
        api,
        C,
        current.resultKnown ? 'sum ≈ ' + f(MODEL.logits[active], 3) : 'complete the four products',
        350,
        653,
        27,
        C.green,
        'center',
      );
    });
    target(ctx, api, 'vocabulary-logits', () => {
      row(
        ctx,
        api,
        C,
        f,
        MODEL.logits.map((v, i) =>
          i < current.scoreCount || (i === 3 && current.resultKnown) ? v : null,
        ),
        180,
        800,
        1560,
        C.cyan,
        85,
        3,
      );
      VOCAB.forEach((s, i) => text(ctx, api, C, s, 306 + i * 260, 940, 25, C.muted, 'center'));
    });
  } else {
    VOCAB.forEach((s, i) => text(ctx, api, C, s, 306 + i * 260, 495, 25, C.cyan, 'center'));
    row(
      ctx,
      api,
      C,
      f,
      MODEL.exps.map((v, i) => (i < current.expCount ? v : null)),
      180,
      525,
      1560,
      C.cyan,
      76,
      3,
    );
    target(ctx, api, 'softmax-denominator', () =>
      text(
        ctx,
        api,
        C,
        'shared total ≈ ' + f(sum(MODEL.exps.slice(0, current.expCount)), 3),
        960,
        680,
        32,
        C.yellow,
        'center',
      ),
    );
    weights(
      ctx,
      api,
      C,
      MODEL.probs,
      VOCAB,
      755,
      'next-token-probabilities',
      [C.blue, C.pink, C.cyan, C.green, C.muted, C.yellow],
      current.shareCount,
    );
    target(ctx, api, 'chosen-token', () =>
      text(
        ctx,
        api,
        C,
        current.choice === null ? 'Your greedy choice?' : 'result · ID ' + current.choice,
        960,
        940,
        37,
        current.choice === null ? C.muted : C.green,
        'center',
      ),
    );
  }
  caption(
    ctx,
    api,
    C,
    'A six-entry toy vocabulary · output weights are separate from input embeddings',
  );
}
export function drawLogitsStage(ctx, scene, state, api) {
  withTransformerLegacyFrame(ctx, scene, state, api, paintLogits);
}
export default {
  id: 'logits',
  draw: drawLogitsStage,
  cues: [
    'final-normalization',
    'result-product',
    'vocabulary-products',
    'next-token-probabilities-b2-1',
    'probability-shares',
    'greedy-choice',
  ],
};
