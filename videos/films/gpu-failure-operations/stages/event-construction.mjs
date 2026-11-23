import { classifyGpuReceipt, gpuFrame, memoryReceipt } from '../arithmetic.mjs';
import { gpuReceiptFixtures } from '../fixtures.mjs';
import { diagram } from '../incident-diagram.mjs';

function draw(ctx, scene, state, api) {
  const original = gpuReceiptFixtures[0], f = gpuFrame(state), v = memoryReceipt(original);
  const { C } = api;
  const { label, line, block } = diagram(ctx, api);
  const x = 165, width = 1580, y = 317;
  label('r-7812    /    same GPU, same memory readings', x, 268, 35, C.ink);
  let left = x;
  for (const [amount, color] of [[original.pytorch_allocated_gib, C.blue], [v.gap, C.cyan], [v.outside, C.pink], [v.free, C.yellow]]) {
    const w = width * amount / original.capacity_gib;
    block(left, y, w, 48, color);
    left += w;
  }
  label('Free   ' + v.free.toFixed(2), x, 432, 34, C.yellow);
  label('Inactive total   ' + original.inactive_split_block_total_gib.toFixed(2), 680, 432, 34, C.cyan);
  label('Largest   ' + original.largest_inactive_split_block_gib.toFixed(2) + ' GiB', 1745, 432, 34, C.cyan, 'right');
  const cases = [
    [original, 'event-base', 0],
    [{ ...original, cuda_error: 'success' }, 'event-success', 1],
    [{ ...original, oom_request_gib: null }, 'event-size', 2],
    [{ ...original, allocator_backend: 'cudaMallocAsync' }, 'event-backend', 3],
  ];
  const cols = [165, 530, 875, 1275];
  ['Operation result', 'Request size', 'Backend', 'Worksheet'].forEach((s, i) => label(s, cols[i], 552, 30, C.muted));
  for (const [i, [r, cue, beat]] of cases.entries()) {
    if (i && !f.started(cue + '-input', beat)) break;
    const rowY = 636 + 100 * i;
    api.focus.target('event-row-' + i, () => {
      line(x, rowY - 58, 1745, rowY - 58, C.muted, 2);
      label(r.cuda_error === 'success' ? 'success' : 'OOM', cols[0], rowY, 35, C.ink);
      label(r.oom_request_gib === null ? 'unknown' : r.oom_request_gib.toFixed(2) + ' GiB', cols[1], rowY, 35, r.oom_request_gib === null ? C.yellow : C.ink);
      label(r.allocator_backend, cols[2], rowY, 32, C.ink);
      const reveal = f.completed(cue, beat);
      label(reveal ? classifyGpuReceipt(r).hypothesis : '?', cols[3], rowY, 31, reveal ? C.cyan : C.yellow);
    });
  }
}
export default { id: 'event-construction', draw, cues: ['event-base', 'event-success-input', 'event-success', 'event-size-input', 'event-size', 'event-backend-input', 'event-backend'] };
