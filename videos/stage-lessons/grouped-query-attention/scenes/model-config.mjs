import { C, body, change, foot, measure, note, place, readout, start } from '../parts.mjs';
export default function modelConfig(s, c) {
  start(s, 'Read the checkpoint before sizing the cache');
  const [heads, length] = body.columns(2, 'loose'),
    [axis, ...comparisons] = heads.rows([1, 2, 2, 2], 'normal');
  s.add(place(note('Llama 3.1 · query heads'), axis, 'left'));
  const queries = [32, 64, 128],
    kv = 8;
  comparisons.forEach((row, i) => {
    const [name, bar] = row.rows(2, 'tight'),
      family = ['8B', '70B', '405B'][i];
    readout(
      s,
      c,
      name,
      [
        [null, family],
        ['counts', family + '     ' + queries[i] + ' Q     /     ' + kv + ' KV', C.query, true],
        ['ratios', family + '     ' + queries[i] / kv + ' queries per KV head', 'ink', true],
      ],
      { size: 34 },
    );
    change(
      s,
      c,
      'counts',
      measure(s, bar, { max: 128, color: C.query, height: 27 }),
      queries[i],
      true,
    );
  });
  const [head, a, b, result] = length.rows([1, 2, 2, 2], 'normal');
  s.add(place(note('Retained keys per layer · Gemma 2'), head, 'left'));
  for (const [r, n, name] of [
    [a, 4, 'Sliding window'],
    [b, 8, 'Global'],
  ]) {
    const [caption, bar] = r.rows(2, 'tight');
    readout(
      s,
      c,
      caption,
      [
        [null, name],
        ['gemma', name + '     ' + n + 'K', C.result, true],
      ],
      { size: 36 },
    );
    change(s, c, 'gemma', measure(s, bar, { max: 8, color: C.key, height: 30 }), n, true);
  }
  readout(s, c, result, [['mistral', 'Mistral 7B v0.3: no sliding window', 'ink', true]], {
    size: 35,
  });
  readout(
    s,
    c,
    foot,
    [
      ['context', 'Llama 3.1: 128K context     ·     Llama 3 (April 2024): 8K', 'ink', true],
      ['sum', 'Cache bytes depend on the sum of retained positions across layers.'],
      ['learned', 'The weights set the K/V head count.'],
      ['test', 'Move the fact within the prompt. Ask for it at the end.'],
    ],
    { align: 'center', size: 35 },
  );
}
