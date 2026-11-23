import { prefillRequest } from '../model.mjs';
import { cueProgress, memoryRail } from '../worksheet.mjs';

export function drawSynthesis(ctx, scene, state, api) {
  const { C, focus } = api,
    p = cueProgress(scene, state, api);
  const text = (s, x, y, size, color = C.ink, align = 'left') =>
    api.text(ctx, s, x, y, size, color, align);
  const large = prefillRequest(15),
    small = prefillRequest(6);
  const x = 420,
    width = 1330,
    maximum = 28;
  const pos = (gb) => x + (width * gb) / maximum;
  focus.target('live-bytes', () => {
    text('Illustrated allocation trace   /   prefill   /   same 4 logs', 128, 261, 35);
    text('Weights', 128, 363, 30, C.blue);
    text('7.6 GB', 128, 410, 38, C.blue);
    text('Capped cache', 620, 363, 30, C.cyan);
    text(large.cacheGB.toFixed(3) + ' GB', 620, 410, 38, C.cyan);
    text('Free on the device', 1190, 363, 30, C.yellow);
    text(large.freeGB.toFixed(3) + ' GB', 1190, 410, 38, C.yellow);
  });
  function request(row, y, u, name, target) {
    focus.target(target, () => {
      text(name, 128, y + 44, 32);
      const end = memoryRail(ctx, api, {
        x,
        y,
        width,
        maximum,
        height: 62,
        segments: [
          { gb: row.weightsGB, color: C.blue },
          { gb: row.cacheGB, color: C.cyan },
        ],
      });
      if (u > 0) {
        // Outline is an allocation request. Only the successful replay can fill it.
        api.rect(
          ctx,
          end,
          y,
          (width * row.temporaryGB * u) / maximum,
          62,
          u === 1 && row.fits ? C.green : null,
          row.fits ? C.green : C.pink,
          2,
        );
      }
      if (u === 1)
        text(
          row.temporaryGB + ' GB requested   ·   ' + (row.fits ? 'allocated' : 'allocation failed'),
          end,
          y + 112,
          31,
          row.fits ? C.green : C.pink,
        );
    });
  }
  request(large, 526, p('large-request'), 'Original chunk', 'original');
  if (state.beat >= 2) request(small, 729, p('small-request'), 'Smaller chunk', 'replay');
  focus.target('capacity', () => {
    api.line(ctx, pos(24), 494, pos(24), 831, C.yellow, 4);
    text('24 GB', pos(24), 479, 28, C.yellow, 'center');
  });
  focus.target('trace-decision', () => {
    const msg =
      state.beat === 0
        ? 'Can the allocator grant a 15 GB temporary buffer?'
        : state.beat === 1
          ? p('large-request') === 1
            ? 'The failed request is for prefill workspace.'
            : 'Requested space starts at the end of the live cache.'
          : 'Record the failed allocation and its phase alongside the replay.';
    text(msg, 128, 951, 39, C.ink);
  });
}
export default {
  id: 'synthesis',
  draw: drawSynthesis,
  cues: ['same-logs', 'ask-allocation', 'large-request', 'small-request', 'save-replay'],
};
