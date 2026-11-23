import { arrayCells, assertEqual, boxOf, fade, line, place, table } from 'vizmatic/stage';
import { area, heading, label, note } from '../../kit-narrated.mjs';
import { PREFIX_DOCS } from '../../../films/embedding-geometry/fixtures.mjs';
import { prefixResults } from '../../../films/embedding-geometry/model.mjs';

export default function prefix(s, c) {
  const [body, foot] = area.rows([7, 1], 'wide');
  const [rowsArea, scores] = body.columns([1, 1], 'loose');
  const lanes = rowsArea.rows(4, 'normal');
  const names = ['Audit', 'Rotation', 'Lifecycle'];
  const cells = PREFIX_DOCS.map((v, i) => {
    const [name, vector] = lanes[i + 1].columns([2, 3], 'wide');
    return [
      place(label(names[i], { color: ['blue', 'green', 'pink'][i], size: 38 }), name, 'right'),
      place(arrayCells(v, { cell: 82, size: 38, indices: false }), vector, 'left'),
    ];
  });
  const [head, top, bottom] = scores.rows([1, 4, 1], 'wide');
  const result = place(
    table(
      ['Query', { key: 'Full width', sample: 'Lifecycle' }, { key: 'Prefix', sample: 'Lifecycle' }],
      names.slice(1).map((name) => ({ id: name, Query: name, 'Full width': null, Prefix: null })),
      { size: 36, width: top.width },
    ),
    top,
  );
  const full = prefixResults(4),
    short = prefixResults(2);
  assertEqual(full.winners.join(','), '1,2', 'full winners');
  assertEqual(short.winners.join(','), '0,2', 'prefix winners under storage order');
  const boxes = cells.map((r) => r[1]);
  const third = boxOf(boxes[0].cell(2)),
    second = boxOf(boxes[0].cell(1));
  const x = (third.left + second.right) / 2;
  const cut = line([x, boxOf(boxes[0]).top - 20], [x, boxOf(boxes[2]).bottom + 20], {
    stroke: 'yellow',
    width: 5,
  });
  const rule = place(note('Ties go to the first stored row.'), head);
  const ask = place(
    label('Rotation query [1, 0]     ·     Which guide wins?', { color: 'yellow' }),
    foot,
  );
  const totals = place(label('Correct guides    2 / 2  →  1 / 2', { size: 40 }), bottom);
  s.add(
    heading(c.title),
    cells,
    result,
    place(note('Eligible rows in storage order'), lanes[0]),
    rule,
  );
  c.after('full', () =>
    s.play(
      ...full.winners.map((id, i) =>
        result.setCell(names[i + 1], 'Full width', { value: names[id] }),
      ),
      { duration: 0.55 },
    ),
  );
  c.show('cut', cut);
  c.on('cut', () =>
    s.play(...boxes.flatMap((b) => [fade(b.cell(2), 0.15), fade(b.cell(3), 0.15)]), {
      duration: 1,
    }),
  );
  c.show('ask', ask);
  c.after('tie', () =>
    s.play(result.setCell('Rotation', 'Prefix', { value: names[short.winners[0]] }), {
      duration: 0.45,
    }),
  );
  c.after('life', () =>
    s.play(result.setCell('Lifecycle', 'Prefix', { value: names[short.winners[1]] }), {
      duration: 0.45,
    }),
  );
  c.hide('tie', ask);
  c.show('hits', totals, { after: true });
}
