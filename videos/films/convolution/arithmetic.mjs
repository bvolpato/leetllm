export function correlate(image, kernel, stride = 1, padding = 0) {
  const rows = Math.floor((image.length + 2 * padding - kernel.length) / stride) + 1,
    cols = Math.floor((image[0].length + 2 * padding - kernel[0].length) / stride) + 1;
  return Array.from(
    {
      length: rows,
    },
    (_, r) =>
      Array.from(
        {
          length: cols,
        },
        (_, col) =>
          kernel.reduce(
            (sum, line, i) =>
              sum +
              line.reduce(
                (v, k, j) =>
                  v + k * (image[r * stride + i - padding]?.[col * stride + j - padding] ?? 0),
                0,
              ),
            0,
          ),
      ),
  );
}
export function convolutionShape(size, kernel, { stride = 1, padding = 0, dilation = 1 } = {}) {
  if (
    ![size, kernel, stride, dilation].every((v) => Number.isInteger(v) && v > 0) ||
    !Number.isInteger(padding) ||
    padding < 0
  )
    throw Error('positive integer dimensions and nonnegative integer padding required');
  const span = dilation * (kernel - 1) + 1;
  if (span > size + 2 * padding) throw Error('effective kernel cannot exceed padded input size');
  return Math.floor((size + 2 * padding - span) / stride) + 1;
}
export function parameterCount(inputs, outputs, kernel, groups = 1, bias = true) {
  if (inputs % groups || outputs % groups || groups < 1)
    throw Error('channel counts must be divisible by groups');
  return outputs * (inputs / groups) * kernel * kernel + (bias ? outputs : 0);
}
export function poolSnapshot(
  image,
  { kernel = 2, stride = 2, incoming, mode = 'max', overwrite = false } = {},
) {
  const out = convolutionShape(image.length, kernel, {
      stride,
    }),
    cols = convolutionShape(image[0].length, kernel, {
      stride,
    }),
    owners = [],
    values = [],
    gradient = image.map((row) => row.map(() => 0));
  for (let r = 0; r < out; r++) {
    values[r] = [];
    for (let c = 0; c < cols; c++) {
      const cells = Array.from(
        {
          length: kernel * kernel,
        },
        (_, i) => [r * stride + Math.floor(i / kernel), c * stride + (i % kernel)],
      );
      let selected = cells[0];
      for (const cell of cells)
        if (image[cell[0]][cell[1]] > image[selected[0]][selected[1]]) selected = cell;
      const list = mode === 'max' ? [selected] : cells;
      owners.push({
        output: [r, c],
        input: selected,
        flat: selected[0] * image[0].length + selected[1],
        cells,
      });
      values[r][c] =
        mode === 'max'
          ? image[selected[0]][selected[1]]
          : cells.reduce((s, [a, b]) => s + image[a][b], 0) / cells.length;
      if (incoming)
        for (const [a, b] of list) {
          const g = incoming[r][c] / (mode === 'max' ? 1 : cells.length);
          if (overwrite) gradient[a][b] = g;
          else gradient[a][b] += g;
        }
    }
  }
  return {
    values,
    owners,
    gradient,
  };
}
export function residualSlice(slope = 0.2, upstream = 3, gate = 1) {
  const incoming = upstream * gate;
  return {
    incoming,
    branch: slope * incoming,
    identity: incoming,
    total: (slope + 1) * incoming,
  };
}
