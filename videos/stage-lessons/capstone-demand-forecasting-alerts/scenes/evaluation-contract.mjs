import { actual, area, begin, metrics, number, peakDiagnostic, tableRows, words } from '../parts.mjs';

export default function evaluation(s, c) {
  const title = begin(s, c);
  const [rule, sheet, totals, foot] = area.rows([1, 5, 1.3, 1], 'normal');
  const rows = tableRows(sheet, 4, [1.5, 1, 2.6, 2.6]);
  const peak = peakDiagnostic();
  const header = ['Peak day', 'Actual', 'Seasonal penalty', 'Candidate penalty'];
  s.add(words(rule, 'Actual ≥ 150 requests   ·   charge 3 units per underforecast parcel', 'yellow', 38));
  c.show('qualify', header.map((v, j) => words(rows[0][j], v, 'dim', 34)));
  for (const [i, r] of peak.rows.entries()) {
    const terms = [r.date, r.actual, '3 × ' + r.baselineShortfall.toFixed(0) + ' = ' + r.baselineUnits,
      '3 × ' + r.candidateShortfall.toFixed(3) + ' ≈ ' + r.candidateUnits.toFixed(3)];
    c.show(['friday','surge','second-friday'][i], terms.map((v, j) => number(rows[i + 1][j], v, ['ink','green','blue','cyan'][j], 37)));
  }
  const sum = words(totals, 'Peak penalty total    ' + peak.baselineUnits + '    →    ' + peak.candidateUnits.toFixed(3) + ' units', 'yellow', 44);
  c.show('sum', sum);
  const add = 6, n = actual.length;
  c.show('change', words(foot, 'Extra shortfall of ' + add + ' on a peak day    →    +' + (3 * add) + ' units    ·    MAE rises by ' + add + '/' + n + ' parcels', 'ink', 35));
  const m = metrics(n);
  c.swapAll('band', [words(rule, 'Tolerance around the issued point', 'cyan', 41),
    number(sheet, 'max(0, forecast − 6)    …    forecast + 6', 'cyan', 52),
    words(totals, m.inside + ' of ' + n + ' final counts inside the band', 'ink', 42),
    words(foot, 'To assess an interval, measure coverage and width on later windows', 'dim', 34)], { keep: [title] });
}
