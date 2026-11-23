import { correlate } from './arithmetic.mjs';
import { HORIZONTAL, IMAGE, KERNEL, PADDED_ORDER } from './fixtures.mjs';
export function patchSnapshot(column, progress) {
  const products = KERNEL.map((row, r) => row.map((weight, c) => weight * IMAGE[r][c + column]));
  const count = Math.min(9, Math.floor(Math.max(0, progress) * 9 + 1e-9));
  return {
    products,
    count,
    subtotal: products
      .flat()
      .slice(0, count)
      .reduce((a, b) => a + b, 0),
  };
}
export function scanSnapshot(image, kernel, progress, { stride = 1, padding = 0, order } = {}) {
  const input = padding
    ? Array.from(
        {
          length: image.length + 2 * padding,
        },
        (_, r) =>
          Array.from(
            {
              length: image[0].length + 2 * padding,
            },
            (_, c) => image[r - padding]?.[c - padding] ?? 0,
          ),
      )
    : image;
  const result = correlate(image, kernel, stride, padding),
    cols = result[0].length,
    total = result.length * cols;
  const sequence =
      order ??
      Array.from(
        {
          length: total,
        },
        (_, i) => i,
      ),
    count = Math.min(total, Math.floor(Math.max(0, progress) * total + 1e-9));
  const index = sequence[Math.max(0, count - 1)],
    output = [Math.floor(index / cols), index % cols],
    active = output.map((v) => v * stride);
  const products = kernel.map((row, r) =>
    row.map((k, c) => k * input[active[0] + r][active[1] + c]),
  );
  return {
    input,
    result,
    count,
    active,
    output,
    products,
    sum: products.flat().reduce((a, b) => a + b, 0),
    visible: sequence.slice(0, count),
    stride,
    padding,
  };
}
export function stridePaddingFrame(beat, progress) {
  if (beat === 0)
    return scanSnapshot(IMAGE, KERNEL, progress, {
      stride: 2,
    });
  if (beat === 1)
    return scanSnapshot(IMAGE, KERNEL, Math.min(1 / 25, Math.max(0, progress) / 25), {
      padding: 1,
      order: PADDED_ORDER,
    });
  return scanSnapshot(IMAGE, KERNEL, progress, {
    padding: 1,
    order: PADDED_ORDER,
  });
}
export function channelSnapshot(change = 0) {
  const second = IMAGE[0].map((_, c) => IMAGE.map((row) => row[c]));
  const weights = KERNEL.map((row) => row.map((v) => v * (1 - 2 * change)));
  const sums = [correlate(IMAGE, weights)[0][0], correlate(second, HORIZONTAL)[0][0]];
  return {
    images: [IMAGE, second],
    kernels: [weights, HORIZONTAL],
    sums,
    total: sums[0] + sums[1],
  };
}
