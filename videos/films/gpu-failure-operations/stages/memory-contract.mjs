import { gpuFrame, memoryReceipt } from '../arithmetic.mjs';
import { gpuReceiptFixtures } from '../fixtures.mjs';
import { diagram } from '../incident-diagram.mjs';

function draw(ctx, scene, state, api) {
  const r = gpuReceiptFixtures[0], v = memoryReceipt(r), f = gpuFrame(state);
  const { C } = api;
  const { label, line, block } = diagram(ctx, api);
  const x = 200, width = 1520, scale = width / r.capacity_gib;
  const liveEnd = x + r.pytorch_allocated_gib * scale;
  const reserveEnd = x + r.pytorch_reserved_gib * scale;
  const usedEnd = x + r.nvml_device_used_gib * scale;
  const capEnd = x + width;
  const fmt = n => n.toFixed(2);
  api.focus.target('memory-device', () => {
    label(r.gpu_uuid + '    /    ' + fmt(r.capacity_gib) + ' GiB device', x, 248, 34, C.ink);
    line(x, 337, reserveEnd, 337, C.cyan, 4);
    line(x, 337, x, 357, C.cyan, 4);
    line(reserveEnd, 337, reserveEnd, 357, C.cyan, 4);
    label('PyTorch reserve   ' + fmt(r.pytorch_reserved_gib), (x + reserveEnd) / 2, 312, 34, C.cyan, 'center');
    block(x, 375, liveEnd - x, 94, C.blue);
    block(liveEnd, 375, reserveEnd - liveEnd, 94, C.cyan);
    block(reserveEnd, 375, usedEnd - reserveEnd, 94, C.pink);
    block(usedEnd, 375, capEnd - usedEnd, 94, C.yellow);
    label('Live tensors   ' + fmt(r.pytorch_allocated_gib), x, 530, 35, C.blue);
    label('Device use   ' + fmt(r.nvml_device_used_gib), capEnd, 530, 35, C.ink, 'right');
  });

  api.focus.target('memory-detail', () => {
    if (f.b < 2) {
      label('Inside the allocator reserve', x, 652, 31, C.muted);
      const split = f.started('memory-splits', 1);
      const other = f.completed('memory-remainder', 1);
      const gap = f.completed('memory-subtract', 0);
      label(fmt(r.pytorch_reserved_gib) + ' − ' + fmt(r.pytorch_allocated_gib) + ' = ' +
        (gap ? fmt(v.gap) + ' GiB' : '?'), x, 749, 57, C.ink);
      const inset = width * r.inactive_split_block_total_gib / v.gap;
      block(x, 807, width, 55, C.cyan);
      if (split) {
        block(x + inset, 807, width - inset, 55, C.muted);
        label('Inactive split blocks   ' + fmt(r.inactive_split_block_total_gib) + ' GiB', x, 935, 37, C.cyan);
        label(other ? fmt(v.other) + ' GiB other reserve' : 'Other reserve   ?', capEnd, 935, 34, C.ink, 'right');
      } else {
        label('Magnified reserve gap', x, 938, 35, C.cyan);
      }
    } else {
      label('Failed request   ' + fmt(r.oom_request_gib) + ' GiB', x, 656, 41, C.ink);
      const freeWidth = width * v.free / r.oom_request_gib;
      block(x, 741, width, 65, C.panel, C.ink);
      block(x, 741, freeWidth, 65, C.yellow);
      label('Device free   ' + fmt(v.free) + ' GiB', x, 881, 35, C.yellow);
      if (f.completed('memory-short', 2))
        label('Short by ' + fmt(v.deficit) + ' GiB', capEnd, 881, 39, C.pink, 'right');
      label('Same GPU and memory scope, sampled at the failure', x, 997, 30, C.muted);
    }
  });
}
export default { id: 'memory-contract', draw, cues: ['memory-subtract', 'memory-splits', 'memory-remainder', 'memory-short'] };
