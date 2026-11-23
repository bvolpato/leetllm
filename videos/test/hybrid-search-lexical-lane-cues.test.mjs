import { registerLessonFonts } from '../lib/fonts.mjs';
import { loadMeasuredTimeline } from './helpers/measured-narration.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { draw as drawHybridSearch, validateModel } from '../animations/hybrid-search.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { frameState, readLesson } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

registerLessonFonts();

const normalizeWord = (value) => value.toLowerCase().replace(/[^a-z0-9]/g, '');
async function measuredPhrase(phrase, beatIndex) {
  const lesson = await readLesson(
    path.join(root, 'videos/lessons/hybrid-search.lesson.yaml'),
    root,
  );
  const sceneIndex = lesson.scenes.findIndex((scene) => scene.id === 'lexical-lane');
  assert.notEqual(sceneIndex, -1);
  const timeline = await loadMeasuredTimeline('hybrid-search');
  const measured = timeline.scenes.find((scene) => scene.id === 'lexical-lane');
  const authored = lesson.scenes[sceneIndex];
  const timing = {
    ...measured,
    visualCues: resolveSceneCues(authored, measured),
    cueTiming: 'provider-words',
  };
  const cue = timing.visualCues.find((item) => item.phrase === phrase);
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
    cue,
    time,
    start,
    end,
  };
}

function paint(lesson, scene, state) {
  const canvas = createCanvas(1920, 1080);
  return drawFrame(canvas.getContext('2d'), lesson, scene, state, drawHybridSearch);
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

test('the tomato posting phrase shows and focuses its exact query term and matching record', async () => {
  validateModel();
  const sample = await measuredPhrase('Searching for tomato activates its posting list', 0);
  assert.equal(sample.state.beat, 0);
  const audit = paint(sample.lesson, sample.scene, sample.state);
  assert(targetHasLabel(audit, 'lexical-query', 'tomato'), 'the query card must show tomato');
  assert(
    targetHasLabel(audit, 'indexed-term', 'tomato'),
    'the index card must show the tomato posting term',
  );
  assert(
    targetHasLabel(audit, 'matched-book', 'Garden guide'),
    'the tomato posting list must identify its matching book',
  );
  assert(
    targetHasLabel(audit, 'passage-tokens', 'tomato'),
    'the matched passage tokens must contain tomato',
  );
  assert.equal(
    audit.connectors.length,
    2,
    'the query should link to its indexed term and posted book',
  );
  assert(sample.cue, 'the posting-list phrase must use measured provider-word timing');
  assert.deepEqual(sample.cue.targets, [
    'lexical-query',
    'indexed-term',
    'matched-book',
    'passage-tokens',
  ]);
});

test('the later rare-code clause switches the lexical lane to G-14', async () => {
  const sample = await measuredPhrase('A rare catalog code can be especially useful', 1);
  assert.equal(sample.state.beat, 1);
  const audit = paint(sample.lesson, sample.scene, sample.state);
  assert(targetHasLabel(audit, 'lexical-query', 'G-14'));
  assert(targetHasLabel(audit, 'indexed-term', 'g-14'));
  assert(targetHasLabel(audit, 'matched-book', 'Garden guide'));
  assert(targetHasLabel(audit, 'passage-tokens', 'G-14'));
  assert.equal(
    audit.connectors.length,
    2,
    'the exact code should resolve through the index to the same book',
  );
  assert(sample.cue, 'the rare-code clause must use measured provider-word timing');
  assert.deepEqual(sample.cue.targets, [
    'lexical-query',
    'indexed-term',
    'matched-book',
    'passage-tokens',
  ]);
});

test('the later paraphrase miss still shows no exact overlap', async () => {
  const sample = await measuredPhrase(
    'growing tomatoes while a passage says raising tomato plants',
    2,
  );
  assert.equal(sample.state.beat, 2);
  const audit = paint(sample.lesson, sample.scene, sample.state);
  assert(targetHasLabel(audit, 'lexical-query', 'growing tomatoes'));
  assert(audit.labels.some((label) => label.text === 'No exact overlap' && label.alpha > 0.4));
  assert(targetHasLabel(audit, 'passage-tokens', 'raising'));
  assert(targetHasLabel(audit, 'passage-tokens', 'tomato'));
  assert(targetHasLabel(audit, 'passage-tokens', 'plants'));
  assert.equal(
    audit.connectors.length,
    1,
    'the unmatched paraphrase should not route from its term to the book',
  );
  assert(sample.cue, 'the existing paraphrase-miss cue must remain bound to provider words');
});
