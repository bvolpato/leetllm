import {
  assertEqual,
  circle,
  column,
  dynamic,
  group,
  line,
  matrix,
  place,
  rect,
} from 'vizmatic/stage';
import { heading, label, mono, note } from '../../kit-narrated.mjs';
import { body, energyRows, foot, left, pca, ribbon, right } from '../parts.mjs';

export default function scene(s, c) {
  const rows = energyRows();
  const divisor = rows.length - 1;
  const cov = [0, 1].map((j) =>
    [0, 1].map(
      (k) => rows.reduce((sum, row) => sum + row.centered[j] * row.centered[k], 0) / divisor,
    ),
  );
  const trace = cov[0][0] + cov[1][1];
  const gap = Math.hypot(cov[0][0] - cov[1][1], 2 * cov[0][1]);
  const eigenvalues = [(trace + gap) / 2, (trace - gap) / 2];
  const energies = ['retained', 'discarded'].map((key) =>
    rows.reduce((sum, row) => sum + row[key], 0),
  );
  energies.forEach((energy, i) =>
    assertEqual(
      Math.abs(energy / divisor - eigenvalues[i]) < 1e-10,
      true,
      'score energy equals sample eigenvalue times n − 1',
    ),
  );
  const [strips, detail] = body.columns([1.55, 1], 'loose');
  const tracks = strips.inset('normal').rows(2, 'wide');
  const colors = ['cyan', 'pink'];
  const stripsData = energies.map((energy, i) => {
    const [nameSpace, stripSpace, valueSpace] = tracks[i].rows([1, 1, 1], 'tight');
    const name = place(
      label(`Principal axis ${i + 1}`, { size: 38, color: colors[i] }),
      nameSpace,
      'bottom left',
    );
    const length = (stripSpace.width * 0.94 * energy) / energies[0];
    const x = stripSpace.left,
      y = stripSpace.cy;
    const direction = i === 0 ? pca.vector : [-pca.vector[1], pca.vector[0]];
    const scoreX = (score) => stripSpace.cx + (score * stripSpace.width) / 10;
    const scoreRuler = [
      line([scoreX(-5), y], [scoreX(5), y], { stroke: 'dim', width: 3 }),
      line([scoreX(0), y - 18], [scoreX(0), y + 18], { stroke: 'ink', width: 3 }),
      ...rows.map(({ centered }) => {
        const score = centered[0] * direction[0] + centered[1] * direction[1];
        const at = scoreX(score);
        return line([at, y - 14], [at, y + 14], { stroke: colors[i], width: 6 });
      }),
      ...[-5, 0, 5].map((v) => mono(String(v), { size: 29 }).moveTo([scoreX(v), y + 44])),
    ];
    const segment = (width, offset, opacity) =>
      rect(width, 46, { fill: colors[i], stroke: colors[i], width: 1, opacity }).moveTo([
        x + offset + width / 2,
        y,
      ]);
    const full = segment(length, 0, 0.85);
    const unit = length / divisor;
    const cuts = Array.from({ length: divisor - 1 }, (_, j) => {
      const cutX = x + (j + 1) * unit;
      return line([cutX, y - 28], [cutX, y + 28], { stroke: 'ink', width: 3 }).zIndex(1);
    });
    const sample = segment(unit, 0, 1);
    const rest = segment(length - unit, unit, 0.24);
    const total = place(mono(`Σ score² ≈ ${energy.toFixed(4)}`, { size: 35 }), valueSpace, 'left');
    const variance = place(
      mono(`${energy.toFixed(4)} / ${divisor} ≈ ${eigenvalues[i].toFixed(4)}`, { size: 34 }),
      valueSpace,
      'left',
    );
    return { name, scoreRuler, full, cuts, sample, rest, total, variance };
  });
  const header = heading(c.title);
  const corpus = place(note('Six centered messages'), ribbon);
  const [upper, lower] = detail.rows(2, 'wide');
  const svd = place(
    column(
      [
        label('SVD of centered rows', { size: 38 }),
        mono('Xc = U Σ Vᵀ', { size: 43 }),
        note('Right singular vectors give the axes'),
      ],
      { gap: 'normal' },
    ),
    upper,
  );
  const sigma = place(
    column(
      energies.map((v, i) =>
        mono(`σ${i + 1}² ≈ ${Math.sqrt(v).toFixed(4)}²`, { size: 34, color: colors[i] }),
      ),
      { gap: 'normal' },
    ),
    lower,
  );
  const question = place(
    label('Six rows. How many equal pieces?', { size: 39, color: 'yellow' }),
    foot,
  );
  const sampleCount = place(mono(`n − 1 = ${rows.length} − 1 = ${divisor}`, { size: 40 }), foot);
  const covariance = place(
    column(
      [
        label('Sample covariance', { size: 38 }),
        mono(`C = Xcᵀ Xc / ${divisor}`, { size: 38 }),
        matrix(
          cov.map((r) => r.map((v) => v.toFixed(3))),
          { size: 34 },
        ),
        note('Eigenvalues match the two pieces'),
      ],
      { gap: 'normal' },
    ),
    detail,
  );
  const share = place(
    mono(`PC1 share  ${((100 * energies[0]) / (energies[0] + energies[1])).toFixed(1)}%`, {
      size: 41,
      color: 'cyan',
    }),
    foot,
  );
  const zero = place(
    note('Identical rows    ·    zero total spread    ·    ratio undefined'),
    foot,
  );
  const [matrixLeft, matrixRight] = body.columns([1, 1], 'wide');
  const width = Math.min(matrixRight.width * 0.8, body.height * 0.58);
  const n = 100,
    features = 1536;
  const input = place(
    column(
      [
        rect(width, (width * n) / features, { fill: 'cyan', stroke: 'cyan' }),
        mono(`${n} × ${features}`, { size: 38 }),
        note('Centered input'),
      ],
      { gap: 'normal' },
    ),
    matrixLeft,
  );
  const gram = place(
    column(
      [
        rect(width, width, { fill: 'surface', stroke: 'pink', width: 4 }),
        mono(`${features} × ${features}`, { size: 38 }),
        note('Sample covariance'),
      ],
      { gap: 'normal' },
    ),
    matrixRight,
  );
  const rank = place(
    label(`Centered rank ≤ ${n - 1}    ·    Covariance is singular`, { size: 36 }),
    foot,
  );
  const ratio = place(
    note('Positive spectrum    ·    Singular-value ratio r becomes eigenvalue ratio r²'),
    ribbon,
  );
  const solver = place(note('Direct SVD operates on the centered input'), matrixLeft, 'bottom');
  const tied = place(label('Two equal variances', { size: 40 }), ribbon);
  const radius = left.height * 0.35;
  const frame = circle(radius, { stroke: 'dim', width: 4 }).moveTo(left.point('center'));
  const angle = s.value(0);
  const axes = dynamic(() =>
    group(
      ...colors.map((color, i) => {
        const a = angle.value + (i * Math.PI) / 2;
        const dx = radius * Math.cos(a),
          dy = radius * Math.sin(a);
        return line([left.cx - dx, left.cy - dy], [left.cx + dx, left.cy + dy], {
          stroke: color,
          width: 6,
        });
      }),
    ),
  );
  const tieText = place(
    column(
      [
        mono('λ₁ = λ₂', { size: 48 }),
        note('Every line in this plane'),
        note('captures the same variance.'),
      ],
      { gap: 'tight' },
    ),
    right,
  );

  s.add(header, corpus, ...stripsData.flatMap((r) => [r.name, r.scoreRuler]));
  c.swap(
    'energy',
    stripsData.flatMap((r) => r.scoreRuler),
    stripsData.flatMap((r) => [r.full, r.total]),
  );
  c.show('svd', svd);
  c.show('square', sigma);
  c.show('predict', question);
  c.show(
    'split',
    stripsData.flatMap((r) => r.cuts),
    { after: true },
  );
  c.swap('split', question, sampleCount, { after: true });
  c.swap(
    'piece',
    stripsData.flatMap((r) => [r.full, r.total]),
    stripsData.flatMap((r) => [r.rest, r.sample, r.variance]),
    { after: true },
  );
  c.swap('cov', [svd, sigma], covariance);
  c.swap('share', sampleCount, share, { after: true });
  c.swap('zero', share, zero, { after: true });
  c.swapAll('wide', input, { keep: [header] });
  c.show('gram', gram);
  c.show('rank', rank, { after: true });
  c.show('ratio', ratio);
  c.show('solver', solver);
  c.swapAll('tie', [tied, frame, axes, tieText], { keep: [header] });
  c.on('rotate', () => s.play(angle.to(Math.PI / 3, { duration: 1.8 })));
}
