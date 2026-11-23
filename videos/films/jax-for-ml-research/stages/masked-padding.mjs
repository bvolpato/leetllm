import { batchComparison, calculation, drawBatch } from '../batch.mjs';
import { momentumFixture } from '../arithmetic.mjs';
import { drawLeftText, drawText } from '../defaults.mjs';
import { operationProgress, resultAfter } from '../../../lib/lesson-definition.mjs';

const padded = batchComparison(4, 6);
const previous = momentumFixture();
const velocity = 0.9 * previous.nextVelocity[0];
const stepped = previous.nextParams[0] - 0.05 * velocity;

export function drawMaskedPadding(ctx, scene, state, api) {
  const { C } = api;
  if (state.beat < 2) {
    const applyMask = operationProgress(state, 'padding-mask');
    const fixed = applyMask > 0;
    const correct = resultAfter(state, 'padding-restored');
    drawBatch(ctx, api, padded, {
      mask: fixed ? padded.batch.map((r) => r.valid) : undefined,
      bracketSlots: padded.batch.length - (padded.batch.length - padded.loss.count) * applyMask,
    });
    if (!fixed) {
      calculation(
        ctx,
        api,
        'Mean over six slots',
        '15 / 6 = ' + (resultAfter(state, 'padding-naive') ? padded.loss.naive : '?'),
        'Unpadded reference     loss 3.75     ∂L/∂w₀ = −4.5',
      );
    } else if (operationProgress(state, 'padding-compare') > 0) {
      api.focus.target('batch-calculation', () => {
        drawLeftText(ctx, api, 'Gradient for the first weight', 112, 762, 34, C.yellow);
        const values = [
          ['Four unpadded examples', padded.validGradient[0], true, C.blue],
          [
            'Six-slot mean',
            padded.naiveGradient[0],
            resultAfter(state, 'padding-short-gradient'),
            C.pink,
          ],
          ['Masked mean', padded.validGradient[0], resultAfter(state, 'padding-gradient'), C.cyan],
        ];
        values.forEach(([label, gradient, known, color], i) => {
          const y = 821 + 72 * i;
          drawLeftText(ctx, api, label, 115, y, 36, C.ink);
          api.line(ctx, 800, y - 13, 1520, y - 13, C.muted, 2);
          if (known) {
            const x = 1520 + gradient * 150;
            api.line(ctx, x, y - 13, 1520, y - 13, color, 10);
            api.circle(ctx, x, y - 13, 9, color);
          }
          drawLeftText(ctx, api, known ? gradient : '?', 1590, y, 40, color);
        });
      });
    } else {
      calculation(
        ctx,
        api,
        'Mean over valid examples',
        '15 / 4 = ' + (correct ? padded.loss.masked : '?'),
        'jnp.where(valid, losses, 0).sum() / jnp.maximum(valid.sum(), 1)',
      );
    }
    return;
  }
  api.focus.target('empty-mask', () => {
    drawLeftText(
      ctx,
      api,
      'Keep the six finite rows. Turn off every validity bit.',
      112,
      274,
      39,
      C.ink,
    );
    drawLeftText(ctx, api, 'Squared errors', 112, 445, 34, C.muted);
    drawLeftText(ctx, api, 'Validity mask', 112, 547, 34, C.muted);
    padded.batch.forEach((r, i) => {
      const x = 530 + i * 223;
      drawText(ctx, api, r.squared, x, 446, 49, C.muted);
      drawText(ctx, api, 0, x, 636, 56, C.cyan);
    });
  });
  api.focus.target('empty-step', () => {
    if (!resultAfter(state, 'padding-zero')) {
      drawLeftText(ctx, api, 'Masked sum = 0       Valid count = 0', 112, 798, 46, C.yellow);
      drawLeftText(ctx, api, 'Loss = 0 / max(0, 1)', 112, 900, 44, C.ink);
      drawLeftText(ctx, api, 'new gradient = 0', 1040, 900, 44, C.cyan);
      return;
    }
    drawLeftText(ctx, api, 'new gradient = 0', 112, 751, 38, C.cyan);
    drawLeftText(
      ctx,
      api,
      'Old weight  ' + previous.nextParams[0] + '     Old velocity  ' + previous.nextVelocity[0],
      830,
      751,
      35,
      C.ink,
    );
    drawLeftText(ctx, api, 'Take the step', 112, 848, 32, C.muted);
    drawLeftText(ctx, api, 'Skip the step', 112, 945, 32, C.muted);
    const moved = resultAfter(state, 'padding-momentum');
    drawLeftText(
      ctx,
      api,
      moved
        ? 'v = 0.9 × (−2) = ' + velocity + '       w = 0.1 − 0.05 × (−1.8) = ' + stepped.toFixed(2)
        : 'v = 0.9 × (−2) + 0       w = 0.1 − 0.05 × v = ?',
      475,
      848,
      39,
      C.yellow,
    );
    drawLeftText(ctx, api, 'v = −2       w = 0.1', 475, 945, 39, C.green);
  });
}
export default {
  id: 'masked-padding',
  draw: drawMaskedPadding,
  cues: [
    'padding-naive',
    'padding-mask',
    'padding-restored',
    'padding-compare',
    'padding-short-gradient',
    'padding-gradient',
    'padding-zero',
    'padding-momentum',
  ],
};
