import { prefillCohortWork } from '../arithmetic.mjs';
import { text } from '../defaults.mjs';

const fmt = (n) => n.toLocaleString('en-US');

export function drawCohortWork(ctx, scene, state, api) {
  const { C } = api;
  const after = (id) => state.cues?.[id]?.phase === 'after';
  const swapped = after('cohort-swap');
  const hitLength = swapped ? 1024 : after('cohort-long-hits') ? 3072 : 2048;
  const missLength = 4096 - hitLength;
  const work = prefillCohortWork(hitLength, missLength);
  const cut = state.cues?.[swapped ? 'cohort-short-cut' : 'cohort-trim']?.progress ?? 0;
  const showTotal = swapped ? after('cohort-second-total') : after('cohort-first-total');
  const showCount = swapped ? after('cohort-second-count') : after('cohort-first-count');
  api.focus.target('cohort-bars', () => {
    text(ctx, api, 'Prompt length in tokens', 550, 274, 33, C.muted);
    text(ctx, api, 'Mean prompt length  2,048', 1753, 274, 33, C.muted, 'right');
    const left = 552,
      scale = 0.38;
    for (const [i, label, length, retained, color] of [
      [0, '400 hits/s', hitLength, hitLength * (1 - 0.75 * cut), C.cyan],
      [1, '400 misses/s', missLength, missLength, C.blue],
    ]) {
      const y = 357 + i * 195;
      text(ctx, api, label, 142, y + 62, 43, C.ink);
      api.rect(ctx, left, y, length * scale, 84, C.panel, C.muted, 2, 3);
      api.rect(ctx, left + 1, y + 2, retained * scale - 2, 80, color, null, 0, 2);
      text(ctx, api, fmt(length) + ' tokens', left + length * scale, y - 18, 29, C.muted, 'right');
      if (cut === 1) {
        text(ctx, api, fmt(retained) + ' to prefill', left, y + 130, 34, color);
        if (i === 0)
          text(
            ctx,
            api,
            fmt(length - retained) + ' reused',
            left + length * scale,
            y + 130,
            32,
            C.muted,
            'right',
          );
      }
    }
  });
  api.focus.target('cohort-sum', () => {
    const formula =
      cut === 1
        ? '400 × ' + fmt(hitLength / 4) + ' + 400 × ' + fmt(missLength) + ' = ? prefill tokens/s'
        : 'Remaining work = hits per second × hit remainder + misses per second × full miss';
    const sum = showTotal
      ? fmt(work.hit) + ' + ' + fmt(work.miss) + ' = ' + fmt(work.total) + ' prefill tokens/s'
      : formula;
    text(ctx, api, sum, 960, 835, 39, C.ink, 'center');
    if (showCount)
      text(
        ctx,
        api,
        'At 20,000 tokens / GPU-second   →   ' + work.gpus + ' GPUs for prefill',
        960,
        945,
        39,
        C.yellow,
        'center',
      );
    else if (swapped)
      text(
        ctx,
        api,
        'Long hits used ' +
          fmt(prefillCohortWork(3072, 1024).total) +
          ' tokens/s. More, less, or the same now?',
        960,
        945,
        35,
        C.yellow,
        'center',
      );
  });
}
export default {
  id: 'cohort-work',
  draw: drawCohortWork,
  cues: [
    'cohort-long-hits',
    'cohort-trim',
    'cohort-first-total',
    'cohort-first-count',
    'cohort-swap',
    'cohort-short-cut',
    'cohort-second-total',
    'cohort-second-count',
  ],
};
