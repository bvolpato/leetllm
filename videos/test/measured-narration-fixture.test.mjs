import test from 'node:test';
import assert from 'node:assert/strict';
import { timelineFromMeasuredFixture } from './helpers/measured-narration.mjs';

const say = 'Move the blue circle to the right.';
const fixture = {
  lessonId: 'example',
  scenes: [
    {
      id: 'move',
      beats: [{ say, start: 0.4, duration: 2 }],
      sounds: [
        {
          duration: 2,
          words: ['Move', 'the', 'blue', 'circle', 'to', 'the', 'right'].map((text, i) => [
            text,
            i / 4,
            (i + 1) / 4,
          ]),
        },
      ],
    },
  ],
};
const lesson = { scenes: [{ id: 'move', beats: [{ say }] }] };

test('matched narration retains measured word times without changing the fixture', () => {
  const before = structuredClone(fixture);
  const timeline = timelineFromMeasuredFixture(fixture, lesson);
  assert.deepEqual(timeline.scenes[0].sounds[0].words[2], { text: 'blue', start: 0.5, end: 0.75 });
  assert.deepEqual(fixture, before);
});

test('changed narration is rejected even when its cue phrase still matches', () => {
  const changed = structuredClone(lesson);
  changed.scenes[0].beats[0].say = 'Move the red circle to the right.';
  assert.throws(
    () => timelineFromMeasuredFixture(fixture, changed),
    /Stale measured narration.*example\/move.*beat 1/,
  );
  assert.throws(
    () => timelineFromMeasuredFixture(fixture, { scenes: [] }),
    /Missing authored scene.*example\/move/,
  );
});

test('a measured scene cannot omit a newly authored beat', () => {
  const extended = structuredClone(lesson);
  extended.scenes[0].beats.push({ say: 'Now move it upward.' });
  assert.throws(
    () => timelineFromMeasuredFixture(fixture, extended),
    /Stale measured narration.*example\/move.*beat count/,
  );
});
