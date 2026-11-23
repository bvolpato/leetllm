import { settled } from '../construction.mjs';
import { prefixReuse } from '../model.mjs';
import { slot, text } from '../defaults.mjs';

const ids = ['A', 'B', 'C', 'D', 'E'];

export function drawServiceReplay(ctx, scene, state, api) {
  const { C } = api;
  if (state.beat === 0) {
    text(ctx, api, 'CPU   ·   article lookup helper', 145, 298, 42, C.ink);
    api.text(ctx, 'ids = ["A", "B", "C", "D", "E"]', 145, 421, 38, C.blue, 'left', 'mono');
    for (const [i, key] of ['A', 'B'].entries()) {
      const y = 527 + i * 185;
      const changed = !i || settled(state, 'replay-key', 0, 0.58);
      const result = i
        ? settled(state, 'replay-zero', 0, 0.64)
        : settled(state, 'replay-four', 0, 0.38);
      const value = prefixReuse(ids, ids, 'A', key, 4).reusable;
      api.focus.target(i ? 'replay-other' : 'replay-same', () => {
        api.text(
          ctx,
          changed ? 'match_len(ids, ids, "A", "' + key + '", 4)' : 'Second lookup',
          145,
          y + 60,
          39,
          changed ? C.ink : C.muted,
          'left',
          'mono',
        );
      });
      api.focus.target(i ? 'replay-result-b' : 'replay-result-a', () =>
        slot(
          ctx,
          api,
          result ? value + ' positions' : '?',
          1250,
          y,
          460,
          100,
          result ? C.cyan : C.muted,
          40,
        ),
      );
    }
    text(ctx, api, 'Last argument: four positions per page', 145, 969, 32, C.muted);
    return;
  }
  const repeat = settled(state, 'replay-live', 1, 0.72);
  const observe = settled(state, 'replay-observe', 1, 0.89);
  api.focus.target('replay-owner', () => {
    text(ctx, api, 'CPU lifetime check', 155, 315, 34, C.muted);
    text(ctx, api, 'One owner still holds the segment', 155, 389, 38, C.ink);
    text(ctx, api, 'Eviction blocked', 155, 449, 36, C.cyan);
  });
  api.focus.target('replay-bound', () => {
    text(ctx, api, 'CPU transfer calculation', 1020, 315, 34, C.muted);
    text(ctx, api, '512 MiB at 25 GB/s', 1020, 389, 38, C.ink);
    text(ctx, api, '21.47 ms payload-only bound', 1020, 449, 36, C.cyan);
  });
  api.focus.target('replay-next', () => {
    text(ctx, api, 'Serving replay to run', 155, 626, 38, C.ink);
    slot(ctx, api, 'Warm the worker', 155, 680, 465, 90, C.blue);
    if (repeat) {
      slot(ctx, api, 'Repeat the same prompt', 715, 680, 465, 90, C.blue, 32);
      slot(ctx, api, 'Change one early token', 1275, 680, 465, 90, C.blue, 32);
    }
  });
  api.focus.target('replay-observe', () => {
    text(
      ctx,
      api,
      observe
        ? 'Read the batch trace: matched positions and fresh prefill positions'
        : 'A model, weights and a configured backend are required',
      960,
      924,
      34,
      observe ? C.yellow : C.muted,
      'center',
    );
  });
}

export default {
  id: 'service-replay',
  draw: drawServiceReplay,
  cues: [
    'replay-base',
    'replay-four',
    'replay-key',
    'replay-zero',
    'replay-evidence',
    'replay-bound',
    'replay-live',
    'replay-observe',
  ],
};
