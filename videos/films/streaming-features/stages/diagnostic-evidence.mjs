import { formatClock, publishWindow } from '../arithmetic.mjs';
import { countPublications, countWindow } from '../fixtures.mjs';
import { minuteScale, receipt, spoken } from '../request-clock.mjs';

const publications = countPublications.slice(0, 2);
const [first, second] = publications;
const request = first.time + 1;
const at = (cutoff) => publications.filter((row) => row.time <= cutoff).reduce(publishWindow, null);

export function drawDiagnosticEvidence(ctx, scene, state, api) {
  const { C } = api;
  const clock = spoken(scene, state);
  const x = minuteScale(first.time, second.time, 432, 1492);
  const replayCutoff = api.lerp(second.time, request, clock.progress('rewind'));
  const repaired = clock.finished('match');
  api.text(
    ctx,
    `J-204   ·   Heartbeats from ${formatClock(countWindow.start)} to ${formatClock(countWindow.end)}`,
    108,
    275,
    41,
    C.ink,
  );
  api.focus.target('publications', () => {
    if (state.beat < 1) return;
    api.line(ctx, 280, 520, 1650, 520, C.muted, 3);
    for (const [i, row] of publications.entries()) {
      if (!clock.started(i ? 'next' : 'first')) continue;
      const color = i ? C.cyan : C.blue;
      const pos = x(row.time);
      api.circle(ctx, pos, 520, 12, color);
      api.text(ctx, row.members.map((m) => m.id).join('  '), pos, 437, 56, color, 'center');
      api.text(ctx, `Published ${formatClock(row.time)}`, pos, 593, 37, C.ink, 'center');
    }
  });
  api.focus.target('cutoff', () => {
    if (clock.started('request')) {
      api.line(ctx, x(request), 402, x(request), 540, C.yellow, 5);
      api.text(ctx, `Request ${formatClock(request)}`, x(request), 375, 40, C.yellow, 'center');
    }
    if (clock.finished('late')) {
      const pos = x(replayCutoff);
      api.line(ctx, pos, 612, pos, 648, C.cyan, 5);
      api.text(ctx, 'Replay cutoff', pos, 692, 36, C.cyan, 'center');
    }
  });
  api.focus.target('captured-count', () =>
    receipt(ctx, api, {
      y: 818,
      label: `Scheduler capture at ${formatClock(request)}`,
      value: `${at(request).count} heartbeats`,
      color: C.blue,
    }),
  );
  api.focus.target('training-count', () =>
    receipt(ctx, api, {
      y: 959,
      label: 'Training replay',
      value:
        clock.started('rewind') && !repaired
          ? 'Replaying…'
          : `${at(replayCutoff).count} heartbeats`,
      color: repaired ? C.green : C.cyan,
    }),
  );
}

export default {
  id: 'diagnostic-evidence',
  draw: drawDiagnosticEvidence,
  cues: ['capture', 'replay', 'first', 'request', 'next', 'late', 'rewind', 'match'].map(
    (id) => 'sf-diagnostic-evidence-' + id,
  ),
};
