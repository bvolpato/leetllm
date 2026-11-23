import {
  C,
  body,
  change,
  chapterModel,
  foot,
  measure,
  note,
  place,
  readout,
  start,
} from '../parts.mjs';
export default function roofline(s, c) {
  start(s, 'How much attention work does one cache read buy?');
  const model = chapterModel(c.id);
  const [left, right] = body.columns([1, 1], 'loose');
  const [a, b, d, e] = left.rows([1, 2, 2, 2], 'normal');
  s.add(place(note('One layer · one decode step · one read per K/V entry'), a, 'left'));
  readout(s, c, b, [
    [null, 'QKᵀ'],
    ['qk', 'QKᵀ work     2 B Hq T d', C.query, true],
    ['both', 'Combined work     4 B Hq T d', C.query, true],
  ]);
  readout(s, c, d, [
    ['av', 'AV work     2 B Hq T d', C.query],
    ['read', 'K/V bytes     2 B Hkv T d b', C.key, true],
  ]);
  readout(s, c, e, [['cancel', 'FLOPs / byte = (2 / b) × Hq / Hkv', C.result, true]], { size: 36 });
  const [axis, ...rows] = right.rows([1, 2, 2, 2, 2], 'tight');
  s.add(place(note('64 query heads · FLOPs per byte'), axis, 'left'));
  const settings = [
    ['MHA', 'mha', 1],
    ['GQA · 8 KV heads', 'gqa', model.intensity],
    ['MQA', 'mqa', 64],
    ['H100 SXM dense ridge', 'ridge', model.ridge],
  ];
  rows.forEach((row, i) => {
    const [name, cue, n] = settings[i],
      [label, track] = row.rows(2, 'tight');
    const readings = [
      [null, name],
      [cue, name + '     ' + Number(n.toFixed(1)), C.result, true],
    ];
    const bar = measure(s, track, { max: 300, height: 28 });
    change(s, c, cue, bar, n, true);
    if (cue === 'mqa') {
      readings.push([
        'profile',
        name + '     ' + n + ' → ' + n / 2 + ' with two reads',
        C.result,
        true,
      ]);
      change(s, c, 'profile', bar, n / 2, true);
    }
    readout(s, c, label, readings, { size: 34 });
  });
  readout(
    s,
    c,
    foot,
    [
      ['ideal', 'Each group reuses one read of its distinct keys and values.'],
      ['sparse', '1,979 sparse TFLOP/s ÷ 2 = 989.5 dense TFLOP/s'],
      ['ridge', '989.5 TFLOP/s ÷ 3.35 TB/s ≈ ' + model.ridge.toFixed(1) + ' FLOPs/byte'],
      ['profile', 'Two reads of every key and value double the cache traffic.', 'ink', true],
    ],
    { align: 'center', size: 35 },
  );
}
