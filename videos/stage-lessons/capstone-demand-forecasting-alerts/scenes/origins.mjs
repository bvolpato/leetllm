import { area, begin, FIT_ROWS, number, plate, words } from '../parts.mjs';

export default function origins(s, c) {
  begin(s, c);
  const [clock, week, decision, foot] = area.rows([1, 3, 2, 1], 'normal');
  const days = week.columns(7, 'tight');
  const heading = words(clock, 'Fit at Sun Feb 1   ·   08:00 UTC', 'cyan', 47);
  s.add(heading);
  const strip = days.flatMap((r, i) => [plate(r), words(r.rows(3, 'tight')[0], 'Feb ' + (i + 1), 'ink', 36)]);
  const first = words(decision, FIT_ROWS.length + ' final counts available   ·   through Jan 31', 'green', 45);
  c.show('first', [first, ...strip]);
  const question = words(decision, 'Can the Feb 8 fit use Saturday’s count?', 'yellow', 45);
  const history = words(decision, 'Previous fit   ·   ' + FIT_ROWS.length + ' final counts through Jan 31', 'dim', 41);
  c.swap('advance', [heading, first], [words(clock, 'Fit at Sun Feb 8   ·   08:00 UTC', 'cyan', 47), history]);
  const admitted = days.slice(0, 6).map(r => number(r, 'final', 'green', 37));
  const second = words(decision, FIT_ROWS.length + ' + ' + admitted.length + ' = ' + (FIT_ROWS.length + admitted.length) + ' training rows', 'green', 50);
  c.show('six', admitted);
  const lastDay = days[6].rows(3, 'tight');
  const later = words(foot, 'Saturday’s batch becomes readable on Mon Feb 9 at 06:00 UTC', 'yellow', 36);
  c.show('saturday', later);
  c.swap('ask', history, question);
  c.swap('arrives', question, [words(lastDay[1], 'pending', 'yellow', 38), words(lastDay[2], 'audit', 'yellow', 30)]);
  c.show('total', second, { after: true });
}
