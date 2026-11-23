import { applyLatestState, formatClock } from '../arithmetic.mjs';
import { revisionRecords } from '../fixtures.mjs';
import { receipt, spoken } from '../request-clock.mjs';

export function drawRevisionOrdering(ctx, scene, state, api) {
  const clock = spoken(scene, state);
  const { C } = api;
  const store = new Map();
  const keys = ['v1', 'v2', 'retry'];
  api.text(ctx, 'J-204     /     Worker event at 10:30', 107, 245, 36, C.muted);
  api.text(ctx, 'Arrived', 109, 362, 32, C.muted);
  api.text(ctx, 'Source version', 480, 362, 32, C.muted);
  api.text(ctx, 'Phase in this message', 865, 362, 32, C.muted);
  api.focus.target('revision-messages', () => {
    api.line(ctx, 105, 387, 1805, 387, '#565b65', 3);
    revisionRecords.forEach((row, i) => {
      if (i > 0 && !clock.started(keys[i])) return;
      const y = 470 + 111 * i;
      api.text(ctx, formatClock(row.available), 108, y, 43, C.blue);
      api.text(ctx, `v${row.version}`, 483, y, 46, C.cyan);
      api.text(ctx, row.phase, 867, y, 38, C.ink, 'left', 'mono');
      if (i < 2 || clock.finished('keep')) applyLatestState(store, row);
    });
  });
  const latest = store.get(revisionRecords[0].job);
  api.focus.target('revision-current', () =>
    receipt(ctx, api, {
      y: 834,
      label: 'Current phase',
      value: `v${latest.version}     ${latest.phase}`,
      color: C.green,
      font: 'mono',
    }),
  );
  if (clock.finished('age')) {
    const minutes = 640 - latest.event;
    api.text(
      ctx,
      `10:40 − ${formatClock(latest.event)} = ${minutes} min   (${(minutes / 60).toFixed(2)} h)`,
      110,
      961,
      40,
      C.blue,
    );
  } else if (clock.started('retry')) {
    api.text(
      ctx,
      clock.finished('keep')
        ? 'The retry has the older source version.'
        : 'Which version should stay online?',
      110,
      961,
      40,
      C.yellow,
    );
  }
}
export default {
  id: 'revision-ordering',
  draw: drawRevisionOrdering,
  cues: ['v2', 'retry', 'keep', 'age'].map((id) => 'sf-revision-ordering-' + id),
};
