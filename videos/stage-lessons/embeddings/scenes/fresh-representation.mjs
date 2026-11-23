import { dotProduct } from 'vizmatic';
import { assertEqual, boxOf, column, dot, dynamic, line, place, rect, row } from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';
import { tickets } from '../charge.mjs';
import { fmt, rotateEmbedding, vec } from '../parts.mjs';

export default function freshRepresentation(s, c) {
  const vectorsA = [
    [1, 1],
    [-1, 1],
  ];
  const rotated = (v) => [v[1], -v[0]];
  const docsB = vectorsA.map(rotated);
  const scores = (q, docs) => docs.map((v) => dotProduct(q, v));
  const before = vectorsA.map((q) => scores(q, vectorsA));
  const mixed = vectorsA.map((q) => scores(q, docsB));
  const aligned = vectorsA.map((q) => scores(rotated(q), docsB));
  assertEqual(
    before,
    [
      [2, 0],
      [0, 2],
    ],
    'whole-ticket controls',
  );
  assertEqual(
    mixed,
    [
      [0, 2],
      [-2, 0],
    ],
    'new index with old queries',
  );
  assertEqual(aligned, before, 'coordinated migration');
  const [left, right] = area.columns([0.95, 1.45], 'loose');
  const [key, map, legend] = left.rows([1.1, 5, 1], 'normal');
  const [head, first, second, foot] = right.rows([1.1, 2.2, 2.2, 1.35], 'normal');
  const queryAngle = s.value(0),
    indexAngle = s.value(0);
  const query = (i) => rotateEmbedding(vectorsA[i], queryAngle.value);
  const doc = (i) => rotateEmbedding(vectorsA[i], indexAngle.value);
  const point = ([x, y]) => {
    const scale = Math.min(map.height, map.width) / 3.15;
    return [map.cx + scale * x, map.cy - scale * y];
  };
  const axis = [
    line(point([-1.55, 0]), point([1.55, 0]), { stroke: 'dim', width: 2 }),
    line(point([0, -1.55]), point([0, 1.55]), { stroke: 'dim', width: 2 }),
  ];
  const marks = tickets.map((ticket, i) =>
    dynamic(() => [
      line(point([0, 0]), point(doc(i)), { stroke: ticket.color, width: 4 }),
      dot(13, ticket.color).moveTo(point(doc(i))),
      rect(46, 46, { stroke: ticket.color, width: 4 }).moveTo(point(query(i))),
    ]),
  );
  const headerCells = head.columns([1, 1], 'wide');
  const docNames = tickets.map((t, i) =>
    dynamic(
      () =>
        place(
          column([label(t.guide, { size: 42, color: t.color }), mono(vec(doc(i)), { size: 38 })], {
            gap: 'tight',
          }),
          headerCells[i],
        ).nodes,
    ),
  );
  const stateTag = (text) => place(label(text, { size: 38 }), key);
  const roles = ['Query A  /  Index A', 'Query A  /  Index B', 'Query B  /  Index B'].map(stateTag);
  const rows = tickets.map((t, i) => {
    const lane = [first, second][i];
    const [name, values] = lane.rows([1.2, 1], 'normal');
    const cells = values.columns(2, 'wide');
    return {
      title: dynamic(() =>
        place(
          label('“' + t.excerpt + '”   ' + vec(query(i)), { color: t.color, size: 43 }),
          name,
          'left',
        ),
      ),
      rule: line(lane.point('bottom left'), lane.point('bottom right'), {
        stroke: 'grid',
        width: 2,
      }),
      cover: cells.map((v) => place(mono('?', { size: 51, color: 'dim' }), v)),
      results: (pair) =>
        pair.map((n, j) =>
          place(
            mono(fmt(n), { size: 64, color: n === Math.max(...pair) ? 'yellow' : 'dim' }),
            cells[j],
          ),
        ),
    };
  });
  const covers = rows.map((r) => r.cover);
  const outcomes = [before, mixed, aligned].map((trial) => rows.map((r, i) => r.results(trial[i])));
  const newIndex = place(note('Clockwise turn   [x, y] → [y, −x]'), foot);
  const ask = place(
    column(
      [
        label('Which ticket gets the wrong guide?', { size: 44, color: 'yellow' }),
        mono('Score = q₁d₁ + q₂d₂', { size: 34 }),
      ],
      { gap: 'normal' },
    ),
    foot,
  );
  const failed = place(label('Both tickets get the phone guide.', { size: 40 }), foot);
  const invoiceCalculation = docsB.map((d, i) => {
    const products = d.map((value, j) => vectorsA[0][j] * value);
    const second = products[1] < 0 ? ' − ' : ' + ';
    return place(
      mono(tickets[i].guide + '   ' + products[0] + second + Math.abs(products[1]), { size: 40 }),
      foot,
    );
  });
  const release = place(
    column(
      [
        label('Invoice → invoice     Phone → phone', { size: 41 }),
        note('Test the paired encoders on held-out tickets before rollout.'),
      ],
      { gap: 'normal' },
    ),
    foot,
  );
  const diagnoses = place(
    column(
      [
        label('First search   ·   One charge row for both tickets', { size: 36 }),
        label('Index change   ·   Old queries, new guides', { size: 36 }),
      ],
      { gap: 'normal' },
    ),
    foot,
  );
  s.add(
    heading(c.title),
    roles[0],
    axis,
    marks,
    place(note('□  Ticket query      ●  Indexed guide'), legend),
    docNames,
    rows.map((r) => [r.title, r.rule]),
  );
  c.show('control', outcomes[0].flat());
  c.swap('replace', [roles[0], outcomes[0].flat()], [roles[1], covers.flat(), newIndex]);
  c.on('replace', () => s.play(indexAngle.to(-Math.PI / 2, { duration: 1.5 })));
  c.swap('predict', newIndex, ask);
  c.swap('subtract', ask, invoiceCalculation[0]);
  c.swap('invoice-zero', covers[0][0], outcomes[1][0][0], { after: true });
  c.swap('add', invoiceCalculation[0], invoiceCalculation[1]);
  c.swap('invoice-two', covers[0][1], outcomes[1][0][1], { after: true });
  c.hide('phone', invoiceCalculation[1]);
  c.swap('phone', covers[1], outcomes[1][1], { after: true });
  c.show('verdict', failed, { after: true });
  c.swap('pair', [roles[1], outcomes[1].flat(), failed], [roles[2], covers.flat()]);
  c.on('pair', () => s.play(queryAngle.to(-Math.PI / 2, { duration: 1.5 })));
  c.swap('rescore', covers.flat(), outcomes[2].flat());
  c.show('rollout', release);
  c.swap('diagnosis', release, diagnoses.nodes[0]);
  c.show('pairing', diagnoses.nodes[1]);

  const [textArea, scoreArea] = area.inset('loose').rows([1, 0.75], 'normal');
  const prefix = label('charge the', { size: 105 });
  const covered = rect(330, 145, { fill: 'surface', stroke: 'green', width: 4, radius: 10 });
  const message = place(row([prefix, covered], { gap: 'normal' }), textArea, 'bottom');
  const word = place(label('phone', { size: 105, color: 'green' }), boxOf(covered));
  const score = place(mono('P(phone | charge the)', { size: 60 }), scoreArea);
  c.swapAll('prefix', [heading('What probability did the next token get?'), message]);
  c.swap('next-word', covered, word, { lead: 0 });
  c.show('next-word', score, { lead: 0 });
}
