import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import * as animation from '../animations/rnn-memory.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { arrowheadDiagnostics } from '../audit-arrowheads.mjs';
import { createTextInkAudit } from '../lib/text-ink-audit.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
const cue = (progress) => ({
  phase: progress < 0 ? 'before' : progress === 1 ? 'after' : 'during',
  progress: Math.max(0, progress),
  strength: 0,
});
test('the actor feature survives intervening words and reverses with the sentence', () => {
  const dog = animation.actorMemoryTrace('dog'),
    cat = animation.actorMemoryTrace('cat');
  assert.deepEqual(dog.inputs, [0, 0.8, 0, 0, 0]);
  assert.deepEqual(cat.inputs, [0, -0.8, 0, 0, 0]);
  for (const trace of [dog, cat]) {
    assert.equal(trace.states.length, 6);
    trace.inputs.forEach((input, index) => {
      assert.equal(trace.states[index + 1], Math.tanh(input + 0.9 * trace.states[index]));
    });
  }
  assert.ok(Math.abs(dog.states[2] - 0.6640367702678491) < 1e-12);
  assert.ok(dog.final > 0 && cat.final < 0);
  assert.ok(Math.abs(dog.final + cat.final) < 1e-12);
  assert.notEqual(dog.padded, dog.final);
  assert.throws(() => animation.actorMemoryTrace('mouse'));
});
test('the LSTM join constructs actual weighted terms and a retained sum at its cue', () => {
  const state = (progress) => ({
    beat: 1,
    beatP: 0.6,
    opacity: 1,
    t: 29,
    duration: 53,
    cues: {
      'lstm-retained-term': cue(1),
      'lstm-written-term': cue(1),
      'next-cell-b2-1': cue(progress),
    },
  });
  const paint = (progress) =>
    drawFrame(
      createCanvas(1920, 1080).getContext('2d'),
      {},
      { id: 'lstm', title: 'Memory' },
      state(progress),
      animation.draw,
    );
  assert(
    !paint(-1).labels.some((label) => label.text === 'cell ≈ 0.840'),
    'The cell answer must not precede its join cue',
  );
  const before = animation.lstmJoinFrame(state(-1)),
    partial = animation.lstmJoinFrame(state(0.5)),
    complete = animation.lstmJoinFrame(state(1));
  assert.equal(before.count, 0);
  assert.equal(partial.sum, 0.98 * 0.855);
  assert.equal(complete.sum, 0.98 * 0.855 + 0.02 * 0.1);
  assert(paint(1).labels.some((label) => label.text.includes('0.8399')));
  assert.equal(animation.lstmJoinFrame({ beat: 2, beatP: 0 }).sum, complete.sum);
});
test('measured LSTM packet arrival at 30 seconds keeps both triangular arrow tips clear', () => {
  // This is frame 900 of the held 0061 measured timeline, at the end of the provider-timed "Watch the two amounts join" cue.
  const state = {
    beat: 1,
    beatP: 0.6608802205657103,
    t: 30,
    duration: 53.3,
    opacity: 1,
    sceneIndex: 4,
    sceneCount: 8,
    cues: {
      'lstm-retained-term': { phase: 'after', progress: 1, reveal: 1, strength: 0 },
      'lstm-written-term': { phase: 'after', progress: 1, reveal: 1, strength: 0 },
      'next-cell-b2-1': { phase: 'during', progress: 0.9951020408163264, reveal: 1, strength: 1 },
    },
  };
  const frame = drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    {},
    { id: 'lstm', title: 'Memory' },
    state,
    animation.draw,
  );
  const { warnings } = arrowheadDiagnostics(frame);
  assert.deepEqual(
    warnings,
    [],
    'moving contribution markers must clear the receiving arrow heads as the cell value settles',
  );
  const arrows = frame.connectors.filter(({ id }) => id === 'connector-2' || id === 'connector-3');
  assert.equal(arrows.length, 2);
  for (const arrow of arrows) {
    assert.equal(arrow.head.length, 3, `${arrow.id} remains a triangular arrow head`);
    const [a, b, c] = arrow.head;
    assert.notEqual(
      (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x),
      0,
      `${arrow.id} has visible triangular area`,
    );
  }
});
test('reset placement uses the same real two-coordinate multiplication in both orders', () => {
  const result = animation.gruResetComparison();
  const close = (actual, expected) =>
    actual.forEach((value, i) => assert(Math.abs(value - expected[i]) < 1e-12));
  close(result.before, [-0.28, -0.48]);
  close(result.after, [0.04, 1.44]);
  close(result.beforeCandidate, result.before.map(Math.tanh));
  close(result.afterCandidate, result.after.map(Math.tanh));
  assert(
    result.beforeCandidate.some((value, i) => Math.abs(value - result.afterCandidate[i]) > 0.1),
  );
  const uniform = animation.gruResetComparison({ reset: [0.5, 0.5] });
  close(uniform.before, uniform.after);
});
test('the exact-equations comparison paints both candidate computations after the blend', () => {
  const audit = drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    {},
    { id: 'gru', title: 'GRU' },
    {
      beat: 2,
      beatP: 0.9,
      t: 54,
      duration: 59,
      opacity: 1,
      cues: {
        'gru-reset-after': cue(1),
        'gru-reset-before': cue(1),
        'gru-interpolation-rule-b3-1': cue(0.5),
      },
    },
    animation.draw,
  );
  const model = animation.gruResetComparison();
  for (const [id, values] of [
    ['gru-after-calculation', model.afterCandidate],
    ['gru-before-calculation', model.beforeCandidate],
  ]) {
    const target = audit.targets.find((target) => target.id === id);
    assert(
      target?.markCounts.shapes >= 3,
      'The comparison must paint both candidate-vector computations',
    );
    const labels = audit.labels
      .filter((label) => label.x >= target.x && label.x <= target.x + target.width && label.y > 840)
      .map((label) => label.text);
    for (const value of values) assert(labels.includes(value.toFixed(3)));
  }
  const phases = animation.gruComparisonFrame({
    cues: { 'gru-reset-after': cue(0.5), 'gru-reset-before': cue(-1) },
  });
  assert.equal(phases.afterStage, 1);
  assert.equal(phases.beforeStage, 0);
});
test('incident backward credit matches independent central finite differences', () => {
  const model = animation.incidentModel(),
    inputs = [1, 0.4, 0.9],
    epsilon = 1e-5;
  const execute = (values, weight = 0.5, initial = 0) =>
    values.reduce((hidden, input) => Math.tanh(0.8 * input + weight * hidden), initial);
  const derivative = (positive, negative) => (positive - negative) / (2 * epsilon);
  inputs.forEach((_, i) => {
    const plus = [...inputs],
      minus = [...inputs];
    plus[i] += epsilon;
    minus[i] -= epsilon;
    assert.ok(Math.abs(derivative(execute(plus), execute(minus)) - model.inputGradient[i]) < 1e-8);
  });
  assert.ok(
    Math.abs(
      derivative(execute(inputs, 0.5 + epsilon), execute(inputs, 0.5 - epsilon)) -
        model.weightGradient,
    ) < 1e-8,
  );
  const carried = execute(inputs.slice(0, 2));
  const lastUse = derivative(
    execute([inputs[2]], 0.5 + epsilon, carried),
    execute([inputs[2]], 0.5 - epsilon, carried),
  );
  assert.ok(Math.abs(lastUse - model.weightTerms[2]) < 1e-8);
  assert.notEqual(
    lastUse,
    model.weightGradient,
    'Detachment preserves the forward state while removing earlier local weight contributions',
  );
});
test('the fresh prediction exposes only the numerical states whose spoken reveals have started', () => {
  const frame = (beat, cues) =>
    animation.incidentFrame('earned-transfer', { beat, beatP: 1, cues });
  assert.equal(frame(0, {}).freshVisible, 0);
  assert.equal(frame(1, {}).freshVisible, 0);
  assert.equal(frame(1, { 'fresh-first-result': cue(0) }).freshVisible, 1);
  assert.equal(frame(1, { 'fresh-second-result': cue(0) }).freshVisible, 2);
  assert.equal(frame(1, { 'fresh-pad-result': cue(0) }).freshVisible, 3);
  assert.equal(frame(2, {}).freshVisible, 3);
});
test('active incident event numbers paint contrasting ink inside their filled markers', () => {
  registerLessonFonts();
  for (const [beat, beatP, active] of [
    [1, 0.2, 0],
    [1, 0.8, 1],
    [2, 0.5, 2],
  ]) {
    const canvas = createCanvas(1920, 1080),
      ink = createTextInkAudit(canvas.getContext('2d'));
    ink.beginFrame({ scene: 'vector-build' });
    drawFrame(
      ink.ctx,
      {},
      { id: 'vector-build', title: 'Construct each coordinate' },
      { beat, beatP, t: 20, duration: 100, opacity: 1 },
      animation.draw,
    );
    const result = ink.finishFrame();
    assert.deepEqual(result.issues, []);
    assert(result.checkedLabels > 0);
    assert.equal(animation.incidentFrame('vector-build', { beat, beatP }).vectorStep, active);
  }
});
