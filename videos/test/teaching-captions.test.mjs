import assert from 'node:assert/strict';
import test from 'node:test';
import { teachingCaptions } from '../lib/teaching-captions.mjs';

test('a measured picture cue holds its answer even within one short sentence', () => {
  const say = 'Choose the route: review wins.';
  const words = ['Choose', 'the', 'route', 'review', 'wins'].map((text, i) => ({
    text,
    start: 0.1111 + i * 0.3,
    end: 0.26 + i * 0.3,
  }));
  const scene = {
    id: 'threshold',
    start: 8,
    beats: [
      {
        say,
        start: 0.4,
        visual_cues: [{ id: 'winner', phrase: 'review wins', targets: ['picture'] }],
      },
    ],
    sounds: [{ words }],
  };
  const captions = teachingCaptions(scene);
  assert.deepEqual(
    captions.map((cue) => cue.text),
    ['Choose the route:', 'review wins.'],
  );
  assert.ok(captions[1].start >= 8.4 + words[3].start);
});

test('a long sentence wraps into measured short phrases without losing text', () => {
  const terms =
    'A request starts at the desk and moves to the next state when evidence arrives.'.split(' ');
  const scene = {
    id: 'episode',
    start: 0,
    beats: [{ start: 0, say: terms.join(' ') }],
    sounds: [{ words: terms.map((text, i) => ({ text, start: i, end: i + 0.6 })) }],
  };
  const captions = teachingCaptions(scene);
  assert.equal(captions.map((c) => c.text).join(' '), terms.join(' '));
  assert.ok(captions.every((c) => c.end - c.start <= 4.5));
});

test('keeps the final two words together without moving a one-word reveal', () => {
  const say = 'Plan ahead for comparing several slices. Why?';
  const words = say.split(' ').map((text, i) => ({ text, start: i, end: i + 0.4 }));
  const scene = {
    id: 'sample',
    start: 0,
    beats: [{ start: 0, say, caption_starts: ['Why'] }],
    sounds: [{ words }],
  };
  assert.deepEqual(
    teachingCaptions(scene).map(({ text, start }) => [text, start]),
    [
      ['Plan ahead for comparing', 0],
      ['several slices.', 4],
      ['Why?', 6],
    ],
  );
});
