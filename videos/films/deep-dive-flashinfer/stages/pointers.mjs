import { prefix } from '../arithmetic.mjs';
import { bracket, tile } from '../cache-picture.mjs';
import { requests } from '../fixtures.mjs';

const queryRows = requests.flatMap((r) => Array.from({ length: r.q }, (_, i) => `${r.id}·${i}`));
const pages = requests.flatMap((r) => r.pages.map(String));
const queryOffsets = prefix(requests.map((r) => r.q));
const pageOffsets = prefix(requests.map((r) => r.pages.length));

export function drawPointers(ctx, scene, state, api) {
  const { C } = api;
  const request = state.beat;
  const tracks = [
    { name: 'Query rows', values: queryRows, offsets: queryOffsets, y: 368, color: C.cyan },
    { name: 'Page IDs', values: pages, offsets: pageOffsets, y: 700, color: C.blue },
  ];
  api.focus.target('pointers-ranges', () => {
    for (const { name, values, offsets, y, color } of tracks) {
      const start = offsets[request];
      const end = offsets[request + 1];
      api.text(ctx, name, 130, y + 54, 38, color);
      api.text(
        ctx,
        `${name === 'Query rows' ? 'qo_indptr' : 'kv_indptr'}   [${offsets.join(', ')}]`,
        420,
        y - 75,
        40,
        color,
        'left',
        'mono',
      );
      values.forEach((label, i) => {
        const active = i >= start && i < end;
        const x = 420 + i * 166;
        api.text(ctx, String(i), x + 76, y - 17, 27, C.muted, 'center');
        tile(api, label, x, y, 152, 82, active ? C.yellow : color, active ? C.yellow : C.ink);
      });
      bracket(ctx, api, 420 + start * 166, 420 + end * 166 - 14, y + 115, C.yellow);
      api.text(
        ctx,
        `${requests[request].id}  [${start}, ${end})`,
        420 + (start + end) * 83 - 7,
        y + 172,
        34,
        C.yellow,
        'center',
      );
    }
  });
}
export default {
  id: 'pointers',
  draw: drawPointers,
  cues: ['pointers-first', 'pointers-middle', 'pointers-last'],
};
