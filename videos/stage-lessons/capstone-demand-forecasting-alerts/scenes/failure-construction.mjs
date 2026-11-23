import { area, begin, candidate, FIT_ROWS, FRIDAY, number, tableRows, WEEK, words } from '../parts.mjs';

export default function failure(s, c) {
  const title = begin(s, c);
  const [origin, grid, inspect, foot] = area.rows([1, 4, 2, 1], 'normal');
  const rows = tableRows(grid, 3, [3.2, 1.5, 1.5, 1.6]);
  const base = candidate[FRIDAY].toFixed(3);
  s.add(words(origin, 'Repeat the Feb 1 fit   ·   ' + FIT_ROWS.length + ' eligible training rows', 'cyan', 40));
  const row = (i, vals, colors) => vals.map((v, j) => words(rows[i][j], v, colors[j], 38));
  const test = number(foot, 'issue(changed, plans, origin) == first', 'dim', 36);
  c.show('mutation', [...row(0, ['Changed counts', 'Old Friday', 'New Friday', 'Same 7 rows?'], ['dim','dim','dim','dim']),
    ...row(1, ['15 unavailable +10,000 each', base], ['ink','cyan']), test]);
  const q = number(rows[1][2], '?', 'yellow', 49);
  c.show('ask', q);
  c.swap('same', q, number(rows[1][2], base, 'green', 43));
  const deltas = words(inspect, 'Unavailable-count edit   ·   seven differences     0    0    0    0    0    0    0', 'green', 37);
  c.show('deltas', [deltas, number(rows[1][3], 'True', 'green', 40)]);
  const control = row(2, ['Jan 30 final +10,000', base, '660.796', 'False'], ['ink','cyan','yellow','yellow']);
  c.show('control', control.slice(0, 2));
  c.hide('control', deltas);
  c.show('moved', control.slice(2));
  c.swap('late-plan', test, words(foot, 'Announcement after Sunday’s issue   →   original forecast stays fixed', 'dim', 37));
  const exampleWeeks = [WEEK, WEEK.map(day => day === 'Thu' ? 'Fri' : day)];
  const cells = tableRows(grid, 2, [2, 1, 1, 1, 1, 1, 1, 1]);
  const dates = exampleWeeks.flatMap((week, i) => [
    words(cells[i][0], ['Feb 1 issue', 'Feb 8 issue'][i], 'dim', 36),
    ...week.map((day, j) => words(cells[i][j + 1], day, i === 1 && day === 'Fri' ? 'yellow' : 'ink', 45)),
  ]);
  c.swapAll('duplicate', [
    words(origin, 'Check a copy of the two-week forecast ledger', 'cyan', 41), ...dates,
    words(inspect, '14 rows   ·   Friday appears twice   ·   Thursday is missing', 'yellow', 44),
  ], { keep: [title] });
}
