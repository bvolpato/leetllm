import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { fileURLToPath } from 'node:url';
import {
  stablePolicy,
  retainedPolicy,
  speculativeMass,
  widerBeamTrace,
  freshPolicyFrame,
  greedyPolicyFrame,
  thoughtTraversal,
  enumByteTrace,
  draw,
} from '../animations/beam-search.mjs';
import { readLesson } from '../lib/lesson.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';

const near = (a, b) => assert(Math.abs(a - b) < 1e-12, `${a} differs from ${b}`);

test('shifted scores preserve probabilities while direct log values survive ordinary underflow', () => {
  const a = stablePolicy([1000, 999, 998]),
    b = stablePolicy([0, -1, -2]);
  a.probabilities.forEach((p, i) => near(p, b.probabilities[i]));
  const tiny = stablePolicy([0, -1000]);
  assert.equal(tiny.probabilities[1], 0);
  assert.equal(tiny.logProbabilities[1], -1000);
  const ties = stablePolicy([2, 2, 0, -Infinity], 0.001);
  assert.deepEqual(ties.probabilities, [0.5, 0.5, 0, 0]);
  for (const logits of [[], [-Infinity, -Infinity], [0, NaN], [0, Infinity]])
    assert.throws(() => stablePolicy(logits));
});

test('positive temperature preserves ranking and grows fixed-row entropy without reviving a mask', () => {
  let previous = -Infinity;
  for (const temperature of [0.02, 0.1, 0.5, 1, 2, 10, 100]) {
    const row = stablePolicy([3, 2.5, 1, -Infinity], temperature);
    assert(row.entropy >= previous);
    assert(
      row.probabilities[0] >= row.probabilities[1] && row.probabilities[1] >= row.probabilities[2],
    );
    assert.equal(row.probabilities[3], 0);
    previous = row.entropy;
  }
});

test('the rank, cumulative crossing and inclusive relative cutoffs have distinct boundary contracts', () => {
  const row = [0.5, 0.25, 0.25, 0];
  assert.deepEqual(retainedPolicy(row, 'k', 2).indices, [0, 1]);
  assert.deepEqual(retainedPolicy(row, 'p', 0.75).indices, [0, 1]);
  assert.deepEqual(retainedPolicy(row, 'p', 1).indices, [0, 1, 2]);
  assert.deepEqual(retainedPolicy(row, 'min-p', 0.5).indices, [0, 1, 2]);
  assert.deepEqual(retainedPolicy(row, 'min-p', 1).indices, [0]);
  assert.deepEqual(retainedPolicy([0.4, 0.4, 0.2], 'min-p', 1).indices, [0, 1]);
  assert.throws(() => retainedPolicy(row, 'k', 0));
  assert.throws(() => retainedPolicy([0, 0], 'p', 0.9));
});

test('renormalization between operators changes the final retained set', () => {
  const row = [0.6, 0.25, 0.15];
  const kThenP = retainedPolicy(retainedPolicy(row, 'k', 2).probabilities, 'p', 0.7);
  const pThenK = retainedPolicy(retainedPolicy(row, 'p', 0.7).probabilities, 'k', 2);
  assert.deepEqual(kThenP.indices, [0]);
  assert.deepEqual(pThenK.indices, [0, 1]);
  near(pThenK.probabilities[0], 0.6 / 0.85);
});

test('greedy retains the actual executed second score row and appends its period after the spoken choice', () => {
  const state = (beat, progress) => ({
    beat,
    cues: { [`greedy-loop-build-${beat}`]: { progress } },
  });
  assert.deepEqual(greedyPolicyFrame(state(0, 0)).prefix, []);
  const second = greedyPolicyFrame(state(0, 1));
  assert.deepEqual(second.prefix, ['create']);
  assert.deepEqual(second.logits, [4, 1.5, 0.5]);
  assert.deepEqual(second.labels, ['period', 'then', 'after']);
  assert.deepEqual(greedyPolicyFrame(state(1, 0.99)).prefix, ['create']);
  const end = greedyPolicyFrame(state(1, 1));
  assert.deepEqual(end.prefix, ['create', '.']);
  assert.deepEqual(end.probabilities, stablePolicy([4, 1.5, 0.5]).probabilities);
});

test('breadth queue and depth stack retain distinct pending states at the same expansion budget', () => {
  assert.deepEqual(thoughtTraversal('breadth', 3), {
    current: 2,
    visited: [0, 1, 2],
    frontier: [3, 4, 5, 6],
  });
  assert.deepEqual(thoughtTraversal('depth', 3), {
    current: 3,
    visited: [0, 1, 3],
    frontier: [4, 2],
  });
  assert.deepEqual(thoughtTraversal('depth', 5).visited, [0, 1, 3, 4, 2]);
});

test('enum matching consumes the actual token bytes and permits EOS only after the closing brace', () => {
  const token = 'create"}';
  for (let count = 0; count < token.length; count++) {
    const trace = enumByteTrace(token, count);
    assert.equal(trace.rejected, false);
    assert.equal(trace.eosAllowed, false);
    assert.equal(trace.scanned.length, count);
  }
  const complete = enumByteTrace(token);
  assert.equal(complete.complete, true);
  assert.equal(complete.eosAllowed, true);
  const unfinished = enumByteTrace('re');
  assert.equal(unfinished.tokenInspected, true);
  assert.equal(unfinished.eosAllowed, false);
  for (const invalid of ['quota"}', 'voke"}']) {
    const trace = enumByteTrace(invalid);
    assert.equal(trace.rejected, true);
    assert.equal(trace.eosAllowed, false);
    assert.deepEqual(trace.scanned, [invalid[0]]);
    assert.equal(trace.rejectionIndex, 0);
  }
  assert.throws(() => enumByteTrace('créate'));
});

test('a wider frontier displaces the eventual winner in the actual shared three-step tree', () => {
  const narrow = widerBeamTrace(2),
    wider = widerBeamTrace(3);
  assert.deepEqual(
    narrow.history[1].active.map((r) => r.tokens.join('')),
    ['A1', 'A2'],
  );
  assert.deepEqual(
    wider.history[1].active.map((r) => r.tokens.join('')),
    ['A1', 'C1', 'C2'],
  );
  assert.equal(narrow.winner.tokens.join(''), 'A2win');
  near(narrow.winner.probability, 0.09);
  near(wider.winner.probability, 0.04);
});

test('accepted speculative mass plus its normalized residual restores fresh target distributions', () => {
  for (const [target, draft] of [
    [
      [0.6, 0.3, 0.1],
      [0.8, 0.1, 0.1],
    ],
    [
      [0.5, 0.3, 0.2],
      [0.7, 0.2, 0.1],
    ],
    [
      [0.2, 0.8, 0],
      [0.2, 0.8, 0],
    ],
    [
      [1, 0],
      [0, 1],
    ],
  ]) {
    const result = speculativeMass(target, draft);
    result.restored.forEach((p, i) => near(p, target[i]));
    near(result.accepted.reduce((a, b) => a + b, 0) + result.rejected, 1);
    if (result.rejected)
      near(
        result.correction.reduce((a, b) => a + b, 0),
        1,
      );
    else assert(result.correction.every((p) => p === 0));
  }
  const result = speculativeMass([0.6, 0.3, 0.1], [0.8, 0.1, 0.1]);
  result.wrongRedraw.forEach((p, i) => near(p, [0.72, 0.16, 0.12][i]));
});

test('fresh guide outcomes remain withheld through the supplied prediction and change only after eligibility repair', () => {
  const cue = (beat, progress) => ({
    beat,
    beatP: 0.8,
    cues: { [`fresh-policy-build-${beat}`]: { progress } },
  });
  for (const progress of [0, 0.25, 0.999, 1])
    assert.equal(freshPolicyFrame(cue(0, progress)).selected, null);
  assert.equal(freshPolicyFrame(cue(1, 0.999)).selected, null);
  assert.equal(freshPolicyFrame(cue(1, 1)).selected, 'rotate');
  assert.equal(freshPolicyFrame(cue(2, 0.999)).repaired, false);
  const repaired = freshPolicyFrame(cue(2, 1));
  assert.equal(repaired.selected, 'backup');
  assert.equal(repaired.repaired, true);
  near(repaired.filtered.mass, 0.78);
});

test('native prediction frames paint the original input and withhold the selected-answer slot until its cue completes', async () => {
  registerLessonFonts();
  const root = fileURLToPath(new URL('../../', import.meta.url));
  const lesson = await readLesson(
    new URL('../lessons/beam-search.lesson.yaml', import.meta.url),
    root,
  );
  const scene = lesson.scenes.find((s) => s.id === 'fresh-policy'),
    canvas = createCanvas(1920, 1080);
  for (const [beat, progress, answer] of [
    [0, 1, null],
    [1, 0.5, null],
    [1, 1, 'rotate'],
    [2, 0.5, null],
    [2, 1, 'backup'],
  ]) {
    const audit = drawFrame(
      canvas.getContext('2d'),
      lesson,
      scene,
      {
        beat,
        beatP: 0.8,
        opacity: 1,
        cues: {
          [`fresh-policy-build-${beat}`]: {
            progress,
            phase: progress === 1 ? 'after' : 'before',
            active: false,
            strength: 0,
            targets: [],
          },
        },
      },
      draw,
    );
    assert.deepEqual(layoutIssues(audit), [], `${beat}/${progress} geometry`);
    const selected = audit.labels.filter(
      (l) => l.y > 830 && l.y < 930 && ['backup', 'rotate'].includes(l.text),
    );
    assert.deepEqual(
      selected.map((l) => l.text),
      answer ? [answer] : [],
    );
  }
});
