import { C, HEADS, measure, note, place, readout, right, start, wall } from '../parts.mjs';
export default function architectures(s, c) {
  start(s, 'Eight readers, three ways to store their history');
  const cache = wall(s, c);
  const [name, unit, scale, ratio, desc] = right.rows([2, 1, 1, 2, 2], 'normal');
  const used = measure(s, scale, {
    max: HEADS.queries,
    initial: HEADS.gqaKV,
    color: C.key,
    height: 46,
  });
  s.add(place(note('Stored K/V heads at fixed length and width'), unit, 'left'));
  readout(
    s,
    c,
    name,
    [
      [null, 'Stored histories'],
      ['mha', 'Multi-head attention'],
      ['gqa', 'Grouped-query attention'],
      ['mqa', 'Multi-query attention'],
      ['four', 'Grouped-query attention'],
      ['eight', 'Multi-query attention'],
      ['learned', 'Grouped-query attention'],
    ],
    { size: 48 },
  );
  readout(
    s,
    c,
    ratio,
    [
      ['mha', HEADS.mhaKV + ' histories', 'ink', true],
      ['gqa', HEADS.gqaKV + ' histories', 'ink', true],
      ['mqa', HEADS.mqaKV + ' history', 'ink', true],
      ['four', '¼ of the MHA payload', C.result, true],
      ['eight', '⅛ of the MHA payload', C.result, true],
      ['learned', 'Several learned K/V subspaces', C.result],
    ],
    { size: 38 },
  );
  for (const [cue, mode, heads] of [
    ['mha', 0, HEADS.mhaKV],
    ['gqa', 1, HEADS.gqaKV],
    ['mqa', 2, HEADS.mqaKV],
    ['four', 1, HEADS.gqaKV],
    ['eight', 2, HEADS.mqaKV],
    ['learned', 1, HEADS.gqaKV],
  ]) {
    c.after(cue, () => s.play(cache.mode.to(mode), used.to(heads), { duration: 0.46 }));
  }
}
