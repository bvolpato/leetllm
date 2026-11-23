import { actual, area, begin, metrics, number, plate, residual, TOLERANCE, WEEK, words } from '../parts.mjs';

export default function scoring(s, c) {
  begin(s, c);
  const [clock, week1, week2, summary, footer] = area.rows([1, 3, 3, 1.5, 1], 'normal');
  const slots = [week1, week2].flatMap(r => r.columns(7, 'tight'));
  const cells = slots.map(r => r.rows(3, 'tight'));
  s.add(...slots.map(r => plate(r)), ...slots.map((_, i) => words(cells[i][0], WEEK[i % 7] + ' ' + (2 + i), 'dim', 32)));
  const early = words(clock, 'Feb 8, 08:00 UTC   ·   absolute error in parcels for each target day', 'ink', 38);
  c.show('early', early);
  const errorCell = i => number(cells[i][1], Math.abs(residual(i)).toFixed(2), 'cyan', 39);
  const known = 5, n = actual.length, partial = metrics(known), all = metrics(n);
  const pending = slots.slice(known).map((_, j) => words(cells[j + known][1], 'pending', 'dim', 31));
  const partialMean = words(summary, partial.candidateSum.toFixed(2) + ' parcels of absolute error / ' + known + ' mature forecasts ≈ ' + partial.mae.toFixed(2) + ' parcels', 'cyan', 39);
  c.show('five', [...Array.from({length: known}, (_, i) => errorCell(i)), ...pending, partialMean]);
  c.swap('later', early, words(clock, 'Feb 16, 07:00 UTC   ·   absolute error in parcels for each target day', 'ink', 38));
  c.swap('fourteen', [...pending, partialMean], [...slots.slice(known).map((_, j) => errorCell(j + known)),
    words(summary, 'MAE on 14 mature rows     Seasonal ' + all.baseline.toFixed(3) + '    →    Candidate ' + all.mae.toFixed(3) + ' parcels', 'cyan', 39)]);
  const missed = slots.flatMap((_, i) => Math.abs(residual(i)) > TOLERANCE ? [words(cells[i][2], '> 6', 'red', 34)] : []);
  c.show('six', [...missed, words(footer, (n - missed.length) + '/' + n + ' within ±6 parcels', 'yellow', 39)]);
}
