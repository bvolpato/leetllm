import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import {
  draw,
  LOGITS,
  PROBS,
  GRAD,
  TARGET,
  lossTrace,
  exponentialState,
  massState,
  gradientState,
  freshState,
  onlineLogSumExp,
  positionReduction,
  probabilityLossGradient,
  completeFrame,
} from '../animations/softmax.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';

registerLessonFonts();
const near = (a, b, tolerance = 1e-10) => assert(Math.abs(a - b) < tolerance, `${a} != ${b}`);
const cue = (phase = 'before', progress = phase === 'before' ? 0 : 1) => ({
  phase,
  progress,
  active: false,
  strength: 0,
  targets: [],
});
function frame(scene, beat, cues) {
  const canvas = createCanvas(1920, 1080),
    ctx = canvas.getContext('2d');
  const audit = drawFrame(
    ctx,
    {},
    { id: scene, title: 'Worked Softmax' },
    { beat, beatP: 0.95, t: 10, duration: 12, opacity: 1, cues, cueTiming: 'provider-words' },
    draw,
  );
  assert.deepEqual([...audit.issues, ...layoutIssues(audit)], []);
  return { audit, ctx };
}

test('stable loss agrees with the categorical gradient, including underflow and huge common offsets', () => {
  const epsilon = 1e-5;
  LOGITS.forEach((_, i) => {
    const plus = [...LOGITS],
      minus = [...LOGITS];
    plus[i] += epsilon;
    minus[i] -= epsilon;
    near(
      (lossTrace(plus, TARGET).loss - lossTrace(minus, TARGET).loss) / (2 * epsilon),
      GRAD[i],
      1e-8,
    );
  });
  near(
    lossTrace(
      LOGITS.map((z) => z + 1000),
      TARGET,
    ).loss,
    lossTrace(LOGITS, TARGET).loss,
  );
  assert.equal(lossTrace([1000, 0, -1], 1).probabilities[1], 0);
  assert.equal(lossTrace([1000, 0, -1], 1).loss, 1000);
  near(lossTrace([1e20, 1e20, 1e20], 1).loss, Math.log(3));
});

test('exponential evaluations follow their spoken cues and share one stable shift', () => {
  const cues = Object.fromEntries(['exp-ran', 'exp-slept', 'exp-ate'].map((id) => [id, cue()]));
  assert.equal(exponentialState(0, 0.99, cues).shown, 0);
  cues['exp-ran'] = cue('after');
  assert.equal(exponentialState(0, 0.99, cues).shown, 1);
  const shifted = exponentialState(1, 0.99, { 'exp-shift': cue('during', 0.5) });
  near(shifted.weights[0] / shifted.weights[1], Math.exp(2));
  assert.deepEqual(exponentialState(2, 0.99, { 'exp-offset': cue('after') }).shifted, [0, -2, -3]);
});

test('the shared score ruler and plotted values use the same baseline precision during a shift', () => {
  const { audit } = frame('scores', 1, { 'score-offset': cue('during', 0.5104) });
  for (const value of ['510.4', '511.4', '512.4', '513.4'])
    assert(audit.labels.some((l) => l.text === value && l.y < 420));
  assert(audit.labels.some((l) => l.text === 'Shared offset: +510.4'));
  assert(audit.labels.some((l) => l.text === 'ran − slept = 2'));
});

test('each denominator contribution precedes its fraction and a single-logit intervention changes every share', () => {
  const cues = Object.fromEntries(
    [0, 1, 2].flatMap((i) => [
      ['mass-add-' + i, cue()],
      ['mass-share-' + i, cue()],
    ]),
  );
  let v = massState(0, 0.99, cues);
  assert.equal(v.partial, 0);
  assert.equal(v.assigned, 0);
  cues['mass-add-0'] = cue('after');
  v = massState(0, 0.99, cues);
  near(v.partial, 1);
  cues['mass-add-1'] = cue('during', 0.5);
  v = massState(0, 0.99, cues);
  near(v.partial, 1 + 0.5 * Math.exp(-2));
  for (const i of [0, 1, 2]) {
    cues['mass-add-' + i] = cue('after');
    cues['mass-share-' + i] = cue('after');
  }
  v = massState(0, 0.99, cues);
  near(v.partial, v.total);
  assert.equal(v.assigned, 3);
  const changed = massState(1, 0.99, { 'mass-raise': cue('during', 0.5) });
  assert(changed.probabilities[1] > PROBS[1]);
  assert(changed.probabilities[0] < PROBS[0]);
  assert(changed.probabilities[2] < PROBS[2]);
  near(
    changed.probabilities.reduce((sum, p) => sum + p, 0),
    1,
  );
  assert.deepEqual(massState(2, 0.99, { 'mass-restore': cue('after') }).probabilities, PROBS);
});

test('native gradient construction withholds unspoken answers and paints each signed correction', () => {
  const cues = Object.fromEntries(
    ['gradient-target', 'gradient-0', 'gradient-1', 'gradient-2'].map((id) => [id, cue()]),
  );
  const before = frame('gradient', 0, cues).audit;
  assert(!before.targets.some((t) => t.id.startsWith('logit-gradient-')));
  assert(!before.targets.some((t) => t.id === 'one-hot-target'));
  cues['gradient-target'] = cue('after');
  cues['gradient-0'] = cue('after');
  const first = frame('gradient', 0, cues).audit;
  assert(first.targets.some((t) => t.id === 'one-hot-target'));
  assert(first.targets.some((t) => t.id === 'logit-gradient-0'));
  assert(!first.targets.some((t) => t.id === 'logit-gradient-1'));
  cues['gradient-1'] = cue('after');
  cues['gradient-2'] = cue('after');
  const { audit, ctx } = frame('gradient', 1, cues);
  for (const i of [0, 1, 2]) {
    assert(audit.labels.some((l) => l.text === (GRAD[i] >= 0 ? '+' : '') + GRAD[i].toFixed(3)));
    const x = [450, 960, 1470][i],
      y = GRAD[i] > 0 ? 787 : 795,
      pixel = ctx.getImageData(x, y, 1, 1).data;
    assert(
      pixel[1] > 80 && pixel[3] === 255,
      'the signed gradient must paint actual native bar ink',
    );
  }
  near(gradientState(2, 0.99, { 'gradient-balance': cue('after') }).sum, 0);
});

test('the loss point actually moves from the favorite to the observed word and the stable route is staged', () => {
  const before = frame('loss', 1, { 'loss-observed': cue() }).audit;
  const after = frame('loss', 1, { 'loss-observed': cue('after') }).audit;
  const point = (a) => a.targets.find((t) => t.id === 'target-loss-point');
  assert(point(after).y < point(before).y);
  assert(after.labels.some((l) => l.text === 'loss = 2.170'));
  const staged = frame('loss', 2, {
    'loss-gap': cue(),
    'loss-log-total': cue(),
    'loss-extreme': cue(),
  }).audit;
  assert(!staged.targets.some((t) => t.id === 'target-loss-value'));
  const extreme = frame('loss', 2, {
    'loss-gap': cue('after'),
    'loss-log-total': cue('after'),
    'loss-extreme': cue('after'),
  }).audit;
  assert(extreme.labels.some((l) => l.text === 'Target loss = 1000.000'));
});

test('fresh transfer keeps the answer hidden, then recomputes an actual target-improving step', () => {
  const cues = {
    'transfer-forward': cue('after'),
    'transfer-target': cue('after'),
    'transfer-gradient': cue(),
    'transfer-update': cue(),
  };
  assert(!frame('transfer', 0, cues).audit.targets.some((t) => t.id === 'fresh-gradient'));
  const before = freshState(0),
    after = freshState(1);
  assert(before.gradient[2] < 0);
  assert(after.logits[2] > before.logits[2]);
  assert(after.probabilities[2] > before.probabilities[2]);
  assert(after.loss < before.loss);
  assert(Math.abs(before.gradient[2]) < Math.abs(GRAD[1]));
  cues['transfer-gradient'] = cue('after');
  cues['transfer-update'] = cue('after');
  assert(frame('transfer', 1, cues).audit.labels.some((l) => l.text === 'ate: 0.736 − 1 = -0.264'));
  const total = lossTrace(LOGITS, TARGET).loss + before.loss;
  near(total, -Math.log(PROBS[TARGET] * before.probabilities[2]));
  assert(
    frame('transfer', 2, {
      'transfer-product': cue('after'),
      'transfer-loss-sum': cue('after'),
      'transfer-mean': cue('after'),
    }).audit.labels.some((l) => l.text === 'Mean target loss: ' + (total / 2).toFixed(3)),
  );
});

test('online vocabulary reduction rescales the retained sum when a later tile raises the maximum', () => {
  const rows = [
      [2, -1],
      [40, 0],
      [-20, 39],
    ],
    trace = onlineLogSumExp(rows);
  near(trace[1].retained, trace[0].total * Math.exp(2 - 40));
  assert.equal(trace[1].maximum, 40);
  assert.equal(trace[2].maximum, 40);
  const expected = 40 + Math.log(rows.flat().reduce((sum, z) => sum + Math.exp(z - 40), 0));
  near(trace.at(-1).logSumExp, expected);
  near(onlineLogSumExp([...rows].reverse()).at(-1).logSumExp, expected);
});

test('ignored positions contribute neither loss nor denominator, and an empty batch prevents an update', () => {
  const original = positionReduction([LOGITS, [0.5, 0, 2], [100, -100, 0]], [1, 2, -100]);
  const altered = positionReduction([LOGITS, [0.5, 0, 2], [-1e300, 1e300, 42]], [1, 2, -100]);
  assert.deepEqual(altered, original);
  assert.equal(original.count, 2);
  near(original.mean, (lossTrace(LOGITS, 1).loss + lossTrace([0.5, 0, 2], 2).loss) / 2);
  const empty = positionReduction(
    [
      [1, 2, 3],
      [4, 5, 6],
    ],
    [-100, -100],
  );
  assert.equal(empty.mean, null);
  assert.equal(empty.updateAllowed, false);
});

test('the confident-error squared-loss gradient agrees with an independent finite difference', () => {
  const logits = [8, 0, 0],
    target = [0, 1, 0],
    probabilities = lossTrace(logits, 1).probabilities;
  const actual = probabilityLossGradient(probabilities, target),
    epsilon = 1e-4;
  const squared = (values) =>
    lossTrace(values, 1).probabilities.reduce((sum, p, i) => sum + 0.5 * (p - target[i]) ** 2, 0);
  logits.forEach((_, i) => {
    const plus = [...logits],
      minus = [...logits];
    plus[i] += epsilon;
    minus[i] -= epsilon;
    near(actual[i], (squared(plus) - squared(minus)) / (2 * epsilon), 1e-9);
  });
  assert(actual[1] < 0 && Math.abs(actual[1]) < 0.001);
  const cues = { 'fresh-two-losses': cue(), 'fresh-loss-sum': cue(), 'fresh-mean-repair': cue() };
  assert.equal(completeFrame('earned-transfer', { beat: 1, beatP: 0.99, cues }).freshStage, 0);
  cues['fresh-two-losses'] = cue('after');
  assert.equal(completeFrame('earned-transfer', { beat: 1, cues }).freshStage, 1);
  cues['fresh-loss-sum'] = cue('after');
  assert.equal(completeFrame('earned-transfer', { beat: 1, cues }).freshStage, 2);
  cues['fresh-mean-repair'] = cue('during', 0.99);
  assert.equal(completeFrame('earned-transfer', { beat: 1, cues }).freshStage, 2);
  cues['fresh-mean-repair'] = cue('after');
  assert.equal(completeFrame('earned-transfer', { beat: 1, cues }).freshStage, 3);
});

test('the stable log-space total waits for the complete addition clause', () => {
  const cues = {
    'loss-gap': cue('after'),
    'loss-log-total': cue('during', 0.99),
    'loss-extreme': cue(),
  };
  assert(!frame('loss', 2, cues).audit.labels.some((l) => l.text.startsWith('Target loss =')));
  cues['loss-log-total'] = cue('after');
  assert(frame('loss', 2, cues).audit.labels.some((l) => l.text === 'Target loss = 2.170'));
});
