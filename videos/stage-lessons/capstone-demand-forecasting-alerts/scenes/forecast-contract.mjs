import { area, begin, capacity, number, plate, WEEK, words } from '../parts.mjs';

export default function contract(s, c) {
  const title = begin(s, c);
  const [issue, strip, method, work, result] = area.rows([1, 3, 1, 2, 1], 'normal');
  s.add(words(issue, 'FC-A  /  standard requests  /  UTC calendar days', 'dim', 37));
  const days = strip.columns(7, 'tight');
  const cards = days.flatMap((r, i) => {
    const [date, h, limit] = r.rows(3, 'tight');
    return [plate(r), words(date, WEEK[i] + ' ' + (i + 2), 'ink', 33), number(h, 'h = ' + (i + 1), 'cyan', 35), words(limit, 'cap ' + capacity[i], 'pink', 30)];
  });
  c.show('week', cards);
  const next = value => value / 2 + 10;
  const observed = 100, firstValue = next(observed);
  const step = (value, result) => '½ × ' + value + ' + 10   =   ' + result;
  const first = words(work, step(observed, '?'), 'cyan', 51);
  const recursive = words(method, 'Feed each prediction into the next step', 'ink', 38);
  c.show('recursive', [recursive, first]);
  c.swap('first-value', first, words(work, step(observed, firstValue), 'cyan', 51), { after: true });
  const second = words(result, step(firstValue, '?'), 'cyan', 45);
  c.show('feedback', second);
  c.swap('second-value', second, words(result, step(firstValue, next(firstValue)), 'cyan', 45), { after: true });
  const direct = words(work, 'One fitted model for each horizon', 'ink', 47);
  c.swapAll('direct', [direct], { keep: [title, ...cards] });
  const joint = words(result, 'Joint model   →   one seven-day vector', 'cyan', 39);
  c.show('joint', joint);
  c.swap('calendar', [direct, joint], [words(work, 'Seven dated feature rows   →   one set of weights', 'cyan', 47),
    words(result, 'Weekday   ·   elapsed weeks   ·   announced campaign', 'dim', 34)]);
}
