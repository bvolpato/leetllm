import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCanvas } from '@napi-rs/canvas';
import * as animation from '../animations/perplexity.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import { frameState, makeSceneTimeline, readLesson } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { loadMeasuredTimeline } from './helpers/measured-narration.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

async function intro(scale = 1) {
  const lesson = await readLesson(path.join(root, 'videos/lessons/perplexity.lesson.yaml'), root);
  const sceneIndex = lesson.scenes.findIndex((scene) => scene.id === 'intro');
  const scene = lesson.scenes[sceneIndex];
  const original = (await loadMeasuredTimeline('perplexity')).scenes[0];
  const measured = {
    ...original,
    duration: original.duration * scale,
    frames: Math.round(original.frames * scale),
    beats: original.beats.map((beat) => ({
      ...beat,
      start: beat.start * scale,
      end: beat.end * scale,
      duration: beat.duration * scale,
      until: beat.until * scale,
    })),
    sounds: original.sounds.map((sound) => ({
      ...sound,
      duration: sound.duration * scale,
      words: sound.words.map((word) => ({
        ...word,
        start: word.start * scale,
        end: word.end * scale,
      })),
    })),
  };
  const timing = {
    ...measured,
    visualCues: resolveSceneCues(scene, measured),
    cueTiming: 'provider-words',
  };
  const cue = timing.visualCues.find((cue) => cue.id === 'intro-beat-2-focus-1');
  const canvas = createCanvas(1920, 1080);
  const paint = (time) => {
    const state = frameState(timing, time, sceneIndex, lesson.scenes.length);
    const audit = drawFrame(canvas.getContext('2d'), lesson, scene, state, animation.draw);
    assert.deepEqual(layoutIssues(audit), [], `intro geometry at ${time}s`);
    return {
      audit,
      state,
      labels: audit.labels.filter((label) => label.alpha > 0.25).map((label) => label.text),
    };
  };
  return { cue, paint, timing };
}

test('all named intro targets and their conditional probabilities are painted by the measured clause end and held', async () => {
  const { cue, paint } = await intro();
  for (const time of [cue.end, 33.733333333333334 - 4, cue.end + 0.8, 51.833333333333336 - 4]) {
    const { audit, state, labels } = paint(time);
    assert(labels.includes('mat'), 'the named third target mat must be painted by the clause end');
    for (const text of [
      'P(on | The cat sat) = 0.50',
      'P(the | The cat sat on) = 0.10',
      'P(mat | The cat sat on the) = 0.80',
    ]) {
      assert(labels.includes(text), `${text} must retain its actual preceding prefix`);
    }
    assert(labels.includes('Scored targets: 3'));
    assert(
      audit.targets.some(
        (target) => target.id === 'intro-token-positions' && target.markCounts.labels >= 3,
      ),
    );
    const snapshot = animation.introSnapshot(state.beat, state.beatP, state.cues);
    assert.equal(snapshot.count, 3);
    assert.deepEqual(
      snapshot.targets.map((target) => target.probability),
      [0.5, 0.1, 0.8],
    );
    const mean = animation.meanSnapshot(1, 0.5);
    assert.equal(snapshot.sum, mean.sum);
    assert.equal(snapshot.mean, mean.mean);
    assert.equal(snapshot.perplexity, mean.perplexity);
    assert(
      !labels.some((label) => label.includes('PPL')),
      'exponentiation stays in the later mean scene',
    );
  }
});

test('probability reveals follow provider word windows when speech timing changes', async () => {
  for (const scale of [0.7, 1.4]) {
    const { paint, timing } = await intro(scale);
    const cue = timing.visualCues.find((cue) => cue.id === 'intro-observed-mat');
    const before = paint(cue.end - 0.03 * scale);
    assert(before.labels.includes('Scored targets: 2'));
    assert(!before.labels.includes('P(mat | The cat sat on the) = 0.80'));
    const after = paint(cue.end + 0.03 * scale);
    assert(after.labels.includes('Scored targets: 3'));
    assert(after.labels.includes('P(mat | The cat sat on the) = 0.80'));
  }
});

test('each observed word follows its correct prefix and waits for its measured reveal', async () => {
  const { paint, timing } = await intro();
  const firstCue = timing.visualCues.find((cue) => cue.id === 'intro-observed-on');
  const initial = paint(firstCue.start - 0.05);
  const initialSnapshot = animation.introSnapshot(
    initial.state.beat,
    initial.state.beatP,
    initial.state.cues,
  );
  assert.equal(initialSnapshot.count, 0);
  assert.equal(initialSnapshot.mean, null);
  assert.equal(initialSnapshot.perplexity, null);
  assert(initial.labels.includes('Await the observed word'));
  const beat = timing.beats[1],
    words = timing.sounds[1].words;
  const the = words.find((word) => word.text === 'the' && word.start > 1);
  const mat = words.find((word) => word.text === 'mat');
  for (const [word, count, prefix] of [
    [the, 1, ['The', 'cat', 'sat', 'on']],
    [mat, 2, ['The', 'cat', 'sat', 'on', 'the']],
  ]) {
    const before = paint(beat.start + word.start - 0.05);
    const snapshot = animation.introSnapshot(
      before.state.beat,
      before.state.beatP,
      before.state.cues,
    );
    assert.equal(snapshot.count, count);
    assert.deepEqual(snapshot.prefix, prefix);
    assert(
      !before.labels.includes(
        `P(${word.text} | ${prefix.join(' ')}) = ${count === 1 ? '0.10' : '0.80'}`,
      ),
      'the next target probability must wait while its prefix is inspected',
    );
    const after = paint(beat.start + word.end + 0.05);
    assert(after.labels.includes(`Scored targets: ${count + 1}`));
  }
});

async function lexicalScene(id) {
  const lesson = await readLesson(path.join(root, 'videos/lessons/perplexity.lesson.yaml'), root);
  const index = lesson.scenes.findIndex((scene) => scene.id === id),
    scene = lesson.scenes[index];
  const sounds = scene.beats.map((beat, beatIndex) => {
    const words = beat.say.trim().split(/\s+/);
    return {
      beatIndex,
      duration: words.length / 2.5,
      words: words.map((text, i) => ({ text, start: i / 2.5, end: (i + 1) / 2.5 - 0.005 })),
    };
  });
  const timing = makeSceneTimeline(
    scene,
    sounds.map((sound) => sound.duration),
    30,
  );
  timing.sounds = sounds;
  timing.visualCues = resolveSceneCues(scene, timing, sounds);
  const canvas = createCanvas(1920, 1080);
  return {
    timing,
    labels(time) {
      const audit = drawFrame(
        canvas.getContext('2d'),
        lesson,
        scene,
        frameState(timing, time, index, lesson.scenes.length),
        animation.draw,
      );
      assert.deepEqual(layoutIssues(audit), []);
      return audit.labels.filter((label) => label.alpha > 0.25).map((label) => label.text);
    },
  };
}

test('uniform doubling retains eight choices until the second spoken increment', async () => {
  const { timing, labels } = await lexicalScene('loss-scale');
  const first = timing.visualCues.find((cue) => cue.id === 'double-choice');
  const second = timing.visualCues.find((cue) => cue.id === 'double-again');
  assert(labels(first.end + 0.03).includes('K = 8'));
  assert(!labels(second.start - 0.03).includes('K = 16'));
  assert(labels(second.end + 0.03).includes('K = 16'));
});

test('fresh report preserves its denominators and holds both derived units until their spoken reveals', async () => {
  const report = animation.freshReport();
  assert.equal(report.count, 4);
  assert.equal(report.bytes, 16);
  assert(Math.abs(report.sum - Math.log(100)) < 1e-12);
  assert(Math.abs(report.ppl - Math.sqrt(10)) < 1e-12);
  assert(Math.abs(report.bpb - Math.log2(100) / 16) < 1e-12);
  const { timing, labels } = await lexicalScene('fresh-case');
  for (const [id, answer] of [
    ['fresh-ppl', 'PPL = exp(total / 4) = 3.162'],
    ['fresh-bpb', 'BPB = total / (16 ln2) = 0.415'],
  ]) {
    const cue = timing.visualCues.find((cue) => cue.id === id);
    assert(!labels(cue.start - 0.03).includes(answer));
    assert(labels(cue.end + 0.03).includes(answer));
  }
});

test('causal masking, weighted totals and returned answer fields determine the displayed results', () => {
  assert.equal(
    animation.shiftedTargetCount([
      [-100, 1, 2],
      [-100, -100, 3],
    ]),
    3,
  );
  const report = animation.corpusLoss([
    { loss: 0.2, count: 2 },
    { loss: 2, count: 1 },
  ]);
  assert(Math.abs(report.mean - 0.8) < 1e-12);
  assert.throws(() => animation.corpusLoss([{ loss: 0, count: 0 }]), /positive target count/);
  assert.deepEqual(
    animation.FRESH_ANSWERS.map((row) => animation.answerChecks(row, animation.FRESH_CONTRACT)),
    [
      [true, false, false],
      [true, true, true],
    ],
  );
});
