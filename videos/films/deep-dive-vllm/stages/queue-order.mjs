import { vvProgress } from '../construction.mjs';
import { vvReleaseRequest } from '../model.mjs';
import { tokenCell } from '../defaults.mjs';

const startingTables = { R1: [12, 73, 90], R2: [41] };
const released = vvReleaseRequest(startingTables, new Set([12, 73]), 'R1');
const contents = { 90: 'partial block', 73: 'cached suffix', 12: 'cached prefix' };

export function drawQueueOrder(ctx, scene, state, api) {
  const { C } = api;
  const progress = (id, beat) => vvProgress(state, 'vv-queue-order-' + id, beat);
  const release = progress('release-backward', 0) * released.free.length;
  const first = progress('take-partial', 2);
  const suffixEvicted = progress('remove-hash', 2) === 1;
  const second = progress('take-suffix', 2);
  const xAt = (column) => 570 + column * 423;

  api.focus.target('vllm-queue-order-mechanism', () => {
    const table = startingTables.R1.slice(0, startingTables.R1.length - Math.floor(release));
    api.text(ctx, table.length ? 'R1' : 'R1 retired', 120, 359, 45, C.pink);
    api.text(ctx, '[' + table.join(',') + ']', 120, 419, 34, C.ink);
    api.text(ctx, 'Free queue', 120, 593, 45, C.cyan);
    api.text(ctx, 'Head → tail', 120, 651, 34, C.ink);
    api.line(ctx, 570, 673, 1760, 673, C.cyan, 3);
    if (release === released.free.length) {
      const next = Number(first > 0) + Number(second > 0);
      api.text(ctx, 'Next to allocate', xAt(next) + 172, 519, 31, C.cyan, 'center');
    }
    if (state.beat === 2) api.text(ctx, 'New request', 120, 846, 42, C.green);
    tokenCell(api, 'Slot 41 · refs1 · R2 live', 120, 935, 420, 71, C.blue);

    released.free.forEach((slot, i) => {
      const drop = Math.max(0, Math.min(1, release - i));
      const take = i === 0 ? first : i === 1 ? second : 0;
      const liveColumn = startingTables.R1.indexOf(slot);
      // Travel between the two rows before entering the queue.
      const across = Math.max(0, Math.min(1, 2 * drop - 0.5));
      const down = Math.min(1, 4 * drop) + Math.max(0, 4 * drop - 3);
      const x = xAt(liveColumn + (i - liveColumn) * across);
      const y = 302 + 123 * down + 240 * take;
      const color = take > 0 ? C.green : drop > 0 ? C.cyan : C.pink;
      let label = slot + ' · ' + contents[slot];
      if (slot === 90 && take > 0) label = '90 · fresh space';
      if (slot === 73 && suffixEvicted) label = '73 · hash removed';
      tokenCell(api, label, x, y, 345, 105, color, true, 32);
    });
    const caption =
      state.beat === 1
        ? 'Which cached block will a second allocation reach?'
        : progress('prefix', 2) === 1
          ? 'Slot 12 can still serve a matching prefix.'
          : '';
    if (caption) api.text(ctx, caption, 1195, 985, 35, C.yellow, 'center');
  });
}

export default {
  id: 'queue-order',
  draw: drawQueueOrder,
  cues: [
    'vv-queue-order-release-backward',
    'vv-queue-order-free-order',
    'vv-queue-order-take-partial',
    'vv-queue-order-take-suffix',
    'vv-queue-order-remove-hash',
    'vv-queue-order-prefix',
  ],
};
