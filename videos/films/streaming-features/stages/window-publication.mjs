import { formatClock, publishWindow } from '../arithmetic.mjs';
import { countPublications, countWindow } from '../fixtures.mjs';
import { minuteScale, receipt, spoken } from '../request-clock.mjs';

function member(ctx, api, id, x, y, color) {
  api.rect(ctx, x - 27, y - 27, 54, 54, api.C.panel, color, 6);
  api.text(ctx, id, x, y + 13, 35, color, 'center');
}

const memberX = (index) => 834 + index * 82;

export function drawWindowPublication(ctx, scene, state, api) {
  const { C } = api;
  const clock = spoken(scene, state);
  const [first, revised, retry] = countPublications;
  const delta = clock.started('difference');
  const conflict = clock.started('conflict-case') && !delta;
  const incoming = conflict
    ? { ...revised, count: revised.count + 1, members: null }
    : clock.started('retry')
      ? retry
      : clock.started('late')
        ? revised
        : first;
  const messageReady = incoming === first || clock.finished(incoming === retry ? 'retry' : 'late');
  const storedFirst = publishWindow(null, first);
  const storedRevised = publishWindow(storedFirst, revised);
  const current = clock.finished('keep')
    ? publishWindow(storedRevised, retry)
    : clock.finished('replace')
      ? storedRevised
      : storedFirst;
  const x = minuteScale(countWindow.start, countWindow.end, 490, 1750);
  const members = clock.finished('late') ? revised.members : first.members;
  const comparing = clock.started('match-a') && !clock.started('replace');
  const paired = (id) => comparing && clock.started('match-' + id.toLowerCase());
  api.focus.target('window-members', () => {
    api.text(ctx, 'J-204 heartbeats', 106, 319, 36, C.ink);
    let last = x(countWindow.start);
    for (const { event } of members) {
      api.line(ctx, last, 310, x(event) - 27, 310, '#68707c', 4);
      last = x(event) + 27;
    }
    api.line(ctx, last, 310, x(countWindow.end), 310, '#68707c', 4);
    for (const time of [countWindow.start, countWindow.end]) {
      api.line(ctx, x(time), 297, x(time), 323, C.muted, 3);
      api.text(ctx, formatClock(time), x(time), 374, 30, C.muted, 'center');
    }
    for (const { id, event } of members) {
      member(ctx, api, id, x(event), 310, C.cyan);
      api.text(ctx, formatClock(event), x(event), 377, 29, C.cyan, 'center');
    }
  });
  api.focus.target('window-message', () => {
    api.line(ctx, 105, 430, 1805, 430, '#555b65', 2);
    if (delta) {
      api.text(ctx, 'If sent as a change', 108, 531, 37, C.ink);
      member(ctx, api, 'C', 834, 514, C.cyan);
      api.text(
        ctx,
        clock.finished('delta') ? `Delta    +${revised.count - first.count}` : 'Delta   ?',
        1780,
        531,
        43,
        C.ink,
        'right',
      );
      return;
    }
    api.text(
      ctx,
      conflict ? 'Test a conflicting message' : `Message at ${formatClock(incoming.time)}`,
      108,
      531,
      37,
      C.ink,
    );
    if (!messageReady) return;
    api.text(ctx, `v${incoming.revision}`, 636, 531, 43, C.cyan);
    incoming.members?.forEach(({ id }, i) => {
      if (!paired(id)) member(ctx, api, id, memberX(i), 514, C.cyan);
    });
    const hideTotal = incoming === revised && !clock.finished('replace');
    api.text(
      ctx,
      hideTotal ? 'Whole-hour update' : `Whole count   ${incoming.count}`,
      1780,
      531,
      43,
      C.ink,
      'right',
    );
  });
  api.focus.target('window-store', () => {
    api.line(ctx, 105, 593, 1805, 593, '#555b65', 2);
    api.text(ctx, 'Published state', 108, 704, 37, C.ink);
    api.text(ctx, `v${current.revision}`, 636, 704, 43, C.green);
    current.members.forEach(({ id }, i) => {
      if (!paired(id)) member(ctx, api, id, memberX(i), 686, C.green);
    });
    if (clock.started('replace') && !clock.finished('replace')) {
      const lineStart = 544;
      const radius = 10;
      const startY = lineStart + radius;
      const y = startY + (686 - startY) * clock.progress('replace');
      revised.members.forEach(({ id }, i) => {
        if (first.members.some((old) => old.id === id)) return;
        api.line(ctx, memberX(i), lineStart, memberX(i), y, C.cyan, 4);
        api.circle(ctx, memberX(i), y, radius, C.cyan);
      });
    }
    api.text(ctx, `${current.count} heartbeats`, 1780, 704, 48, C.green, 'right');
  });
  api.focus.target('window-addition', () => {
    if (comparing) {
      for (const [i, { id }] of first.members.entries()) {
        const cue = 'match-' + id.toLowerCase();
        if (!paired(id)) continue;
        const x = memberX(i);
        api.line(ctx, x, 542, x, 542 + 116 * clock.progress(cue), C.pink, 6);
        member(ctx, api, id, x, 514, C.pink);
        member(ctx, api, id, x, 686, C.pink);
      }
      api.text(ctx, 'Adding both messages', 108, 843, 36, C.pink);
      if (clock.finished('sum'))
        api.text(ctx, `${first.count + revised.count} entries`, 1780, 843, 42, C.pink, 'right');
    } else {
      let status = 'Messages describe one fixed hour.';
      if (clock.started('late')) status = 'What count belongs in the store?';
      if (clock.finished('replace')) status = 'The newer revision replaces the earlier total.';
      if (clock.started('retry'))
        status = `Incoming v${retry.revision}     /     stored v${storedRevised.revision}`;
      if (clock.finished('keep')) status = 'Older revision ignored.';
      if (conflict)
        status = clock.finished('conflict')
          ? 'Equal revision, conflicting count. Reject this message.'
          : 'Can both counts describe revision two?';
      if (delta) status = 'Give the increment an event ID to recognize its retries.';
      api.text(ctx, status, 108, 843, 37, C.yellow);
    }
  });
  if (clock.started('capture'))
    receipt(ctx, api, {
      y: 985,
      label: 'Count captured by the 12:23 request',
      value: `v${storedFirst.revision}     ${storedFirst.count} heartbeats`,
      color: C.blue,
    });
}
export default {
  id: 'window-publication',
  draw: drawWindowPublication,
  cues: [
    'capture',
    'late',
    'match-a',
    'match-b',
    'sum',
    'replace',
    'retry',
    'keep',
    'conflict-case',
    'conflict',
    'difference',
    'delta',
  ].map((id) => 'sf-window-publication-' + id),
};
