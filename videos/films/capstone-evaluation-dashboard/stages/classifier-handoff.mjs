import { dashboardStarted } from '../arithmetic.mjs';
import { dashboardText as text, dashboardLine as line } from '../defaults.mjs';

const rows = [
  ['Access override', 1, 1],
  ['Incident freeze', 1, 0],
  ['Routine rotation', 0, 0],
];

export function drawClassifierHandoff(ctx, scene, state, api) {
  const { C } = api;
  const routineOnly = state.beat > 0 && dashboardStarted(state, 'routine-only', state.beatP > 0.3);
  const graded = state.beat > 0 || dashboardStarted(state, 'recall-count', state.beatP > 0.7);
  const sample = routineOnly ? rows.filter(([, expected]) => expected === 0) : rows;
  const required = sample.filter(([, expected]) => expected === 1);
  const caught = required.filter(([, , actual]) => actual === 1).length;
  const route = (value) => (value ? 'Human review' : 'Routine queue');
  api.focus.target('tickets', () => {
    ['Ticket', 'Required route', 'Actual route'].forEach((s, i) =>
      text(ctx, api, s, [150, 820, 1370][i], 310, 33, C.muted),
    );
    rows.forEach(([label, expected, actual], i) => {
      const y = 425 + i * 123;
      if (routineOnly && expected) return;
      text(ctx, api, label, 150, y, 40, C.ink);
      text(ctx, api, route(expected), 820, y, 38, C.ink);
      text(ctx, api, route(actual), 1370, y, 38, actual === expected ? C.green : C.pink);
    });
    line(ctx, api, 150, 745, 1770, 745, C.muted, 2);
    if (!graded) {
      text(
        ctx,
        api,
        'Of the tickets that needed human review, how many reached it?',
        150,
        857,
        40,
        C.yellow,
      );
      return;
    }
    const recall = required.length
      ? caught + ' / ' + required.length + ' = ' + (caught / required.length) * 100 + '%'
      : 'undefined';
    text(ctx, api, 'Positive recall     ' + recall, 150, 857, 46, C.yellow);
    text(
      ctx,
      api,
      routineOnly
        ? 'HOLD    Collect a ticket that requires review.'
        : 'HOLD    Inspect the missed incident-freeze ticket.',
      150,
      955,
      36,
      C.pink,
    );
  });
}
export default {
  id: 'classifier-handoff',
  draw: drawClassifierHandoff,
  cues: ['recall-count', 'routine-only'],
};
