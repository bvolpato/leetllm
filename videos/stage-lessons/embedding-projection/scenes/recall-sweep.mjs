import { assertEqual, column, place, rect } from 'vizmatic/stage';
import { heading, label, mono, note } from '../../kit-narrated.mjs';
import { BODY, FOOT, TOP } from '../parts.mjs';

// The seeded article sweep uses twenty queries with three judged chunks each.
const judged = [3, 4, 5];
const quiet = { noise: 0.11, returned: [3, 5, 4], hits: 58 };
const noisy = { noise: 0.2, returned: [3, 2, 35], hits: 47 };
const total = 20 * judged.length;
const selected = [
  { dim: 2, variance: 0.294, hits: 23 },
  { dim: 4, variance: 0.495, hits: 52 },
  { dim: 6, variance: 0.629, hits: quiet.hits },
  { dim: 8, variance: 0.727, hits: 60 },
  { dim: 12, variance: 0.871, hits: 60 },
];

export default function recallSweep(s, c) {
  const title = heading(c.title);
  const intro = place(label('60 documents with 6 coordinates each'), TOP);
  const [firstTitle, strip, value] = BODY.rows(3, 'normal');
  const w = strip.width * 0.78,
    left = strip.cx - w / 2;
  const first = [
    place(label('Keep two principal components'), firstTitle),
    rect(w, 60, { fill: 'surface', stroke: 'dim' }).moveTo(strip.point('center')),
  ];
  const energy = [
    rect(w * 0.992, 56, { fill: 'blue' }).moveTo([left + (w * 0.992) / 2, strip.cy]),
    place(mono('99.2% of the variance', { color: 'blue', size: 52 }), value),
  ];
  const sweepTitle = place(
    label('20 new queries × 3 judged chunks = 60 retrieval opportunities', { size: 41 }),
    TOP,
  );
  const bands = BODY.rows([1, 1, 1, 1], 'normal');
  const cells = bands.map((b) => b.columns([2.0, 1, 1, 1, 1, 1], 'normal'));
  const heads = ['PCA dimensions', 'Variance kept', 'Judged hits', 'Recall@3'].map((word, i) =>
    place(label(word, { size: 36 }), cells[i][0], 'left'),
  );
  const dims = selected.map((v, i) => place(mono(String(v.dim), { size: 45 }), cells[0][i + 1]));
  const spreads = selected.map((v, i) =>
    place(mono((v.variance * 100).toFixed(1) + '%', { size: 38, color: 'blue' }), cells[1][i + 1]),
  );
  const hits = selected.map((v, i) =>
    place(mono(v.hits + ' / ' + total, { size: 37 }), cells[2][i + 1]),
  );
  const recalls = selected.map((v, i) =>
    place(mono((v.hits / total).toFixed(3), { size: 39, color: 'cyan' }), cells[3][i + 1]),
  );
  const gate = place(
    label('Which is the shortest tested index with Recall@3 ≥ 0.95?', {
      color: 'yellow',
      size: 38,
    }),
    FOOT,
  );
  const winner = selected.find((v) => v.hits / total >= 0.95);
  assertEqual(winner.dim, 6, 'smallest passing tested dimension');
  const chosen = place(
    label('6 dimensions recover 58 of the 60 judged chunks.', { color: 'cyan', size: 39 }),
    FOOT,
  );
  const outline = rect(cells[0][3].width + 12, BODY.height, {
    fill: null,
    stroke: 'cyan',
    width: 3,
  }).moveTo([cells[0][3].cx, BODY.cy]);
  const probe = place(
    label('Same six dimensions, same queries, noisier documents', { size: 43 }),
    TOP,
  );
  const [ref, firstRun, secondRun] = BODY.rows([1, 1.5, 1.5], 'normal');
  const labels = place(label('Query #1 needs chunks 3, 4 and 5.', { size: 41 }), ref);
  const run = (region, sample) => {
    const [noise, slots, summary] = region.columns([1.5, 3, 2], 'wide');
    const names = place(
      column([note('Document noise σ'), mono(sample.noise.toFixed(2), { size: 46 })], {
        gap: 'tight',
      }),
      noise,
    );
    const boxes = slots.columns(3, 'normal');
    const sockets = boxes.map((b) =>
      rect(b.width * 0.9, 84, { fill: 'surface', stroke: 'dim' }).moveTo(b.point('center')),
    );
    const returned = sample.returned.map((id, i) =>
      place(
        mono(String(id), { size: 46, color: judged.includes(id) ? 'green' : 'pink' }),
        boxes[i],
      ),
    );
    const matched = sample.returned.filter((id) => judged.includes(id)).length;
    const count = place(
      column(
        [
          mono(matched + ' / 3 for query #1', { size: 33 }),
          mono(sample.hits + ' / ' + total + ' overall', { size: 33, color: 'cyan' }),
        ],
        { gap: 'tight' },
      ),
      summary,
    );
    return { names, sockets, returned, count };
  };
  const before = run(firstRun, quiet),
    after = run(secondRun, noisy);
  const change = place(note('Slots show the three returned chunk IDs in rank order.'), FOOT);
  const missed = place(
    label('Chunks 4 and 5 dropped out. Across all queries, recall fell to 47/60.', {
      size: 35,
      color: 'yellow',
    }),
    FOOT,
  );
  s.add(title, intro, first);
  c.show('sweep-first', energy, { after: true });
  c.swap('sweep-new', [intro, first, energy], [sweepTitle, heads, dims]);
  c.show('sweep-spread', spreads);
  c.show('sweep-hits', [hits, recalls]);
  c.show('sweep-floor', gate);
  c.swap('sweep-six', gate, chosen, { after: true });
  c.show('sweep-six', outline, { after: true });
  c.swap(
    'sweep-query',
    [sweepTitle, heads, dims, hits, spreads, recalls, outline, chosen],
    [probe, labels, before.names, before.sockets, before.returned, before.count, change],
  );
  c.show('sweep-noise', [after.names, after.sockets]);
  c.show('sweep-ids', after.returned, { after: true });
  c.show('sweep-count', after.count, { after: true });
  c.swap('sweep-count', change, missed, { after: true });
}
