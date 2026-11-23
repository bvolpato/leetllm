import assert from 'node:assert/strict';
import {
  fittedWeights,
  penaltyFitStates,
  training,
  validationScores,
} from '../../../films/logistic-regression/fixtures.mjs';
import {
  multiclassSnapshot,
  marginFixture,
  gpFixture,
} from '../../../films/logistic-regression/model.mjs';
import { firstSteps } from './fitting.mjs';
import { stableDistribution, sigmoid } from '../../../films/logistic-regression/arithmetic.mjs';
import {
  ink,
  muted,
  teal,
  blue,
  gold,
  rust,
  sea,
  rose,
  white,
  light,
  board,
  text,
  label,
  rect,
  line,
  dot,
  path,
  readout,
  gridTable,
  plot,
  curve,
  cue,
  f,
  sum,
} from './paint.mjs';
const heads = ['Automatic', 'Review', 'Escalate'],
  colors = [blue, teal, rust];
const expBoard = (c, title) => board(c, 'Model comparisons   /   worked examples', title);
export function classes(c, k) {
  expBoard(c, 'Give the three routes separate weights');
  const b = k.beat.beatIndex,
    step = Math.round(1000 * cue(k, 3, 'actual six-row', 3) ** 2),
    fit = multiclassSnapshot(step);
  if (b < 4) {
    gridTable(c, {
      x: 85,
      y: 290,
      columns: [142, 230, 230, 230, 230],
      headers: ['Case', 'Actual label', ...heads],
      rows: fit.rows.map((r) => [r.id, heads[r.label], ...r.probabilities.map((v) => f(v))]),
      rowH: 79,
      highlight: 2,
    });
    const row = fit.rows[2];
    readout(c, 'M3   /   TRUE CLASS', 'Review', 1270, 330);
    if (b < 2) readout(c, 'LABEL SCORES', 'z = Wᵀ x', 1270, 548, teal, 47);
    else {
      readout(
        c,
        'M3   /   p − ONE-HOT',
        row.probabilities.map((p, i) => f(p - Number(i === row.label), 2)).join('  '),
        1210,
        495,
        rust,
        37,
      );
      readout(c, 'STEP ' + step + '   /   MEAN LOSS', f(fit.loss, 4), 1210, 703);
    }
    label(c, 'XW → logits     ·     softmax across each row', 97, 852);
  } else {
    const shift = b === 5 ? 6 : 6 * cue(k, 4, 'Adding the same coefficient', 1.3),
      z = [0, 1].map((v) => v + shift),
      dist = stableDistribution(z);
    gridTable(c, {
      x: 115,
      y: 345,
      columns: [430, 360, 360],
      headers: ['Class', 'Logit', 'Probability'],
      rows: z.map((v, i) => [i, f(v, 2), f(dist.probabilities[i])]),
      rowH: 111,
    });
    readout(c, 'LOGIT DIFFERENCE', f(z[1] - z[0], 2), 1350, 367);
    readout(c, 'p(CLASS 1)', f(sigmoid(z[1] - z[0])), 1350, 551);
    text(c, 'One reference logit can be fixed at zero.', 111, 838, 48, ink, 'left', 'Serif');
  }
}
const ordinary = [1001, 1000, 999],
  extreme = [1000, 0, -1000],
  target = 2;
export function stable(c, k) {
  const b = k.beat.beatIndex,
    z = b < 2 ? ordinary : extreme,
    d = stableDistribution(z),
    max = d.maximum;
  expBoard(c, 'How large was the penalty for the true class?');
  const shifted = b >= 1 || cue(k, 0, 'subtracting the largest', 0.8) === 1,
    exps = b >= 1;
  const rows = z.map((v, i) => [
    i + (i === target ? ' · target' : ''),
    v,
    shifted ? d.shifted[i] : '·',
    exps ? f(d.exponentials[i], 4) : '·',
    exps ? f(d.probabilities[i], 4) : '·',
  ]);
  gridTable(c, {
    x: 115,
    y: 328,
    columns: [315, 295, 310, 374, 348],
    headers: ['Class', 'Logit', 'Subtract ' + max, 'Shifted exponential', 'Probability'],
    rows,
    rowH: 105,
    highlight: target,
  });
  if (b < 2) {
    readout(c, 'NORMALIZER', exps ? f(d.normalizer, 4) : 'Σ exp(z − max)', 120, 724);
    if (exps) {
      readout(c, 'TARGET LOSS', f(d.lossFor(target)), 805, 724);
      readout(c, 'TARGET RESIDUAL', f(d.probabilities[target] - 1), 1385, 724, rust);
    }
  } else {
    readout(c, 'SHIFTED TARGET', String(d.shifted[target]), 115, 724, rust, 46);
    if (b >= 3) readout(c, 'STABLE LOSS', f(d.lossFor(target), 0) + ' nats', 761, 724, teal, 46);
    if (b >= 4) readout(c, 'CLIPPED AT 10⁻¹⁵', f(-Math.log(1e-15), 2), 1400, 724, rust, 46);
  }
}
export function margins(c, k) {
  const b = k.beat.beatIndex,
    m = 0.4 + cue(k, 1, 'At score one point four', 1.2);
  const negative = b >= 3 && cue(k, 3, 'Take a negative label', 0.3) === 1;
  const v = negative ? marginFixture(0.3, -1) : marginFixture(m),
    shown = v.margin;
  expBoard(
    c,
    negative ? 'What does a wrong sign cost?' : 'What does a correct sign still owe the margin?',
  );
  const g = plot(c, {
    h: 398,
    xrange: [-1.5, 2.5],
    yrange: [0, 3],
    xticks: [-1, 0, 1, 2],
    yticks: [0, 1, 2, 3],
    xlabel: 'Signed functional margin  y × score',
    ylabel: 'Loss per case',
  });
  curve(c, g, (x) => marginFixture(x).hinge, -1.5, 2.5, rust);
  curve(c, g, (x) => marginFixture(x).logistic, -1.5, 2.5, teal);
  line(c, g.X(1), g.Y(3), g.X(1), g.Y(0), gold, 2);
  dot(c, ...g.xy(shown, v.hinge), 11, rust);
  dot(c, ...g.xy(shown, v.logistic), 11, teal);
  readout(c, negative ? '(−1) × (+0.30)' : '(+1) × SCORE', f(shown, 2), 1340, 291, ink);
  readout(c, 'HINGE', f(v.hinge), 1340, 448, rust);
  readout(c, 'LOGISTIC', f(v.logistic), 1340, 606, teal);
  if (b >= 3) readout(c, '0/1 LOSS', String(Number(Math.sign(v.score) !== v.label)), 1340, 724, ink);
  const notes = [
    'y ∈ {−1, +1}     margin = y f(x)',
    'The hinge reaches zero at unit margin.',
    'Objective = ½ ‖w‖² + C Σ hinge',
    'Geometric margin = −0.30 / 2 = −0.15',
    'Squared hinge charges max(0, 1 − y f(x))².',
  ];
  text(
    c,
    b === 3 && !negative ? 'Geometric margin = y f(x) / ‖w‖' : notes[b],
    720,
    813,
    36,
    ink,
    'center',
    'Mono',
  );
}
export function kernel(c, k) {
  const b = k.beat.beatIndex;
  if (b < 2) {
    expBoard(c, 'How much influence reaches a distant point?');
    const d = cue(k, 0, 'distances one and three', 2) * 3,
      g = plot(c, {
        h: 420,
        xrange: [0, 4],
        yrange: [0, 1],
        xticks: [0, 1, 2, 3, 4],
        yticks: [0, 0.5, 1],
        xlabel: 'Distance in length-scale units',
        ylabel: 'RBF similarity',
      });
    curve(c, g, (x) => gpFixture(x).similarity, 0, 4);
    dot(c, ...g.xy(d, gpFixture(d).similarity), 14, rust);
    readout(c, 'RBF KERNEL', 'exp(−d² / 2ℓ²)', 1255, 350, teal, 44);
    readout(c, 'ℓ = 1   /   d = ' + f(d, 2), f(gpFixture(d).similarity), 1255, 540);
    if (b === 1) label(c, 'Similarities can bend an SVM boundary.', 1205, 788, muted, 'left', 22);
    return;
  }
  expBoard(c, 'One observation changes the GP regression band');
  const g = plot(c, {
    h: 420,
    xrange: [-4, 4],
    yrange: [-1.2, 2.8],
    xticks: [-4, -2, 0, 2, 4],
    yticks: [-1, 0, 1, 2],
    xlabel: 'Test input x (observation at 0)',
    ylabel: 'Continuous response',
  });
  const mode = b >= 5 && cue(k, 5, 'A new noisy observation', 0.6) === 1;
  const xs = Array.from({ length: 121 }, (_, i) => -4 + (8 * i) / 120);
  const conditioned = b >= 3;
  const band = (x, sign) => {
    const p = gpFixture(Math.abs(x));
    return conditioned
      ? p.mean + sign * Math.sqrt(mode ? p.observationVariance : p.latentVariance)
      : sign;
  };
  path(
    c,
    [...xs.map((x) => g.xy(x, band(x, 1))), ...xs.toReversed().map((x) => g.xy(x, band(x, -1)))],
    null,
    0,
    sea,
  );
  curve(c, g, (x) => (conditioned ? gpFixture(Math.abs(x)).mean : 0), -4, 4, teal);
  dot(c, ...g.xy(0, 2), 13, rust);
  label(c, 'y = 2', g.X(0) + 22, g.Y(2) - 24, rust);
  const d = 3 * cue(k, 5, 'Far from this observation', 1.5),
    v = gpFixture(d);
  if (conditioned) dot(c, ...g.xy(d, v.mean), 10, teal, ink);
  readout(
    c,
    conditioned ? 'POSTERIOR MEAN' : 'PRIOR MEAN',
    conditioned ? f(v.mean) : '0',
    1300,
    309,
  );
  readout(
    c,
    mode ? 'OBSERVATION VARIANCE' : conditioned ? 'LATENT VARIANCE' : 'PRIOR VARIANCE',
    conditioned ? f(mode ? v.observationVariance : v.latentVariance, 4) : '1',
    1300,
    471,
  );
  readout(
    c,
    mode ? 'NOISY BAND   /   ±1 SD' : 'LATENT BAND   /   ±1 SD',
    conditioned ? f(Math.sqrt(mode ? v.observationVariance : v.latentVariance)) : '1',
    1300,
    634,
  );
  if (b === 6) label(c, 'Dense fit  O(n³)   ·   storage  O(n²)', 1210, 793, ink, 'left', 24);
}
const library = [-4.914, 3.414, -0.964];
const predict = (w, a, s) => sigmoid(w[0] + w[1] * a + w[2] * s);
export function parity(c, k) {
  const b = k.beat.beatIndex;
  expBoard(
    c,
    b < 3
      ? 'Can the two fits explain the same request?'
      : 'What did one gradient step do to the loss?',
  );
  if (b < 3) {
    const p = cue(k, 2, 'With C set to one', 2.4),
      w = b === 2 ? penaltyFitStates[Math.round(6000 * p ** 2)] : library;
    gridTable(c, {
      x: 104,
      y: 349,
      columns: [355, 350, 375],
      headers: ['Coefficient', 'Gradient loop', b === 2 ? 'L2 fit path' : 'L-BFGS  C = ∞'],
      rows: ['Intercept', 'Ambiguity', 'Support'].map((key, i) => [
        key,
        f(fittedWeights[i]),
        f(w[i]),
      ]),
      rowH: 115,
    });
    const r = training[2];
    const scoreProgress = b === 2 ? cue(k, 2, 'Its score moves', 1.3) : 1;
    const initialScore = predict(fittedWeights, r[0], r[1]);
    const pr = initialScore + scoreProgress * (predict(w, r[0], r[1]) - initialScore);
    readout(c, 'R3   /   CUT 0.50', f(pr), 1320, 367);
    const waitForAnswer = b === 2 && scoreProgress > 0 && cue(k, 2, 'it now goes to review', 0) === 0;
    const route = waitForAnswer ? 'Which route?' : pr >= 0.5 ? 'Review' : 'Automatic';
    readout(c, 'ROUTE', route, 1320, 552, route === 'Review' ? rust : teal);
    label(c, 'Shared design [1, ambiguity, support]    ·    fit_intercept = False', 100, 803, ink);
  } else {
    label(c, '8 training requests   ·   One unpenalized step from zero', 104, 275);
    const resultSpoken = (phrase) => b > 3 || k.elapsed + 1e-9 >= k.wordCue(phrase).end;
    const showLoss = [
      true,
      resultSpoken('loss falls slightly'),
      resultSpoken('loss jumps above two'),
    ];
    for (const [i, r] of firstSteps.entries()) {
      const y = 365 + 159 * i;
      label(c, i === 0 ? r.label : 'η = ' + r.label, 120, y);
      rect(c, 390, y - 28, 1170, 56, light, 6);
      if (showLoss[i]) {
        rect(c, 390, y - 28, (1170 * r.loss) / 2.6, 56, i === 2 ? rust : teal, 6);
        label(c, f(r.loss, 4), 1600, y, ink, 'left', 35);
      }
    }
    text(
      c,
      b === 3
        ? 'Mean log loss per training request'
        : 'Compare scores near the base rate with a constant prediction.',
      960,
      858,
      38,
      ink,
      'center',
      'Serif',
    );
  }
}
export function checkExtensions() {
  assert.equal(f(multiclassSnapshot().loss, 4), '0.0055');
  assert.equal(f(stableDistribution(ordinary).lossFor(2)), '2.408');
  assert.equal(stableDistribution(extreme).lossFor(2), 2000);
  assert.equal(f(marginFixture(1.4).logistic), '0.220');
  assert.equal(f(gpFixture(0).latentStd), '0.196');
  const rank = (w) =>
    [...validationScores]
      .sort((a, b) => predict(w, b.a, b.s) - predict(w, a.a, a.s))
      .map((r) => r.id);
  assert.deepEqual(rank(library), rank(fittedWeights));
  assert.equal(f(predict(penaltyFitStates.at(-1), 2, 3), 2), '0.52');
}
