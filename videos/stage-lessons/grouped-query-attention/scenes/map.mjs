import { tokens } from 'vizmatic/stage';
import { C, HEADS, change, mono, note, place, readout, right, start, wall } from '../parts.mjs';
import { groupSize } from '../../../films/grouped-query-attention/model.mjs';
export default function map(s, c) {
  start(s, 'Which history does each query read?');
  const cache = wall(s, c),
    size = groupSize(HEADS.queries, HEADS.gqaKV);
  change(s, c, 'divide', cache.cursor, -1, false, 0.16);
  const [title, readers, rule, out] = right.rows([1, 3, 2, 2], 'normal');
  const strip = place(
    tokens(
      Array.from({ length: HEADS.queries }, (_, i) => String(i)),
      { size: 34 },
    ),
    readers,
  );
  s.add(
    place(note('Query index'), title, 'left'),
    strip,
    place(mono('group = ⌊index / G⌋', { size: 38 }), rule, 'left'),
  );
  readout(
    s,
    c,
    out,
    [
      [null, 'G = query heads / KV heads'],
      ['divide', 'G = ' + HEADS.queries + ' / ' + HEADS.gqaKV + ' = ' + size, C.result, true],
      ['first', 'Q0 … Q3   →   KV0', C.query, true],
      ['second', 'Q4 … Q7   →   KV1', C.query, true],
      ['pick', 'Q5 → which history?', C.result, true],
      ['owner', '⌊5 / 4⌋ = 1   →   KV1', C.result, true],
      ['out', 'Q5 weights → Q5 output', C.query],
    ],
    { size: 39 },
  );
  c.on('first', () =>
    s.play(strip.span('lower', 0, 3, { label: 'KV0', color: C.key }), cache.lit.to(3)),
  );
  c.on('second', () =>
    s.play(strip.span('upper', 4, 7, { label: 'KV1', color: C.key }), cache.lit.to(7)),
  );
  change(s, c, 'pick', cache.lit, 5);
}
