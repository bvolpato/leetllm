import { scanWork } from '../arithmetic.mjs';
import { text } from '../defaults.mjs';
import { after, cue } from '../score-trace.mjs';

function drawRounds(ctx, api, name, counts, shown, total, baseline, size, step, color) {
  const { C } = api;
  text(ctx, api, name, 105, baseline - 82, 42, color, 'left');
  text(ctx, api, counts.length + ' rounds', 105, baseline - 27, 36, C.muted, 'left');
  const left = 435;
  api.line(ctx, left, baseline, left + counts.length * step, baseline, C.muted, 2);
  counts.forEach((count, i) => {
    const x = left + (i + 0.5) * step;
    api.line(ctx, x, baseline + 6, x, baseline + 15, C.muted, 2);
    if (i >= shown) return;
    const h = Math.max(2, (150 * count) / size);
    api.rect(ctx, x - step * 0.36, baseline - h, step * 0.72, h, color, undefined, 0);
    if (size === 32 || i === 0 || i === counts.length - 1 || count === 1)
      text(ctx, api, String(count), x, baseline - h - 14, 30, C.ink);
  });
  if (total !== null) text(ctx, api, total.toLocaleString('en-US'), 1695, baseline - 36, 65, color);
}

export function drawScanWork(ctx, scene, state, api) {
  const { C } = api;
  const larger = state.beat === 1;
  const size = larger ? 512 : 32;
  const work = scanWork(size);
  const strides = Array.from({ length: work.hillisStages }, (_, round) => 2 ** round);
  const hillis = strides.map((stride) => size - stride);
  const up = strides.map((stride) => size / (2 * stride));
  const blelloch = [...up, ...up.toReversed()];
  const step = 1070 / blelloch.length;
  const largerCounts = after(state, 'work-larger-counts', 1, 0.4);
  const hillisShown = larger
    ? hillis.length
    : 1 +
      Number(cue(state, 'work-second-stride', 0, 0.14, 0.22) > 0) +
      Math.ceil((hillis.length - 2) * cue(state, 'work-final-strides', 0, 0.33, 0.41));
  const blellochShown = larger
    ? blelloch.length
    : Math.ceil(up.length * cue(state, 'work-up', 0, 0.63, 0.77)) +
      Math.ceil(up.length * cue(state, 'work-down', 0, 0.78, 0.88));
  const hillisTotal = larger ? largerCounts : after(state, 'scan-work-step-1', 0, 0.57);
  const blellochTotal = larger ? largerCounts : after(state, 'work-blelloch', 0, 0.97);

  api.focus.target(larger ? 'work-versus-time' : 'work-counters', () => {
    text(ctx, api, size + ' inputs', 105, 282, 43, C.yellow, 'left');
    text(ctx, api, 'Additions in each round', 435, 282, 39, C.ink, 'left');
    text(ctx, api, 'Total additions', 1695, 282, 34, C.ink);
    drawRounds(
      ctx,
      api,
      'Hillis–Steele',
      hillis,
      hillisShown,
      hillisTotal ? work.hillis : null,
      540,
      size,
      step,
      C.blue,
    );
    drawRounds(
      ctx,
      api,
      'Blelloch',
      blelloch,
      blellochShown,
      blellochTotal ? work.blelloch : null,
      815,
      size,
      step,
      C.cyan,
    );
    if (largerCounts)
      text(
        ctx,
        api,
        'Hillis–Steele uses ' + (work.hillis / work.blelloch).toFixed(2) + '× as many additions',
        960,
        947,
        44,
        C.yellow,
      );
  });
}

export default {
  id: 'scan-work',
  draw: drawScanWork,
  cues: [
    'work-second-stride',
    'work-final-strides',
    'scan-work-step-1',
    'work-up',
    'work-down',
    'work-blelloch',
    'work-512',
    'work-larger-counts',
    'scan-work-step-2',
  ],
};
