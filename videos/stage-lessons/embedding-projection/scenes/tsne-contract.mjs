import { assertEqual, column, dot, dynamic, group, line, place, rect } from 'vizmatic/stage';
import { heading, label, mono, note } from '../../kit-narrated.mjs';
import { FOOT, LEFT, RIGHT, TOP, cauchyMap } from '../parts.mjs';

export default function tsneContract(s, c) {
  const sourceTitle = place(label('Original vectors', { size: 46 }), TOP);
  const sourceRows = LEFT.rows(3, 'normal');
  const ratios = [
    { from: 'A', to: ['B', 'C'] },
    { from: 'B', to: ['A', 'C'] },
  ];
  const sourceHead = place(note('Gaussian neighbor weights, relative to each row'), sourceRows[0]);
  const weights = ratios.map(({ from, to }, i) => {
    const r = sourceRows[i + 1],
      w = r.width * 0.66,
      x = r.left + r.width * 0.13;
    const chart = [label('From ' + from, { size: 38 }).moveTo([x + 45, r.cy - 62])];
    let left = x;
    for (const [j, v] of [4, 1].entries()) {
      const len = (w * v) / 5,
        mid = left + len / 2;
      chart.push(
        rect(len - 4, 52, { fill: j === 0 ? 'blue' : 'dim' }).moveTo([mid, r.cy]),
        mono(to[j] + ' × ' + v, { size: 30 }).moveTo([mid, r.cy + 53]),
      );
      left += len;
    }
    return chart;
  });
  const local = place(
    column(
      [
        label('Neighbors of A'),
        mono('4 / 5 = 0.8     1 / 5 = 0.2', { size: 36 }),
        note('Perplexity = exp(row entropy)'),
      ],
      { gap: 'wide' },
    ),
    RIGHT,
  );
  const target = place(
    column(
      [
        label('Ordered pair A → B'),
        mono('p = (0.8 + 0.8) / (2 × 3)', { size: 36 }),
        mono('p ≈ 0.267', { color: 'yellow', size: 52 }),
      ],
      { gap: 'wide' },
    ),
    RIGHT,
  );

  const h = s.value(1);
  const points = (height) => [
    [-1, 0],
    [1, 0],
    [0, height],
  ];
  const model = (height) => cauchyMap(points(height));
  const unit = Math.min(LEFT.height * 0.31, LEFT.width * 0.31);
  const world = ([x, y]) => [LEFT.cx + unit * x, LEFT.bottom - 108 - unit * y];
  const triangle = dynamic(() => {
    const [a, b, top] = points(h.value).map(world);
    return group(
      line(a, top, { stroke: 'dim', width: 5 }),
      line(b, top, { stroke: 'dim', width: 5 }),
      line(a, b, { stroke: 'cyan', width: 7 }),
      dot(17, 'cyan').moveTo(a),
      dot(17, 'cyan').moveTo(b),
      dot(17, 'yellow').moveTo(top),
      mono('A (−1, 0)', { size: 35, color: 'cyan' }).moveTo([a[0], a[1] + 50]),
      mono('B (1, 0)', { size: 35, color: 'cyan' }).moveTo([b[0], b[1] + 50]),
      mono('C (0, ' + Number(h.value.toFixed(2)) + ')', { size: 35, color: 'yellow' }).moveTo([
        top[0],
        top[1] - 48,
      ]),
    );
  });
  const [rule, pairs, total, share] = RIGHT.rows([0.9, 2, 1, 1.3], 'normal');
  const mapTitle = place(label('Three points on the inspection map', { size: 46 }), TOP);
  const kernel = place(mono('w = 1 / (1 + distance²)', { size: 39 }), rule);
  const twoWays = place(note('Each edge counts in both directions.'), LEFT, 'bottom');
  const pairRows = pairs.rows(3, 'tight');
  const weightsAt = dynamic(() => {
    const { weights } = model(h.value);
    return group(
      ...[
        [0, 1, 'AB'],
        [0, 2, 'AC'],
        [1, 2, 'BC'],
      ].map(([i, j, name], n) =>
        place(
          mono(name + '    2 × ' + weights[i][j].toFixed(4), {
            size: 36,
            color: n === 0 ? 'cyan' : 'ink',
          }),
          pairRows[n],
        ),
      ),
    );
  });
  const denominator = dynamic(() =>
    place(
      mono('Sum ≈ ' + model(h.value).denominator.toFixed(4), { color: 'ink', size: 42 }),
      total,
    ),
  );
  const q = dynamic(() =>
    place(
      mono('q(A → B) = ' + model(h.value).q[0][1].toFixed(4), { color: 'cyan', size: 45 }),
      share,
    ),
  );
  const ask = place(
    label('Lift C one unit. Will A → B get a larger or smaller share?', {
      size: 38,
      color: 'yellow',
    }),
    FOOT,
  );
  const before = model(1),
    after = model(2);
  assertEqual(before.weights[0][1], after.weights[0][1], 'stationary edge weight');
  assertEqual(before.q[0][1].toFixed(4), '0.1154', 'initial ordered-pair probability');
  assertEqual(after.q[0][1].toFixed(4), '0.1875', 'probability after lifting only C');
  const comparison = place(
    label(
      'A → B    ' +
        before.q[0][1].toFixed(4) +
        '  →  ' +
        after.q[0][1].toFixed(4) +
        '     •     same length',
      { color: 'cyan' },
    ),
    FOOT,
  );
  const objective = place(
    mono('KL(P ∥ Q) = Σ p ln(p / q)     over ordered pairs', { size: 36 }),
    FOOT,
  );
  s.add(heading(c.title), sourceTitle, sourceHead, weights[0]);
  c.show('ts-row', local);
  c.show('ts-reverse', weights[1]);
  c.swap('ts-target', local, target, { after: true });
  c.swap('ts-map', [sourceTitle, sourceHead, weights, target], [mapTitle, triangle, kernel], {
    fade: 0.18,
  });
  c.show('ts-directions', [twoWays, weightsAt]);
  c.show('ts-total', denominator);
  c.show('ts-share', q, { after: true });
  c.show('ts-ask', ask);
  c.hide('ts-lift', ask);
  c.on('ts-lift', () => s.play(h.to(2, { duration: 2 })));
  c.show('ts-larger', comparison, { after: true });
  c.swap('ts-kl', comparison, objective);
}
