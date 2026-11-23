import { secureEligibility, sourceRecord } from '../arithmetic.mjs';
import { PRINCIPAL, SECURE_SOURCES } from '../fixtures.mjs';
import { drawLine, drawRectangle, drawText } from '../defaults.mjs';
import { voice } from '../voice.mjs';

export function drawTransfer(ctx, scene, state, api) {
  const c = api.C;
  const cue = voice(scene, state);
  const source = sourceRecord(SECURE_SOURCES.find((r) => r.id === 'key'));
  const done = (id) => cue(id).phase === 'after';
  const label = (s, x, y, size, color = c.ink) => drawText(ctx, api, s, x, y, size, color);

  api.focus.target('case-source', () => {
    label(source.title, 125, 290, 46);
    label(
      'A:key   /   source v' + source.revision + '   /   read policy ' + source.policy,
      125,
      355,
      31,
      c.muted,
    );
    drawLine(ctx, api, 125, 395, 1795, 395);
    label('Request', 125, 465, 30, c.muted);
    label('Verified groups', 650, 465, 30, c.muted);
    label('Decision receipt', 1275, 465, 30, c.muted);
  });

  api.focus.target('receipts', () => {
    const cases = [
      {
        action: 'Read runbook',
        groups: PRINCIPAL.groups,
        active: true,
        show: done('trace-denied'),
      },
      {
        action: 'Read runbook',
        groups: [...PRINCIPAL.groups, 'security'],
        active: cue('trace-replay').phase !== 'before',
        show: done('trace-allowed'),
      },
      {
        action: 'Deploy to production',
        groups: [...PRINCIPAL.groups, 'security'],
        active: cue('trace-operation').phase !== 'before',
        show: done('trace-held'),
        approval: false,
      },
    ];
    cases
      .filter((row) => row.active)
      .forEach((row, i) => {
        const y = 497 + i * 155;
        const read = row.approval === undefined;
        const allowed = read
          ? secureEligibility(source, { ...PRINCIPAL, groups: row.groups })
          : row.approval;
        const reason = read
          ? allowed
            ? 'Return A:key v7'
            : 'Missing read grant'
          : 'Approval missing';
        const color = row.show ? (allowed ? c.green : c.pink) : c.muted;
        drawRectangle(ctx, api, 125, y, 1670, 119, color);
        label(row.action, 154, y + 75, 38);
        label(row.groups.join(' + '), 650, y + 75, 34, c.blue);
        label(row.show ? reason : 'Pending', 1275, y + 75, 36, color);
      });
  });
  if (done('trace-held'))
    label('The read receipt travels with the buffered answer.', 125, 1020, 36, c.ink);
}
export default {
  id: 'transfer',
  draw: drawTransfer,
  cues: [
    'trace-source',
    'trace-denied',
    'trace-replay',
    'trace-allowed',
    'trace-operation',
    'trace-held',
  ],
};
