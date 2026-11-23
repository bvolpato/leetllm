import { QUANT_WEIGHTS } from './fixtures.mjs';

export function outputOn(weights, input) {
  return weights.reduce((sum, weight, i) => sum + weight * input[i], 0);
}

export function drawPair(ctx, api, title, weights, x, color) {
  api.text(ctx, title, x, 254, 35, color);
  const values = weights.map((value) => Number(value.toFixed(2))).join(', ');
  api.text(ctx, '(' + values + ')', x, 326, 56, color, 'left', 'mono');
}

// Each row has its own source output at the center. A unit of output error
// covers the same distance on both rows and on the held-out inputs.
export function drawOutputRows(ctx, api, { inputs, nearest, working, showNearest, showWorking }) {
  const { C } = api;
  const center = 985;
  const unit = 315;
  const signed = (n) => (n < 0 ? '−' : '+') + Math.abs(n).toFixed(2);
  api.text(ctx, 'Input and source calculation', 120, 423, 34, C.muted);
  api.text(ctx, 'Source output', center, 423, 34, C.muted, 'center');
  api.text(ctx, 'Output', 1510, 423, 35, C.muted);
  api.text(ctx, 'Signed gap', 1675, 423, 35, C.muted);
  inputs.forEach((input, row) => {
    const y = 537 + row * 210;
    const source = outputOn(QUANT_WEIGHTS, input);
    api.text(ctx, '(' + input.join(', ') + ')', 120, y + 15, 52, C.ink, 'left', 'mono');
    const products = input.map((value, i) => value + ' × ' + QUANT_WEIGHTS[i]);
    api.text(ctx, products.join(' + '), 120, y + 78, 32, C.muted, 'left', 'mono');
    api.text(ctx, source.toFixed(2), center, y - 42, 42, C.ink, 'center', 'mono');
    api.line(ctx, center - unit * 1.5, y, center + unit * 1.5, y, C.muted, 2);
    for (const tick of [-1, 0, 1]) {
      const x = center + unit * tick;
      const size = tick === 0 ? 30 : 10;
      api.line(ctx, x, y - size, x, y + size, tick === 0 ? C.ink : C.muted, 3);
    }
    for (const [weights, visible, offset, color] of [
      [nearest, showNearest, -14, C.blue],
      [working, showWorking, 21, C.cyan],
    ]) {
      if (!(Array.isArray(visible) ? visible[row] : visible)) continue;
      const output = outputOn(weights, input);
      const delta = output - source;
      const x = center + unit * delta;
      api.line(ctx, center, y + offset, x, y + offset, color, 5);
      api.circle(ctx, x, y + offset, 11, color);
      api.text(ctx, output.toFixed(2), 1510, y + offset + 11, 33, color, 'left', 'mono');
      api.text(ctx, signed(delta), 1675, y + offset + 11, 33, color, 'left', 'mono');
    }
  });
}
