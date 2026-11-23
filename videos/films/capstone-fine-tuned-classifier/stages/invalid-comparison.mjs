import { sceneClock } from '../desk.mjs';
import { fallback } from '../model.mjs';

const examples = [
  { score: 0.18, check: 'finite-valid', route: 'finite-low' },
  { score: NaN, check: 'finite-invalid', route: 'finite-fallback' },
];

export function drawInvalidComparison(ctx, scene, state, api) {
  const { C } = api;
  const clock = sceneClock(scene, state);
  if (state.beat === 3) {
    api.focus.target('token-boundary', () => {
      const moved = clock.progress('finite-append');
      const extra = Number(clock.after('finite-append'));
      const content = 254 + extra;
      const special = 2;
      const total = content + special;
      api.text(ctx, 'Full input    /    256-token policy', 140, 314, 44, C.ink);
      api.text(ctx, 'Beginning', 154, 431, 29, C.muted);
      api.text(ctx, 'Ticket content', 440, 431, 29, C.muted);
      api.text(ctx, 'End', 1550, 431, 29, C.muted);
      api.rect(ctx, 140, 478, 186, 105, C.panel, C.blue, 9);
      api.text(ctx, '[CLS]', 233, 546, 37, C.blue, 'center');
      api.rect(ctx, 360, 478, 716, 105, C.panel, C.muted, 9);
      api.text(ctx, '254 content tokens', 718, 546, 41, C.ink, 'center');
      if (moved > 0) {
        const y = 478 - 46 * (1 - api.ease(moved));
        api.rect(ctx, 1100, y, 335, 105, C.panel, C.yellow, 9);
        api.text(ctx, 'exception', 1267, y + 68, 39, C.yellow, 'center');
      }
      api.rect(ctx, 1520, 478, 202, 105, C.panel, C.blue, 9);
      api.text(ctx, '[SEP]', 1621, 546, 37, C.blue, 'center');
      if (!moved || clock.after('finite-total')) {
        api.text(
          ctx,
          content + ' content  +  2 special  =  ' + total + ' tokens',
          140,
          726,
          46,
          C.ink,
        );
        api.text(
          ctx,
          total > 256 ? 'Over the 256-token limit' : 'Fits the 256-token limit',
          140,
          824,
          38,
          total > 256 ? C.pink : C.cyan,
        );
      }
      if (clock.after('finite-manual'))
        api.text(ctx, fallback(null, total) + '   /   full text retained', 140, 963, 43, C.yellow);
    });
    return;
  }
  api.focus.target('score-validation', () => {
    const columns = [125, 438, 790, 1085, 1435];
    ['Score', 'Raw test ≥ 0.35', 'Valid score?', 'Apply cutoff', 'Intake lane'].forEach(
      (label, i) => api.text(ctx, label, columns[i], 330, 32, C.muted),
    );
    examples.forEach(({ score, check, route }, i) => {
      const y = 488 + i * 185;
      const supplied = !i || clock.progress('finite-scores') > 0;
      api.line(ctx, 140, y + 62, 1778, y + 62, C.muted, 2);
      api.text(ctx, supplied ? String(score) : '…', columns[0], y, 53, C.ink);
      if (clock.after('finite-comparisons'))
        api.text(ctx, score >= 0.35 ? 'True' : 'False', columns[1], y, 45, C.ink);
      if (clock.after(check)) {
        const finite = Number.isFinite(score) && score >= 0 && score <= 1;
        api.text(ctx, finite ? 'Pass' : 'Stop', columns[2], y, 45, finite ? C.cyan : C.pink);
        api.text(ctx, finite ? score.toFixed(2) + ' < 0.35' : 'Skipped', columns[3], y, 38, C.ink);
      }
      if (clock.after(route))
        api.text(ctx, fallback(score), columns[4], y, 39, i ? C.pink : C.blue);
    });
    const note =
      state.beat === 0
        ? 'Do both tickets enter the guarded agent?'
        : state.beat === 2
          ? 'Worker exception → caller handles unavailable inference → human fallback'
          : 'Validate the score before choosing the lane.';
    api.text(ctx, note, 140, 900, 38, C.ink);
  });
}

export default {
  id: 'invalid-comparison',
  draw: drawInvalidComparison,
  cues: [
    'finite-scores',
    'finite-comparisons',
    'finite-valid',
    'finite-low',
    'finite-invalid',
    'finite-fallback',
    'finite-append',
    'finite-total',
    'finite-manual',
  ],
};
