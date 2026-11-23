import { desk, said } from '../document-desk.mjs';

const rows = [
  { event: 'Rollback failure', action: 'page on-call', window: '15 minutes', detail: 'deploy ID' },
  { event: 'Routine deploy notes', action: 'archive', window: '14 days', detail: '' },
];

export function serializeRow(row) {
  const qualifier = row.detail ? ' with ' + row.detail : '';
  return row.event + ': ' + row.action + ' within ' + row.window + qualifier + '.';
}

function trace(ctx, api, points, fraction, color) {
  const lengths = points.slice(1).map(([x, y], i) => Math.hypot(x - points[i][0], y - points[i][1]));
  let remaining = lengths.reduce((a, b) => a + b, 0) * fraction;
  let cursor = points[0];
  for (const [i, length] of lengths.entries()) {
    const [x, y] = points[i], [u, v] = points[i + 1];
    const f = Math.min(remaining / length, 1);
    cursor = [api.lerp(x, u, f), api.lerp(y, v, f)];
    if (f > 0) api.line(ctx, x, y, ...cursor, color, 5);
    if (f < 1) break;
    remaining -= length;
  }
  api.circle(ctx, ...cursor, 8, color);
}

export function drawTableStructure(ctx, scene, state, api) {
  const { C, ink, rule, focus, progress, visible } = desk(ctx, api);
  const beat = state.beat ?? 0;
  const repaired = said(state, 'row-saved');
  const second = said(state, 'archive-saved');
  const xs = [165, 630, 1090, 1460];
  const fields = ['event', 'action', 'window', 'detail'];
  ink('Release runbook   /   revision 7   /   page 7   /   table 1', 125, 261, 32, C.blue);
  ['Event', 'Action', 'Window', 'Required detail'].forEach((h, i) => ink(h, xs[i], 356, 31, C.muted));
  rule(124, 390, 1796, 390);
  rows.forEach((row, r) => focus(r === 0 ? 'table-row' : 'second-row', () => {
    const top = 397 + r * 146;
    api.rect(ctx, 125, top, 1670, 137, C.panel, undefined, 2);
    fields.forEach((f, i) => ink(row[f] || 'none', xs[i], top + 72, i === 0 ? 38 : 39));
  }));

  const wrong = beat === 1 && visible('wrong-path') && !visible('read-row');
  if (wrong) focus('wrong-path', () =>
    trace(ctx, api, [[165,500],[1007,500],[1007,646],[1376,646],[1376,500],[1650,500]],
      progress('wrong-path', 0), C.pink));
  if (beat === 1 && visible('read-row')) focus('read-row', () =>
    trace(ctx, api, [[165,500],[1650,500]], progress('read-row', 0), C.cyan));
  if (beat === 2 && visible('read-second')) focus('read-second', () =>
    trace(ctx, api, [[165,646],[1650,646]], progress('read-second', 0), C.cyan));

  const candidate = { ...rows[0], window: rows[1].window };
  const firstSaved = beat < 2 && !repaired;
  const output = beat === 2 ? (second ? serializeRow(rows[1]) : 'Reading row 2…')
    : repaired ? serializeRow(rows[0]) : serializeRow(candidate);
  if (beat > 0 || visible('bad-window')) focus(beat === 2 ? 'archive-saved' : repaired || visible('row-saved') ? 'row-saved' : 'bad-window', () => {
    const label = firstSaved ? 'Parser output' : 'Reviewed cells   /   page 7   /   table 1   /   row ' + (beat === 2 ? '2' : '1');
    ink(label, 127, 783, 29, C.muted);
    ink(output, 127, 862, 43, firstSaved && wrong ? C.pink : C.ink, 'left', 'serif');
  });
  if (beat === 0 && visible('bad-window'))
    ink('Which cell supplied the window in this sentence?', 127, 966, 36, C.yellow);
}
export default {
  id: 'table-structure', draw: drawTableStructure,
  cues: ['table-row','bad-window','wrong-path','read-row','row-saved','second-row','read-second','archive-saved'],
};
