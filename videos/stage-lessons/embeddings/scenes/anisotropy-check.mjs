import { assertEqual, column, dot, dynamic, indicate, place } from 'vizmatic/stage';
import { centerPopulation } from '../../../films/embeddings/arithmetic.mjs';
import { heading, label, mono, note } from '../../kit-narrated.mjs';
import { plane, TOP, MID, LOW, cosine, fmt, vec } from '../parts.mjs';
export default function anisotropyCheck(s, c) {
  const first = [10, 1],
    second = [10, -1],
    mean = [10, 0],
    raw = cosine(first, second),
    t = s.value(0),
    population = s.value(0);
  assertEqual(first[0] * second[0] + first[1] * second[1], 99, 'raw dot');
  assertEqual(first[0] ** 2 + first[1] ** 2, 101, 'squared length');
  const populationPoints = [1, 2, 3].map((y) => [mean[0], y]),
    pop = centerPopulation(populationPoints);
  assertEqual(
    pop.centered[1].every((v) => v === 0),
    true,
    'population point at its mean',
  );
  const p = plane(s, {
    range: () => [-1, 11 - 9.5 * t.value],
    yRange: [-2, 2],
    title: 'remove one common mean',
    xName: 'coordinate 1',
    yName: 'coordinate 2',
  });
  const vectors = () =>
    population.value < 0.5
      ? [first.map((x, j) => x - t.value * mean[j]), second.map((x, j) => x - t.value * mean[j])]
      : pop.centered;
  const rays = [0, 1, 2].map((i) =>
    p.vector(() => vectors()[i] ?? [0, 0], ['cyan', 'green', 'pink'][i]),
  );
  const inputs = place(
    column(
      [
        mono('[10, 1]   [10, −1]', { size: 36 }),
        mono('dot 99   /   lengths² 101', { size: 34 }),
        note('large shared horizontal component'),
      ],
      { gap: 'normal' },
    ),
    TOP,
    'left',
  );
  const original = place(
    mono(`raw cosine = ${fmt(raw, 4)}`, { color: 'yellow', size: 36 }),
    MID,
    'left',
  );
  const centered = place(
    column(
      [
        mono('[0, 1]   [0, −1]', { size: 36 }),
        label('pair result: cosine = −1', { color: 'yellow' }),
      ],
      { gap: 'normal' },
    ),
    MID,
    'left',
  );
  const meanPanel = place(
    column(
      [mono('subtract mean [10, 0]', { size: 36 }), note('two-point centering makes opposites')],
      { gap: 'normal' },
    ),
    LOW,
    'left',
  );
  const zero = place(
    column(
      [
        label('a population point at its mean'),
        mono('centered [0, 0]', { color: 'red' }),
        note('cosine is undefined at zero length'),
      ],
      { gap: 'normal' },
    ),
    LOW,
    'left',
  );
  const newInputs = place(
    column(
      [
        label('new three-point population'),
        mono(populationPoints.map(vec).join(' / '), { size: 34 }),
        note(`mean ${vec(pop.mean)}`),
      ],
      { gap: 'normal' },
    ),
    TOP,
    'left',
  );
  c.take(p.frame);
  s.add(heading(c.title), p.nodes, rays.slice(0, 2), inputs);
  c.on('dot', () => s.play(indicate(inputs, { scale: 1, color: 'yellow' })));
  c.show('cosine', original, { after: true });
  c.show('center', meanPanel);
  c.on('center', () => s.play(t.to(1, { duration: 2.5 })));
  c.swap('opposite', original, centered, { after: true });
  c.swap('zero', [meanPanel, inputs], [zero, newInputs], { after: true });
  c.hide('zero', centered, { after: true });
  c.show('zero', rays[2], { after: true });
  c.after('zero', () => population.set(1));
  c.on('population', () => s.play(indicate(zero, { scale: 1, color: 'yellow' })));
  c.keep(p.frame);
}
