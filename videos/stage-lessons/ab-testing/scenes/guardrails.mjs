import { assertEqual, place } from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';
import { lift, report } from '../parts.mjs';
import { auditRuler, points } from '../audit-ruler.mjs';

export default function guardrails(s, c) {
  const { control, treatment } = report;
  const [table, foot] = area.rows([5, 1], 'wide');
  const rows = table.rows(4, 'normal');
  function cells(slot, entries, header = false) {
    return slot
      .columns([1.6, 1, 1, 1.35], 'normal')
      .map((part, i) =>
        place(
          header
            ? note(entries[i])
            : i
              ? mono(entries[i], { size: 43, color: i === 3 ? 'yellow' : 'ink' })
              : label(entries[i]),
          part,
        ),
      );
  }
  const latency = treatment.p95 - control.p95;
  const pages = 100 * (treatment.pages / treatment.n - control.pages / control.n);
  const tableHead = cells(
    rows[0],
    ['2,000 incidents per arm', 'Control', 'Rewrite', 'Change'],
    true,
  );
  const success = cells(rows[1], [
    'Resolved incidents',
    String(control.resolved),
    String(treatment.resolved),
    '+' + (100 * lift).toFixed(1) + ' pp',
  ]);
  const speed = cells(rows[2], [
    'First-request p95',
    control.p95 + ' ms',
    treatment.p95 + ' ms',
    '+' + latency + ' ms',
  ]);
  const escalated = cells(rows[3], [
    'Incidents with pages',
    String(control.pages),
    String(treatment.pages),
    pages.toFixed(2) + ' pp',
  ]);
  const latencyLimit = place(note('Speed limit   +150 ms'), foot);
  const pageLimit = place(note('Human-page rate limit   +0.50 percentage points'), foot);
  s.add(heading(c.title), tableHead, success);
  c.show('speed', [speed, latencyLimit]);
  c.show('pages', escalated);
  c.swap('pages', latencyLimit, pageLimit);

  const ruler = auditRuler(s);
  const a = ruler.auditRow(0, treatment.groundingFailures);
  const p = a.packet;
  assertEqual(points(p.upper), '0.70', 'original upper bound');
  const rates = place(
    mono(points(p.treatment) + '% − ' + points(p.control) + '% = +' + points(p.delta) + ' pp', {
      size: 45,
    }),
    ruler.calculation,
  );
  const margin = points(1.96 * p.se);
  const contributions = place(
    mono('SE = 100 × √[0.011 × 0.989 / 2000 + 0.0115 × 0.9885 / 2000] pp', { size: 36 }),
    ruler.calculation,
  );
  const standardError = place(
    mono('SE ≈ ' + (100 * p.se).toFixed(4) + ' pp', { size: 49 }),
    ruler.calculation,
  );
  const multiplier = place(
    mono('1.96 × ' + (100 * p.se).toFixed(4) + ' ≈ ' + margin + ' pp', { size: 49 }),
    ruler.calculation,
  );
  const arithmetic = place(
    mono('+' + points(p.delta) + '  +  ' + margin + '  =  ? pp', { size: 53 }),
    ruler.calculation,
  );
  const solved = place(
    mono('+' + points(p.delta) + '  +  ' + margin + '  ≈  +' + points(p.upper) + ' pp', {
      size: 53,
    }),
    ruler.calculation,
  );
  const errors = place(label('One blinded audit per incident   ·   2,000 per arm'), ruler.footer);
  const ask = place(
    label('Does the upper end stay below +0.50?', { color: 'yellow' }),
    ruler.footer,
  );
  const hold = place(
    label('Hold the rewrite   ·   the interval still includes unacceptable harm', {
      color: 'yellow',
    }),
    ruler.footer,
  );
  c.swapAll('audits', [
    heading('How much grounding harm can the audit rule out?'),
    ruler.frame,
    a.name,
    a.rail,
    errors,
  ]);
  c.show('point', [a.center, rates]);
  c.swap('variances', rates, contributions);
  c.swap('se', contributions, standardError);
  c.swap('critical', standardError, multiplier);
  c.swap('margin', multiplier, arithmetic);
  c.swap('ask', errors, ask);
  c.show('extend', a.band);
  c.on('extend', () => s.play(a.spread.to(1, { duration: 1.1 })));
  c.swap('upper', arithmetic, solved, { after: true });
  c.show('upper', a.upper, { after: true });
  c.swap('hold', ask, hold, { after: true });
}
