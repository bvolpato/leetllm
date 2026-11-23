import { ACTION_MASK, SAMPLE_ADVANTAGES, SAMPLE_LOGPROBS, TARGETS } from '../fixtures.mjs';
import { timedScene } from '../timed-scene.mjs';

export default timedScene('loss-boundary', [6, 3, 3, 2, 2], (ctx, api, time) => {
  const { C, focus } = api;
  if (time.beat === 0) {
    focus.target('loss-ratio', () => {
      const behavior = SAMPLE_LOGPROBS[1];
      const current = -0.2;
      const ratio = Math.exp(current - behavior);
      api.text(
        ctx,
        'Probability of token ' + TARGETS[1] + ' in the same context',
        150,
        290,
        48,
        C.ink,
      );
      const rows = [
        ['Sampling policy', behavior, C.cyan, 1],
        ['Current policy', current, C.yellow, time.progress(0, 1)],
      ];
      rows.forEach(([name, score, color, progress], i) => {
        const y = 457 + 175 * i;
        api.text(ctx, name, 150, y, 43, color);
        const left = 680;
        const width = 770;
        api.rect(ctx, left, y - 46, width, 59, C.panel, null, 8);
        if (progress > 0)
          api.rect(ctx, left, y - 46, width * Math.exp(score) * progress, 59, color, null, 8);
        if (progress === 1) {
          api.text(ctx, 'log p = ' + score, 150, y + 55, 33, C.muted);
          api.text(ctx, (100 * Math.exp(score)).toFixed(0) + '%', 1510, y + 1, 54, color);
        }
      });
      if (time.started(0, 2)) {
        const result = time.done(0, 3) ? '\\approx ' + ratio.toFixed(2) : '';
        api.math(
          ctx,
          'r=\\exp(' + current + '-(' + behavior + '))' + result,
          960,
          856,
          60,
          C.ink,
          'center',
        );
      }
    });
    return;
  }
  if (time.beat <= 2) {
    const repaired = time.done(2, 0);
    const maskGone = time.done(1, 1);
    const cols = [615, 1080, 1545];
    focus.target('loss-payload', () => {
      api.text(
        ctx,
        maskGone ? 'Outgoing reward-loss request' : 'Local trajectory',
        145,
        285,
        40,
        C.ink,
      );
      api.text(ctx, 'Target', 145, 431, 36, C.ink);
      api.text(ctx, 'Behavior log p', 145, 544, 36, C.cyan);
      api.text(ctx, 'Reward advantage', 145, 678, 35, C.yellow);
      if (!maskGone) api.text(ctx, 'Action mask', 145, 802, 36, C.green);
      TARGETS.forEach((id, i) => {
        focus.target(i === 0 ? 'loss-observation' : 'loss-action', () => {
          const x = cols[i];
          api.text(ctx, i === 0 ? 'prompt' : 'action', x, 357, 28, C.muted, 'center');
          api.text(ctx, String(id), x, 432, 56, i === 0 ? C.blue : C.yellow, 'center');
          api.text(ctx, String(SAMPLE_LOGPROBS[i]), x, 548, 42, C.cyan, 'center');
          const stray = !repaired;
          const credit = i === 0 && stray ? 0.5 : SAMPLE_ADVANTAGES[i];
          api.rect(ctx, x - 100, 610, 200, 92, C.panel, repaired && !i ? C.green : C.yellow, 10);
          api.text(ctx, credit ? '+' + credit : '0', x, 675, 46, C.ink, 'center');
          if (!maskGone) api.text(ctx, String(ACTION_MASK[i]), x, 804, 43, C.green, 'center');
        });
      });
    });
    api.text(
      ctx,
      maskGone
        ? repaired
          ? 'Only the two sampled actions carry reward credit.'
          : 'Which half point should we erase?'
        : 'The local mask marks actions.',
      960,
      940,
      38,
      C.ink,
      'center',
    );
    return;
  }
  const derivative = [-2, 0.5];
  const weights = derivative.map((value) => -value);
  focus.target('loss-derivative', () => {
    api.math(ctx, 'C=-2\\ell_0+\\tfrac12\\ell_1', 960, 332, 61, C.ink, 'center');
    api.text(ctx, 'Wanted slope', 165, 512, 38, C.ink);
    derivative.forEach((v, i) =>
      api.text(ctx, v > 0 ? '+' + v : String(v), 810 + i * 540, 523, 67, C.cyan, 'center'),
    );
    if (time.done(4, 1))
      api.text(ctx, 'Backend slopes match at both positions.', 960, 965, 37, C.green, 'center');
  });
  focus.target('loss-weights', () => {
    api.math(ctx, 'C_{backend}=-\\sum_i w_i\\ell_i', 960, 685, 51, C.ink, 'center');
    api.text(ctx, 'Send weight', 165, 839, 38, C.ink);
    weights.forEach((v, i) =>
      api.text(
        ctx,
        time.done(4, 0) ? (v > 0 ? '+' : '') + v : '?',
        810 + i * 540,
        846,
        68,
        C.yellow,
        'center',
      ),
    );
  });
});
