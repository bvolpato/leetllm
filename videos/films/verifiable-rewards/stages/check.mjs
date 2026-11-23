import { arithmeticEvaluation } from '../arithmetic.mjs';
import { spokenProgress } from '../drawing.mjs';

export function drawCheck(ctx, scene, state, api) {
  const { C } = api;
  const p = spokenProgress(api, state);
  if (state.beat === 0) {
    const groups = [10, 4],
      slots = 12;
    const gather = p('check-gather', 0, 0.7, 0.81);
    const total = p('check-total', 0, 0.84, 0.96);
    api.text(ctx, 'One row per worker  ·  one dot per slot', 960, 288, 37, C.ink, 'center');
    groups.forEach((n, i) => {
      const color = i ? C.cyan : C.blue;
      const lit = Math.round(
        n * (i ? p('check-four', 0, 0.47, 0.69) : p('check-ten', 0, 0.19, 0.43)),
      );
      const startX = i ? 1115 : 250;
      const startY = i ? 485 : 395;
      api.focus.target(i ? 'four-groups' : 'ten-groups', () => {
        for (let row = 0; row < n; row++)
          for (let col = 0; col < slots; col++)
            api.circle(ctx, startX + col * 48, startY + row * 30, 9, row < lit ? color : C.panel);
        api.text(ctx, lit + ' × 12 = ' + lit * slots, startX + 264, 767, 43, color, 'center');
      });
    });
    if (gather > 0)
      api.focus.target('sum', () => {
        const parts = groups.map((n) => n * slots);
        api.text(ctx, String(parts[0]), api.lerp(514, 735, gather), 910, 53, C.blue, 'center');
        api.text(ctx, String(parts[1]), api.lerp(1379, 945, gather), 910, 53, C.cyan, 'center');
        if (gather >= 1) {
          api.text(ctx, '+', 848, 910, 47, C.ink, 'center');
          api.text(ctx, total >= 1 ? '= ' + (parts[0] + parts[1]) : '= ?', 1030, 910, 52, C.ink);
        }
      });
    return;
  }
  const result = arithmeticEvaluation().checkerChallenge;
  const tie = p('check-tie', 2, 0.01, 0.13);
  api.text(ctx, 'Response', 170, 335, 33, C.muted);
  api.text(ctx, 'Submitted working', 420, 335, 33, C.muted);
  api.text(ctx, 'Final field', 1230, 335, 33, C.muted, 'center');
  api.text(ctx, 'Reward', 1640, 335, 33, C.muted, 'center');
  ['answer', 'worked'].forEach((id, i) => {
    const y = 490 + i * 163;
    const shown = i ? p('check-worked', 1, 0.45, 0.56) : p('check-answer', 1, 0.14, 0.3);
    const outcome = i ? result.worked : result.unsupportedGuess;
    api.focus.target('check-' + id, () => {
      api.text(ctx, i ? 'B' : 'A', 170, y, 46, C.blue);
      if (shown > 0) {
        api.text(ctx, i ? '10 × 12 + 4 × 12' : '(none)', 420, y, 43, C.ink);
        api.text(ctx, '\\boxed{' + outcome.answer + '}', 1230, y, 44, C.cyan, 'center', 'mono');
      }
    });
    api.focus.target('checked-scores', () =>
      api.text(
        ctx,
        tie > 0 ? String(outcome.reward) : '?',
        1640,
        y,
        54,
        tie > 0 ? C.green : C.ink,
        'center',
      ),
    );
    api.line(ctx, 170, y + 52, 1750, y + 52, C.muted, 1);
  });
  api.text(
    ctx,
    tie > 0 ? 'To assess the explanation, check the steps.' : 'Reference   168',
    170,
    904,
    42,
    C.ink,
  );
}

export default {
  id: 'check',
  draw: drawCheck,
  cues: [
    'check-ten',
    'check-four',
    'check-gather',
    'check-total',
    'check-answer',
    'check-worked',
    'check-tie',
  ],
};
