import {
  C,
  block,
  body,
  cacheBytes,
  change,
  chapterModel,
  foot,
  measure,
  note,
  place,
  readout,
  start,
  stripCells,
} from '../parts.mjs';
export default function largeBudget(s, c) {
  start(s, 'How many complete requests fit in ten GiB?');
  const [amount, slots] = body.columns(2, 'loose'),
    model = chapterModel(c.id);
  const [axis, ...tracks] = amount.rows([1, 2, 2, 2], 'normal');
  const retained = [32 * 1024, 128 * 1024, 1024 * 1024],
    heads = [64, 8, 1];
  const longPayload = retained.map((tokens) =>
    heads.map((kvHeads) =>
      cacheBytes({ layers: 80, batch: 1, tokens, kvHeads, width: 128, bytes: 2 }),
    ),
  );
  const lengthCues = ['32ki', '128ki', '1mi'].map((n) => 'context-' + n);
  const names = ['MHA', 'GQA-8', 'MQA'],
    cues = ['mha', 'gqa', 'mqa'],
    budget = 10 * 2 ** 30;
  const contextLabels = retained.map((t, j) => [
    lengthCues[j],
    'One request · ' + t.toLocaleString('en-US') + ' positions',
    'ink',
    true,
  ]);
  readout(s, c, axis, [[null, 'Raw K/V · 32 × 4,096 positions'], ...contextLabels], { size: 31 });
  tracks.forEach((r, i) => {
    const [a, b] = r.rows(2, 'tight'),
      gb = model.large[i] / 1e9;
    const labelAt = (bytes) =>
      bytes >= 1e12
        ? (bytes / 1e12).toFixed(2) + ' TB'
        : Number((bytes / 1e9).toFixed(bytes >= 8e10 ? 1 : 2)) + ' GB';
    readout(
      s,
      c,
      a,
      [
        [null, names[i]],
        [cues[i], names[i] + '     ' + gb.toFixed(i === 0 ? 1 : 2) + ' GB', C.result, true],
        ...longPayload.map((data, j) => [
          lengthCues[j],
          names[i] + '     ' + labelAt(data[i]),
          C.result,
          true,
        ]),
      ],
      { size: 38 },
    );
    const gauge = measure(s, b, { max: 1, height: 32 });
    change(s, c, cues[i], gauge, model.large[i] / model.large[0], true);
    change(s, c, 'long', gauge, model.large[i] / longPayload[2][0]);
    longPayload.forEach((data, j) =>
      change(s, c, lengthCues[j], gauge, data[i] / longPayload[2][0], true),
    );
  });
  const [name, space, reading] = slots.rows([1, 5, 2], 'normal');
  s.add(place(note('10 GiB for 4,096-position requests'), name, 'left'));
  const rows = space.rows(8, 'tight');
  const lattice = rows.flatMap((r) => stripCells(r, 8, { color: 'grid', height: 0.85 }));
  s.add(lattice);
  const caps = model.large.map((raw) => Math.floor(budget / (raw / 32)));
  const units = [
    [block(space.width, space.height, ...space.point('center'), C.key)],
    rows.flatMap((r) => stripCells(r, 1, { color: C.key, height: 0.85 })),
    rows.flatMap((r) => stripCells(r, 8, { color: C.key, height: 0.85 })),
  ];
  c.show('one-request', units[0], { after: true });
  c.swap('gqa-request', units[0], units[1], { after: true });
  c.swap('mqa-request', units[1], units[2], { after: true });
  readout(
    s,
    c,
    reading,
    [
      [null, '10 GiB'],
      ['one-request', '10 GiB / request', 'ink', true],
      ['gqa-request', '1.25 GiB / request', 'ink', true],
      ['mqa-request', '0.15625 GiB / request', 'ink', true],
      [
        'capacity',
        'MHA ' + caps[0] + '   ·   GQA ' + caps[1] + '   ·   MQA ' + caps[2] + ' requests',
        C.result,
        true,
      ],
    ],
    { size: 42 },
  );
  readout(
    s,
    c,
    foot,
    [
      ['dimensions', '80 layers  ·  64 queries  ·  width 128  ·  2 bytes per number'],
      ['weight', '72 billion parameters × 2 bytes = 144 GB of weights', 'ink', true],
      ['long', 'Long-context scale · each complete track spans the MHA cache at 1 Mi positions.'],
      ['rank', 'A capacity estimate also needs a supported head layout.'],
    ],
    { size: 34, align: 'center' },
  );
}
