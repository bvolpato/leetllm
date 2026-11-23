import { assertEqual, barChart, place } from 'vizmatic/stage';
import { area, heading, label, mono } from '../../kit-narrated.mjs';
import { srm } from '../../../films/ab-testing/fixtures.mjs';

export default function srmScene(s, c) {
  const [scope, plot, math, foot] = area.rows([0.8, 3.5, 1, 1], 'normal');
  const threshold = 10.83;
  function diagnostic(control, treatment) {
    const expected = (control + treatment) / 2;
    const terms = [control, treatment].map((n) => (n - expected) ** 2 / expected);
    return { counts: [control, treatment], expected, terms, value: terms[0] + terms[1] };
  }
  const original = diagnostic(srm.control, srm.treatment);
  const practice = diagnostic(1900, 2100);
  assertEqual(original.value, 122.5, 'allocation alert');
  assertEqual(practice.value, 10, 'allocation practice case');
  const title = place(
    label('4,000 distinct enrolled incidents   ·   planned split 50 / 50'),
    scope,
  );
  const bars = place(
    barChart(
      ['Control', 'Treatment'].map((label, i) => ({
        label,
        value: original.expected,
        color: i ? 'blue' : 'cyan',
      })),
      {
        width: plot.width * 0.74,
        height: plot.height * 0.82,
        reference: [original.expected, original.expected],
        max: 2500,
        labelSize: 42,
        showValues: true,
        format: (v) => Math.round(v).toLocaleString('en-US'),
      },
    ),
    plot,
  );
  const nullReading = place(mono('Expected   2,000 distinct IDs per arm', { size: 47 }), math);
  const formula = (p) =>
    place(
      mono(p.counts.map((v) => '(' + v + ' − 2000)² / 2000').join('  +  '), { size: 44 }),
      math,
    );
  const firstCalc = formula(original),
    secondCalc = formula(practice);
  const statistic = (p) =>
    place(mono(p.terms.join('  +  ') + '  =  ' + p.value, { size: 49 }), math);
  const first = statistic(original),
    second = statistic(practice);
  const rule = place(
    label('Pause for investigation if χ² > ' + threshold, { color: 'yellow' }),
    foot,
  );
  const alarm = place(
    label('Pause   ·   trace assignment, eligibility and joins', { color: 'yellow' }),
    foot,
  );
  const ask = place(
    label('Does this split trigger the same 10.83 alert?', { color: 'yellow' }),
    foot,
  );
  const pass = place(label('No allocation alert   ·   audit the outcome logs separately'), foot);
  s.add(heading(c.title), title, bars, nullReading, rule);
  c.on('observed', () => s.play(bars.update(original.counts, { duration: 1.2 })));
  c.swap('square', nullReading, firstCalc);
  c.swap('statistic', firstCalc, first, { after: true });
  c.swap('alert', rule, alarm);
  c.on('new', () => s.play(bars.update(practice.counts, { duration: 1.2 })));
  c.swap('new', first, secondCalc);
  c.swap('new', alarm, rule);
  c.swap('ask', rule, ask);
  c.swap('small', secondCalc, second, { after: true });
  c.swap('below', ask, pass);
}
