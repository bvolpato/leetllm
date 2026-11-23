import { normalizedWeights } from '../arithmetic.mjs';
import { VALUE_PREFIX } from '../fixtures.mjs';
import { legal } from '../model.mjs';
import { constructionCode as code, constructionText as text } from '../defaults.mjs';
import { after, prefixLine } from '../page.mjs';

export function drawConditionalMask(ctx, scene, state, api) {
  const { C, focus } = api;
  focus.target('status-weights', () => {
    prefixLine(ctx, api, VALUE_PREFIX);
    const tokens = ['passed', 'fa', 'chatty'];
    const weights = [2, 3, 5];
    const allowed = tokens.flatMap((token, i) => (legal(VALUE_PREFIX, token) ? [i] : []));
    const probs = normalizedWeights(weights, allowed);
    const have = after(state, 'weights-exp');
    const removed = after(state, 'weights-remove');
    const result = after(state, 'weights-result');
    const total = weights.reduce((a, b) => a + b, 0);
    const remaining = allowed.reduce((a, i) => a + weights[i], 0);
    ['Token', 'Logit', 'Weight', 'Before', 'After'].forEach((label, i) =>
      text(ctx, api, label, [150, 485, 740, 1210, 1500][i], 510, 32, C.muted),
    );
    tokens.forEach((token, i) => {
      const y = 614 + 110 * i;
      const color = removed && !allowed.includes(i) ? C.muted : C.cyan;
      code(ctx, api, token, 150, y, 46, color);
      code(ctx, api, 'ln ' + weights[i], 485, y, 42);
      if (have) {
        for (let j = 0; j < weights[i]; j++)
          api.rect(ctx, 742 + j * 64, y - 39, 49, 42, color, null, 3);
        code(ctx, api, (weights[i] * 100) / total + '%', 1210, y, 42);
      }
      if (removed && !allowed.includes(i)) api.line(ctx, 735, y + 12, 1055, y + 12, C.pink, 5);
      if (result) code(ctx, api, 100 * probs[i] + '%', 1500, y, 47, color);
    });
    if (removed)
      code(
        ctx,
        api,
        'Surviving weight = ' + allowed.map((i) => weights[i]).join(' + ') + ' = ' + remaining,
        150,
        965,
        40,
        C.yellow,
      );
  });
}
export default {
  id: 'conditional-mask',
  draw: drawConditionalMask,
  cues: ['weights-exp', 'weights-remove', 'weights-result'],
};
