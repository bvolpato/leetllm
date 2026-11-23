import { assertEqual, barChart, boxOf, column, place, row } from 'vizmatic/stage';
import { label, mono, note } from '../../kit-narrated.mjs';
import { WORK, open, finish, WIDE_LEDGER } from '../parts.mjs';
const PARAMS_BILLION = 1.5;
const gbTotal = (bytes) => bytes.reduce((sum, b) => sum + b * PARAMS_BILLION, 0);
assertEqual(gbTotal([2, 4, 4, 4, 4]), 27, 'FP32 gradient unsharded decimal GB');
export default function dtype(s, c) {
  const b = open(s, c, 'dtype-ledger');
  const [caption, chartArea, totals, foot] = WORK.rows([0.5, 3.5, 0.6, 0.8], 'normal');
  const scope = place(note('Unsharded arrays, decimal GB'), caption);
  const total24 = place(
    mono('Total = ' + gbTotal([2, 2, 4, 4, 4]) + ' GB', { color: 'yellow', size: 34 }),
    totals,
  );
  const total27 = place(
    mono('Total = ' + gbTotal([2, 4, 4, 4, 4]) + ' GB', { color: 'yellow', size: 34 }),
    totals,
  );
  const bytes = [2, 2, 4, 4, 4],
    P = PARAMS_BILLION;
  const gb = bytes.map((v) => v * P);
  assertEqual(
    gb.reduce((a, v) => a + v, 0),
    24,
    'decimal GB before activations',
  );
  const measure = place(
    barChart(
      ['compute W', 'gradient', 'master W', 'moment m', 'moment v'].map((name, i) => ({
        label: name,
        value: gb[i],
        color: i === 0 ? 'blue' : i === 1 ? 'cyan' : 'pink',
      })),
      {
        width: chartArea.width - 100,
        height: chartArea.height - 120,
        max: 6,
        labelSize: 34,
        showValues: true,
      },
    ),
    chartArea,
  );
  const chart = barChart(
    ['compute W', 'gradient', 'master W', 'moment m', 'moment v'].map((name, i) => ({
      label: name,
      value: 0,
      color: i === 0 ? 'blue' : i === 1 ? 'cyan' : 'pink',
    })),
    {
      width: chartArea.width - 100,
      height: chartArea.height - 120,
      max: 6,
      labelSize: 34,
      showValues: true,
    },
  );
  const target = boxOf(measure.baseline).point('center'),
    source = boxOf(chart.baseline).point('center'),
    center = boxOf(chart).point('center');
  chart.moveTo([center[0] + target[0] - source[0], center[1] + target[1] - source[1]]);
  const baseline = place(
    row([mono('P = 1.5B'), label('×'), mono('[2, 2, 4, 4, 4] bytes')], { gap: 'wide' }),
    foot,
  );
  const wide = place(
    row([mono('P = 1.5B'), label('×'), mono('[2, 4, 4, 4, 4] bytes')], { gap: 'wide' }),
    foot,
  );
  const formula = place(mono('ZeRO 2: Pp + P(g+o)/N     ZeRO 3: P(p+g+o)/N', { size: 34 }), foot);
  s.add(scope, chart, baseline);
  c.after('weights', () => s.play(chart.update([gb[0], 0, 0, 0, 0], { duration: 0.5 })));
  c.after('gradients', () => s.play(chart.update([gb[0], gb[1], 0, 0, 0], { duration: 0.5 })));
  c.after('adam', () => s.play(chart.update(gb, { duration: 0.8 })));
  c.show('total', total24, { after: true });
  c.hide('wide-result', total24);
  c.show('wide-result', total27, { after: true, lead: -1.1 });
  c.swap('wide', baseline, wide);
  c.after('wide-result', () =>
    s.play(
      chart.update([gb[0], gb[1] * 2, ...gb.slice(2)], { duration: 1 }),
      b.values[1].to(WIDE_LEDGER[1], { duration: 1 }),
    ),
  );
  c.swap('formula', wide, formula);
  finish(c, b, 'dtype-ledger');
}
