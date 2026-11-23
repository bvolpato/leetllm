import { registerLessonFonts } from '../lib/fonts.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { updateCueState, temperatureCueState, LOGITS, UPDATED } from '../animations/softmax.mjs';
import { targetEncodingFrame } from '../animations/feature-engineering.mjs';
import { replayCueFraction, replayGradient } from '../animations/continued-pretraining.mjs';
import { selectorCueSnapshot } from '../animations/test-time-compute.mjs';
import { transferExperiment } from '../animations/decoding.mjs';
import { expiryConstruction } from '../animations/capstone-production-llm-agent.mjs';
import { draw as drawDecisionModels } from '../animations/decision-models-jev-kev.mjs';
import { draw as drawLocalSandbox } from '../animations/local-agent-sandboxing-seatbelt-landlock.mjs';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { fileURLToPath } from 'node:url';
import { readLesson, frameState } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import { loadMeasuredTimeline } from './helpers/measured-narration.mjs';

test('one logit step continues across the explanation and both watch clauses', () => {
  assert.deepEqual(updateCueState(0, 1, 0, 0), updateCueState(1, 0, 0, 0));
  assert.deepEqual(updateCueState(0, 0, 0, 0).logits, LOGITS);
  const start = updateCueState(1, 0, 0, 0),
    gain = updateCueState(1, 0, 1, 0),
    end = updateCueState(1, 0, 1, 1);
  assert.ok(gain.probabilities[1] > start.probabilities[1]);
  assert.ok(end.loss < gain.loss);
  assert.deepEqual(end.logits, UPDATED);
  assert.deepEqual(updateCueState(2, 0, 0, 0), end);
});

test('softmax temperature first illustrates both directions then lowers the mistaken original ranking', () => {
  const low = temperatureCueState(0, 1, 0, 0),
    high = temperatureCueState(0, 1, 1, 0),
    mistake = temperatureCueState(1, 1, 1, 1);
  assert.ok(low.probabilities[0] > high.probabilities[0]);
  assert.deepEqual(high, temperatureCueState(1, 0, 0, 0));
  assert.ok(mistake.probabilities[0] > high.probabilities[0]);
  assert.ok(Math.abs(mistake.temperature - 0.35) < 1e-12);
});

test('held-out target encoding uses allowed labels rather than the singleton answer', () => {
  const initial = targetEncodingFrame(2, 0, 0),
    smoothed = targetEncodingFrame(2, 1, 0),
    heldOut = targetEncodingFrame(2, 1, 1);
  assert.equal(initial.simple, 1);
  assert.equal(smoothed.simple, 0.6875);
  const partial = targetEncodingFrame(2, 0.5, 0);
  assert.equal(partial.simple, (1 + partial.strength * 0.625) / (1 + partial.strength));
  assert.equal(smoothed.showHeldOut, false);
  assert.equal(heldOut.showHeldOut, true);
  assert.deepEqual(
    heldOut.fitting.map((row) => row.id),
    ['T1', 'T3', 'T5', 'T7'],
  );
  assert.ok(heldOut.fitting.every((row) => row.id !== heldOut.heldOutID));
  assert.equal(heldOut.prior, 0.75);
  assert.equal(heldOut.heldOut, 0.75);
});

test('the replay gradient changes during the quarter-share clause and holds through its interpretation', () => {
  assert.equal(replayCueFraction(0, 1), replayCueFraction(1, 0));
  assert.equal(replayGradient(replayCueFraction(1, 0)), -0.5);
  assert.equal(replayGradient(replayCueFraction(1, 1)), -0.25);
  assert.equal(replayCueFraction(2, 0), 0.25);
  assert.equal(replayCueFraction(2, 1), 0.25);
});

test('a conditional-edge experiment finishes before the separately narrated nucleus-threshold change', () => {
  const edgeOnly = transferExperiment(1, 0, {
    'transfer-edge-change': { progress: 1 },
    'transfer-nucleus-experiment': { progress: 0 },
  });
  assert.equal(edgeOnly.soundly, 0.5);
  assert.equal(edgeOnly.threshold, 0.7);
  const both = transferExperiment(1, 0, {
    'transfer-edge-change': { progress: 1 },
    'transfer-nucleus-experiment': { progress: 1 },
  });
  assert.equal(both.soundly, 0.5);
  assert.ok(Math.abs(both.threshold - 0.9) < 1e-12);
  assert.equal(edgeOnly.best.prefix, 'ran');
});

test('extending a stored packet preserves its original review and effects until an explicit digest check', () => {
  const before = expiryConstruction(1, 0, 0),
    partial = expiryConstruction(1, 0.5, 0),
    edited = expiryConstruction(1, 1, 0),
    checked = expiryConstruction(1, 1, 1);
  assert.equal(before.stored.expiresAt, 1300);
  assert.equal(partial.stored.expiresAt, 1800);
  assert.equal(edited.stored.expiresAt, 2300);
  assert.equal(before.storedDigest, before.reviewedDigest);
  assert.notEqual(edited.storedDigest, edited.reviewedDigest);
  assert.equal(edited.reviewedDigest, before.reviewedDigest);
  assert.equal(edited.checked, false);
  assert.equal(checked.outcome, 'BLOCK: packet changed');
  for (const state of [before, partial, edited, checked]) assert.equal(state.effects, 1);
});

test('an overrated candidate enters before its pending selection is committed on the winner clause', () => {
  const staged = selectorCueSnapshot(0, 1, 1, 0),
    moving = selectorCueSnapshot(0, 1, 1, 1);
  assert.equal(staged.rows.length, 3);
  assert.equal(staged.pending, true);
  assert.equal(staged.winner.answer, 44);
  assert.equal(moving.pending, false);
  assert.equal(moving.winner.answer, 48);
  assert.deepEqual(selectorCueSnapshot(1, 0, 0, 0), moving);
});

test('option-removal bar, caption and probability equation share measured and fallback knownness', async () => {
  registerLessonFonts();
  const root = fileURLToPath(new URL('../../', import.meta.url));
  const lesson = await readLesson(
    new URL('../lessons/decision-models-jev-kev.lesson.yaml', import.meta.url),
    root,
  );
  const sceneIndex = lesson.scenes.findIndex((scene) => scene.id === 'options'),
    scene = lesson.scenes[sceneIndex];
  const measured = (await loadMeasuredTimeline('decision-models-jev-kev')).scenes[0];
  const timing = {
    ...measured,
    visualCues: resolveSceneCues(scene, measured),
    cueTiming: 'provider-words',
  };
  const cue = timing.visualCues.find((cue) => cue.id === 'options-b2-2');
  const canvas = createCanvas(1920, 1080),
    ctx = canvas.getContext('2d');
  for (const [time, known, fallback] of [
    [cue.start - 0.04, false, false],
    [24.8, true, false],
    [(cue.start + cue.end) / 2, true, false],
    [cue.end + 0.6, true, false],
    [measured.beats[1].until - 0.1, true, false],
    [measured.beats[1].start + 5.5, false, true],
    [measured.beats[1].start + 6.1, true, true],
  ]) {
    const state = frameState(timing, time, sceneIndex, lesson.scenes.length);
    const audit = drawFrame(
      ctx,
      lesson,
      scene,
      fallback ? { ...state, cues: {} } : state,
      drawDecisionModels,
    );
    const bar = audit.targets.some(
      (target) => target.id === 'renormalized-share' && target.markCounts.shapes > 0,
    );
    assert.equal(bar, known, `the actual native share bar at ${time}s`);
    assert.equal(
      audit.labels.some((label) => label.text === 'After renormalizing · A/B'),
      bar,
      'caption must describe the actually painted share',
    );
    assert.equal(
      audit.labels.some((label) => label.text.startsWith('p_B=e^1/')),
      bar,
      'the probability equation must arrive with its bar',
    );
    assert.equal(
      audit.labels.some((label) => label.text === 'Remaining shares pending'),
      !bar,
    );
    if (bar) assert(audit.labels.some((label) => label.text === '0.269'));
    const pixel = ctx.getImageData(1210, 800, 1, 1).data;
    assert.equal(
      pixel[1] > 100 && pixel[2] > 100,
      known,
      'the right probability must actually be painted in cyan',
    );
    assert.deepEqual(layoutIssues(audit), [], `option-removal geometry at ${time}s`);
  }
});

test('the protected hook replay identifies its boundary before and after the denied write', () => {
  const unsafe = 'Unsafe fixture: writable Git metadata';
  const protectedCaption = 'Protected replay: Git metadata outside writable scope';
  const denied = 'Denied planting → later checkout has no planted hook';
  for (const [beat, beatP, expected] of [
    [0, 0.01, unsafe],
    [0, 1, 'Worker has ended; the file can outlive it'],
    [1, 1, 'Hook executes with the host user’s authority'],
    [2, 0, protectedCaption],
    [2, 0.1, protectedCaption],
    [2, 0.4, denied],
    [2, 1, denied],
  ]) {
    const frame = drawFrame(
      createCanvas(1920, 1080).getContext('2d'),
      {},
      { id: 'hooks', title: 'A writable hook can execute after the sandbox ends' },
      { beat, beatP, t: 1, opacity: 1, duration: 60 },
      drawLocalSandbox,
    );
    assert(
      frame.labels.some((label) => label.text === expected),
      `hook replay caption at beat ${beat}, progress ${beatP}`,
    );
    if (beat === 2) {
      assert(!frame.labels.some((label) => label.text === unsafe));
      assert(!frame.labels.some((label) => label.text === 'Hook file persists'));
    }
    assert.deepEqual(layoutIssues(frame), []);
  }
});
