import { captions, fork, frame, record, ring, sharedQueue, signal } from '../parts.mjs';

export default function intervene(s, c) {
  frame(
    s,
    'Observe a workflow or assign it',
    'Surgery on the assignment graph',
    'Population and action',
  );
  const g = fork(),
    fixed = ring(g.a),
    spill = sharedQueue(g.a);
  const [population, operator, route] = record(s, [
    ['Population', 'Assistant recipients'],
    ['Operation', 'Observe A', 'cyan'],
    ['Incoming mechanism', 'Risk → A'],
  ]);
  c.take([g.a, g.y]);
  s.add(g.risk, g.ra, g.ry, g.ay);
  signal(s, c, 'observed', [g.ra, g.ry]);
  population(c, 'intervention', 'Specified population');
  c.hide('cut', g.ra);
  c.show('cut', fixed);
  operator(c, 'cut', 'Set A = assistant');
  route(c, 'cut', 'Assignment fixed');
  signal(s, c, 'survives', [g.ry, g.ay]);
  c.show('queue', spill.nodes);
  c.on('interference', () => spill.trace(s));
  population(c, 'policy', 'Entire queue');
  captions(s, c, 'Observed recipients inherit the case mix chosen by routing.', [
    ['cut', 'Setting the workflow cuts the incoming risk-to-assignment edge.'],
    ['survives', 'Risk can still affect whether the ticket resolves.'],
    ['queue', 'Changing a whole queue can change the outcome of another ticket.'],
  ]);
}
