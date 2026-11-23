import { arrow, dot as marker, line, matrixProduct } from 'vizmatic/stage';
import { C, assertEqual, body, foot, mono, note, place, point, readout, start } from '../parts.mjs';
import { dot } from '../../../films/grouped-query-attention/arithmetic.mjs';

export default function latentScore(s, c) {
  start(s, c.title);
  const W = [
      [1, 2],
      [0, 1],
    ],
    q = [1, 0],
    history = [
      [1, 2],
      [3, 0],
    ];
  const WT = W[0].map((_, i) => W.map((row) => row[i]));
  const prime = WT.map((row) => dot(row, q));
  const scores = history.map((latent) =>
    dot(
      q,
      W.map((row) => dot(row, latent)),
    ),
  );
  assertEqual(
    history.map((latent) => dot(prime, latent)),
    scores,
    'both content score paths',
  );
  assertEqual(scores, [5, 3], 'scores at the two cached positions');
  const [expand, absorb] = body.columns(2, 'loose');
  const col = (v) => v.map((x) => [x]);
  for (const [i, area] of [expand, absorb].entries()) {
    const [title, work, first, next] = area.rows([1, 4, 1, 1], 'normal');
    const calc = place(
      matrixProduct(i ? WT : W, col(i ? q : history[0]), {
        size: 40,
        names: i ? ['Wᵀ', 'q', 'q′'] : ['W', 'c₀', 'k₀'],
        width: area.width * 0.93,
      }),
      work,
    );
    const header = place(
      note(i ? 'Current query · compute once' : 'Historical key · one per position'),
      title,
      'left',
    );
    if (i) {
      const origin = point(work, 0.08, 0.85);
      const unit = Math.min(work.width / 6, work.height / 3);
      const xy = ([x, y]) => [origin[0] + x * unit, origin[1] - y * unit];
      const key = W.map((row) => dot(row, history[0]));
      const axes = { stroke: 'dim', width: 2 };
      const query = [
        place(note('Dot product with the current query'), title, 'left'),
        line(origin, xy([5.8, 0]), axes),
        line(origin, xy([0, 2.5]), axes),
        arrow(origin, xy(q), { stroke: C.query, width: 8 }),
        place(mono('q = (' + q.join(', ') + ')', { size: 40, color: C.query }), first, 'left'),
      ];
      const expanded = [
        arrow(origin, xy(key), { stroke: C.key, width: 6 }),
        place(mono('k₀ = (' + key.join(', ') + ')', { size: 40, color: C.key }), next, 'left'),
      ];
      const horizontal = xy([scores[0], 0]);
      const projection = [
        line(xy(key), horizontal, { stroke: C.result, width: 3, dash: [8, 6] }),
        marker(9, C.result).at(...horizontal),
      ];
      s.add(query);
      c.show('key', expanded, { after: true });
      c.show('score', projection, { after: true });
      c.swap('transpose', [...query, ...expanded, ...projection], [header, calc]);
    } else s.add(header, calc);
    if (i === 0) {
      const row = c.cue('row');
      c.on('row', () => s.play(calc.compute(0, 0, { duration: row.end - row.start })));
    }
    c.after(i ? 'query' : 'key', () => s.play(calc.complete({ duration: 0.7 })));
    readout(
      s,
      c,
      first,
      [
        [
          i ? 'again' : 'score',
          i ? 'q′ · c₀ = (1, 2) · (1, 2) = 5' : 'q · k₀ = (1, 0) · (5, 2) = 5',
          C.result,
          true,
        ],
      ],
      { size: 39 },
    );
    if (i)
      readout(
        s,
        c,
        next,
        [
          ['move', 'Position 1     c₁ = (3, 0)'],
          ['reuse', 'Reuse q′     (1, 2) · (3, 0) = ?', C.query, true],
          ['next', 'q′ · c₁ = (1, 2) · (3, 0) = ' + scores[1], C.result, true],
        ],
        { size: 39 },
      );
  }
  readout(
    s,
    c,
    foot,
    [
      ['ask', 'Which vector can score the next latent without another projection?', C.result],
      ['reuse', 'q′ = Wᵀq depends on the current head and query.', 'ink', true],
      ['value', 'Weighted latents     Σ αᵢ cᵢ'],
      ['fuse', 'Value output     Wᵥ (Σ αᵢ cᵢ)', C.value, true],
    ],
    { size: 40, align: 'center' },
  );
}
