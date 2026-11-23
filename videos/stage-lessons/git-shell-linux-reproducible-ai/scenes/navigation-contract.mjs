import { arrow, boxOf, column, dot, draw, indicate, place, row, to } from 'vizmatic/stage';
import { chip, label, mono, namedBox, note, tint } from '../../kit-narrated.mjs';
import { repositoryContext } from '../parts.mjs';

export default function navigation(s, c) {
  const { main } = repositoryContext(s, c);
  const [lookup, argumentBand, guardBand] = main.rows([4, 2, 2], 'wide');
  const [rootBand, directoryBand, fileBand] = lookup.rows([1, 1, 1], 'normal');
  const root = place(namedBox('access-rag/', { width: 360, height: 90, color: 'blue' }), rootBand);
  const dirs = directoryBand.columns(2, 'loose');
  const evalDir = place(namedBox('eval/', { width: 350, height: 90, color: 'cyan' }), dirs[0]);
  const scripts = place(namedBox('scripts/', { width: 350, height: 90, color: 'blue' }), dirs[1]);
  const endpoints = fileBand.columns(2, 'loose');
  const correct = place(mono('access_requests.jsonl', { size: 34, color: 'cyan' }), endpoints[0]);
  const wrong = place(mono('scripts/eval/…', { size: 34, color: 'red' }), endpoints[1]);
  const branches = [evalDir, scripts].map((node) =>
    arrow(boxOf(root).point('bottom'), boxOf(node).point('top'), { stroke: 'dim', pad: 12 }),
  );
  const cursor = dot(13, 'yellow').moveTo(boxOf(root).point('left'));
  const base = place(mono('pwd → /work/access-rag', { size: 34 }), argumentBand.rows(2, 'normal')[0]);
  const moved = place(
    mono('pwd → /work/access-rag/scripts', { size: 34 }),
    argumentBand.rows(2, 'normal')[0],
  );
  const argument = place(
    row([mono('"$input"', { color: 'blue' }), chip('one path with spaces', { color: 'cyan' })], {
      gap: 'wide',
    }),
    argumentBand.rows(2, 'normal')[1],
  );
  const [guard, operations] = guardBand.rows(2, 'normal');
  const gate = place(
    row(
      [mono('cd "$project" || exit 1', { size: 34 }), chip('launch', { color: 'dim', dash: true })],
      { gap: 'wide' },
    ),
    guard,
  );
  const chain = place(
    row(
      ['init', 'add', 'commit', 'clone'].map((word) =>
        chip(word, { color: word === 'commit' ? 'green' : 'dim' }),
      ),
      { gap: 'wide' },
    ),
    operations,
  );
  s.add(root, evalDir, scripts, branches, cursor, correct, base, chain);
  c.on('relative-base', () =>
    s.play(to(cursor, (node) => node.moveTo(boxOf(scripts).point('left')), { duration: 1.1 })),
  );
  c.swap('relative-base', base, moved);
  c.show('path-miss', wrong, { after: true });
  c.on('path-miss', () => s.play(to(correct, (n) => n.color('dim'))));
  c.show('quoted-argument', argument);
  c.show('guarded-directory', gate);
  c.on('git-operation-chain', () => s.play(indicate(chain, { scale: 1, color: 'yellow' })));
  c.clear(branches, 0.46, 0.2);
}
