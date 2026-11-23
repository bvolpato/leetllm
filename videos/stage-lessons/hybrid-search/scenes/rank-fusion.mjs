import { assertEqual } from 'vizmatic/stage';
import { rankSheet } from '../rank-sheet.mjs';

export default function fusion(s, c) {
  const b = rankSheet(c.title, {
    lanes: [
      ['Key', 'Session'],
      ['Key', 'Session'],
    ],
    ids: ['Key', 'Session'],
  });
  assertEqual(
    b.result.map((r) => r.score.toFixed(5)).join(' '),
    '0.03279 0.03226',
    'shared wording',
  );
  const query = b.top('“stale service-account key rotation within 14 days”');
  const rule = b.bottom('One contribution per passage per list     ·     1 / (60 + rank)');
  s.add(b.shell, query);
  c.show('rrf-rule', rule);
  c.on('lexical-slips', () => s.play(b.cast(0)));
  c.on('dense-slips', () => s.play(b.cast(1)));
  c.show('totals', [b.scores, b.order], { after: true });
}
