import { drawTicket, sceneClock } from '../desk.mjs';

const marks = [
  [1, 1],
  [0, 1],
];
const agreements = marks[0].filter((value, i) => value === marks[1][i]).length;

export function drawLabels(ctx, scene, state, api) {
  const clock = sceneClock(scene, state);
  const { C } = api;
  [0, 1].forEach((i) => drawTicket(ctx, api, i, 235));
  api.focus.target('review-pair', () => {
    for (const i of [0, 1]) {
      const x = i ? 997 : 135;
      marks.forEach((reviewer, j) => {
        const y = 535 + j * 104;
        api.text(ctx, 'Reviewer ' + (j + 1), x + 38, y, 34, C.muted);
        const ready = j ? clock.after('labels-second') : clock.after('labels-first');
        const value = reviewer[i];
        api.text(
          ctx,
          ready ? (value ? '1   Human review' : '0   Guarded agent') : '…',
          x + 730,
          y,
          38,
          C.ink,
          'right',
        );
        api.line(ctx, x + 38, y + 27, x + 747, y + 27, C.muted, 2);
      });
      if (clock.after('labels-agree')) {
        const match = marks[0][i] === marks[1][i];
        api.text(
          ctx,
          match ? 'Same label' : 'Different labels',
          x + 38,
          756,
          40,
          match ? C.cyan : C.pink,
        );
      }
    }
    if (clock.after('labels-resolve')) {
      api.text(ctx, 'Reviewed label   0   ·   Asks for a guide', 173, 858, 35, C.blue);
      api.text(ctx, 'Reviewed label   1   ·   Requests an exception', 1035, 858, 35, C.cyan);
      api.text(ctx, 'Label guide    escalation-policy-v1', 960, 977, 30, C.muted, 'center');
    } else {
      const message = clock.after('labels-agree')
        ? 'Agreement on ' + agreements + ' of ' + marks[0].length + ' tickets'
        : 'How many tickets got matching labels?';
      api.text(ctx, message, 960, 918, 42, C.ink, 'center');
    }
  });
}

export default {
  id: 'labels',
  draw: drawLabels,
  cues: ['labels-first', 'labels-second', 'labels-compare', 'labels-agree', 'labels-resolve'],
};
