import { assertEqual, column, indicate, place, row, shift } from 'vizmatic/stage';
import { area, heading, label, mono, namedBox, note } from '../../kit-narrated.mjs';
export default function orderCollision(s, c) {
  const regions = area.rows([3, 3, 2, 1], 'tight');
  const words = ['compiler', 'calls', 'linker'];
  const vectors = [
    [0.9, 0.1, 0],
    [0.8, 0.2, 0.1],
    [0.7, 0.1, 0.2],
  ];
  const sequences = [words, words];
  const groups = sequences.map((words, i) =>
    words.map((word) =>
      column(
        [
          namedBox(word, { width: 340, height: 70, color: i ? 'pink' : 'cyan' }),
          mono('[' + vectors[['compiler', 'calls', 'linker'].indexOf(word)].join(', ') + ']', {
            size: 34,
            color: i ? 'pink' : 'cyan',
          }),
        ],
        { gap: 'tight', align: 'center' },
      ),
    ),
  );
  groups.forEach((items, i) => place(row(items, { gap: 'loose' }), regions[i]));
  const ends = groups.map((items) => items.map((item) => item.nodes[0].center));
  const mean = vectors[0].map((_, j) => vectors.reduce((sum, v) => sum + v[j], 0) / vectors.length);
  const sums = mean.map((v) => v * vectors.length);
  assertEqual(mean[1] * 3, 0.4, 'same sum in either order');
  const collision = place(
    column(
      [
        mono('Σ = [' + sums.map((v) => v.toFixed(1)).join(', ') + '] · divide by 3', { size: 34 }),
        mono('[' + mean.map((v) => v.toFixed(3)).join(', ') + ']', { color: 'yellow' }),
        label('same static mean', { color: 'yellow', size: 34 }),
      ],
      { gap: 'tight', align: 'center' },
    ),
    regions[2],
  );
  const contextual = place(
    note('Role-dependent token states can differ before pooling.'),
    regions[3],
  );
  const states = groups.map((items, i) =>
    items.map((item, j) => {
      const word = sequences[i][j],
        finalIndex = i === 0 ? j : 2 - j,
        role = word === 'calls' ? 'context' : finalIndex === 0 ? 'caller' : 'callee';
      return mono(word === 'calls' ? 'h(calls)' : 'h(' + word + ', ' + role + ')', {
        size: 34,
        color: i ? 'pink' : 'cyan',
      }).moveTo([ends[i][finalIndex][0], item.nodes[1].center[1]]);
    }),
  );
  const pools = place(
    column(
      [
        mono('A: mean(h(compiler, caller), h(calls), h(linker, callee))', {
          size: 34,
          color: 'cyan',
        }),
        mono('B: mean(h(linker, caller), h(calls), h(compiler, callee))', {
          size: 34,
          color: 'pink',
        }),
      ],
      { gap: 'tight', align: 'center' },
    ),
    regions[2],
  );
  s.add(heading('Who calls whom?'), groups);
  c.hide(
    'cl-order-collision-tokens',
    groups[1].map((item) => item.nodes[1]),
    { lead: 0.2, fade: 0.1 },
  );
  c.on('cl-order-collision-tokens', () => {
    const items = groups[1];
    s.play(
      shift(items[0].nodes[0], 0, -110, { duration: 0.35 }),
      shift(items[2].nodes[0], 0, 110, { duration: 0.35 }),
    );
    s.play(
      shift(items[0].nodes[0], ends[1][2][0] - ends[1][0][0], 0, { duration: 0.7 }),
      shift(items[2].nodes[0], ends[1][0][0] - ends[1][2][0], 0, { duration: 0.7 }),
    );
    s.play(
      shift(items[0].nodes[0], 0, 110, { duration: 0.35 }),
      shift(items[2].nodes[0], 0, -110, { duration: 0.35 }),
    );
    groups[1].forEach((item, j) =>
      item.nodes[1].moveTo([ends[1][2 - j][0], item.nodes[1].center[1]]),
    );
  });
  c.show(
    'cl-order-collision-tokens',
    groups[1].map((item) => item.nodes[1]),
    { lead: -1.7 },
  );
  c.show('cl-order-collision-mean', collision, { after: true });
  c.swap(
    'cl-order-collision-context',
    [groups.map((items) => items.map((item) => item.nodes[1])), collision],
    [states, pools, contextual],
  );
  c.on('cl-order-collision-diagnose', () => s.play(indicate(pools, { scale: 1 })));
}
