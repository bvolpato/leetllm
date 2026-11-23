import { vvProgress } from '../construction.mjs';
import { tokenCell } from '../defaults.mjs';

export function drawTenantCache(ctx, scene, state, api) {
  const { C } = api;
  const p = (id, b) => vvProgress(state, 'tenant-' + id, b);
  const two = p('second', 0) > 0;
  const changed = p('adapter', 2) > 0;
  api.focus.target('tenant-records', () => {
    const headings = ['Authenticated group', 'Gateway namespace', 'Prompt', 'Adapter'];
    const columns = [140, 590, 1050, 1505];
    const widths = [380, 390, 380, 280];
    headings.forEach((name, i) => api.text(ctx, name, columns[i], 338, 32, C.ink));
    const rows = [
      ['Orchard', 'Orchard', 'same 4 tokens', changed ? 'B' : 'A'],
      ['Meadow', 'Meadow', 'same 4 tokens', 'A'],
    ];
    for (let row = 0; row < (two ? 2 : 1); row++) {
      rows[row].forEach((value, col) => {
        tokenCell(
          api,
          value,
          columns[col],
          395 + 142 * row,
          widths[col],
          95,
          col === 3 && row === 0 && changed ? C.yellow : row ? C.pink : C.cyan,
          col === 1 || (col === 3 && row === 0 && changed),
          34,
        );
      });
    }
    if (state.beat === 1 && p('enforce', 1) > 0) {
      api.text(
        ctx,
        'The gateway assigns each namespace after authentication.',
        960,
        812,
        42,
        C.green,
        'center',
      );
      api.text(
        ctx,
        'Source access still needs an authorization check.',
        960,
        915,
        35,
        C.ink,
        'center',
      );
    }
    if (changed) {
      api.text(
        ctx,
        'Orchard’s cached block uses A. Its new request uses B.',
        960,
        813,
        40,
        C.ink,
        'center',
      );
      api.text(ctx, 'Compute this block under B.', 960, 914, 43, C.yellow, 'center');
    }
  });
}
export default {
  id: 'tenant-cache',
  draw: drawTenantCache,
  cues: ['tenant-second', 'tenant-enforce', 'tenant-adapter'],
};
