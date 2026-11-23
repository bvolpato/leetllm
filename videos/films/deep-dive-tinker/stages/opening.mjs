import { CANDIDATES, clamp } from '../arithmetic.mjs';
import { SAMPLE_FIXTURE } from '../fixtures.mjs';
import { timedScene } from '../timed-scene.mjs';

const { x: testInput, lo, hi } = SAMPLE_FIXTURE;
const at = (value) => 690 + 310 * (value - lo);

function slider(ctx, api, value, y, color, settled) {
  const x = at(value);
  const radius = 49;
  api.line(ctx, at(lo), y, x - radius, y, color, 12);
  if (x + radius < at(testInput)) api.line(ctx, x + radius, y, at(testInput), y, api.C.panel, 18);
  api.circle(ctx, x, y, radius, color);
  if (settled) api.text(ctx, String(value), x, y + 18, 51, api.C.bg, 'center');
}

export default timedScene('opening', [2, 2, 4], (ctx, api, time) => {
  const { C, focus } = api;
  // Both outputs already follow the input when the lesson picture cuts in.
  if (time.seconds < 0.35) ctx.globalAlpha = 1;
  const approach = Math.min(hi, 1.35 + time.seconds + time.progress(0, 0));
  const x = approach + (testInput - hi) * time.progress(0, 1);
  const expected = clamp(x, lo, hi);
  const returned = CANDIDATES[3](x, lo, hi);

  focus.target('opening-ruler', () => {
    api.text(ctx, 'Clamp range', 140, 270, 33, C.muted);
    api.text(ctx, '0 to 2', 140, 340, 54, C.ink);
    api.text(ctx, 'Upper limit', at(hi), 289, 37, C.blue, 'center');
    api.rect(ctx, at(hi) - 7, 314, 14, 195, C.blue, null, 6);
    api.text(ctx, 'Expected', 140, 453, 43, C.blue);
    api.text(ctx, 'clamp(x, 0, 2)', 140, 520, 46, C.ink, 'left', 'mono');
    slider(ctx, api, expected, 452, C.blue, x >= hi);
    focus.target('opening-output', () => {
      api.text(ctx, 'Sampled code', 140, 630, 43, C.yellow);
      api.text(ctx, 'return x', 140, 698, 56, C.ink, 'left', 'mono');
      slider(ctx, api, returned, 630, C.yellow, x === testInput);
      for (let tick = lo; tick <= testInput; tick++) {
        api.line(ctx, at(tick), 698, at(tick), 716, C.muted, 3);
        api.text(ctx, String(tick), at(tick), 759, 36, C.ink, 'center');
      }
    });
  });

  if (time.beat === 0) return;
  focus.target('opening-receipts', () => {
    focus.target('opening-trainer', () => {
      api.text(ctx, 'Optimizer finished', 160, 886, 37, C.blue);
      api.text(ctx, 'adapter-v2', 160, 971, 62, C.ink, 'left', 'mono');
    });
    focus.target('opening-sample', () => {
      api.text(ctx, 'Path on this sample', 1035, 886, 37, C.yellow);
      const read = time.done(2, 1);
      api.text(
        ctx,
        read ? 'adapter-v1' : '?',
        1035,
        971,
        62,
        read ? C.yellow : C.ink,
        'left',
        'mono',
      );
    });
    if (time.started(2, 3))
      api.text(ctx, 'Save adapter-v2 for sampling → draw again', 960, 1041, 34, C.green, 'center');
  });
});
