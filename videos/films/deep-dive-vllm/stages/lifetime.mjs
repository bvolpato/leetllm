import { lifetimeTrace, vvProgress } from '../construction.mjs';
import { r0, r1 } from '../fixtures.mjs';
import { tokenCell } from '../defaults.mjs';

const pool = [
  { slot: 12, words: r0.slice(0, 4) },
  { slot: 41, words: r0.slice(4) },
  { slot: 73, words: r1.slice(4, 8) },
  { slot: 90, words: r1.slice(8) },
];

export function drawLifetime(ctx, scene, state, api) {
  const { C } = api;
  const progress = (id, beat) => vvProgress(state, 'lifetime-' + id, beat);
  const trace = lifetimeTrace(state.beat, state.beatP, state.cues);
  const release = progress('retire-r0', 1);
  const requestColor = { R0: C.blue, R1: C.pink, R2: C.green };
  api.focus.target('lifetime-pool', () => {
    api.text(ctx, 'Physical slot', 125, 270, 34, C.ink);
    api.text(ctx, 'Cached positions', 480, 270, 34, C.ink);
    api.text(ctx, 'Live readers', 1240, 270, 34, C.ink);
    api.text(ctx, 'Refs', 1690, 270, 34, C.ink);
    for (const [row, { slot, words }] of pool.entries()) {
      const y = 315 + row * 137;
      const refs = trace.refs.get(slot) ?? 0;
      const old = slot === 41 && trace.retired && !trace.assigned;
      const payload = slot === 41 && trace.assigned ? ['Rain'] : words;
      api.text(ctx, String(slot), 145, y + 60, 51, slot === 41 && trace.retired ? C.yellow : C.ink);
      for (let i = 0; i < 4; i++) {
        tokenCell(
          api,
          payload[i] ?? '',
          478 + i * 164,
          y,
          153,
          85,
          old ? C.muted : slot === 41 && trace.assigned ? C.green : C.cyan,
        );
      }
      for (const [who, table] of Object.entries(trace.tables)) {
        if (!table.includes(slot)) continue;
        // R1 keeps its column while R0 releases the shared block.
        const x = who === 'R1' ? 1410 : 1240;
        const lift = who === 'R0' ? 30 * release : 0;
        tokenCell(api, who, x, y + 6 - lift, 137, 72, requestColor[who], true);
      }
      api.text(ctx, String(refs), 1720, y + 61, 48, refs ? C.ink : C.green, 'center');
    }
  });
  api.focus.target('lifetime-queue', () => {
    api.line(ctx, 125, 855, 1785, 855, C.muted, 2);
    api.text(ctx, 'Free queue', 125, 929, 32, C.ink);
    tokenCell(api, trace.free ? '41' : 'empty', 345, 870, 175, 79, trace.free ? C.green : C.muted);
    if (trace.retired) {
      api.text(ctx, 'Slot 41 in prefix index', 650, 927, 32, C.ink);
      tokenCell(
        api,
        trace.oldHash ? 'yes' : 'no',
        1040,
        873,
        130,
        74,
        trace.oldHash ? C.cyan : C.muted,
      );
    }
    api.text(
      ctx,
      trace.assigned ? 'R2 owns 41' : 'R2 needs 1 block',
      1760,
      927,
      37,
      C.green,
      'right',
    );
  });
  if (state.beat === 0 && progress('choice', 0) > 0) {
    api.focus.target('lifetime-choice', () =>
      api.text(ctx, 'When R0 finishes, which slot can R2 take?', 960, 1024, 41, C.yellow, 'center'),
    );
  }
}
export default {
  id: 'lifetime',
  draw: drawLifetime,
  cues: [
    'lifetime-readers',
    'lifetime-choice',
    'lifetime-retire-r0',
    'lifetime-retained',
    'lifetime-pop',
    'lifetime-remove-old-hash',
    'lifetime-assign-live-reference',
  ],
};
