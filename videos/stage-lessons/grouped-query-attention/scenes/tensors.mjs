import {
  C,
  HEADS,
  block,
  change,
  foot,
  note,
  place,
  point,
  range,
  readout,
  right,
  start,
  wall,
} from '../parts.mjs';

export default function tensors(s, c) {
  start(s, c.title);
  const cache = wall(s, c);
  const [title, grids, shapes, decode] = right.rows([1, 4, 2, 1], 'normal');
  s.add(place(note('Inside one stored head · one layer'), title, 'left'));
  const last = [];
  for (const [i, half] of grids.columns(2, 'normal').entries()) {
    const [label, grid] = half.rows([1, 4], 'tight');
    const color = i === 0 ? C.key : C.value;
    s.add(place(note(i === 0 ? 'Key coordinates' : 'Value coordinates', { color }), label));
    for (const t of range(HEADS.tokens)) {
      for (const d of range(HEADS.width)) {
        const xy = point(grid, (d + 0.5) / HEADS.width, (t + 0.5) / HEADS.tokens);
        const w = (grid.width / HEADS.width) * 0.88;
        const h = (grid.height / HEADS.tokens) * 0.78;
        const cell = block(w, h, ...xy, color, { radius: 5 });
        if (t === HEADS.tokens - 1) {
          s.add(block(w, h, ...xy, 'surface', { stroke: 'faint', width: 2, radius: 5 }));
          last.push(cell);
        } else s.add(cell);
      }
    }
  }
  c.show('append', last);
  change(s, c, 'append', cache.tokens, HEADS.tokens);
  change(s, c, 'mha', cache.mode, 0);
  change(s, c, 'gqa', cache.mode, 1, true);
  change(s, c, 'queries', cache.lit, 7);
  readout(
    s,
    c,
    shapes,
    [
      ['twelve', 'Per head: 12 key + 12 value numbers', 'ink', true],
      ['shape', 'K and V each:   1 × 8 × 3 × 4', C.key, true],
      ['ask', 'K and V each:   1 × ? × 3 × 4', C.result],
      ['gqa', 'K and V each:   1 × 2 × 3 × 4', C.key, true],
    ],
    { size: 41 },
  );
  readout(s, c, decode, [['queries', 'New Q:   1 × 8 × 1 × 4', C.query, true]], { size: 40 });
  readout(
    s,
    c,
    foot,
    [
      ['mha', 'Tensor axes     requests  ×  heads  ×  positions  ×  coordinates'],
      ['payload', 'Cache bytes = (K + V elements per layer) × layers × bytes/element'],
    ],
    { size: 33, align: 'center' },
  );
}
