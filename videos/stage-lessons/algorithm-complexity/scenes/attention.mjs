import { assertEqual, column, dynamic, place, rect } from 'vizmatic/stage';
import { heading, label, mono, note } from '../../kit-narrated.mjs';
import { PICTURE, FOOT, comparisonGrid, decodeCostTrace } from '../parts.mjs';

export default function attention(s, c) {
  const [left, right] = PICTURE.columns(2, 'wide');
  const n = s.value(4),
    filled = s.value(0),
    mode = s.value(1);
  const grid = comparisonGrid(s, left, { n, filled, mode, labelFor: (i) => String(i + 1) });
  const count = dynamic(
    () =>
      place(
        column(
          [
            label('One head · prompt prefill'),
            note('Queries run down. Keys run across.'),
            mono(n.value + ' query positions × ' + n.value + ' keys', { size: 36 }),
            mono(
              mode.value === 1
                ? Math.floor(filled.value) + ' cells'
                : (n.value * (n.value + 1)) / 2 + ' permitted pairs',
              { color: 'yellow' },
            ),
          ],
          { gap: 'wide' },
        ),
        right,
      ).nodes,
  );
  const title = heading(c.title);
  const footer = (str) => place(label(str, { size: 38 }), FOOT);
  const square = footer('Double both edges of the square');
  const causal = footer('One head   ·   Θ(t² dₖ) query-key work in dense prefill');
  s.add(title, grid.picture, count);
  c.on('attention-four', () => s.play(filled.to(16), { duration: 1.6 }));
  c.on('attention-eight', () => {
    n.set(8);
    s.play(filled.to(64), { duration: 2.6 });
  });
  c.show('attention-square', square, { after: true });
  c.after('attention-causal', () => mode.set(2));
  c.swap('attention-causal', square, causal, { after: true });

  const trace = decodeCostTrace();
  const oldKeys = trace.initialKeys,
    steps = trace.rows.length;
  const oldReads = oldKeys * steps,
    newReads = (steps * (steps + 1)) / 2;
  assertEqual(oldReads + newReads, trace.keyReads, 'rectangle plus staircase counts every read');
  const [cacheArea, readArea, totals] = PICTURE.rows([2, 3.2, 1.2], 'wide');
  const countSlots = oldKeys + steps + 1;
  const cacheRows = cacheArea.rows(2, 'tight').map((r) => r.columns(countSlots, 'tight'));
  const readRows = readArea.rows(steps, 'normal').map((r) => r.columns(countSlots, 'tight'));
  const keys = s.value(oldKeys),
    reads = s.value(0),
    focus = s.value(0);
  const cache = dynamic(() =>
    cacheRows.flatMap((r, i) => [
      place(mono(i ? 'V' : 'K', { color: 'blue' }), r[0]),
      ...r
        .slice(1)
        .flatMap((cell, k) =>
          k < keys.value
            ? [
                rect(cell.width, cell.height * 0.82, {
                  fill: 'surface',
                  stroke: k < oldKeys ? 'blue' : 'green',
                  width: 3,
                }).moveTo(cell.point('center')),
                place(
                  mono(String(k + 1), { color: k < oldKeys ? 'blue' : 'green', size: 34 }),
                  cell,
                ),
              ]
            : [],
        ),
    ]),
  );
  const rows = dynamic(() =>
    readRows.flatMap((r, i) => {
      if (keys.value < oldKeys + i + 1) return [];
      const before = trace.rows.slice(0, i).reduce((sum, row) => sum + row.keysRead, 0);
      return [
        place(mono('q' + (oldKeys + i + 1), { size: 36 }), r[0]),
        ...r.slice(1, trace.rows[i].keysRead + 1).map((cell, k) => {
          const done = reads.value >= before + k + 1;
          return rect(cell.width, cell.height * 0.72, {
            fill: done ? (k < oldKeys ? 'blue' : 'green') : 'surface',
            stroke: done ? null : 'dim',
            width: 2,
            opacity: focus.value && focus.value !== (k < oldKeys ? 1 : 2) ? 0.32 : 1,
          }).moveTo(cell.point('center'));
        }),
      ];
    }),
  );
  const [oldTotal, addedTotal] = totals.columns([2, 1], 'wide');
  const fixed = place(
    mono(steps + ' × ' + oldKeys + ' old keys = ' + oldReads, { color: 'blue' }),
    oldTotal,
  );
  const staircase = place(mono('1 + 2 + 3 = ' + newReads, { color: 'green' }), addedTotal);
  const one = footer('One query at current length t   ·   Θ(t dₖ) products per head');
  const scope = footer('Count just the query-key dot products in one head');
  const otherWork = footer('Projections, value mixing and feed-forward work are separate.');
  const third = footer('The third query can read eleven keys, including its own.');
  const total = footer(trace.keyReads + ' reads × head width = ' + trace.keyReads + ' dₖ products');
  const formula = footer('G inputs after T cached keys   ·   [G T + G(G + 1)/2] dₖ');
  const ask = footer('How many keys will the third input read?');
  const stored = place(note('Blue stays in all three rows. Green grows by one.'), totals);
  const drawRow = (i, duration) => {
    keys.set(oldKeys + i + 1);
    s.play(reads.to(trace.rows.slice(0, i + 1).reduce((sum, r) => sum + r.keysRead, 0)), {
      duration,
    });
  };
  c.swapAll('attention-start', [cache, rows, scope], { keep: [title] });
  c.on('attention-append', () => drawRow(0, 2));
  c.swap('attention-decode', scope, one);
  c.swap('attention-scope', one, otherWork);
  c.on('attention-rows', () => drawRow(1, 2));
  c.swap('attention-rows', otherWork, ask, { after: true });
  c.on('attention-cache', () => drawRow(2, 2));
  c.swap('attention-cache', ask, third, { after: true });
  c.show('attention-cache', stored, { after: true });
  c.on('attention-old', () => focus.set(1));
  c.on('attention-stairs', () => focus.set(2));
  c.on('attention-sum', () => focus.set(0));
  c.swap('attention-old', stored, fixed);
  c.show('attention-stairs', staircase);
  c.swap('attention-sum', third, total, { after: true });
  c.swap('attention-general', total, formula);
}
