import { WORDS } from '../fixtures.mjs';
import { entropy } from '../arithmetic.mjs';
import {
  drawCompleteArrow,
  drawCompleteBox,
  drawCompleteEquation,
  drawCompleteHead,
  drawCompleteNote,
  drawCompleteRow,
  drawCompleteText,
  withSoftmaxCompleteFrame,
} from '../defaults.mjs';
export function paintSoftmaxCompleteEntropyReference(
  ctx,
  scene,
  state,
  api,
  C,
  m,
  f,
  b,
  colors,
  xs,
  started,
  progress,
) {
  const P = [0.5, 0.5, 0],
    Q = b === 0 ? [0, 1, 0] : P;
  drawCompleteHead(
    ctx,
    api,
    C,
    b === 0
      ? 'Keep target P separate from prediction Q'
      : b === 1
        ? 'A matching soft target keeps its own entropy'
        : 'Check target mass and candidate support',
  );
  if (b < 2) {
    drawCompleteText(ctx, api, C, 'supplied target P', 310, 340, 31, C.yellow);
    drawCompleteText(
      ctx,
      api,
      C,
      b === 0 ? 'hard annotation shown first' : 'matching prediction Q',
      310,
      625,
      31,
      C.cyan,
    );
    const targetValues = b === 0 && !started('entropy-soft-target') ? [0, 1, 0] : P;
    drawCompleteRow(ctx, api, C, colors, xs, targetValues, 410, WORDS, 120);
    drawCompleteRow(ctx, api, C, colors, xs, Q, 695, WORDS, 100);
    if (b === 0 && started('entropy-identities'))
      drawCompleteEquation(ctx, api, C, 'H(P,Q)=H(P)+D_{KL}(P\\Vert Q)', 960, 950, 43, C.yellow);
    if (b === 1 && started('entropy-match')) {
      drawCompleteText(
        ctx,
        api,
        C,
        'cross-entropy = ' + entropy(P).toFixed(6) + ' nats',
        960,
        925,
        36,
        C.green,
        'center',
      );
      drawCompleteText(
        ctx,
        api,
        C,
        'target entropy = ln 2 · mismatch KL = 0',
        960,
        985,
        31,
        C.cyan,
        'center',
      );
    }
  } else {
    const invalid = started('entropy-malformed');
    const targets = invalid ? [1, 1, 0] : [0.5, 0.5, 0],
      prediction = started('entropy-zero-support') ? [1, 0, 0] : [0.5, 0.5, 0];
    WORDS.forEach((w, i) => {
      drawCompleteText(ctx, api, C, w, xs[i], 355, 33, colors[i], 'center');
      drawCompleteBox(ctx, api, C, 'P ' + targets[i], xs[i], 455, 320, 80, C.yellow);
      drawCompleteBox(ctx, api, C, 'Q ' + prediction[i], xs[i], 610, 320, 80, colors[i]);
      if (targets[i] > 0 && prediction[i] === 0) {
        drawCompleteArrow(ctx, api, C, xs[i], 505, xs[i], 555, C.pink);
        drawCompleteText(
          ctx,
          api,
          C,
          'positive target / zero support',
          xs[i],
          730,
          25,
          C.pink,
          'center',
        );
      }
    });
    if (started('entropy-zero-support'))
      drawCompleteText(ctx, api, C, 'cross-entropy = ∞', 960, 830, 41, C.pink, 'center');
    if (invalid) {
      drawCompleteText(
        ctx,
        api,
        C,
        'target mass a = 2 · fails distribution validation',
        960,
        915,
        32,
        C.yellow,
        'center',
      );
      drawCompleteEquation(ctx, api, C, '\u2207_z L=a p-y', 960, 985, 38, C.yellow);
    } else
      drawCompleteNote(
        ctx,
        api,
        C,
        'Zero target mass contributes 0; positive mass requires positive prediction support.',
      );
  }
}
export function drawEntropyReferenceStage(ctx, scene, state, api) {
  withSoftmaxCompleteFrame(ctx, scene, state, api, paintSoftmaxCompleteEntropyReference);
}
export default {
  id: 'entropy-reference',
  draw: drawEntropyReferenceStage,
  cues: [
    'entropy-reference-0',
    'entropy-soft-target',
    'entropy-identities',
    'entropy-reference-1',
    'entropy-match',
    'entropy-reference-2',
    'entropy-zero-support',
    'entropy-malformed',
  ],
};
