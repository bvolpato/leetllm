import {
  assertEqual,
  boxOf,
  column,
  dot,
  dynamic,
  grid,
  indicate,
  place,
  to,
} from 'vizmatic/stage';
import { heading, label, mono, note, chip } from '../../kit-narrated.mjs';
import { plane, TOP, MID, LOW, accumulation, fmt, mix, vec } from '../parts.mjs';
export default function elmoLayers(s, c) {
  const p = plane(s, {
      range: [-0.15, 1.8],
      title: 'recurrent states → layer mix',
      xName: 'coordinate 1',
      yName: 'coordinate 2',
    }),
    gamma = s.value(1),
    change = s.value(0),
    weights = [0.2, 0.3, 0.5];
  const layers = [
      [1, 0],
      [0, 1],
      [1, 1],
    ],
    next = [
      [0, 1],
      [1, 0],
      [0.5, 0.5],
    ];
  assertEqual(
    weights.reduce((a, b) => a + b, 0),
    1,
    'task weights sum',
  );
  const state = () => layers.map((v, i) => mix(v, next[i], change.value));
  const sum = () =>
    [0, 1].map((j) => state().reduce((n, v, i) => n + weights[i] * v[j], 0) * gamma.value);
  const result = p.vector(sum, 'yellow');
  const output = dynamic(
    () =>
      place(
        column(
          [
            label('Task output at this token', { color: 'yellow' }),
            mono('γ = ' + fmt(gamma.value) + '     ' + vec(sum()), { color: 'yellow' }),
          ],
          { gap: 'normal' },
        ),
        TOP,
        'left',
      ).nodes,
  );
  const tokens = place(
    grid(
      ['charge', 'the', 'phone', '→ 512', '→ 512', '→ 512', '512 ←', '512 ←', '512 ←'].map((v, i) =>
        chip(v, { width: 180, color: i < 3 ? 'blue' : i < 6 ? 'cyan' : 'green' }),
      ),
      { columns: 3, gap: ['wide', 'tight'] },
    ),
    p.plot,
  );
  const dimensions = place(
    column(
      [
        mono('h₀: [CNN, CNN] → 1024', { size: 34 }),
        mono('h₁, h₂: [→512, ←512]', { size: 34 }),
        note('shared input and output parameters'),
      ],
      { gap: 'normal' },
    ),
    MID,
    'left',
  );
  const weightsPanel = place(
    column(
      [
        label('same task weights at every token'),
        mono('[0.2, 0.3, 0.5]'),
        mono('γ × Σ weight × layer'),
      ],
      { gap: 'normal' },
    ),
    MID,
    'left',
  );
  const rows = place(
    column(
      layers.map((v, i) =>
        mono(`h${i} ${vec(v)} × ${weights[i]}`, { size: 34, color: ['blue', 'cyan', 'green'][i] }),
      ),
      { gap: 'normal' },
    ),
    LOW,
    'left',
  );
  const acc = accumulation(
    s,
    p,
    layers.map((v, i) => ({ values: v, weight: weights[i], color: ['blue', 'cyan', 'green'][i] })),
  );
  const nextRows = place(
    column(
      next.map((v, i) =>
        mono(`h${i} ${vec(v)} × ${weights[i]}`, { size: 34, color: ['blue', 'cyan', 'green'][i] }),
      ),
      { gap: 'normal' },
    ),
    LOW,
    'left',
  );
  const model = place(
    column(
      [
        label('forward + backward language models'),
        note('separate LSTM weights'),
        note('shared input and output softmax'),
      ],
      { gap: 'normal' },
    ),
    TOP,
    'left',
  );
  const fy = (boxOf(tokens.nodes[0]).bottom + boxOf(tokens.nodes[3]).top) / 2;
  const by = (boxOf(tokens.nodes[3]).bottom + boxOf(tokens.nodes[6]).top) / 2;
  const forward = dot(12, 'cyan').moveTo([p.plot.left, fy]),
    backward = dot(12, 'green').moveTo([p.plot.right, by]);
  c.take(p.frame);
  s.add(heading(c.title), p.nodes, tokens, dimensions, model);
  c.show('recurrent', [forward, backward]);
  c.on('recurrent', () =>
    s.play(
      to(forward, (n) => n.moveTo([p.plot.right, fy]), { duration: 2 }),
      to(backward, (n) => n.moveTo([p.plot.left, by]), { duration: 2 }),
    ),
  );
  c.on('duplicate', () => s.play(indicate(dimensions, { scale: 1, color: 'yellow' })));
  c.on('concatenate', () => s.play(indicate(tokens, { scale: 1, color: 'yellow' })));
  c.swap('mixture', dimensions, weightsPanel);
  c.hide('mixture', [tokens, forward, backward]);
  c.show('mixture', [rows, acc.drawing]);
  c.on('mixture', () => s.play(acc.progress.to(3, { duration: 2 })));
  c.show('gamma', result);
  c.swap('gamma', model, output);
  c.on('gamma', () => s.play(gamma.to(2, { duration: 1.4 })));
  c.on('example', () => s.play(indicate(rows, { scale: 1, color: 'yellow' })));
  c.swap('change', rows, nextRows);
  c.hide('change', acc.drawing);
  c.on('change', () => s.play(change.to(1, { duration: 1.8 })));
}
