import { assertEqual, boxOf, column, indicate, place, rect, row, to } from 'vizmatic/stage';
import { heading, chip, label, mono, note } from '../../kit-narrated.mjs';
import { plane, TOP, MID, LOW, accumulation, vec } from '../parts.mjs';
import { subwordComposition } from '../../../films/embeddings/arithmetic.mjs';
export default function subwordComponents(s, c) {
  const p = plane(s, {
    range: [-0.15, 2.3],
    title: 'spelling → component rows',
    xName: 'coordinate 1',
    yName: 'coordinate 2',
  });
  const ids = [0, 0, 1],
    rows = [
      [1, 0.5],
      [0, 1],
    ],
    m = subwordComposition(ids, rows);
  assertEqual(m.sum[0], 2, 'repeated first bucket x');
  assertEqual(m.sum[1], 2, 'repeated first bucket y');
  const letters = '<played>'.split('').map((ch) => chip(ch, { width: 66, color: 'blue' }));
  const strip = place(row(letters, { gap: 'tight' }), TOP, 'top left');
  const b = boxOf(letters[0]),
    third = boxOf(letters[2]);
  const window = rect(third.right - b.left + 16, b.height + 16, { stroke: 'yellow', width: 3 })
    .moveTo([(b.left + third.right) / 2, b.point('center')[1]])
    .zIndex(-1);
  const grams = place(
    column(
      [
        label('play:   <pl   pla   lay   ay>', { size: 34, color: 'cyan' }),
        label('played: <pl   pla   lay', { size: 34, color: 'cyan' }),
        label('             aye   yed   ed>', { size: 34, color: 'green' }),
      ],
      { gap: 'normal' },
    ),
    MID,
    'left',
  );
  const buckets = place(
    column(
      [
        label('bucket 0 + bucket 0 + bucket 1', { size: 34 }),
        mono('[1, 0.5] + [1, 0.5] + [0, 1]', { size: 34 }),
        note('unknown word: no whole-word row'),
      ],
      { gap: 'normal' },
    ),
    MID,
    'left',
  );
  const ingredients = rows.map((v) => p.vector(() => v, 'dim'));
  const acc = accumulation(
    s,
    p,
    ids.map((id, i) => ({ values: rows[id], weight: 1, color: i < 2 ? 'cyan' : 'pink' })),
  );
  const total = p.vector(() => acc.state().total.map((v) => v), 'yellow');
  const sum = place(mono(`sum ${vec(m.sum)}`, { color: 'yellow' }), LOW, 'left');
  const avg = place(
    column(
      [
        mono(`average ${vec(m.mean)}`, { color: 'yellow' }),
        note('.vec: rows   /   .bin: subword model'),
      ],
      { gap: 'normal' },
    ),
    LOW,
    'left',
  );
  const ratio = s.value(1),
    average = p.vector(() => m.sum.map((v) => v * ratio.value), 'yellow');
  c.take(p.frame);
  s.add(heading(c.title), p.nodes, strip, window, grams, ingredients);
  c.on('windows', () =>
    s.play(
      to(
        window,
        (n) =>
          n.moveTo([(boxOf(letters[5]).left + boxOf(letters[7]).right) / 2, b.point('center')[1]]),
        { duration: 3 },
      ),
    ),
  );
  c.hide('occurrences', ingredients);
  c.swap('occurrences', grams, buckets);
  c.show('occurrences', acc.drawing);
  c.on('occurrences', () => s.play(acc.progress.to(ids.length, { duration: 2.5 })));
  c.on('oov', () => s.play(indicate(buckets, { scale: 1, color: 'yellow' })));
  c.show('sum', [sum, average], { after: true });
  c.after('average', () => s.play(ratio.to(1 / ids.length, { duration: 1.5 })));
  c.swap('average', sum, avg, { after: true });
  c.on('export', () => s.play(indicate(avg, { scale: 1, color: 'yellow' })));
  c.keep(p.frame);
}
