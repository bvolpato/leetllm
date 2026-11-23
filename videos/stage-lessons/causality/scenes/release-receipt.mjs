import { numberLine, place } from 'vizmatic/stage';
import { label } from '../../kit-narrated.mjs';
import { captions, diff, fork, frame, plot, raw, record, ring, signal, vertex, wire } from '../parts.mjs';
import { standardizedFixture } from '../../../films/causality/model.mjs';

export default function releaseReceipt(s, c) {
  frame(
    s,
    c.title,
    'Routing in the deployment queue',
    'What the log tells us',
  );
  const g = fork(),
    held = ring(g.risk),
    random = vertex('Random draw', 'below'),
    za = wire(random, g.a, 'yellow');
  const [observed, adjusted, person] = record(s, [
    ['Observed workflow contrast', 'Different case mixes'],
    ['Adjusted deployment contrast', '70% easy / 30% difficult'],
    ['Individual effect', 'Counterfactual missing'],
  ]);
  s.add(g.a, g.y, g.risk, g.ra, g.ry, g.ay);
  signal(s, c, 'mechanism', [g.ra, g.ry]);
  c.hide('random', g.ra);
  c.show('random', [random, za]);
  signal(s, c, 'random', [za]);
  c.show('strata', [held, g.ra]);
  signal(s, c, 'within', [g.ra, za]);
  c.hide('raw', [random, za, held]);
  observed(c, 'raw', diff(raw[0] - raw[1]), true);
  const value = standardizedFixture();
  adjusted(c, 'adjusted', diff(value.difference), true);
  const limits = value.interval.map((v) => 100 * v);
  const [title, axis, bounds] = plot.rows([1.4, 1.4, 1.6], 'normal');
  const ruler = place(numberLine({
    range: [-12, 32], ticks: [-10, 0, 10, 20, 30],
    length: axis.width * 0.82, size: 34, labelSize: 32, format: (v) => v + ' pp',
  }), axis);
  ruler.interval(...limits, { color: 'yellow' });
  ruler.marker(value.difference * 100, { color: 'cyan', radius: 11 });
  c.swap('interval', [g.a, g.y, g.risk, g.ra, g.ry, g.ay], [
    place(label('Adjusted 24-hour resolution difference', { size: 40 }), title),
    ruler,
    place(label('Rough interval: ' + limits.map((v) => v.toFixed(1)).join(' to ') + ' percentage points', { size: 33 }), bounds),
  ], { after: true, lead: 0 });
  person(c, 'individual', 'Unresolved');
  captions(
    s,
    c,
    'Specify the population, workflows and outcome window before interpreting a rate.',
    [
      ['random', 'A marginally randomized draw assigns the action.'],
      ['strata', 'In a stratified design, the assignment probability can depend on risk.'],
      ['raw', 'The raw report compares different queues.'],
      ['adjusted', 'The adjusted report compares the same target mix in both arms.', true],
      ['decision', 'Do these tickets justify changing the route for everyone?'],
      ['trial', 'If tickets share staff, test the rollout at the level of independent queues.'],
    ],
  );
}
