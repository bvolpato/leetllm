import { spokenProgress } from '../construction.mjs';
import { text } from '../defaults.mjs';

export function drawCapacity(ctx, scene, state, api) {
  const { C } = api;
  const rows = [
    ['Familiar type', 94, 95],
    ['Fresh wording', 71, 91],
    ['New subject', 53, 86],
  ];
  const x = (rate) => 565 + (rate - 50) * 21;
  api.focus.target('held-out-rates', () => {
    text(ctx, api, 'Assigned held-out accuracy', 145, 306, 40);
    api.circle(ctx, 1075, 290, 12, C.cyan);
    text(ctx, api, 'Student', 1108, 303, 34, C.cyan);
    api.line(ctx, 1410, 269, 1410, 305, C.blue, 7);
    text(ctx, api, 'Teacher', 1442, 303, 34, C.blue);
    for (const rate of [50, 60, 70, 80, 90, 100])
      text(ctx, api, rate + '%', x(rate), 407, 31, C.muted, 'center');
    rows.forEach(([name, student, teacher], i) => {
      const ready =
        i === 0
          ? 1
          : spokenProgress(
              state,
              api,
              i === 1 ? 'capacity-fresh' : 'capacity-subject',
              0,
              i === 1 ? 0.32 : 0.57,
              i === 1 ? 0.44 : 0.68,
            );
      const y = 508 + i * 154;
      text(ctx, api, name, 145, y + 13, 39);
      api.line(ctx, x(50), y, x(100), y, C.panel, 4);
      if (ready <= 0) return;
      api.components.fade(ready, () => {
        api.line(ctx, x(student), y, x(teacher), y, C.yellow, 8);
        api.line(ctx, x(teacher), y - 23, x(teacher), y + 23, C.blue, 6);
        api.circle(ctx, x(student), y, 12, C.cyan);
        text(ctx, api, teacher + '%', x(teacher), y - 37, 31, C.blue, 'center');
        text(ctx, api, student + '%', x(student), y + 55, 31, C.cyan, 'center');
      });
    });
    const solved = spokenProgress(state, api, 'capacity-gap', 1, 0.05, 0.18) === 1;
    text(
      ctx,
      api,
      solved
        ? 'New subject     ' +
            rows[2][2] +
            ' − ' +
            rows[2][1] +
            ' = ' +
            (rows[2][2] - rows[2][1]) +
            ' percentage points'
        : 'Which slice has the largest accuracy gap?',
      960,
      967,
      39,
      C.yellow,
      'center',
    );
  });
}
export default {
  id: 'capacity',
  draw: drawCapacity,
  cues: ['capacity-fresh', 'capacity-subject', 'capacity-gap'],
};
