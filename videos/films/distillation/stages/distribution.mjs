import { stableSoftmax } from 'vizmatic';
import { spokenProgress } from '../construction.mjs';
import { INITIAL, TEACHER, WORDS } from '../fixtures.mjs';
import { text } from '../defaults.mjs';

export function drawDistribution(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  const teacher = stableSoftmax(TEACHER);
  const student = stableSoftmax(INITIAL);
  const open = spokenProgress(state, api, 'distribution-open', 1, 0.02, 0.13);
  const hard = spokenProgress(state, api, 'distribution-hard', 1, 0.49, 0.72);
  const compare = spokenProgress(state, api, 'distribution-student', 2, 0.03, 0.17);
  const hardTarget = teacher.map((v) => Number(v === Math.max(...teacher)));
  api.focus.target('word-comparison', () => {
    text(ctx, api, 'The child saw a', 150, 304, 55);
    text(ctx, api, 'bird', 578, 304, 55, C.blue);
    text(ctx, api, 'Saved answer', 582, 352, 26, C.muted);
    text(ctx, api, 'Next word', 155, 462, 32, C.muted);
    text(ctx, api, 'Teacher', 525, 462, 36, C.blue);
    if (beat === 2) text(ctx, api, 'Student', 1165, 462, 36, C.cyan);
    else if (hard > 0) text(ctx, api, 'Hard target', 1165, 462, 36, C.yellow);
    function bar(value, x, y, color, progress) {
      api.rect(ctx, x, y - 36, 380, 32, C.panel, undefined, 2);
      if (progress > 0 && value > 0)
        api.rect(ctx, x, y - 36, 380 * value * progress, 32, color, undefined, 2);
      if (progress === 1) text(ctx, api, value.toFixed(3), x + 405, y - 3, 33, color);
    }
    WORDS.forEach((word, i) => {
      const y = 565 + 105 * i;
      text(ctx, api, word, 155, y, 44);
      if (open > 0) bar(teacher[i], 525, y, C.blue, open);
      else text(ctx, api, '· · ·', 570, y, 36, C.muted);
      if (beat === 2) bar(student[i], 1165, y, C.cyan, compare);
      else if (hard > 0) bar(hardTarget[i], 1165, y, C.yellow, hard);
    });
    if (!open)
      text(ctx, api, 'Which did the teacher prefer, dog or cat?', 960, 974, 41, C.yellow, 'center');
    if (compare === 1)
      text(
        ctx,
        api,
        'Each column shares one unit of probability.',
        960,
        974,
        33,
        C.muted,
        'center',
      );
  });
}
export default {
  id: 'distribution',
  draw: drawDistribution,
  cues: ['distribution-open', 'distribution-hard', 'distribution-student'],
};
