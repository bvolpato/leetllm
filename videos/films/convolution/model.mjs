import { convolutionShape, correlate, poolSnapshot } from './arithmetic.mjs';
import { ARTICLE_CROP, IMAGE, KERNEL, RIDGE } from './fixtures.mjs';
export const MAP = correlate(IMAGE, KERNEL);
export function cropForward(pixel = ARTICLE_CROP[0][0]) {
  const image = ARTICLE_CROP.map((r) => [...r]);
  image[0][0] = pixel;
  const raw = correlate(image, RIDGE),
    activated = raw.map((r) => r.map((v) => Math.max(0, v))),
    pool = poolSnapshot(activated),
    value = pool.values[0][0];
  return {
    image,
    raw,
    activated,
    pool,
    value,
    logits: [value * 1.4 - 0.2, value * -0.9 + 0.1],
  };
}
export function fieldTrace(
  layers = [
    [3, 1, 1],
    [3, 1, 1],
    [2, 2, 1],
    [3, 1, 1],
  ],
  size = 224,
) {
  let field = 1,
    jump = 1;
  return layers.map(([k, s, d]) => {
    field += d * (k - 1) * jump;
    jump *= s;
    size = convolutionShape(size, k, {
      stride: s,
      dilation: d,
    });
    return {
      field,
      jump,
      size,
      kernel: k,
      stride: s,
      dilation: d,
    };
  });
}
export function signalParticipation(size, row, col, padding = 0) {
  const image = Array.from(
    {
      length: size,
    },
    (_, r) =>
      Array.from(
        {
          length: size,
        },
        (_, c) => (r === row && c === col ? 1 : 0),
      ),
  );
  const result = correlate(
    image,
    Array.from(
      {
        length: 3,
      },
      () => [1, 1, 1],
    ),
    1,
    padding,
  );
  return {
    image,
    result,
    count: result.flat().reduce((s, v) => s + v, 0),
  };
}
export function paddedUniform(mode = 'zero', value = 0.6) {
  const image = Array.from(
      {
        length: 5,
      },
      () => Array(5).fill(value),
    ),
    padded = Array.from(
      {
        length: 7,
      },
      (_, r) =>
        Array.from(
          {
            length: 7,
          },
          (_, c) =>
            r === 0 || r === 6 || c === 0 || c === 6 ? (mode === 'reflect' ? value : 0) : value,
        ),
    );
  const kernel = [
      [1, 1, 1],
      [0, 0, 0],
      [-1, -1, -1],
    ],
    result = correlate(padded, kernel);
  return {
    image,
    padded,
    kernel,
    result,
    maxAbs: Math.max(...result.flat().map(Math.abs)),
  };
}
export function patchProjection() {
  const image = Array.from(
    {
      length: 4,
    },
    (_, r) =>
      Array.from(
        {
          length: 4,
        },
        (_, c) => (r * 4 + c + 1) / 16,
      ),
  );
  const weights = [
      [1, 0, 0, -1],
      [0, 1, 1, 0],
      [0.25, 0.25, 0.25, 0.25],
    ],
    bias = [0, 0.1, -0.1];
  const patches = [];
  for (let r = 0; r < 4; r += 2)
    for (let c = 0; c < 4; c += 2)
      patches.push([image[r][c], image[r][c + 1], image[r + 1][c], image[r + 1][c + 1]]);
  const tokens = patches.map((p) =>
    weights.map((w, i) => w.reduce((s, v, j) => s + v * p[j], bias[i])),
  );
  return {
    image,
    weights,
    bias,
    patches,
    tokens,
    kernels: weights.map((w) => [w.slice(0, 2), w.slice(2)]),
  };
}
