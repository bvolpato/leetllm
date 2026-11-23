import assert from 'node:assert/strict';
import test from 'node:test';
import { recordedTimeline } from '../tools/lib/stage-rebuild.mjs';

test('an edited cue follows the recorded words and a changed sentence requires new speech', () => {
  const beat = {
    say: 'Read the key.',
    visual_cues: [{ id: 'read', phrase: 'the key', targets: ['key'] }],
  };
  const lesson = { id: 'cache', scenes: [{ id: 'read', beats: [beat] }] };
  const recorded = {
    id: 'cache',
    fps: 30,
    provider: 'edge',
    intro: { duration: 4 },
    scenes: [
      {
        id: 'read',
        beats: [{ say: beat.say }],
        sounds: [
          {
            beatIndex: 0,
            duration: 3,
            words: [
              { text: 'Read', start: 0.1, end: 0.4 },
              { text: 'the', start: 1.8, end: 2 },
              { text: 'key.', start: 2.1, end: 2.6 },
            ],
          },
        ],
      },
    ],
  };
  const [scene] = recordedTimeline(lesson, recorded).scenes;
  assert.equal(scene.start, 4);
  assert.equal(scene.visualCues[0].start, scene.beats[0].start + 1.8);
  assert.equal(scene.visualCues[0].end, scene.beats[0].start + 2.6);
  beat.say = 'Read the value.';
  assert.throws(() => recordedTimeline(lesson, recorded), /recording does not match/);
});
