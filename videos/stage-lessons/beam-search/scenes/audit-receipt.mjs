import { barChart, column, indicate, place, row, unitChart } from 'vizmatic/stage';
import { heading, area, label, mono, note } from '../../kit-narrated.mjs';
import { stablePolicy, retainedPolicy } from '../../../films/beam-search/arithmetic.mjs';
import { WORKSHEET } from '../parts.mjs';

export default function auditReceipt(s, c) {
  const [top, bottom, footer] = area.rows([2.8, 3, 1], 'wide');
  const [drawRegion, receiptRegion] = top.columns([3, 2], 'loose');
  const expected = [
    1,
    stablePolicy(undefined, 2).probabilities[0],
    retainedPolicy(WORKSHEET, 'p', 0.9).probabilities[0],
  ];
  const draw = place(
    barChart(
      ['greedy', 'T = 2', 'top-p .90'].map((label, i) => ({
        label,
        value: [1, 0.457, 0.621][i],
        color: ['cyan', 'blue', 'green'][i],
      })),
      {
        width: drawRegion.width * 0.85,
        height: drawRegion.height * 0.6,
        max: 1,
        reference: expected,
        labelSize: 34,
        showValues: true,
        format: (v) => v.toFixed(3),
      },
    ),
    drawRegion,
  );
  const receipt = place(
    column(
      [
        label('2,000 fixed-row draws', { size: 34 }),
        note('Outline: expected create share'),
        note('Fill: observed create share'),
        note('Whole-answer judgments are separate'),
      ],
      { gap: 'normal' },
    ),
    receiptRegion,
  );
  const cohorts = bottom.columns(2, 'loose');
  const charts = [
    [70, 20, 10],
    [80, 15, 5],
  ].map((counts, i) =>
    place(
      unitChart(
        counts.map((count, j) => ({ count, color: ['cyan', 'dim', 'red'][j] })),
        { rows: 10, cell: 20, gap: 8, plain: true, labelSize: 34 },
      ),
      cohorts[i],
    ),
  );
  const pending = cohorts.map((region, i) =>
    place(note(`Cohort ${i === 0 ? 'A' : 'B'} · 100 requested answers`), region, 'bottom'),
  );
  const descriptions = cohorts.map((region, i) =>
    place(
      note(
        i === 0
          ? 'Cohort A: 70 supported · 10 limited / 100'
          : 'Cohort B: 80 supported · 5 limited / 100',
      ),
      region,
      'bottom',
    ),
  );
  const matches = place(
    mono('First-word agreement: 92% → 85%    Task rate: 70% → 80%', { size: 34 }),
    footer,
  );
  s.add(heading(c.title), [draw, receipt, charts, pending]);
  c.on('audit-receipt-build-0', () => s.play(indicate(draw, { scale: 1, color: 'yellow' })));
  c.swap('audit-receipt-build-1', pending, descriptions, { after: true });
  c.show('audit-receipt-build-1', matches, { after: true });
  c.after('audit-receipt-build-1', () =>
    s.play(...charts.map((chart) => chart.paint({ duration: 1.2 }))),
  );
  c.on('audit-receipt-build-2', () => s.play(indicate(charts, { scale: 1, color: 'yellow' })));
}
