import { area, begin, forecastComparison, tableRows, words } from '../parts.mjs';

export default function receipt(s, c) {
  begin(s, c);
  const [criteria, sheet, reason, next] = area.rows([1, 4, 2, 2], 'normal');
  const rows = tableRows(sheet, 3, [2.2, 2.2, 1.5, 1.5]);
  const line = (i, cells, colors) => cells.map((v, j) => words(rows[i][j], v, colors[j], 39));
  const original = forecastComparison(), perfect = forecastComparison(1, 0, 0);
  s.add(...line(0, ['Candidate', 'Comparison pass?', 'Decision', 'Live ready?'], Array(4).fill('dim')));
  c.show('requirements', words(criteria, '2 origins × 7 mature horizons   ·   better MAE and peak   ·   previous model named', 'dim', 34));
  c.show('original', line(1, ['Issued', String(original.comparisonPass), original.decision, String(original.liveReady)], ['ink','red','yellow','yellow']));
  const limits = words(reason, 'Inside tolerance ≥ 85%   ·   precision and recall each ≥ 60%', 'dim', 35);
  c.show('limits', limits);
  c.show('perfect', line(2, ['Perfect replay', String(perfect.comparisonPass), perfect.decision, String(perfect.liveReady)], ['ink','green','yellow','yellow']));
  c.swap('fixture', limits, words(reason, 'Both decisions hold   ·   synthetic_fixture_only', 'yellow', 40));
  const seasons = words(next, 'Backtest on real seasons and events', 'ink', 42);
  const action = words(next, 'Original schedule   →   warning   →   extra shift booked', 'ink', 44);
  c.show('pilot', seasons);
  c.swap('shift', seasons, action);
  c.swap('recover', action, words(next, 'Restore the previous model with its data and features', 'ink', 42));
}
