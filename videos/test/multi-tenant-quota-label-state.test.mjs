import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { readLesson } from '../lib/lesson.mjs';
import { drawFrame } from '../lib/scene.mjs';
import * as animation from '../animations/design-multi-tenant-llm-serving-platform.mjs';

const root = new URL('../../', import.meta.url).pathname;
registerLessonFonts();
const lesson = await readLesson(
  root + 'videos/lessons/design-multi-tenant-llm-serving-platform.lesson.yaml',
  root,
);
const scene = lesson.scenes.find((s) => s.id === 'quota');
function paint(beatP, replay = false) {
  const state = {
    beat: 1,
    beatP,
    t: 0,
    opacity: 1,
    cues: {
      'quota-replay-unchanged': {
        phase: replay ? 'after' : 'before',
        progress: replay ? 1 : 0,
        strength: 0,
        reveal: 1,
      },
    },
  };
  const audit = drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    lesson,
    scene,
    state,
    animation.draw,
  );
  return { model: animation.sampleModel('quota', state), labels: audit.labels.map((l) => l.text) };
}

test('a partial quota construction does not claim a completed settlement', () => {
  const { model, labels } = paint(8.4 / 27.098);
  assert(model.transition && model.settled > 0 && model.settled < 420);
  assert.equal(model.available + model.held + model.settled, 1000);
  assert(labels.includes('Settlement construction · committed ledger pending'));
  assert(labels.some((s) => s.includes('CONSTRUCTION · target 420')));
  assert(!labels.some((s) => / · SETTLED$/.test(s)));
});

test('the completed receipt and its replay retain the actual committed ledger', () => {
  const complete = paint(0.9),
    replay = paint(0.9, true);
  assert.deepEqual(
    [complete.model.available, complete.model.held, complete.model.settled],
    [580, 0, 420],
  );
  assert(complete.labels.includes('Available 580 + held 0 + settled 420 = 1,000'));
  assert(complete.labels.some((s) => / · SETTLED$/.test(s)));
  assert(!complete.labels.some((s) => s.includes('committed ledger pending')));
  assert.deepEqual(
    [replay.model.available, replay.model.held, replay.model.settled],
    [580, 0, 420],
  );
  assert(replay.labels.some((s) => s.includes('DUPLICATE · no charge')));
});
