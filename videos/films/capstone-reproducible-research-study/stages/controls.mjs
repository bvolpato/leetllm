import { controlStep, cueProgress } from '../evidence.mjs';

export function drawControls(ctx, scene, state, api) {
  const { C } = api;
  const slipped = cueProgress(state, 'reverse-the-move', 1, 0.05, 0.32) > 0;
  const checked = cueProgress(state, 'compare-slip', 2, 0.03, 0.43) === 1;
  const repaired = cueProgress(state, 'restore-intended', 3, 0.08, 0.42) === 1;
  const applied =
    state.beat === 0 ? cueProgress(state, 'compare-straight', 0, 0.58, 0.94) === 1 : checked;
  const showSparse = applied || cueProgress(state, 'credit-right', 2, 0, 0.2) === 1;
  const step = controlStep(slipped, !repaired);
  api.focus.target('control-update', () => {
    api.text(ctx, 'One constructed update   /   State 1, intended right', 135, 260, 38, C.ink);
    const xx = [270, 530, 790],
      y = 515;
    const radius = 27;
    for (const [s, x] of xx.entries()) {
      if (s > 0) api.line(ctx, xx[s - 1] + radius, y, x - radius, y, C.muted, 3);
      api.circle(ctx, x, y, radius, C.panel, C.muted, 3);
      api.text(ctx, String(s), x, y + 11, 32, C.ink, 'center');
    }
    api.arrow(ctx, xx[1], y - 84, xx[step.successor], y - 84, C.yellow, 5);
    api.text(
      ctx,
      slipped ? 'Slip reverses the move' : 'The move goes right',
      xx[1],
      y - 126,
      33,
      C.yellow,
      'center',
    );
    api.text(ctx, 'Max next Q = 0.4 at either neighbor', xx[1], 635, 31, C.muted, 'center');
    api.text(ctx, '0.35 × (0 + 0.95 × 0.4)', xx[1], 700, 37, C.ink, 'center');
    api.text(
      ctx,
      'Step size × (reward + discounted next value)',
      xx[1],
      748,
      26,
      C.muted,
      'center',
    );
    api.text(ctx, 'Q at state 1', 1015, 380, 36, C.ink);
    for (const [i, label] of ['Left', 'Right'].entries())
      api.text(ctx, label, 1470 + i * 220, 445, 32, C.muted, 'center');
    for (const [i, row] of [step.sparse, step.zero].entries()) {
      const y = 523 + 120 * i;
      api.text(ctx, i ? 'Zero potential' : 'Sparse', 1015, y, 33, i ? C.cyan : C.blue);
      row.forEach((value, j) => {
        const x = 1470 + 220 * j;
        api.rect(ctx, x - 94, y - 55, 188, 78, C.panel, undefined, 6);
        const filled = i ? applied : showSparse;
        api.text(
          ctx,
          (filled ? value : 0).toFixed(3),
          x,
          y,
          43,
          filled && value ? C.yellow : C.ink,
          'center',
        );
      });
    }
    api.text(
      ctx,
      'np.testing.assert_array_equal(zero_q, sparse_q)',
      960,
      825,
      37,
      C.ink,
      'center',
      'mono',
    );
    const outcome = !applied
      ? 'Which entry should receive the update?'
      : step.match
        ? 'Exact match'
        : 'Mismatch at state 1';
    api.text(
      ctx,
      outcome,
      960,
      930,
      43,
      !applied ? C.ink : step.match ? C.green : C.pink,
      'center',
    );
  });
}
export default {
  id: 'controls',
  draw: drawControls,
  cues: ['compare-straight', 'reverse-the-move', 'compare-slip', 'restore-intended'],
};
