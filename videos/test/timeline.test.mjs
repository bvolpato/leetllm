import test from 'node:test';
import assert from 'node:assert/strict';
import { lessonIntro } from '../lib/brand.mjs';
import {
  makeSceneTimeline,
  estimateCanvasScene,
  makeLessonTimeline,
  frameState,
  wordCaptions,
  timestamp,
  srt,
  vtt,
} from '../lib/lesson.mjs';

const scene = {
  id: 'example',
  beats: [
    { say: 'First explanation.', hold: 0.5 },
    { say: 'Second explanation.', hold: 0.2 },
  ],
};

test('the signed brand intro starts both lesson formats on the same frame and caption clock', () => {
  const first = makeSceneTimeline({ id: 'first', beats: [{ say: 'First.', hold: 0.5 }] }, [2]);
  first.sounds = [{ words: [{ text: 'First', start: 0.1, end: 1.8 }] }];
  const second = makeSceneTimeline({ id: 'second', beats: [{ say: 'Second.', hold: 0.5 }] }, [3]);
  second.sounds = [{ words: [{ text: 'Second', start: 0.2, end: 2.7 }] }];
  const original = makeLessonTimeline([first, second]);
  for (const lesson of [{}, { opening: 'lesson' }]) {
    const intro = lessonIntro(lesson, 30);
    assert.equal(intro.frames, 120);
    const branded = makeLessonTimeline([first, second], intro.duration);
    assert.equal(branded.scenes[0].start, 4);
    assert.equal(branded.scenes[1].start, first.duration + 4);
    assert.equal(branded.duration, original.duration + 4);
    for (const [index, cue] of branded.captions.entries()) {
      assert.ok(Math.abs(cue.start - original.captions[index].start - 4) < 1e-10);
      assert.ok(Math.abs(cue.end - original.captions[index].end - 4) < 1e-10);
      assert.equal(cue.text, original.captions[index].text);
    }
  }
  assert.equal(first.start, undefined);
});

test('scene timing preserves real speech, pauses, and whole frames', () => {
  const timeline = makeSceneTimeline(scene, [2.13, 3.07], 30);
  assert.equal(timeline.beats[0].start, 0.4);
  assert.equal(timeline.beats[0].end, 2.53);
  assert.equal(timeline.beats[1].start, 3.03);
  assert.ok(Math.abs(timeline.beats[1].end - 6.1) < 1e-10);
  assert.ok(timeline.duration >= 6.6);
  assert.ok(timeline.duration - 6.6 < 1 / 30);
  assert.equal(timeline.frames / 30, timeline.duration);
});

test('beat transitions follow audio including inter-beat holds', () => {
  const timeline = makeSceneTimeline(scene, [2, 3]);
  assert.equal(frameState(timeline, 2.8, 1, 4).beat, 0);
  assert.equal(frameState(timeline, 2.91, 1, 4).beat, 1);
  assert.equal(frameState(timeline, 0, 1, 4).beatP, 0);
  assert.equal(frameState(timeline, timeline.duration, 1, 4).beatP, 1);
  assert.equal(frameState(timeline, timeline.duration, 1, 4).p, 1);
});

test('Canvas validation samples cross a spoken phrase without audio', () => {
  const timing = estimateCanvasScene(
    {
      id: 'precision',
      beats: [
        {
          say: 'Start with stored values then switch the multiply input.',
          visual_cues: [
            { id: 'tf32-storage', phrase: 'switch the multiply input', targets: ['input'] },
          ],
        },
      ],
    },
    30,
  );
  const [beat] = timing.beats;
  const sample = (progress) =>
    frameState(timing, beat.start + (beat.until - beat.start) * progress, 0, 1);
  assert.equal(sample(0.02).cues['tf32-storage'].phase, 'before');
  assert.equal(sample(0.75).cues['tf32-storage'].phase, 'during');
  assert.equal(sample(0.98).cues['tf32-storage'].phase, 'after');
  assert.equal(sample(0.98).cueTiming, 'estimated-words');
});

test('invalid audio cannot silently produce an empty scene', () => {
  for (const duration of [0, -1, NaN, undefined])
    assert.throws(() => makeSceneTimeline(scene, [duration, 1]), /Invalid audio duration/);
});

test('word captions retain measured word offsets and sentence breaks', () => {
  const result = wordCaptions(
    [
      { text: 'A', start: 0.1, end: 0.3 },
      { text: 'slope.', start: 0.4, end: 0.9 },
      { text: 'Move', start: 1.2, end: 1.5 },
      { text: 'down.', start: 1.6, end: 2 },
    ],
    12.5,
  );
  assert.deepEqual(result, [
    { start: 12.6, end: 13.4, text: 'A slope.' },
    { start: 13.7, end: 14.5, text: 'Move down.' },
  ]);
});

test('subtitle grouping stays short and rejects backward boundaries', () => {
  const words = Array.from({ length: 20 }, (_, i) => ({
    text: 'gradient',
    start: i * 0.5,
    end: i * 0.5 + 0.4,
  }));
  const result = wordCaptions(words);
  assert.ok(result.length >= 3);
  assert.ok(result.every((c) => c.text.length <= 76 && c.end - c.start <= 4.5));
  assert.throws(() => wordCaptions([{ text: 'bad', start: 2, end: 1 }]), /Invalid word boundary/);
});

test('sidecar captions restore script punctuation without guessing changed speech', () => {
  const words = [
    { text: 'A', start: 0.1, end: 0.3 },
    { text: 'slope', start: 0.4, end: 0.9 },
    { text: 'Move', start: 1.2, end: 1.5 },
    { text: 'down', start: 1.6, end: 2 },
  ];
  assert.deepEqual(
    wordCaptions(words, 0, 'A slope. Move down!').map((c) => c.text),
    ['A slope.', 'Move down!'],
  );
  assert.equal(wordCaptions(words, 0, 'Different words.')[0].text, 'A slope Move down');
  assert.equal(words[1].text, 'slope');
});

test('subtitle timestamp rounding carries into minutes without invalid milliseconds', () => {
  assert.equal(timestamp(59.9996), '00:01:00,000');
  assert.equal(timestamp(3661.1234, '.'), '01:01:01.123');
  const captions = [{ start: 1.1, end: 2.2, text: 'A real cue.' }];
  assert.equal(srt(captions), '1\n00:00:01,100 --> 00:00:02,200\nA real cue.\n');
  assert.equal(vtt(captions), 'WEBVTT\n\n00:00:01.100 --> 00:00:02.200\nA real cue.\n');
});
