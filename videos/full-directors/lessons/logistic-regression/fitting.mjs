import assert from 'node:assert/strict';
import {
  sigmoid,
  logLoss,
  softplus,
  regularizedObjective,
} from '../../../films/logistic-regression/arithmetic.mjs';
import {
  training,
  validation,
  fitSteps,
  fittedWeights,
  openingRequest,
  roundedScore,
  regularizedMinimum,
} from '../../../films/logistic-regression/fixtures.mjs';
import {
  likelihoodRows,
  trainingLoss,
  curvatureFixture,
  meanHessian,
  gradientTrajectory,
  reviewRegionVertices,
  boundaryGeometry,
} from '../../../films/logistic-regression/model.mjs';
import {
  ink,
  muted,
  teal,
  rust,
  blue,
  gold,
  light,
  white,
  sea,
  rose,
  yellow,
  board,
  text,
  label,
  rect,
  dot,
  line,
  path,
  readout,
  gridTable,
  plot,
  curve,
  clamp,
  cue,
  ease,
  lerp,
  f,
  sum,
} from './paint.mjs';
const tags = ['Intercept', 'Ambiguity', 'Policy support'];
const rowGrad = ([a, s, y]) => [1, a, s].map((v) => (0.5 - y) * v);
const score = (w, [a, s]) => w[0] + w[1] * a + w[2] * s;
const teach = (c, title) => board(c, 'Model workshop   /   access requests', title);
const [zeroStart, smallStep] = gradientTrajectory(0.2, 1);
export const firstSteps = [
  { label: 'Start', ...zeroStart },
  { label: '0.2', ...smallStep },
  { label: '2.0', ...gradientTrajectory(2, 1)[1] },
];

const evidenceFeatures = [openingRequest.a, openingRequest.s];
const [roundedIntercept, roundedAmbiguity, roundedSupport] = fittedWeights.map((weight, i) =>
  Number(weight.toFixed(i === 2 ? 2 : 1)),
);
const evidenceTerms = [
  roundedIntercept,
  openingRequest.a * roundedAmbiguity,
  openingRequest.s * roundedSupport,
];
const evidenceTotals = evidenceTerms.map((_, i) => sum(evidenceTerms.slice(0, i + 1)));

function afterEvidencePhrase(k, beat, phrase, { seconds = 0, captionStart = false } = {}) {
  if (k.beat.beatIndex !== beat) return Number(k.beat.beatIndex > beat);
  const { end } = k.wordCue(phrase);
  if (captionStart) k.reveal(phrase, 0, { captionStart: phrase });
  const sinceEnd = k.elapsed - end + 1e-9;
  return seconds ? ease(clamp(sinceEnd / seconds)) : Number(sinceEnd >= 0);
}

export function evidence(c, k) {
  teach(c, 'Where did the review score come from?');
  const X = (v) => 144 + ((v + 6) / 12) * 1632;
  const axisY = 650;
  const arrowY = [509, 544, 579];
  const showIntercept = afterEvidencePhrase(k, 0, 'minus four point nine');
  const showAmbiguity = afterEvidencePhrase(k, 1, 'three times three point four');
  const showSupport = afterEvidencePhrase(k, 1, 'subtract five times point nine six');
  const progress = [
    cue(k, 0, 'Set the starting mark', 1.1),
    afterEvidencePhrase(k, 1, 'right by ten point two', { seconds: 0.65 }),
    afterEvidencePhrase(k, 2, 'Half a unit above zero', {
      seconds: 1.1,
      captionStart: true,
    }),
  ];
  const [ambiguity, support] = evidenceFeatures;
  const cards = [
    ['Intercept', f(evidenceTerms[0], 2), showIntercept, rust],
    ['Ambiguity', `${ambiguity} × ${f(roundedAmbiguity, 2)}`, showAmbiguity, teal],
    ['Policy support', `${support} × (${f(roundedSupport, 2)})`, showSupport, rust],
  ];
  label(c, `${openingRequest.id}     ambiguity ${ambiguity}     support ${support}`, 96, 274);
  for (const [i, [name, term, visible, color]] of cards.entries()) {
    const x = 112 + i * 574;
    rect(c, x, 322, 548, 136, white, 9);
    label(c, name, x + 26, 357, muted, 'left', 30);
    if (visible) text(c, term, x + 26, 414, 47, color, 'left', 'Mono', 500);
    if (i === 1 && progress[1] === 1)
      label(c, `+${f(evidenceTerms[1], 2)}`, x + 521, 414, color, 'right', 32);
    if (i === 2 && progress[2] === 1)
      label(c, f(evidenceTerms[2], 2), x + 521, 414, color, 'right', 32);
  }

  line(c, X(0), 480, X(0), axisY, light, 3);
  line(c, X(-6), axisY, X(6), axisY, muted, 4);
  for (let tick = -6; tick <= 6; tick++) {
    const major = tick % 2 === 0;
    line(c, X(tick), axisY, X(tick), axisY + (major ? 18 : 9), muted, 2);
    if (major) label(c, f(tick, 0), X(tick), 697, ink, 'center', 29);
  }

  let cursor = 0;
  let active = -1;
  for (const [i, portion] of progress.entries()) {
    if (portion === 0) break;
    const y = arrowY[i];
    const start = X(cursor);
    cursor = lerp(cursor, evidenceTotals[i], portion);
    const tip = X(cursor);
    const direction = Math.sign(evidenceTerms[i]);
    const color = cards[i][3];
    if (i > 0) line(c, start, arrowY[i - 1], start, y, light, 3);
    line(c, start, y, tip, y, color, 8);
    if (Math.abs(tip - start) >= 20) {
      const back = tip - 17 * direction;
      path(c, [[back, y - 10], [tip, y], [back, y + 10]], color, 5);
    }
    active = i;
    if (portion < 1) break;
  }
  if (active >= 0) line(c, X(cursor), arrowY[active], X(cursor), 593, muted, 2);
  dot(c, X(cursor), axisY, 13, ink, white);
  if (active >= 0 && progress[active] === 1 && (active !== 0 || showIntercept))
    label(c, f(cursor, 2), X(cursor), 616, ink, 'center', 32);
  label(
    c,
    progress[2] === 1 && afterEvidencePhrase(k, 2, 'This signed sum is the logit')
      ? 'Logit from rounded weights'
      : 'Running sum',
    960,
    753,
    muted,
    'center',
    31,
  );

  if (cue(k, 1, 'Where will that last move', 0) && progress[2] === 0)
    text(c, 'Where does the sum land?', 960, 851, 44, ink, 'center', 'Serif');

  if (afterEvidencePhrase(k, 2, 'about point six two two', { captionStart: true })) {
    const logit = evidenceTotals.at(-1);
    readout(
      c,
      'ROUNDED WEIGHTS',
      `σ(${f(logit, 2)}) ≈ ${f(sigmoid(logit))}`,
      165,
      792,
      teal,
      46,
    );
  }
  if (afterEvidencePhrase(k, 2, 'point six two four', { captionStart: true })) {
    readout(
      c,
      'FULL FIT',
      `z ≈ ${f(score(fittedWeights, evidenceFeatures))}  →  p ≈ ${f(openingRequest.p)}`,
      1025,
      792,
      teal,
      46,
    );
  }
}
export function groove(c, k) {
  teach(c, 'How far does a two-unit push lift each pin?');
  const b = k.beat.beatIndex,
    g = plot(c, {
      w: 1130,
      h: 431,
      xrange: [-4, 7],
      yrange: [0, 1],
      yticks: [0, 0.25, 0.5, 0.75, 1],
      xticks: [-4, -2, 0, 2, 4, 6],
      xlabel: 'Logit',
      ylabel: 'Probability that review is required',
    });
  curve(c, g, sigmoid, -4, 7, ink, 10);
  if (cue(k, 2, 'At a zero logit', 0.3) === 1) {
    dot(c, ...g.xy(0, sigmoid(0)), 9, gold, ink);
    label(c, 'p = 0.50', g.X(0) - 19, g.Y(sigmoid(0)) - 23, ink, 'right');
  }
  for (const [i, start, col, p] of [
    [0, -1, rust, cue(k, 0, 'Move the middle pin', 1.8)],
    [1, 4, blue, cue(k, 1, 'Give the tail pin', 1.8)],
  ]) {
    const z = start + 2 * p,
      base = sigmoid(start),
      end = sigmoid(z);
    line(c, g.X(start), g.Y(base), g.X(z), g.Y(base), col, 3);
    line(c, g.X(z), g.Y(base), g.X(z), g.Y(end), col, 6);
    dot(c, ...g.xy(start, base), 8, white, col);
    dot(c, ...g.xy(z, end), 13, col, ink);
    readout(
      c,
      i ? 'TAIL   /   4 → 6' : 'MIDDLE   /   −1 → 1',
      '+' + f((end - base) * 100, 1) + ' pp',
      1360,
      347 + i * 180,
      col,
    );
    label(c, f(base * 100, 1) + '% → ' + f(end * 100, 1) + '%', 1360, 455 + i * 180, col);
  }
  text(
    c,
    b === 2
      ? 'log odds = log(p / (1 − p))      ·      +1 logit multiplies the odds by e'
      : 'p = 1 / (1 + exp(−z))',
    960,
    864,
    35,
    ink,
    'center',
    'Mono',
  );
}
function geomPlot(c, w, t) {
  const g = plot(c, {
    x: 200,
    y: 252,
    w: 600,
    h: 500,
    xrange: [-1, 5],
    yrange: [-1, 4],
    xticks: [-1, 0, 1, 2, 3, 4, 5],
    yticks: [-1, 0, 1, 2, 3, 4],
    xlabel: 'Feature 1',
    ylabel: 'Feature 2',
  });
  const l = Math.log(t / (1 - t));
  c.save();
  c.beginPath();
  c.rect(g.X(-1), g.Y(4), 600, 500);
  c.clip();
  if (w[2] !== 0) curve(c, g, (x) => (l - w[0] - w[1] * x) / w[2], -1, 5, teal);
  else if (w[1] !== 0)
    line(c, g.X((l - w[0]) / w[1]), g.Y(4), g.X((l - w[0]) / w[1]), g.Y(-1), teal, 6);
  c.restore();
  return g;
}
export function geometry(c, k) {
  const b = k.beat.beatIndex;
  teach(
    c,
    b < 2
      ? 'Can a straight-line prediction be a probability?'
      : 'How far is the point from the review boundary?',
  );
  if (b < 2) {
    const g = plot(c, {
      xrange: [0, 4],
      yrange: [-0.5, 1.5],
      xticks: [0, 1, 2, 3, 4],
      yticks: [-0.5, 0, 0.5, 1, 1.5],
      xlabel: 'Feature value',
      ylabel: 'Fitted value',
    });
    rect(c, g.X(0), g.Y(1), 1050, g.Y(0) - g.Y(1), sea);
    const fn = (x) => 0.38 * x - 0.2;
    curve(c, g, fn, 0, 4, rust);
    [0, 1, 2, 3, 4].forEach((x) => dot(c, ...g.xy(x, fn(x)), 9, rust));
    readout(c, 'LINEAR FIT AT x = 0', '−0.20', 1285, 346, rust);
    readout(c, 'BERNOULLI VARIANCE', 'p(1 − p)', 1285, 546);
    if (b === 1) text(c, 'Brier loss = (p − y)²', 1285, 770, 34, ink);
    return;
  }
  let w = [1, 3, -4],
    t = 0.5;
  if (b === 4) t = 0.5 + 0.3 * cue(k, 4, 'It shifts', 1.3);
  if (b === 5) w = cue(k, 5, 'if every feature coefficient', 0.4) === 1 ? [1, 0, 0] : [1, 3, 0];
  const v = boundaryGeometry(w, [2, 1], t),
    g = geomPlot(c, w, t);
  dot(c, ...g.xy(2, 1), 14, rust);
  label(c, '(2, 1)', g.X(2) + 20, g.Y(1) + 23, rust);
  if (!v.constant && b >= 3) {
    line(c, ...g.xy(2, 1), ...g.xy(...v.projection), rust, 5);
    dot(c, ...g.xy(...v.projection), 8, teal);
  }
  readout(
    c,
    'INTERCEPT    /    FEATURE WEIGHTS',
    w[0] + '    [' + w.slice(1).join(', ') + ']',
    1020,
    300,
  );
  readout(c, 'LOGIT     /     THRESHOLD', f(v.logit, 2) + '     ' + f(t, 2), 1020, 462);
  if (b >= 3)
    readout(
      c,
      v.constant ? 'DECISION SURFACE' : 'PERPENDICULAR DISTANCE',
      v.constant ? 'Constant score' : f(Math.abs(v.distance), 3) + ' feature units',
      1020,
      628,
      v.constant ? rust : teal,
      46,
    );
  text(
    c,
    b === 4
      ? 'p = ' + f(v.probability) + '   →   ' + (v.probability >= t ? 'review' : 'automatic')
      : b === 5
        ? 'The feature units set the distance scale.'
        : 'Signed offset at 0.50 = z / ‖β‖',
    1020,
    780,
    33,
  );
  if (b === 3) text(c, 'Distance = |z| / ‖β‖', 1020, 830, 33, teal);
}
export function loss(c, k) {
  teach(c, 'How expensive is a confident wrong prediction?');
  const b = k.beat.beatIndex;
  if (b === 3) {
    const z = -1000;
    readout(c, 'LOGIT   /   REQUIRED LABEL', z + '   /   1', 112, 330);
    readout(c, 'ROUNDED SIGMOID', '0', 112, 550, rust);
    readout(c, 'STABLE LOSS', 'softplus(z) − y z', 910, 330, teal, 54);
    readout(c, 'FROM THE FINITE LOGIT', f(logLoss(z, 1), 0) + ' nats', 910, 550, teal);
    text(c, 'softplus(z) = max(z, 0) + log1p(exp(−|z|))', 960, 774, 45, ink, 'center', 'Mono');
    return;
  }
  const p = 0.5 - 0.4 * cue(k, 2, 'Move the prediction down', 1) + 0.8 * cue(k, 2, 'Move up', 1);
  const g = plot(c, {
    h: 423,
    xrange: [0.05, 1],
    yrange: [0, 3.1],
    xticks: [0.1, 0.5, 0.9],
    yticks: [0, 1, 2, 3],
    xlabel: 'Probability assigned to the actual label',
    ylabel: 'Loss (nats)',
  });
  curve(c, g, (x) => -Math.log(x), 0.05, 1, teal);
  dot(c, ...g.xy(p, -Math.log(p)), 15, rust);
  readout(c, 'OBSERVED LABEL', 'Required', 1280, 350);
  readout(c, 'p OF THAT LABEL', f(p, 2), 1280, 514);
  if (b !== 1) readout(c, '−log(p)', f(-Math.log(p)) + ' nats', 1280, 684, rust, 44);
  else text(c, '0.10 or 0.90?', 1280, 745, 51, ink, 'left', 'Serif');
}
export function likelihood(c, k) {
  teach(c, 'Which half of each probability strip counts?');
  const rows = likelihoodRows(),
    b = k.beat.beatIndex;
  const n = b === 0 ? Math.max(1, Math.ceil(cue(k, 0, 'A positive label', 2) * 8)) : 8;
  for (const [i, r] of rows.entries()) {
    const y = 300 + i * 72;
    label(c, r.id + '  y=' + r.y, 100, y);
    rect(c, 280, y - 17, 720, 34, light, 4);
    rect(c, 280, y - 17, 720 * r.p, 34, i < n && r.y ? rust : rose, 3);
    rect(c, 280 + 720 * r.p, y - 17, 720 * (1 - r.p), 34, i < n && !r.y ? teal : sea, 3);
    if (i < n) label(c, f(r.selected), 1041, y, r.y ? rust : teal);
  }
  label(c, 'ACTUAL LABEL  /  SELECTED PROBABILITY', 1215, 705, ink);
  label(c, 'Required (y=1)   →   p', 1215, 749, rust);
  label(c, 'Routine (y=0)    →   1 − p', 1215, 793, teal);
  const prod = rows.reduce((a, r) => a * r.selected, 1);
  const info = [
    ['SELECTED MASS', 'y=1: p   y=0: 1−p'],
    ['LIKELIHOOD', 'Π qᵢ = ' + f(prod, 4)],
    ['MEAN CROSS-ENTROPY', f(-Math.log(prod) / 8, 4) + ' nats'],
    ['SQUARED ERROR   /   SLOPE IN p', '2(p − y)'],
    ['ONE HARD TARGET', 'H(target) = 0'],
    ['POPULATION OPTIMUM', 'p = P(Y=1 | x)'],
  ][b];
  readout(c, info[0], info[1], 1230, 384, teal, 40);
  const other = [
    'One selected mass per row',
    'Condition on the input rows.',
    'Sum gradient = 8 × mean gradient',
    'Half-squared loss drops the 2.',
    'CE(target, p) = KL(target ‖ p)',
    'The next label is still uncertain.',
  ][b];
  text(c, other, 1215, 609, 29, ink);
}
export function curvature(c, k) {
  const b = k.beat.beatIndex;
  if (b === 5) {
    teach(c, 'How does step size change the first update?');
    label(c, '8 training requests   ·   One unpenalized step from zero', 104, 295);
    const showWeights = [
      true,
      cue(k, 5, 'Both feature weights rise', 0),
      cue(k, 5, 'Both weights move ten times', 0),
    ];
    const showLoss = [
      true,
      cue(k, 5, 'Now restart from zero', 0),
      cue(k, 5, 'The larger step overshoots', 0),
    ];
    gridTable(c, {
      y: 375,
      columns: [310, 300, 390, 390, 340],
      headers: ['Step size', 'Intercept', 'Ambiguity weight', 'Support weight', 'Mean log loss'],
      rows: firstSteps.map(({ label, weights, loss }, i) => [
        label,
        ...weights.map((value, j) => {
          if (!showWeights[i]) return '·';
          return value === 0 ? '0' : f(value, j === 1 ? 5 : 3);
        }),
        showLoss[i] ? f(loss) : '·',
      ]),
      rowH: 118,
    });
    return;
  }
  teach(
    c,
    b < 2
      ? 'How much signal survives a confident miss?'
      : b < 4
        ? 'Does every weight direction have curvature?'
        : 'Can convex loss keep falling forever?',
  );
  if (b < 2) {
    const v = curvatureFixture();
    label(c, 'REQUIRED CASE   /   LOGIT −8', 105, 304);
    for (const [i, [name, value, color]] of [
      ['Binary cross-entropy', v.bce, rust],
      ['Squared error', v.squaredError, blue],
    ].entries()) {
      const y = 450 + i * 213;
      text(c, name, 97, y, 42);
      line(c, 610, y, 1470, y, light, 3);
      if (i === 0 || b === 1) {
        const x = 1470 + value * 825;
        line(c, 1470, y, x, y, color, 10);
        dot(c, x, y, 7, color);
        label(c, f(value, 6), 1520, y, color, 'left', 32);
      }
    }
    text(c, '∂p / ∂z  =  p(1 − p)', 966, 882, 46, muted, 'center', 'Mono');
    return;
  }
  if (b < 4) {
    const H = meanHessian();
    gridTable(c, {
      x: 94,
      y: 350,
      columns: [255, 250, 250, 250],
      headers: ['H at w = 0', 'Intercept', 'Ambiguity', 'Support'],
      rows: H.map((r, i) => [tags[i], ...r.map((v) => f(v))]),
      rowH: 99,
    });
    readout(c, 'HESSIAN', 'Xᵀ D X / n', 1190, 365);
    readout(
      c,
      b === 2 ? 'EACH DIAGONAL WEIGHT' : 'DUPLICATE COLUMNS',
      b === 2 ? 'D[i,i] = p(1 − p)' : 'Δw = (+a, −a)',
      1190,
      581,
      teal,
      43,
    );
    if (b === 3) text(c, 'Equal columns cancel that change in every logit.', 100, 863, 41);
    return;
  }
  const a = 1 + 4 * cue(k, 4, 'Turn up the coefficient', 2);
  gridTable(c, {
    y: 370,
    columns: [360, 370, 390, 450],
    headers: ['Feature', 'Label', 'Logit', 'p(required)'],
    rows: [
      [-1, 0, f(-a), f(sigmoid(-a))],
      [1, 1, f(a), f(sigmoid(a))],
    ],
    rowH: 116,
  });
  readout(c, 'WEIGHT', f(a, 2), 100, 723);
  readout(c, 'MEAN LOSS', f(softplus(-a), 4), 850, 723);
}
export function gradient(c, k) {
  teach(c, 'What signal reaches each weight?');
  const b = k.beat.beatIndex;
  if (!b) {
    const cancel = cue(k, 0, 'Cancel the shared factor', 0.6);
    text(c, 'p − y', 465, 400, 78, ink, 'center', 'Mono');
    line(c, 180, 482, 748, 482, ink, 5);
    text(c, 'p(1 − p)', 465, 556, 71, teal, 'center', 'Mono');
    text(c, '×', 863, 477, 76, ink, 'center');
    text(c, 'p(1 − p)', 1196, 480, 71, teal, 'center', 'Mono');
    if (cancel > 0) {
      line(c, 274, 583, lerp(274, 660, cancel), lerp(583, 526, cancel), rust, 7);
      line(c, 1000, 507, lerp(1000, 1384, cancel), lerp(507, 450, cancel), rust, 7);
    }
    if (cancel === 1) text(c, '∂loss / ∂wⱼ   =   (p − y) xⱼ', 960, 810, 57, ink, 'center', 'Mono');
    return;
  }
  const r = training[3],
    xs = [1, ...r.slice(0, 2)],
    vals = rowGrad(r);
  const show = cue(k, 1, 'so its residual', 0.4) === 1,
    times = cue(k, 1, 'Multiply by the intercept', 1.2);
  label(c, 'R4   /   p = 0.50     y = 1' + (show ? '     residual = −0.50' : ''), 106, 314);
  gridTable(c, {
    x: 145,
    y: 425,
    columns: [520, 520, 520],
    headers: tags,
    rows: [
      xs,
      xs.map((v, i) => (times * 3 > i ? '−0.5 × ' + v : '·')),
      vals.map((v, i) => (times * 3 >= i + 1 ? f(v, 2) : '·')),
    ],
    rowH: 110,
    highlight: 2,
  });
}
export function batch(c, k) {
  const last = k.beat.beatIndex > 1 ||
    (k.beat.beatIndex === 1 && k.elapsed + 1e-9 >= k.wordCue('Wait for the eighth row').end);
  const n = last ? 8 : Math.round(7 * cue(k, 1, 'Bring in all eight', 3.2)),
    mean = last && cue(k, 1, 'Now divide', 0.5) === 1,
    updated = cue(k, 2, 'Subtract the mean', 0.7) === 1;
  teach(c, updated ? 'One full-batch update' : last ? 'All eight contributions are in' : 'Wait for the eighth row before updating');
  const rows = training.map((r, i) => [
    'R' + (i + 1),
    r[2],
    ...rowGrad(r).map((v) => (i < n ? f(v, 2) : '·')),
  ]);
  gridTable(c, {
    x: 90,
    y: 251,
    columns: [125, 125, 253, 253, 253],
    headers: ['Case', 'Label', ...tags],
    rows,
    rowH: 64,
    highlight: n - 1,
  });
  const totals = [0, 1, 2].map((j) => sum(training.slice(0, n).map((r) => rowGrad(r)[j])));
  readout(
    c,
    n + ' OF 8 COLLECTED   /   SUM',
    totals.map((v) => f(v, 2)).join('   '),
    1190,
    327,
    ink,
    39,
  );
  if (mean)
    readout(c, 'MEAN GRADIENT', totals.map((v) => f(v / 8, 5)).join('  '), 1190, 525, teal, 34);
  if (updated)
    readout(
      c,
      'NEW WEIGHTS   /   η = 0.2',
      fitSteps[1].map((v) => f(v)).join('   '),
      1190,
      726,
      teal,
      39,
    );
}
export function shapes(c, k) {
  const b = k.beat.beatIndex;
  teach(
    c,
    b < 2
      ? 'Who owns each label and each logit?'
      : b < 4
        ? 'Why did both feature weights rise?'
        : 'Which weights produced the printed loss?',
  );
  if (b < 2) {
    const spread = b === 1 ? 1 : cue(k, 0, 'can broadcast', 1.8);
    label(c, 'ONE REQUEST PER PAIR', 135, 301);
    label(c, '(8, 1) × (8,)    /    BROADCAST', 1015, 301);
    for (let i = 0; i < 8; i++) {
      label(c, 'R' + (i + 1), 141, 376 + 64 * i);
      rect(c, 215, 356 + 64 * i, 319, 43, sea, 4);
      label(c, 'y' + (i + 1) + '   ↔   z' + (i + 1), 242, 376 + 64 * i, ink);
      for (let j = 0; j < 8; j++) {
        if (i === j || i * 8 + j < Math.floor(spread * 64))
          rect(c, 1030 + j * 67, 360 + i * 61, 53, 45, i === j ? teal : rose, 4);
      }
    }
    if (b === 1)
      text(c, '8 matching pairs  +  56 cross-request pairs', 1410, 908, 33, rust, 'center');
    return;
  }
  if (b < 4) {
    const means = (y) =>
      [0, 1].map((j) => sum(training.filter((r) => r[2] === y).map((r) => r[j])) / 4);
    gridTable(c, {
      x: 140,
      y: 365,
      columns: [370, 340, 340],
      headers: ['Class mean', 'Ambiguity', 'Support'],
      rows: [
        ['Required', ...means(1).map((v) => f(v, 2))],
        ['Routine', ...means(0).map((v) => f(v, 2))],
      ],
      rowH: 115,
    });
    readout(c, 'SUPPORT WEIGHT', b === 2 ? f(fitSteps[1][2]) : f(fittedWeights[2]), 1320, 433);
    label(c, b === 2 ? 'First update' : 'Joint fit', 1320, 565);
    return;
  }
  gridTable(c, {
    x: 120,
    columns: [280, 340, 340, 340, 360],
    headers: ['After update', ...tags, 'Mean loss'],
    rows: [1, 201, 501, 1001, 3000].map((i) => [
      i,
      ...fitSteps[i].map((v) => f(v)),
      f(trainingLoss(fitSteps[i]), 4),
    ]),
    rowH: 91,
  });
}
function plane(c, w, t, spot = false, points = training, height = 515) {
  const g = plot(c, {
    w: 1050,
    h: height,
    xrange: [0.5, 5],
    yrange: [0, 9],
    xticks: [1, 2, 3, 4, 5],
    yticks: [0, 3, 6, 9],
    xlabel: 'Ambiguity',
    ylabel: 'Support for automatic handling',
  });
  const poly = reviewRegionVertices(w, t);
  if (poly.length)
    path(
      c,
      poly.map((p) => g.xy(p.x, p.y)),
      null,
      0,
      sea,
    );
  const bound = poly.filter((p) => Math.abs(score(w, [p.x, p.y]) - Math.log(t / (1 - t))) < 1e-6);
  if (bound.length === 2)
    line(c, ...g.xy(bound[0].x, bound[0].y), ...g.xy(bound[1].x, bound[1].y), teal, 6);
  points.forEach(([a, s, y], i) => {
    const pos = g.xy(a, s);
    if (sigmoid(score(w, [a, s])) >= t) dot(c, ...pos, 20, white, gold);
    dot(c, ...pos, 11, y ? rust : blue);
    if (spot && i === 2) label(c, 'R3', pos[0] - 20, pos[1] - 32, rust);
  });
  label(c, '● required', 1300, 813, rust);
  label(c, '● routine', 1545, 813, blue);
}
export function learn(c, k) {
  teach(c, 'Which request stays on the automatic side?');
  const i = Math.round(Math.exp(Math.log(3001) * cue(k, 0, 'Watch the boundary', 4.5)) - 1),
    w = fitSteps[i];
  plane(c, w, 0.5, k.beat.beatIndex === 1, training, 478);
  readout(c, 'UPDATE ' + i + '   /   MEAN LOSS', f(trainingLoss(w), 4), 1300, 315);
  readout(c, 'AMBIGUITY     SUPPORT', f(w[1]) + '    ' + f(w[2]), 1300, 493, teal, 40);
  if (k.beat.beatIndex === 1)
    readout(
      c,
      'R3   /   REQUIRED',
      f(sigmoid(score(w, training[2]))) + ' < 0.50',
      1300,
      659,
      rust,
      40,
    );
}
export function separation(c, k) {
  teach(c, 'Where does the weight stop growing?');
  const b = k.beat.beatIndex;
  const a = 1 + cue(k, 0, 'Double the coefficient', 1) + 2 * cue(k, 0, 'Double it again', 1);
  const at = lerp(a, regularizedMinimum, cue(k, 1, 'finite preferred scale', 1.5));
  const g = plot(c, {
    h: 419,
    xrange: [0, 5],
    yrange: [0, 2.8],
    xticks: [0, 1, 2, 3, 4, 5],
    yticks: [0, 1, 2],
    xlabel: 'Weight for two separable cases',
    ylabel: 'Objective',
  });
  curve(c, g, (x) => softplus(-x), 0, 5, teal);
  if (b === 1) curve(c, g, regularizedObjective, 0, 5, rust);
  dot(c, ...g.xy(at, softplus(-at)), 13, teal);
  if (b === 1) dot(c, ...g.xy(at, regularizedObjective(at)), 13, rust);
  readout(c, 'COEFFICIENT', f(at, 2), 1300, 291);
  readout(c, 'LOG LOSS', f(softplus(-at), 4), 1300, 435);
  if (b === 1) readout(c, 'WITH 0.1 × WEIGHT²', f(regularizedObjective(at), 4), 1300, 565, rust);
  gridTable(c, {
    x: 1235,
    y: 674,
    columns: [180, 151, 229],
    headers: ['Case', 'Logit', 'p(required)'],
    rows: [
      ['Routine', f(-at, 2), f(sigmoid(-at))],
      ['Required', f(at, 2), f(sigmoid(at))],
    ],
    rowH: 56,
  });
}
export function thresholdPlane(c, k) {
  const t = 0.5 - 0.3 * cue(k, 1, 'Slide the line', 1.9);
  teach(c, 'A new cut for the same eight scores');
  plane(c, fittedWeights, t, false, validation, 410);
  readout(c, 'ACTION THRESHOLD', f(t, 2), 1300, 335);
  readout(c, 'REQUIRED LOGIT', f(Math.log(t / (1 - t))), 1300, 503);
  readout(
    c,
    'REVIEW RINGS',
    validation.filter((r) => sigmoid(score(fittedWeights, r)) >= t).length + ' / 8',
    1300,
    664,
    ink,
    47,
  );
}
export function checkFitting() {
  assert.deepEqual(evidenceTerms.map((term) => f(term, 2)), ['−4.90', '10.20', '−4.80']);
  assert.deepEqual(evidenceTotals.map((total) => f(total, 2)), ['−4.90', '5.30', '0.50']);
  assert.equal(evidenceTotals.at(-1), roundedScore);
  assert.equal(f(sigmoid(evidenceTotals.at(-1))), '0.622');
  assert.equal(f(score(fittedWeights, evidenceFeatures)), '0.507');
  assert.equal(f(sigmoid(score(fittedWeights, evidenceFeatures))), f(openingRequest.p));
  assert.equal(f(openingRequest.p), '0.624');
  assert.equal(f(sigmoid(score(fittedWeights, training[2]))), '0.274');
  assert.deepEqual(rowGrad(training[3]), [-0.5, -1.75, -3]);
  assert.deepEqual(
    [0, 1, 2].map((j) => f(sum(training.map((r) => rowGrad(r)[j])) / 8, 5)),
    ['0.00000', '−0.34375', '−0.37500'],
  );
  assert.equal(f(boundaryGeometry([1, 3, -4], [2, 1]).distance), '0.600');
  assert.equal(training.length, 8);
  assert.equal(f(softplus(-5), 4), '0.0067');
  assert.deepEqual(
    firstSteps.map(({ label, weights, loss }) => [
      label,
      ...weights.map((w) => Number(w.toFixed(5))),
      f(loss, 4),
    ]),
    [
      ['Start', 0, 0, 0, '0.6931'],
      ['0.2', 0, 0.06875, 0.075, '0.6830'],
      ['2.0', 0, 0.6875, 0.75, '2.1775'],
    ],
  );
}
