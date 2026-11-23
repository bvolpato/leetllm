import { text } from './defaults.mjs';
import { POLICY_REPLIES, POLICY_STUDENT, POLICY_TEACHER } from './fixtures.mjs';

export function drawPolicyPredictions(ctx, api, studentOffset = 0) {
  const { C } = api;
  const square = 76;
  const step = 87;
  const left = 870;
  const cells = 10;

  // Keep the request beside both predictions when the policy is opened.
  api.rect(ctx, 278, 426, 226, 38, C.yellow, undefined, 6);
  api.rect(ctx, 425, 449, 30, 53, C.yellow, undefined, 3);
  api.rect(ctx, 472, 449, 28, 37, C.yellow, undefined, 3);
  api.circle(ctx, 218, 445, 54, null, C.yellow, 36);
  text(ctx, api, 'EXPIRED', 146, 335, 36, C.yellow);
  text(ctx, api, 'Admin key', 140, 604, 67);
  text(ctx, api, 'Can I restore it?', 145, 671, 42, C.muted);

  const split = Math.round(cells * POLICY_TEACHER[0]);
  const divide = left + split * step;
  const right = left + (cells - 1) * step + square;
  for (const [name, start, end] of [
    [POLICY_REPLIES[0], left, divide - (step - square)],
    [POLICY_REPLIES[1], divide, right],
  ]) {
    text(ctx, api, name, (start + end) / 2, 296, 39, C.ink, 'center');
    api.line(ctx, start, 320, end, 320, C.muted, 3);
  }
  const rows = [
    ['Teacher', POLICY_TEACHER, C.blue, 350, 0, 'teacher-prediction'],
    [
      'Student',
      POLICY_STUDENT,
      C.cyan,
      492 + studentOffset * 0.5,
      studentOffset,
      'student-prediction',
    ],
  ];
  for (const [name, values, color, y, dx, target] of rows) {
    api.focus.target(target, () => {
      text(ctx, api, name, 600 + dx, y + 57, 51, color);
      const firstReply = Math.round(values[0] * cells);
      for (let i = 0; i < cells; i++) {
        api.rect(
          ctx,
          left + dx + i * step,
          y,
          square,
          square,
          i < firstReply ? color : C.muted,
          undefined,
          8,
        );
      }
    });
  }
  text(ctx, api, 'One square = 10% probability', left, 733, 33, C.muted);
}
