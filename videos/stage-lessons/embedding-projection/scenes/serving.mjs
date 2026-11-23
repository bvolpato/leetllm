import { arrow, boxOf, column, dot, draw, place, to } from 'vizmatic/stage';
import { label, mono, namedBox, note } from '../../kit-narrated.mjs';
import { begin, BODY, FOOT, taskHeader } from '../parts.mjs';
export default function serving(s, c) {
  const header = taskHeader();
  const [inputs, middle, outputs] = BODY.columns(3, 'loose');
  const inRows = inputs.rows(2, 'loose'),
    outRows = outputs.rows(2, 'loose');
  const docs = place(namedBox('documents', { width: 430, height: 130, color: 'ink' }), inRows[0]);
  const query = place(namedBox('query', { width: 430, height: 130, color: 'cyan' }), inRows[1]);
  const transform = place(
    column(
      [
        label('saved artifact', { color: 'yellow' }),
        mono('mean μ'),
        mono('ordered basis V'),
        note('encoder • normalization'),
      ],
      { gap: 'wide' },
    ),
    middle,
  );
  const search = place(
    namedBox('shared search space', { width: 480, height: 200, color: 'ink' }),
    outputs,
  );
  const wires = [docs, query].map((n) =>
    arrow(boxOf(n).point('right'), boxOf(transform).point('left'), {
      stroke: 'dim',
      width: 4,
      pad: 20,
    }),
  );
  wires.push(
    arrow(boxOf(transform).point('right'), boxOf(search).point('left'), {
      stroke: 'dim',
      width: 4,
      pad: 20,
    }),
  );
  const marks = [
    dot(15, 'ink').moveTo(boxOf(docs).point('right')),
    dot(15, 'cyan').moveTo(boxOf(query).point('right')),
  ];
  const tests = place(
    label('Recall / nDCG     •     complete bytes     •     build     •     latency', {
      size: 36,
      color: 'yellow',
    }),
    FOOT,
  );
  const inspection = place(note('inspection has its own map'), outRows[0]);
  begin(
    s,
    c,
    'serving',
    'One fitted space for both sides',
    [docs, query, transform, search, wires, marks],
    header,
  );
  c.on('serving-fit', () =>
    s.play(to(marks[0], (n) => n.moveTo(boxOf(transform).point('left')), { duration: 1.3 })),
  );
  c.on('serving-save', () =>
    s.play(to(marks[1], (n) => n.moveTo(boxOf(transform).point('left')), { duration: 1.3 })),
  );
  c.on('serving-apply', () =>
    s.play(
      ...marks.map((m, i) =>
        to(m, (n) => n.moveTo(boxOf(search).point(i ? 'bottom' : 'top')), { duration: 2 }),
      ),
    ),
  );
  c.show('serving-beat-2-focus-2', inspection);
  c.on('serving-search-representation', () =>
    s.play(to(search, (n) => n.stroke('yellow'), { duration: 0.4 })),
  );
  c.show('serving-beat-2-focus-1', tests);
  c.on('serving-beat-3-focus-1', () =>
    s.play(to(marks[0], (n) => n.scale(1.4), { duration: 0.4 })),
  );
  c.on('serving-beat-3-focus-2', () =>
    s.play(to(marks[1], (n) => n.scale(1.4), { duration: 0.4 })),
  );
}
