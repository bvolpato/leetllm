import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import * as model from '../animations/language-modeling.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';

registerLessonFonts();
const near = (a, b) => assert(Math.abs(a - b) < 1e-10, `${a} versus ${b}`);
const cue = (progress = 0, during = false) => ({
  progress,
  phase: during ? 'during' : progress === 0 ? 'before' : 'after',
  active: false,
  strength: 0,
  targets: [],
});
function frame(id, beat, cues = {}, beatP = 0.99) {
  const canvas = createCanvas(1920, 1080),
    ctx = canvas.getContext('2d');
  const audit = drawFrame(
    ctx,
    {},
    { id, title: 'One More Word' },
    { beat, beatP, t: 10, duration: 20, opacity: 1, cues, cueTiming: 'provider-words' },
    model.draw,
  );
  assert.deepEqual([...(audit.issues ?? []), ...layoutIssues(audit)], [], id);
  return { audit, ctx, labels: audit.labels.map((l) => l.text) };
}

test('one supplied conditional model scores the same factors used by the lesson', () => {
  assert.equal(model.validateModel(), true);
  const words = ['The', 'cat', 'sat', 'end'];
  let prefix = 'start',
    probability = 1;
  words.forEach((word, i) => {
    const row = model.conditionalDistribution(prefix);
    near(
      row.reduce((a, b) => a + b.probability, 0),
      1,
    );
    const p = row.find((item) => item.token === word).probability;
    assert.equal(p, model.TARGET_PROBS[i]);
    probability *= p;
    prefix = i === 0 ? word : prefix + ' ' + word;
  });
  near(probability, 0.2304);
  assert.equal(model.selectSample('The cat', 0.75), 'slept');
  assert.equal(model.selectSample('The cat slept', 0.95), 'end');
  near(Math.exp(-4 * model.LOSS), probability);
});

test('the selected token arrives before the new prediction row and preserves the existing prefix', () => {
  const pending = { 'intro-append': cue(), 'intro-next': cue() };
  const before = frame('intro', 2, pending);
  const during = frame('intro', 2, { ...pending, 'intro-append': cue(0.5, true) });
  const after = frame('intro', 2, { 'intro-append': cue(1), 'intro-next': cue(1) });
  for (const painted of [before, during, after]) {
    assert(painted.labels.includes('The'));
    assert(painted.labels.includes('cat'));
  }
  assert(during.labels.includes('P(next | The cat)'));
  assert(!during.labels.includes('P(next | The cat sat)'));
  assert(after.labels.includes('P(next | The cat sat)'));
  assert(after.labels.includes('end'));
  assert(after.labels.includes('0.80'));
  const y = (a) => a.audit.targets.find((t) => t.id === 'intro-selected-token').y;
  assert(
    y(before) > y(during) && y(during) > y(after),
    'the selected card must travel into its reserved prefix slot',
  );
});

test('observations arrive individually and smoothing conserves the complete three-output mass', () => {
  const cues = Object.fromEntries(
    ['count-first', 'count-second', 'count-third'].map((id) => [id, cue()]),
  );
  assert.equal(model.countState(0, 0.99, cues).observed, 0);
  cues['count-first'] = cue(1);
  assert.deepEqual(model.countState(0, 0.99, cues).values, [1, 0, 0]);
  cues['count-second'] = cue(1);
  assert.deepEqual(model.countState(0, 0.99, cues).values, [2, 0, 0]);
  cues['count-third'] = cue(1);
  assert.deepEqual(model.countState(0, 0.99, cues).values, [2, 1, 0]);
  for (const alpha of [0, 0.25, 0.5, 1]) {
    const state = model.countState(2, 0.99, { 'count-smooth': cue(alpha, alpha > 0 && alpha < 1) });
    near(
      state.values.reduce((a, b) => a + b, 0),
      1,
    );
    near(state.values[2], alpha / (3 + 3 * alpha));
    frame('counts', 2, { 'count-smooth': cue(alpha) });
  }
});

test('teacher forcing blocks the future input while a loss mask preserves the earlier input words', () => {
  const cues = { 'teacher-loss-mask': cue(1), 'teacher-block': cue(1) };
  const state = model.teacherForcingState(2, 0.99, cues);
  assert.deepEqual(state.prefix, ['start', 'The', 'cat']);
  assert.deepEqual(state.scored, [false, false, true, true]);
  assert.equal(state.blocked, true);
  const painted = frame('teacher-forcing', 2, cues);
  assert.equal(painted.labels.filter((text) => text === 'loss ignored').length, 2);
  assert(painted.labels.includes('The'));
  assert(painted.labels.includes('cat'));
  assert(painted.labels.includes('Future read blocked'));
  const pixel = painted.ctx.getImageData(1300, 600, 1, 1).data;
  assert(pixel[0] > 150 && pixel[2] > 100, 'the causal gate must paint real blocking geometry');
});

test('negative-log construction precedes mean and perplexity, and resegmentation preserves the string score', () => {
  const early = model.lossConstructionState(0, 0.99, {
    'loss-terms': cue(0.3, true),
    'loss-mean': cue(),
  });
  assert(
    early.progressByTerm[0] === 1 && early.progressByTerm[1] > 0 && early.progressByTerm[1] < 1,
  );
  assert.equal(early.meanReady, false);
  assert.equal(early.perplexityReady, false);
  assert(
    frame('loss', 0, { 'loss-terms': cue(0.3, true), 'loss-mean': cue() }).labels.includes(
      'Mean NLL: pending',
    ),
  );
  const split = model.lossConstructionState(2, 0.99, { 'loss-resegment': cue(1) });
  near(
    split.probabilities.reduce((a, b) => a * b, 1),
    0.2304,
  );
  assert.equal(split.probabilities.length, 5);
  near(split.splitMean * 5, split.mean * 4);
  assert(split.splitPerplexity < split.perplexity);
  frame('loss', 2, { 'loss-resegment': cue(1) });
});

test('the dog exercise withholds its shifted targets, then resolves the actual target loss before generating', () => {
  const before = frame('transfer', 0);
  assert.equal(
    before.labels.filter((l) => l === '?').length,
    4,
    'the learner must receive a covered target row',
  );
  assert(before.labels.includes('Which words may this position read?'));
  const answerCues = {
    'transfer-targets': cue(1),
    'transfer-context': cue(1),
    'transfer-loss': cue(1),
  };
  const answer = frame('transfer', 1, answerCues);
  assert(answer.labels.includes('Read start + The + dog'));
  assert(answer.labels.includes('Observed slept · p = 0.30 · −log(p) ≈ 1.204 nats'));
  assert.equal(model.transferState(1, 0.99, answerCues).target, 'slept');
  const generated = frame('transfer', 2, { 'transfer-generate': cue(1), 'transfer-end': cue(1) });
  assert(generated.labels.includes('The dog slept'));
  assert(generated.labels.includes('ate'));
  assert(generated.labels.includes('end selected · stopped'));
  assert(generated.labels.includes('Record: slept · output: ate'));
});

test('a rebuilt distribution waits for its own sample instead of displaying the next draw early', () => {
  const waiting = frame('generation', 0, {
    'generation-sample': cue(1),
    'generation-append': cue(1),
    'generation-next': cue(1),
    'generation-stop': cue(),
  });
  assert(waiting.labels.includes('P(next | The cat slept)'));
  assert(waiting.labels.includes('Sample pending'));
  assert(!waiting.labels.includes('Fixed sample u = 0.95'));
  assert.equal(waiting.audit.shapes.filter((s) => s.kind === 'circle' && s.y === 730).length, 0);
  const revealed = frame('generation', 1, { 'generation-stop': cue(0.5, true) });
  assert(revealed.labels.includes('Fixed sample u = 0.95'));
  assert(!revealed.labels.includes('Selected end · output: The cat slept'));
  const held = frame('generation', 1, { 'generation-stop': cue(1) });
  assert(held.labels.includes('Selected end · output: The cat slept'));
});
