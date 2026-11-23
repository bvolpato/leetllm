import { dot, draw, dynamic } from 'vizmatic/stage';
import { actual, area, begin, candidate, capacity, forecastWeights, parcelRuler, residual, words } from '../parts.mjs';

export default function issued(s, c) {
  begin(s, c);
  const [clock, plot, plan, decision] = area.rows([1, 5, 1, 2], 'normal');
  const wed = 2, point = candidate[wed], limit = capacity[wed];
  const r = parcelRuler(plot, 110, 160);
  const issue = words(clock, 'Issued Sun Feb 1   →   Wed Feb 4   ·   horizon 3', 'dim', 37);
  s.add(issue, r.rail, r.pin(limit, 'Capacity  ' + limit, 'pink', 'below'));
  const known = words(plan, 'Plan at issue   ·   campaign announced Jan 28', 'cyan', 38);
  c.show('announced', known);
  c.show('file', r.pin(point, 'Issued  ' + point.toFixed(3), 'cyan', 'above'));
  const pending = words(decision, 'Planning signal   ·   forecast exceeds 140', 'yellow', 44);
  c.show('signal', pending);
  const canceled = words(plan, 'Later event   ·   Wednesday campaign canceled', 'yellow', 37);
  c.swap('canceled', known, canceled);
  const revised = point - forecastWeights[8];
  const copy = s.value(point);
  const marker = dynamic(() => [dot(11, 'yellow').moveTo([r.x(copy.value), r.y])]);
  c.show('flag-off', marker);
  c.on('flag-off', () => s.play(copy.to(revised), { duration: 1.3 }));
  const replay = words(plan, 'Later replay with flag off    ' + point.toFixed(3) + ' − ' + forecastWeights[8].toFixed(3) + ' ≈ ' + revised.toFixed(3), 'yellow', 40);
  c.swap('replay', [canceled, marker], [replay, r.pin(revised, 'Replay  ' + revised.toFixed(3), 'yellow', 'below')]);
  c.swap('arrived', [issue, pending], words(clock, 'Final count available Thu Feb 5   ·   06:00 UTC', 'dim', 37));
  c.show('count', r.pin(actual[wed], 'Actual  ' + actual[wed], 'green', 'above'));
  const ask = words(decision, 'Which forecast should we score against 123?', 'yellow', 46);
  c.show('ask', ask);
  c.show('original', draw(r.gap(point, actual[wed], 'cyan')));
  c.swap('original', ask, words(decision, actual[wed] + ' − ' + point.toFixed(3) + ' ≈ ' + residual(wed).toFixed(3) + ' parcels', 'green', 47));
  c.swap('erased', replay, words(plan, 'Scoring the later replay would show only ' + Math.abs(actual[wed] - revised).toFixed(3) + ' parcels of error', 'dim', 37));
}
