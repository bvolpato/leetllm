import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateVisualCues,
  resolveSceneCues,
  sampleNarrationCues,
  captionBoundaryTokens,
} from '../lib/narration-cues.mjs';
import { makeSceneTimeline, makeLessonTimeline, frameState } from '../lib/lesson.mjs';

const scene = {
  id: 'line',
  beats: [
    {
      say: 'Move the intercept, then rotate the slope.',
      hold: 1,
      visual_cues: [
        { id: 'lift', phrase: 'Move the intercept', targets: ['line'], color: 'blue' },
        { id: 'rotate', phrase: 'rotate the slope', targets: ['slope'] },
      ],
    },
    {
      say: 'Keep this result.',
      hold: 0.5,
      visual_cues: [{ id: 'keep', phrase: 'Keep this result', targets: ['line'] }],
    },
  ],
};
const words = [
  { text: 'Move', start: 0.1, end: 0.3 },
  { text: 'the intercept', start: 0.35, end: 0.9 },
  { text: 'then', start: 1.1, end: 1.3 },
  { text: 'rotate', start: 1.4, end: 1.7 },
  { text: 'the', start: 1.8, end: 1.9 },
  { text: 'slope', start: 2, end: 2.4 },
];
function measured() {
  const timing = makeSceneTimeline(scene, [3, 2]);
  timing.sounds = [
    { beatIndex: 0, words: structuredClone(words) },
    {
      beatIndex: 1,
      words: [
        { text: 'Keep', start: 0.1, end: 0.4 },
        { text: 'this', start: 0.5, end: 0.8 },
        { text: 'result', start: 1, end: 1.5 },
      ],
    },
  ];
  return timing;
}

test('phrase cues resolve from exact measured provider events, including multi-token events', () => {
  const timing = measured(),
    cues = resolveSceneCues(scene, timing);
  assert.equal(cues[0].start, timing.beats[0].start + 0.1);
  assert.equal(cues[0].end, timing.beats[0].start + 0.9);
  assert.equal(cues[1].start, timing.beats[0].start + 1.4);
  assert.equal(cues[1].end, timing.beats[0].start + 2.4);
  assert.deepEqual(cues[0].targets, ['line']);
  const alternate = structuredClone(scene);
  alternate.beats[0].visual_cues[0].phrase = 'MOVE THE INTERCEPT!';
  assert.equal(resolveSceneCues(alternate, timing)[0].start, cues[0].start);
});

test('caption boundaries reuse unique lexical phrase starts and require an explicit boolean opt-in', () => {
  assert.deepEqual(captionBoundaryTokens(scene), [[], []]);
  const selected = structuredClone(scene);
  selected.beats[0].visual_cues[1].caption_boundary = true;
  selected.beats[1].visual_cues[0].caption_boundary = false;
  assert.deepEqual(captionBoundaryTokens(selected), [[4], []]);
  const timing = measured();
  assert.equal(resolveSceneCues(selected, timing)[1].start, timing.beats[0].start + words[3].start);
  for (const value of ['true', 1, null, 'start', {}]) {
    selected.beats[0].visual_cues[1].caption_boundary = value;
    assert.throws(() => validateVisualCues(selected), /caption_boundary must be a boolean/);
  }
});

test('caption-only answer phrases do not create visual cues', () => {
  const selected = structuredClone(scene);
  selected.beats[0].caption_starts = [selected.beats[0].visual_cues[1].phrase];
  assert.deepEqual(captionBoundaryTokens(selected), [[{ ceilMsAt: 4 }], []]);
  assert.deepEqual(resolveSceneCues(selected, measured()), resolveSceneCues(scene, measured()));
  selected.beats[0].caption_starts = ['missing phrase'];
  assert.throws(() => captionBoundaryTokens(selected), /phrase must match exactly once/);
});

test('unmatched, repeated and duplicate phrases or malformed targets fail before rendering', () => {
  for (const mutation of [
    (value) => {
      value.beats[0].visual_cues[0].phrase = 'missing phrase';
    },
    (value) => {
      value.beats[0].visual_cues[0].phrase = 'the';
    },
    (value) => {
      value.beats[1].visual_cues[0].id = 'lift';
    },
    (value) => {
      value.beats[0].visual_cues[0].targets = [];
    },
    (value) => {
      value.beats[0].visual_cues[0].linger = 9;
    },
    (value) => {
      value.beats[0].visual_cues[0].timestamp = 1;
    },
  ]) {
    const invalid = structuredClone(scene);
    mutation(invalid);
    assert.throws(() => validateVisualCues(invalid));
  }
});

test('missing provider timings and changed provider speech cannot receive guessed cue timing', () => {
  const timing = measured();
  assert.throws(() => resolveSceneCues(scene, timing, []), /measured matching narration/);
  timing.sounds[0].words[0] = { ...words[0], text: 'Change' };
  assert.throws(
    () => resolveSceneCues(scene, timing),
    /Transcript does not match timed word coverage/,
  );
});

test('cue progress ends with speech while held results survive later beats and random sampling', () => {
  const timing = makeLessonTimeline([measured()], 4).scenes[0],
    cue = timing.visualCues[0];
  const late = frameState(timing, timing.beats[1].end, 0, 1).cues.lift;
  assert.equal(late.phase, 'after');
  assert.equal(late.progress, 1);
  assert.equal(late.reveal, 1);
  assert.equal(late.active, false);
  const before = frameState(timing, 0, 0, 1).cues.lift;
  assert.equal(before.phase, 'before');
  assert.equal(before.reveal, 0);
  assert.equal(before.progress, 0);
  const mid = sampleNarrationCues(timing.visualCues, (cue.start + cue.end) / 2).lift;
  assert.equal(mid.phase, 'during');
  assert.equal(mid.active, true);
  assert(Math.abs(mid.progress - 0.5) < 1e-10);
  assert.deepEqual(frameState(timing, timing.beats[1].end, 0, 1).cues.lift, late);
  assert.equal(timing.start, 4);
  assert.equal(cue.start, 0.5);
});
