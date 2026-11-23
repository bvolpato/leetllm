import { tokens } from './fixtures.mjs';

const sequence = [101, 102, ...tokens];
export const tokenX = (index) => 334 + 201 * index;
export const receiptTarget = 'rollout-receipt';

export function receipt(ctx, api, grade) {
  const { C } = api;
  api.text(ctx, 'ROLLOUT 7', 102, 270, 35, C.ink);
  api.text(ctx, 'SGLang  /  policy v11', 960, 270, 32, C.blue, 'center');
  api.text(ctx, grade, 1818, 270, 32, grade.includes('1.0') ? C.green : C.muted, 'right');
  api.line(ctx, 102, 309, 1818, 309, C.muted, 2);
}

export function responseTape(ctx, api, { shown = 8, masks, probabilities, highlighted = -1 }) {
  const { C } = api;
  const groups = [
    ['Prompt', C.muted],
    ['Model calls tool', C.blue],
    ['Tool returns', C.yellow],
    ['Model writes patch', C.blue],
  ];
  groups.forEach(([label, color], group) => {
    const first = group * 2;
    if (shown <= first) return;
    const left = tokenX(first) - 80;
    const right = tokenX(Math.min(first + 1, shown - 1)) + 80;
    api.text(ctx, label, (left + right) / 2, 417, 30, color, 'center');
    api.line(ctx, left, 441, right, 441, color, 3);
  });
  api.text(ctx, 'Token ID', 102, 555, 30, C.ink);
  if (masks) api.text(ctx, 'Loss mask', 102, 700, 30, C.ink);
  if (probabilities) api.text(ctx, 'Log p', 102, 810, 30, C.ink);
  sequence.slice(0, shown).forEach((id, index) => {
    const x = tokenX(index);
    const color = groups[Math.floor(index / 2)][1];
    api.rect(ctx, x - 79, 478, 158, 111, C.panel, color, 8);
    api.text(ctx, String(id), x, 557, 60, color, 'center');
    if (masks && index >= 2) {
      const bit = masks[index - 2];
      if (index === highlighted) api.rect(ctx, x - 53, 638, 106, 84, C.panel, C.yellow, 8);
      api.text(ctx, String(bit ?? '?'), x, 702, 50, bit === 0 ? C.muted : C.ink, 'center');
      if (probabilities) {
        const p = probabilities[index - 2];
        api.text(
          ctx,
          p === 0 ? '0' : p.toFixed(1).replace('-', '−'),
          x,
          810,
          40,
          bit ? C.blue : C.muted,
          'center',
        );
      }
    }
  });
}
