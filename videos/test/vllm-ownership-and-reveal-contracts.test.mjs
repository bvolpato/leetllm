import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readLesson, makeSceneTimeline, frameState } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
const anim = await import(process.env.VLLM_ANIMATION ?? '../animations/deep-dive-vllm.mjs');
const root = process.cwd().endsWith('/videos') ? process.cwd().slice(0, -7) : process.cwd();
const lesson = await readLesson(root + '/videos/lessons/deep-dive-vllm.lesson.yaml', root);
const { createCanvas } = createRequire(root + '/videos/package.json')('@napi-rs/canvas');
registerLessonFonts();
function paint(id, cueId, offset = 1 / 30) {
  const scene = lesson.scenes.find((s) => s.id === id);
  const sounds = scene.beats.map((b, beatIndex) => {
    const words = b.say.trim().split(/\s+/);
    return {
      beatIndex,
      duration: words.length / 2.5,
      words: words.map((text, i) => ({ text, start: i / 2.5, end: (i + 1) / 2.5 - 0.005 })),
    };
  });
  const timeline = makeSceneTimeline(
    scene,
    sounds.map((x) => x.duration),
    30,
  );
  timeline.sounds = sounds;
  timeline.visualCues = resolveSceneCues(scene, timeline, sounds);
  const cue = timeline.visualCues.find((c) => c.id === cueId);
  assert(cue, cueId);
  const state = frameState(
    timeline,
    cue.end + offset,
    lesson.scenes.indexOf(scene),
    lesson.scenes.length,
  );
  const audit = drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    lesson,
    scene,
    state,
    anim.draw,
  );
  assert.deepEqual(audit.issues, []);
  return { labels: audit.labels.map((l) => l.text), state, audit };
}

test('touching a cache hit twice unlinks it once and conserves the allocation head', () => {
  const queue = [42, 18, 67, 5],
    refs = { 42: 0, 18: 0, 67: 0, 5: 0 };
  const a = anim.vvTouchAllocate(queue, refs, 67, false);
  const b = anim.vvTouchAllocate(a.free, a.refs, 67);
  assert.deepEqual(b.free, [18, 5]);
  assert.equal(b.refs[67], 2);
  assert.equal(b.allocated, 42);
  assert.deepEqual(queue, [42, 18, 67, 5]);
  assert.equal(refs[67], 0);
});

test('reverse release prioritizes the uncached tail while another live reference survives', () => {
  const r = anim.vvReleaseRequest({ R1: [12, 73, 90], R2: [12, 41] }, new Set([12, 73, 41]), 'R1');
  assert.deepEqual(r.free, [90, 73]);
  assert.equal(r.refs.get(12), 1);
  assert.equal(r.refs.get(41), 1);
  assert.deepEqual(r.tables, { R2: [12, 41] });
});

test('a completed process count stays inspectable while the next topology is introduced', () => {
  const labels = paint('process-owners', 'vv-process-owners-single-six').labels;
  assert(labels.includes('TP4 / DP1: 1 +1 +4 =6'));
  assert(!labels.some((x) => x.includes('=17')));
});

test('the completed six-match result persists as the seventh matching input arrives', () => {
  const labels = paint('prefix-limit', 'vv-prefix-limit-match-six').labels;
  assert(labels.some((x) => x.includes('shared 6: skip 4 / compute 5')));
  assert(!labels.some((x) => x.includes('shared 8: skip 8')));
  const model = anim.vvState(
    'prefix-limit',
    paint('prefix-limit', 'vv-prefix-limit-apc-step').state,
  );
  assert.equal(model.shared, 6);
  assert.equal(model.skipped, 4);
  assert.equal(model.compute, 5);
});

test('release waits for its operation and removes the corresponding live table entries', () => {
  const start = paint('queue-order', 'vv-queue-order-release-backward', -10).labels;
  assert(start.includes('[12,73,90]'));
  assert(!start.includes('R1 retired'));
  const done = paint('queue-order', 'vv-queue-order-release-backward').labels;
  assert(done.includes('R1 retired'));
  assert(done.includes('[]'));
  assert(done.includes('Slot 41 · refs1 · R2 live'));
});

test('wrong-history failure remains visible until the actual runner load repairs the table', () => {
  assert(paint('runner-contract', 'vv-runner-contract-wrong-history').labels.includes('[12,41]'));
  const before = paint('runner-contract', 'vv-runner-contract-runner-load', -20).labels;
  assert(before.includes('[12,41]'));
  assert(!before.includes('R1 word: stone'));
  assert(
    paint('runner-contract', 'vv-runner-contract-runner-load').labels.includes('R1 word: stone'),
  );
});

test('fresh admission holds both conclusions, then changes the actual tail payload', () => {
  const before = paint('fresh-admission', 'vv-fresh-admission-miss', -4).labels;
  assert(!before.some((x) => /skip\s*0|compute\s*13|→\s*wait|admitted/.test(x)));
  const blocked = paint('fresh-admission', 'vv-fresh-admission-memory-wait').labels;
  assert(blocked.includes('14 inputs fit · 4 blocks >3 free → wait'));
  const repaired = paint('fresh-admission', 'vv-fresh-admission-hit-counts').labels;
  assert(repaired.includes('skip 8 · compute 5'));
  assert(repaired.includes('q8') && repaired.includes('q12'));
  assert(!repaired.includes('tail block0'));
});

test('two diagnostic requests retain their separate operands and completed investigations', () => {
  const labels = paint('source-diagnosis', 'vv-source-diagnosis-queue-trace').labels;
  assert(labels.includes('Input 80 ms'));
  assert(labels.includes('Queue 75 ms'));
  assert(labels.includes('Inspect API input work'));
  assert(labels.includes('Inspect engine admission /scheduling'));
});

test('displayed topology, timing and fresh-capacity quantities follow their stated formulas', () => {
  const before = { phase: 'before', progress: 0 },
    after = { phase: 'after', progress: 1 };
  for (const phase of [before, after]) {
    const s = anim.vvState('process-owners', {
      beat: 1,
      beatP: 0,
      cues: { 'vv-process-owners-parallel-seventeen': phase },
    });
    assert.equal(s.total, s.A + s.D + s.N + Number(s.D > 1));
  }
  const clock = anim.vvState('chunk-clock', { beat: 1, beatP: 0 });
  assert.deepEqual(
    clock.durations,
    anim
      .schedule()
      .slice(0, 2)
      .map((r) => 2 + r.used),
  );
  for (const phase of [before, after]) {
    const s = anim.vvState('fresh-admission', {
      beat: 1,
      beatP: 0,
      cues: { 'vv-fresh-admission-restore-adapter': phase },
    });
    assert.equal(s.skipped + s.compute, 13);
    assert.equal(s.blocks, Math.ceil(s.compute / 4));
    assert.equal(s.used, 1 + s.compute);
  }
});
