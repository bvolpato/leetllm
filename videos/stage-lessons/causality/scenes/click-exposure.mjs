import { place, to, unitChart } from 'vizmatic/stage';
import { captions, frame, pct, plot, record } from '../parts.mjs';
import { label } from '../../kit-narrated.mjs';
import { clickExposureFixture } from '../../../films/causality/model.mjs';

export default function clickExposure(s, c) {
  frame(
    s,
    'What must happen before a click?',
    'Expected mass per hundred impressions',
    'Position-based click model',
  );
  const good = clickExposureFixture(),
    bad = clickExposureFixture(0.4),
    n = 100;
  const quotient = (model) =>
    model.click.toFixed(2) +
    ' / ' +
    model.usedExamination.toFixed(2) +
    ' = ' +
    model.corrected.toFixed(2);
  const count = (p) => Math.round(n * p);
  const [gridBand, key] = plot.rows([6, 1]);
  const grid = place(
    unitChart([{ count: n, color: 'dim' }], { columns: 10, cell: 43, gap: 8, shape: 'square' }),
    gridBand,
  );
  const legend = place(
    label('Dim: unseen     Yellow: examined     Green: clicked', { size: 34 }),
    key,
  );
  const [exam, click, corrected] = record(s, [
    ['Examination probability used', ''],
    ['Expected click probability', 'P(exam) × P(relevant)'],
    ['Corrected relevance', 'P(click) / P(exam)', 'yellow'],
  ]);
  s.add(grid, legend);
  c.after('exam', () =>
    s.play(
      ...grid.marks.slice(0, count(good.examination)).map((m) => to(m, (k) => k.fill('yellow'))),
    ),
  );
  exam(c, 'exam', pct(good.examination), true);
  c.after('click', () =>
    s.play(...grid.marks.slice(0, count(good.click)).map((m) => to(m, (k) => k.fill('green')))),
  );
  click(c, 'click', pct(good.click), true);
  corrected(c, 'correct', quotient(good), true);
  const extra = grid.marks.slice(count(good.examination), count(bad.usedExamination));
  c.after('wrong', () => s.play(...extra.map((m) => to(m, (k) => k.stroke('yellow', 3)))));
  exam(c, 'wrong', pct(bad.usedExamination) + ' assumed', true);
  corrected(c, 'wrong', null, true);
  corrected(c, 'biased', quotient(bad), true);
  captions(s, c, 'An impression can produce a click only if the result is examined.', [
    [
      'click',
      count(good.click) +
        ' expected clicks come from ' +
        count(good.examination) +
        ' examined impressions.',
      true,
    ],
    ['wrong', count(good.click) + ' expected clicks / ' + count(bad.usedExamination) + ' assumed examinations = ?', true],
    [
      'biased',
      count(good.click) + ' / ' + count(bad.usedExamination) + ' = ' + pct(bad.corrected) + ' inferred relevance.',
      true,
    ],
    [
      'validate',
      'Trust, attractiveness and selection can break the assumptions of the click model.',
    ],
  ]);
}
