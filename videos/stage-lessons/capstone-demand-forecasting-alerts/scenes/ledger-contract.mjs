import { actual, area, begin, candidate, FRIDAY, number, tableRows, words } from '../parts.mjs';
import { rowDigest } from '../../../films/capstone-demand-forecasting-alerts/model.mjs';

export default function ledger(s, c) {
  begin(s, c);
  const [identity, sheet, equation, foot] = area.rows([1, 4, 2, 1], 'normal');
  const rows = tableRows(sheet, 3, [3, 2, 2, 2]);
  const entry = (i, values, colors) => values.map((v, j) => words(rows[i][j], v, colors[j], 39));
  s.add(words(identity, 'FC-A   /   standard   /   Feb 1, 08:00 UTC   /   Feb 6   /   ols-v1', 'cyan', 36));
  const header = entry(0, ['Friday record', 'Issued point', 'Actual', 'Error'], ['dim','dim','dim','dim']);
  const point = candidate[FRIDAY], count = actual[FRIDAY], err = count - point;
  const append = entry(1, ['Append final count', point.toFixed(3), count, '+' + err.toFixed(3)], ['ink','cyan','green','green']);
  const pending = words(rows[1][2], 'pending', 'dim', 34);
  const days = ['Sun 1', 'Mon 2', 'Tue 3', 'Wed 4', 'Thu 5', 'Fri 6'];
  const calendar = equation.columns(days.length, 'tight').map((slot, i) =>
    words(slot, days[i], i === 0 || i === days.length - 1 ? 'cyan' : 'dim', 43));
  s.add(...header, ...append.slice(0, 2), pending, ...calendar);
  const horizon = words(foot, 'Feb 1  +  5 days  =  Feb 6', 'cyan', 49);
  c.show('key', horizon);
  c.swap('join', [...calendar, horizon, pending], append[2], { after: true });
  c.show('miss', append[3], { after: true });
  const rewrite = entry(2, ['Overwrite point', count, count, '0'], ['red','red','green','red']);
  c.show('second-row', rewrite[0]);
  c.show('rewrite', rewrite.slice(1, 3));
  c.show('apparent', rewrite[3], { after: true });
  const [issued, edited] = equation.columns(2, 'wide');
  const originalHash = number(issued, 'Original   ' + rowDigest(point).slice(0, 12), 'cyan', 40);
  const editedHash = number(edited, 'Edited   ' + rowDigest(count).slice(0, 12), 'red', 40);
  const prefixes = words(foot, 'First 12 characters of each example row’s SHA-256 hash', 'dim', 34);
  c.show('fingerprint', [originalHash, prefixes]);
  c.show('edited', editedHash);
  const whole = words(foot, 'Compare hashes of the full issued ledger', 'ink', 39);
  c.swap('whole', [originalHash, editedHash, prefixes], whole);
  c.show('reference', words(issued, 'Protect the reference hash at issue', 'cyan', 36));
  c.show('compare', words(edited, 'Recompute the ledger hash at review', 'yellow', 36));
}
