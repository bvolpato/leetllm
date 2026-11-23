import { assertEqual, column, dynamic, place, rect } from 'vizmatic/stage';
import { heading, label, mono, note } from '../../kit-narrated.mjs';
import { cosine, fmt, plane, RIGHT, rotateEmbedding, vec } from '../parts.mjs';

export default function spaceContract(s, c) {
  const queryA = [1, 0];
  const docsA = [
    [1, 0],
    [0, -1],
  ];
  const quarter = Math.PI / 2;
  const docsB = docsA.map((v) => rotateEmbedding(v, quarter));
  const queryB = rotateEmbedding(queryA, quarter);
  const score = (q, docs) => docs.map((d) => fmt(cosine(q, d)));
  const trials = [score(queryA, docsA), score(queryA, docsB), score(queryB, docsB)];
  assertEqual(
    trials,
    [
      ['1', '0'],
      ['0', '1'],
      ['1', '0'],
    ],
    'invoice and phone cosine scores',
  );
  const p = plane(s, {
    range: [-1.32, 1.32],
    title: 'Invoice query',
    xName: 'coordinate 1',
    yName: 'coordinate 2',
  });
  const qa = s.value(0),
    da = s.value(0);
  const q = () => rotateEmbedding(queryA, qa.value);
  const doc = (i) => rotateEmbedding(docsA[i], da.value);
  const [live, head, ...rows] = RIGHT.rows([2.4, 0.85, 1, 1, 1, 1.45], 'tight');
  const colors = ['blue', 'cyan', 'green'];
  const coords = dynamic(
    () =>
      place(
        column(
          [
            mono('Query    ' + vec(q()), { size: 38, color: colors[0] }),
            mono('Invoice  ' + vec(doc(0)), { size: 38, color: colors[1] }),
            mono('Phone    ' + vec(doc(1)), { size: 38, color: colors[2] }),
          ],
          { gap: 'tight' },
        ),
        live,
        'left',
      ).nodes,
  );
  const cells = (r) => r.columns([1.6, 1, 1], 'normal');
  const tableHead = ['Query / index', 'Invoice', 'Phone'].map((h, i) =>
    place(note(h), cells(head)[i]),
  );
  const results = trials.map((numbers, i) =>
    [['A / A', 'A / B', 'B / B'][i], ...numbers].map((v, j) =>
      place(mono(v, { color: j && v === '1' ? 'yellow' : 'ink', size: 40 }), cells(rows[i])[j]),
    ),
  );
  const footer = rows[3];
  const rule = place(mono('B(x, y) = [−y, x]', { size: 40 }), footer);
  const question = place(
    label('Old query, new index. Which guide?', { size: 38, color: 'yellow' }),
    footer,
  );
  const advice = place(label('Deploy a verified query / index pair', { size: 38 }), footer);
  c.take(p.frame);
  const queryTip = dynamic(() => rect(44, 44, { stroke: 'blue', width: 4 }).moveTo(p.point(q())));
  s.add(
    heading(c.title),
    p.nodes,
    p.vector(q, 'blue'),
    p.vector(() => doc(0), 'cyan'),
    p.vector(() => doc(1), 'green'),
    queryTip,
    coords,
    tableHead,
    rule,
  );
  c.show('baseline', results[0]);
  c.on('docs', () => s.play(da.to(quarter, { duration: 1.5 })));
  c.swap('ask', rule, question);
  c.show('mixed', results[1]);
  c.hide('mixed', question);
  c.on('repair', () => s.play(qa.to(quarter, { duration: 1.5 })));
  c.show('aligned', results[2]);
  c.show('pair', advice);
  c.keep(p.frame);
}
