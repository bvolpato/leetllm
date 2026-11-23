// The article's sorted Shakespeare vocabulary supplies these local IDs.
export const prompt = [
  { piece: 'Good', original: 10248, local: 6578 },
  { piece: '·sir', original: 15967, local: 9056 },
  { piece: ',', original: 11, local: 2 },
  { piece: '↵', original: 198, local: 67 },
  { piece: 'Spe', original: 5248, local: 3849 },
  { piece: 'ak', original: 461, local: 267 },
];

export const atColumn = (i) => 390 + 246 * i;

export function tile(ctx, api, value, x, y, color, width = 220) {
  api.rect(ctx, x - width / 2, y, width, 110, api.C.panel, color, 9);
  api.text(ctx, String(value), x, y + 74, 52, color, 'center');
}

export function bracket(ctx, api, left, right, y, color) {
  api.line(ctx, left, y - 18, left, y, color, 4);
  api.line(ctx, left, y, right, y, color, 4);
  api.line(ctx, right, y, right, y - 18, color, 4);
}
