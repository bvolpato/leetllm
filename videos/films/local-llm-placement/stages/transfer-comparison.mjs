import { stream } from '../model.mjs';
import { cueProgress } from '../worksheet.mjs';

export function drawTransferComparison(ctx, scene, state, api) {
  const { C, focus } = api,
    p = cueProgress(scene, state, api);
  const text = (s, x, y, size, color = C.ink, align = 'left') =>
    api.text(ctx, s, x, y, size, color, align);
  const bytes = stream(0).payload;
  const peak = 1008,
    hostRate = 25,
    diskRate = stream(2).spans[0].rate;
  const total = (device, host, rate) => 1000 * (device / rate + host / hostRate);
  const shift = p('peak-bandwidth');
  // Only the device term changes as the assumed device bandwidth moves to its peak.
  const rate = 500 + (peak - 500) * shift;
  const fast = total(bytes, 0, rate),
    mixed = total(5.6, 2, rate);
  focus.target('device-rate', () => {
    text('Assumed device read', 138, 275, 34);
    text(Math.round(rate).toLocaleString('en-US') + ' GB/s', 610, 279, 44, C.blue);
    text('Host link stays at 25 GB/s', 1150, 275, 34, C.pink);
  });
  const left = 480,
    width = 1110;
  focus.target('fast-axis', () => {
    text('Detail   /   first 100 milliseconds', 138, 405, 36);
    for (const [i, [label, device, host]] of [
      ['All device', bytes, 0],
      ['Device + host', 5.6, 2],
    ].entries()) {
      const y = 473 + i * 99;
      const deviceMs = total(device, 0, rate),
        hostMs = total(0, host, rate);
      text(label, 138, y + 38, 32);
      api.rect(ctx, left, y, width, 52, C.panel, C.muted, 2);
      api.rect(ctx, left, y, (width * deviceMs) / 100, 52, C.blue, undefined, 2);
      if (host)
        api.rect(
          ctx,
          left + (width * deviceMs) / 100,
          y,
          (width * hostMs) / 100,
          52,
          C.pink,
          undefined,
          2,
        );
      text((deviceMs + hostMs).toFixed(2) + ' ms', 1820, y + 39, 32, C.ink, 'right');
    }
    if (p('compare-floors') > 0)
      text('Mixed / all device ≈ ' + (mixed / fast).toFixed(2) + '×', 480, 718, 37, C.yellow);
  });
  focus.target('long-axis', () => {
    if (state.beat === 0) return;
    text('Full payload   /   1,600 ms scale', 138, 802, 34);
    for (const [i, [label, bandwidth, cue]] of [
      ['Host link', hostRate, 'all-host'],
      ['Storage read', diskRate, 'read-file'],
    ].entries()) {
      const y = 842 + i * 93,
        ms = (bytes / bandwidth) * 1000,
        u = p(cue);
      text(label + '  ·  ' + bandwidth + ' GB/s', 138, y + 33, 26);
      api.rect(ctx, left, y, width, 43, C.panel, C.muted, 2);
      if (u > 0)
        api.rect(ctx, left, y, (width * ms * u) / 1600, 43, i ? C.yellow : C.pink, undefined, 2);
      if (u === 1) text(ms.toFixed(0) + ' ms', 1820, y + 33, 31, C.ink, 'right');
    }
  });
}
export default {
  id: 'transfer-comparison',
  draw: drawTransferComparison,
  cues: ['peak-bandwidth', 'compare-floors', 'all-host', 'read-file'],
};
