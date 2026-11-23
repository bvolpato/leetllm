import { pipeline, place } from 'vizmatic/stage';
import { dispatch } from '../../../films/capstone-production-llm-agent/model.mjs';
import { bench, C, field, openBench, records } from '../parts.mjs';

export default function dispatchScene(s, c) {
  openBench(s, c, 'Where does a proposal lose permission?');
  const [gates, log, foot] = bench.rows([4, 4, 1], 'normal');
  const path = place(
    pipeline(['Tool', 'Schema', 'Resource', 'State'], {
      width: gates.width - 8,
      size: 33,
      lanes: 3,
      gates: true,
    }),
    gates,
  );
  const inputs = [
    ['lookup A301', dispatch('Account lookup', { account: 'A301' })],
    ['restore', dispatch('Restore access')],
    ['early draft', dispatch('Cited draft')],
  ];
  const trace = records(
    log,
    [
      ['id', 'Attempt', 0.27],
      ['reason', 'Enforcement', 0.42],
      ['ran', 'Executed', 0.17],
      ['effect', 'Effects', 0.14],
    ],
    inputs.slice(0, 2).map(([id]) => ({ id })),
    { size: 30, maxRows: 4 },
  );
  const envelope = field(foot, 'Envelope   { action, args }', C.ticket);
  const extra = field(foot, 'Invalid field   ·   approved', C.blocked);
  const nonblank = field(foot, 'Nonblank string', C.stored);
  const missing = field(foot, 'State gate   ·   missing policy evidence and A300 context', C.blocked);
  const limit = field(foot, 'Nonblank string · at most 1,600 characters', C.stored);
  s.add(path, trace);
  const [lookup, restore, draft] = inputs.map(([id]) => id);
  c.on('dispatch-gates', () => s.play(path.put({ id: lookup, color: C.ticket })));
  c.on('wrong-account', () => s.play(path.move(lookup, 2)));
  c.after('unauthorized', () =>
    s.play(
      path.stop(lookup),
      trace.setCell(lookup, 'reason', inputs[0][1]),
      trace.setCell(lookup, 'ran', 'false'),
    ),
  );
  c.on('separate-attempt', () => s.play(trace.light(null, 'ran')));
  c.on('restore-attempt', () => s.play(path.put({ id: restore, lane: 1, color: C.ticket })));
  c.after('zero-effects', () =>
    s.play(
      path.stop(restore),
      trace.setCell(restore, 'reason', inputs[1][1]),
      trace.setCell(restore, 'ran', 'false'),
      trace.setCell(restore, 'effect', 0),
      trace.setCell(lookup, 'effect', 0),
    ),
  );
  c.show('dispatch-core-3', envelope);
  const spaces = '"   "';
  c.on('nonblank', () => {
    s.play(path.put({ id: spaces, lane: 2, color: C.active }), { duration: 0.25 });
    s.play(path.move(spaces, 1), { duration: 0.4 });
    s.play(trace.append({ id: 'Spaces-only lookup', reason: 'invalid_argument_values', ran: 'false', effect: 0 }),
      path.stop(spaces, 'spaces only'), { duration: 0.3 });
  });
  c.swap('nonblank', envelope, nonblank, { lead: 0 });
  c.swap('max-string', nonblank, limit, { lead: 0 });
  c.on('max-string', () => s.play(trace.light(null)));
  c.on('invented-approval', () => s.play(path.exit(spaces), { duration: 0.25 }));
  c.swap('invented-approval', limit, extra, { after: true });
  c.hide('state-check', extra, { lead: 0, fade: 0.12 });
  c.show('state-check', missing, { after: true, lead: 0 });
  c.on('state-check', () => {
    s.play(path.put({ id: draft, lane: 2, color: C.ticket }));
    s.play(path.move(draft, 3));
    s.play(
      path.stop(draft),
      trace.append({ id: draft, reason: 'Missing inputs', ran: 'false', effect: 0 }),
    );
  });
  c.clear(path.laneNodes, 0.8, 0.18);
}
