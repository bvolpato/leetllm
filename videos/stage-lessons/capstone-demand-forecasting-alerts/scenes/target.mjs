import { group, rect } from 'vizmatic/stage';
import { area, begin, stroke, words } from '../parts.mjs';

export default function target(s, c) {
  begin(s, c);
  const [unit, one, two, decision] = area.rows([1, 2, 2, 2], 'normal');
  s.add(words(unit, 'Two example days at the same dock   ·   capacity 150 parcels', 'dim', 36));
  function day(region, name, requests) {
    const [tag, plot] = region.columns([1, 5], 'wide');
    const x = n => plot.left + 50 + n / 200 * (plot.width - 80);
    const bar = (a, b, color) => rect(x(b) - x(a), 39, { fill: color, stroke: null }).moveTo([(x(a) + x(b)) / 2, plot.cy]);
    return {
      common: [words(tag, name), bar(0, 150, 'blue'), stroke(x(150), plot.cy - 35, x(150), plot.cy + 35, 'pink', 3)],
      shipped: words(region.rows(3, 'tight')[2], '150 completed', 'blue', 36),
      requests: requests > 150 ? group(bar(150, requests, 'green'), words(region.rows(3, 'tight')[0], requests + ' requested', 'green', 36)) : words(region.rows(3, 'tight')[0], requests + ' requested', 'green', 36),
    };
  }
  const a = day(one, 'Day A', 150), b = day(two, 'Day B', 176);
  s.add(...a.common, ...b.common);
  c.show('completions', [a.shipped, b.shipped]);
  c.show('day-a', a.requests);
  c.show('day-b', b.requests);
  const ask = words(decision, 'Which log distinguishes the two days?', 'yellow', 45);
  c.show('ask', ask);
  c.swap('measure', ask, words(decision, 'Count requests for FC-A’s standard service', 'green', 46));
}
