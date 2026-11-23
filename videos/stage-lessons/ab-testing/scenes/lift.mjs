import { barChart, column, indicate, place, row } from 'vizmatic/stage';
import { heading, label, mono, note } from '../../kit-narrated.mjs';
import {
  FOOT,
  SIDE,
  experiment,
  interval,
  lift as difference,
  liftInterval,
  report,
  seLift,
} from '../parts.mjs';
export default function lift(s, c) {
  const b = experiment(s);
  const [rates, uncertainty] = SIDE.rows([1, 1], 'wide');
  const bars = place(
    barChart(
      [
        { label: 'control', value: 0, color: 'cyan' },
        { label: 'treatment', value: 0, color: 'blue' },
      ],
      {
        width: rates.width * 0.8,
        height: rates.height * 0.65,
        max: 1,
        labelSize: 36,
        format: (v) => (v === 0 ? '' : `${Math.round(v * 100)}%`),
      },
    ),
    rates,
  );
  const ci = interval(s, uncertainty, {
    low: liftInterval[0] * 100,
    high: liftInterval[1] * 100,
    estimate: difference * 100,
    min: 0,
    max: 8,
  });
  const absolute = place(
    mono(`+${(difference * 100).toFixed(0)} percentage points`, { color: 'yellow' }),
    FOOT,
  );
  const relative = place(
    mono(
      `relative: ${((difference / (report.control.resolved / report.control.n)) * 100).toFixed(1)}%`,
      { color: 'yellow' },
    ),
    FOOT,
  );
  const se = place(mono(`SE ≈ ${(seLift * 100).toFixed(2)} points`, { color: 'dim' }), FOOT);
  s.add(heading('The same incidents become evidence'), bars, ci.frame);
  s.add(b.standing);
  c.after('control', () =>
    s.play(
      b.tiles[0].paint({ duration: 1 }),
      bars.update([report.control.resolved / report.control.n, 0], { duration: 1 }),
    ),
  );
  c.swap('control', b.pending[0], b.rates[0], { after: true });
  c.after('treatment', () =>
    s.play(
      b.tiles[1].paint({ duration: 1 }),
      bars.update(
        [
          report.control.resolved / report.control.n,
          report.treatment.resolved / report.treatment.n,
        ],
        { duration: 1 },
      ),
    ),
  );
  c.swap('treatment', b.pending[1], b.rates[1], { after: true });
  c.show('absolute', [absolute, ci.band], { after: true });
  c.swap('relative', absolute, relative, { after: true });
  c.swap('se', relative, se, { after: true });
  c.after('interval', () => s.play(ci.spread.to(1, { duration: 0.7 })));
  c.keep(b.after);
}
