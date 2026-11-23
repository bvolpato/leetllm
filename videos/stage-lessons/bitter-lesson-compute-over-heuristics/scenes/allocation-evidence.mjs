import {
  place,
  column,
  rect,
  line,
  dot,
  dynamic,
  table,
  tex,
  axes,
  assertEqual,
  indicate,
  morphMatching,
} from 'vizmatic/stage';
import { heading, note, chip } from '../../kit-narrated.mjs';
import { BODY } from '../parts.mjs';
export default function allocation(s, c) {
  const KAPLAN = { n: 0.73, d: 0.27 },
    GOPHER = { n: 280, d: 300 },
    CHINCHILLA = { n: 70, d: 1400 };
  const FORWARD = 2,
    BACKWARD = 2 * FORWARD;
  assertEqual(FORWARD + BACKWARD, 6, 'dense training factor');
  assertEqual(KAPLAN.n + KAPLAN.d, 1, 'compute split exponents');
  assertEqual(GOPHER.n / CHINCHILLA.n, 4, 'published parameter ratio');
  const [main, foot] = BODY.rows([5, 1], 'normal');
  const [left, right] = main.columns([1, 1], 'loose');
  const [tiles, scale, shape, dimension] = left.rows([1.8, 0.7, 2.8, 0.6], 'normal');
  const operations = tiles
    .columns(FORWARD + BACKWARD, 'tight')
    .map((cell, i) =>
      place(
        column(
          [chip('N', { color: 'blue' }), note(i < FORWARD ? 'forward' : 'backward', { size: 29 })],
          { gap: 'tight' },
        ),
        cell,
      ),
    );
  const [vertical, plot] = shape.columns([1, 3], 'normal');
  const box = plot.inset('tight');
  const w = s.value(0.5),
    product = s.value(0.25),
    h = {
      get value() {
        return product.value / w.value;
      },
    },
    published = s.value(0);
  const frame = rect(box.width, box.height, { stroke: 'dim', fill: null, width: 2 }).moveTo(
    box.point('center'),
  );
  const allocation = dynamic(() =>
    rect(box.width * w.value, box.height * h.value, {
      fill: 'blue',
      opacity: 0.35,
      stroke: 'blue',
      width: 4,
    }).moveTo([box.left + (box.width * w.value) / 2, box.bottom - (box.height * h.value) / 2]),
  );
  const nLabel = dynamic(() =>
    note(published.value ? 'N = ' + (w.value * GOPHER.n).toFixed(0) + 'B' : 'N (normalized)', {
      size: 34,
      color: 'blue',
    }).moveTo([box.left + (box.width * w.value) / 2, dimension.point('center')[1]]),
  );
  const dLabel = dynamic(() =>
    note(published.value ? 'D = ' + (h.value * CHINCHILLA.d).toFixed(0) + 'B' : 'D (normalized)', {
      size: 29,
      color: 'green',
    }).moveTo([vertical.point('center')[0], box.bottom - (box.height * h.value) / 2]),
  );
  const normalizedScale = place(
    note('Normalized dimensions: schematic split', { size: 29 }),
    scale,
  );
  const publishedScale = place(note('Published scale: N ≤ 280B, D ≤ 1400B', { size: 29 }), scale);
  const studyName = ['Kaplan', 'Hoffmann', 'Chinchilla', 'Gopher'].map((name) =>
    place(note(name, { size: 34, color: 'yellow' }), tiles, 'bottom'),
  );
  // The held-out boundary remains visible until the loss explanation starts.
  const [trainArea, heldArea] = right.columns(2, 'wide');
  const training = place(chip('training', { color: 'blue' }), trainArea, 'top');
  const evaluation = place(chip('held-out tokens', { color: 'green' }), heldArea, 'top');
  const boundary = line(
    right.point('top'),
    [right.point('center')[0], right.top + right.height * 0.65],
    { stroke: 'dim', width: 3 },
  );
  const clean = place(
    note('Independent evaluation', { size: 29, color: 'green' }),
    heldArea,
    'bottom',
  );
  const contaminated = place(
    column(
      [
        note('CONTAMINATED', { color: 'red', size: 34 }),
        note('Prior exposure can improve the score.', { size: 29 }),
      ],
      { gap: 'normal' },
    ),
    right,
    'bottom',
  );
  const leak = s.value(0);
  const leakDot = dynamic(() =>
    leak.value <= 0
      ? []
      : dot(14, 'red').moveTo([
          heldArea.point('center')[0] +
            (trainArea.point('center')[0] - heldArea.point('center')[0]) * leak.value,
          right.point('center')[1],
        ]),
  );
  const [tokenBand, meanBand, curveBand, axisBand] = right.rows([1, 1.5, 1.7, 0.7], 'normal');
  const tokenLosses = place(tex('\\ell_i=-\\log p(\\mathrm{actual}_i)', { size: 42 }), tokenBand);
  const terms = place(tex('\\ell_1+\\ell_2+\\cdots+\\ell_m', { size: 46 }), meanBand);
  const mean = place(tex('L=\\frac{\\ell_1+\\ell_2+\\cdots+\\ell_m}{m}', { size: 46 }), meanBand);
  const progress = s.value(0);
  const lossAxes = place(
    axes({
      x: [0, 1],
      y: [0, 1],
      width: curveBand.width - 120,
      height: curveBand.height - 25,
      ticks: false,
      labels: false,
      grid: false,
      tips: false,
    }),
    curveBand,
  );
  const trend = lossAxes.plot((x) => 0.75 / (1 + 4 * x) + 0.08, {
    stroke: 'green',
    width: 5,
    to: () => progress.value,
  });
  const curveLabel = place(note('Mean held-out loss ↓   Compute →', { size: 29 }), axisBand);
  const curveScope = place(
    note('Schematic trend', { size: 29, color: 'dim' }),
    curveBand,
    'top right',
  );
  const lossPicture = [tokenLosses, terms, lossAxes, curveLabel, curveScope];
  const study = place(
    table(
      [
        { key: 'study', label: 'Study', sample: 'Chinchilla' },
        { key: 'n', label: 'Parameters', sample: 'smaller models' },
        { key: 'd', label: 'Tokens', sample: 'longer training' },
      ],
      ['Kaplan', 'Hoffmann', 'Gopher', 'Chinchilla'].map((name, i) => ({
        id: ['K', 'H', 'G', 'C'][i],
        study: name,
        n: '',
        d: '',
      })),
      { width: right.width, size: 34, leading: 1.8, maxRows: 5 },
    ),
    right,
  );
  const scope = place(note('Dense non-embedding planning approximation', { size: 34 }), foot);
  const held = place(
    note('Keep evaluation evidence independent.', { color: 'yellow', size: 34 }),
    foot,
  );
  const fit = place(
    note('Empirical splits. No universal ratio.', { color: 'yellow', size: 34 }),
    foot,
  );
  const serving = place(
    note('Longer small-model training can target a fixed serving budget.', { size: 34 }),
    foot,
  );
  s.add(
    heading(c.title),
    operations,
    normalizedScale,
    frame,
    allocation,
    nLabel,
    dLabel,
    training,
    evaluation,
    boundary,
    clean,
    leakDot,
    scope,
  );
  c.on('allocation-evidence-b1', () =>
    s.play(...operations.map((op) => indicate(op, { scale: 1, color: 'yellow' }))),
  );
  c.swap('allocation-loss', [training, evaluation, boundary, clean], lossPicture);
  c.after('allocation-loss', () => s.play(morphMatching(terms, mean, { duration: 0.8 })));
  c.on('allocation-trend', () => s.play(progress.to(1, { duration: 3 })));
  c.swap('allocation-leak', [...lossPicture, mean], [training, evaluation, boundary, clean]);
  c.swap('allocation-leak', scope, held);
  c.on('allocation-leak', () => s.play(leak.to(1, { duration: 2 })));
  c.swap('allocation-leak', clean, contaminated, { after: true });
  c.swap('allocation-evidence-b2', [training, evaluation, boundary, contaminated, leakDot], study);
  c.swap('allocation-evidence-b2', operations, studyName[0]);
  c.on('allocation-evidence-b2', () => s.play(w.to(0.8, { duration: 2 })));
  c.on('allocation-evidence-b2', () => s.play(study.light('K', null, { duration: 0.5 })), 0.7);
  c.after('allocation-evidence-b2', () =>
    s.play(
      study.setCell('K', 'n', 'C^' + KAPLAN.n, { duration: 0.5 }),
      study.setCell('K', 'd', 'C^' + KAPLAN.d, { duration: 0.5 }),
    ),
  );
  c.swap('allocation-hoffmann', studyName[0], studyName[1]);
  c.on('allocation-hoffmann', () =>
    s.play(w.to(0.5, { duration: 2 }), study.light('H', null, { duration: 0.5 })),
  );
  c.after('allocation-hoffmann', () =>
    s.play(
      study.setCell('H', 'n', '≈ equal growth', { duration: 0.5 }),
      study.setCell('H', 'd', '≈ equal growth', { duration: 0.5 }),
    ),
  );
  // Change scales explicitly, then interpolate from Hoffmann's actual ending dimensions.
  c.swap('allocation-chinchilla', normalizedScale, publishedScale);
  c.swap('allocation-chinchilla', studyName[1], studyName[2]);
  c.on('allocation-chinchilla', () => {
    s.play(
      w.to(CHINCHILLA.n / GOPHER.n, { duration: 2 }),
      study.light('C', null, { duration: 0.5 }),
    );
  });
  c.on('allocation-chinchilla', () => published.set(1), 0.7);
  c.after('allocation-chinchilla', () =>
    s.play(
      study.setCell('C', 'n', CHINCHILLA.n + 'B', { duration: 0.5 }),
      study.setCell('C', 'd', (CHINCHILLA.d / 1000).toFixed(1) + ' trillion', { duration: 0.5 }),
    ),
  );
  c.swap('allocation-gopher', studyName[2], studyName[3]);
  c.on('allocation-gopher', () =>
    s.play(
      w.to(1, { duration: 2 }),
      product.to(GOPHER.d / CHINCHILLA.d, { duration: 2 }),
      study.light('G', null, { duration: 0.5 }),
    ),
  );
  c.after('allocation-gopher', () =>
    s.play(
      study.setCell('G', 'n', GOPHER.n + 'B', { duration: 0.5 }),
      study.setCell('G', 'd', GOPHER.d + 'B', { duration: 0.5 }),
    ),
  );
  c.swap('allocation-evidence-b3', held, fit);
  c.swap('allocation-serving', fit, serving);
  c.on('allocation-serving', () => {
    s.play(
      study.append(
        { id: 'L', study: 'Llama 3', n: 'smaller models', d: 'longer training' },
        { duration: 0.6 },
      ),
    );
    s.play(study.light('L', null, { duration: 0.5 }));
  });
}
