import { ACTION_MASK, INPUTS, SAMPLE_ADVANTAGES, SAMPLE_LOGPROBS, TARGETS } from '../fixtures.mjs';
import { timedScene } from '../timed-scene.mjs';

export default timedScene('trajectory-datum', [4, 1, 3, 1], (ctx, api, time) => {
  const { C, focus } = api;
  const x = (col) => 560 + 475 * col;
  const seat = time.progress(2, 1);
  const credited = time.done(2, 2);

  focus.target('trajectory-credit', () => {
    api.text(ctx, 'Completion 0', 130, 247, 33, C.ink);
    api.text(ctx, 'Reward 1   −   group mean 0.5   =   credit +0.5', 455, 247, 36, C.yellow);
  });
  focus.target('trajectory-slots', () => {
    api.text(ctx, 'Input', 130, 404, 36, C.ink);
    INPUTS.forEach((id, i) => {
      focus.target(i === 1 ? 'trajectory-first-slot' : 'trajectory-context', () => {
        api.text(ctx, String(id), x(i), 412, 61, i < 2 ? C.blue : C.yellow, 'center');
        api.line(ctx, x(i), 432, x(i), 469, C.muted, 3);
        api.line(ctx, x(i) - 190, 480, x(i) + 190, 480, C.muted, 3);
      });
    });
  });
  api.text(ctx, 'Next target', 130, 555, 36, C.ink);
  api.text(ctx, String(TARGETS[0]), x(0), 555, 53, C.blue, 'center');
  api.text(ctx, 'prompt', x(0), 605, 30, C.blue, 'center');
  focus.target('trajectory-pairs', () => {
    if (!time.done(2, 1)) api.text(ctx, 'From the sampler', 130, 719, 30, C.cyan);
    if (time.started(0, 1)) {
      [1, 2].forEach((col) => {
        if (!time.started(0, col)) return;
        const from = 815 + 465 * (col - 1);
        const cx = from + (x(col) - from) * seat;
        const top = 735 - 240 * seat;
        api.rect(ctx, cx - 185, top, 370, 132, C.panel, C.cyan, 14);
        api.text(ctx, 'Token ' + TARGETS[col], cx, top + 57, 42, C.ink, 'center');
        api.text(ctx, 'log p  ' + SAMPLE_LOGPROBS[col], cx, top + 105, 34, C.cyan, 'center');
      });
    }
  });
  if (time.started(2, 2)) {
    focus.target('trajectory-credits', () => {
      api.text(ctx, 'Advantage', 130, 830, 32, C.yellow);
      api.text(ctx, 'Action mask', 130, 905, 32, C.green);
      for (let i = 0; i < TARGETS.length; i++) {
        api.text(
          ctx,
          credited ? (i ? '+' : '') + SAMPLE_ADVANTAGES[i] : '?',
          x(i),
          830,
          42,
          C.yellow,
          'center',
        );
        api.text(ctx, credited ? String(ACTION_MASK[i]) : '?', x(i), 905, 38, C.green, 'center');
      }
      if (credited) api.text(ctx, 'log p  0 (unused)', x(0), 675, 28, C.muted, 'center');
    });
  }
  if (time.beat === 1 || (time.beat === 2 && !time.done(2, 0))) {
    api.text(ctx, 'Which input predicted token 20?', 960, 979, 42, C.yellow, 'center');
  }
});
