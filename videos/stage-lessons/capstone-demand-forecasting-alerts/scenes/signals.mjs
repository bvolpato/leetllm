import { rect } from 'vizmatic/stage';
import { actual, area, begin, candidate, capacity, number, signalCounts, tableRows, words } from '../parts.mjs';

export default function signals(s, c) {
  begin(s, c);
  const [rule, grid, denominator, ratios] = area.rows([1, 5, 1, 1], 'normal');
  const rows = tableRows(grid, 5, [1.5, 2.2, 2.2, 1.7, 1.7]);
  const head = ['Target', 'Issued vs cap', 'Actual vs cap', 'Warned?', 'Overload?'];
  s.add(words(rule, 'Use the original schedule for both comparisons', 'dim', 38),
    ...head.map((v, j) => words(rows[0][j], v, 'dim', 32)));
  const dates = [2, 4, 8, 11];
  for (const [k, i] of dates.entries()) {
    const r = rows[k + 1], warned = candidate[i] > capacity[i], overloaded = actual[i] > capacity[i];
    const left = [words(r[0], 'Feb ' + (i + 2), 'ink', 36), number(r[1], candidate[i].toFixed(2) + (warned ? ' > ' : ' ≤ ') + capacity[i], 'cyan', 37)];
    const right = [number(r[2], actual[i] + (overloaded ? ' > ' : ' ≤ ') + capacity[i], 'green', 37),
      words(r[3], warned ? 'yes' : 'no', warned ? 'yellow' : 'dim', 38), words(r[4], overloaded ? 'yes' : 'no', overloaded ? 'green' : 'dim', 38)];
    s.add(...left);
    c.show(['wed','fri','tue','again'][k], right);
  }
  const counts = signalCounts();
  const frame = (r, color) => rect(r.width * 0.7, r.height * 0.9, { fill: null, stroke: color, width: 3 }).moveTo([r.cx, r.cy]);
  const warned = dates.flatMap((i, k) => candidate[i] > capacity[i] ? [frame(rows[k + 1][3], 'yellow')] : []);
  const overloaded = dates.flatMap((i, k) => actual[i] > capacity[i] ? [frame(rows[k + 1][4], 'green')] : []);
  c.show('precision', [...warned, words(denominator, 'Precision    ' + counts.tp + ' correct / ' + (counts.tp + counts.fp) + ' warnings     ·     Feb 4, 6, 13', 'yellow', 39)]);
  c.show('recall', [...overloaded, words(ratios, 'Recall    ' + counts.tp + ' caught / ' + (counts.tp + counts.fn) + ' overloads     ·     Feb 6, 10, 13', 'green', 39)]);
}
