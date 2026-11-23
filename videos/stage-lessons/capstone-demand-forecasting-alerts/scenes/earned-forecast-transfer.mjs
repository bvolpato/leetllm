import { area, begin, lateLabelMetrics, number, parcelRuler, plate, tableRows, TOLERANCE, transferActuals, transferCapacities, transferForecasts, words } from '../parts.mjs';

export default function transfer(s, c) {
  const title = begin(s, c);
  const [scope, sheet, decision, score, signals] = area.rows([1, 5, 1.25, 1, 1], 'normal');
  const rows = tableRows(sheet, 4, [1.6, 2, 2, 2, 2]);
  const partial = lateLabelMetrics([0, 2]), full = lateLabelMetrics([0, 1, 2]);
  const heads = ['Day', 'Issued', 'Capacity', 'Final count', 'Abs. error'];
  const num = (day, col, value, color) => number(rows[day + 1][col], value, color, 43);
  const err = i => Math.abs(transferActuals[i] - transferForecasts[i]);
  s.add(words(scope, 'New three-day worksheet   ·   ±6 parcels   ·   all three counts required', 'dim', 36),
    ...heads.map((v, j) => words(rows[0][j], v, 'dim', 32)));
  c.show('book', transferForecasts.flatMap((v, i) => [
    words(rows[i + 1][0], ['Tue','Wed','Thu'][i], 'ink', 41), num(i, 1, v, 'cyan'), num(i, 2, transferCapacities[i], 'pink'),
  ]));
  const pending = words(rows[2][3], 'pending', 'yellow', 37);
  c.show('verified', [num(0, 3, transferActuals[0], 'green'), pending, num(2, 3, transferActuals[2], 'green')]);
  const first = words(decision, 'Which rows belong in today’s mean absolute error?', 'yellow', 45);
  c.show('first-question', first);
  const incomplete = words(decision, 'Wednesday stays open   ·   worksheet incomplete', 'yellow', 39);
  c.swap('two', first, [num(0, 4, err(0), 'green'), num(2, 4, err(2), 'green'), incomplete]);
  const earlyScore = words(score, 'Mean absolute error   (1 + 0) / ' + partial.n + ' = ' + partial.mae + ' parcels     ·     Within tolerance   ' + partial.inside + '/' + partial.n, 'cyan', 36);
  c.show('mean', earlyScore);
  const earlySignals = words(signals, 'Precision   1 correct / 1 warning     ·     Recall   1 caught / 1 overload', 'green', 36);
  c.show('caught', earlySignals);
  c.swap('wednesday', pending, [plate(rows[2][3], 'green'), num(1, 3, transferActuals[1], 'green')]);
  const ask = words(decision, 'Did we miss an overload? Was the error greater than six parcels?', 'yellow', 41);
  c.hide('wednesday', [earlyScore, earlySignals, incomplete]);
  c.show('last-question', ask);
  const missed = words(decision, '138 ≤ 140 at issue    ·    145 > 140 at close    →    missed overload', 'yellow', 41);
  c.hide('compare', ask);
  c.show('missed', missed);
  c.show('seven', num(1, 4, err(1), 'red'));
  c.show('update-error', words(score, 'Mean absolute error   (1 + 7 + 0) / ' + full.n + ' = 8/3 parcels     ·     Within tolerance   ' + full.inside + '/' + full.n, 'cyan', 36));
  c.show('update-recall', words(signals, 'Precision   1 correct / 1 warning     ·     Recall   1 caught / 2 overloads', 'green', 36));
  const [date, plot, bandLabel, question] = area.rows([1, 5, 1, 2], 'normal');
  const wed = parcelRuler(plot, 130, 155);
  const point = transferForecasts[1], cap = transferCapacities[1], count = transferActuals[1];
  c.swapAll('scale', [
    words(date, 'Wednesday   ·   verified count against its issued record', 'dim', 38),
    wed.rail, wed.band(point, TOLERANCE), wed.pin(point, 'Issued  ' + point, 'cyan', 'above'),
    wed.pin(cap, 'Capacity  ' + cap, 'pink', 'below'), wed.pin(count, 'Actual  ' + count, 'green', 'below'),
    words(bandLabel, 'Fixed tolerance   ' + (point - TOLERANCE) + ' to ' + (point + TOLERANCE) + ' parcels', 'cyan', 36),
  ], { keep: [title] });
  c.show('peak-cutoff', wed.pin(150, 'Peak cutoff  150', 'yellow', 'above'));
  const peakQuestion = words(question, 'How many peak penalty units does Wednesday add?', 'yellow', 46);
  c.show('peak-question', peakQuestion);
  const zero = words(question, 'Wednesday adds ' + lateLabelMetrics([1]).peak + ' peak penalty units', 'yellow', 46);
  c.swap('zero', peakQuestion, zero, { after: true });
  c.swap('route', zero, words(question, 'Record the missed overload   ·   investigate the +7 residual', 'yellow', 43));
}
