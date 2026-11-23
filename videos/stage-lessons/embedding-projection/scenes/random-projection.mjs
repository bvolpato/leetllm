import { assertEqual, column, dot, dynamic, group, line, place, tex } from 'vizmatic/stage';
import { heading, label, mono, note } from '../../kit-narrated.mjs';
import { BODY, FOOT, LEFT, RIGHT, TOP, VECTOR_BYTES } from '../parts.mjs';

export default function randomProjection(s, c) {
  const epsilon = 0.15,
    k = Math.ceil((4 * Math.log(VECTOR_BYTES.records)) / (epsilon ** 2 / 2 - epsilon ** 3 / 3));
  assertEqual(k, 6368, 'sufficient JL dimension for ten million points');
  const fixed = place(label('One saved matrix for every document and query', { size: 43 }), TOP);
  const formula = place(
    column([tex('z=xR', { size: 83, color: 'cyan' }), mono('R: d × k')], { gap: 'wide' }),
    LEFT,
  );
  const [a, b] = RIGHT.rows(2, 'normal');
  const gaussian = place(
    column([label('Gaussian entries'), mono('mean 0    variance 1/k', { size: 38 })], {
      gap: 'normal',
    }),
    a,
  );
  const sparse = place(
    column(
      [
        label('Sparse entries'),
        tex('R_{ij}\\in\\{-\\sqrt{3/k},0,+\\sqrt{3/k}\\}', { size: 44 }),
        mono('1/6       2/3       1/6', { size: 33 }),
      ],
      { gap: 'normal' },
    ),
    b,
  );
  const bound = place(
    column(
      [
        label('A sufficient dimension for N fixed points'),
        tex('k \\geq \\frac{4\\ln N}{\\epsilon^2/2-\\epsilon^3/3}', { size: 64 }),
        note('0 < ε < 1'),
      ],
      { gap: 'wide' },
    ),
    LEFT,
  );
  const conditions = place(
    column([label('N = 10,000,000'), label('ε = 0.15'), note('Original dimension: 1,536')], {
      gap: 'normal',
    }),
    RIGHT,
  );
  const boundResult = place(
    label('Bound: ' + k.toLocaleString('en-US') + ' dimensions', { color: 'yellow' }),
    FOOT,
  );

  const [r1, r2] = BODY.rows(2, 'loose');
  const paths = [
    { name: 'A', original: 1, example: 1.1, color: 'cyan' },
    { name: 'B', original: 1.15, example: 1.03, color: 'blue' },
  ];
  const t = s.value(0);
  const edges = paths.map(({ name, original, example, color }, i) => {
    const row = [r1, r2][i];
    const lo = original * (1 - epsilon),
      hi = original * (1 + epsilon);
    assertEqual(lo <= example && example <= hi, true, 'admissible squared distance for ' + name);
    const [identity, rail, reading] = row.columns([1.3, 5, 1], 'wide');
    const x = (v) => rail.left + ((v - 0.8) / 0.56) * rail.width,
      y = rail.cy;
    return [
      place(label('Clause ' + name, { color }), identity),
      line([x(0.8), y], [x(1.36), y], { stroke: 'dim', width: 2 }),
      line([x(lo), y], [x(hi), y], { stroke: color, width: 7 }),
      ...[lo, hi].map((v) =>
        group(
          line([x(v), y - 13], [x(v), y + 13], { stroke: color, width: 3 }),
          mono(String(Number(v.toFixed(4))), { size: 33 }).moveTo([x(v), y + 42]),
        ),
      ),
      dynamic(() => {
        const v = original + (example - original) * t.value;
        return group(
          dot(18, 'yellow').moveTo([x(v), y]),
          place(mono(v.toFixed(2), { size: 48, color: 'yellow' }), reading),
        );
      }),
    ];
  });
  const squared = place(
    label('Squared distance from the query     •     allowed distortion ±15%', { size: 41 }),
    TOP,
  );
  const ask = place(label('Must clause A stay closer than B?', { color: 'yellow' }), FOOT);
  const swapped = place(
    label('B is closer at 1.03. Both marks are inside their allowed intervals.', {
      color: 'yellow',
      size: 36,
    }),
    FOOT,
  );
  const ordinary = place(
    mono('Actual length factor: √0.85 to √1.15  ≈  0.922 to 1.072', { size: 36 }),
    FOOT,
  );
  const trial = place(
    label('A separate seeded test     •     48 → 16 coordinates', { size: 42 }),
    TOP,
  );
  const storage = place(
    column([label('Float32 bytes per vector'), mono('192 B → 64 B', { size: 59 })], {
      gap: 'normal',
    }),
    LEFT,
  );
  const matched = place(
    column(
      [
        label('Original top-five neighbors kept'),
        mono('19 / 60 ≈ 0.317', { size: 54, color: 'cyan' }),
        note('12 queries × 5 reference neighbors'),
      ],
      { gap: 'normal' },
    ),
    RIGHT,
  );
  s.add(heading(c.title), formula);
  c.show('random-once', fixed);
  c.show('random-gaussian', gaussian);
  c.show('random-sparse', sparse);
  c.swap('jl-bound', [formula, gaussian, sparse], [bound, conditions]);
  c.show('jl-dimension', boundResult, { after: true });
  c.swap('jl-ruler', [bound, conditions, boundResult, fixed], [squared, edges]);
  c.show('jl-ask', ask);
  c.hide('jl-shift', ask);
  c.on('jl-shift', () => s.play(t.to(1, { duration: 2 })));
  c.show('jl-rank', swapped, { after: true });
  c.swap('jl-distance', swapped, ordinary);
  c.swap('random-trial', [squared, edges, ordinary], [trial, storage]);
  c.show('random-result', matched, { after: true });
}
