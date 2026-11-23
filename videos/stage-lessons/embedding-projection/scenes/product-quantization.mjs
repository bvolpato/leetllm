import {
  assertEqual,
  boxOf,
  column,
  dot,
  dynamic,
  fade,
  group,
  indicate,
  line,
  place,
  rect,
  to,
} from 'vizmatic/stage';
import { label, mono, note } from '../../kit-narrated.mjs';
import { begin, BODY, FOOT, taskHeader } from '../parts.mjs';
export default function productQuantization(s, c) {
  const header = taskHeader(),
    blocks = 8,
    width = 16,
    centroids = 256,
    replaced = s.value(0),
    selected = s.value(0);
  const input = Array.from({ length: blocks }, (_, b) => (b === 0 ? 0.101 : 0.1 + b * 0.1));
  const ids = input.map(
    (v) =>
      Array.from({ length: centroids }, (_, id) => ({
        id,
        d: width * (v - id / (centroids - 1)) ** 2,
      })).sort((a, b) => a.d - b.d)[0].id,
  );
  assertEqual(blocks * width * 4, 512, 'PQ raw bytes');
  assertEqual(512 / blocks, 64, 'PQ byte reduction');
  const [stripRegion, mechanism] = BODY.rows([2, 6], 'wide');
  const blockCols = stripRegion.columns(blocks, 'normal');
  const frames = blockCols.map((r) =>
    rect(r.width, 72, { stroke: 'dim' }).moveTo(r.point('center')),
  );
  const names = blockCols.map((r, i) => note('B' + i).moveTo([r.cx, r.top + 12]));
  const floats = blockCols.map((r) =>
    Array.from({ length: width }, (_, j) =>
      rect((r.width / width) * 0.7, 44, { fill: 'ink', stroke: 'ink' }).moveTo([
        r.left + ((j + 0.5) * r.width) / width,
        r.cy,
      ]),
    ),
  );
  const codes = ids.map((id, i) =>
    place(mono(String(id), { size: 40, color: 'yellow' }), blockCols[i]),
  );
  const storage = dynamic(() =>
    mono(Math.round(512 - ((512 - blocks) * replaced.value) / blocks) + ' B stored / vector', {
      size: 40,
      color: 'yellow',
    }).moveTo([stripRegion.cx, stripRegion.cy + 92]),
  );
  const [bookRegion, detailRegion] = mechanism.columns([2, 3], 'loose');
  const [bookCaption, bookGrid, bookFoot] = bookRegion.rows([1, 5, 1], 'normal');
  const square = Math.min(bookGrid.width, bookGrid.height) * 0.85,
    cell = square / 16;
  const point = (id) => [
    bookGrid.cx - square / 2 + ((id % 16) + 0.5) * cell,
    bookGrid.cy - square / 2 + (Math.floor(id / 16) + 0.5) * cell,
  ];
  const book = Array.from({ length: centroids }, (_, i) => dot(4, 'dim').moveTo(point(i)));
  const bookTitle = place(note('B0 shared codebook • 256 centroids'), bookCaption);
  const bookNote = place(note('8 codebooks remain separate from stored codes'), bookFoot);
  const chosen = dot(12, 'yellow').moveTo(point(ids[0]));
  const detail = place(
    column(
      [
        label('B0: 16 floats, each 0.101'),
        note('Centroid j: 16 copies of j / 255'),
        note('Compare squared distances to centroids'),
        ...[-1, 0, 1].map((delta) => {
          const id = ids[0] + delta,
            d = width * (input[0] - id / 255) ** 2;
          return mono('ID ' + id + ': ' + d.toFixed(6), {
            size: 36,
            color: delta === 0 ? 'yellow' : 'dim',
          });
        }),
      ],
      { gap: 'normal' },
    ),
    detailRegion,
  );
  const shared = place(
    label('Shared codebooks: K × d floats, plus index storage', { size: 36, color: 'yellow' }),
    FOOT,
  );
  const [tableRegion, sumRegion] = mechanism.columns([3, 2], 'loose');
  const rows = tableRegion.rows(9, 'none'),
    cells = rows.map((r) => r.columns([1, 1, 1, 2], 'normal'));
  const tableHeads = ['block', 'stored ID', 'q value', 'squared distance'].map((v, j) =>
    place(note(v), cells[0][j]),
  );
  const query = input.map((v, i) => 0.15 + i * 0.08);
  const distances = query.map((v, i) => width * (v - ids[i] / 255) ** 2);
  const labels = ids.map((id, i) => place(mono('B' + i, { size: 34 }), cells[i + 1][0]));
  const targets = ids.map((id, i) =>
    place(mono(String(id), { size: 34, color: 'yellow' }), cells[i + 1][1]),
  );
  const queryValues = query.map((v, i) => place(mono(v.toFixed(2), { size: 34 }), cells[i + 1][2]));
  const tableValues = distances.map((v, i) =>
    place(mono(v.toFixed(5), { size: 34, color: 'dim' }), cells[i + 1][3]),
  );
  const sumCaption = place(
    column(
      [
        label('ADC query lookup'),
        note('16 equal query floats per block'),
        note('256 distances per block'),
        note('Stored ID → selected entry'),
      ],
      { gap: 'normal' },
    ),
    sumRegion,
    'top',
  );
  const accumulator = dynamic(() => {
    const n = Math.min(blocks, Math.floor(selected.value));
    return group(
      mono(n + ' / 8 selected', { size: 40 }).moveTo([sumRegion.cx, sumRegion.cy + 60]),
      mono(
        'Σ = ' +
          distances
            .slice(0, n)
            .reduce((a, b) => a + b, 0)
            .toFixed(5),
        { size: 52, color: 'yellow' },
      ).moveTo([sumRegion.cx, sumRegion.cy + 150]),
    );
  });
  const flights = ids.map((id, i) => dot(11, 'yellow').moveTo(blockCols[i].point('center')));
  const cache = place(
    label('96 × 256 × 4 B = 96 KiB of tables per query', { size: 36, color: 'yellow' }),
    FOOT,
  );
  const small = place(
    label('Separate 40-row toy: 16 B → 2 code B; 64 B shared codebook', {
      size: 36,
      color: 'yellow',
    }),
    FOOT,
  );
  begin(
    s,
    c,
    'product-quantization',
    'A block becomes the ID of its nearest centroid',
    [frames, names, floats.flat(), storage, book, bookTitle, bookNote, detail],
    header,
  );
  c.show('pq-books', chosen);
  c.on('pq-replace', () => {
    for (let i = 0; i < blocks; i++) {
      s.at(c.cue('pq-replace').start + i * 0.25, () =>
        s.play(...floats[i].map((n) => fade(n, 0, { duration: 0.14 }))),
      );
      s.at(c.cue('pq-replace').start + i * 0.25 + 0.17, () =>
        s.play(fade(codes[i], 1, { duration: 0.12 }), replaced.to(i + 1, { duration: 0.12 })),
      );
    }
  });
  c.on('pq-ids', () => s.play(indicate(codes[0], { scale: 1, color: 'yellow' })));
  c.on('pq-storage', () => s.play(indicate(storage, { scale: 1, color: 'yellow' })));
  c.show('pq-shared', shared);
  c.swap(
    'pq-tables',
    [...book, bookTitle, bookNote, chosen, detail],
    [...tableHeads, ...labels, ...tableValues, ...queryValues, sumCaption, accumulator],
    { fade: 0.15 },
  );
  c.on('pq-lookup', () => {
    for (let i = 0; i < blocks; i++) {
      const start = c.cue('pq-lookup').start + i * 0.45,
        y = stripRegion.cy + 47,
        gap = cells[0][1].left,
        target = cells[i + 1][1].point('center');
      s.at(start, () =>
        s.play(
          fade(codes[i], 0, { duration: 0.04 }),
          fade(flights[i], 1, { duration: 0.04 }),
          to(flights[i], (n) => n.moveTo([blockCols[i].cx, y]), { duration: 0.07 }),
        ),
      );
      s.at(start + 0.08, () =>
        s.play(to(flights[i], (n) => n.moveTo([gap, y]), { duration: 0.07 })),
      );
      s.at(start + 0.16, () =>
        s.play(to(flights[i], (n) => n.moveTo([gap, target[1]]), { duration: 0.07 })),
      );
      s.at(start + 0.24, () => s.play(to(flights[i], (n) => n.moveTo(target), { duration: 0.07 })));
    }
    for (let i = 0; i < blocks; i++)
      s.at(c.cue('pq-lookup').start + i * 0.45 + 0.32, () =>
        s.play(
          fade(flights[i], 0, { duration: 0.1 }),
          fade(targets[i], 1, { duration: 0.12 }),
          selected.to(i + 1, { duration: 0.12 }),
          indicate(tableValues[i], { scale: 1, color: 'yellow', duration: 0.3 }),
        ),
      );
  });
  c.swap('pq-table-bytes', shared, cache, { after: true });
  c.on('pq-query-code', () => s.play(indicate(sumCaption, { scale: 1, color: 'yellow' })));
  c.swap('pq-small', cache, small, { after: true });
  c.on('pq-metric', () => s.play(indicate(accumulator, { scale: 1, color: 'yellow' })));
}
