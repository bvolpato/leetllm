import { sequentialOffload } from '../arithmetic.mjs';
import { accEvent } from '../construction.mjs';

export function drawOffload(ctx, scene, state, api) {
  const { C, rect, line, text } = api;
  const at = (name, beat) => accEvent(scene, state, name, beat);
  const fraction = 0.01 * at('one', 1) + 0.09 * at('ten', 3);
  const transfer = sequentialOffload(fraction);
  const showTime = state.beat === 0 || state.beat > 2 || at('time', 2) === 1;
  const left = 150,
    width = 1620,
    timeScale = width / 32;
  api.focus.target('weight-routes', () => {
    text(ctx, 'Weights read per decode batch', left, 279, 39, C.ink);
    text(ctx, '16 GB', left + width, 279, 43, C.ink, 'right');
    const localWidth = width * (1 - fraction);
    rect(ctx, left, 324, localWidth, 64, C.cyan, undefined, 0);
    if (fraction > 0)
      rect(ctx, left + localWidth, 324, width - localWidth, 64, C.pink, undefined, 0);
    text(
      ctx,
      'Device  ' + (transfer.residentBytes / 1e9).toFixed(2) + ' GB  ·  3.35 TB/s',
      left,
      450,
      34,
      C.cyan,
    );
    text(
      ctx,
      'Host  ' + (transfer.hostBytes / 1e9).toFixed(2) + ' GB  ·  64 GB/s',
      left + width,
      450,
      34,
      C.pink,
      'right',
    );
    text(ctx, 'Time spent reading those bytes', left, 590, 39, C.ink);
    if (showTime) {
      const end = left + timeScale * transfer.residentMs;
      rect(ctx, left, 645, end - left, 62, C.cyan, undefined, 0);
      if (transfer.hostMs > 0)
        rect(ctx, end, 645, transfer.hostMs * timeScale, 62, C.pink, undefined, 0);
    } else {
      text(ctx, 'How much of the read time belongs to the host?', left, 696, 37, C.yellow);
    }
    for (const ms of [0, 8, 16, 24, 32]) {
      const x = left + ms * timeScale;
      line(ctx, x, 725, x, 742, C.muted, 2);
      text(ctx, ms + ' ms', x, 785, 30, C.muted, 'center');
    }
    if (showTime) {
      const result =
        state.beat === 0
          ? 'All on device   ' + transfer.total.toFixed(1) + ' ms'
          : transfer.residentMs.toFixed(1) +
            ' + ' +
            transfer.hostMs.toFixed(1) +
            ' ≈ ' +
            transfer.total.toFixed(1) +
            ' ms';
      text(ctx, result, left, 899, 44, C.ink);
      if (state.beat >= 2 && at('share', 2) === 1)
        text(
          ctx,
          ((100 * transfer.hostMs) / transfer.total).toFixed(1) + '% of time on host path',
          left + width,
          900,
          37,
          C.pink,
          'right',
        );
    }
    text(
      ctx,
      state.beat >= 3
        ? transfer.ratio.toFixed(1) + '× the all-device time'
        : 'Sequential reads at supplied bandwidths',
      960,
      992,
      32,
      C.muted,
      'center',
    );
  });
}
export default {
  id: 'offload',
  draw: drawOffload,
  cues: [
    'ag-offload-local',
    'ag-offload-one',
    'ag-offload-time',
    'ag-offload-share',
    'ag-offload-ten',
  ],
};
