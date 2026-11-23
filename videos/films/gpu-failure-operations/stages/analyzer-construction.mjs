import { classifyGpuReceipt, gpuFrame } from '../arithmetic.mjs';
import { gpuReceiptFixtures } from '../fixtures.mjs';
import { diagram } from '../incident-diagram.mjs';

function draw(ctx, scene, state, api) {
  const { C } = api, f = gpuFrame(state);
  const { label, block, line } = diagram(ctx, api);
  if (f.b === 3) {
    label('Article worksheet   /   eight synthetic receipts', 155, 265, 36);
    ['Receipt', 'Primary hypothesis', 'Outside reserve', 'Relaunch required'].forEach((s, i) =>
      label(s, [160, 490, 1120, 1480][i], 364, 29, C.muted));
    gpuReceiptFixtures.forEach((row, i) => {
      const r = classifyGpuReceipt(row), y = 440 + 70 * i;
      label(row.receipt_id, 160, y, 32, C.blue);
      label(r.hypothesis, 490, y, 32);
      label(r.outside === null ? 'unknown' : r.outside.toFixed(2) + ' GiB', 1120, y, 30, C.cyan);
      label(r.mustRelaunch ? 'Yes' : 'No', 1480, y, 30, r.mustRelaunch ? C.pink : C.muted);
    });
    return;
  }
  if (f.b === 2) {
    label('Inputs to the read-only analyzer', 155, 275, 38);
    for (const [i, [field, value, meaning]] of [
      ['Request size', 'true', 'Boolean in a size field'],
      ['Device used', 'null', 'Reading unavailable'],
      ['Allocated / reserved', '38 / 36 GiB', 'Live bytes exceed their reserve'],
      ['Decoded findings', 'raw “Fail”', 'Full diagnostic code still needed'],
    ].entries()) {
      const y = 410 + i * 147;
      label(field, 155, y, 32, C.ink);
      label(value, 680, y, 36, C.yellow);
      label(meaning, 1070, y, 31, C.muted);
      line(155, y + 41, 1765, y + 41, C.muted, 1);
    }
    return;
  }
  const left = 210, right = 1510, scale = (right - left) / 40;
  const requestProgress = f.progress('analyzer-add', 1);
  api.focus.target('analyzer-capacity', () => {
    label('Live tensors and the next request   /   40 GiB device', left, 248, 37, C.muted);
    for (const [i, r] of gpuReceiptFixtures.slice(0, 2).entries()) {
      const y = 375 + 195 * i;
      const live = r.pytorch_allocated_gib, ask = r.oom_request_gib;
      const end = left + scale * live;
      label(r.receipt_id + '     Live ' + live.toFixed(2) + ' GiB   +   request ' + ask.toFixed(2) + ' GiB', left, y - 35, 35);
      line(left, y + 26, right, y + 26, C.muted, 2);
      block(left, y, end - left, 52, C.blue);
      if (requestProgress > 0) block(end, y, scale * ask * requestProgress, 52, C.yellow);
      line(right, y - 11, right, y + 64, C.ink, 3);
      const reveal = f.completed(i === 1 ? 'analyzer-answer' : 'analyzer-first', 1);
      if (reveal) label((live + ask).toFixed(2) + ' GiB', right + 45, y + 41, 34, i ? C.pink : C.cyan);
    }

    if (f.started('analyzer-zoom', 0)) {
      const r = gpuReceiptFixtures[1], live = r.pytorch_allocated_gib, ask = r.oom_request_gib;
      const low = 39, high = 40.2, insetLeft = 210, insetRight = 1630;
      const pos = n => insetLeft + (n - low) / (high - low) * (insetRight - insetLeft);
      label('r-7813    /    last part of the device, magnified', insetLeft, 735, 36, C.blue);
      line(insetLeft, 846, insetRight, 846, C.muted, 3);
      block(insetLeft, 801, pos(live) - insetLeft, 45, C.blue);
      if (requestProgress > 0) block(pos(live), 801, pos(live + ask * requestProgress) - pos(live), 45, C.yellow);
      for (const tick of [low, r.capacity_gib, high]) {
        line(pos(tick), 788, pos(tick), 868, tick === r.capacity_gib ? C.ink : C.muted, 3);
        label(tick.toFixed(1), pos(tick), 914, 32, C.ink, 'center');
      }
      const over = live + ask - r.capacity_gib;
      label(f.completed('analyzer-answer', 1) ? over.toFixed(2) + ' GiB beyond capacity' :
        'Live ends at ' + live.toFixed(2) + ' GiB. Where will the request end?', insetLeft, 1001, 36, C.ink);
    }
  });
}
export default { id: 'analyzer-construction', draw, cues: ['analyzer-zoom', 'analyzer-add', 'analyzer-answer', 'analyzer-first'] };
