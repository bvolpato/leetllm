import { vvProgress } from '../construction.mjs';
import { schedule } from '../model.mjs';

const overhead = 2;
const cost = (row) => overhead + row.used;
const small = schedule(9, 6).slice(0, 2);
const large = schedule(9, 10)[0];
const firstEnd = cost(small[0]);
const promptEnd = firstEnd + cost(small[1]);
const largeEnd = cost(large);

export function drawChunkClock(ctx, scene, state, api) {
  const { C } = api;
  const progress = (id, beat) => vvProgress(state, 'vv-chunk-clock-' + id, beat);
  const x = (ms) => 300 + ms * 97;
  const first = progress('cost-eight', 1);
  const second = progress('cost-seven', 1);
  const larger = progress('cap-ten', 2);
  const firstTokenCompared = progress('compare', 2) === 1;
  const gapCompared = progress('gap', 2) === 1;
  const scope = (id, fn) => api.focus.target('clock-' + id, fn);
  scope('axis', () => {
    api.text(ctx, 'Step time = 2 ms setup + 1 ms per computed input', 110, 262, 41, C.ink);
    api.text(ctx, 'Illustrative clock', 1764, 263, 30, C.muted, 'right');
    api.line(ctx, x(0), 365, x(15), 365, C.muted, 3);
    for (const ms of [0, 4, 8, 12, 15]) {
      api.line(ctx, x(ms), 353, x(ms), 377, C.muted, 3);
      api.text(ctx, ms + ' ms', x(ms), 335, 29, C.ink, 'center');
    }
  });
  const step = (row, start, y, p, firstPrompt) => {
    const items = [
      { label: '+2 ms', length: overhead, color: C.muted },
      { label: 'R0', length: 1, color: C.blue },
      ...Array.from({ length: row.r1Prefill }, (_, i) => ({
        label: 'P' + (firstPrompt + i),
        length: 1,
        color: C.pink,
      })),
    ];
    let elapsed = 0;
    for (const { label, length, color } of items) {
      const width = length * 97 - 5;
      const fraction = Math.max(0, Math.min(1, (p * cost(row) - elapsed) / length));
      const left = x(start + elapsed);
      // The advancing edge counts cost units. Token labels identify the work in the batch.
      api.rect(ctx, left, y, width, 82, C.panel, C.muted, 5);
      if (fraction > 0) api.rect(ctx, left, y, width * fraction, 82, color, null, 3);
      if (fraction === 1) api.text(ctx, label, left + width / 2, y + 55, 28, C.bg, 'center');
      elapsed += length;
    }
  };
  scope('six', () => {
    api.text(ctx, 'Cap 6', 110, 504, 42, C.ink);
    api.text(ctx, '1 decode + 5 prompt', x(0), 445, 31, C.ink);
    api.text(ctx, '1 decode + 4 prompt', x(firstEnd), 445, 31, C.ink);
    step(small[0], 0, 467, first, 1);
    step(small[1], firstEnd, 467, second, 6);
    if (first === 1) {
      api.line(ctx, x(firstEnd), 555, x(firstEnd), 579, C.blue, 4);
      api.text(ctx, 'R0 token at ' + firstEnd + ' ms', x(firstEnd) - 12, 615, 34, C.blue, 'right');
    }
    if (second === 1) {
      api.line(ctx, x(promptEnd), 555, x(promptEnd), 579, C.pink, 4);
      api.text(
        ctx,
        'R1 first token at ' + promptEnd + ' ms',
        x(promptEnd),
        615,
        34,
        C.pink,
        'right',
      );
    }
  });
  if (progress('larger-budget', 1) > 0)
    scope('ten', () => {
      api.text(ctx, 'Cap 10', 110, 772, 42, C.ink);
      api.text(ctx, '1 decode + 9 prompt', x(0), 712, 31, C.ink);
      if (larger > 0) step(large, 0, 737, larger, 1);
      else api.line(ctx, x(0), 818, x(15), 818, C.muted, 2);
      if (larger === 1) {
        api.line(ctx, x(largeEnd), 825, x(largeEnd), 849, C.cyan, 4);
        api.text(
          ctx,
          'R0 token and R1 first token at ' + largeEnd + ' ms',
          x(largeEnd),
          890,
          35,
          C.cyan,
          'right',
        );
      }
    });
  if (progress('larger-budget', 1) > 0)
    scope('choice', () => {
      const caption = gapCompared
        ? `Cap 10: R0 waits ${largeEnd - firstEnd} ms longer. R1 starts ${promptEnd - largeEnd} ms sooner.`
        : firstTokenCompared
          ? `R1 starts ${promptEnd - largeEnd} ms sooner.`
          : 'Which reader gets a token sooner with the larger cap?';
      api.text(ctx, caption, 960, 1000, 38, C.yellow, 'center');
    });
}
export default {
  id: 'chunk-clock',
  draw: drawChunkClock,
  cues: [
    'vv-chunk-clock-inputs',
    'vv-chunk-clock-cost-eight',
    'vv-chunk-clock-cost-seven',
    'vv-chunk-clock-larger-budget',
    'vv-chunk-clock-cap-ten',
    'vv-chunk-clock-compare',
    'vv-chunk-clock-gap',
  ],
};
