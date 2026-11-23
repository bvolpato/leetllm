import { captions, fork, frame, pct, record, ring, signal, vertex, wire } from '../parts.mjs';
import { rates } from '../../../films/causality/fixtures.mjs';

export default function backdoorSet(s, c) {
  frame(
    s,
    'Which paths enter assignment?',
    'Measured and unmeasured causes',
    'Adjustment within risk',
  );
  const g = fork(),
    tier = vertex('Customer tier', 'below', 'dim', { dash: true });
  const ta = wire(tier, g.a, 'red'),
    ty = wire(tier, g.y, 'red'),
    held = ring(g.risk);
  const [weights, assistant, control] = record(s, [
    ['Target shares', 'Easy: w   Difficult: 1−w'],
    ['Assistant rate', 'Within each stratum', 'cyan'],
    ['Control rate', 'Within each stratum', 'pink'],
  ]);
  c.take([g.a, g.y]);
  c.keep([g.a, g.y]);
  s.add(g.risk, g.ra, g.ry, g.ay);
  signal(s, c, 'enters', [g.ra, g.ry]);
  c.show('block', held);
  assistant(c, 'average', pct(rates.assistant[0]) + ' w + ' + pct(rates.assistant[1]) + ' (1−w)');
  control(c, 'average', pct(rates.control[0]) + ' w + ' + pct(rates.control[1]) + ' (1−w)');
  c.show('hidden', [tier, ta, ty]);
  signal(s, c, 'open', [ta, ty]);
  captions(s, c, 'Follow every backdoor path into the assigned workflow.', [
    [
      'block',
      'A sufficient adjustment set blocks every backdoor path and contains no treatment descendant.',
    ],
    ['average', 'Both workflows use the same target shares.'],
    ['hidden', 'Conditioning on risk leaves the hidden tier path open.'],
  ]);
}
