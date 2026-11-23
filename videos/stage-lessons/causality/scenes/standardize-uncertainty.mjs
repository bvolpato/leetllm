import { barChart, numberLine, place, to, unitChart } from 'vizmatic/stage';
import { mono } from '../../kit-narrated.mjs';
import { captions, cells, diff, frame, pct, plot, record, STATE, tally } from '../parts.mjs';
import { standardizedFixture } from '../../../films/causality/model.mjs';

export default function standardizeUncertainty(s, c) {
  frame(
    s,
    'What can one changed ticket do?',
    'Easy assistant tickets and variance contributions',
    'Deployment contrast',
  );
  const base = standardizedFixture(),
    count = tally(cells[0][0]),
    changed = standardizedFixture(count - 1);
  const [strip, chartBand, rulerBand] = plot.rows([1.2, 3, 1.3], 'wide');
  const [countBand, effectBand] = chartBand.rows(2, 'normal');
  const total = cells[0][0].length;
  const before = count + '/' + total;
  const fraction = place(mono(before + ' resolved', { size: 52 }), countBand);
  const flipped = place(mono(before + ' → ' + (count - 1) + '/' + total, { size: 52 }), countBand);
  const arithmetic = place(mono(
    pct(STATE.deployment.easy[0]) + ' × (' + diff(-1 / total) + ') = ' + diff(changed.difference - base.difference),
    { size: 46, color: 'yellow' },
  ), effectBand);
  const tiles = place(
    unitChart(
      [
        { count, color: 'green' },
        { count: 1, color: 'red' },
      ],
      { rows: 1, cell: 58, gap: 12, shape: 'square' },
    ),
    strip,
  );
  const names = ['Easy A', 'Easy C', 'Hard A', 'Hard C'];
  const variances = base.varianceParts.map((v) => v * 10000);
  const chart = place(
    barChart(
      names.map((name, i) => ({ label: name, value: 0, color: i % 2 ? 'pink' : 'cyan' })),
      {
        width: chartBand.width * 0.83,
        height: chartBand.height * 0.69,
        max: 50,
        ticks: [0, 25, 50],
        showValues: false,
        labelSize: 34,
      },
    ),
    chartBand,
  );
  const axis = place(
    numberLine({
      range: [-10, 30],
      ticks: [-10, 0, 10, 20, 30],
      length: rulerBand.width * 0.82,
      size: 34,
      labelSize: 34,
      format: (v) => v + ' pp',
    }),
    rulerBand,
  );
  const interval = axis
    .interval(...base.interval.map((v) => v * 100), { color: 'yellow' })
    .opacity(0);
  const lead = s.value(base.difference * 100);
  axis.marker(() => lead.value, { color: 'yellow', radius: 10 });
  const [delta, se, limits] = record(s, [
    ['Assistant minus control', diff(base.difference), 'yellow'],
    ['Standard error', ''],
    ['Rough normal interval', ''],
  ]);
  s.add(tiles, axis, fraction);
  c.swap('flip', fraction, flipped, { after: true, lead: 0 });
  c.show('seven', arithmetic, { after: true, lead: 0 });
  c.swap('restore', [flipped, arithmetic], fraction);
  c.swap('variance', fraction, chart);
  c.on('flip', () => s.play(to(tiles.marks[count - 1], (n) => n.fill('red'))));
  delta(c, 'flip', null);
  delta(c, 'three', diff(changed.difference), true);
  c.after('three', () => s.play(lead.to(changed.difference * 100), { duration: 0.65 }));
  c.on('restore', () => s.play(to(tiles.marks[count - 1], (n) => n.fill('green'))));
  c.on('restore', () => s.play(lead.to(base.difference * 100), { duration: 0.65 }));
  delta(c, 'restore', diff(base.difference));
  c.on('variance', () => s.play(chart.update(variances)));
  se(c, 'se', (base.se * 100).toFixed(2) + ' pp', true);
  c.after('interval', () => s.play(to(interval, (n) => n.opacity(1))));
  limits(c, 'interval', base.interval.map((v) => (v * 100).toFixed(1)).join(' to ') + ' pp', true);
  captions(s, c, 'The easy assistant group has a large target weight and few observations.', [
    ['flip', 'One changed ticket among ten easy assistant tickets.'],
    ['restore', 'Restore the original nine resolutions for the uncertainty calculation.'],
    ['variance', 'Each bar contributes to the variance, in squared percentage points.'],
    ['interval', 'The interval includes zero under the independent-ticket approximation.', true],
  ]);
}
