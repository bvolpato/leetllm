import { rows } from './fixtures.mjs';
import { drawConstructionText as label } from './defaults.mjs';

export const ambiguityX = (value) => 190 + (value - 1) * 432;
const positions = rows.map(([value]) => ambiguityX(value)).sort((a, b) => a - b);

export function drawAmbiguityStrip(ctx, api, { cut, y = 500, marked = [], labelCut = true }) {
  const { C } = api;
  const cutX = cut === null ? null : ambiguityX(cut);
  let edge = 125;
  for (const x of positions) {
    api.line(ctx, edge, y, x - 46, y, C.muted, 3);
    edge = x + 46;
  }
  api.line(ctx, edge, y, 1770, y, C.muted, 3);
  rows.forEach(([value, , review], index) => {
    const x = ambiguityX(value);
    const drawDot = () => {
      if (marked.includes(index)) api.circle(ctx, x, y, 44, C.bg, C.yellow, 4);
      api.circle(ctx, x, y, 33, review ? C.pink : C.blue);
      label(ctx, api, 'R' + (index + 1), x, y + 10, 29, C.bg);
    };
    if (index === 2) api.focus.target('training-rthree', drawDot);
    else drawDot();
    label(ctx, api, value.toFixed(1), x, y + 88, 35);
  });
  api.focus.target('divider', () => {
    if (cut !== null) {
      // Leave a gap across the row labels as the divider travels between slots.
      api.line(ctx, cutX, y - 110, cutX, y - 44, C.yellow, 6);
      api.line(ctx, cutX, y + 110, cutX, y + 150, C.yellow, 6);
      if (labelCut) label(ctx, api, cut.toFixed(2), cutX, y - 135, 39, C.yellow);
    }
  });
  return cutX;
}

export function drawLegend(ctx, api, y = 240) {
  const { C } = api;
  label(ctx, api, 'Training requests in ambiguity order', 130, y, 34, C.ink, 'left');
  api.circle(ctx, 1170, y - 9, 14, C.pink);
  label(ctx, api, 'Needed review', 1197, y, 30, C.pink, 'left');
  api.circle(ctx, 1510, y - 9, 14, C.blue);
  label(ctx, api, 'Routine', 1537, y, 30, C.blue, 'left');
}
