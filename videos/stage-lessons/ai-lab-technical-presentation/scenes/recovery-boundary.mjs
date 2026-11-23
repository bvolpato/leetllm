import { indicate, line, circle } from 'vizmatic/stage';
import { routingDiagram, addTitle, work, caption, CASE } from '../parts.mjs';

export default function recoveryBoundary(s, c) {
  addTitle(s, c);
  const [map, detail] = work.rows([4, 1]);
  const [record, foot] = detail.rows(2, 'tight');
  const net = routingDiagram(map),
    [old, candidate] = net.lanes;
  const prior = circle(9, { stroke: 'yellow', fill: 'yellow' }).moveTo(
      record.columns([1, 1.5], 'tight')[0].point('right'),
    ),
    next = net.packet(0);
  const source = caption(old.names[0], 'Future request', 'blue'),
    dest = caption(old.names[2], 'User', 'blue');
  const sample = caption(candidate.names[0], 'Current canary share', 'cyan'),
    candidateUser = caption(candidate.names[2], 'User', 'cyan');
  const log = record.columns([1, 1.5], 'tight')[1];
  const audit = caption(log, 'Audit log  ·  earlier shadow request', 'dim', 36);
  prior.moveTo([log.point('center')[0] - audit.width / 2 - 28, log.point('center')[1]]);
  const start = old.slots[0],
    branch = candidate.slots[0];
  const junction = [map.left + map.width * 0.04, (start[1] + branch[1]) / 2];
  const oldWire = [
    line(junction, [junction[0], start[1]], { stroke: 'blue', width: 4 }),
    line([junction[0], start[1]], start, { stroke: 'blue', width: 4 }),
  ];
  const corner = [junction[0], branch[1]];
  const canaryWire = [
    line(junction, corner, { stroke: 'cyan', width: 4 }),
    line(corner, branch, { stroke: 'cyan', width: 4 }),
  ];
  const heldShare = caption(candidate.names[0], 'Canary share frozen', 'yellow');
  const closed = caption(candidate.names[0], 'No new traffic', 'dim');
  const gate = CASE.service;
  const initial = caption(foot, 'Promotion gate    ·    latency AND availability', 'dim');
  const latency = caption(
    foot,
    gate.successfulP95Ms + ' ms < ' + gate.latencyLimitMs + ' ms    ·    latency passes',
    'green',
  );
  const success = caption(
    foot,
    100 * gate.successFraction +
      '% < ' +
      100 * gate.minimumSuccess +
      '%    ·    availability fails',
    'red',
  );
  const all = caption(
    foot,
    gate.attempts - gate.timeouts + ' successes  /  ' + gate.attempts + ' attempts',
    'yellow',
  );
  const held = caption(foot, 'Hold promotion at the current canary share.', 'yellow');
  const back = caption(foot, 'Rollback routes the next request to the old path.', 'blue');
  const persistent = caption(foot, 'The earlier audit entry still exists.', 'yellow');
  const recover = caption(foot, 'Stored effects need their own recovery plan.');
  s.add(net.nodes, oldWire, canaryWire, source, dest, sample, candidateUser, audit, prior, initial);
  c.on('both', () => s.play(indicate(initial, { scale: 1, color: 'yellow' })));
  c.swap('p95', initial, latency, { after: true });
  c.swap('success', latency, success, { after: true });
  c.swap('attempts', success, all, { after: true });
  c.swap('hold', all, held, { after: true });
  c.swap('hold', sample, heldShare);
  c.swap('rollback', [heldShare, held, canaryWire], [closed, back]);
  c.show('rollback', next, { after: true });
  c.on('route', () => s.play(net.travel(next, 0, 1)));
  c.after('route', () => s.play(net.travel(next, 0, 2)));
  c.swap('effect', back, persistent, { after: true });
  c.swap('separate', persistent, recover);
  c.on('ownership', () => s.play(indicate(prior, { color: 'yellow', scale: 1.3 })));
}
