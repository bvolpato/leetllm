import { arrow, boxOf, column, dot, dynamic, place, row } from 'vizmatic/stage';
import { area, label, mono, note } from '../kit-narrated.mjs';
import { example } from '../../films/training-backpropagation-gradient-descent/fixtures.mjs';
import {
  reverseTrace,
  updateOnce,
  validateModel,
} from '../../films/training-backpropagation-gradient-descent/model.mjs';

validateModel();
export { example };
export const COLOR = Object.freeze({
  weight: 'blue',
  bias: 'cyan',
  target: 'pink',
  active: 'green',
  validation: 'green',
  signal: 'yellow',
  failure: 'red',
});
export const STATE = Object.freeze({
  opening: [1, 0, 2],
  forward: [1, 0, 2],
  sensitivity: [1, 0, 2],
  'reverse-mode': [1, 0, 2],
  'one-update': [1.8, 0.4, 4],
  'gradient-check': [1, 0, 2],
  'autograd-buffer': 'isolated shared parameter',
  'local-rules': 'saved local rules',
  'nonlinear-request': 'updated ReLU network',
  'training-loop': 'cleared next batch',
  batches: 'weighted effective batch',
  'learning-rate': [-1.8, 0.4, 4],
  'deep-gradients': 'clipped finite vector',
  initialization: 'He-scaled ReLU',
  diagnosis: 'validation gap',
  validation: 'restored epoch 2 on the second run',
  'network-transfer': 'fresh prediction 5.3',
  'next-loss': 'probability minus target',
  'signed-request': 'lower weight decreases, prediction 4.65',
});

// A saved forward graph has dedicated lower lanes for reverse signals.
export function requestGraph(s) {
  const [head, body, reverse, foot] = area.rows([1, 3, 3, 1], 'wide');
  const names = ['multiply', 'add bias', 'subtract target', 'half-square'];
  const m = reverseTrace();
  const vals = [m.product, m.prediction, m.residual, m.loss];
  const cols = body.columns(4, 'loose');
  const nodes = names.map((name, i) =>
    place(
      column([label(name), mono(String(vals[i]), { color: i === 3 ? 'yellow' : 'cyan' })], {
        gap: 'wide',
      }),
      cols[i],
    ),
  );
  const edges = nodes.slice(0, -1).map((n, i) =>
    arrow(boxOf(n).point('right'), boxOf(nodes[i + 1]).point('left'), {
      stroke: 'dim',
      width: 3,
      pad: 15,
    }),
  );
  const reverseCols = reverse.columns(4, 'loose');
  const lanes = reverseCols.map((r) => r.rows([2, 1, 2], 'normal'));
  const signal = (name, value, region, color = 'yellow') =>
    place(column([note(name), mono(String(value), { color, size: 48 })], { gap: 'none' }), region);
  const product = signal('product gradient', m.gradPrediction, lanes[0][0]);
  const addition = signal('prediction gradient', m.gradPrediction, lanes[1][0]);
  const residual = signal('× saved residual', m.gradPrediction, lanes[2][0]);
  const seed = signal('loss seed', m.seed, lanes[3][0]);
  const weight = signal('w: × saved x = 2', m.gradWeight, lanes[0][2], 'blue');
  const bias = signal('b: gradient', m.gradBias, lanes[1][2], 'cyan');
  const connect = (from, to, sideA, sideB) =>
    arrow(boxOf(from).point(sideA), boxOf(to).point(sideB), {
      stroke: 'yellow',
      width: 4,
      pad: 16,
    });
  const backEdges = [
    connect(seed, residual, 'left', 'right'),
    connect(residual, addition, 'left', 'right'),
    connect(addition, product, 'left', 'right'),
    connect(addition, bias, 'bottom', 'top'),
    connect(product, weight, 'bottom', 'top'),
  ];
  const banner = place(
    row(
      [
        mono('x = 2', { color: 'cyan' }),
        mono('w = 1', { color: 'blue' }),
        mono('b = 0', { color: 'cyan' }),
        mono('target = 6', { color: 'pink' }),
      ],
      { gap: 'loose' },
    ),
    head,
  );
  const caption = place(label('Saved forward values → local backward rules'), foot);
  return {
    nodes,
    edges,
    product,
    addition,
    residual,
    seed,
    weight,
    bias,
    backEdges,
    banner,
    caption,
    foot,
  };
}

export function relay(s, from, to, { color = 'yellow', duration = 1 } = {}) {
  const progress = s.value(0);
  const source = boxOf(from),
    target = boxOf(to);
  const horizontal =
    Math.abs(target.point('center')[0] - source.point('center')[0]) >
    Math.abs(target.point('center')[1] - source.point('center')[1]);
  const direction = horizontal
    ? Math.sign(target.point('center')[0] - source.point('center')[0])
    : Math.sign(target.point('center')[1] - source.point('center')[1]);
  const a = source.point(
    horizontal ? (direction > 0 ? 'right' : 'left') : direction > 0 ? 'bottom' : 'top',
  );
  const b = target.point(
    horizontal ? (direction > 0 ? 'left' : 'right') : direction > 0 ? 'top' : 'bottom',
  );
  const axis = horizontal ? 0 : 1;
  a[axis] += direction * 24;
  b[axis] -= direction * 24;
  const pulse = dynamic(() =>
    dot(10, color).moveTo([
      a[0] + (b[0] - a[0]) * progress.value,
      a[1] + (b[1] - a[1]) * progress.value,
    ]),
  );
  s.add(pulse);
  s.play(progress.to(1, { duration }));
  pulse.opacity(0);
}

export const updated = updateOnce(0.1);
