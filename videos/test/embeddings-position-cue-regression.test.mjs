import { registerLessonFonts } from '../lib/fonts.mjs';
import { loadMeasuredTimeline } from './helpers/measured-narration.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeVector } from 'vizmatic';
import { cosine, draw as drawEmbeddings, RIVER, V } from '../animations/embeddings.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import { frameState, readLesson } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

registerLessonFonts();

async function measuredCue(sceneId, phrase) {
  const lesson = await readLesson(path.join(root, 'videos/lessons/embeddings.lesson.yaml'), root);
  const sceneIndex = lesson.scenes.findIndex((scene) => scene.id === sceneId);
  assert.notEqual(sceneIndex, -1, `embeddings/${sceneId} must exist`);
  const timeline = await loadMeasuredTimeline('embeddings');
  const measured = timeline.scenes.find((scene) => scene.id === sceneId);
  const authored = lesson.scenes[sceneIndex];
  const timing = {
    ...measured,
    visualCues: resolveSceneCues(authored, measured),
    cueTiming: 'provider-words',
  };
  const cue = timing.visualCues.find((item) => item.phrase === phrase);
  assert(cue, `embeddings/${sceneId} must resolve measured phrase: ${phrase}`);
  const time = cue.start + (cue.end - cue.start) / 2;
  return {
    lesson,
    scene: authored,
    state: frameState(timing, time, sceneIndex, lesson.scenes.length),
    cue,
  };
}

function paint(lesson, scene, state) {
  const canvas = createCanvas(1920, 1080);
  return drawFrame(canvas.getContext('2d'), lesson, scene, state, drawEmbeddings);
}

test('the ambiguous bank vector is drawn and focused during its measured geometry phrase', async () => {
  const sample = await measuredCue('geometry', 'Bank begins between the two groups');
  assert.deepEqual(sample.cue.targets, ['geometry-bank-vector']);
  const audit = paint(sample.lesson, sample.scene, sample.state);
  const bank = audit.targets.find((part) => part.id === 'geometry-bank-vector');
  assert(bank, 'the actual bank arrow must be present during the spoken position claim');
  assert(bank.alpha > 0.9);
  assert(bank.marks >= 2, 'the focused bank vector should include its arrow and endpoint marker');

  const [x, y] = normalizeVector(V.bank);
  const unitScale = 460 / 1.2;
  const plotLeft = 210 + (950 - 460) / 2;
  const endpoint = { x: plotLeft + x * unitScale, y: 395 + (1.2 - y) * unitScale };
  assert(endpoint.x >= bank.x && endpoint.x <= bank.x + bank.width);
  assert(endpoint.y >= bank.y && endpoint.y <= bank.y + bank.height);
  assert(cosine(V.bank, V.river) > 0.7 && cosine(V.bank, V.money) > 0.7);
});

test('the river-use claim focuses the two computed river-use comparison charts', async () => {
  const sample = await measuredCue(
    'contrast',
    'The river-bank occurrence is now more aligned with',
  );
  assert.deepEqual(sample.cue.targets, ['contrast-object-distribution-contrast-21']);
  const audit = paint(sample.lesson, sample.scene, sample.state);
  const bars = audit.targets.filter(
    (part) => part.id === 'contrast-object-distribution-contrast-21',
  );
  assert.equal(bars.length, 2, 'both river-clue and money-clue comparison charts must be focused');
  assert(bars.every((part) => part.alpha > 0.9 && part.marks >= 3));

  const riverUseToRiver = cosine(RIVER, V.river).toFixed(3);
  const riverUseToMoney = cosine(RIVER, V.money).toFixed(3);
  assert(Number(riverUseToRiver) > Number(riverUseToMoney));
  assert(audit.labels.some((label) => label.text === riverUseToRiver));
  assert(audit.labels.some((label) => label.text === riverUseToMoney));
});

test('the second lookup copy stays clear of its visible occurrence label throughout transfer', async () => {
  const lesson = await readLesson(path.join(root, 'videos/lessons/embeddings.lesson.yaml'), root);
  const sceneIndex = lesson.scenes.findIndex((scene) => scene.id === 'lookup'),
    scene = lesson.scenes[sceneIndex];
  for (let step = 0; step <= 20; step++) {
    const progress = step / 20;
    const audit = paint(lesson, scene, {
      beat: 1,
      beatP: progress,
      opacity: 1,
      t: 10 + progress * 10,
      duration: 30,
      sceneIndex,
      sceneCount: lesson.scenes.length,
    });
    const label = audit.labels.find((label) => label.text === 'deposit money at bank');
    assert(label?.alpha > 0.9, `The occurrence label must remain readable at ${progress}`);
    assert.deepEqual(layoutIssues(audit), [], `Lookup copy overlaps a label at ${progress}`);
  }
});
