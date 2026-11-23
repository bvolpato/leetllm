export const labeledId = 'req_7f3a';
export const proposedId = 'req_7838';
export const nextId = 'req_7f8a';

// The strip spans nine source rows, including the descender and underscore.
const letters = {
  r: ['00000', '00000', '10110', '11001', '10000', '10000', '10000', '00000', '00000'],
  e: ['00000', '00000', '01110', '10001', '11111', '10000', '01111', '00000', '00000'],
  q: ['00000', '00000', '01111', '10001', '10001', '10001', '01111', '00001', '00001'],
  _: ['00000', '00000', '00000', '00000', '00000', '00000', '00000', '00000', '11111'],
  7: ['11111', '00001', '00010', '00010', '00100', '00100', '01000', '00000', '00000'],
  8: ['01110', '10001', '10001', '01110', '10001', '10001', '01110', '00000', '00000'],
  f: ['00111', '01000', '01000', '11110', '01000', '01000', '01000', '00000', '00000'],
  3: ['11110', '00001', '00001', '01110', '00001', '00001', '11110', '00000', '00000'],
  a: ['00000', '00000', '01110', '00001', '01111', '10001', '01111', '00000', '00000'],
};
function identifierStrip(id) {
  return Array.from({ length: 9 }, (_, row) =>
    [...id].flatMap((char) => [...letters[char][row], '0'].map(Number)),
  );
}
export const nativeStrip = identifierStrip(labeledId);
export const nextStrip = identifierStrip(nextId);

// A 3 × 3 box filter gives one output sample per nine source pixels.
export const resizedStrip = Array.from({ length: 3 }, (_, row) =>
  Array.from({ length: nativeStrip[0].length / 3 }, (_, col) => {
    let value = 0;
    for (let y = 0; y < 3; y++)
      for (let x = 0; x < 3; x++) value += nativeStrip[3 * row + y][3 * col + x];
    return value / 9;
  }),
);

const paper = '#273344';
const ink = '#e0e3e8';
const tones = Array.from({ length: 10 }, (_, level) => {
  const channel = (offset) => {
    const low = parseInt(paper.slice(offset, offset + 2), 16);
    const high = parseInt(ink.slice(offset, offset + 2), 16);
    return Math.round(low + ((high - low) * level) / 9)
      .toString(16)
      .padStart(2, '0');
  };
  return '#' + [1, 3, 5].map(channel).join('');
});

export function pixelStrip(ctx, api, values, x, y, unit) {
  api.rect(ctx, x, y, values[0].length * unit, values.length * unit, paper, undefined, 0);
  values.forEach((row, r) => {
    let col = 0;
    while (col < row.length) {
      const start = col;
      while (col < row.length && row[col] === row[start]) col++;
      if (row[start] > 0) {
        api.rect(
          ctx,
          x + start * unit,
          y + r * unit,
          (col - start) * unit,
          unit,
          tones[Math.round(row[start] * 9)],
          undefined,
          0,
        );
      }
    }
  });
}

export function incidentScreen(ctx, api, x, y, scale, { crop = false, locate = false } = {}) {
  const { C } = api;
  const rect = (a, b, w, h, fill, stroke) =>
    api.rect(ctx, x + a * scale, y + b * scale, w * scale, h * scale, fill, stroke, 0);
  const label = (v, a, b, size, color) =>
    api.text(ctx, v, x + a * scale, y + b * scale, size * scale, color);
  rect(0, 0, 672, 378, paper, C.muted);
  rect(0, 0, 672, 55, '#34445a');
  label('Deployment', 24, 38, 25, C.ink);
  rect(28, 85, 616, 112, '#432c38');
  rect(28, 85, 6, 112, C.red);
  label('Deploy failed', 51, 136, 40, C.red);
  label('Database connection timed out', 52, 172, 22, C.ink);
  rect(564, 257, 78, 45, '#244e7a', C.blue);
  label('Retry', 580, 286, 19, C.ink);
  pixelStrip(ctx, api, nativeStrip, x + 504 * scale, y + 276 * scale, scale);
  if (crop) rect(448, 154, 224, 224, 'transparent', C.yellow);
  if (locate) rect(499, 269, 58, 23, 'transparent', C.yellow);
}
