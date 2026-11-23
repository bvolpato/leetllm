import { spokenProgress } from '../construction.mjs';
import { MOE_INPUTS } from '../fixtures.mjs';
import { moePacked } from '../model.mjs';
import { rect, text } from '../defaults.mjs';
import { assignmentTicket, incomingX, inputLine, packedX, rowY } from '../packed-rows.mjs';

export function drawPackPermutation(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  const { packed, groups } = moePacked();
  const travel = spokenProgress(api, state, 'group-tickets', 1, 0.06, 0.67);
  const follow = beat >= 2;
  const marked = spokenProgress(api, state, 'both-addresses', 3, 0.06, 0.38) > 0;
  text(ctx, api, 'Grouped by expert', packedX, 274, 43, C.ink);
  text(ctx, api, travel < 1 ? 'Incoming assignments' : 'Token zero', incomingX, 274, 43, C.ink);
  api.focus.target('assignment-rack', () => {
    let index = 0;
    groups.forEach((group, e) => {
      const y = rowY(index);
      rect(
        ctx,
        api,
        packedX - 34,
        y + 3,
        7,
        (group.length - 1) * 111 + 70,
        [C.blue, C.pink, C.yellow][e],
        undefined,
        2,
      );
      group.forEach(() => {
        rect(ctx, api, packedX, rowY(index++), 435, 78, C.bg, '#4f525b', 10);
      });
    });
    packed.forEach((row, i) => {
      // One ticket at a time changes lanes in the clear space between the two racks.
      const q = api.clamp(travel * packed.length - i, 0, 1);
      const x =
        q < 0.3
          ? api.lerp(incomingX, 734, q / 0.3)
          : q < 0.7
            ? 734
            : api.lerp(734, packedX, (q - 0.7) / 0.3);
      const y = api.lerp(rowY(row.index), rowY(i), api.phase(q, 0.3, 0.7));
      assignmentTicket(
        ctx,
        api,
        row,
        x,
        y,
        marked ? row.token === 0 : beat === 0 && row.index === 0,
      );
    });
  });
  if (travel === 1) {
    text(
      ctx,
      api,
      follow && !marked ? 'Which rows come back here?' : 'Original input  [1, 2]',
      1240,
      412,
      32,
      C.cyan,
    );
    if (marked) {
      const routes = packed.filter((r) => r.token === 0);
      routes.forEach((row, i) =>
        text(
          ctx,
          api,
          'E' + row.expert + '   ×' + row.gate,
          1298,
          546 + i * 97,
          46,
          C.cyan,
          'left',
          'mono',
        ),
      );
    }
    text(
      ctx,
      api,
      'Packed token IDs   [' + packed.map((row) => row.token).join(', ') + ']',
      packedX,
      916,
      31,
      C.ink,
    );
  }
  inputLine(ctx, api, MOE_INPUTS);
}

export default {
  id: 'pack-permutation',
  draw: drawPackPermutation,
  cues: ['read-ticket', 'group-tickets', 'find-address', 'both-addresses'],
};
