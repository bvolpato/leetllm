import { freshBatchingBoundary } from '../model.mjs';
import { cueProgress } from '../defaults.mjs';

export function drawTransfer(ctx, scene, state, api) {
  const boundary = freshBatchingBoundary('fifo');
  const { C } = api;
  const beat = state.beat ?? 0;
  const rows = [
    {
      target: 'sequence-seats',
      cue: 'sequence-seats',
      name: 'Seat',
      available: boundary.seats - boundary.active.length,
      need: 1,
    },
    {
      target: 'token-work',
      cue: 'token-work',
      name: 'Input positions',
      available: boundary.work - boundary.scheduledInputs,
      need: 1,
    },
    {
      target: 'resident-kv',
      cue: 'resident-memory',
      name: 'Cache pages',
      available: boundary.free.length,
      need: boundary.needD,
    },
  ];
  api.focus.target(scene.id + '-mechanism', () => {
    api.text(ctx, 'D', 270, 545, 144, C.yellow, 'center');
    api.text(ctx, 'in the queue', 270, 624, 37, C.muted, 'center');
    if (beat === 2) {
      api.text(ctx, 'E', 270, 775, 70, C.green, 'center');
      api.text(ctx, 'next in line', 270, 845, 37, C.muted, 'center');
    }
    api.text(ctx, 'Free at this boundary', 980, 256, 39, C.ink, 'center');
    for (const [i, row] of rows.entries()) {
      const showNeed = beat > 0 || cueProgress(state, row.cue, [0.08, 0.41, 0.63][i], [0.15, 0.46, 0.7][i]) > 0;
      const y = 385 + i * 175;
      api.focus.target(row.target, () => {
        api.text(ctx, row.name, 465, y + 33, 40, C.ink);
        // The slots themselves are capacity. A gold outline is D's proposed use.
        for (let n = 0; n < Math.max(row.available, showNeed ? row.need : 0); n++) {
          const x = 805 + n * 94;
          if (n < row.available) api.rect(ctx, x, y - 36, 74, 85, C.blue + '30', C.blue, 4);
          if (showNeed && n < row.need)
            api.rect(ctx, x + 10, y - 25, 54, 63, C.yellow + '20', C.yellow, 3);
        }
        if (showNeed) api.text(ctx, 'needs ' + row.need, 1565, y + 22, 36, C.yellow);
      });
    }
  });
  api.focus.target('transfer-optimize-completed-requests-within-the-latency-objectiv', () => {
    if (beat === 0) return;
    api.text(ctx, 'One page short', 960, 889, 49, C.yellow, 'center');
    if (beat === 2 || cueProgress(state, 'surviving-streams', 0.25, 0.45) > 0)
      api.focus.target('transfer-running', () =>
        api.text(ctx, 'Strict arrival order   ·   next pass: B and C', 960, 979, 38, C.ink, 'center'));
  });
}

export default {
  id: 'transfer',
  draw: drawTransfer,
  cues: [
    'sequence-seats',
    'token-work',
    'resident-memory',
    'surviving-streams',
    'memory-pressure',
    'completed-requests',
    'state-accounting',
  ],
};
