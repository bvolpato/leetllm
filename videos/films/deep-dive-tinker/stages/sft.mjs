import { FULL, TARGETS, TARGET_WEIGHTS } from '../fixtures.mjs';
import { timedScene } from '../timed-scene.mjs';

export default timedScene('sft', [3, 2, 3], (ctx, api, time) => {
  const { C, focus } = api;
  const x = (i) => 515 + 336 * i;
  const size = 220;
  const role = (i) => (i < 2 ? C.blue : C.yellow);
  function tile(value, cx, top, color) {
    api.rect(ctx, cx - size / 2, top, size, 90, C.panel, color, 10);
    api.text(ctx, String(value), cx, top + 63, 49, color, 'center');
  }
  focus.target('sft-inputs', () => {
    api.text(ctx, time.started(0, 2) ? 'Input' : 'Sequence', 120, 390, 38, C.ink);
    FULL.forEach((token, i) => {
      if (i < 3 || !time.started(0, 2)) {
        api.text(ctx, i < 2 ? 'prompt' : 'answer', x(i), 284, 30, role(i), 'center');
        tile(token, x(i), 333, role(i));
      }
    });
  });
  focus.target('sft-targets', () => {
    api.text(ctx, 'Next target', 120, 576, 38, C.ink);
    if (time.started(0, 2))
      TARGETS.forEach((token, i) => {
        const cx = x(i + 1 - time.progress(1, 0));
        focus.target(i === 1 ? 'sft-first' : 'sft-other-target', () =>
          tile(token, cx, 518, role(i + 1)),
        );
      });
  });
  focus.target('sft-weights', () => {
    const normalized = time.done(2, 2);
    api.text(ctx, normalized ? 'Mean weight' : 'Loss weight', 120, 775, 36, C.ink);
    if (time.beat > 0)
      TARGET_WEIGHTS.forEach((weight, i) => {
        const shown = time.done(2, 1) || (i === 1 && time.done(2, 0));
        const divisor = normalized ? TARGET_WEIGHTS.reduce((a, b) => a + b) : 1;
        api.text(
          ctx,
          shown ? String(weight / divisor) : '?',
          x(i),
          792,
          63,
          shown && weight ? C.yellow : C.muted,
          'center',
        );
      });
  });
  if (time.started(1, 1)) {
    focus.target('sft-first', () => {
      api.arrow(ctx, x(1), 438, x(1), 495, C.yellow, 4);
    });
    api.text(
      ctx,
      time.done(2, 0)
        ? '11 predicts the first answer token.'
        : 'Does the prediction under 11 count?',
      960,
      960,
      42,
      C.ink,
      'center',
    );
  }
});
