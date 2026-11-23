import { column, place } from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';
import { report } from '../parts.mjs';
import { auditRuler } from '../audit-ruler.mjs';

export default function takeaway(s, c) {
  const [identity, events, totals, footer] = area.rows([1.15, 2, 1.9, 1], 'wide');
  const key = place(
    mono('inc-014    /    incident-query-rewrite:v1    /    control', { size: 40, color: 'cyan' }),
    identity,
  );
  const pair = events.columns(2, 'wide');
  const record = place(
    column([label('First question'), note('Enrollment and assignment')], { gap: 'normal' }),
    pair[0],
  );
  const follow = place(
    column([label('Follow-up'), note('Same ID and stored arm')], { gap: 'normal' }),
    pair[1],
  );
  const once = place(
    label('One incident row after the full ten-minute window', { color: 'yellow' }),
    totals,
  );
  const receipt = place(
    note('Retain the assignment rule, metric query, policy versions and planned look.'),
    footer,
  );
  s.add(heading(c.title), key, record);
  c.show('follow', follow);
  c.show('window', once);
  c.show('receipt', receipt);

  const r = auditRuler(s);
  const a = r.auditRow(0, report.treatment.groundingFailures, { open: true });
  const hold = place(
    label('Original decision   ·   hold and investigate', { color: 'yellow' }),
    r.calculation,
  );
  const inspect = place(label('Inspect the cited passages behind the failed audits.'), r.footer);
  c.swapAll('original', [heading('The original decision record'), r.frame, a.row, hold]);
  c.show('inspect', inspect);
  c.keep([r.frame, a.row].flat(Infinity));
}
