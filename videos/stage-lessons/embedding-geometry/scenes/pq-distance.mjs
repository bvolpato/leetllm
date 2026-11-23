import { assertEqual, column, dot, dynamic, group, line, place, table } from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';
import { PQ_PAIRS, PQ_QUERY } from '../../../films/embedding-geometry/fixtures.mjs';
import { pqTables } from '../../../films/embedding-geometry/model.mjs';

export default function pqDistance(s, c) {
  const [body, foot] = area.rows([7, 1], 'normal');
  const [pages, sums] = body.columns([3, 2], 'loose');
  const values = pqTables();
  const book = place(
    table(
      [
        { key: 'pair', label: 'Pair' },
        { key: 'q', label: 'Query' },
        { key: 'center', label: 'Center 1' },
        { key: 'zero', label: 'ID 0', sample: '30.28' },
        { key: 'one', label: 'ID 1', sample: '0.02' },
      ],
      PQ_QUERY.map((q, i) => ({
        id: String(i),
        pair: String(i + 1),
        q: q.join(', '),
        center: PQ_PAIRS[i].join(', '),
        zero: null,
        one: null,
      })),
      { width: pages.width, size: 34 },
    ),
    pages,
  );
  const [head, ids, terms, result] = sums.rows([1, 1, 2, 1], 'normal');
  const zeroInfo = place(note('Center 0 is [0, 0] in every pair.'), foot);
  const worked = place(
    column(
      [
        label('Pair 1 to center 1'),
        mono('(1.1 − 1.2)²', { size: 40, color: 'cyan' }),
        mono('+ (3.3 − 3.4)²', { size: 40, color: 'cyan' }),
      ],
      { gap: 'normal' },
    ),
    sums,
  );
  const evaluate = (code) => code.reduce((n, id, i) => n + values[i][id], 0);
  const codes = [
    [1, 1, 1, 1],
    [1, 0, 1, 1],
    [0, 0, 0, 0],
  ];
  assertEqual(
    codes.map((code) => evaluate(code).toFixed(2)).join(','),
    '0.08,4.55,56.57',
    'PQ distances',
  );
  const selection = (code) =>
    code.map((id, i) => {
      const cell = book.region(String(i), id ? 'one' : 'zero');
      const start = cell.point('bottom left'),
        end = cell.point('bottom right');
      return line([start[0] + 6, start[1] - 2], [end[0] - 6, end[1] - 2], {
        stroke: 'yellow',
        width: 5,
      });
    });
  const codeNodes = codes.map((code) =>
    place(mono('[' + code.join('  ') + ']', { size: 52, color: 'blue' }), ids),
  );
  const markers = codes.map(selection);
  const expressions = codes.map((code) =>
    place(
      column(
        [
          mono(
            code
              .slice(0, 2)
              .map((id, i) => values[i][id].toFixed(2))
              .join(' + '),
            { size: 43 },
          ),
          mono(
            '+ ' +
              code
                .slice(2)
                .map((id, j) => values[j + 2][id].toFixed(2))
                .join(' + '),
            { size: 43 },
          ),
        ],
        { gap: 'tight' },
      ),
      terms,
    ),
  );
  const totals = codes.map((code) =>
    place(
      mono('gap² = ' + evaluate(code).toFixed(2), {
        size: 46,
        color: 'yellow',
      }),
      result,
    ),
  );
  const question = place(
    label('From [1 1 1 1]     ·     Which term changes?', { color: 'yellow' }),
    foot,
  );
  const substitution = place(
    mono('Pair 2    ' + values[1][1].toFixed(2) + ' → ' + values[1][0].toFixed(2), {
      color: 'yellow',
      size: 42,
    }),
    foot,
  );
  const stored = place(label('Stored IDs', { color: 'blue' }), head);
  const title = heading(c.title);
  s.add(title, book, worked, zeroInfo);
  c.after('first', () =>
    s.play(book.setCell('0', 'one', { value: values[0][1].toFixed(2) }), { duration: 0.35 }),
  );
  c.on('fill', () =>
    s.play(
      ...values.flatMap((v, i) => [
        book.setCell(String(i), 'zero', { value: v[0].toFixed(2) }),
        ...(i ? [book.setCell(String(i), 'one', { value: v[1].toFixed(2) })] : []),
      ]),
      { duration: 0.6 },
    ),
  );
  c.swap('read', worked, [stored, codeNodes[0], ...markers[0], expressions[0]]);
  c.show('near', totals[0], { after: true });
  c.swap(
    'change',
    [codeNodes[0], totals[0], expressions[0], ...markers[0], zeroInfo],
    [codeNodes[1], question],
  );
  c.swap('second', question, substitution, { after: true });
  c.show('second', [expressions[1], ...markers[1]], { after: true });
  c.show('mixed', totals[1], { after: true });
  c.swap(
    'allzero',
    [codeNodes[1], ...markers[1], expressions[1], totals[1], substitution],
    [codeNodes[2], ...markers[2], expressions[2], zeroInfo],
  );
  c.show('far', totals[2], { after: true });
  const tableBytes = 96 * 256 * 4;
  c.swap(
    'size',
    zeroInfo,
    place(mono('96 × 256 × 4 B = ' + tableBytes / 1024 + ' KiB per query', { size: 40 }), foot),
    { after: true },
  );
  const oneD = area.inset('loose');
  const [numberArea, answerArea] = oneD.rows([2.8, 2.2], 'wide');
  const x = (v) => numberArea.left + numberArea.width * (0.12 + v * 0.36);
  const railY = numberArea.cy;
  const q = 1.4,
    original = [1.4, 2],
    centers = [0, 2];
  const closest = (v) => centers.reduce((a, b) => (Math.abs(a - v) < Math.abs(b - v) ? a : b));
  const encoded = original.map(closest),
    encodedQ = closest(q);
  const d2 = (a, b) => (a - b) ** 2;
  const stages = [
    original.map((v) => d2(q, v)),
    encoded.map((v) => d2(q, v)),
    encoded.map((v) => d2(encodedQ, v)),
  ];
  assertEqual(
    stages.map((v) => v.map((n) => n.toFixed(2)).join('/')).join(','),
    '0.00/0.36,0.36/0.36,0.00/0.00',
    'one-dimensional distances',
  );
  const docsMix = s.value(0),
    queryMix = s.value(0);
  const markers1d = dynamic(() => {
    const queryX = x(q + queryMix.value * (encodedQ - q));
    return group(
      ...original.flatMap((v, i) => {
        const px = x(v + docsMix.value * (encoded[i] - v)),
          py = railY + (i ? 126 : 52);
        return [
          dot(11, ['green', 'pink'][i]).moveTo([px, py]),
          label(['A', 'B'][i], { color: ['green', 'pink'][i], size: 35 }).moveTo([px + 40, py]),
        ];
      }),
      dot(12, 'cyan').moveTo([queryX, railY - 66]),
      label('q', { color: 'cyan', size: 35 }).moveTo([queryX + 40, railY - 66]),
    );
  });
  const numberLine = [
    line([x(0), railY], [x(2), railY], { stroke: 'dim', width: 4 }),
    ...[0, q, 2].flatMap((v) => [
      line([x(v), railY - 12], [x(v), railY + 12], { stroke: 'dim', width: 4 }),
      mono(String(v), { size: 35 }).moveTo([x(v), railY - 135]),
    ]),
    markers1d,
  ];
  const compare = place(
    table(
      ['coordinates', 'A gap²', 'B gap²'],
      ['originals', 'ADC', 'SDC'].map((name) => ({
        id: name,
        coordinates: name,
        'A gap²': null,
        'B gap²': null,
      })),
      { size: 36, width: answerArea.width * 0.72 },
    ),
    answerArea,
  );
  const fill = (i) =>
    s.play(
      ...['A gap²', 'B gap²'].map((key, j) =>
        compare.setCell(['originals', 'ADC', 'SDC'][i], key, { value: stages[i][j].toFixed(2) }),
      ),
      { duration: 0.45 },
    );
  c.swapAll('line', [...numberLine, compare], { keep: [title] });
  c.after('exact', () => fill(0));
  c.on('docs', () => s.play(docsMix.to(1, { duration: 1.3 })));
  c.after('adc', () => fill(1));
  c.on('query', () => s.play(queryMix.to(1, { duration: 1.3 })));
  c.after('sdc', () => fill(2));
}
