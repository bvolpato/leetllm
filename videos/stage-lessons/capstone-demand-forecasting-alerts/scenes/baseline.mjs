import { area, baseline, begin, number, plate, words } from '../parts.mjs';

export default function seasonal(s, c) {
  begin(s, c);
  const [clock, sheet, answer, foot] = area.rows([1, 4, 2, 1], 'normal');
  const cols = sheet.columns(3, 'wide');
  const cards = (dates, detail) => dates.flatMap((d, i) => {
    const [name, value] = cols[i].rows(2, 'normal');
    return [plate(cols[i]), words(name, d), words(value, detail[i], i === 2 ? 'cyan' : 'dim', 34)];
  });
  const first = cards(['Sun Jan 25', 'Sun Feb 1', 'Sun Feb 8'], ['final count', '08:00 · day still open', 'target day']);
  const issue = words(clock, 'Forecast issued on Feb 1', 'cyan');
  s.add(issue);
  c.show('sundays', first);
  const prompt = words(answer, 'Which Sunday can supply the baseline?', 'yellow', 45);
  c.show('ask', prompt);
  const sunday = number(answer, 'Jan 25   →   ' + baseline[6] + ' parcels for Feb 8', 'green', 48);
  c.swap('copy', prompt, sunday);
  const next = cards(['Sat Jan 31', 'Sat Feb 7', 'Sat Feb 14'], ['final count', 'audit still open', 'target day']);
  c.swap('saturdays', [issue, ...first, sunday], [words(clock, 'Forecast issued on Feb 8', 'cyan'), ...next]);
  c.show('skip', [number(answer, 'Jan 31   →   ' + baseline[12] + ' parcels for Feb 14', 'green', 48),
    words(foot, 'Save the matching source date with the prediction', 'dim', 34)]);
}
