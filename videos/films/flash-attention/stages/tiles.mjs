import { scratch, rowClock } from '../row-workspace.mjs';

export function drawTiles(ctx, scene, state, api) {
  const { C } = api,
    clock = rowClock(scene, state);
  scratch(ctx, api, {
    keys: clock.started('load-pair') ? [0, 1] : [],
    label: 'Query on chip  ·  test',
  });
  api.focus.target('next-key', () => api.text(ctx, 'Next key   test', 116, 808, 38, C.yellow));
  api.focus.target('summary', () => {
    api.text(ctx, 'What stays with the query?', 900, 300, 43, C.ink);
    api.text(
      ctx,
      clock.started('keep-sums') ? 'State for the next tile' : 'One average',
      900,
      454,
      36,
      C.muted,
    );
    api.line(ctx, 900, 491, 1660, 491, C.muted, 2);
    if (clock.started('keep-sums'))
      api.text(ctx, 'Total weight', 900, 581, 38, C.blue);
    if (clock.started('keep-values'))
      api.text(ctx, 'Weighted value sum', 900, 682, 38, C.blue);
    if (clock.started('keep-ref')) api.text(ctx, 'Reference score', 900, 783, 38, C.cyan);
    if (!clock.started('keep-sums'))
      api.text(ctx, 'How much weight does it carry?', 900, 599, 36, C.ink);
  });
}

export default {
  id: 'tiles',
  draw: drawTiles,
  cues: ['load-pair', 'waiting-key', 'reuse-scratch', 'keep-sums', 'keep-values', 'keep-ref'],
};
