import { REDUCTION } from '../fixtures.mjs';
import { drawExtendedBox as box, text } from '../defaults.mjs';
import { after, cue } from '../score-trace.mjs';

const partials = REDUCTION.at(-2);
export function drawBlockBarrier(ctx, scene, state, api) {
  const { C } = api;
  const grid = state.beat === 2;
  const writes = grid
    ? [0, 1].map(() => cue(state, 'handoff-grid', 2, 0.22, 0.52))
    : [cue(state, 'handoff-seven', 0, 0.44, 0.7), cue(state, 'handoff-four', 1, 0.05, 0.25)];
  const ready = grid
    ? after(state, 'handoff-combine', 2, 0.8)
    : after(state, 'handoff-arrive', 1, 0.48);
  const read = grid ? Number(ready) : cue(state, 'handoff-read', 1, 0.5, 0.66);
  const total = grid ? ready : after(state, 'handoff-total', 1, 0.8);
  api.focus.target('handoff-board', () => {
    text(ctx, api, grid ? 'Block totals' : 'Warp leaders', 435, 306, 35, C.blue);
    text(ctx, api, grid ? 'Global memory' : 'Shared memory', 970, 306, 35, C.cyan);
    text(ctx, api, grid ? 'Later kernel' : 'Reader', 1530, 306, 35, C.green);
    partials.forEach((v, i) => {
      const y = 386 + i * 208;
      box(ctx, api, (grid ? 'Block ' : 'Leader ') + i + '     ' + v, 240, y, 390, 104, C.blue, 38);
      api.arrow(ctx, 657, y + 52, 802, y + 52, C.blue, 4);
      if (writes[i] > 0 && writes[i] < 1)
        api.circle(ctx, 657 + 145 * writes[i], y + 52, 11, C.yellow);
      box(
        ctx,
        api,
        'slot ' + i + '     ' + (writes[i] >= 1 ? v : '…'),
        835,
        y,
        285,
        104,
        writes[i] >= 1 ? C.cyan : C.muted,
        35,
      );
      if (read > 0) api.arrow(ctx, 1150, y + 52, 1332, 542, C.green, 4);
    });
    box(
      ctx,
      api,
      total ? String(REDUCTION.at(-1)[0]) : '…',
      1363,
      463,
      335,
      157,
      total ? C.green : C.muted,
      64,
    );
    text(
      ctx,
      api,
      grid
        ? ready
          ? 'Same stream   ·   combine after both blocks finish'
          : 'One slot per block'
        : ready
          ? 'Block barrier released   ·   both partials visible'
          : 'Can the reader use both shared slots?',
      960,
      900,
      42,
      ready ? C.green : C.yellow,
    );
  });
}
export default {
  id: 'block-barrier',
  draw: drawBlockBarrier,
  cues: [
    'handoff-seven',
    'handoff-wait',
    'handoff-four',
    'handoff-arrive',
    'handoff-read',
    'handoff-total',
    'handoff-grid',
    'handoff-combine',
  ],
};
