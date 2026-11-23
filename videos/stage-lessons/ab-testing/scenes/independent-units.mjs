import { column, dot, indicate, place, row, to } from 'vizmatic/stage';
import { chip, heading, label, mono, namedBox, note } from '../../kit-narrated.mjs';
import { FOOT, SIDE, experiment, interval, liftInterval, seLift } from '../parts.mjs';
export default function units(s, c) {
  const b = experiment(s, true);
  const [copies, confidence] = SIDE.rows([2, 3], 'wide');
  const [origin, outputs] = copies.rows(2, 'wide');
  const incident = place(chip('one incident outcome', { color: 'green' }), origin);
  const slots = outputs.columns(4, 'normal');
  const rows = slots.map((slot, i) => place(chip(`message ${i + 1}`, { color: 'dim' }), slot));
  const dots = rows.map((_, i) => dot(13, 'green').moveTo(slots[i].point('top')));
  const starts = dots.map(() => origin.point('bottom'));
  dots.forEach((d, i) => d.moveTo(starts[i]));
  const ci = interval(s, confidence, { low: liftInterval[0] * 100, high: liftInterval[1] * 100 });
  const falsePrecision = place(label('Copied outcomes add no evidence.', { color: 'red' }), FOOT);
  const formula = place(mono('SE = √[pC(1−pC)/nC + pT(1−pT)/nT]', { size: 36 }), FOOT);
  s.add(heading('Four copies are still one outcome'), incident, rows, ci.frame, ci.band);
  c.take(b.standing);
  c.onBeat(0, () => ci.spread.set(1));
  c.show('duplicate', dots);
  c.on('duplicate', () =>
    s.play(...dots.map((d, i) => to(d, (n) => n.moveTo(slots[i].point('top')), { duration: 1.4 }))),
  );
  c.after('false-se', () =>
    s.play(
      ci.low.to(4 - 1.96 * seLift * 50, { duration: 1.3 }),
      ci.high.to(4 + 1.96 * seLift * 50, { duration: 1.3 }),
    ),
  );
  c.show('false-se', falsePrecision, { after: true });
  c.on('aggregate', () =>
    s.play(
      ci.low.to(liftInterval[0] * 100, { duration: 1.3 }),
      ci.high.to(liftInterval[1] * 100, { duration: 1.3 }),
    ),
  );
  c.swap('formula', falsePrecision, formula);
  c.keep(b.standing);
}
