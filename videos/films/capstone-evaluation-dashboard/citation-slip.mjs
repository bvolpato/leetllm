import { dashboardText as text } from './defaults.mjs';

export function citationSlip(ctx, api, x, y, documentId) {
  const { C } = api;
  const width = 640,
    height = 190,
    fold = 56;
  const point = (dx, dy) => ({ x: x + dx, y: y + dy });
  api.path(
    ctx,
    [
      point(0, 0),
      point(width - fold, 0),
      point(width, fold),
      point(width, height),
      point(0, height),
    ],
    {
      closed: true,
      fill: C.ink,
      width: 0,
    },
  );
  api.path(ctx, [point(width - fold, 0), point(width, fold), point(width - fold, fold)], {
    closed: true,
    fill: C.blue,
    width: 0,
  });
  text(ctx, api, 'Private workspace note', x + 38, y + 86, 48, C.bg, 'left', 'serif');
  text(ctx, api, documentId, x + 38, y + 150, 32, C.bg, 'left', 'mono');
}
