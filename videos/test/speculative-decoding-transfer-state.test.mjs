import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { draw, transferSnapshot } from '../animations/speculative-decoding.mjs';
import { readLesson, frameState } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import { loadMeasuredTimeline } from './helpers/measured-narration.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
registerLessonFonts();

const cueIds = [
  'rejection-ratio',
  'discard-dependent',
  'positive-deficit',
  'normalize-residual',
  'sample-correction',
  'trim-provisional-kv',
  'forward-nearby',
];
const before = { phase: 'before', progress: 0 };
const after = { phase: 'after', progress: 1 };
const cues = (overrides) => Object.fromEntries(cueIds.map((id) => [id, overrides?.[id] ?? before]));

async function fixture() {
  const lesson = await readLesson(
    path.join(root, 'videos/lessons/speculative-decoding.lesson.yaml'),
    root,
  );
  const scene = lesson.scenes.find((item) => item.id === 'transfer');
  const paint = (beat, cueOverrides = {}) =>
    drawFrame(
      createCanvas(1920, 1080).getContext('2d'),
      lesson,
      scene,
      { beat, beatP: 0.5, p: 0.5, t: 1, duration: 2, opacity: 1, cues: cues(cueOverrides) },
      draw,
    );
  return paint;
}

test('the rejection applies the same prefix probabilities and leaves one residual correction', () => {
  const waiting = transferSnapshot(1, 0.9, cues());
  assert.equal(waiting.rejected, false);
  const rejected = transferSnapshot(
    1,
    0.9,
    cues({
      'rejection-ratio': after,
      'discard-dependent': after,
      'positive-deficit': after,
      'sample-correction': after,
    }),
  );
  assert.equal(rejected.acceptance, 0.5);
  assert.equal(rejected.draw, 0.8);
  assert.equal(rejected.rejected, true);
  assert.equal(rejected.discarded, true);
  assert.deepEqual(rejected.deficit, [0, 0.3, 0]);
  assert.deepEqual(rejected.residual, [0, 1, 0]);
  assert.equal(rejected.deficitVisible, true);
  assert.equal(rejected.residualProgress, 0);
  assert.equal(rejected.correction, 'nearby');
});

test('rejection cleanup removes provisional suffix state before forwarding nearby', async () => {
  const pending = transferSnapshot(2, 0.9, cues({ 'sample-correction': after }));
  assert.deepEqual(pending.retainedKV, ['sang', 'softly', 'today']);
  assert.deepEqual(pending.pending, ['nearby']);
  assert.throws(
    () =>
      transferSnapshot(
        2,
        0.9,
        cues({
          'forward-nearby': after,
        }),
      ),
    /forwarded only after/,
  );

  const trimmed = transferSnapshot(
    2,
    0.9,
    cues({
      'sample-correction': after,
      'trim-provisional-kv': after,
    }),
  );
  assert.deepEqual(trimmed.retainedKV, ['sang']);
  assert.deepEqual(trimmed.pending, ['nearby']);
  const forwarded = transferSnapshot(
    2,
    0.9,
    cues({
      'sample-correction': after,
      'trim-provisional-kv': after,
      'forward-nearby': after,
    }),
  );
  assert.deepEqual(forwarded.cache, ['sang', 'nearby']);
  assert.deepEqual(forwarded.pending, []);
});

test('the rendered ending distinguishes prediction, rejection, KV trim, and corrected cache state', async () => {
  const paint = await fixture();
  const prediction = paint(0);
  assert(prediction.labels.some((label) => label.text.includes('Predict the acceptance result')));

  const calculationPending = paint(1);
  const pendingText = calculationPending.labels.map((label) => label.text);
  assert(!pendingText.some((text) => text.startsWith('α = min')));
  assert(!pendingText.includes('0.30'));

  const ratioShown = paint(1, { 'rejection-ratio': after });
  const ratioText = ratioShown.labels.map((label) => label.text);
  assert(ratioText.some((text) => text.startsWith('α = min')));
  assert(!ratioText.includes('0.30'), 'the positive-deficit value waits for its spoken cue');

  const deficitShown = paint(1, { 'positive-deficit': after });
  const deficitText = deficitShown.labels.map((label) => label.text);
  assert(deficitText.includes('Positive deficit max(p - q, 0)'));
  assert(deficitText.includes('0.30'));
  assert(!deficitText.includes('Normalized residual r'));

  const residualShown = paint(1, { 'positive-deficit': after, 'normalize-residual': after });
  const residualText = residualShown.labels.map((label) => label.text);
  assert(residualText.includes('Normalized residual r'));
  assert(residualText.includes('1.00'));

  const rejection = paint(1, {
    'rejection-ratio': after,
    'discard-dependent': after,
    'positive-deficit': after,
    'normalize-residual': after,
    'sample-correction': after,
  });
  const rejectionText = rejection.labels.map((label) => label.text);
  assert(rejectionText.includes('u = 0.80 > 0.50 · reject softly; discard today'));
  assert(rejectionText.includes('Residual sample: nearby'));

  const trimmed = paint(2, { 'trim-provisional-kv': after });
  const trimmedText = trimmed.labels.map((label) => label.text);
  assert(trimmedText.includes('removed: softly'));
  assert(trimmedText.includes('removed: today'));
  assert(trimmedText.includes('Retain KV: sang'));

  const forwarded = paint(2, { 'trim-provisional-kv': after, 'forward-nearby': after });
  const forwardedText = forwarded.labels.map((label) => label.text);
  assert(forwardedText.includes('KV ready: sang + nearby'));
  assert(
    forwardedText.includes('Forward nearby on the corrected prefix · next decode can read it'),
  );
});

test('the cleanup label and each suffix state track before, during, and after the trim cue', async () => {
  const paint = await fixture();
  const before = paint(2, { 'trim-provisional-kv': { phase: 'before', progress: 0 } }).labels.map(
    (label) => label.text,
  );
  assert(before.includes('Target verification state before rejection cleanup'));
  assert(before.includes('softly'));
  assert(before.includes('today'));
  assert(!before.some((text) => text.startsWith('removed:')));

  const duringFirst = paint(2, {
    'trim-provisional-kv': { phase: 'during', progress: 0.25 },
  }).labels.map((label) => label.text);
  assert(duringFirst.includes('Removing rejected suffix KV'));
  assert(duringFirst.includes('removing: softly'));
  assert(duringFirst.includes('today'));
  assert(!duringFirst.includes('Target verification state after rejection cleanup'));

  const duringSecond = paint(2, {
    'trim-provisional-kv': { phase: 'during', progress: 0.75 },
  }).labels.map((label) => label.text);
  assert(duringSecond.includes('removed: softly'));
  assert(duringSecond.includes('removing: today'));

  const after = paint(2, { 'trim-provisional-kv': { phase: 'after', progress: 1 } }).labels.map(
    (label) => label.text,
  );
  assert(after.includes('Target verification state after rejection cleanup'));
  assert(after.includes('removed: softly'));
  assert(after.includes('removed: today'));
  assert(after.includes('Retain KV: sang'));
});

test('measured ratio focus waits for the later discard cue to reveal the rejection result', async () => {
  const lesson = await readLesson(
    path.join(root, 'videos/lessons/speculative-decoding.lesson.yaml'),
    root,
  );
  const sceneIndex = lesson.scenes.findIndex((scene) => scene.id === 'transfer');
  const scene = lesson.scenes[sceneIndex];
  const measured = (await loadMeasuredTimeline('speculative-decoding')).scenes.find(
    (entry) => entry.id === 'transfer',
  );
  const timing = {
    ...measured,
    visualCues: resolveSceneCues(scene, measured),
    cueTiming: 'provider-words',
  };
  const ratio = timing.visualCues.find((cue) => cue.id === 'rejection-ratio');
  const discard = timing.visualCues.find((cue) => cue.id === 'discard-dependent');
  assert(ratio.start >= timing.beats[1].start, 'ratio words must belong to the answer beat');
  const canvas = createCanvas(1920, 1080),
    ctx = canvas.getContext('2d');
  const paint = (time) => {
    const state = frameState(timing, time, sceneIndex, lesson.scenes.length);
    const audit = drawFrame(ctx, lesson, scene, state, draw);
    assert.deepEqual(layoutIssues(audit), [], `native geometry at ${time}s`);
    const pixels = ctx.getImageData(240, 894, 1440, 44).data;
    let resultInk = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      const [r, g, b] = pixels.subarray(i, i + 3);
      if (r > 40 && r > g * 1.15 && b > g * 1.12) resultInk++;
    }
    return { audit, resultInk };
  };
  const resultText = 'u = 0.80 > 0.50 · reject softly; discard today';
  for (const time of [
    timing.beats[1].start - 1 / 30,
    ratio.start - 1 / 30,
    ratio.start + 0.25 * (ratio.end - ratio.start),
    (ratio.start + ratio.end) / 2,
    ratio.end,
    ratio.end + ratio.linger,
    discard.start - 1 / 30,
  ]) {
    const { audit, resultInk } = paint(time);
    if (time >= ratio.start + 0.25 * (ratio.end - ratio.start))
      assert(audit.labels.some((label) => label.text.startsWith('α = min') && label.alpha > 0.25));
    assert(!audit.labels.some((label) => label.text === resultText));
    assert.equal(
      resultInk,
      0,
      'the later rejection result must not be painted during the ratio explanation',
    );
  }
  for (const time of [
    discard.start + 1 / 30,
    (discard.start + discard.end) / 2,
    discard.end,
    discard.end + discard.linger,
  ]) {
    const { audit, resultInk } = paint(time);
    assert(audit.labels.some((label) => label.text === resultText && label.alpha > 0.25));
    assert(
      resultInk > 100,
      'the rejection result remains painted during and after its discard cue',
    );
  }
});
