import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createCanvas } from '@napi-rs/canvas';
import { fileURLToPath } from 'node:url';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { readLesson, frameState } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { loadMeasuredTimeline } from './helpers/measured-narration.mjs';
import * as lesson from '../animations/capstone-production-ml-pipeline.mjs';

test('the restored release and input determine the probe computation', () => {
  const prior = lesson.probeRelease('v0', 9);
  const candidate = lesson.probeRelease('v1', 9);
  assert.equal(prior.release, 'v0');
  assert.equal(prior.transformed, 0.4);
  assert.equal(prior.score, 0);
  assert.equal(prior.warning, false);
  assert(Math.abs(candidate.score - 0.98) < 1e-12);
  assert.equal(candidate.warning, true);
  assert.notEqual(lesson.probeRelease('v1', 0).score, candidate.score);
  assert.equal(lesson.probeRelease('v1', 0).warning, false);
  assert.equal(lesson.probeRelease('v1', null).score, 0.5);
  assert.equal(lesson.probeRelease('v1', null).warning, true);
  assert.notStrictEqual(lesson.loadRelease('v0'), lesson.loadRelease('v0'));
  const replacement = structuredClone(lesson.RETAINED_RELEASES);
  const changed = JSON.parse(replacement.v0.bytes);
  changed.bundle.slope = 1;
  changed.bundle.intercept = 0.2;
  replacement.v0.bytes = JSON.stringify(changed);
  replacement.v0.sha256 = createHash('sha256').update(replacement.v0.bytes).digest('hex');
  assert(Math.abs(lesson.probeRelease('v0', 9, replacement).score - 0.6) < 1e-12);
  assert.equal(lesson.probeRelease('v0', 9, replacement).warning, true);
  assert.equal(lesson.probeRelease('v0', 9).warning, false);
});

test('a changed retained package cannot pass its old checksum', () => {
  const registry = structuredClone(lesson.RETAINED_RELEASES);
  registry.v0.bytes = registry.v0.bytes.replace('"slope":0', '"slope":5');
  assert.throws(() => lesson.loadRelease('v0', registry), /release package checksum mismatch/);
  assert.throws(() => lesson.probeRelease('missing', 9), /unknown retained release/);
});

test('recovery selects the retained package before completing its unchanged-input probe', async () => {
  registerLessonFonts();
  const root = fileURLToPath(new URL('../../', import.meta.url));
  const narration = await readLesson(
    new URL('../lessons/capstone-production-ml-pipeline.lesson.yaml', import.meta.url),
    root,
  );
  const sceneIndex = narration.scenes.findIndex((scene) => scene.id === 'recovery');
  const scene = narration.scenes[sceneIndex];
  const measured = (await loadMeasuredTimeline('capstone-production-ml-pipeline')).scenes[0];
  const timing = {
    ...measured,
    visualCues: resolveSceneCues(scene, measured),
    cueTiming: 'provider-words',
  };
  const packageCue = timing.visualCues.find((cue) => cue.id === 'pipe-result-restored-package');
  const probeCue = timing.visualCues.find((cue) => cue.id === 'pipe-result-restored-probe');
  assert(packageCue && probeCue);
  assert(packageCue.end < probeCue.start, 'the restored package precedes its probe result');
  const canvas = createCanvas(1920, 1080);
  const labelsAt = (time) => {
    const state = frameState(timing, time, sceneIndex, narration.scenes.length);
    const audit = drawFrame(canvas.getContext('2d'), narration, scene, state, lesson.draw);
    return audit.labels.filter((label) => label.alpha > 0.9).map((label) => label.text);
  };
  const assertInputs = (labels) => {
    assert(labels.includes('Same request: delay 9'));
    assert(labels.includes('z = (9 − 5) / 10 = 0.4'));
    assert(labels.includes('slope 0 · intercept 0'));
    assert(labels.includes('slope 1.2 · intercept 0.5'));
  };
  const beforeReload = labelsAt(packageCue.end - 0.001);
  assertInputs(beforeReload);
  assert(
    beforeReload.includes('production → v1'),
    'the old selection persists until reload completes',
  );
  assert(beforeReload.includes('0.5 + 1.2 × 0.4 = 0.98 → WARN'));
  assert(!beforeReload.includes('production → v0'), 'recovery must wait for its complete clause');
  for (const time of [packageCue.end + 0.001, probeCue.end - 0.001]) {
    const pending = labelsAt(time);
    assertInputs(pending);
    assert(pending.includes('production → v0'), 'the loaded previous package must be selected');
    assert(pending.includes('0 + 0 × 0.4 = pending'));
    assert(
      !pending.includes('0 + 0 × 0.4 = 0.00 → SILENT'),
      'the new probe result waits for its own clause',
    );
    assert(
      !pending.includes('0.5 + 1.2 × 0.4 = 0.98 → WARN'),
      'the prior model must not supply the restored probe',
    );
  }
  for (const time of [probeCue.end + 0.001, timing.beats[1].until - 0.01]) {
    const restored = labelsAt(time);
    assertInputs(restored);
    assert(restored.includes('production → v0'));
    assert(restored.includes('0 + 0 × 0.4 = 0.00 → SILENT'));
    assert(!restored.includes('0.5 + 1.2 × 0.4 = 0.98 → WARN'));
  }
});
