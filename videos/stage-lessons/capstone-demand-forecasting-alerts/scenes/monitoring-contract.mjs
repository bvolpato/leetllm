import { area, actual, begin, metrics, number, plate, words } from '../parts.mjs';

export default function monitor(s, c) {
  begin(s, c);
  const [source, flow, outcome, conditions] = area.rows([1, 4, 2, 1], 'normal');
  const slots = flow.columns(3, 'wide');
  s.add(words(source, 'A day with no reported requests', 'dim', 38));
  const step = (j, name, value, color) => {
    const [top, bottom] = slots[j].rows(2, 'normal');
    return [plate(slots[j]), words(top, name, 'dim', 34), words(bottom, value, color, 41)];
  };
  c.show('zero', step(0, 'Daily feed', '0 reported', 'yellow'));
  c.show('verify', step(1, 'Reconciliation', 'still pending', 'yellow'));
  c.show('exclude', step(2, 'Next training set', 'withhold row', 'green'));
  const delay = words(outcome, 'Track arrival delay and missing labels alongside forecast error', 'ink', 38);
  c.show('arrival', delay);
  const m = metrics(actual.length), breaches = m.n - m.inside;
  c.swap('review', delay, number(outcome, breaches + '/' + m.n + ' breaches = ' + (100 * breaches / m.n).toFixed(1) + '%    >    15% review threshold', 'yellow', 39));
  c.show('window', words(conditions, 'Inspect the window size, event mix and changed plans before refitting', 'dim', 33));
}
