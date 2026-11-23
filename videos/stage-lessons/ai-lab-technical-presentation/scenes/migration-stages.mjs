import { routingDiagram, addTitle, work, caption } from '../parts.mjs';
import { seq } from 'vizmatic/stage';

export default function migrationStages(s, c) {
  addTitle(s, c);
  const [map, foot] = work.rows([4, 1]);
  const net = routingDiagram(map),
    [old, candidate] = net.lanes;
  const fixture = caption(old.names[0], 'Labeled fixture', 'dim'),
    copy = caption(candidate.names[0], 'Same fixture', 'dim');
  const score = caption(old.names[2], 'Evaluate'),
    pair = caption(candidate.names[2], 'Evaluate');
  const user = caption(old.names[2], 'User', 'blue'),
    compare = caption(candidate.names[2], 'Compare only', 'cyan');
  const live = caption(old.names[0], 'Live request', 'blue'),
    shadow = caption(candidate.names[0], 'Read-only copy', 'cyan');
  const small = caption(candidate.names[0], 'Canary share', 'cyan'),
    served = caption(candidate.names[2], 'Candidate response → user', 'cyan', 36);
  const before = [net.packet(0), net.packet(1)],
    during = [net.packet(0), net.packet(1)],
    after = net.packet(1);
  const message = caption(foot, 'Replay    ·    compare with known labels', 'dim'),
    bounded = caption(foot, 'Shadow    ·    bounded load, old response', 'cyan');
  const side = caption(foot, 'Shadow can consume quota and leave audit records.', 'yellow');
  const gate = caption(
    foot,
    'Canary    ·    promotion needs a window, limits and an owner.',
    'yellow',
  );
  s.add(net.nodes, fixture, copy, score, pair, message);
  c.show('replay', before);
  c.on('outcomes', () => s.play(...before.map((t, i) => net.travel(t, i, 1))));
  c.on('offline', () => s.play(...before.map((t, i) => net.travel(t, i, 2))));
  c.swap(
    'shadow',
    [fixture, copy, score, pair, message, ...before],
    [live, shadow, user, compare, bounded, ...during],
  );
  c.on('serves', () => s.play(seq(net.travel(during[0], 0, 1), net.travel(during[0], 0, 2))));
  c.on('compare', () => s.play(seq(net.travel(during[1], 1, 1), net.travel(during[1], 1, 2))));
  c.swap('side', bounded, side);
  c.swap('canary', [shadow, compare, during[1], side], [small, after]);
  c.show('canary', served, { after: true });
  c.after('canary', () => s.play(seq(net.travel(after, 1, 1), net.travel(after, 1, 2))));
  c.show('owner', gate);
}
