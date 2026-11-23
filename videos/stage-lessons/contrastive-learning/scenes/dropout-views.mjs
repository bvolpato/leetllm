import { arrayCells, column, heatmap, indicate, place, row } from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';

export default function dropoutViews(s, c) {
  const [top, body, foot] = area.rows([1, 4, 3], 'normal');
  const sentence = place(label('A dog is running', { color: 'cyan' }), top);
  const regions = body.columns(2, 'loose');
  const base = [
    [1, 1, 1, 1],
    [1, 1, 1, 1],
  ];
  const grids = regions.map((r, i) =>
    place(
      heatmap(base, {
        size: 40,
        cell: 100,
        values: true,
        domain: [0, 1],
        colors: ['surface', i ? 'green' : 'cyan'],
        rowLabels: ['hidden', 'hidden'],
      }),
      r,
    ),
  );
  const historical = place(
    row([mono('76.3'), mono('81.6'), note('historical BERT-base STS · Spearman × 100')], {
      gap: 'wide',
    }),
    foot,
  );
  const tokens = place(arrayCells(['must', 'not', 'rotate'], { cell: 220, size: 40 }), foot);
  s.add(heading(c.title), sentence, grids, historical.nodes[2]);
  c.on('cl-dropout-views-masks', () =>
    s.play(grids[0].setValue({ row: 0, col: 1 }, 0), grids[1].setValue({ row: 1, col: 2 }, 0)),
  );
  c.on('cl-dropout-views-off', () =>
    s.play(...grids.map((g) => g.setValue({}, base, { duration: 1 }))),
  );
  c.show('cl-dropout-views-historical', historical.nodes.slice(0, 2), { after: true });
  c.swap('cl-dropout-views-not', historical, tokens);
  c.on('cl-dropout-views-not', () => s.play(tokens.mark(1, 'red', { duration: 0.7 })), 0.5);
}
