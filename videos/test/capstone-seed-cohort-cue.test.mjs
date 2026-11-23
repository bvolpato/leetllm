import { registerLessonFonts } from '../lib/fonts.mjs';
import { loadMeasuredTimeline } from './helpers/measured-narration.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  draw as drawCapstone,
  sampleModel,
  validateModel,
} from '../animations/capstone-reproducible-research-study.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { frameState, readLesson } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

registerLessonFonts();

const normalizeWord = (value) => value.toLowerCase().replace(/[^a-z0-9]/g, '');
async function measuredPhrase(phrase, { beatIndex = 0, atEnd = false } = {}) {
  const lesson = await readLesson(
    path.join(root, 'videos/lessons/capstone-reproducible-research-study.lesson.yaml'),
    root,
  );
  const sceneIndex = lesson.scenes.findIndex((scene) => scene.id === 'seeds');
  assert.notEqual(sceneIndex, -1);
  const timeline = await loadMeasuredTimeline('capstone-reproducible-research-study');
  const measured = timeline.scenes.find((scene) => scene.id === 'seeds');
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
  const time = atEnd ? end : start + (end - start) / 2;
  return {
    lesson,
    scene: authored,
    state: frameState(timing, time, sceneIndex, lesson.scenes.length),
    cue: timing.visualCues.find((item) => item.phrase === phrase),
    time,
    start,
    end,
  };
}

function paint(lesson, scene, state) {
  const canvas = createCanvas(1920, 1080);
  return drawFrame(canvas.getContext('2d'), lesson, scene, state, drawCapstone);
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

test('all 24 seed pairs are plotted before the five-regression clause and highlighted with its tally', async () => {
  validateModel();
  const cohortEnd = await measuredPhrase('every seed pair', { atEnd: true });
  assert.equal(cohortEnd.cue?.id, 'seed-cohort-complete');
  assert.equal(
    sampleModel(cohortEnd.state).n,
    24,
    'all pairs must be visible by the end of the all-pairs phrase',
  );
  const cohortAudit = paint(cohortEnd.lesson, cohortEnd.scene, cohortEnd.state);
  assert.equal(
    cohortAudit.targets.find((part) => part.id === 'seed-difference-points')?.markCounts.shapes,
    24,
  );
  assert(
    targetHasLabel(
      cohortAudit,
      'seed-difference-tally',
      'Shown pairs 24/24 · regressions 5 · mean 0.143',
    ),
  );

  const regression = await measuredPhrase('five pairs favor sparse reward');
  assert.equal(regression.state.beat, 0);
  const sample = sampleModel(regression.state);
  assert.equal(sample.n, 24);
  assert.equal(regression.cue?.id, 'seeds-seed-difference-points-b1-1');
  assert.deepEqual(regression.cue.targets, [
    'seed-difference-points',
    'seed-difference-negative-points',
    'seed-difference-tally',
  ]);

  const audit = paint(regression.lesson, regression.scene, regression.state);
  assert.equal(
    audit.targets.find((part) => part.id === 'seed-difference-points')?.markCounts.shapes,
    24,
  );
  assert.equal(
    audit.targets.find((part) => part.id === 'seed-difference-negative-points')?.markCounts.shapes,
    5,
  );
  assert(
    targetHasLabel(
      audit,
      'seed-difference-tally',
      'Shown pairs 24/24 · regressions 5 · mean 0.143',
    ),
  );
});

test('the complete cohort and five-regression tally remain visible through the recap', async () => {
  const recap = await measuredPhrase('gives us something a smooth average curve would hide');
  const sample = sampleModel(recap.state);
  assert.equal(sample.n, 24);
  const audit = paint(recap.lesson, recap.scene, recap.state);
  assert.equal(
    audit.targets.find((part) => part.id === 'seed-difference-points')?.markCounts.shapes,
    24,
  );
  assert.equal(
    audit.targets.find((part) => part.id === 'seed-difference-negative-points')?.markCounts.shapes,
    5,
  );
  assert(
    targetHasLabel(
      audit,
      'seed-difference-tally',
      'Shown pairs 24/24 · regressions 5 · mean 0.143',
    ),
  );
});
