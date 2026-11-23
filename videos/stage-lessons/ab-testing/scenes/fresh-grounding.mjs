import { assertEqual, column, place } from 'vizmatic/stage';
import { area, chip, heading, label, mono, note } from '../../kit-narrated.mjs';
import { report } from '../parts.mjs';
import { auditRuler, points } from '../audit-ruler.mjs';

export default function fresh(s, c) {
  const r = auditRuler(s);
  const original = r.auditRow(0, report.treatment.groundingFailures, { open: true });
  const practice = r.auditRow(1, 18);
  const p = practice.packet;
  const originalStatus = place(note('Original decision   ·   HOLD'), r.calculation);
  const same = place(
    note('2,000 audits per arm   ·   same resolution, latency and page results'),
    r.footer,
  );
  const calculation = (txt) => place(mono(txt, { size: 47 }), r.calculation);
  const rates = calculation(
    points(p.treatment) + '% − ' + points(p.control) + '% = −' + points(-p.delta) + ' pp',
  );
  const margin = points(1.96 * p.se);
  const sum = '−' + points(-p.delta) + '  +  ' + margin;
  const exercise = calculation(sum + '  ≈  ? pp');
  const result = calculation(sum + '  ≈  +' + points(p.upper) + ' pp');
  const ask = place(
    label('Where does the upper tip land? Does this audit clear +0.50?', { color: 'yellow' }),
    r.footer,
  );
  const verdict = place(
    label('Original: HOLD     ·     Practice: PASS the teaching gate', { color: 'yellow' }),
    r.footer,
  );
  const next = place(
    label('Original hold   ·   use fresh confirmation or a preplanned continuation'),
    r.calculation,
  );
  assertEqual(points(p.upper), '0.42', 'practice upper bound');
  assertEqual(original.packet.passes, false, 'original audit decision');
  assertEqual(p.passes, true, 'practice audit decision');

  s.add(heading(c.title), originalStatus, same);
  c.take([r.frame, original.row].flat(Infinity));
  c.show('eighteen', [practice.name, practice.rail]);
  c.show('center', practice.center);
  c.swap('center', originalStatus, rates);
  c.swap('margin', rates, exercise);
  c.swap('ask', same, ask);
  c.show('extend', practice.band);
  c.on('extend', () => s.play(practice.spread.to(1, { duration: 1.25 })));
  c.show('tip', practice.upper, { after: true });
  c.swap('tip', exercise, result, { after: true });
  c.swap('pass', ask, verdict, { after: true });
  c.swap('next', result, next);

  const [canary, exposure, conclusion] = area.rows([1.15, 2.6, 1], 'wide');
  const message = place(
    label('“The owner acknowledged the page. Can we roll it back?”', { size: 52 }),
    canary,
  );
  const [rawSlot, rewriteSlot] = exposure.columns(2, 'wide');
  const assigned = place(
    column(
      [
        label('Rewrite', { color: 'blue' }),
        chip('Marked usable at 8 min'),
        chip('Unsupported rollback claim', { color: 'yellow' }),
      ],
      { gap: 'normal' },
    ),
    rewriteSlot,
  );
  const [rawName, rawOutcome] = rawSlot.inset('wide').rows(2, 'normal');
  const raw = place(label('Raw query', { color: 'cyan' }), rawName, 'bottom');
  const unknown = place(chip('Outcome unknown', { dash: true }), rawOutcome, 'top');
  const [caption, values] = conclusion.rows(2, 'tight');
  const ratesByArm = values.columns(2, 'wide');
  const population = [
    place(note('Resolution across all randomly assigned incidents'), caption),
    ...[report.control, report.treatment].map((arm, i) =>
      place(
        mono(
          arm.resolved +
            ' / ' +
            arm.n.toLocaleString('en-US') +
            ' = ' +
            ((100 * arm.resolved) / arm.n).toFixed(0) +
            '%',
          {
            size: 44,
            color: i ? 'blue' : 'cyan',
          },
        ),
        ratesByArm[i],
      ),
    ),
  ];
  c.swapAll('return', [heading('One payment incident, two possible outcomes'), message, assigned]);
  c.show('unseen', raw);
  c.show('missing', unknown, { after: true });
  c.show('across', population);
}
