import { mix } from '../arithmetic.mjs';
import { cueProgress } from '../construction.mjs';
import { box, focus, text } from '../defaults.mjs';
export function drawBayes(ctx, scene, state, api) {
  const q = cueProgress(state, 'joint-to-conditional', 0),
    rule = cueProgress(state, 'bayes-rule', 1);
  focus(api, 'bayes-arithmetic', () => {
    text(ctx, api, 'A = abusive signup · B = detector flag', 960, 235, 30, api.C.muted);
    box(ctx, api, '95 abusive AND flagged', 240, 285, 640, 100, api.C.red);
    box(ctx, api, '95 + 495 = 590 flagged', 1040, 285, 640, 100, api.C.blue);
    api.rect(ctx, 1120, 410, 95 * 0.8, 22, api.C.red);
    api.rect(ctx, 1120 + 95 * 0.8, 410, 495 * 0.8, 22, api.C.blue);
    api.math(ctx, '\\frac{95/10000}{590/10000}', 620, 540, 68, api.C.ink, 'center');
    if (q > 0) api.arrow(ctx, 900, 535, mix(900, 1110, q), 535, api.C.yellow, 4);
    api.math(
      ctx,
      q === 1 ? '\\frac{95}{590}' : '?',
      1330,
      540,
      68,
      q === 1 ? api.C.yellow : api.C.muted,
      'center',
    );
    text(
      ctx,
      api,
      q === 1 ? '95 / 590 ≈ 16.1%' : 'P(A | B) = P(A AND B) / P(B)',
      960,
      710,
      43,
      api.C.yellow,
    );
    if (rule > 0) {
      api.math(
        ctx,
        'P(A\\mid B)=\\frac{P(B\\mid A)P(A)}{P(B)}',
        960,
        865,
        53,
        api.C.cyan,
        'center',
      );
      text(ctx, api, 'P(B) = 0.95 × 0.01 + 0.05 × 0.99 = 0.059', 960, 975, 30, api.C.muted);
    } else text(ctx, api, 'Both source contributions stay in P(B)', 960, 900, 32, api.C.muted);
  });
}
export default {
  id: 'bayes',
  draw: drawBayes,
  cues: ['joint-to-conditional', 'bayes-rule'],
};
