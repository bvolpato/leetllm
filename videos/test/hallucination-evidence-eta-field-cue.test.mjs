import { registerLessonFonts } from '../lib/fonts.mjs';
import { loadMeasuredTimeline } from './helpers/measured-narration.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { draw as drawEvidence, validateModel } from '../animations/hallucination-evidence.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { frameState, readLesson } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

registerLessonFonts();

const normalizeWord = (value) => value.toLowerCase().replace(/[^a-z0-9]/g, '');
async function measuredPhrase(phrase, beatIndex) {
  const lesson = await readLesson(
    path.join(root, 'videos/lessons/hallucination-evidence.lesson.yaml'),
    root,
  );
  const sceneIndex = lesson.scenes.findIndex((scene) => scene.id === 'evidence-version');
  assert.notEqual(sceneIndex, -1);
  const timeline = await loadMeasuredTimeline('hallucination-evidence');
  const measured = timeline.scenes.find((scene) => scene.id === 'evidence-version');
  const authored = lesson.scenes[sceneIndex];
  const timing = {
    ...measured,
    visualCues: resolveSceneCues(authored, measured),
    cueTiming: 'provider-words',
  };
  const targetWords = phrase.match(/[a-z0-9]+/gi).map(normalizeWord);
  const words = measured.sounds[beatIndex].words;
  const wordIndex = words.findIndex((word, start) =>
    targetWords.every(
      (target, offset) =>
        words[start + offset] && normalizeWord(words[start + offset].text) === target,
    ),
  );
  assert.notEqual(wordIndex, -1, `the measured words must contain: ${phrase}`);
  const start = measured.beats[beatIndex].start + words[wordIndex].start;
  const end = measured.beats[beatIndex].start + words[wordIndex + targetWords.length - 1].end;
  const time = start + (end - start) / 2;
  return {
    lesson,
    scene: authored,
    state: frameState(timing, time, sceneIndex, lesson.scenes.length),
    cue: timing.visualCues.find((item) => item.phrase === phrase),
    time,
  };
}

function paint(lesson, scene, state) {
  const canvas = createCanvas(1920, 1080);
  return drawFrame(canvas.getContext('2d'), lesson, scene, state, drawEvidence);
}

function targetHasLabel(audit, targetId, text) {
  const parts = audit.targets.filter((part) => part.id === targetId && part.alpha > 0.9);
  return audit.labels.some(
    (label) =>
      label.text === text &&
      parts.some(
        (part) =>
          label.x >= part.x &&
          label.x <= part.x + part.width &&
          label.y >= part.y &&
          label.y <= part.y + part.height,
      ),
  );
}

test('the measured missing-ETA phrase shows the absent field beside the unsupported draft claim', async () => {
  validateModel();
  const sample = await measuredPhrase('no recovery field exists', 1);
  assert.equal(sample.state.beat, 1);
  assert(sample.cue, 'the ETA phrase must remain aligned to measured provider words');
  const audit = paint(sample.lesson, sample.scene, sample.state);
  assert(targetHasLabel(audit, 'recovery-field-absent', 'recovery ETA · ABSENT'));
  assert(targetHasLabel(audit, 'draft-eta-claim', 'recovery ETA = 14:30 UTC'));
  assert(targetHasLabel(audit, 'field-check', 'recovery ETA'));
  assert(targetHasLabel(audit, 'source-version', 'runbook-feed/2026-05-27T10:00:00Z'));
});

test('the neighboring status comparison still displays investigating versus resolved', async () => {
  const sample = await measuredPhrase('compare the requested field and value', 0);
  assert.equal(sample.state.beat, 0);
  const audit = paint(sample.lesson, sample.scene, sample.state);
  assert(targetHasLabel(audit, 'record-status', 'status = investigating'));
  assert(targetHasLabel(audit, 'draft-status', 'status = resolved'));
});
