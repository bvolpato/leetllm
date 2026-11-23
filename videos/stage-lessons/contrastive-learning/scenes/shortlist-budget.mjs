import { assertEqual, boxOf, line, place, row, segmentedBar, shift } from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';

export default function shortlistBudget(s, c) {
  const documents = [
    { name: 'KMS rotation', bi: 0.84, cross: 0.21, color: 'pink' },
    { name: 'API rotation', bi: 0.81, cross: 0.96, color: 'green' },
    { name: 'Token replacement', bi: 0.78, cross: 0.91, color: 'green' },
    { name: 'GPU notes', bi: 0.1, cross: 0.05, color: 'dim' },
  ];
  const ordered = documents.toSorted((a, b) => b.bi - a.bi);
  const returned = (k) =>
    ordered
      .slice(0, k)
      .sort((a, b) => b.cross - a.cross)
      .slice(0, 2);
  const [question, table, foot] = area.rows([1, 5, 1.4], 'normal');
  const query = place(label('How do I rotate an API key?', { color: 'cyan' }), question);
  const [left, right] = table.columns(2, 'wide');
  const list = (region, title, docs, score) => {
    const lines = region.rows([1, 1, 1, 1, 1], 'normal');
    return [
      place(note(title, { size: 36 }), lines[0], 'left'),
      ...docs.map((doc, i) =>
        place(
          row(
            [
              mono(String(i + 1), { size: 36, color: 'dim' }),
              label(doc.name, { size: 42, color: doc.color }),
              mono(doc[score].toFixed(2), { size: 38 }),
            ],
            { gap: 'normal' },
          ),
          lines[i + 1],
          'left',
        ),
      ),
    ];
  };
  const corpus = list(left, 'First stage · bi-encoder score', ordered, 'bi');
  const boundaryY = (k) => (boxOf(corpus[k]).bottom + boxOf(corpus[k + 1]).top) / 2;
  const boundary = line([left.left, boundaryY(3)], [left.right, boundaryY(3)], {
    stroke: 'yellow',
    width: 4,
    dash: [9, 8],
  });
  const shortlist = (k) => list(right, 'Returned · joint score · up to 2', returned(k), 'cross');
  const three = shortlist(3),
    one = shortlist(1);
  const cut = (k) =>
    place(
      label(
        k === 1
          ? 'Reranker receives only the first passage'
          : 'Reranker receives the first ' + k + ' passages',
        { color: 'yellow', size: 38 },
      ),
      foot,
    );
  const cutThree = cut(3),
    cutOne = cut(1);
  const deadline = 200,
    queryMs = 10,
    perPair = 15,
    count = 10;
  const pairMs = count * perPair,
    remaining = deadline - queryMs - pairMs;
  const [scale, timing, reading] = table.rows([1, 3, 1], 'normal');
  const large = place(
    mono('2,000,000 × 15 ms = ' + ((2_000_000 * perPair) / 3_600_000).toFixed(2) + ' hours', {
      size: 48,
    }),
    scale,
  );
  const bar = place(
    segmentedBar([{ name: 'encode query', value: queryMs, color: 'cyan' }], {
      capacity: deadline,
      width: timing.width - 80,
      height: 84,
      title: 'Sequential deadline · 200 ms',
      readout: false,
      format: (v) => Math.round(v) + ' ms',
      size: 38,
    }),
    timing,
  );
  const reserve = place(
    label(remaining + ' ms available for lookup and overhead', { color: 'yellow' }),
    reading,
  );
  const hold = place(
    note('At an affordable cutoff, measure how often the required passages are present.', {
      size: 34,
    }),
    foot,
  );
  assertEqual(
    returned(3)
      .map((d) => d.name)
      .join(', '),
    'API rotation, Token replacement',
    'three admitted passages',
  );
  assertEqual(returned(1)[0].name, 'KMS rotation', 'one admitted passage');
  assertEqual(remaining, 40, 'time remaining for lookup and overhead');
  s.add(heading(c.title), query, corpus, cutThree, boundary);
  c.show('budget-rerank', three[0]);
  c.show('budget-rotation', three[1], { after: true });
  c.show('budget-replacement', three[2], { after: true });
  c.swap('budget-one', cutThree, cutOne);
  c.on('budget-one', () =>
    s.play(shift(boundary, 0, boundaryY(1) - boundaryY(3), { duration: 0.75 })),
  );
  c.hide('budget-one', three.slice(1));
  c.show('budget-kms', one[1], { after: true });
  c.swap('budget-time', [query, corpus, cutOne, boundary, three[0], one[1]], large, {
    after: true,
  });
  c.show('budget-query', bar);
  c.after('budget-pairs', () =>
    s.play(bar.insert({ name: '10 pairs', value: pairMs, color: 'blue' }, { duration: 0.65 })),
  );
  c.show('budget-remaining', reserve, { after: true });
  c.show('budget-recall', hold);
}
