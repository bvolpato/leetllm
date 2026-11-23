import { to, delay } from 'vizmatic/stage';
import {
  auditLedger,
  captions,
  frame,
  measure,
  pct,
  ring,
  signal,
  vertex,
  wire,
} from '../parts.mjs';
import { auditSelectionState } from '../../../films/causality/model.mjs';

export default function selection(s, c) {
  frame(
    s,
    'How can an audit manufacture an advantage?',
    'Audit is a common effect',
    'Separate eight-ticket example',
  );
  const a = vertex('Workflow', 'a', 'cyan'),
    y = vertex('Resolution', 'y', 'green'),
    audit = vertex('Audited', 'cause'),
    wa = wire(a, audit),
    ya = wire(y, audit),
    held = ring(audit);
  const initial = auditSelectionState(0),
    end = auditSelectionState(1);
  const book = auditLedger(
    initial.rows.map((r) => r.tickets),
    measure,
  );
  s.add(
    a,
    y,
    audit,
    wa,
    ya,
    book.frames,
    book.full,
    book.audit.map((t) => t.node),
  );
  c.show('rule', held);
  const removed = book.audit.filter(
    ({ arm, ticket }) => !end.rows[arm].tickets.find((t) => t.id === ticket.id).included,
  );
  c.on('filter', () =>
    s.play(
      ...removed.map(({ node }, i) =>
        delay(
          to(node, (n) => n.opacity(0), { duration: 0.45 }),
          0.3 * i,
        ),
      ),
    ),
  );
  signal(s, c, 'collider', [wa, ya]);
  captions(s, c, 'Each full workflow group contains equal numbers of successes and failures.', [
    ['rule', 'Include all assistant tickets and only failed control tickets.'],
    [
      'advantage',
      'Audited success is ' +
        pct(end.rows[0].rate) +
        ' for assistant and ' +
        pct(end.rows[1].rate) +
        ' for control.',
      true,
    ],
    ['collider', 'Conditioning on the common effect can associate workflow with resolution.'],
    ['evidence', 'Read the selection rule alongside the rates.'],
  ]);
}
