import { assertEqual } from 'vizmatic/stage';
import { rankSheet } from '../rank-sheet.mjs';

export default function trap(s, c) {
  const b = rankSheet(c.title, {
    lanes: [
      ['Key', 'Session'],
      ['Audit', 'Session'],
    ],
    ids: ['Key', 'Session', 'Audit'],
  });
  assertEqual(b.result.map((row) => row.id).join('/'), 'Session/Audit/Key', 'ID tie-break');
  const legend = b.top(
    'Supplied complete lists    ·    k = 60    ·    ties go by ascending passage ID',
  );
  const question = b.bottom('Which two passages reach the reranker?');
  const two = b.edge(s, 2);
  const coverage = (n) => (b.result.slice(0, n).some((row) => row.id === 'Key') ? 1 : 0);
  const lost = b.bottom('Required passages sent to reranker     ' + coverage(2) + ' / 1');
  const saved = b.bottom('Required passages sent to reranker     ' + coverage(3) + ' / 1');
  s.add(b.shell, legend);
  c.on('trap-lexical', () => s.play(b.cast(0)));
  c.on('trap-dense', () => s.play(b.cast(1)));
  c.show('pair-question', question);
  c.show('session-leads', [b.scores, b.order[0]], { after: true });
  c.show('id-tie', [b.order.slice(1), two.mark], { after: true });
  c.swap('cut-two', question, lost, { after: true });
  c.after('retain-three', () => s.play(two.move(3)));
  c.swap('retain-three', lost, saved, { after: true, lead: -0.65 });
}
