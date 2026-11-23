import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as stage from 'vizmatic/stage';
import { readLesson } from '../lib/lesson.mjs';
import {
  compileStageLesson,
  estimatedTimeline,
  sceneWindows,
  stageLesson,
  stageOpeningHasPicture,
} from '../lib/stage-lesson.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const { fadeIn, text } = stage;
const source = resolve(here, '..'),
  root = resolve(source, '..'),
  directory = join(source, 'stage-lessons');

const small = {
  id: 'small',
  title: 'Small',
  source: 'small.md',
  scenes: [
    {
      id: 'only',
      title: 'Only',
      visual: 'One word.',
      beats: [
        {
          say: 'Look at this word on the screen.',
          hold: 0.3,
          visual_cues: [{ id: 'word', phrase: 'this word', targets: ['word'], color: 'yellow' }],
        },
      ],
    },
  ],
};
const timelineOf = (lesson) => estimatedTimeline(lesson, 30);

test('Stage opening inspection checks the first visible frame even if an object moves later', async () => {
  const lesson = {
    ...small,
    scenes: [{ ...small.scenes[0], beats: [{ say: 'Follow the square across the picture.' }] }],
  };
  const timing = timelineOf(lesson);
  const make = async (start) => {
    const film = stageLesson((s) => {
      const square = stage.rect(80, 80).fill('red');
      s.at(start, () => {
        s.add(square);
        s.play(stage.shift(square, 100, 0), { duration: 0.2 });
      });
    });
    return (await compileStageLesson(film, lesson, timing)).compiled;
  };
  assert.equal(stageOpeningHasPicture(await make(0)), true);
  assert.equal(stageOpeningHasPicture(await make(0.5)), false);
});

test('a film that uses its cue compiles to the length of its narration', async () => {
  const timeline = timelineOf(small);
  const film = stageLesson((s, n) => {
    const scene = n.scene('only'),
      word = text('word').at(0, 0);
    scene.on('word', () => s.play(fadeIn(word), { duration: 0.2 }));
  });
  const { compiled, duration } = await compileStageLesson(film, small, timeline);
  assert.equal(duration, timeline.duration);
  assert.equal(compiled.duration, timeline.duration);
});

test('a cue that drives nothing stops the compile', async () => {
  const film = stageLesson(() => {});
  await assert.rejects(
    compileStageLesson(film, small, timelineOf(small)),
    /cues drive nothing.*only\/word/,
  );
});

test('a film that outlasts its narration stops the compile', async () => {
  const timeline = timelineOf(small);
  const film = stageLesson((s, n) => {
    const scene = n.scene('only'),
      word = text('word').at(0, 0);
    scene.on('word', () => s.play(fadeIn(word), { duration: timeline.duration + 5 }));
  });
  await assert.rejects(compileStageLesson(film, small, timeline), /past its narration/);
});

test('scene windows run end to end from the start of the film', () => {
  const timeline = {
    scenes: [
      { id: 'a', start: 4, duration: 10 },
      { id: 'b', start: 14, duration: 5 },
    ],
  };
  assert.deepEqual(sceneWindows(timeline), [
    { id: 'a', from: 0, to: 10 },
    { id: 'b', from: 10, to: 15 },
  ]);
});

const lessons = (await readdir(directory)).filter((file) => file.endsWith('.lesson.yaml'));

for (const file of lessons) {
  const id = file.slice(0, -'.lesson.yaml'.length);
  const needsNarratedRuntime = existsSync(join(directory, id, 'index.mjs'));
  const skip =
    needsNarratedRuntime && typeof stage.narrated !== 'function'
      ? 'The development runtime job compiles this rebuilt film.'
      : false;
  test(`${file} compiles on its narration and draws the same frame twice`, { skip }, async () => {
    const lesson = await readLesson(join(directory, file), root);
    const { default: film } = await import(
      pathToFileURL(join(directory, `${lesson.id}.film.mjs`)).href
    );
    const timeline = timelineOf(lesson);
    const first = await compileStageLesson(film, lesson, timeline),
      second = await compileStageLesson(film, lesson, timeline);
    assert.equal(first.duration, timeline.duration);
    const windows = sceneWindows(timeline);
    assert.equal(windows.at(-1).to, timeline.duration);
    for (const window of windows) {
      const time = (window.from + window.to) / 2;
      assert.equal(first.compiled.svg(time), second.compiled.svg(time), `${window.id} at ${time}`);
    }
  });
}

test('the space audit measures the largest empty rectangle, not the total empty area', async () => {
  const { largestEmptyShare } = await import('../audit-stage-space.mjs');
  assert.equal(largestEmptyShare([false, false, false, false], 2, 2), 1);
  assert.equal(largestEmptyShare([true, false, false, true], 2, 2), 0.25);
  assert.equal(largestEmptyShare([true, true, false, false], 2, 2), 0.5);
});
