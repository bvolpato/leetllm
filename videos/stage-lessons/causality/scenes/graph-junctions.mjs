import { draw } from 'vizmatic/stage';
import { captions, frame, record, ring, signal, vertex, wire } from '../parts.mjs';
import { junctionPathOpen } from '../../../films/causality/model.mjs';

export default function graphJunctions(s, c) {
  frame(
    s,
    'Condition on the middle of a path',
    'Workflow and resolution',
    'Path through the junction',
  );
  const a = vertex('Workflow', 'a', 'cyan'),
    y = vertex('Resolution', 'y', 'green');
  const m = vertex('Summary', 'cause'),
    r = vertex('Risk', 'cause'),
    audit = vertex('Audit', 'cause');
  const am = wire(a, m),
    my = wire(m, y),
    ra = wire(r, a),
    ry = wire(r, y),
    aa = wire(a, audit),
    ya = wire(y, audit);
  // A trace follows the association. The arrowheads still show the causal directions.
  const trace = (from, to) => wire(from, to, 'yellow', { tip: false, width: 6, gap: 24 });
  const chainStop = trace(a, m),
    forkStop = trace(a, r);
  const intoAudit = trace(a, audit),
    outOfAudit = trace(audit, y);
  const locks = [m, r, audit].map(ring);
  const [kind, condition, path] = record(s, [
    ['Junction', 'Chain'],
    ['Conditioning', 'None'],
    ['Path', 'Open', 'yellow'],
  ]);
  c.take([a, y]);
  c.keep([a, y]);
  s.add(m, am, my);
  c.on('chain', () => {
    s.play(am.pulse({ color: 'yellow', duration: 0.8 }));
    s.play(my.pulse({ color: 'yellow', duration: 0.8 }));
  });
  c.after('mediator', () => s.play(draw(chainStop), { duration: 0.9 }));
  const status = (k, v) => (junctionPathOpen(k, v) ? 'Open' : 'Blocked');
  c.show('mediator', locks[0]);
  condition(c, 'mediator', 'Summary fixed');
  path(c, 'mediator', status('chain', true), true);
  c.swap('fork', [m, am, my, locks[0], chainStop], [r, ra, ry]);
  kind(c, 'fork', 'Fork');
  condition(c, 'fork', 'None');
  path(c, 'fork', status('fork', false));
  signal(s, c, 'cause', [ra, ry]);
  c.show('risk', locks[1]);
  c.after('risk', () => s.play(draw(forkStop), { duration: 0.9 }));
  condition(c, 'risk', 'Risk fixed');
  path(c, 'risk', status('fork', true), true);
  c.swap('collider', [r, ra, ry, locks[1], forkStop], [audit, aa, ya]);
  kind(c, 'collider', 'Collider');
  condition(c, 'collider', 'None');
  path(c, 'collider', status('collider', false));
  c.after('collider', () => s.play(draw(intoAudit), { duration: 1.1 }));
  c.show('open', locks[2], { after: true, lead: 0 });
  condition(c, 'open', 'Audit fixed', true);
  c.after('open', () => s.play(draw(outOfAudit), { duration: 1.2 }));
  path(c, 'open', status('collider', true), true);
  c.on('dependence', () => {
    s.play(intoAudit.pulse({ color: 'yellow', width: 12, duration: 0.8 }));
    s.play(outOfAudit.pulse({ color: 'yellow', width: 12, duration: 0.8 }));
  });
  captions(s, c, 'Trace the route from assignment to resolution.', [
    ['mediator', 'Fixing a mediator removes one route of the total effect.'],
    ['fork', 'Risk is upstream of both variables.'],
    ['collider', 'The two arrows now meet at a common effect.'],
    ['dependence', 'An open path permits dependence. Opposing contributions can cancel.'],
  ]);
}
