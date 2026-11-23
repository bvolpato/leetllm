import { classifyGpuReceipt, freshGpuReceipt, gpuFrame, memoryReceipt } from '../arithmetic.mjs';
import { diagram } from '../incident-diagram.mjs';

function draw(ctx, scene, state, api) {
  const f = gpuFrame(state), { C } = api;
  const { label, block, line } = diagram(ctx, api);
  const mixed = f.started('fresh-finding', 2);
  const row = freshGpuReceipt(mixed ? { dcgm_findings: ['memory'], cuda_error: 'illegal_address' } : {});
  const result = classifyGpuReceipt(row), v = memoryReceipt(row);
  const outside = f.completed('fresh-outside', 1), free = f.completed('fresh-free', 1);
  label('fresh-32    /    ' + row.capacity_gib + ' GiB device    /    native allocator', 155, 254, 33, C.ink);
  api.focus.target('fresh-budget', () => {
    const left = 165, width = 1570, scale = width / row.capacity_gib;
    const segments = [
      [row.pytorch_allocated_gib, C.blue], [v.gap, C.cyan], [v.outside, C.pink], [v.free, C.yellow],
    ];
    let x = left;
    for (const [size, color] of segments) {
      block(x, 345, size * scale, 75, color);
      x += size * scale;
    }
    label('Live ' + row.pytorch_allocated_gib + '   /   Reserve ' + row.pytorch_reserved_gib, left, 490, 34, C.blue);
    label('Device used ' + row.nvml_device_used_gib + ' GiB', 1735, 490, 34, C.ink, 'right');
    label('Outside reserve   ' + (outside ? v.outside.toFixed(1) + ' GiB' : '?'), left, 575, 34, C.pink);
    label('Device free   ' + (free ? v.free.toFixed(1) + ' GiB' : '?'), 1735, 575, 34, C.yellow, 'right');
  });
  line(165, 629, 1735, 629, C.muted, 2);
  api.focus.target('fresh-event', () => {
    if (mixed) {
      label('New device finding   /   decoded memory defect', 165, 716, 36, C.pink);
      label('Captured process error   /   illegal address', 165, 790, 36, C.pink);
    } else {
      label('Failed request   ' + row.oom_request_gib + ' GiB', 165, 716, 40, C.ink);
      label('Inactive total   ' + row.inactive_split_block_total_gib + ' GiB     /     Largest block   ' + row.largest_inactive_split_block_gib + ' GiB', 165, 790, 36, C.cyan);
    }
  });
  api.focus.target('fresh-decision', () => {
    const answer = mixed ? f.completed('fresh-both', 3) : f.completed('fresh-fragments', 1);
    const decision = result.mustRelaunch ? 'Isolate the GPU and relaunch the process.' : 'Inspect the allocator layout and attribute outside use.';
    label(answer ? decision : mixed ? 'What must each owner do?' : 'Which evidence would you inspect first?', 960, 922, 44, answer ? C.ink : C.yellow, 'center');
    if (answer) label(result.hypothesis + '     /     relaunch required   ' + (result.mustRelaunch ? 'True' : 'False'), 960, 997, 29, C.muted, 'center');
  });
}
export default { id: 'earned-gpu-transfer', draw, cues: ['fresh-free', 'fresh-outside', 'fresh-fragments', 'fresh-finding', 'fresh-both'] };
