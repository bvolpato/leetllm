import { gpuFrame, memoryReceipt } from '../arithmetic.mjs';
import { gpuReceiptFixtures } from '../fixtures.mjs';
import { diagram } from '../incident-diagram.mjs';

function draw(ctx, scene, state, api) {
  const f = gpuFrame(state), { C } = api;
  const { label, block, line } = diagram(ctx, api);
  const original = gpuReceiptFixtures[0];
  const missing = f.started('owner-missing', 2);
  const r = missing ? { ...original, nvml_device_used_gib: null } : original;
  const v = memoryReceipt(r);
  const x = 225, width = 1450, scale = width / r.capacity_gib;
  const reserveEnd = x + r.pytorch_reserved_gib * scale;
  const usedEnd = x + (r.nvml_device_used_gib ?? 0) * scale;
  label(r.gpu_uuid + '    /    same scope and incident window', x, 274, 39);
  api.focus.target('owner-readings', () => {
    label('PyTorch reserve   ' + r.pytorch_reserved_gib.toFixed(2) + ' GiB', x, 390, 39, C.cyan);
    block(x, 423, reserveEnd - x, 75, C.cyan);
    label('NVML device used   ' + (missing ? 'unavailable' : r.nvml_device_used_gib.toFixed(2) + ' GiB'), x, 587, 39, missing ? C.muted : C.pink);
    block(x, 620, missing ? width : usedEnd - x, 75, missing ? C.panel : C.pink, missing ? C.muted : undefined);
    if (!missing) {
      line(reserveEnd, 513, reserveEnd, 606, C.ink, 2);
      line(usedEnd, 536, usedEnd, 606, C.ink, 2);
      line(reserveEnd, 541, usedEnd, 541, C.ink, 2);
    }
  });
  const delta = f.completed('owner-delta', 0);
  const expression = (missing ? '?' : r.nvml_device_used_gib.toFixed(2)) + ' − ' + r.pytorch_reserved_gib.toFixed(2) + ' = ';
  api.focus.target('owner-delta-value', () => {
    label(expression + (missing ? 'unknown' : delta ? v.outside.toFixed(2) + ' GiB' : '?'), 960, 854, 63, C.ink, 'center');
    label(missing ? 'Collect a matching device reading.' : 'Outside this reserve   /   owner still unknown', 960, 972, 36, C.muted, 'center');
  });
}
export default { id: 'ownership', draw, cues: ['owner-delta','owner-missing'] };
