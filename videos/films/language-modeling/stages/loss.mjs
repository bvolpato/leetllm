import { cueAmount } from '../construction.mjs';
import { SENTENCE, SPLIT_CAT, TARGET_PROBS } from '../fixtures.mjs';
import { lossConstructionState } from '../model.mjs';
import { target, text } from '../defaults.mjs';

export function drawLoss(ctx, scene, state, api) {
  const { C } = api,
    beat = state.beat ?? 0;
  const v = lossConstructionState(beat, state.beatP ?? 0, state.cues);
  const x = 210,
    width = 1500,
    height = 76;
  const colors = [C.blue, C.green, C.pink, C.yellow];
  const split = cueAmount(state, 2, 'loss-resegment', 0.21, 0.51);
  const divide = cueAmount(state, 3, 'loss-five', 0.04, 0.36);
  const firstPart = -Math.log(SPLIT_CAT[0]);
  const totalLabel = 'Total loss   ' + v.sum.toFixed(3) + ' nats';
  function band(y, copy) {
    api.rect(ctx, x, y, width, height, C.panel, C.muted, 2);
    let left = x;
    for (const [i, term] of v.terms.entries()) {
      const w = (width * term) / v.sum,
        center = left + w / 2;
      const filled = copy ? 1 : v.progressByTerm[i];
      if (filled > 0) api.rect(ctx, left, y, w * filled, height, colors[i]);
      if (copy && i === 1 && split > 0) {
        const seam = left + (width * firstPart) / v.sum;
        api.line(ctx, seam, y, seam, y + height * split, C.bg, 7);
        if (split === 1) {
          for (const [j, mid] of [(left + seam) / 2, (seam + left + w) / 2].entries()) {
            text(
              ctx,
              api,
              ['c', 'at'][j] + '   ' + SPLIT_CAT[j].toFixed(2),
              mid,
              y - 24,
              34,
              C.green,
              'center',
            );
            text(ctx, api, (-Math.log(SPLIT_CAT[j])).toFixed(3), mid, y + 52, 37, C.bg, 'center');
          }
        }
      } else {
        text(
          ctx,
          api,
          SENTENCE[i] + '   ' + TARGET_PROBS[i].toFixed(2),
          center,
          y - 24,
          36,
          colors[i],
          'center',
        );
        if (filled === 1) text(ctx, api, term.toFixed(3), center, y + 52, 38, C.bg, 'center');
      }
      left += w;
    }
  }

  text(ctx, api, 'Recorded targets and their probabilities', x, 238, 32, C.muted);
  target(ctx, api, 'loss-bars', () => band(344, false));
  target(ctx, api, 'loss-mean', () => {
    const mean = v.sum.toFixed(3) + ' nats ÷ 4 targets = ' + v.mean.toFixed(3) + ' nats per target';
    text(
      ctx,
      api,
      v.meanReady ? mean : 'Mean NLL: pending',
      x,
      505,
      36,
      v.meanReady ? C.ink : C.muted,
    );
  });
  target(ctx, api, 'loss-perplexity', () => {
    if (v.perplexityReady)
      text(ctx, api, 'PPL  ' + v.perplexity.toFixed(3), x + width, 507, 46, C.cyan, 'right');
    else if (beat === 1) text(ctx, api, 'PPL  ?', x + width, 507, 42, C.muted, 'right');
  });
  if (beat < 2) {
    if (v.progressByTerm.every((n) => n === 1)) {
      api.line(ctx, x, 592, x + width, 592, C.muted, 2);
      text(ctx, api, totalLabel, x + width / 2, 684, 60, C.ink, 'center');
      text(ctx, api, '−ln P(The cat sat, end)', x + width / 2, 763, 38, C.muted, 'center');
    }
    return;
  }
  target(ctx, api, 'loss-resegmentation', () => band(700, true));
  const lowerCount = split === 1 ? 5 : 4;
  text(ctx, api, 'Same text and stop token', x, 596, 33, C.muted);
  target(ctx, api, 'loss-divisor', () => {
    const mean = v.sum / lowerCount;
    const result = divide === 1 ? ' = ' + mean.toFixed(3) + ' nats per target' : '';
    text(
      ctx,
      api,
      v.sum.toFixed(3) + ' nats ÷ ' + lowerCount + ' targets' + result,
      x,
      858,
      36,
      C.ink,
    );
    if (divide === 1)
      text(ctx, api, 'PPL  ' + Math.exp(mean).toFixed(3), x + width, 860, 46, C.cyan, 'right');
  });
  const product = TARGET_PROBS.reduce((a, b) => a * b, 1);
  text(ctx, api, 'P(The cat sat, end) = ' + product.toFixed(4), x, 967, 37, C.yellow);
  if (split === 1) text(ctx, api, '0.75 × 0.80 = 0.60', x + width, 967, 37, C.green, 'right');
}

export default {
  id: 'loss',
  draw: drawLoss,
  cues: ['loss-terms', 'loss-mean', 'loss-perplexity', 'loss-resegment', 'loss-five'],
};
