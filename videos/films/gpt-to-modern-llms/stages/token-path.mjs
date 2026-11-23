import { hidden, initialWeights, vocabulary } from '../fixtures.mjs';
import { phraseProgress, phraseEnded } from '../arithmetic.mjs';
import { outputProjection } from '../model.mjs';
import { text } from '../defaults.mjs';

export function drawTokenPath(ctx, scene, state, api) {
  const { C } = api;
  const b = state.beat;
  const output = outputProjection();
  const showScores = b > 0 || phraseEnded(state, 'add-products', 0.7);
  const showProb = b > 1 || (b === 1 && phraseProgress(state, 'normalize-scores', 0.12, 0.43) > 0);
  const reveal = b === 2 && phraseEnded(state, 'pick-docs', 0.27);
  text(ctx, api, 'Last position', 210, 283, 31, C.muted);
  text(
    ctx,
    api,
    'h = [' + hidden.map((x) => x.toFixed(2)).join(', ') + ']',
    210,
    375,
    55,
    C.yellow,
  );
  text(ctx, api, 'Output row', 210, 476, 35, C.muted);
  text(ctx, api, 'Weights', 620, 476, 35, C.muted);
  text(ctx, api, 'Score', 962, 476, 35, C.muted);
  api.focus.target('probability-rows', () => text(ctx, api, 'Probability', 1260, 476, 35, C.muted));
  vocabulary.forEach((v, i) => {
    const y = 563 + i * 89;
    const weights = initialWeights[i];
    const chosen = reveal && v === output.selected;
    text(ctx, api, v === '.' ? '.  (period)' : v, 210, y, 42, chosen ? C.green : C.ink);
    text(ctx, api, '[' + weights.map((x) => x.toFixed(1)).join(', ') + ']', 620, y, 39, C.blue);
    text(ctx, api, showScores ? output.logits[i].toFixed(2) : '·', 962, y, 42, C.ink);
    if (showProb) {
      api.rect(
        ctx,
        1260,
        y - 33,
        665 * output.probabilities[i],
        33,
        chosen ? C.green : C.blue,
        null,
        3,
      );
      text(ctx, api, output.probabilities[i].toFixed(3), 1630, y, 34);
    }
  });
  const products = initialWeights[0].map((w, i) => w * hidden[i]);
  const line =
    b === 0
      ? 'Docs    ' +
        products.map((x) => x.toFixed(2)).join('  +  ') +
        '   =   ' +
        (showScores ? output.logits[0].toFixed(2) : '?')
      : b === 1
        ? 'Which token would greedy decoding take?'
        : reveal
          ? 'Label:      ' + output.selected
          : 'Label:      ▏';
  api.focus.target('projection-readout', () =>
    text(ctx, api, line, 960, 973, 47, C.yellow, 'center'),
  );
}
export default {
  id: 'token-path',
  draw: drawTokenPath,
  cues: ['add-products', 'normalize-scores', 'pick-docs'],
};
