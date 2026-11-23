import {
  appear,
  vanish,
  assertEqual,
  barChart,
  boxOf,
  dot,
  to,
  column,
  fitted,
  grid,
  indicate,
  place,
  rect,
  row,
  tex,
} from 'vizmatic/stage';
import { chip, label, mono, namedBox, note, tint } from '../../kit-narrated.mjs';
import { fleissFixture } from '../../../films/active-labeling/model.mjs';
import { footer, open, picture } from '../parts.mjs';
export default function agreementModels(s, c) {
  open(s, c);
  const imbalance = { first: 0.92, second: 0.88, observed: 0.84 };
  const expected =
    imbalance.first * imbalance.second + (1 - imbalance.first) * (1 - imbalance.second);
  const kappa = (imbalance.observed - expected) / (1 - expected);
  assertEqual(kappa.toFixed(3), '0.115', 'imbalanced kappa');
  const [left, right] = picture.columns([5, 4], 'loose');
  const bars = place(
    fitted(left, (w) =>
      barChart(
        [
          { label: 'observed', value: imbalance.observed, color: 'blue' },
          { label: 'chance', value: 0, color: 'yellow' },
        ],
        {
          width: w,
          height: left.height * 0.72,
          max: 1,
          ticks: [0, 0.5, 1],
          labelSize: 34,
          showValues: false,
        },
      ),
    ),
    left,
  );
  const firstRows = right.rows([2, 2, 1], 'wide');
  const firstFrame = place(
    rect(right.width - 8, right.height - 8, { stroke: 'dim', width: 4, radius: 12 }),
    right,
  ).zIndex(-1);
  const calc = place(
    column([
      mono('0.92 × 0.88'),
      mono('+ 0.08 × 0.12'),
      mono('= ' + expected.toFixed(4), { color: 'yellow' }),
    ]),
    firstRows[0],
  );
  const k = place(
    column([
      tex('\\kappa=\\frac{0.84-P_e}{1-P_e}', { size: 40 }),
      mono('κ = ' + kappa.toFixed(3), { color: 'yellow' }),
    ]),
    firstRows[1],
  );
  const undef = place(
    column([tex('\\kappa=\\frac{1-1}{1-1}', { size: 40 }), label('undefined', { color: 'red' })]),
    firstRows[1],
  );
  const degenerate = place(tex('P_o=P_e=1', { size: 44, color: 'yellow' }), firstRows[0]);
  const counts = place(note('Both reviewers choose one category.'), firstRows[2]);
  const baseline = place(
    note('Expected agreement from the two reviewers’ approval and rejection rates'),
    footer,
  );
  const phase1 = [bars, firstFrame, degenerate, undef, counts, baseline];
  const f = fleissFixture();
  const tableRegions = left.rows(5, 'normal').map((r) => r.columns([1.1, 1, 1, 1, 1.1], 'tight'));
  const headers = ['item', 'A', 'B', 'Tie', 'Pᵢ'].map((v, j) => place(note(v), tableRegions[0][j]));
  const rowNames = f.rows.map((_, i) =>
    place(note('item ' + String(i + 1)), tableRegions[i + 1][0]),
  );
  const cells = f.rows.map((r, i) =>
    r.map((v, j) =>
      place(
        namedBox(String(v), {
          width: tableRegions[i + 1][j + 1].width - 8,
          height: tableRegions[i + 1][j + 1].height - 8,
          color: 'dim',
          font: 'mono',
        }),
        tableRegions[i + 1][j + 1],
      ),
    ),
  );
  const [pairsArea, pooledArea, resultArea] = right.rows([2, 2, 2], 'wide');
  const panels = [pairsArea, pooledArea, resultArea].map((r) =>
    place(rect(r.width - 8, r.height - 8, { stroke: 'dim', width: 4, radius: 12 }), r).zIndex(-1),
  );
  const pairFormula = place(
    tex('P_i=\\frac{\\sum_j n_{ij}(n_{ij}-1)}{3\\times2}', { size: 36 }),
    pairsArea,
  );
  const perRow = f.agreements.map((v, i) =>
    place(mono(v === 1 ? '1' : '⅓', { size: 34, color: 'blue' }), tableRegions[i + 1][4]),
  );
  const products = f.rows.map((r, i) =>
    r.map((v, j) =>
      place(
        namedBox(v + ' × ' + (v - 1), {
          width: tableRegions[i + 1][j + 1].width - 8,
          height: tableRegions[i + 1][j + 1].height - 8,
          color: v > 1 ? 'yellow' : 'dim',
          font: 'mono',
        }),
        tableRegions[i + 1][j + 1],
      ),
    ),
  );
  const sumTerms = place(
    row(
      f.agreements.map((v) => mono(v === 1 ? '1' : '⅓', { size: 34, color: 'blue' })),
      { gap: 'wide' },
    ),
    pooledArea.inset('normal'),
    'top',
  );
  const transfers = perRow.map((n) =>
    dot(8, 'yellow').moveTo([boxOf(n).right + 26, boxOf(n).point('center')[1]]),
  );
  const meanTargets = sumTerms.nodes.map((n) => [
    boxOf(n).point('center')[0],
    boxOf(n).bottom + 26,
  ]);
  const mean = place(
    tex('\\bar P=(1+\\tfrac13+1+\\tfrac13)/4=\\tfrac23', { size: 40, color: 'yellow' }),
    pooledArea.inset('normal'),
    'bottom',
  );
  const pooled = place(
    column([
      note('Pooled counts: ' + f.counts.join(', ')),
      tex('P_e=\\tfrac{50}{144}', { size: 40, color: 'blue' }),
    ]),
    resultArea,
  );
  const result = place(mono('κ = 23/47 = ' + f.kappa.toFixed(3), { color: 'yellow' }), footer);
  const comparison = place(
    row(
      [
        chip('Cohen: separate marginals', { color: 'blue' }),
        chip('Fleiss: pooled proportions', { color: 'cyan' }),
      ],
      { gap: 'wide' },
    ),
    footer,
  );
  const ordinal = place(
    row(
      [
        chip('weighted κ: ordinal', { color: 'blue' }),
        chip('α: missing ratings + distance', { color: 'cyan' }),
      ],
      { gap: 'wide' },
    ),
    footer,
  );
  s.add(bars, firstFrame, baseline);
  c.after('base-rate', () =>
    s.play(bars.update([imbalance.observed, expected]), appear(calc), { duration: 0 }),
  );
  c.show('small-kappa', k, { after: true });
  c.after('undefined-kappa', () =>
    s.play(
      bars.update([1, 1]),
      vanish([k, calc]),
      appear([degenerate, undef.nodes[0], counts]),
      { duration: 0 },
    ),
  );
  c.show('undefined-result', undef.nodes[1], { after: true });
  c.onBeat(1, () => s.play(vanish(phase1), appear([headers, rowNames, cells, panels])));
  c.on('rating-table', () => s.play(...cells.flat().map((cell) => tint(cell, 'blue'))));
  c.show('ordered-pairs', pairFormula);
  c.on('ordered-pairs', () =>
    s.play(
      ...cells
        .flatMap((r, i) => r.filter((_, j) => f.rows[i][j] > 1))
        .map((n) => tint(n, 'yellow')),
    ),
  );
  c.swap('ordered-pairs', cells, products, { after: true });
  ['row-agreements', 'row-two', 'row-three', 'row-four'].forEach((cue, i) =>
    c.show(cue, perRow[i], { after: true }),
  );
  c.show('mean-agreement', transfers);
  c.on(
    'mean-agreement',
    () =>
      s.play(...transfers.map((n, i) => to(n, (v) => v.moveTo(meanTargets[i]), { duration: 0.6 }))),
    0.3,
  );
  c.hide('mean-agreement', transfers, { after: true });
  c.show('mean-agreement', [sumTerms, mean], { after: true });
  c.show('pooled-chance', pooled, { after: true });
  c.show('fleiss-result', result, { after: true });
  c.swap('chance-models', result, comparison);
  c.swap('ordinal-distance', comparison, ordinal);
}
