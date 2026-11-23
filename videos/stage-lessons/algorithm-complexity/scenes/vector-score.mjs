import { assertEqual, column, dynamic, place, rect } from 'vizmatic/stage';
import { heading, label, mono, note } from '../../kit-narrated.mjs';
import { PICTURE, FOOT, DOCS, NAMES, QUERY, SCORE_TRACE } from '../parts.mjs';
import { noteId } from '../note-board.mjs';

export default function vector(s, c) {
  const [source, ledger] = PICTURE.columns([1, 1.1], 'loose');
  const [query, ...rows] = source.rows([1.2, 1, 1, 1, 1], 'normal');
  const header = place(
    column([note('Question vector'), mono('[' + QUERY.join(', ') + ']', { color: 'cyan' })], {
      gap: 'tight',
    }),
    query,
    'left',
  );
  const [head, panel] = ledger.rows([1, 6], 'normal');
  const slots = panel.rows(8, 'tight').map((r) => r.columns(6, 'tight'));
  const progress = s.value(0),
    n = s.value(DOCS.length),
    d = s.value(QUERY.length);
  const examined = () => Math.floor(progress.value + 1e-7);
  assertEqual(SCORE_TRACE.length, DOCS.length * QUERY.length, 'dense loop visits every coordinate');
  const inputs = rows.flatMap((r, i) => {
    const [name, values] = r.columns([1.2, 1], 'normal');
    return [
      place(label(noteId(i) + '  ' + NAMES[i], { size: 36 }), name, 'left'),
      place(
        mono('[' + DOCS[i].vector.join(', ') + ']', { size: 34, color: 'blue' }),
        values,
        'right',
      ),
    ];
  });
  const labelCells = place(label('One cell per multiply', { size: 38 }), head);
  const grid = dynamic(() =>
    slots.flatMap((r, i) =>
      r.flatMap((cell, j) => {
        if (i >= Math.round(n.value) || j >= Math.round(d.value)) return [];
        const original = i < DOCS.length && j < QUERY.length;
        const event = original ? SCORE_TRACE[i * QUERY.length + j] : null;
        const done = original && i * QUERY.length + j < examined();
        return [
          rect(cell.width, cell.height, {
            fill: original ? 'surface' : 'pink',
            stroke: done ? 'yellow' : 'dim',
            width: 2,
            opacity: original ? 1 : 0.65,
          }).moveTo(cell.point('center')),
          ...(done
            ? [place(mono(String(event.product), { color: 'yellow', size: 34 }), cell)]
            : []),
        ];
      }),
    ),
  );
  const bill = dynamic(() => {
    const event = SCORE_TRACE[examined() - 1];
    if (!event) return [place(label('How much work is there in the zeros?'), FOOT)];
    return [
      place(
        mono(
          noteId(event.row) +
            '   ' +
            QUERY[event.column] +
            ' × ' +
            DOCS[event.row].vector[event.column] +
            ' = ' +
            event.product +
            '     sum ' +
            event.sum.toFixed(1) +
            '     multiplies ' +
            examined(),
          { size: 38, color: 'yellow' },
        ),
        FOOT,
      ),
    ];
  });
  const estimated = dynamic(() => [
    place(
      mono(
        Math.round(n.value) +
          ' rows × ' +
          Math.round(d.value) +
          ' coordinates = ' +
          Math.round(n.value) * Math.round(d.value) +
          ' products',
        { color: 'yellow' },
      ),
      FOOT,
    ),
  ]);
  const nLabel = place(label('n counts the rows'), head);
  const dLabel = place(label('d counts coordinates across a row'), head);
  const scale = place(note('Additional cells show work at the new shape'), head);
  s.add(heading(c.title), header, inputs, labelCells, grid, bill);
  c.on('vector-first', () => s.play(progress.to(1), { duration: 0.5 }));
  c.on('vector-zero', () => s.play(progress.to(QUERY.length), { duration: 2 }));
  c.on('vector-rest', () => s.play(progress.to(SCORE_TRACE.length), { duration: 3.5 }));
  c.swap('vector-twelve', bill, estimated, { after: true });
  c.swap('vector-n', labelCells, nLabel);
  c.swap('vector-d', nLabel, dLabel);
  c.swap('vector-size', dLabel, scale);
  c.on('vector-size', () => s.play(n.to(2 * DOCS.length), { duration: 1.4 }));
  c.on('vector-both', () => s.play(d.to(2 * QUERY.length), { duration: 1.6 }));
}
