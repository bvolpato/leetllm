import { ALL } from '../fixtures.mjs';
import { drawExtendedBox as box, text } from '../defaults.mjs';
import { after, cue } from '../score-trace.mjs';

const logits = [2, 1, 4, 0];
const probabilities = logits.map((x) => Math.exp(x - ALL.maximum) / ALL.denominator);
const center = (i) => 545 + 319 * i;

export function drawNormalizerOutput(ctx, scene, state, api) {
  const { C } = api;
  if (state.beat === 2) {
    const allMasked = after(state, 'prob-mask', 2, 0.33);
    const empty = after(state, 'prob-empty', 2, 0.61);
    api.focus.target('mask-board', () => {
      text(ctx, api, 'Input logits', 284, 467, 36, C.ink);
      [2, null, 4, 0].forEach((value, i) => {
        const masked = allMasked || value === null;
        box(
          ctx,
          api,
          masked ? 'None' : value,
          center(i) - 97,
          405,
          194,
          98,
          masked ? C.muted : C.blue,
          42,
        );
      });
      text(
        ctx,
        api,
        allMasked
          ? 'All four masked   ·   no distribution to emit'
          : 'Masked positions contribute zero mass.',
        960,
        685,
        49,
        allMasked ? C.yellow : C.cyan,
      );
      if (empty)
        text(
          ctx,
          api,
          'Empty partial   (−∞, 0)     +     valid neighbor   →   keep the neighbor',
          960,
          885,
          38,
          C.ink,
        );
    });
    return;
  }
  const first = cue(state, 'prob-first', 1, 0.03, 0.15);
  const firstDone = after(state, 'prob-value', 1, 0.36);
  const remaining = cue(state, 'prob-rest', 1, 0.38, 0.52);
  const extraReads = Number(first >= 1) + Math.floor(3 * remaining);
  const filled = Number(firstDone) + Math.floor(3 * remaining);
  api.focus.target('probability-board', () => {
    text(
      ctx,
      api,
      'Retained state     m = ' + ALL.maximum + '      d ≈ ' + ALL.denominator.toFixed(3),
      960,
      283,
      44,
      C.yellow,
    );
    text(ctx, api, 'Logit', 219, 462, 37, C.ink);
    text(ctx, api, 'Probability', 219, 745, 37, C.ink);
    logits.forEach((x, i) => {
      const active = i < extraReads;
      box(ctx, api, String(x), center(i) - 97, 400, 194, 96, active ? C.yellow : C.blue, 44);
      box(
        ctx,
        api,
        i < filled ? (100 * probabilities[i]).toFixed(1) + '%' : '·',
        center(i) - 97,
        679,
        194,
        96,
        i < filled ? C.green : C.muted,
        39,
      );
      if (active) api.arrow(ctx, center(i), 516, center(i), 658, C.cyan, 5);
    });
    const statement =
      state.beat === 0
        ? '4 output slots     ·     0 probabilities written'
        : firstDone && remaining === 0
          ? 'First slot     exp(2 − 4) / d ≈ ' + (probabilities[0] * 100).toFixed(1) + '%'
          : '4 normalizer reads   +   ' + extraReads + ' output-pass reads';
    text(ctx, api, statement, 960, 913, 45, C.ink);
    if (after(state, 'prob-eight', 1, 0.83))
      text(ctx, api, '8-logit row     8 + 8 = 16 logical reads', 960, 993, 33, C.muted);
  });
}
export default {
  id: 'normalizer-output',
  draw: drawNormalizerOutput,
  cues: [
    'prob-state',
    'prob-question',
    'prob-first',
    'prob-value',
    'prob-rest',
    'prob-eight',
    'prob-mask',
    'prob-empty',
  ],
};
