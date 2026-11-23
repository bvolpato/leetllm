import { event } from '../construction.mjs';
import { ticketMeasurement } from '../model.mjs';
import { line, plane, ring, scoreRail, target, text } from '../defaults.mjs';

export function drawNewRoutingObjective(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  const counter = event(state, 2, 'count-counterexample') === 1;
  const tickets = counter
    ? [
        [0, 0],
        [4, 4],
      ]
    : [
        [4, 0],
        [0, 4],
      ];
  const turn = event(state, 1, 'choose-contrast') * (1 - event(state, 3, 'recover-total'));
  const measure = ticketMeasurement(tickets, turn);
  const colors = [C.blue, C.pink];
  const q = plane(ctx, api, [-4.5, 6, -4.5, 6], 110, 338, 790, 535);
  const ends = [-2.9, 5.7].map((distance) => measure.direction.map((v) => v * distance));
  text(ctx, api, 'Slow and rollback counts', 495, 275, 35, C.muted, 'center');
  target(ctx, api, 'task-direction', () => {
    line(ctx, api, q, ends[0], ends[1], C.yellow, 4);
    tickets.forEach((row, i) => {
      const point = q.point(...row);
      line(ctx, api, q, row, measure.rows[i], colors[i], 2);
      api.circle(ctx, point.x, point.y, 8, colors[i]);
      ring(ctx, api, q.point(...measure.rows[i]), colors[i], 13 + i * 7);
    });
  });
  text(ctx, api, 'Ticket', 910, 316, 30, C.muted);
  text(ctx, api, 'One stored score', 1430, 316, 36, C.ink, 'center');
  text(ctx, api, '0', 1430, 406, 27, C.muted, 'center');
  target(ctx, api, 'projected-scores', () =>
    tickets.forEach((row, i) => {
      const y = 480 + i * 190;
      text(ctx, api, '[' + row.join(', ') + ']', 910, y + 14, 41, colors[i]);
      scoreRail(ctx, api, 1130, y, 600, 6, measure.scores[i], colors[i]);
      text(ctx, api, measure.scores[i].toFixed(3), 1430, y + 63, 32, colors[i], 'center');
    }),
  );
  const readCount = event(state, 3, 'counter-totals') === 1;
  const test =
    beat < 2
      ? 'Which direction lets the router tell the issue types apart?'
      : beat === 2
        ? 'Could the stored score tell a counter how many reports came in?'
        : readCount
          ? 'Total count = √2 × common score     •     totals  0  and  8'
          : 'Read both totals from the common direction.';
  target(ctx, api, 'task-test', () => text(ctx, api, test, 960, 953, 37, C.yellow, 'center'));
}

export default {
  id: 'new-routing-objective',
  draw: drawNewRoutingObjective,
  cues: [
    'choose-contrast',
    'count-counterexample',
    'counter-contrast',
    'recover-total',
    'counter-totals',
  ],
};
