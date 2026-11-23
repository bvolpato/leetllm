import test from 'node:test';
import assert from 'node:assert/strict';
import * as m from '../animations/build-gpt-from-scratch-lab.mjs';
const near = (a, b, tolerance = 1e-12) =>
  assert(Math.abs(a - b) < tolerance, `${a} differs from ${b}`);
const cue = (p) => ({ phase: p === 0 ? 'before' : p === 1 ? 'after' : 'during', progress: p });

test('removing an unused tied output row changes the objective and its gradient', () => {
  const full = m.tiedOutput(),
    removed = m.tiedOutput(0);
  assert.deepEqual(full.hidden, [1, 0]);
  near(full.gradientUnused[0], 0.4223187982515182);
  assert.equal(full.gradientUnused[1], 0);
  near(full.probabilities[1], 0.15536240349696362);
  near(removed.probabilities[1], 1 / (Math.E + 1));
  assert(removed.loss < full.loss);
  for (const fraction of [0, 0.2, 0.5, 0.9, 1]) {
    const s = m.tiedOutput(fraction);
    near(
      s.probabilities.reduce((a, b) => a + b, 0),
      1,
    );
  }
});

test('the sampler needs the last successor and never accepts an exclusive-upper-bound start', () => {
  const edge = m.samplerWindow(49, 48);
  assert.equal(edge.exclusiveUpper, 1);
  assert.equal(edge.lastStart, 0);
  assert.deepEqual([edge.input.at(-1), edge.target.at(-1)], [47, 48]);
  assert.throws(() => m.samplerWindow(48, 48));
  for (let start = 0; start < 16; start++) {
    const w = m.samplerWindow(20, 4, start);
    assert.equal(w.target.at(-1), start + 4);
    assert(w.target.at(-1) < 20);
  }
  assert.throws(() => m.samplerWindow(20, 4, 16));
  assert.throws(() => m.samplerWindow(20, 4, -1));
});

test('the categorical draw crosses the retained CDF and reverses the saved ID map', () => {
  const s = m.categoricalFixture(0.5, 0.9);
  near(s.probabilities[0], 0.8807970779778823);
  assert.equal(s.localId, 1);
  assert.equal(s.originalId, 461);
  assert.equal(m.categoricalFixture(0.5, s.cdf[0] - 1e-10).localId, 0);
  assert.equal(m.categoricalFixture(0.5, s.cdf[0]).localId, 1);
  assert.equal(new TextDecoder().decode(Uint8Array.from(s.bytes)), 'ak');
  assert.throws(() => m.categoricalFixture(0));
  assert.throws(() => m.categoricalFixture(0.5, 1));
});

test('whole-byte decoding preserves a split code point while fragment decoding loses it', () => {
  const s = m.bytePieceFixture();
  assert.deepEqual(s.joined, [0xf0, 0x9f, 0x99, 0x82]);
  assert.equal(s.replacementCount, 3);
  assert.equal(s.whole, '🙂');
  assert.equal(s.unicode, 'U+1F642');
  assert(s.strictRejects);
  assert.notEqual(s.separate, s.whole);
});

test('Adam restart keeps the same starting weight but loses moments and bias-correction progress', () => {
  const f = m.adamFork();
  near(f.prefix.weight, 0.8);
  near(f.restored.weight, 0.8142857142857143);
  near(f.reset.weight, 0.9);
  assert.equal(f.restored.step, 3);
  assert.equal(f.reset.step, 1);
  near(f.restored.states[0].mh, -1 / 7);
  near(f.reset.states[0].mh, -1);
  const resumed = m.scalarAdam([-1, 1], f.prefix),
    unbroken = m.scalarAdam([1, 1, -1, 1]);
  near(resumed.weight, unbroken.weight);
});

test('fresh prediction keeps labels fixed, checks the causal prefix, and withholds every answer until its own spoken reveal ends', () => {
  const before = m.localProbe(),
    after = m.localProbe(14);
  assert.deepEqual(after.labels, before.labels);
  for (let query = 0; query < 3; query++) assert.deepEqual(after.rows[query], before.rows[query]);
  assert.notDeepEqual(after.rows[3].logits, before.rows[3].logits);
  for (const p of [0, 0.25, 0.999]) {
    const s = m.transferSnapshot({
      beat: 1,
      cues: {
        'answer-prefix': cue(p),
        'answer-target': cue(p),
        'answer-invariant': cue(p),
        'answer-copy': cue(p),
      },
    });
    assert(!s.prefixRevealed);
    assert(!s.targetRevealed);
    assert(!s.invarianceRevealed);
    assert(!s.copyRevealed);
  }
  const s = m.transferSnapshot({
    beat: 1,
    cues: {
      'answer-prefix': cue(1),
      'answer-target': cue(1),
      'answer-invariant': cue(1),
      'answer-copy': cue(1),
    },
  });
  assert(s.prefixRevealed && s.targetRevealed && s.invarianceRevealed && s.copyRevealed);
  assert.equal(s.delta, 0);
  assert.equal(s.before.rows[2].target, 9);
});

const { createCanvas } = await import('@napi-rs/canvas');
const { readLesson } = await import('../lib/lesson.mjs');
const { drawFrame } = await import('../lib/scene.mjs');
const { registerLessonFonts } = await import('../lib/fonts.mjs');
registerLessonFonts();
const lesson = await readLesson(
  new URL('../lessons/build-gpt-from-scratch-lab.lesson.yaml', import.meta.url).pathname,
  new URL('../..', import.meta.url).pathname,
);
function paintResult(sceneId, beat, id, progress) {
  const scene = lesson.scenes.find((s) => s.id === sceneId),
    cues = Object.fromEntries(
      scene.beats.flatMap((b, i) =>
        (b.visual_cues ?? []).map((q) => [
          q.id,
          {
            ...q,
            phase: i <= beat ? 'after' : 'before',
            progress: i <= beat ? 1 : 0,
            active: false,
            strength: 0,
          },
        ]),
      ),
    );
  cues[id] = {
    phase: progress === 0 ? 'before' : progress === 1 ? 'after' : 'during',
    progress,
    active: false,
    strength: 0,
  };
  return drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    lesson,
    scene,
    { t: 30, duration: 100, opacity: 1, beat, beatP: 0.75, cues },
    m.draw,
  );
}
for (const [scene, beat, id, has] of [
  [
    'corpus-exposure',
    1,
    'sampled-fraction',
    (a) => a.labels.some((l) => l.text.includes('% of training-stream length')),
  ],
  [
    'byte-boundaries',
    1,
    'joined-bytes',
    (a) => a.labels.some((l) => l.text.includes('F0 9F 99 82 → U+1F642')),
  ],
  [
    'compact-denominator',
    0,
    'removed-matrix',
    (a) => a.labels.some((l) => l.text === '65.2% of this matrix removed'),
  ],
  [
    'compact-denominator',
    1,
    'unused-gradient',
    (a) => a.labels.some((l) => l.text.includes('nabla_{W_2}')),
  ],
  ['resume-fork', 1, 'restore-moments', (a) => a.labels.some((l) => l.text.includes('0.8142857'))],
  ['resume-fork', 1, 'reset-moments', (a) => a.labels.some((l) => l.text.includes('0.9000000'))],
  [
    'architecture-choices',
    2,
    'shared-kv',
    (a) => a.labels.some((l) => l.text.includes('50% ideal KV elements')),
  ],
])
  test(`${scene}: ${id} earns its fixed result at the completed clause`, () => {
    for (const p of [0.01, 0.5, 0.999])
      assert.equal(
        has(paintResult(scene, beat, id, p)),
        false,
        'Completed result must remain covered',
      );
    assert.equal(
      has(paintResult(scene, beat, id, 1)),
      true,
      'Completed result must actually appear',
    );
  });
