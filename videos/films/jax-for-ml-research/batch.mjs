import { paddedReduction } from './arithmetic.mjs';
import { rows } from './fixtures.mjs';
import { drawLeftText, drawText } from './defaults.mjs';

// Padding has ordinary finite features and a target. Validity is independent of its error.
export function batchComparison(examples, slots, bias = 0) {
  const batch = Array.from({ length: slots }, (_, i) => {
    const valid = i < examples;
    const { x, y } = valid ? rows[i] : { x: [0, 0], y: 0 };
    const residual = bias - y; // Both weights are zero in these comparisons.
    return {
      x,
      y,
      valid,
      prediction: bias,
      squared: residual ** 2,
      gradient: [...x, 1].map((feature) => 2 * residual * feature),
    };
  });
  const valid = batch.map((row) => row.valid);
  const loss = paddedReduction(
    batch.map((row) => row.squared),
    valid,
  );
  function gradient(onlyValid) {
    const selected = onlyValid ? batch.filter((row) => row.valid) : batch;
    return [0, 1, 2].map(
      (j) => selected.reduce((sum, row) => sum + row.gradient[j], 0) / Math.max(1, selected.length),
    );
  }
  return { batch, bias, loss, naiveGradient: gradient(false), validGradient: gradient(true) };
}

function bracket(ctx, api, left, right, y, color) {
  api.line(ctx, left, y - 18, left, y, color, 4);
  api.line(ctx, left, y, right, y, color, 4);
  api.line(ctx, right, y, right, y - 18, color, 4);
}

// The same column is one slot in the array, one loss term, and one bit of the validity mask.
export function drawBatch(
  ctx,
  api,
  data,
  {
    slots = data.batch.length,
    arriving = 1,
    errorCount = slots,
    mask,
    bracketSlots,
    caption = '',
  } = {},
) {
  const { C } = api;
  const left = 388,
    width = 1416 / data.batch.length;
  api.focus.target('batch-rows', () => {
    drawLeftText(ctx, api, 'w = [0, 0]     b = ' + data.bias, 110, 250, 37, C.ink);
    if (caption) drawText(ctx, api, caption, 1325, 250, 32, C.blue);
    for (const [s, y] of [
      ['Features', 390],
      ['Target', 454],
      ['Prediction', 518],
      ['Squared error', 585],
    ]) {
      drawLeftText(ctx, api, s, 113, y, 31, C.muted);
    }
    for (let i = 0; i < slots; i++) {
      const row = data.batch[i];
      const x = left + (i + 0.5) * width + (row.valid ? 0 : (1 - arriving) * 52);
      const color = row.valid ? C.cyan : C.muted;
      const half = width * 0.44;
      api.line(ctx, x - half, 331, x + half, 331, color, 3);
      drawText(ctx, api, row.valid ? 'Example ' + (i + 1) : 'Padding', x, 311, 30, color);
      drawText(ctx, api, '[' + row.x.join(', ') + ']', x, 390, 34, C.blue);
      drawText(ctx, api, row.y, x, 454, 39, C.ink);
      drawText(ctx, api, row.prediction, x, 518, 39, C.ink);
      const known = i < errorCount;
      const side = Math.abs(row.prediction - row.y);
      drawText(ctx, api, known ? row.squared : '?', x + (known && side ? 27 : 0), 585, 49, color);
      if (known && side) {
        // A two-unit residual makes a two-by-two square on this scale.
        for (let r = 0; r < side; r++) {
          for (let c = 0; c < side; c++) {
            api.rect(
              ctx,
              x - 17 - (side - c) * 17,
              569 - side * 8.5 + r * 17,
              14,
              14,
              color,
              null,
              1,
            );
          }
        }
      }
    }
  });
  if (mask) {
    drawLeftText(ctx, api, 'Valid', 113, 659, 31, C.muted);
    api.focus.target('batch-mask', () => {
      mask.forEach((v, i) => {
        drawText(ctx, api, Number(v), left + (i + 0.5) * width, 655, 36, v ? C.green : C.muted);
      });
    });
  }
  if (bracketSlots > 0) {
    bracket(ctx, api, left + 10, left + bracketSlots * width - 10, mask ? 706 : 654, C.yellow);
  }
}

export function calculation(ctx, api, label, expression, detail = '') {
  const { C } = api;
  api.focus.target('batch-calculation', () => {
    drawLeftText(ctx, api, label, 112, 788, 33, C.yellow);
    drawLeftText(ctx, api, expression, 112, 880, 66, C.ink);
    if (detail) drawLeftText(ctx, api, detail, 114, 974, 32, C.cyan);
  });
}
