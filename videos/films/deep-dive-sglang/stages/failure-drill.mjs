import { settled } from '../construction.mjs';
import { prefixReuse } from '../model.mjs';
import { clock, slot, text } from '../defaults.mjs';

const warm = [10, 20, 30, 40];
const edited = [99, 20, 30, 40];

export function drawFailureDrill(ctx, scene, state, api) {
  const { C } = api;
  if (state.beat >= 3) {
    api.focus.target('drill-clock', () => {
      clock(
        ctx,
        api,
        [
          { id: 'prefill', label: 'long prompt' },
          { id: 'decode', label: 'existing decode' },
        ],
        [
          { id: 'long', lane: 'prefill', start: 2, end: 7, color: C.pink },
          { id: 'first', lane: 'decode', start: 0, end: 2, color: C.blue },
          { id: 'second', lane: 'decode', start: 7, end: 9, color: C.blue },
        ],
        [0, 10],
        9,
        360,
        335,
        [0, 2, 7, 9],
      );
    });
    text(
      ctx,
      api,
      'Illustrative schedule   ·   compare the decode gap with queue and forward timings',
      960,
      855,
      34,
      C.ink,
      'center',
    );
    return;
  }
  const reset = settled(state, 'drill-restore', 1, 0.27);
  const changed = settled(state, 'drill-change', 0, 0.55) && !reset;
  const moved = settled(state, 'drill-move', 1, 0.69);
  const request = changed ? edited : warm;
  const local = moved ? [] : warm;
  const hit = prefixReuse(local, request, 'A', 'A').reusable;
  const show = moved
    ? settled(state, 'drill-cold', 2, 0.23)
    : changed
      ? settled(state, 'drill-miss', 0, 0.83)
      : !reset || settled(state, 'drill-warm', 1, 0.47);
  text(ctx, api, 'Redacted replay   ·   model R7   ·   adapter A', 145, 296, 38, C.ink);
  const row = (id, y, name, values) =>
    api.focus.target(id, () => {
      text(ctx, api, name, 145, y + 64, 39, C.ink);
      for (let i = 0; i < warm.length; i++) {
        const v = values[i];
        slot(
          ctx,
          api,
          v === undefined ? '' : String(v),
          660 + 235 * i,
          y,
          198,
          101,
          v === undefined
            ? C.muted
            : changed && id === 'drill-input' && i === 0
              ? C.yellow
              : C.blue,
          45,
        );
      }
    });
  row('drill-input', 382, 'Incoming token IDs', request);
  row('drill-local', 573, moved ? 'Replica B · cold' : 'Replica A · warm', local);
  api.focus.target('drill-hit', () => {
    text(ctx, api, 'Matched prefix positions', 145, 846, 38, C.ink);
    slot(
      ctx,
      api,
      show ? String(hit) : '?',
      864,
      772,
      246,
      104,
      show ? (hit ? C.green : C.pink) : C.yellow,
      56,
    );
  });
  text(
    ctx,
    api,
    moved
      ? 'The original four IDs are back. Only the destination replica changed.'
      : changed
        ? 'Same replica and namespace. Only the first token changed.'
        : 'Reference replay on the warm replica',
    960,
    977,
    34,
    C.muted,
    'center',
  );
}

export default {
  id: 'failure-drill',
  draw: drawFailureDrill,
  cues: [
    'drill-reference',
    'drill-change',
    'drill-miss',
    'drill-restore',
    'drill-warm',
    'drill-move',
    'drill-cold',
    'drill-timing',
  ],
};
