import {
  assertEqual,
  column,
  dot,
  dynamic,
  group,
  indicate,
  line,
  place,
  rect,
  tex,
} from 'vizmatic/stage';
import { label, mono, note } from '../../kit-narrated.mjs';
import { begin, BODY, FOOT, LEFT, RIGHT, mathPlot, taskHeader } from '../parts.mjs';
export default function pcaFit(s, c) {
  const header = taskHeader(),
    center = s.value(0),
    projection = s.value(0),
    energy = s.value(0);
  const source = [
      [1, 1],
      [2, 2],
      [3, 3],
    ],
    mean = [2, 2],
    u = [1 / Math.sqrt(2), 1 / Math.sqrt(2)];
  assertEqual(source.reduce((sum, p) => sum + p[0], 0) / source.length, mean[0], 'mean x');
  const [plotRegion, varianceRegion] = LEFT.rows([4, 2], 'wide');
  const chart = mathPlot(plotRegion, {
    x: [-2, 4],
    y: [-2, 4],
    width: plotRegion.height * 0.75,
    height: plotRegion.height * 0.75,
  });
  const ruler = dynamic(() => {
    const a = (Math.PI / 4) * (1 - projection.value);
    return line(
      chart.world(-2 * Math.cos(a), -2 * Math.sin(a)),
      chart.world(4 * Math.cos(a), 4 * Math.sin(a)),
      { stroke: 'yellow', width: 5 },
    );
  });
  const marks = dynamic(() =>
    group(
      ...source.map(([x, y], i) => {
        const a = x - mean[0] * center.value,
          b = y - mean[1] * center.value,
          score = a * u[0] + b * u[1];
        return dot(15, 'ink').moveTo(
          chart.world(a + (score - a) * projection.value, b * (1 - projection.value)),
        );
      }),
    ),
  );
  const panels = RIGHT.rows(2, 'wide').flatMap((r) => r.columns(2, 'wide'));
  const titles = ['X: 3 × 2', 'U: 3 × 2', 'Σ: 2 × 2', 'V: 2 × 2'].map((v, i) =>
    place(note(v), panels[i], 'top'),
  );
  const scaffolds = panels.map((r) =>
    rect(r.width, r.height * 0.75, { stroke: 'dim' }).moveTo([r.cx, r.cy + 20]),
  );
  const matrixTex = (v, i) => place(tex(v, { size: 34 }), panels[i]);
  const X = dynamic(() =>
    matrixTex(
      center.value < 0.99
        ? '\\begin{pmatrix}1&1\\\\2&2\\\\3&3\\end{pmatrix}'
        : '\\begin{pmatrix}-1&-1\\\\0&0\\\\1&1\\end{pmatrix}',
      0,
    ),
  );
  const U = matrixTex('\\begin{pmatrix}-.707&.408\\\\0&-.816\\\\.707&.408\\end{pmatrix}', 1);
  const Sigma = matrixTex('\\begin{pmatrix}2&0\\\\0&0\\end{pmatrix}', 2);
  const V = matrixTex('\\begin{pmatrix}.707&-.707\\\\.707&.707\\end{pmatrix}', 3);
  const avg = place(mono('μ = (2, 2)', { color: 'yellow' }), FOOT);
  const coords = place(mono('scores = (−√2, 0, √2)', { color: 'yellow' }), FOOT);
  const svd = place(tex('X=U\\Sigma V^\\top\\qquad r=\\min(3,2)=2', { size: 40 }), FOOT);
  const rank = place(
    label('Centered rank ≤ min(3 − 1, 2) = 2; this fixture has rank 1', { size: 36 }),
    FOOT,
  );
  const covariance = place(tex('\\lambda_1=2^2/(3-1)=2\\quad\\lambda_2=0', { size: 40 }), FOOT);
  const totalSquared = 4,
    retainedSquared = 4;
  assertEqual(retainedSquared / totalSquared, 1, 'retained squared singular value fraction');
  const energyHead = place(
    note('Squared singular values: retained / total'),
    varianceRegion,
    'top',
  );
  const bars = dynamic(() => {
    const w = varianceRegion.width * 0.8,
      y = varianceRegion.cy;
    return group(
      rect(w, 40, { fill: 'surface', stroke: 'dim' }).moveTo([varianceRegion.cx, y]),
      rect(Math.max(0.1, w * energy.value), 40, { fill: 'yellow', stroke: 'yellow' }).moveTo([
        varianceRegion.cx - w / 2 + (w * energy.value) / 2,
        y,
      ]),
    );
  });
  const fraction = place(
    mono('4 / (4 + 0) = 100%', { size: 40, color: 'yellow' }),
    varianceRegion,
    'bottom',
  );
  const footer = place(
    label('Fit inside the fold. Validate scaling and whitening.', { size: 36, color: 'yellow' }),
    FOOT,
  );
  begin(
    s,
    c,
    'pca-fit',
    'Move the origin, then measure along a direction',
    [chart, marks, ruler, titles, scaffolds, X, energyHead, bars],
    header,
  );
  c.show('pca-mean', avg, { after: true });
  c.on('pca-center', () => s.play(center.to(1, { duration: 2 })));
  c.on('pca-axis', () => s.play(projection.to(1, { duration: 2 })));
  c.swap('pca-scores', avg, coords, { after: true });
  c.show('svd-shapes', [U, Sigma, V]);
  c.swap('svd-shapes', coords, svd);
  c.swap('centered-rank', svd, rank);
  c.swap('pca-covariance', rank, covariance);
  c.on('pca-energy', () => s.play(energy.to(1, { duration: 2 })));
  c.show('pca-energy', fraction, { after: true });
  c.on('pca-condition', () => s.play(indicate(Sigma, { scale: 1, color: 'yellow' })));
  c.swap('pca-whiten', covariance, footer);
  c.on('pca-fold', () => s.play(indicate(footer, { scale: 1, color: 'yellow' })));
}
