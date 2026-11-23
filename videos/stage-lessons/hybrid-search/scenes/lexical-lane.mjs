import { column, place, tokens } from 'vizmatic/stage';
import { label, mono, note } from '../../kit-narrated.mjs';
import { frame, postingIndex } from '../parts.mjs';

export default function lexical(s, c) {
  const f = frame(c);
  const [left, right] = f.body.columns([1, 1.15], 'loose');
  const [query, output] = left.rows([1, 1], 'normal');
  const code = place(
    column([note('Query after analysis'), tokens(['krot-14'], { size: 48 })], { gap: 'normal' }),
    query,
  );
  const words = place(
    column(
      [
        note('Four query terms'),
        mono('refresh  expired', { size: 42, color: 'cyan' }),
        mono('machine  credential', { size: 42, color: 'cyan' }),
      ],
      { gap: 'tight' },
    ),
    query,
  );
  const postings = postingIndex(right);
  const hit = place(label('Returned passage    Key', { color: 'green' }), output);
  const miss = place(label('Returned passages    0', { color: 'yellow' }), output);
  s.add(f.title, f.shelf.nodes, code, postings);
  c.on('posting-list', () => s.play(postings.light('code')));
  c.show('code-return', hit, { after: true });
  c.swap('query-change', [code, hit], words);
  c.on('query-change', () => s.play(postings.light(null)));
  c.show('empty-return', miss, { after: true });
}
